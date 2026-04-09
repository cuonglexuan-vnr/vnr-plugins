# Backend Permission System

## 1. Overview

VNR.Solution uses a **three-layer permission model**:

| Layer | What it controls | Enforcement point |
|-------|-----------------|-------------------|
| **Screen Permission** | Access to UI screens / menus | Client-side visibility (driven by server-returned `PrivilegeNumber`) |
| **Control/Action Permission** | Access to specific API actions (create, delete, approve, …) | `[CheckAccess]` / `[CheckAccessBaseCRUD]` filter on controller action |
| **Data Permission** | Which rows a user can read or write | `permissionKey` parameter on `IGenericRepository` methods |

All three layers share the same **bitwise privilege model** and the same **Redis-cached role-permission store**.

---

## 2. Privilege Model

### `PrivilegeType` Enum
**File:** `Src/Cores/VNR.Core.Domain/Enums/PrivilegeEnum.cs`

```csharp
[Flags]
public enum PrivilegeType
{
    None           = 0,
    View           = 1 << 0,   // 1
    Create         = 1 << 1,   // 2
    Modify         = 1 << 2,   // 4
    Delete         = 1 << 3,   // 8
    Approve        = 1 << 4,   // 16
    Detail         = 1 << 5,   // 32
    Attach         = 1 << 6,   // 64
    Import         = 1 << 7,   // 128
    Template       = 1 << 8,   // 256
    ExportTemplate = 1 << 9,   // 512
    CreateTemplate = 1 << 10,  // 1024
    Export         = 1 << 11,  // 2048
    Chart          = 1 << 12,  // 4096
    ChangeColumn   = 1 << 13,  // 8192
    Print          = 1 << 14,  // 16384
}
```

`[Flags]` means a single `int` (`PrivilegeNumber`) stored in the DB can represent multiple privileges combined with bitwise OR. A permission check is:

```csharp
(storedPrivilegeNumber & (int)requiredPrivilege) == (int)requiredPrivilege
```

---

## 3. Core Domain Entities

### `Sys_Permission`
**File:** `Src/Cores/VNR.Core.Domain/Entities/System/Sys_Permission.cs`

Defines a named permission entry linked to a feature.

| Field | Type | Description |
|-------|------|-------------|
| `Id` | `string` | Primary key |
| `Name` | `string (255)` | Display name |
| `PermissionKey` | `string (100)` | Key used in attribute and repository checks (e.g. `HRM_HRE_CONTRACT`) |
| `FeatureId` | `string` | FK → `Sys_Feature` |
| `Category` | `string (100)` | Module/phân hệ category |
| `ScreenName` | `string (255)` | Human-readable screen label |
| `IsUsed` | `bool` | Active flag |

### `Sys_RolePermission`
**File:** `Src/Cores/VNR.Core.Domain/Entities/System/Sys_RolePermission.cs`

Maps a role to a permission with a combined privilege bitmask.

| Field | Type | Description |
|-------|------|-------------|
| `PermissionId` | `string` | FK → `Sys_Permission` |
| `RoleId` | `string` | FK → `Sys_Role` |
| `PermissionKey` | `string (100)` | Denormalized key for fast lookup |
| `PrivilegeNumber` | `int` | Bitwise combination of `PrivilegeType` flags |

### `Sys_Feature`
Feature catalog; each `Sys_Permission` belongs to one feature. Has the same `PermissionKey` / `Category` / `ScreenName` shape.

### `Sys_Role` / `Sys_UserRole`
`Sys_Role` extends `IdentityRole<string>` (ASP.NET Core Identity). `Sys_UserRole` extends `IdentityUserRole<string>` and maps users to roles.

---

## 4. User Context

### `IUserContext`
**File:** `Src/Infrastructure/VNR.Infrastructure.Security/Contexts/IUserContext.cs`

Injected into filters and services to read the current caller's identity.

| Property | Type | Description |
|----------|------|-------------|
| `ID` | `string` | User ID (from `hrm_user_id` claim) |
| `ProfileId` | `Guid` | Profile ID (from `hrm_profile_id` claim) |
| `UserLogin` | `string` | Login username |
| `Email` | `string` | Email |
| `IsSuperAdmin` | `string` | `"true"` / `"false"` — superadmin bypass flag |
| `UserRoles` | `IEnumerable<string>` | Role IDs assigned to this user |
| `TenantCode` | `string` | Tenant/organization code |
| `LangCode` | `string` | Language code (default `"vi-VN"`) |
| `Claims` | `IEnumerable<Claim>` | All JWT claims |

### JWT Claim Keys
**File:** `Src/Infrastructure/VNR.Infrastructure.Security/Constants/UserClaims.cs`

| Constant | Claim key |
|----------|-----------|
| `ClaimUserId` | `hrm_user_id` |
| `ClaimProfileID` | `hrm_profile_id` |
| `ClaimLoginUserName` | `hrm_username` |
| `ClaimIsSuperAdmin` | `hrm_is_super_admin` |
| `ClaimUserRoles` | `hrm_user_roles` |
| `ClaimTenantCode` | `hrm_tenant_code` |
| `ClaimLanguageCode` | `hrm_lang_code` |
| `ClaimTypeUser` | `hrm_type_user` |

---

## 5. Screen & Action Permission (Control Permission)

### How It Works

1. Admin assigns `PrivilegeNumber` to a `Sys_RolePermission` row for a given `PermissionKey`.
2. All role-permission mappings are pre-loaded into **Redis** on first use.
3. On every API request, the filter reads the user's role IDs from `IUserContext.UserRoles`, looks up each role's hash in Redis, and checks the bitmask.
4. If the user is `IsSuperAdmin == "true"`, all checks return `true` immediately.

### Redis Cache Structure

```
Key:   "RolePermission:{roleId}"
Type:  Hash
Field: permissionKey → privilegeNumber (int)

Key:   "RolePermission:all"
Type:  String (count of roles, expiry 15 days)
```

Cache is warm-started by calling `ICheckPermissonService.CacheRolePermission()` (all role-permissions loaded at once). Cache is lazily refreshed if `"RolePermission:all"` key is absent.

---

### `ICheckPermissonService`
**File:** `Src/Infrastructure/VNR.Infrastructure.Permission/Interface/ICheckPermissonService.cs`

```csharp
public interface ICheckPermissonService
{
    Task<bool> CheckPermissonForKey(string keyPermisson, PrivilegeType privilege = PrivilegeType.View);
    Task<bool> CheckPermissonForKey(string keyPermisson, int privilege);
    Task<List<PermissonModel>> GetPermissonsForUserAsync();
    Task<IQueryable<Sys_RolePermission>> GetAllRolePermission();
    Task<bool> CacheRolePermission();
    Task<List<PermissonModel>> GetPermissonsForSuperadmin();
}
```

**`CheckPermissonForKey` logic (in `CheckPermissonService`):**

```
1. If IsSuperAdmin == "true"  →  return true
2. Ensure "RolePermission:all" exists in Redis (warm cache if missing)
3. For each roleId in IUserContext.UserRoles:
       cacheValue = Redis.HashGet("RolePermission:{roleId}", permissionKey)
       if (cacheValue & requiredPrivilege) == requiredPrivilege  →  return true
4. return false
```

**`GetPermissonsForUserAsync`** aggregates permissions across all user roles using bitwise OR for duplicate keys and always injects `HRM_DASHBOARD` (View) for every user.

---

### Permission Attributes

#### `[CheckAccess]`
**File:** `Src/Infrastructure/VNR.Infrastructure.Permission/Attributes/CheckAccessAttribute.cs`

Applies to a **specific method or class**. Checks a single permission key + privilege.

```csharp
[CheckAccess("HRM_HRE_CONTRACT", PrivilegeType.Create)]
public async Task<IActionResult> Create(CreateContractCommand command)
    => await HandleRequest(command);
```

| Parameter | Default |
|-----------|---------|
| `key` | required |
| `scope` | `PrivilegeType.View` |

#### `[CheckAccessBaseCRUD]`
**File:** `Src/Infrastructure/VNR.Infrastructure.Permission/Attributes/CheckAccessBaseCRUDAttribute.cs`

Applied at **class level** on a `BaseCrudApiController`. Automatically maps HTTP method names to privileges:

| Method name | Mapped privilege |
|-------------|-----------------|
| `List` | `View` |
| `ListData` | `View` |
| `GetById` | `View` |
| `Create` | `Create` |
| `Update` | `Modify` |
| `Delete` | `Delete` |
| `DeleteRange` | `Delete` |

```csharp
[CheckAccessBaseCRUD("HRM_CAT_HEADCOUNT")]
public class HeadcountController : BaseCrudApiController<HeadcountDto, CreateHeadcountRequest, string>
{ }
```

Only fires for controllers that inherit from `BaseCrudApiController<>` and only for method names in the allowed list above.

#### `[CheckMultiAccess]`
**File:** `Src/Infrastructure/VNR.Infrastructure.Permission/Attributes/CheckMultiAccessAttribute.cs`

Grants access if the user has **any one** of the supplied keys (OR logic).

```csharp
[CheckMultiAccess(new[] { "HRM_HRE_CONTRACT", "HRM_HRE_CONTRACT_EVA" }, PrivilegeType.View)]
public async Task<IActionResult> ListData(ListContractQuery request)
    => await HandleRequest(request);
```

#### `[RequireSuperAdmin]`
**File:** `Src/Cores/VNR.Core.Api/Attributes/RequireSuperAdminAttribute.cs`

Restricts an endpoint to the superadmin account only. Compares `HttpContext.User.Identity.Name` against `appsettings.json → SuperAdmin:UserName` (default `"superadmin"`). Returns HTTP 403 JSON `{ "error": "Only superadmin is allowed to access this API" }` if not matched.

---

### Filters (implementation)

| Filter class | Created by | Implements |
|---|---|---|
| `PermissionFilter` | `[CheckAccess]` | `IAsyncActionFilter` |
| `MultiPermissionFilter` | `[CheckMultiAccess]` | `IAsyncActionFilter` |
| `PermissonFilterBaseCRUD` | `[CheckAccessBaseCRUD]` | `IAsyncActionFilter` |
| `RequireSuperAdminFilter` | `[RequireSuperAdmin]` | `IAsyncAuthorizationFilter` |

All filters delegate to `ICheckPermissonService.CheckPermissonForKey()` and return `ForbidResult` (HTTP 403) on denial.

---

## 6. Data Permission (Row-Level Security)

Data permissions control **which rows** a user can see or modify within a given entity set. The mechanism is decoupled from screen/action permissions — it applies at the repository query level.

### `permissionKey` on Repository Methods
**File:** `Src/Cores/VNR.Core.Domain/Repository/IGenericRepository.cs`

Every CRUD and query method on `IGenericRepository<TEntity, TKey>` accepts an optional `permissionKey`:

```csharp
Task<IQueryable<TEntity>> GetAllAsync(string? permissionKey = null);
Task<IQueryable<TEntity>> FindAsync(Expression<Func<TEntity, bool>> predicate, string? permissionKey = null);
Task<TEntity> GetByIdAsync(TKey id, string? permissionKey = null);
Task<(IQueryable<TEntity>, int)> GetPagedAsync(..., string? permissionKey = null);
Task AddAsync(TEntity entity, string? permissionKey = null);
Task UpdateAsync(TEntity entity, string? permissionKey = null);
Task<bool> DeleteAsync(TKey id, string? permissionKey = null);
// + range variants
```

When `permissionKey` is non-null, the infrastructure layer applies additional row-filtering based on the current user's organizational scope (OrgStructure, Branch, Position, etc.).

### `Sys_DataPermissionModel`
**File:** `Src/Cores/VNR.Core.Models/System/Sys_DataPermissionModel.cs`

Represents the resolved data-permission scope for a user/group. Fields used in filter predicates:

| Field | Description |
|-------|-------------|
| `UserID` / `UserName` | User identity |
| `GroupID` / `GroupName` | Group identity |
| `OrgStructure` / `OrgStructureExtends` / `OrgStructureID` | Org unit(s) the user can access |
| `Branches` / `BranchesName` / `CodeBranch` | Branch filter |
| `DataGroups` / `DataGroup` | Data group filter |
| `WorkPlace` / `Position` / `PositionID` | Work location / position filter |
| `EmployeeType` / `EmployeeGroupIDs` / `EmployeeStatus` | Employee classification filters |
| `PayrollGroup` / `GradePayroll` / `GradeAttendance` / `SalaryClass` | Payroll-related filters |
| `ContractType` / `AppendixContractType` | Contract type filters |
| `JobTitle` / `JobTitleID` | Job title filter |
| `Country` / `Unit` / `Company` | Geographic/org filters |
| `IsNotCheckPermisstion` | `true` → bypass data permission entirely for this query |

### `PermissionFilterConfiguration`
**File:** `Src/Cores/VNR.Core.Configurations/Security/PermissionFilterConfiguration.cs`

Global toggle for data permission filtering:

```json
// appsettings.json
{
  "Security": {
    "PermissionFilter": {
      "EnablePermissionFilter": true   // set false to disable row filtering globally
    }
  }
}
```

`IPermissionFilterService.IsPermissionFilterEnabled()` reads this flag. Defaults to `true`.

---

## 7. Permission Key Naming Convention

Permission keys follow the pattern: `HRM_<MODULE>_<FEATURE>`

### Key constants by service

| File | Service | Sample keys |
|------|---------|-------------|
| `HrePermissionKeyNames.cs` | HRE | `HRM_CAT_HEADCOUNT`, `HRM_HRE_CONTRACT`, `HRM_HRE_EMPLOYEE_LIST`, `HRM_HRE_STRUCTURE_ORGSTRUCTURE` |
| `SysPermissionKeyNames.cs` | System | `HRM_SYS_FEATURES`, `HRM_SYS_ROLEPERMISSON`, `HRM_SYS_ROLE`, `HRM_SYS_ACCOUNT`, `HRM_SYS_AUDIT_LOG` |
| `EvaluationPermissionKeyNames.cs` | Evaluation | `HRM_EVA_GOAL`, `HRM_EVA_EVALUATION`, `HRM_EVA_PERIOD`, `HRM_EVA_CRITERIA` |
| `TrainingPermissionKeyNames.cs` | Training | `HRM_TRA_CLASS`, `HRM_TRA_ROADMAP`, `HRM_TRA_CAREER_DEVELOPMENT` |
| `SCCPermissionKeyNames.cs` | Succession | `HRM_SCC_PLAN_SCREEN`, `HRM_SCC_IMPACT_OF_LOSS_SCREEN` |
| `AppPermissionKeyNames.cs` | App-level | `HRM_DASHBOARD`, `HRM_SYSTEM`, `HRM_WORKFLOW`, `HRM_TASK` |

**Special keys:**
- `HRM_DASHBOARD` — automatically granted `View` to every authenticated user
- `HRM_DEV_PERMISSION_SCREEN` — dev/test only, not for production use

---

## 8. SuperAdmin Bypass

A user is considered superadmin when `IUserContext.IsSuperAdmin == "true"` (from JWT claim `hrm_is_super_admin`).

- **Screen/Action permission:** `CheckPermissonForKey` returns `true` immediately for superadmin without Redis lookup.
- **`GetPermissonsForSuperadmin()`:** Returns all `Sys_Permission` records with `PrivilegeNumber` set to the full mask (`EnumGetValueHelper.GetFullMaskAsInt<PrivilegeType>()`), plus mandatory keys: `HRM_SYS_FEATURES`, `HRM_SYS_PERMISSION`, `HRM_SYS_ROLEPERMISSON`, `HRM_DASHBOARD`, `HRM_DEV_PERMISSION_SCREEN`, `HRM_SYSTEM`, `HRM_SYS_DASHBOARD`.
- **`[RequireSuperAdmin]`:** Checks `User.Identity.Name` against `appsettings.json → SuperAdmin:UserName`. This is separate from the `IsSuperAdmin` claim check.

---

## 9. Registration

**File:** `Src/Infrastructure/VNR.Infrastructure.Permission/Extensions/RegisterCheckPermissonServices.cs`

```csharp
services.AddCheckPermissoInfrastructure();
// registers:
//   ICheckPermissonService  → CheckPermissonService  (Scoped)
//   PermissionFilter                                  (Scoped)
//   PermissonFilterBaseCRUD                           (Scoped)
//   MultiPermissionFilter                             (Scoped)
```

Called inside `Add{ServiceName}Services()` in each service's `.Infrastructure/Extensions/` project.

---

## 10. Permission Flow Diagrams

### Action/Control Permission (per HTTP request)

```
HTTP Request arrives
    ↓
[CheckAccess("KEY", Privilege)] / [CheckAccessBaseCRUD("KEY")] on Controller
    ↓
PermissionFilter.OnActionExecutionAsync()
    ↓
ICheckPermissonService.CheckPermissonForKey("KEY", Privilege)
    ↓
IsSuperAdmin == "true"?  →  YES: pass
    ↓ NO
"RolePermission:all" exists in Redis?  →  NO: CacheRolePermission() (load all from DB)
    ↓ YES
For each roleId in IUserContext.UserRoles:
    Redis.HashGet("RolePermission:{roleId}", "KEY")  →  privilegeNumber
    (privilegeNumber & Privilege) == Privilege?  →  YES: pass (403 avoided)
    ↓
All roles denied  →  ForbidResult (HTTP 403)
```

### Data Permission (per repository call)

```
Handler calls repository.GetAllAsync(permissionKey: "HRM_HRE_CONTRACT")
    ↓
IPermissionFilterService.IsPermissionFilterEnabled()  →  false: no filter, return all
    ↓ true
Resolve Sys_DataPermissionModel for current user
    (OrgStructure, Branches, Position, …)
    ↓
Apply row-level predicate (fn_build_permission_predicate / stored procedure logic)
    ↓
Return filtered IQueryable<TEntity>
```

---

## 11. Key File Locations

| Component | Path |
|-----------|------|
| `PrivilegeType` enum | `Src/Cores/VNR.Core.Domain/Enums/PrivilegeEnum.cs` |
| `Sys_Permission` entity | `Src/Cores/VNR.Core.Domain/Entities/System/Sys_Permission.cs` |
| `Sys_RolePermission` entity | `Src/Cores/VNR.Core.Domain/Entities/System/Sys_RolePermission.cs` |
| `ICheckPermissonService` | `Src/Infrastructure/VNR.Infrastructure.Permission/Interface/ICheckPermissonService.cs` |
| `CheckPermissonService` | `Src/Infrastructure/VNR.Infrastructure.Permission/Services/CheckPermissonService.cs` |
| `CheckAccessAttribute` | `Src/Infrastructure/VNR.Infrastructure.Permission/Attributes/CheckAccessAttribute.cs` |
| `CheckAccessBaseCRUDAttribute` | `Src/Infrastructure/VNR.Infrastructure.Permission/Attributes/CheckAccessBaseCRUDAttribute.cs` |
| `CheckMultiAccessAttribute` | `Src/Infrastructure/VNR.Infrastructure.Permission/Attributes/CheckMultiAccessAttribute.cs` |
| `PermissionFilter` / `MultiPermissionFilter` | `Src/Infrastructure/VNR.Infrastructure.Permission/Behaviors/AuthorizationBehavior.cs` |
| `PermissonFilterBaseCRUD` | `Src/Infrastructure/VNR.Infrastructure.Permission/Behaviors/PermissonFilterBaseCRUD.cs` |
| `RequireSuperAdminAttribute` | `Src/Cores/VNR.Core.Api/Attributes/RequireSuperAdminAttribute.cs` |
| `RequireSuperAdminFilter` | `Src/Cores/VNR.Core.Api/Attributes/RequireSuperAdminFilter.cs` |
| `IUserContext` | `Src/Infrastructure/VNR.Infrastructure.Security/Contexts/IUserContext.cs` |
| `UserClaims` constants | `Src/Infrastructure/VNR.Infrastructure.Security/Constants/UserClaims.cs` |
| `Sys_DataPermissionModel` | `Src/Cores/VNR.Core.Models/System/Sys_DataPermissionModel.cs` |
| `PermissionFilterConfiguration` | `Src/Cores/VNR.Core.Configurations/Security/PermissionFilterConfiguration.cs` |
| DI registration | `Src/Infrastructure/VNR.Infrastructure.Permission/Extensions/RegisterCheckPermissonServices.cs` |
| HRE permission keys | `Src/Infrastructure/VNR.Infrastructure.Permission/Constants/HrePermissionKeyNames.cs` |
| System permission keys | `Src/Infrastructure/VNR.Infrastructure.Permission/Constants/SysPermissionKeyNames.cs` |
| Evaluation permission keys | `Src/Infrastructure/VNR.Infrastructure.Permission/Constants/EvaluationPermissionKeyNames.cs` |
