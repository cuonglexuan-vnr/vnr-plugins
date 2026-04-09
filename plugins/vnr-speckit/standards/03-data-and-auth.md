# Vnr Data, Authentication & Authorization Rules

---

## 1. Nguyên tắc chung

- **Heavy business logic** và data aggregation phải xử lý qua Stored Procedures.
- **LINQ** chỉ dùng cho in-memory filtering nhẹ hoặc CRUD đơn giản.
- **Data permission** được enforce ở tầng database (qua SP `Get_Data_Permission_New`), không implement authorization logic riêng ở middle-tier.
- Schema DB (tables, columns, SPs) là nguồn sự thật duy nhất — không dùng Code-First migrations.

---

## 2. Hệ thống phân quyền dữ liệu (Data Permission)

### 2.1 Các bảng liên quan

| Bảng | Vai trò |
|------|---------|
| `Sys_UserInfo` | Tài khoản người dùng (`UserLogin`, `ProfileID`) |
| `Sys_Group` | Nhóm quyền |
| `Sys_GroupPermission2` | Ánh xạ Group ↔ Resource, kèm `PrivilegeNumber` (bitfield) |
| `Sys_Resource` | Tài nguyên hệ thống — màn hình/module/button (có `ResourceName` = key quyền) |
| `Sys_DataPermission` | Phạm vi dữ liệu mỗi User/Group được xem (OrgStructure, EmployeeType, v.v.) |

### 2.2 Stored Procedure `Get_Data_Permission_New`

**Mục đích:** Trả về danh sách `Hre_Profile.ID` (ProfileIDs) mà user hiện tại có quyền xem, dựa trên cấu hình phân quyền dữ liệu của nhóm mà user thuộc về.

**Signature:**
```sql
Get_Data_Permission_New
    @UserName           varchar(50)       = null,   -- UserLogin của Sys_UserInfo
    @ObjName            varchar(100)      = null,   -- ResourceName (tên entity, vd: 'Hre_Profile', 'Att_LeaveDay')
    @ProfileCommonSearch nvarchar(max)   = null,   -- ProfileID bổ sung cần merge
    @Days               int              = null,   -- Số ngày lùi để lọc nhân viên đã nghỉ
    @TypeAction         varchar(50)       = null    -- Dùng để tra cứu @Days từ Sys_SettingDayQuit
```

**Logic thực thi (3 bước):**

**Bước 1 — Lấy GroupIDs có quyền:**
```sql
SELECT DISTINCT sdp.GroupID
FROM Sys_GroupPermission2 gp2, Sys_DataPermission sdp, Sys_Resource srs, Sys_UserInfo sui
WHERE gp2.GroupID = sdp.GroupID
  AND gp2.ResourceID = srs.ID
  AND sui.ID = sdp.UserID
  AND sui.UserLogin = @UserName
  AND srs.ResourceName = @ObjName       -- Khớp với tên entity/table
  AND gp2.PrivilegeNumber > 0           -- Có ít nhất 1 bit quyền
  AND [IsDelete filters]
```

**Bước 2 — Lấy cấu hình data permission của các group:**
Lấy các bộ lọc dữ liệu từ `Sys_DataPermission` cho các GroupID ở bước 1: OrgStructure, EmployeeType, EmployeeGroup, WorkPlace, Position, JobTitle, EmployeeStatus, Country, SalaryClass, PayrollGroup, CodeBranch, Unit, ContractType, AppendixContractType, Company, ProfileIDs.

**Bước 3 — Build dynamic SQL để lọc `Hre_Profile`:**

| Tình huống | Kết quả |
|-----------|---------|
| Bất kỳ group nào có `IsNotCheckPermisstion = 1` | Trả về **tất cả** profile đang hoạt động (full access) |
| Có bản ghi permission nhưng không full access | Build dynamic SQL với LEFT JOIN các bảng dimension, WHERE theo từng chiều được cấu hình |
| Không có bản ghi permission nào | Trả về **rỗng** (không có quyền xem dữ liệu) |

**Các dimension filter (áp dụng có điều kiện — chỉ khi trường có giá trị):**

| Dimension | Bảng join | Cột so sánh |
|-----------|-----------|-------------|
| OrgStructure | `Cat_OrgStructure` | `OrderNumber IN split_to_int(list)` |
| EmployeeType | `Cat_EmployeeType` | `OrderNumber` CHARINDEX trong list |
| EmployeeGroup | `Cat_EmployeeGroup` | `OrderNumber` CHARINDEX trong list |
| WorkPlace | `Cat_WorkPlace` | `OrderNumber` CHARINDEX trong list |
| Position | `Cat_Position` | `OrderNumber` CHARINDEX trong list |
| JobTitle | `Cat_JobTitle` | `OtherNumber` CHARINDEX trong list |
| EmployeeStatus | `Hre_Profile` trực tiếp | `hp.StatusSyn` CHARINDEX trong list |
| Country | `Cat_Country` | `OrderNumber` CHARINDEX trong list |
| SalaryClass | dynamic join | OrderNumber CHARINDEX |
| PayrollGroup | dynamic join | OrderNumber CHARINDEX |
| CodeBranch | dynamic join | OrderNumber CHARINDEX |
| Unit | dynamic join | OrderNumber CHARINDEX |
| ContractType | dynamic join | OrderNumber CHARINDEX |
| AppendixContractType | dynamic join | OrderNumber CHARINDEX |
| Company | dynamic join | OrderNumber CHARINDEX |
| ProfileIDs | `Hre_Profile` | ID IN list |

**Lọc trạng thái nhân viên mặc định:**
- Chỉ lấy profile có `StatusSyn` trong: `E_HIRE`, `E_LONG_SUSPENSE`, `E_PREGNANCY`, `E_SUSPENSE`, `E_WAITING`, `E_WAITING_APPROVE`
- Nếu `@Days` hoặc `@TypeAction` có giá trị → bổ sung `E_STOP` với điều kiện `DateQuit >= DATEADD(day, -@Days, getdate())`

**Kết quả trả về:** `List<Guid>` — danh sách `Hre_Profile.ID`

---

### 2.3 Cách gọi SP ở Backend (C#)

**Pattern chuẩn — dùng `UnitOfWork.GetDataPermission<TEntity>`:**
```csharp
// UnitOfWork.cs — wrapper chính
public List<Guid> GetDataPermission<TEntity>(string userLogin)
{
    return context.Database
        .SqlQuery<Guid?>("Get_Data_Permission_New {0}, {1}",
            new object[] { userLogin, typeof(TEntity).Name })
        .Where(s => s != null)
        .Select(s => s.Value)
        .ToList();
}
```

**Áp dụng filter vào query:**
```csharp
var lstProfileID = unitOfWork.GetDataPermission<Hre_Profile>(userLogin);
var query = unitOfWork.CreateQueryable<Att_LeaveDay>(
    d => lstProfileID.Contains(d.ProfileID.Value) && ...);
```

**Gọi trực tiếp với custom @ObjName (khi entity khác `Hre_Profile`):**
```csharp
// RequestInfoQueryDataServices.cs
context.Database.SqlQuery<Guid?>(
    "Get_Data_Permission_New {0}, {1}",
    new object[] { userLogin, "Att_LeaveDay" })
    .Where(s => s != null).Select(s => s.Value).ToList();
```

**Các file/class chủ chốt:**

| File | Vai trò |
|------|---------|
| `HRM.Data.BaseRepository/UnitOfWork.cs` | Wrapper chính `GetDataPermission<TEntity>()`, `CheckPermissionWithCache()`, `GetAllPermissionForUser()`, `GetUserPermissionByResourceNameWithCache()` |
| `HRM.Data.BaseRepository/IUnitOfWork.cs` | Interface định nghĩa contract |
| `HRM.Data.Repository/SecurityRepository.cs` | `CheckPermission()`, `GetPermission()` — delegate sang UnitOfWork |
| `HRM.Infrastructure.Security/ConstantPermission.cs` | `public const string` cho mọi permission key — dùng trong C# code thay vì hardcode string |
| `HRM.Business.Hr.Domain/RequestInfoFeatures/RequestInfoQueryDataServices.cs` | `GetListProfileDataPermission()` — wrapper cao hơn |
| `HRM.SC.Core.Business/Systems/Sys_SecurityBusinessServices.cs` | `CheckPermission()`, `CheckDataPermission()`, `GetDataPermission()`, `GetPermissionByScreen()` cho ServiceCenter |
| `HRM.Business.Attendance.Domain/Att_CommonServices.cs` | Áp dụng filter cho dữ liệu chấm công |

**Quy tắc:**
- Luôn dùng `GetDataPermission<TEntity>()` thay vì gọi SP trực tiếp (trừ khi cần custom @ObjName).
- Filter ProfileID **bắt buộc** phải được áp dụng trước khi return data ra controller.
- Không bao giờ skip data permission filter ở tầng business logic.

---

## 3. Hệ thống phân quyền chức năng (Function Permission)

### 3.1 PrivilegeType — Bitfield quyền thao tác

`Sys_GroupPermission2.PrivilegeNumber` là giá trị bit biểu diễn tập hợp quyền thao tác của một group trên một resource. Enum được định nghĩa ở cả backend và frontend với giá trị giống nhau:

| Bit | Giá trị | Ý nghĩa | Backend (C#) | Frontend (TS) |
|-----|---------|---------|--------------|---------------|
| View | 1 | Xem | `PrivilegeType.View` | `PrivilegeType.View` |
| Delete | 2 | Xóa | `PrivilegeType.Delete` | `PrivilegeType.Delete` |
| Create | 4 | Tạo mới | `PrivilegeType.Create` | `PrivilegeType.Create` |
| Modify | 8 | Sửa | `PrivilegeType.Modify` | `PrivilegeType.Modify` |
| Export | 64 | Xuất file | `PrivilegeType.Export` | `PrivilegeType.Export` |
| Import | 128 | Nhập file | `PrivilegeType.Import` | `PrivilegeType.Import` |
| Template | 512 | Template | `PrivilegeType.Template` | `PrivilegeType.Template` |
| ChangeColumn | 1024 | Cấu hình cột grid | `PrivilegeType.ChangeColumn` | `PrivilegeType.ChangeColumn` |
| Access | 100 | Truy cập (FE only) | — | `PrivilegeType.Access` |

Frontend lưu và truyền PrivilegeNumber dưới dạng **chuỗi hex 16 ký tự** (ví dụ: `"000000000000004f"`).

**Backend enum:** `VnResource.Helper.Security.PrivilegeType` (được dùng trực tiếp trong UnitOfWork, SecurityRepository, Sys_SecurityBusinessServices)

**Frontend enum:** `Frontend/projects/shared-core/core/@vnr/models/vnr-permission.type.ts`

---

### 3.2 Resource Keys — Quy ước đặt tên

Tất cả key quyền trong hệ thống được tham chiếu C# qua `OtherResource` enum trong file:
`HRM.Infrastructure.Utilities/Enum/EnumResource.cs`

**Format tên enum member:** `[Module]__[ResourceKey]`

**Các prefix Module thường gặp:**

| Prefix | Phạm vi |
|--------|---------|
| `Salary__` | Màn hình lương trong Admin |
| `HR__` | Màn hình nhân sự trong Admin |
| `HRDetail__` | Tab/Grid trong màn hình chi tiết nhân sự |
| `Portal__` | Màn hình/button trong Portal (v2/v3) |
| `Attendance__` | Màn hình chấm công trong Admin |
| `System__` | Màn hình quản trị hệ thống |
| `Category__` | Màn hình danh mục |

**Format ResourceKey theo loại tài nguyên:**

| Loại | Pattern | Ví dụ |
|------|---------|-------|
| Màn hình (screen) | `[Entity]_Index` | `Sal_Bonus_Index`, `Att_ConfirmChangeShift_New_Index` |
| Button | `[Screen]_btn[Action]` | `Sal_Bonus_Index_btnAnalysis`, `Tra_PlanDetailV3_Index_btnSubmit` |
| Tab | `[Screen]_[TabName]Tab` hoặc `[Screen]_[TabName]_Tab` | `Sys_ManagementConfigAdmin_AllTab`, `HR_Hre_ProfessionalPlans_Tab` |
| Grid trong tab | `[Screen]_[GridName]Grid` | `HR_QualificationDetail_QualificationGrid`, `HR_ProfileLaborForeignDetail_WorkPermitGrid` |
| Section/Div | `[Screen]_Div_[SectionName]` | `Att_ManageLeaveday_Index_Div_CompensatoryByDay` |
| Permission đặc biệt | tuỳ định nghĩa | `Sys_CheckLock_Permission`, `Hre_DependantRegisterHighPermission` |

**Attributes trên mỗi enum member:**

```csharp
[KeyTranslate("ResourceKey")]           // Key dùng để tra key trong Sys_Resource.ResourceName
[KeyTranslateScreen("TranslationKey")]  // Key dịch i18n cho tên màn hình/tài nguyên
[KeyGroupScreen("ParentScreenKey")]     // Key màn hình cha — để nhóm button/tab vào màn hình
[Description("Mô tả tiếng Việt")]
OtherResource.Module__ResourceKey
```

> Khi thêm resource mới, phải bổ sung vào `EnumResource.cs` trước, sau đó insert vào `Sys_Resource` trên DB.

---

### 3.3 Kiểm tra quyền ở Backend (C#)

**Kiểm tra một quyền cụ thể (có cache):**
```csharp
// UnitOfWork.cs — static method, dùng cache HttpRuntime
bool hasPermission = UnitOfWork.CheckPermissionWithCache(userID, PrivilegeType.View, "Sal_Bonus_Index");
```

**Lấy danh sách loại quyền của user trên một resource:**
```csharp
// UnitOfWork.cs — trả về List<string> các PrivilegeType mà user có
// e.g. ["View", "Create", "Modify", "Export"]
List<string> privileges = unitOfWork.GetUserPermissionByResourceNameWithCache(userID, "Sal_Bonus_Index");
```

**Kiểm tra quyền dữ liệu kèm data permission (ServiceCenter):**
```csharp
// Sys_SecurityBusinessServices.cs
bool allowed = securitySvc.CheckPermission(userID, PrivilegeType.Modify, "Hre_Profile");

// Lấy danh sách ProfileID user được phép sửa (theo data permission)
List<Guid> editableProfiles = securitySvc.CheckDataPermission(UserLogin, lstProfileID, "Hre_Profile", PrivilegeType.Modify);
```

**Lấy toàn bộ resource names user có quyền:**
```csharp
// SecurityRepository.cs → UnitOfWork.GetAllPermissionForUser
List<string> allResources = securityRepo.GetPermission(userID, PrivilegeType.View);
```

**Super Admin bypass:** `userID == Guid.Empty` → `CheckPermissionWithCache` trả `false` (không bypass). Nhưng `SecurityRepository.GetPermission()` với `userID == Guid.Empty` trả toàn bộ `Sys_Resource` (legacy behavior cho super admin).

---

### 3.4 API Endpoints phân quyền (MVC → Angular)

Các endpoint này nằm trong `HRM.Presentation.Main` (hoặc `HRM.Presentation.EmpPortal`):

| Endpoint | URL pattern | Mục đích |
|----------|-------------|---------|
| `AngularPortal_UserPermission` | `New_Home/AngularPortal_UserPermission` | Lấy toàn bộ danh sách quyền View của user (flat array of resource key strings) |
| `AngularPortal_CheckPermissionAction` | `New_Home/AngularPortal_CheckPermissionAction` | Kiểm tra quyền thao tác cụ thể (`privilegeType` + `permission` key) |
| `AngularPortal_CheckFullPermissionAction` | `New_Home/AngularPortal_CheckFullPermissionAction` | Kiểm tra quyền full màn hình |
| `AngularPortal_CheckIsSuperAdmin` | `New_Home/AngularPortal_CheckIsSuperAdmin` | Kiểm tra super admin flag |
| `SessionIntrospection` | `Portal/SessionIntrospection` | Kiểm tra trạng thái auth session (trả 401 nếu hết session) |
| `KeepSessionAlive.ashx` | `KeepSessionAlive.ashx` | Gia hạn session, trả JWT với claims user (khi USE_IDENTITY_SERVER=true) hoặc `'Portal'` string |

**Portal v3 (AUTH_API_URL mode):** Dùng endpoint khác trả về dict `{ Data: { [resourceKey]: hexString } }`:
`${AUTH_API_URL}api/TestShared/TestPermission`

---

## 4. Luồng Authentication & Session

### 4.1 JWT Claims (khi `USE_IDENTITY_SERVER = true`)

`CheckSessionService.getSession()` decode JWT từ `KeepSessionAlive.ashx`, extract:

| Claim | Ý nghĩa |
|-------|---------|
| `hrm_profile_id` | ProfileID của user trong `Hre_Profile` |
| `hrm_user_id` | UserID trong `Sys_UserInfo` |
| `hrm_username` | UserLogin |
| `hrm_is_super_admin` | Flag superadmin (boolean string) |
| `languagecode` | Ngôn ngữ giao diện |

**File:** `Frontend/projects/shared-core/core/@vnr-services/permission/checkSession.service.ts`

### 4.2 NgRx User State

Actions chính: `LoginPotal` (set user info + auth token), `Logout` (clear state), `LoadCurrentAccountSuccessful` (set authorized), `LoadCurrentAccountUnsuccessful`.

State fields quan trọng:
- `state.authorized` — dùng trong Portal v3 (dev/staging)
- `state.authorizedPortal` — dùng trong Portal v2 (isHrmPortal production)

### 4.3 Permission Loading Flow

```
App init
  → CheckSessionService.getSession()       # decode JWT → dispatch LoginPotal → set authorized
  → PermissionService.loadPermissions$()   # gọi AngularPortal_UserPermission (v2) hoặc TestPermission (v3)
  → VnrPermissionState.setPermissions()    # cache flat array (v2) vào BehaviorSubject
  → VnrPermissionState.setPermissionsData()  # cache dict { key: hex } (v3) vào BehaviorSubject
  → AuthGuard.canActivate()               # check key trước khi activate route
```

**VnrPermissionState** (`@vnr-services/permission/state/permission.state.ts`):
- **Không phải NgRx store** — là simple injectable service dùng `BehaviorSubject`
- `permissions$` — flat array of keys có quyền View (dùng cho Portal v2)
- `permissionsData$` — dict `{ [key]: hexString }` (dùng cho Portal v3)

### 4.4 Hai chế độ permission (v2 vs v3)

| Chế độ | Điều kiện | Dữ liệu permission | Source |
|--------|-----------|-------------------|--------|
| **Portal v2** (isHrmPortal) | `!AUTH_API_URL` | Flat `string[]` (chỉ keys có View) | `AngularPortal_UserPermission` |
| **Portal v3** (SC mode) | `AUTH_API_URL` có giá trị | Dict `{ key: hexString }` | `${AUTH_API_URL}api/TestShared/TestPermission` |

---

## 5. Kiểm tra quyền ở Frontend

### 5.1 Directive — Template-level

#### `*vnrPermission` (ưu tiên dùng cho Portal v3, hoạt động cả v2)

**File:** `Frontend/projects/shared-core/core/@vnr/directives/vnr-check-permission.directive.ts`

```html
<!-- Portal v3: hiện khi user có quyền View HOẶC Modify trên key này -->
<div *vnrPermission="'Attendance_LeaveDay'; role:['View','Modify']">...</div>

<!-- Portal v2: hiện khi key có trong danh sách View permission -->
<div *vnrPermission="'Attendance_LeaveDay'">...</div>

<!-- Hiện khi user có ít nhất 1 trong các keys (dùng some) -->
<div *vnrPermission="['Key1','Key2']">...</div>
```

**Hoạt động:**
- Nếu có `AUTH_API_URL` (v3): subscribe `getMyPermissionsData$()` → lấy hex value theo key → `approvePermission(hexValue, roles)` (bitwise)
- Nếu không có `AUTH_API_URL` (v2): subscribe `getPermissionPortal$()` → kiểm tra key có trong flat array

#### `*checkPermission` (chỉ dùng cho Portal v2 — isHrmPortal)

**File:** `Frontend/projects/shared-core/core/@vnr/directives/check-permission.directive.ts`

```html
<button *checkPermission="'Sal_Bonus_Index_btnAnalysis'">Phân tích</button>

<!-- Với expression điều kiện bổ sung -->
<button *checkPermission="{ key: 'Sal_Bonus_Index_btnSave', expression: isEditing }">Lưu</button>

<!-- Với array keys (tất cả keys phải có) -->
<button *checkPermission="'Key1'" [checkPermissionArray]="['Key2','Key3']">...</button>
```

> Chú ý: `checkPermission` chỉ hoạt động khi `environment.isHrmPortal = true`. Không dùng cho Portal v3.

---

### 5.2 AuthGuard — Route-level

**File:** `Frontend/projects/shared-core/core/@vnr-ui/cleanui/system/Guard/auth.guard.ts`

```typescript
{
  path: 'leave-day',
  loadChildren: () => import('./...').then(m => m.LeaveDayModule),
  canActivate: [AuthGuard],
  data: { permission: 'Attendance_LeaveDay_Index' }
}
// → Chuyển hướng /auth/403 nếu không có quyền
// → Chuyển hướng auth/login nếu chưa đăng nhập
```

**Logic AuthGuard.canActivate:**
1. Bỏ qua nếu `environment.authenticated = true` (dev mode)
2. Bỏ qua nếu URL kết thúc bằng mobile code
3. Production + isHrmPortal: call `checkAuth()` → `Portal/SessionIntrospection` (phát hiện 2FA, session expire)
4. Nếu authorized + `next.data.permission` tồn tại: `permissionService.checkPermission(key)` → index trong flat array
5. Nếu không có quyền: `router.navigate(['/auth/403'])`

---

### 5.3 Bitwise check trong code (PermissionService)

**File:** `Frontend/projects/shared-core/core/@vnr-services/permission/permission.service.ts`

```typescript
// Kiểm tra hex value có chứa các bit quyền cụ thể không (Portal v3)
const canEdit = permissionService.approvePermission(hexValue, ['Modify']);
const canExport = permissionService.approvePermission(hexValue, ['Export', 'View']);

// Kiểm tra bất đồng bộ với key (tra từ VnrPermissionState)
const hasView: boolean = await permissionService.checkPermission('Sal_Bonus_Index');

// Observable check với role (dùng trong component)
permissionService.checkPermission$(['Modify', 'Create'], 'Sal_Bonus_Index').subscribe(hasAccess => { ... });

// API-based check (gọi server, dùng khi cần chắc chắn)
permissionService.checkPermissionByKey('View', 'Sal_Bonus_Index').then(result => { ... });
permissionService.checkScreenPermission('Sal_Bonus_Index').subscribe(...);
```

**`approvePermission` implementation:**
```typescript
// perValue: hex string từ backend, e.g. "000000000000004f"
// perCheck: array of PrivilegeType key strings, e.g. ['View', 'Modify']
approvePermission(perValue: string, perCheck: string[]): boolean {
  const permissionValue = perCheck.map(x => PrivilegeType[x]).filter(x => x);
  if (!perValue || permissionValue.length == 0) return false;
  let valueCheck = parseInt(perValue, 16);
  return eval(`(${valueCheck} & (${permissionValue.join('|')})) > 0`);
}
```

---

### 5.4 PermissionFilter Pipe

**File:** `Frontend/projects/shared-core/core/@vnr-pipes/permissionFilter.pipe.ts`

```html
<!-- Lọc danh sách items có field keyPermission theo quyền View -->
{{ items | permissionFilter:permissionData:'View' }}
```

> Pipe yêu cầu mỗi item trong array phải có field `keyPermission` chứa permission key. Pipe dùng bitwise check tương tự `approvePermission`.

---

### 5.5 Toolbar Action Permission

**File:** `Frontend/projects/shared-core/core/@vnr/components/vnr-toolbar-v2/models/toolbar-action.model.ts`

```typescript
export interface ToolbarAction {
  id?: string;
  text?: string;
  icon?: string;
  disabled?: boolean;
  permission?: PermissionByRole;  // Permission gắn trực tiếp vào toolbar action
  click?: () => any;
}

export interface PermissionByRole {
  key?: string;          // Permission key (e.g., 'New_Att_MangerViewCanlendar')
  role?: PrivilegeType;  // Privilege type enum value
}
```

Usage trong template:
```html
<vnr-button
  *vnrPermission="attPermission.SomeKey; role: [privilegeType.View]"
  (click)="onAction()">
</vnr-button>
```

---

### 5.6 Grid Column Permission (ChangeColumn)

- **Cấu hình cột grid:** kiểm tra `PrivilegeType.ChangeColumn` (1024)
- **Grid config button:** chỉ hiện cho user có `IsSupperAdmin = true` trong NgRx store (directive `vnr-grid-configs`)
- **Pattern:** `*vnrPermission="screenKey; role: ['ChangeColumn']"` để ẩn/hiện nút config cột

---

### 5.7 Per-Module Permission Enum Files

Mỗi micro-frontend có riêng hai enum file trong `Frontend/projects/shared-resources/[module]/enums/`:

| File | Nội dung |
|------|---------|
| `permission.enum.ts` | Keys cho button/action cụ thể (e.g., `btnApprove`, `btnReject`) |
| `screen-permission.enum.ts` | Keys cho màn hình (route guard + `data.permission`) |

Ví dụ Attendance:
```typescript
// screen-permission.enum.ts
export enum AttScreenPermission {
  Att_Dashboard_Index = 'Att_Dashboard_Index',
  New_Att_Manager_Workdays = 'New_ComputeWorkdayAdmin_New_Index_V2',
}

// permission.enum.ts
export enum AttEnumPermission {
  New_Att_Leaveday_Approve_New_Index_btnApprove = 'New_Att_Leaveday_Approve_New_Index_btnApprove',
  New_Att_Leaveday_Approve_New_Index_btnReject = 'New_Att_Leaveday_Approve_New_Index_btnReject',
}
```

> Khi thêm permission mới cho một module, phải thêm vào enum file tương ứng — không dùng string literal trực tiếp trong template.

---

### 5.8 Programmatic check trong Component

**Portal v2 — kiểm tra bằng flat array:**
```typescript
// Trong component
constructor(private permissionSvc: PermissionService) {}

async ngOnInit() {
  const canView = await this.permissionSvc.checkPermission('Sal_Bonus_Index');
  const canEdit = await this.permissionSvc.checkPermission('Sal_Bonus_Index_btnEdit');
}
```

**Portal v3 — kiểm tra bằng hex + bitwise:**
```typescript
// Trong component, dùng Observable
this.permissionSvc.checkPermission$(['Modify'], 'Sal_Bonus_Index').subscribe(hasModify => {
  this.canEdit = hasModify;
});
```

---

## 6. Quy tắc triển khai (Rules for AI Agents)

### Backend

1. **Mọi SP query liên quan đến nhân viên** phải call `Get_Data_Permission_New` để lấy ProfileID list, rồi filter `WHERE ProfileID IN (list)`.
2. **Tham số `@ObjName`** = `ResourceName` trong `Sys_Resource` — thường là tên entity/table tương ứng.
3. **Không tự build filter logic** thay thế cho SP — logic filter phức tạp đã được xử lý trong SP.
4. **SP trả về rỗng** nghĩa là user không có quyền → controller phải trả empty result, không được raise lỗi.
5. **`IsNotCheckPermisstion = 1`** ở bất kỳ group nào = full access, SP đã handle, không cần check lại ở C#.
6. **Khi thêm resource mới:** phải thêm vào `EnumResource.cs` (enum `OtherResource`) trước, đặt tên theo convention `[Module]__[ResourceKey]`, sau đó insert `Sys_Resource` record trên DB.
7. **Kiểm tra chức năng button/tab:** dùng `CheckPermissionWithCache(userID, PrivilegeType.View, "ResourceKey")`. Không hardcode logic thay thế.
8. **Cache:** `CheckPermissionWithCache` và `GetUserPermissionByResourceNameWithCache` dùng `HttpRuntime.Cache` — không cần tự cache lại ở business layer.

### Frontend

1. **Không implement data filtering ở frontend** — data permission là server-side, frontend chỉ nhận dữ liệu đã được lọc.
2. **Ẩn/hiện control theo quyền:**
   - Portal v3 (AUTH_API_URL): dùng `*vnrPermission="'key'; role:['View']"` (standalone directive)
   - Portal v2 (isHrmPortal): dùng `*checkPermission="'key'"` hoặc `*vnrPermission="'key'"`
3. **Route guard:** mọi route có dữ liệu nhạy cảm phải có `canActivate: [AuthGuard]` và `data: { permission: 'ScreenKey' }`.
4. **Permission key phải là string literal** khớp với `ResourceName` trong `Sys_Resource` — không dùng số hay magic string tự chế.
5. **`PrivilegeType` bits** dùng enum string key (`'View'`, `'Create'`, `'Modify'`, v.v.) khi gọi `approvePermission`, không dùng số trực tiếp.
6. **Không gọi `checkPermissionByKey$` hoặc `checkScreenPermission`** trong vòng lặp — các API này hit server mỗi call. Dùng `checkPermission$` hoặc subscribe `getMyPermissionsData$()` thay thế.
7. **Không reset `VnrPermissionState`** trừ khi logout hoặc reload permission có chủ ý (`permissionService.resetPermissionPortal()`).

### Stored Procedures (pattern chung)

Khi viết SP mới cần filter theo nhân viên, pattern chuẩn:
```sql
-- Bước 1: Lấy danh sách ProfileID được phép
DECLARE @ProfileIDs TABLE (ID uniqueidentifier)
INSERT INTO @ProfileIDs
EXEC Get_Data_Permission_New @UserName, @ObjName

-- Bước 2: Apply vào query chính
SELECT ... FROM Hre_Profile hp
WHERE hp.ID IN (SELECT ID FROM @ProfileIDs)
  AND ...
```
