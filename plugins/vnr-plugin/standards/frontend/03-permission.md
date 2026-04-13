# Frontend Permission System

## Overview

The HRM frontend implements a **bitwise, server-driven permission model**. Each screen/resource is identified by a string key. The backend returns a flat map `{ [resourceKey: string]: hexString }` where each hex value encodes a bitmask of granted privileges. The frontend parses this map once at login and checks permissions synchronously or reactively throughout the app.

---

## 1. Data Model

### PrivilegeType (string enum)
`libs/models/permission/enums/privilege-type.enum.ts`

Used as the human-readable label in component code:

```ts
export enum PrivilegeType {
  View = 'View',
  Create = 'Create',
  Modify = 'Modify',
  Delete = 'Delete',
  Detail = 'Detail',
  Import = 'Import',
  ExportTemplate = 'ExportTemplate',
  CreateTemplate = 'CreateTemplate',
  Export = 'Export',
  Chart = 'Chart',
  ChangeColumn = 'ChangeColumn',
  Approve = 'Approve',
  Attach = 'Attach',
  Print = 'Print',
  Template = 'Template',
  None = 'None',
}
```

### PrivilegeNumberType (bitwise enum)
`libs/models/permission/enums/vnr-permission.enum.ts`

Maps each privilege to its bit position (power of 2):

```ts
export enum PrivilegeNumberType {
  View         = 1,     // 2^0
  Create       = 2,     // 2^1
  Modify       = 4,     // 2^2
  Delete       = 8,     // 2^3
  Approve      = 16,    // 2^4
  Detail       = 32,    // 2^5
  Attach       = 64,    // 2^6
  Import       = 128,   // 2^7
  Template     = 256,   // 2^8
  ExportTemplate = 512, // 2^9
  CreateTemplate = 1024,// 2^10
  Export       = 2048,  // 2^11
  Chart        = 4096,  // 2^12
  ChangeColumn = 8192,  // 2^13
  Print        = 16384, // 2^14
  None         = 0,
}
```

### Permission Response Shape

The API endpoint (`api/v1/User/permisson`) returns either a plain object or an encrypted payload:

```ts
// Plain (non-production or no encryption)
{ Data: { [resourceKey: string]: string /* hex */ } }

// Encrypted
{ alg: string, iv: string, data: string }
// → decryptResponse(iv, data, alg) → same plain shape
```

Example: resource `"HRM_HRE_EMPLOYEE"` might have value `"0x1F"` (binary `11111`) meaning View + Create + Modify + Delete + Approve are all granted.

### Permission Check Logic
`libs/core/permission/services/permission.service.ts:approvePermission`

```ts
approvePermission(perValue: string, perCheck: string[]): boolean {
  const keyCheck = parseInt(perValue, 16);
  return perCheck.some(role => {
    const permValue = PrivilegeNumberType[role];
    return (keyCheck & permValue) === permValue;
  });
}
```

---

## 2. Initialization Flow

### Bootstrap (Shell)
`apps/shell/src/initialize.ts`

The permission system is bootstrapped via Angular DI at app startup:

```ts
// 1. PERMISSION_INIT token provides the server-side config
{
  provide: PERMISSION_INIT,
  useFactory: (appConfig: IAppConfiguration) => ({
    serverSide: {
      url: `${appConfig.API_URLS.SHARED_SERVICE_API_URL}api/v1/User/permisson`,
      method: 'get',
    },
    permissionActionApi: `${appConfig.API_URLS.PORTAL_API_URL}New_Home/AngularPortal_CheckFullPermissionAction`,
  }),
  deps: [APP_CONFIG],
}

// 2. PERMISSION_SERVICE_TOKEN provides the concrete service
// (PermissionService is also providedIn: 'root' so it self-registers)
```

### PermissionService Lazy Load
`libs/core/permission/services/permission.service.ts`

Permissions are loaded **once** (lazy, on first access) and cached via `shareReplay(1)`. The Observable is created the first time `loadPermissions$()` is called and reused on all subsequent calls:

```
first consumer calls getPermissions$()
  → loadPermissions$() creates myPermission$ (shareReplay(1))
    → requestPermissions(serverSide) → HTTP GET
      → mappingHrmPermissions(response)
        → optional decrypt (alg/iv/data)
        → populate permissionData (Record<string, hexString>)
        → populate permissionsView (Set<string> - keys where View bit is set)
      → setPermissions$() → notify BehaviorSubject
      → isLoading$.next(true)
```

Subsequent callers get the cached result immediately.

### Non-Production Bypass

In non-production environments, SuperAdmins bypass all permission checks:

```ts
public checkPerProduction(): boolean {
  return !this.environment?.production && this.isSuperAdmin;
}
// approvePermission / checkPermissionDetail both check this first
```

`isSuperAdmin` is populated from the NgRx store via `getUser` selector on construction.

---

## 3. Core Services

### PermissionService
`libs/core/permission/services/permission.service.ts` — `@Injectable({ providedIn: 'root' })`

Primary service. Holds the raw permission data and exposes check methods.

| Method | Return | Description |
|--------|--------|-------------|
| `initPermissions(options)` | `void` | Re-initialize with new options (forces reload) |
| `hasPermission(key)` | `boolean` | Does the resource key exist in the permission map at all? |
| `hasPermissionView(key)` | `boolean` | Does the key have the View bit set? (uses `permissionsView` Set — synchronous) |
| `checkPermission(roles, key)` | `boolean` | Synchronous bitwise check. Reads from cached `permissionData` |
| `checkPermission$(roles, key)` | `Observable<boolean>` | Async version — waits for permissions to load first |
| `checkPermissionDetail(roles, key)` | `Observable<Record<string,boolean>>` | Returns a map `{ [role]: boolean }` for multiple roles at once |
| `getPermissions$()` | `Observable<any>` | Returns the full permission data map (waits for load) |
| `getPermissionsView$()` | `Observable<Set<string>>` | Returns the set of keys with View access |
| `isLoadedPermissions$()` | `Observable<boolean>` | Emits `true` once permissions are loaded |
| `clearPermissions()` | `void` | Clears all cached data (called on logout) |
| `approvePermission(perValue, perCheck)` | `boolean` | Core bitwise check logic |
| `checkPerProduction()` | `boolean` | Returns `true` if non-prod SuperAdmin (bypass mode) |

### PermissionFacade
`libs/core/permission/facade/permission.facade.ts` — `@Injectable({ providedIn: 'root' })`

**Signal-based, cached API** for modern Angular components (Angular Signals). Wraps `PermissionService` with TTL caching (default: 5 minutes) and returns `Signal<PermissionMap>` directly usable in templates.

```ts
export type PermissionMap = Partial<Record<PrivilegeType, boolean>>;
```

| Method | Return | Description |
|--------|--------|-------------|
| `permsSig(key, roles, opts?)` | `Signal<PermissionMap>` | Main API. Returns a signal with a map `{ View: bool, Modify: bool, ... }`. Cached by `key::roles`. |
| `permsSigFromKeySig(keySig, roles, opts?)` | `{ permsSig, readySig, loadingSig }` | Dynamic key version — refetches when the key Signal changes |
| `hasPermissionSig(key, roles?, opts?)` | `Signal<boolean>` | Simplified API: returns `true` if any of the roles is granted |
| `hasAllSig(mapSig, ...perms)` | `Signal<boolean>` | Returns `true` only if ALL specified perms are granted |
| `hasAnySig(mapSig, ...perms)` | `Signal<boolean>` | Returns `true` if ANY of the specified perms is granted |
| `refresh(key, roles)` | `void` | Force-invalidate a cache entry and refetch |

**Usage pattern in component:**

```ts
// In component class
protected perms = this.permFacade.permsSig('HRM_EVA_GOAL', [
  PrivilegeType.View, PrivilegeType.Modify, PrivilegeType.Create,
]);

// In template
@if (perms().Modify) { <button>Edit</button> }
@if (perms().Create) { <button>Add</button> }
```

### PermissionUiService
`libs/core/permission/services/permission-ui.service.ts` — `@Injectable({ providedIn: 'root' })`

**Lightweight, template-friendly API** for simple boolean checks. Bridges reactive (Signal) and synchronous (`canNow`) access with TTL caching (default: 30 seconds).

| Method | Return | Description |
|--------|--------|-------------|
| `hasPermissionSig(key, roles?, opts?)` | `boolean` | Returns `true`/`false` synchronously. Uses cached Signal; falls back to `canNow()` if still pending |
| `canNow(key, roles?)` | `boolean` | Purely synchronous snapshot from loaded `permissionData`. Does not wait for load. |
| `refresh(key, roles?)` | `void` | Clears cache + unsubscribes for a given key/roles combo |

---

## 4. Injection Token Pattern

Components that need permission checks inject via the `PERMISSION_SERVICE_TOKEN` injection token (not directly):

```ts
// Token definition
// libs/models/permission/tokens/permission.token.ts
export const PERMISSION_SERVICE_TOKEN = new InjectionToken<IPermissionService>('PERMISSION_SERVICE_TOKEN');

// Injecting in a component
constructor(
  @Inject(PERMISSION_SERVICE_TOKEN) private permissionService: IPermissionService,
) {}
```

This allows mocking in tests and alternative implementations without changing consumer code.

---

## 5. Permission Directive (Template-Level)

### `[vnrPermission]`
`libs/common/directives/permission.directive.ts` — selector: `[vnrPermission]`

A **structural directive** that conditionally renders DOM based on permissions. Works like `*ngIf` but driven by the permission map.

```html
<!-- Show element only if user has Modify permission on the resource -->
<button *vnrPermission="'HRM_HRE_EMPLOYEE'; role: [privilegeType.Modify]">
  Edit Employee
</button>

<!-- Multiple keys — shows if ANY key grants the role -->
<div *vnrPermission="['HRM_HRE_EMPLOYEE', 'HRM_HRE_EMPLOYEE_MODIFY']">
  ...
</div>
```

**Inputs:**
- `vnrPermission: string | string[]` — resource key or array of keys (OR logic)
- `vnrPermissionRole: string[]` — list of `PrivilegeType` to check (default: `[PrivilegeType.View]`)

**Behavior:**
- Subscribes to `permissionService.getPermissions$()` on change
- Calls `approvePermission()` against each key
- Calls `ViewContainerRef.createEmbeddedView()` or `ViewContainerRef.clear()` accordingly

**Import from:** `@hrm-frontend-workspace/common` (`PermissionDirective`)

---

## 6. Route Guard (AuthGuard)

`libs/core/auth/guards/auth.guard.ts`

`AuthGuard` implements `CanActivate` and serves double duty: **authentication** check and **screen-level permission** check.

### Route configuration pattern

```ts
// In app.routes.ts
{
  path: 'employees',
  component: EmployeeListComponent,
  canActivate: [AuthGuard],
  data: {
    permission: 'HRM_HRE_EMPLOYEE',             // resource key
    privilegeType: [PrivilegeType.View],         // required privilege (default: View)
  },
}
```

### AuthGuard logic

```
canActivate(next, state):
  1. Get user from UserFacade
  2. If no user or not authorized → redirect to /auth/login → return false
  3. If next.data.permission is set:
     a. Wait for isLoadedPermissions$() (loads if needed)
     b. Call checkPermission(privilegeTypes, next.data.permission)
     c. If denied:
        - If coming from /login → redirect to DEFAULT_REDIRECT_URL or /auth/403
        - Otherwise → redirect to /auth/403
        - return false
     d. If granted → return true
  4. If no permission data in route → return true (public route)
```

---

## 7. screenPermission in Container Components

Container components (those extending `VnrContainerBaseComponent`) declare a `screenPermission` in their layout config. This key drives the **toolbar button visibility** (standard CRUD buttons are auto-shown/hidden based on the user's privileges for that screen):

```ts
// In a container component's ngOnInit
this.initContainerBase({
  layoutConfig: {
    screenPermission: SYSTEM_RESOURCE.HRM_HRE_EMPLOYEE, // resource key
    title: '...',
    toolbarConfig: this.toolbarConfig,
    gridConfig: this.gridConfig,
  },
});
```

The `VnrContainerBaseComponent` base class uses `PermissionService` internally to check which standard buttons (Create, Edit, Delete, Export, Import, etc.) should be visible.

---

## 8. Resource Key Constants

Each module defines its own resource key constants in a dedicated file, typically:
`apps/<module>/src/app/resources/<module>.resource.ts`

Pattern: `HRM_<MODULE>_<FEATURE>` (uppercase, underscore-separated)

Examples:
```ts
// System module
SYSTEM_RESOURCE.HRM_SYS_PERMISSION
SYSTEM_RESOURCE.HRM_SYS_FEATURES
SYSTEM_RESOURCE.HRM_SYS_SCHEDULE_TASK
SYSTEM_RESOURCE.HRM_SYS_REPORT_EMAIL
SYSTEM_RESOURCE.HRM_SYS_NOTIFICATION_TEMPLATE

// Evaluation module
EVA_RESOURCE.HRM_EVA_GOAL_OVERVIEW_ALLOCATION_BUTTON
EVA_RESOURCE.HRM_EVA_GOAL_OVERVIEW_APPROVE_BUTTON
EVA_RESOURCE.HRM_EVA_GOAL_DETAIL_TABLE
```

These constants are passed to `screenPermission`, `checkPermission()`, `permsSig()`, and `[vnrPermission]`.

---

## 9. Common Usage Patterns

### Pattern A — Synchronous check in component class (simple)

```ts
constructor(
  @Inject(PERMISSION_SERVICE_TOKEN) private permissionService: IPermissionService,
) {}

ngOnInit(): void {
  this.canEdit = this.permissionService.checkPermission(
    [PrivilegeType.Modify],
    SOME_RESOURCE.KEY,
  );
}
```

### Pattern B — Multiple privileges in one call

```ts
this.permissionService
  .checkPermissionDetail([PrivilegeType.View, PrivilegeType.Modify], RESOURCE_KEY)
  .pipe(takeUntil(this.destroy$))
  .subscribe(res => {
    this.canView   = res[PrivilegeType.View];
    this.canModify = res[PrivilegeType.Modify];
  });
```

### Pattern C — Signal-based (modern, preferred in new code)

```ts
protected readonly perms = inject(PermissionFacade).permsSig(
  RESOURCE_KEY,
  [PrivilegeType.View, PrivilegeType.Modify, PrivilegeType.Create, PrivilegeType.Delete],
);

// In template:
// @if (perms().Create) { <button>Add</button> }
```

### Pattern D — Template directive

```html
<button
  *vnrPermission="resourceKey; role: [privilegeType.Modify]"
  (click)="onEdit()">
  Edit
</button>
```

### Pattern E — Dynamic key (key changes at runtime)

```ts
protected readonly resourceKeySig = signal('');

protected readonly { permsSig, readySig } = inject(PermissionFacade)
  .permsSigFromKeySig(this.resourceKeySig, [PrivilegeType.View, PrivilegeType.Modify]);

// When navigating between records:
this.resourceKeySig.set(newResourceKey); // automatically refetches permissions
```

---

## 10. Architecture Summary

```
Shell Bootstrap
└── PERMISSION_INIT token → IPermissionOptions (API URL)
└── PermissionService (root)
    ├── loadPermissions$() → HTTP → mappingHrmPermissions() → permissionData + permissionsView
    ├── approvePermission(hexValue, roles[]) → bitwise AND check
    └── checkPermissionDetail(roles, key) → Observable<Record<role, boolean>>
        │
        ├── PermissionFacade (root) — Signal<PermissionMap> with TTL cache
        ├── PermissionUiService (root) — boolean snapshot + Signal with TTL cache
        └── PermissionDirective ([vnrPermission]) — structural directive
            └── Calls getPermissions$() + approvePermission()

AuthGuard (CanActivate)
└── Checks user auth + route data.permission via PermissionService

Container Components (VnrContainerBaseComponent)
└── layoutConfig.screenPermission → auto-manages toolbar button visibility
```

---

## 11. Key File Locations

| File | Role |
|------|------|
| `libs/models/permission/enums/privilege-type.enum.ts` | `PrivilegeType` string enum |
| `libs/models/permission/enums/vnr-permission.enum.ts` | `PrivilegeNumberType` bitwise enum |
| `libs/models/permission/models/permission.interface.ts` | `IPermissionService` contract |
| `libs/models/permission/models/permission-options.interface.ts` | `IPermissionOptions` / `ServerSideConfig` |
| `libs/models/permission/tokens/permission.token.ts` | `PERMISSION_SERVICE_TOKEN` injection token |
| `libs/models/permission/constants/privilege.constants.ts` | `PERMISSION_DETAIL_PRIVILEGES` full list |
| `libs/core/permission/services/permission.service.ts` | Core service, HTTP load, bitwise check |
| `libs/core/permission/facade/permission.facade.ts` | Signal-based API with TTL cache |
| `libs/core/permission/services/permission-ui.service.ts` | Lightweight synchronous + Signal API |
| `libs/common/directives/permission.directive.ts` | `[vnrPermission]` structural directive |
| `libs/core/auth/guards/auth.guard.ts` | Route guard (auth + screen permission) |
| `apps/shell/src/initialize.ts` | Bootstrap: `PERMISSION_INIT` provider setup |
