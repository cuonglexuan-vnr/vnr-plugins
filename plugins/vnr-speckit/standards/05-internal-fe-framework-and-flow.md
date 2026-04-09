# Vnr Frontend — Internal Framework & Request Flow

---

## 1. Tổng quan kiến trúc Micro-frontend

```
Browser
    │
    ▼
Shell App (port 4200)          src/
    │  Webpack Module Federation Host
    │  Loads config.json / module-config.json / auth-config.json
    │
    ├── Shared Libraries        projects/shared-core, shared-components, shared-module, shared-resources
    │
    └── Remote MFE Apps         projects/<module>/  (port 4201–4210)
            attendance, salary, human-resources, insurance,
            recruitment, canteen, training, talent,
            tenant-management, tenant-portal
```

Mỗi MFE là một Angular remote app độc lập, expose một NgModule qua `remoteEntry.js`. Shell load và mount chúng theo config động.

---

## 2. Shell Bootstrap Flow

**File:** `src/bootstrap.ts` (lazy-loaded từ `src/main.ts`)

**Thứ tự khởi động:**

```
main.ts
    └── import('./bootstrap')
            │
            ├── fetch /assets/config.json          → IAppApiURL (API base URLs)
            │   fallback: GET /New_Home/GetConfigNoJSON
            ├── fetch /assets/module-config.json   → remote MFE definitions
            └── fetch /assets/auth-config.json     → OIDC config
                    │
                    ├── Duyệt module-config → tạo PLATFORM_ROUTES động
                    │       for (const [key, value] of moduleConfig):
                    │           route = { path, loadChildren: loadRemoteModule(...) }
                    │       // Cache-busting: remoteEntry.js?v=<random>
                    │
                    └── platformBrowserDynamic().bootstrapModule(AppModule, {
                            providers: [
                                { provide: PLATFORM_ROUTES, useValue: [platformRoutes] },
                                { provide: API_CONFIG, useValue: apiConfig },
                                { provide: MODULE_CONFIG, useValue: moduleConfig },
                                { provide: AUTH_CONFIG, useValue: authConfig },
                            ]
                        })
```

**DI Tokens cốt lõi được inject từ bootstrap:**

| Token | Interface | Mục đích |
|-------|-----------|---------|
| `PLATFORM_ROUTES` | `Routes[]` | Dynamic routes từ module-config.json |
| `API_CONFIG` | `IAppApiURL` | Tất cả API base URLs của hệ thống |
| `MODULE_CONFIG` | `ModuleConfig` | Remote MFE definitions |
| `AUTH_CONFIG` | `AuthConfig` | OIDC / IdentityServer4 config |

---

## 3. Shell Routing — Static + Dynamic

**File:** `src/app/app-routing.module.ts`

Routing được merge từ 2 nguồn:

```typescript
{
  provide: ROUTES,
  multi: true,
  useFactory: (dynamicRoutes: Routes = []) => {
    return [...APP_ROUTES, ...dynamicRoutes[0]]; // static + dynamic
  },
  deps: [PLATFORM_ROUTES],
}
```

**Static routes** (`src/app/resources/menu/routes.config.ts`):
- `/dashboard`, `/portal`, `/survey`, `/evaluation`, `/systems`, `/translate`, v.v.
- Auth routes: `/auth/login`, `/auth/403`, v.v.
- Tenant redirect logic: nếu `useTenantManagement` → redirect `/tenant-management/dashboard`

**Dynamic routes** (từ `module-config.json` qua `PLATFORM_ROUTES`):
```typescript
// Mỗi entry trong module-config.json tạo ra một route:
{
  path: 'attendance',
  component: LayoutMainComponent,
  loadChildren: () => loadRemoteModule({
    type: 'module',
    remoteEntry: 'http://localhost:4202/remoteEntry.js?v=<cache-bust>',
    exposedModule: './VnrAttendanceModule',
  }).then(m => m.AttendanceModule),
}
```

**Preloading strategy** (`src/app/app-routing-loader.ts`):
```typescript
export class AppPreloader implements PreloadingStrategy {
  preload(route, load) {
    return route.data?.preload ? load() : of(null);
  }
}
```

**AuthGuard** được đặt tại từng lazy-loaded route trong MFE:
```typescript
{
  path: 'leaveday',
  canActivate: [AuthGuard],
  data: { permission: 'New_Att_Leaveday_New_Index_V2' },
  loadChildren: () => import('./pages/att-leaveday/att-leaveday.module').then(m => m.AttLeavedayModule),
}
```

---

## 4. Module Federation Setup

### Shell webpack (`webpack.config.js` / `webpack.prod.config.js`)

```javascript
// Shell là HOST — khai báo remotes
remotes: {
  insurance:        'http://localhost:4201/remoteEntry.js',   // dev
  attendance:       'http://localhost:4202/remoteEntry.js',
  humanResources:   'http://localhost:4203/remoteEntry.js',
  salary:           'http://localhost:4204/remoteEntry.js',
  // ... prod dùng path tương đối: '/attendance/remoteEntry.js'
}

// Shared singletons — bắt buộc eager + singleton + strictVersion
shared: share({
  '@angular/core':     { singleton: true, strictVersion: true, eager: true },
  '@angular/router':   { singleton: true, strictVersion: true, eager: true },
  '@ngrx/store':       { singleton: true, strictVersion: true, eager: true },
  'rxjs':              { singleton: true, strictVersion: true, eager: true },
  'ng-zorro-antd':     { singleton: true, strictVersion: true, eager: true },
  '@shared':           { singleton: true, eager: true },          // shared-core alias
  '@shared-resources': { singleton: true, eager: true },
  // ... ~20 shared libs
})
```

### MFE webpack (ví dụ `projects/attendance/webpack.config.js`)

```javascript
// MFE là REMOTE — expose module
new ModuleFederationPlugin({
  name: 'attendance',
  filename: 'remoteEntry.js',
  exposes: {
    './VnrAttendanceModule': './projects/attendance/src/app/attendance.module.ts',
  },
  shared: share({ /* same shared config as shell */ })
})
```

**Quy tắc:** Mọi thư viện trong `shared` list phải match version giữa shell và MFE — vi phạm gây lỗi runtime.

---

## 5. Cấu trúc bên trong một MFE

Pattern chuẩn cho mọi MFE (ví dụ: `attendance`):

```
projects/attendance/src/app/
├── app.component.ts             ← Root component (standalone bootstrap khi chạy độc lập)
├── app.module.ts                ← Root module (redirects to attendance path)
├── app-routing.module.ts        ← { path: 'attendance', loadChildren: AttendanceModule }
├── attendance.module.ts         ← Module được EXPOSE qua Module Federation
├── attendance-routing.module.ts ← Lazy-load từng feature page
├── pages/                       ← Feature pages (mỗi page là một lazy-loaded module)
│   ├── att-leaveday/
│   ├── att-overtime/
│   ├── att-shift/
│   └── dashboard/
└── shared/                      ← Shared trong MFE này
    ├── api/                     ← Shared API services (dùng chung nhiều pages)
    ├── services/                ← Business logic + Facades dùng chung
    ├── store/                   ← Local NgRx store nếu có
    ├── components/              ← Shared components trong MFE
    ├── models/                  ← TypeScript interfaces
    ├── enums/                   ← Enums và constants
    └── utils/
```

**`attendance.module.ts`** (module được expose):
```typescript
@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    AttendanceRoutingModule,
    TranslateModule.forChild({ extend: true }), // forChild với extend:true
  ],
})
export class AttendanceModule {}
```

**`attendance-routing.module.ts`** (lazy-load feature pages):
```typescript
const routes: Routes = [
  { path: '', component: DashboardComponent },
  {
    path: 'leaveday',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/att-leaveday/att-leaveday.module').then(m => m.AttLeavedayModule),
  },
  {
    path: 'overtime',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/att-overtime/att-overtime.module').then(m => m.AttOvertimeModule),
  },
  // ... 10+ feature pages
];
```

---

## 6. Cấu trúc bên trong một Feature Page

Pattern chuẩn (ví dụ: `att-leaveday`):

```
pages/att-leaveday/
├── att-leaveday.module.ts           ← Feature module (khai báo tất cả components)
├── att-leaveday-routing.module.ts   ← Sub-routes của feature (leaveday-list, approved-leaveday-list...)
├── att-leaveday-shared.module.ts    ← Shared module: providers (APIs, Facades, States) + exports
│
├── att-leaveday-list/               ← Sub-feature: danh sách đơn nghỉ phép
│   ├── container/
│   │   └── att-leaveday-container.component.ts   ← Smart Component (logic)
│   ├── components/
│   │   └── att-leaveday-list/
│   │       └── att-leaveday-list.component.ts    ← Dumb Component (UI)
│   ├── api/
│   │   └── att-leaveday-list.api.ts              ← API Service
│   ├── state/
│   │   └── att-leaveday-list.state.ts            ← Local BehaviorSubject state
│   └── att-leaveday-list.facade.ts               ← Facade
│
└── att-approved-leaveday-list/      ← Sub-feature: duyệt đơn nghỉ phép
    ├── container/ ...
    ├── components/ ...
    ├── api/ ...
    └── att-approved-leaveday-list.facade.ts
```

**Module pattern:**
```typescript
// att-leaveday.module.ts
@NgModule({
  imports: [AttLeavedayRoutingModule, AttLeavedaySharedModule],
  declarations: [
    AttLeavedayContainerComponent,
    AttLeavedayListComponent,
    AttApprovedLeavedayContainerComponent,
    // ... tất cả components của feature
  ],
})
export class AttLeavedayModule {}

// att-leaveday-shared.module.ts — tập trung khai báo providers
@NgModule({
  imports: [CommonModule, AttSharedModule],
  providers: [
    AttLeavedayListApi,
    AttLeavedayFacade,
    AttLeavedayListState,
    AttApprovedLeavedayListApi,
    AttApprovedLeavedayFacade,
    // ... tất cả API/Facade/State của feature
  ],
  exports: [AttSharedModule, ...SHARED_COMPONENTS],
})
export class AttLeavedaySharedModule {}
```

**Routing sub-feature với permission guard:**
```typescript
const routes: Routes = [
  {
    path: 'leaveday-list',
    canActivate: [AuthGuard],
    component: AttLeavedayContainerComponent,
    data: {
      title: 'attendance.leaveDay.index',
      permission: AttScreenPermission.New_Att_Leaveday_New_Index_V2, // enum key
    },
    resolve: { loadDataSuggestLeavedayResolver: LoadDataSuggestLeavedayResolver },
  },
  { path: 'approved-leaveday-list', canActivate: [AuthGuard], ... },
  { path: 'manager-leaveday', canActivate: [AuthGuard], ... },
];
```

---

## 7. Container / Presentational Component Pattern

### Container (Smart Component) — Business Logic

```typescript
@Component({ selector: 'app-att-approved-leaveday-container', ... })
export class AttApprovedLeavedayContainerComponent implements OnInit, OnDestroy {
  // State
  currentTab = EnumAttLeavedayApprovedFilterTab.ATT_TAB_PENDING;
  tabCount: TabCount[];
  searchChange: any = {};
  private destroyed$ = new Subject<boolean>();

  // API URLs được inject từ API_CONFIG token
  apiGridPending = `${this.appConfig.ATT_API_URL}api/Att_LeaveDay/New_GetLeaveDayApproveByFilter`;
  apiGridApproved = `${this.appConfig.ATT_API_URL}api/Att_LeaveDay/New_GetLeaveDayApprovedByFilter`;

  constructor(
    @Inject(API_CONFIG) private appConfig: IAppApiURL,
    private facade: AttApprovedLeavedayFacade,
    private router: Router,
    private route: ActivatedRoute,
    private stateNotification: StateNotification,
  ) {}

  ngOnInit(): void {
    this.loadCountData();
  }

  loadCountData(): void {
    this.facade.getCountDataGridLeaveDayApprove(this.searchChange)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(res => {
        this.tabCount = [
          { id: EnumAttLeavedayApprovedFilterTab.ATT_TAB_PENDING, count: res.CountWaitApprove },
          { id: EnumAttLeavedayApprovedFilterTab.ATT_TAB_APPROVED, count: res.CountApproved },
        ];
      });
  }

  onSelectTab(tab): void {
    this.currentTab = tab;
    // Update child component config based on tab
  }

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }
}
```

### Presentational (Dumb Component) — UI Only

```typescript
@Component({ selector: 'app-att-approved-leaveday-list', ... })
export class AttApprovedLeavedayListComponent extends BaseComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @Input() variable: LeavedayApprovedListVariable;  // config từ container
  @Input() tokenEncodedParam: string;
  @Output() searchChange = new EventEmitter<any>();
  @Output() reloadCountData = new EventEmitter<void>();

  @ViewChild('gridVnr') gridVnr: VnrGridComponent; // Reference đến VnrGrid

  ngOnInit(): void {
    this.initGridOptions();
  }

  onApproveRow(row: any): void { /* gọi qua facade → emit event lên container */ }
  onGridDataBound(): void { /* xử lý sau khi grid load data */ }
}
```

---

## 8. API Service Pattern

**Base class:** `VnrResourceService<T>` (`core/@vnr/services/vnr-resource.service.ts`)

```typescript
// Khai báo API service
@Injectable()
export class AttLeavedayListApi extends VnrResourceService<any> {
  constructor(
    @Inject(API_CONFIG) protected appConfig: IAppApiURL,
    protected injector: Injector,
  ) {
    super(appConfig.ATT_API_URL, injector); // base URL
  }

  getResource(): string {
    return 'api/Att_LeaveDay'; // resource path
  }

  // Custom methods dùng vnrSendRequest
  getLeaveDayList(body: any): Observable<any> {
    return this.vnrSendRequest('POST',
      this.appConfig.ATT_API_URL + this.getResource() + '/New_GetLeaveDayByFilter',
      { body, isNoNoti: true }
    );
  }

  // Inherited CRUD methods từ VnrResourceService:
  // vnrGetList(params?)  vnrAdd(body)  vnrUpdate(id, body)
  // vnrDelete(id)        vnrPatch(id, body)
}
```

**VnrResourceService options (`VnrResourceSendRequestOptions`):**

| Option | Ý nghĩa |
|--------|---------|
| `body` | Request body |
| `params` | Query params |
| `headers` | Custom headers |
| `isNoNoti` | Tắt notification khi call |
| `allowCustom` | Cho phép custom behavior |

**Quy tắc đặt tên method trong API service:**

| Pattern | Ví dụ |
|---------|-------|
| GET list | `getXxxList(params)` |
| GET single | `getXxxById(id)` |
| POST data | `createXxx(body)` / `processXxx(body)` |
| Validate | `validateXxx(body)` |
| Action | `setApproveXxx(body)` / `setRejectXxx(body)` |

---

## 9. Facade Pattern

**Vai trò:** Bọc API service, xử lý response transformation, inject store state.

```typescript
@Injectable()
export class AttApprovedLeavedayFacade {
  userID: string;

  constructor(
    private api: AttApprovedLeavedayListApi,
    private store: Store<any>,
  ) {
    // Lấy user state từ NgRx global store
    this.store.pipe(select(Reducers.getUser))
      .subscribe(state => { this.userID = state.userid; });
  }

  // Pass-through đơn giản
  validateApprove(params: ValidateApproveLeaveday): Observable<any> {
    return this.api.checkValidateApproveLeaveDay(params);
  }

  // Transformation — extract Data field từ response
  getCountData(params: any): Observable<any> {
    return this.api.getCountDataGridLeaveDayApprove(params)
      .pipe(map(result => result['Data']));
  }

  // Business logic với user context
  approveWithUser(params: any): Observable<any> {
    return this.api.setApprove({ ...params, userID: this.userID });
  }
}
```

**Hierarchy:**

```
Container Component
    └── Facade (injectable service)
            ├── API Service (extends VnrResourceService)
            │       └── HttpClient (qua vnrSendRequest)
            └── Store (NgRx — đọc global state)
```

---

## 10. Local State Pattern (BehaviorSubject)

Dùng cho client-side state trong feature page, thay thế NgRx khi state chỉ dùng trong 1 feature:

```typescript
@Injectable()
export class AttLeavedayListState {
  private updating$ = new BehaviorSubject<boolean>(false);
  private leaveDayTabs$ = new BehaviorSubject<LeavedayListFilterTabs[]>(null);

  // Getters
  isUpdating$() { return this.updating$.asObservable(); }
  getLeaveDayTabs$() { return this.leaveDayTabs$.asObservable(); }

  // Setters
  setUpdating(val: boolean) { this.updating$.next(val); }
  setLeaveDayTabs(tabs: LeavedayListFilterTabs[]) { this.leaveDayTabs$.next(tabs); }

  // CRUD trên local list
  addTab(tab: LeavedayListFilterTabs) {
    const current = this.leaveDayTabs$.getValue();
    this.leaveDayTabs$.next([...current, tab]);
  }

  updateTab(updated: LeavedayListFilterTabs) {
    const tabs = this.leaveDayTabs$.getValue().map(t =>
      t.id === updated.id ? updated : t
    );
    this.leaveDayTabs$.next(tabs);
  }

  removeTab(tab: LeavedayListFilterTabs) {
    this.leaveDayTabs$.next(
      this.leaveDayTabs$.getValue().filter(t => t !== tab)
    );
  }
}
```

---

## 11. NgRx Global Store

**File:** `projects/shared-core/core/@vnr-store/reducers.ts`

**Root store:**

```typescript
export const reducers: ActionReducerMap<any> = {
  router:      fromRouter.routerReducer,
  settings:    fromSettings.reducer,   // theme, locale, systemsSettings
  systems:     fromSystems.reducer,    // feature flags, system config
  user:        fromUser.reducer,       // auth state
  profileForm: profileForm.reducer,    // HR profile form state
};
```

**Selectors:**
```typescript
export const getUser = createSelector(
  createFeatureSelector<any>('user'),
  fromUser.getUser
);
export const getSettings = createSelector(...);
```

**User state model:**

| Field | Mô tả |
|-------|-------|
| `authorized` | Đã đăng nhập |
| `authorizedPortal` | Portal auth status |
| `userid` | UserID (Guid) |
| `userlogin` | UserLogin string |
| `ProfileID` | Hre_Profile.ID của user |
| `IsSupperAdmin` | Flag superadmin |
| `languagecode` | Ngôn ngữ |
| `token` / `Authorization` | JWT token |

**User Effects — init flow:**
```typescript
ngrxOnInitEffects(): Action {
  return { type: LOAD_CURRENT_ACCOUNT }; // Tự động chạy khi app init
}

// LOAD_CURRENT_ACCOUNT → CheckSessionService.getSession()
//   → decode JWT → dispatch LoginPotal → user state populated
```

**Settings state** lưu trong `localStorage` và sync qua `STORED_SETTINGS`:
- `locale`: 'VN' | 'EN' | 'CN'
- `theme`, `primaryColor`, `menuLayoutType`
- `systemsSettings`: `dateFormat`, `startDayOfTheWeek`, `weekStartsOn`, `timeFormat`

---

## 12. API Service Configuration — `IAppApiURL`

**File:** `core/@vnr-resources/models/api-url.interface.ts`

Tất cả API base URLs được inject qua `API_CONFIG` token:

| Field | Ý nghĩa |
|-------|---------|
| `API_URL` | Base URL chính (HRM.Presentation.Main) |
| `SERVICE_API_URL` | ServiceCenter API |
| `SYS_SERVICE_API_URL` | System service API |
| `AUTH_API_URL` | Auth service API (IdentityServer) |
| `ATT_API_URL` | Attendance module API |
| `SAL_API_URL` | Salary module API |
| `HRE_API_URL` | HR module API |
| `INS_API_URL` | Insurance module API |
| `REC_API_URL` | Recruitment API |
| v.v. | |

---

## 13. VNR-Module Framework (Design System)

Hệ thống UI component gồm **hai tầng** — phải hiểu rõ để import đúng:

| Tầng | Nguồn | Import qua | Selector prefix |
|------|-------|------------|-----------------|
| **vnr-module package** | `Vnr.Dev.Package.Controls-v02` | `VnrModuleModule` từ `@shared-module` | `vnr-grid`, `vnr-input`, `vnr-combobox`, v.v. |
| **@shared VNR library** | `Frontend/projects/shared-core/core/@vnr/components/` | `VnrCoreModule` từ `@shared` | `vnr-button`, `vnr-toolbar`, `vnr-select-emp`, v.v. |

**Import trong shared module của feature:**
```typescript
import { SharedModule, VnrModuleModule } from '@shared-module';  // vnr-module package
import { VnrCoreModule } from '@shared';                          // @shared vnr components
```
Hầu hết các MFE đã tập hợp sẵn trong `AttSharedModule` (hoặc tương tự mỗi module).

---

### 13.1 Factory + Builder Pattern (vnr-module package)

Mọi component trong `vnr-module` đều dùng **Factory singleton → Builder object** để cấu hình:

```typescript
// Import factories
import { VnrInputFactory }  from 'vnr-module/components/inputs';
import { VnrSelectFactory } from 'vnr-module/components/selects';
import { VnrPickerFactory } from 'vnr-module/components/pickers';
import { VnrUploadFactory } from 'vnr-module/components/uploads';
import { VnrGridFactory }   from 'vnr-module/components/grids';  // ít dùng trực tiếp

// Khởi tạo factory (singleton) — đặt ở class field
private inputFactory  = VnrInputFactory.init();
private selectFactory = VnrSelectFactory.init();
private pickerFactory = VnrPickerFactory.init();
private uploadFactory = VnrUploadFactory.init();

// Tạo builders trong ngOnInit() hoặc initBuilder()
ngOnInit(): void {
  this.builderName    = this.inputFactory.builderTextBox({ label: '...', ... });
  this.builderType    = this.selectFactory.builderComboBox({ textField: 'Text', valueField: 'Value', ... });
  this.builderDate    = this.pickerFactory.builderDatePicker({ label: '...', ... });
  this.builderFile    = this.uploadFactory.builderUploadV2({ saveUrl: '...', ... });
}
```

**Template — truyền builder vào component:**
```html
<vnr-input    [builder]="builderName"    formControlName="Name"></vnr-input>
<vnr-combobox [builder]="builderType"    formControlName="TypeID"></vnr-combobox>
<vnr-datepicker [builder]="builderDate"  formControlName="Date"></vnr-datepicker>
```

**Tất cả components đều:**
- Implement `ControlValueAccessor` → hỗ trợ `formControlName` và `[(ngModel)]`
- Extend `VnrActionBase` → tự động validate, hiện/ẩn error message
- Output `(vnrChange)` emit khi value thay đổi

---

### 13.2 Grid Components

**Import:**
```typescript
import { VnrGridComponent, VnrGridEditIncellComponent, VnrGridEditInlineComponent }
  from 'vnr-module/components/grids';
```

#### `<vnr-grid>` — Read-only Grid với server-side data

```html
<vnr-grid
  #vnrGrid
  [vnrDataColumn]="columns"
  [vnrFilterServer]="{ apiServer: apiUrl, method: 'POST', data: filterParams }"
  [vnrGridName]="'My_Grid_Key'"
  [vnrPageSize]="20"
  [vnrGridHeight]="500"
  [vnrShowEdit]="false"
  [vnrShowDelete]="false"
  [vnrShowChecked]="true"
  [vnrCheckboxOnly]="true"
  [vnrSelectKey]="'ID'"
  [vnrGroupableEnabled]="true"
  [vnrCustomTemplateByColumn]="tplCustom"
  [vnrFuncRowClass]="rowClassFn"
  [vnrApiExportExcelAll]="exportUrl"
  (getSelectedID)="onSelectionChange($event)"
  (getSelectedDataItem)="onSelectionDataChange($event)"
  (vnrDoubleClick)="onOpenDetail($event)"
  (vnrCellClick)="onCellClick($event)"
  (vnrViewModeGrid)="onViewModeChange($event)"
></vnr-grid>
```

**Các @Input quan trọng:**

| Input | Type | Mặc định | Mô tả |
|-------|------|---------|-------|
| `vnrDataColumn` | `IVnrGridColumns[]` | `[]` | Định nghĩa cột (local hoặc từ API) |
| `vnrFilterServer` | `IVnrGridServer` | — | Config API endpoint + data filter |
| `vnrConfigColumn` | `IVnrConfigColumns` | — | API lấy column config động |
| `vnrGridName` | `string` | — | Key để lưu/load cấu hình cột |
| `vnrPageSize` | `number` | `50` | Số row mỗi trang |
| `vnrGridHeight` | `number` | `400` | Chiều cao grid (px) |
| `vnrShowEdit` | `boolean` | `true` | Hiện nút Edit |
| `vnrShowDelete` | `boolean` | `true` | Hiện nút Delete |
| `vnrShowChecked` | `boolean` | `true` | Hiện checkbox |
| `vnrCheckboxOnly` | `boolean` | `true` | Chỉ chọn bằng checkbox |
| `vnrSelectKey` | `string` | `'ID'` | Field làm primary key |
| `vnrGroupableEnabled` | `boolean` | `false` | Cho phép group theo cột |
| `vnrAutobind` | `boolean` | `true` | Tự load data khi init |
| `vnrCustomTemplateByColumn` | `TemplateRef` | — | Custom cell template theo cột |
| `vnrFuncRowClass` | `Function` | — | Function trả về CSS class cho row |
| `vnrApiExportExcelAll` | `string` | — | URL export Excel toàn bộ |
| `vnrCalcRowHeight` | `number` | — | Chiều cao row tùy chỉnh |

**@Output:**

| Output | Emit type | Khi nào |
|--------|-----------|---------|
| `getSelectedID` | `string[]` | Chọn/bỏ chọn row |
| `getSelectedDataItem` | `any[]` | Chọn/bỏ chọn row (full object) |
| `getDataItem` | `any` | Click vào row |
| `vnrEdit` | `any` | Click Edit |
| `vnrDelete` | `any` | Click Delete |
| `vnrDoubleClick` | `any` | Double-click row |
| `vnrCellClick` | `any` | Click cell |
| `vnrViewModeGrid` | `number` | Đổi view mode |

**ViewChild để reload:**
```typescript
@ViewChild('vnrGrid') vnrGrid: VnrGridComponent;
this.vnrGrid.reload();           // Reload data từ server
this.vnrGrid.clearSelection();   // Bỏ chọn tất cả
```

---

#### Column Data Structure (`IVnrGridColumns`)

```typescript
// Mỗi column trong vnrDataColumn:
{
  Name: 'ProfileName',           // Tên field trong data (bắt buộc)
  HeaderKey: 'attendance.leaveDay.grid.employee', // i18n key cho header
  HeaderName: 'Employee Name',   // Fallback text nếu không có i18n
  Width: 200,                    // Px
  Hidden: false,                 // Ẩn/hiện
  Locked: false,                 // Lock cột (không scroll)
  Sortable: true,
  Filter: true,
  Group: false,
  Sum: false,
  Format: null,                  // Format string (e.g., '{0:n2}' cho số)
  isNumber: false,               // Căn phải
  OrderColumn: null,             // Thứ tự
  RowOnPage: '20',
  TypeControl: 'TextBox',        // Dùng cho edit mode (VnrGridEditControlsType)
  Required: false,
  Disable: false,
}
```

**`VnrGridEditControlsType`** (dùng cho `TypeControl` trong edit grid):
`TextBox` | `ComboBox` | `CheckBox` | `DatePicker` | `InputNumber` | `InputMoney` | `TextArea` | `Switch` | `MultiSelect` | `AutoComplete` | `Org` | `TreeViewV2` | `TreeView` | `CustomControl`

---

#### `<vnr-grid-Edit-Incell>` — In-cell Editing

```html
<vnr-grid-Edit-Incell
  [vnrDataColumn]="columns"
  [vnrDataGridLocal]="localData"
  [vnrEditUrl]="saveApiUrl"
  [vnrShowMessenger]="true"
  [vnrReadonlyColumns]="['Code', 'ProfileName']"
  [vnrBuilderConfigByColumn]="{ 'Amount': { typeControl: 'InputMoney' } }"
  (vnrDeleteEvent)="onDelete($event)"
></vnr-grid-Edit-Incell>
```

**Key inputs thêm so với vnr-grid:**

| Input | Mặc định | Mô tả |
|-------|---------|-------|
| `vnrEditUrl` | — | API endpoint để save cell |
| `vnrReadonlyColumns` | `[]` | Các cột không cho sửa |
| `vnrBuilderConfigByColumn` | `{}` | Config builder theo tên cột |
| `vnrAllowEditOtherCell` | `false` | Cho phép edit ô khác khi đang edit |
| `vnrShowSaveChanges` | `true` | Hiện nút Save Changes |

---

#### `<vnr-grid-Edit-Inline>` — Inline Row Editing

```html
<vnr-grid-Edit-Inline
  [vnrDataColumn]="columns"
  [vnrDataGridLocal]="localData"
  [vnrEditUrl]="saveApiUrl"
  [vnrShowEdit]="true"
  [vnrShowDelete]="true"
  [isShowDeleteRow]="true"
  [vnrSaveLocal]="false"
  [vnrDefaultEdit]="false"
  [vnrBuilderConfigByColumn]="editBuilderConfig"
  (vnrEdit)="onRowEdit($event)"
  (vnrDeleteEvent)="onRowDelete($event)"
></vnr-grid-Edit-Inline>
```

**Key inputs thêm:**

| Input | Mặc định | Mô tả |
|-------|---------|-------|
| `vnrEditUrl` | — | API endpoint save row |
| `vnrSaveLocal` | `true` | Save local trước khi gửi server |
| `vnrEditAllRow` | `false` | Cho phép edit nhiều row cùng lúc |
| `vnrDefaultEdit` | `true` | Tất cả row ở trạng thái edit |
| `vnrEnableEditRowClick` | `false` | Click row để edit |
| `vrnShowAddRowGroupData` | `true` | Hiện nút thêm row theo group |

---

### 13.3 Input Components

**Module:** `VnrInputsModule` (từ `vnr-module/components/inputs`)

| Selector | Builder method | Mô tả |
|----------|---------------|-------|
| `<vnr-input>` | `inputFactory.builderTextBox({})` | Text input |
| `<vnr-inputnumber>` | `inputFactory.builderInputNumber({})` | Số nguyên/thập phân |
| `<vnr-input-money>` | `inputFactory.builderInputMoney({})` | Tiền tệ (tự format) |
| `<vnr-input-money-range>` | `inputFactory.builderInputMoneyRange({})` | Range tiền |
| `<vnr-rangenumber>` | `inputFactory.builderRangeNumber({})` | Range số |
| `<vnr-textarea>` | `inputFactory.builderTextArea({})` | Multiline text |
| `<vnr-editor>` | `inputFactory.builderEditor({})` | Rich text (SummerNote) |
| `<vnr-switch>` | `inputFactory.builderSwitch({})` | Toggle on/off |
| `<vnr-checkbox>` | `inputFactory.builderCheckBox({})` | Checkbox |
| `<vnr-checkbox-label>` | `inputFactory.builderCheckBoxLabel({})` | Checkbox với label |
| `<vnr-radiobutton>` | `inputFactory.builderRadioButton({})` | Radio button group |
| `<vnr-colorpicker>` | `inputFactory.builderColorPicker({})` | Color picker |
| `<vnr-masked-textbox>` | `inputFactory.builderMaskedTextbox({})` | Masked input |

**Directive thêm cho `vnr-input`:**
```html
<!-- Paste từ Excel: tab-separated → comma-separated -->
<vnr-input [builder]="builder" formControlName="Codes" initExcel></vnr-input>
```

**Config chung của mọi input builder:**
```typescript
{
  label: 'HRM_Key_For_Translate',  // i18n key hoặc text trực tiếp
  placeholder: '...',
  disabled: false,
  required: false,                  // false — validation phải set qua FormControl
  tooltipTitle: '...',
  showLabelInside: false,           // Label nằm trong control
  options: {
    hasFeedBack: true,              // Hiện icon validation
    allowClear: true,               // Nút xóa
    hiddenValidationMessage: false, // Ẩn message lỗi
    layout: { label: 24, control: 24 }, // nz-col span
  }
}
```

**Config riêng cho `builderTextArea`:**
```typescript
inputFactory.builderTextArea({ label: '...', rows: 3 })
```

**Config riêng cho `builderInputNumber`:**
```typescript
// Precision được set qua @Input trực tiếp (không qua builder)
<vnr-inputnumber [builder]="builder" [vnrPrecision]="2" formControlName="Rate"></vnr-inputnumber>
```

---

### 13.4 Select / ComboBox Components

**Module:** `VnrSelectsModule` (từ `vnr-module/components/selects`)

| Selector | Builder method | Mô tả |
|----------|---------------|-------|
| `<vnr-combobox>` | `selectFactory.builderComboBox({})` | Dropdown single-select |
| `<vnr-multiselect>` | `selectFactory.builderMultiSelect({})` | Multi-select dropdown |
| `<vnr-treeview>` | `selectFactory.builderTreeView({})` | Hierarchical tree |
| `<vnr-treeview-v2>` | `selectFactory.builderTreeViewV2({})` | Tree v2 |
| `<vnr-treeview-panel>` | `selectFactory.builderTreeViewPanel({})` | Tree panel |
| `<vnr-autocomplete>` | `selectFactory.builderAutoComplete({})` | Autocomplete |
| `<vnr-org>` | `selectFactory.builderOrg({})` | Org structure selector |
| `<vnr-cascader>` | `selectFactory.builderCascader({})` | Cascaded dropdown |

**Config chung:**
```typescript
{
  label: '...',
  textField: 'Text',     // Tên field hiển thị trong dropdown
  valueField: 'Value',   // Tên field làm value (bind vào form)
  placeholder: '...',
  disabled: false,
  autoBind: true,        // Tự load data khi init
  dataSource: [...],     // Local data (array)
  serverSide: {          // Hoặc remote data
    urlApi: `${appConfig.ATT_API_URL}api/xxx/GetEnum`,
    method: 'GET',
    data: { text: 'EnumName' },
  },
  searchParam: 'text',   // Param name khi search server-side
  options: {
    allowValueObject: true,  // Value là cả object thay vì chỉ valueField
    serverSearch: false,     // Tắt search phía server
    maxTagCount: 5,          // Số tag hiện tối đa (multiselect)
  }
}
```

**@Output quan trọng của vnr-combobox:**
```typescript
(selectText)="onSelectText($event)"         // Emit text khi chọn
(selectDataItem)="onSelectItem($event)"     // Emit full data item
(vnrInit)="onComboInit($event)"             // Emit reference component khi init
(vnrOpen)="onOpen($event)"                 // Emit khi mở dropdown
```

**Cascade giữa 2 combobox:**
```html
<vnr-combobox [builder]="builderProvince" formControlName="ProvinceID"></vnr-combobox>
<vnr-combobox [builder]="builderDistrict"
              [vnrCascadeFrom]="form.controls['ProvinceID']"
              [vnrCascadeField]="'ProvinceID'"
              formControlName="DistrictID">
</vnr-combobox>
```

**`vnr-org`** — chuyên dùng cho cây phòng ban:
```html
<vnr-org
  [builder]="builderOrg"
  [vnrUrlTreeView]="url"
  formControlName="OrgStructureIDs"
  (ngModelChange)="onOrgChange($event)">
</vnr-org>
```

---

### 13.5 Picker Components (Date/Time)

**Module:** `VnrPickersModule` (từ `vnr-module/components/pickers`)

| Selector | Builder method | Mô tả |
|----------|---------------|-------|
| `<vnr-datepicker>` | `pickerFactory.builderDatePicker({})` | Chọn ngày |
| `<vnr-daterangepicker>` | `pickerFactory.builderDateRangePicker({})` | Chọn khoảng ngày |
| `<vnr-datetimepicker>` | `pickerFactory.builderDateTimePicker({})` | Ngày + giờ |
| `<vnr-timepicker>` | `pickerFactory.builderTimePicker({})` | Chỉ giờ |

```typescript
// DateRangePicker — placeholder là array
pickerFactory.builderDateRangePicker({
  label: 'HRM_DateRange_Label',
  placeholder: ['Từ ngày', 'Đến ngày'],
})
```

**`isUsingFormatSettings`** (default `true`) — tự động dùng format từ system settings (dd/MM/yyyy, MM/dd/yyyy, v.v.):
```html
<vnr-datepicker [builder]="builder" [isUsingFormatSettings]="true" formControlName="Date"></vnr-datepicker>
```

**Output:**
```html
<vnr-datepicker (calendarChange)="onDateChange($event)"></vnr-datepicker>
```

---

### 13.6 Upload Component

**Module:** `VnrUploadsModule` (từ `vnr-module/components/uploads`)

```html
<vnr-upload-v2
  #vnrUpload
  [builder]="builderFileAttach"
  formControlName="FileAttach">
</vnr-upload-v2>
```

```typescript
@ViewChild('vnrUpload') vnrUpload: VnrUploadV2Component;

builderFileAttach = this.uploadFactory.builderUploadV2({
  label: 'HRM_Label_FileAttach',
  saveUrl: `${this.appConfig.ATT_API_URL}api/Sys_Common/UploadChunk`,
  removeUrl: `${this.appConfig.ATT_API_URL}api/Sys_Common/Chunk_Upload_Remove`,
  autoUpload: true,
  multiple: true,
  disabled: false,
  accept: '.pdf,.xls,.xlsx,.doc,.docx',
  options: {
    hasFeedBack: false,
    showUploadList: {
      showPreviewIcon: false,
      showRemoveIcon: true,
      showDownloadIcon: false,
    },
  },
});
```

---

### 13.7 Form Validation (vnr-module)

Mọi component đều tự validate khi form submit nhờ `VnrActionBase`. Không cần gọi manually.

**Custom validators:**
```typescript
import { CustomValidators } from 'vnr-module/components/validation';

form = new FormGroup({
  checkboxes: new FormArray([...])
}, { validators: CustomValidators.atLeastOneCheckboxCheckedValidator(1) });
```

**Validate status trên component:**
```typescript
// component.validateStatus: 'error' | 'success' | 'warning' | 'validating'
// component.invalid$: Observable<boolean>
// component.failures$: Observable<string[]>
```

---

### 13.8 @shared VNR Components (`VnrCoreModule`)

Các component này nằm trong `Frontend/projects/shared-core/core/@vnr/components/`, import qua `VnrCoreModule` từ `@shared`:

#### `<vnr-button>` — Standard Button

```html
<vnr-button
  leftToolbar
  [vnrType]="'green'"              <!-- 'default' | 'primary' | 'danger' | 'green' | 'vocano' -->
  [vnrIcon]="'check'"
  [vnrText]="'attendance.leaveDay.approveBtn' | translate"
  [vnrShowButton]="showBtnApprove && listSelected.length > 0"
  (vnrClick)="onApprove()"
  *vnrPermission="permKey; role: [privilegeType.View]"
></vnr-button>
```

#### `<vnr-toolbar>` — Grid Toolbar Container

```html
<vnr-toolbar
  [vnrGridRef]="vnrGrid"
  [vnrShowChangeColumn]="isSupperAdmin"
  [vnrShowConfig]="isSupperAdmin"
  [isBackGroundToolbar]="true"
  [vnrChangeColumnNew]="true"
  [VnrPermissionChangeColumn]="screenPermissionKey"
  (vnrChangeColumn)="onChangeColumn($event)"
>
  <!-- Đặt vnr-button con vào đây -->
  <vnr-button leftToolbar ...></vnr-button>
  <vnr-button rightToolbar ...></vnr-button>
</vnr-toolbar>
```

#### `<vnr-grid-search-form>` — Search Form Container

```html
<vnr-grid-search-form
  [gridRef]="vnrGridRef"
  [isDrawer]="vnrIsDrawer"
  [vnrWithDrawer]="686"
>
  <form nz-form *vnrGridSearchContent [formGroup]="searchForm">
    <!-- form controls -->
  </form>
</vnr-grid-search-form>
```

#### `<vnr-select-emp>` — Employee Selector

```html
<vnr-select-emp
  [builder]="builderStaff"
  formControlName="ProfileIDs"
  [isShowCheckAll]="false"
  [vnrAdvanceSearch]="false"
  [vnrNoColon]="true"
  (ngModelChange)="onEmpChange($event)">
</vnr-select-emp>
```

Builder dùng `selectFactory.builderMultiSelect({...})` với server-side config.

#### `<vnr-dynamic-control>` — Generic Form Control

```html
<vnr-dynamic-control
  [form]="form"
  [nameControl]="'OrgStructureID'"
  [control]="'Org'"
  [config]="{ label: 'Phòng ban', placeholder: 'Chọn' }">
</vnr-dynamic-control>
```

Supported `control` values: `TextBox` | `ComboBox` | `MultiSelect` | `AutoComplete` | `DatePicker` | `DateRangePicker` | `TimePicker` | `Org` | `InputMoney` | `InputNumber` | `RangeNumber` | `Editor` | `ColorPicker` | `CheckBox` | `RadioButton` | `Upload` | `TreeView` | `TextArea` | `Switch`

#### `<vnr-filter-advance>` — Advanced Filter

```typescript
@ViewChild('filterAdvance') filterAdvance: VnrFilterAdvanceComponent;
@Output() onChange = new EventEmitter<any>();

filterAdvance.patchValue(data);       // Set giá trị từ ngoài
filterAdvance.clearAllFilter(false);  // Reset không emit
filterAdvance.getDataForm();          // Lấy current value
```

#### Các component thường dùng khác

| Selector | Mô tả |
|----------|-------|
| `<vnr-alert>` | Alert/notification banner |
| `<vnr-comment>` | Comment thread |
| `<vnr-modal-upload-file>` | Upload modal popup |
| `<vnr-spreadsheet>` | Editable spreadsheet |
| `<vnr-advanced-emp-search>` | Popup tìm nhân viên nâng cao |
| `<vnr-button-camera>` | Chụp ảnh từ webcam |
| `<vnr-grid-button-action>` | Nút action trong cột grid |
| `<vnr-grid-configs>` | Config cột grid (SuperAdmin only) |
| `<vnr-popup-result>` | Popup hiển thị kết quả |
| `<vnr-setting-config>` | Cấu hình thứ tự field search |

---

## 14. HTTP Interceptor & Error Handling

**File:** `core/@vnr-services/common/http-error-interceptor.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private notification: NzNotificationService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      retry(1), // Retry 1 lần khi fail
      catchError((error: HttpErrorResponse) => {
        const msg = error.error instanceof ErrorEvent
          ? error.error.message           // Client-side error
          : `Error ${error.status}: ${error.message}`;  // Server-side error
        this.notification.error('ERROR HTTP', msg);
        return throwError(msg);
      })
    );
  }
}
```

---

## 15. Internationalization (i18n)

**Pattern:**
- Root module: `TranslateModule.forRoot(loader)` với `MultiTranslateHttpLoader`
- Feature module: `TranslateModule.forChild({ extend: true })` — merge translations

**MultiTranslateHttpLoader** — loader với caching:
- Tải translations từ `/assets/i18n/<lang>.json` + API `GetLangPortalNew`
- Cache trong **IndexedDB** với TTL 1 giờ
- Merge nhiều file translation vào 1 object
- Global access: `window['vnrLangKeys']`

**Locale mapping:**

| localStorage value | Angular locale |
|-------------------|----------------|
| `'VN'` | `vi` |
| `'EN'` | `en` |
| `'CN'` | `zhCN` |

**Dùng trong template:**
```html
{{ 'attendance.leaveDay.index' | translate }}
```

**Dùng trong component:**
```typescript
constructor(private translate: TranslateService) {}
this.translate.instant('attendance.leaveDay.registerSuccess');
```

---

## 16. Permission (tóm tắt — chi tiết trong 03-data-and-auth.md)

**Route-level:** `AuthGuard` với `data.permission` key
```typescript
{ path: 'leaveday', canActivate: [AuthGuard], data: { permission: 'Att_Leaveday_Index' } }
```

**Template-level:** `*vnrPermission` directive
```html
<button *vnrPermission="'Att_Leaveday_Create'; role:['Create']">Tạo đơn</button>
```

**Screen permission key** → enum tập trung:
```typescript
// Trong shared/enums của mỗi MFE
export enum AttScreenPermission {
  New_Att_Leaveday_New_Index_V2 = 'New_Att_Leaveday_New_Index_V2',
  New_Att_LeaveDayApprove_New_Index_V2 = 'New_Att_LeaveDayApprove_New_Index_V2',
}
```

---

## 17. Luồng Request đầy đủ (Feature Page Load)

```
User navigate to /attendance/leaveday/leaveday-list
    │
[1] AuthGuard.canActivate()
    │  → checkAuth() → GET KeepSessionAlive.ashx
    │  → checkPermission('New_Att_Leaveday_New_Index_V2')
    │      → GET New_Home/AngularPortal_CheckPermissionAction
    │      → 403 nếu không có quyền
    │
[2] Resolver: LoadDataSuggestLeavedayResolver
    │  → loadPermissions$() → GET New_Home/AngularPortal_UserPermission
    │  → Pre-load suggestion data
    │
[3] AttLeavedayContainerComponent.ngOnInit()
    │  → facade.getCountData(params)
    │       → api.getCount(params)            POST api/Att_LeaveDay/CountData
    │       → map(res => res['Data'])
    │  → set tabCount, gridConfig
    │
[4] AttLeavedayListComponent.ngOnInit()
    │  → khởi tạo VnrGrid với apiEndpoint
    │  → VnrGrid tự load data:
    │       POST api/Att_LeaveDay/New_GetLeaveDayByFilter
    │       { pageIndex, pageSize, filters, sorts, userLogin }
    │       → Response: { Data: [...], Total: N }
    │
[5] VnrGrid renders rows
    │  → *vnrPermission directives show/hide action buttons
    │  → permissionFilter pipe lọc menu items
    │
[6] User action (e.g. Approve)
    │  → component.onApproveRow(row)
    │  → facade.validateApprove(params)  POST .../ValidateApproveLeaveDay
    │  → if valid: facade.setApprove()  POST .../SetApproveLeaveDay
    │  → emit reloadCountData → container reload tab counts
    │  → gridVnr.reload() → lại từ bước [4]
```

---

## 18. Quy tắc cho AI Agents khi viết Frontend code

### Kiến trúc & Module

1. **Mọi feature page** phải theo cấu trúc: `Feature.Module` → `Feature.RoutingModule` → `Feature.SharedModule` (providers) → Container (smart) + List (dumb).

2. **Tất cả providers** (API, Facade, State) phải khai báo tập trung trong `<feature>-shared.module.ts`, không khai báo rải rác ở từng component.

3. **API service** phải extend `VnrResourceService<T>`, nhận `API_CONFIG` token, và dùng `vnrSendRequest()` cho custom calls.

4. **Facade** wrap API service + transform response, inject NgRx store để đọc user context. Component không được gọi API service trực tiếp.

5. **Local state** dùng `BehaviorSubject` pattern (State service) khi state chỉ thuộc về 1 feature. Dùng NgRx khi cần share state giữa nhiều MFE.

6. **Module Federation**: Không import trực tiếp từ MFE khác — chỉ dùng shared libraries (`@shared`, `@shared-resources`). Dependency mới phải được thêm vào `shared` section trong `webpack.config.js` của cả shell và MFE.

7. **OnDestroy cleanup**: Mọi component subscribe Observable phải dùng `takeUntil(destroyed$)` và complete subject trong `ngOnDestroy()`.

8. **Standalone components** (pattern mới): Chỉ dùng cho VNR shared components. Feature components vẫn dùng NgModule pattern.

9. **API URL** luôn lấy từ `@Inject(API_CONFIG) private appConfig: IAppApiURL` — không hardcode URL.

### VNR-Module Framework (thiết kế UI)

10. **Ưu tiên vnr-module** cho mọi form control: `vnr-input`, `vnr-combobox`, `vnr-multiselect`, `vnr-datepicker`, `vnr-grid`, v.v. Chỉ dùng NG-Zorro trực tiếp khi vnr-module không có component phù hợp.

11. **Factory singleton** — luôn dùng `VnrXxxFactory.init()` ở class field (không tạo trong constructor hay ngOnInit). Builders được tạo trong `initBuilder()` hoặc `ngOnInit()`.

12. **Label** trong builder phải là **i18n key** (e.g., `'HRM_Att_Label_DateFrom'`) — không dùng string tiếng Việt trực tiếp.

13. **`vnrDataColumn`** của grid phải là array theo đúng `IVnrGridColumns` interface. `Name` phải khớp chính xác tên field trong API response. `HeaderKey` là i18n key.

14. **Server-side grid**: dùng `[vnrFilterServer]="{ apiServer: url, method: 'POST', data: filterParams }"`. Không tự load data rồi bind vào `[vnrDataGridLocal]` trừ khi grid là edit grid.

15. **`vnrGridName`** phải là unique string key — dùng để lưu cấu hình cột. Format: `[Module]_[ScreenName]_Grid` (e.g., `'Att_LeaveDay_ApprovedList_Grid'`).

16. **Upload file**: luôn dùng `builderUploadV2` với `saveUrl` và `removeUrl` từ `appConfig`. Không hardcode URL.

17. **vnr-org**: dùng `selectFactory.builderOrg({...})` + `[vnrUrlTreeView]="url"`. Đây là component chuyên biệt cho cây tổ chức, không thay thế bằng `vnr-treeview`.

### Permission & i18n

18. **Route permission** bắt buộc `canActivate: [AuthGuard]` + `data: { permission: EnumKey }` cho mọi feature route. Permission key phải dùng enum, không hardcode string.

19. **Template permission** dùng `*vnrPermission` directive với `role` parameter. Không dùng `*ngIf` thuần để ẩn/hiện button dựa trên quyền.

20. **i18n** bắt buộc: mọi text hiển thị phải qua `| translate` pipe. Feature module phải import `TranslateModule.forChild({ extend: true })`.
