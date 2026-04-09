# Vnr Architecture & Source Code Structure

**Principles:**
1. **Separation of Concerns:** Keep Admin MVC legacy logic strictly isolated from the Angular micro-frontends.
2. **Database First:** Database schema and Stored Procedures dictate the Entity Framework models. Do not use Code-First migrations. SQL migrations are managed manually (see §7 below).
3. **Reusable UI:** Ưu tiên dùng `vnr-module` (design system nội bộ) cho mọi component UI trong Angular. Chỉ fallback sang NG-Zorro khi `vnr-module` không có component phù hợp, và chỉ dùng Kendo UI cho các trường hợp đặc thù nặng (grid cực lớn, scheduler, export).
4. **Speckit SDLC:** All new features must pass through Specify → Plan → Tasks → Implement.

**Repository paths (convention for this monorepo):**
- Frontend (Angular micro-frontends and related assets): `./Frontend/`
- Backend (.NET 4.6.2, EF DB-first, APIs, legacy MVC): `./HRM9/Main/Source/`

---

## Backend — HRM9 (`./HRM9/Main/Source/`)

### Top-Level Layer Structure

```
HRM9/Main/Source/
├── Business/          # Domain logic + DTO Models (~45 projects)
├── Data/              # EF entities + repositories (3 projects)
├── Infrastructure/    # Cross-cutting concerns (6 projects)
├── Presentation/      # MVC apps, Web APIs, Windows Services (~43 projects)
├── Projects/          # Service Center modules + .NET 7 services
├── Tests/             # Integration tests
└── UnitTest/          # Unit test projects
```

---

### 1. Business Layer (`Business/`)

Pattern: `HRM.Business.<Module>.Domain` + `HRM.Business.<Module>.Models`

**Shared base:** `HRM.Business.BaseModel`

**Domain Projects (23):**

| Project | Business Domain |
|---------|----------------|
| `HRM.Business.Attendance.Domain` | Chấm công |
| `HRM.Business.Canteen.Domain` | Nhà ăn |
| `HRM.Business.Category.Domain` | Danh mục |
| `HRM.Business.Complaint.Domain` | Khiếu nại |
| `HRM.Business.Complment.Domain` | Khen thưởng |
| `HRM.Business.DashBoard.Domain` | Dashboard |
| `HRM.Business.ESign.Domain` | Chữ ký điện tử |
| `HRM.Business.Evaluation.Domain` | Đánh giá |
| `HRM.Business.Finance.Domain` | Tài chính |
| `HRM.Business.Hr.Domain` | Nhân sự |
| `HRM.Business.Import.Domain` | Import dữ liệu |
| `HRM.Business.Insurance.Domain` | Bảo hiểm |
| `HRM.Business.Laundry.Domain` | Giặt ủi |
| `HRM.Business.Library.Domain` | Thư viện |
| `HRM.Business.Main.Domain` | Core chung |
| `HRM.Business.Medical.Domain` | Y tế |
| `HRM.Business.Payroll.Domain` | Lương |
| `HRM.Business.Recruitment.Domain` | Tuyển dụng |
| `HRM.Business.Report.Domain` | Báo cáo |
| `HRM.Business.SendMail.Domain` | Email |
| `HRM.Business.System.Domain` | Hệ thống |
| `HRM.Business.Talent.Domain` | Nhân tài |
| `HRM.Business.Training.Domain` | Đào tạo |
| `HRM.Business.TaskManagement.Domain` | Quản lý công việc |
| `HRM.Business.TaskSchedule` | Lịch chạy nền |

**Model Projects:** `HRM.Business.<Module>.Models` tương ứng với mỗi Domain.

**Internal structure của một Domain project (ví dụ `HRM.Business.Hr.Domain`):**
```
HRM.Business.Hr.Domain/
├── CommonFeatures/
├── ContractFeatures/
├── ContractExtendFeatures/
├── DIServices/              # Dependency Injection registrations
├── HreContractBuilder/
├── HreExtensions/
├── ProfileFeartures/
├── RequestInfoFeatures/
├── StopWorkingFeatures/
└── WorkHistoryFeatures/
```
> Mỗi Domain project chứa các Service class (e.g., `Hre_CommonServices.cs`, `Hre_ContractServices.cs`) nhóm theo feature, không phải theo layer.

---

### 2. Data Layer (`Data/`)

| Project | Vai trò |
|---------|---------|
| `HRM.Data.BaseRepository` | Base class & interface của Repository pattern |
| `HRM.Data.Entity` | EF6 entities và mapping (Database-First) |
| `HRM.Data.Repository` | Repository implementations |

> **Quy tắc:** Không dùng EF Code-First migrations. Schema database (tables, columns, SPs) là nguồn sự thật duy nhất.

---

### 3. Infrastructure Layer (`Infrastructure/`)

| Project | Vai trò |
|---------|---------|
| `HRM.Infrastructure.CalcEngine` | Engine tính công thức lương/phúc lợi |
| `HRM.Infrastructure.Logging` | ELMAH logging & error tracking |
| `HRM.Infrastructure.Middleware` | OWIN middleware (MS Graph, CORS…) |
| `HRM.Infrastructure.Security` | Authentication & authorization helpers |
| `HRM.Infrastructure.Storage` | Azure Blob / MinIO file storage (`VnrStorageManagement`) |
| `HRM.Infrastructure.Utilities` | Utility functions dùng chung |

---

### 4. Presentation Layer (`Presentation/`)

#### Main Web Applications (ASP.NET MVC)

| Project | Mục đích |
|---------|---------|
| `HRM.Presentation.Main` | Admin UI chính (quản lý nhân sự) |
| `HRM.Presentation.EmpPortal` | Employee self-service portal |
| `HRM.Presentation.Personal` | Thông tin cá nhân nhân viên |
| `HRM.Presentation.HrmSystem.Web` | Quản trị hệ thống |
| `HRM.Presentation.RecruitmentOnline` | Portal tuyển dụng public |
| `HRM.Presentation.RecruitmentV2` | Tuyển dụng v2 |
| `HRM.Presentation.Password` | Quản lý mật khẩu |
| `HRM.Presentation.EFY` | EFY application |

#### REST APIs

| Project | Mục đích |
|---------|---------|
| `HRM.Presentation.ApiService` | REST API tích hợp bên ngoài |
| `HRM.Integration.Service.Api` | API tích hợp (EF6) |
| `HRM.MobileApp.WebApi` / `HRM.Presentation.MobileApi` | Backend cho mobile |
| `HRM.Presentation.Hr.Service` | HR module service API |
| `HRM.SC.Service.Api` | Entry point API của ServiceCenter |

#### Windows Services & Background Processors

| Project | Mục đích |
|---------|---------|
| `HRM.Presentation.WindowsService` | Background job processor |
| `HRM.Presentation.WebServiceBasSal` | Basic salary web service |
| `HRM.Presentation.WebServiceHC` | Head count web service |
| `HRM.Presentation.WebServicesInsSal` | Insurance salary web service |
| `HRM.Presentation.WebServicesRec` | Recruitment web service |

#### UI Component Libraries
- `HRM.Presentation.UI.Controls` — Kendo/Telerik UI controls
- `HRM.Presentation.UI.ControlsV2` — Controls v2

#### Presentation Model Projects
`HRM.Presentation.<Module>.Models` — View models/DTOs cho từng module (Attendance, Canteen, Category, Hr, Payroll, Recruitment, Training, Talent, Insurance, EmpPortal, Evaluation, Medical, Laundry, HrmSystem, TaskManagement, Compliment).

#### Phân Loại Kiến Trúc UI (Presentation Layer)

| Project | Kiến trúc | Stack |
|---------|-----------|-------|
| `HRM.Presentation.Main` | **Legacy Admin UI** (server-side rendering) | ASP.NET MVC 5 + cshtml + jQuery + Telerik Kendo UI |
| `HRM.Presentation.EmpPortal` | **Legacy Employee Portal** (server-side + client-side hybrid) | ASP.NET MVC 5 + cshtml + jQuery + AngularJS |
| `HRM.Presentation.Hr.Service` | Legacy HR Service | ASP.NET MVC 5 + cshtml |
| `HRM.Presentation.HrmSystem.Web` | Legacy System Admin | ASP.NET MVC 5 + cshtml |
| `HRM.SC.Service.Api` | **New Service Center API** — phục vụ Angular frontend mới | Web API 5.2.9 (.NET Framework 4.6.2) |

> `HRM.Presentation.Main` là **Frontend Main** (dành cho admin/người quản lý).  
> `HRM.Presentation.EmpPortal` là **Frontend Portal cũ** (employee self-service, dùng AngularJS).  
> Angular 15+ Frontend (`src/` + `projects/`) là **Frontend Portal mới** (xem mục Frontend bên dưới).

---

### 5. Key Shared Files (Infrastructure.Utilities)

> Các file dùng chung toàn hệ thống backend — không tạo mới, chỉ thêm vào các file này.

| File | Nội dung |
|------|----------|
| `HRM.Infrastructure.Utilities/Enum/EnumConstant.cs` | **Tất cả enum** dùng chung toàn hệ thống |
| `HRM.Infrastructure.Utilities/ConstantDisplay.cs` | **Translation key** cho controls / tiêu đề màn hình (dùng với `Translate`) |
| `HRM.Infrastructure.Utilities/ConstantMessage.cs` | **Translation key** cho thông báo (success, error, warning) |

> Hệ thống backend sử dụng **Reflection** rất nhiều (đặc biệt tại EF6 entities, Repository, và CalcEngine). Khi thêm property hoặc thay đổi tên field, phải kiểm tra xem có bị ảnh hưởng qua reflection không.

---

### 6. I18N — Backend

#### 6a. Legacy MVC (`HRM.Presentation.Main`, `HRM.Presentation.EmpPortal`, v.v.)

- **File ngôn ngữ**: `HRM.Presentation.Main/Settings/Lang_[country_code].xml`
  - `_Spec` variant có **độ ưu tiên cao hơn**: `Lang_[country_code]_Spec.xml` — admin có thể chỉnh sửa nội dung trực tiếp qua UI mà không deploy lại
- **Hàm dịch**: `Translate(key)` / `TranslateString(key)` — key lấy từ `ConstantDisplay.cs` (màn hình/control) hoặc `ConstantMessage.cs` (thông báo)
- **Ngôn ngữ hỗ trợ**: `VN` (tiếng Việt), `EN` (tiếng Anh)

#### 6b. Service Center API (`HRM.SC.Service.Api`)

- **File ngôn ngữ**: `HRM.SC.Service.Api/Resources/Settings/LANG_[country_code].XML`
- **Ngôn ngữ hỗ trợ**: `VN`, `EN`

---

### 7. Database Migration (Manual SQL Scripts)

> Hệ thống không dùng EF Code-First migrations. Tất cả thay đổi schema được viết thủ công thành file `.sql`.

| Loại | Thư mục | Quy tắc đặt tên |
|------|---------|----------------|
| Schema / DML (ALTER, INSERT, UPDATE) | `HRM.Presentation.Main/Updates/Scripts/SQL/` | `[YearMonthDay_No].sql` — ví dụ: `20240315_01.sql` |
| Stored Procedure | `HRM.Presentation.Main/Updates/Stores/SQL2012/` | `[stored_proc_name].sql` — tên file = tên stored proc |

---

### Projects Layer (`Projects/`) — Service Center & .NET 7 Services

#### 5a. SC Core (`HRM.ServiceCenter/Cores/`)

| Project | Vai trò |
|---------|---------|
| `HRM.SC.Core` | Base logic cho tất cả SC modules |
| `HRM.SC.Core.Api` | Base API controller & routing |
| `HRM.SC.Core.Business` | Business logic chung (EF6 + Dapper) |
| `HRM.SC.Core.Models` | Core DTOs |
| `HRM.SC.Core.Security` | IdentityServer4 integration |
| `HRM.SC.Service.Identity.Migrations.SqlServer` | Identity DB migrations (SQL Server) |
| `HRM.SC.Service.Identity.Migrations.Sqlite` | Identity DB migrations (SQLite) |

#### 5b. SC Modules — `.NET Framework 4.6.2` (pattern: `HRM.SC.Module.<Abbr>.{Api|Business|Models}`)

| Module | Abbr | Sub-projects |
|--------|------|-------------|
| Nhân sự | `Hre` | `.Api`, `.Business`, `.Models` |
| Chấm công | `Att` | `.Api`, `.Business`, `.Models` |
| Lương | `Sal` | `.Api`, `.Business`, `.Models` |
| Bảo hiểm | `Ins` | `.Api`, `.Business`, `.Models` |
| Tuyển dụng | `Recruitment` | `.Api`, `.Business`, `.Models` |
| Đào tạo | `Training` | `.Api`, `.Business`, `.Models` |
| Nhân tài | `Talent` | `.Api`, `.Business`, `.Models` |
| Nhà ăn | `Can` | `.Api`, `.Business`, `.Models` |
| Chat nội bộ | `Chat` | `.Api`, `.Application`, `.Business`, `.Models` |
| Xử lý dữ liệu | `ProcessData` | `.Api`, `.Business`, `.Models` |
| Phản ánh/Khiếu nại | `Com` | `.Api`, `.Business`, `.Models` |
| Shared dùng chung | `Shared` | `.Api`, `.Business`, `.Models`, `.Export`, `.Import`, `.Libraries` |

#### 5c. Integration Modules — `.NET Framework 4.6.2` (pattern: `HRM.Integration.Module.<Abbr>.{Api|Business|Models}`)

| Module | Abbr |
|--------|------|
| AI Chatbot | `AI` |
| Chấm công | `Att` |
| Danh mục | `Cat` |
| Nhân sự | `Hre` |
| Lương | `Sal` |

#### 5d. Infrastructure Services — `.NET 7.0`

| Project | Runtime | Vai trò |
|---------|---------|---------|
| `HRM.SC.Service.Identity` | .NET 7 | IdentityServer4 — OIDC/OAuth2 provider |
| `Vnr.ApiGateway` | .NET 7 | Ocelot API Gateway — routing + IP Firewall |

**`HRM.SC.Service.Identity` internal:**
```
HRM.SC.Service.Identity/
├── Extensions/
├── Helpers/
├── Hubs/            # SignalR hubs
├── Infrastructure/
├── Middleware/
├── Migrations/
├── Models/
├── Quickstart/      # IdentityServer4 UI
├── Resources/
├── ViewModels/
├── Views/
└── wwwroot/
```

**`Vnr.ApiGateway` internal:**
```
Vnr.ApiGateway/
├── .config/
├── Configurations/
└── Middleware/
```

#### 5e. SC.NetCore Base Framework — `.NET 7.0`

Base framework dùng cho các service mới theo Clean Architecture:

| Project | Vai trò |
|---------|---------|
| `HRM.SC.NetCore.Core` | MediatR 12, FluentValidation 11, EF Core 7, Swashbuckle |
| `HRM.SC.NetCore.Application` | Application use cases |
| `HRM.SC.NetCore.Domain` | Domain entities |
| `HRM.SC.NetCore.Models` | DTOs |
| `HRM.SC.NetCore.Utilities` | Utilities |

#### 5f. Standalone Services — `.NET 7.0`

**`HRM.Service.Chat/`**
```
HRM.Service.Chat.Api
HRM.Service.Chat.Application
HRM.Service.Chat.Infrastructure
```

**`HRM.Service.TenantManagement/`**
```
HRM.Service.TenantManagement.Api
HRM.Service.TenantManagement.Application
HRM.Service.TenantManagement.Configuration
HRM.Service.TenantManagement.Infrastructure
HRM.Service.TenantManagement.MisaApplication
HRM.Service.TenantManagement.MisaInfrastructure
Domains/
  HRM.Service.Domain.TenantManagement.Notification
  HRM.Service.Domain.TenantManagement.TenantIntegration
```

**`HRM.Service.MultiLangTranslator/`**
```
HRM.Service.MultiLangTranslator.Core
HRM.Service.MultiLangTranslator.Infrastructure
```

---

## Frontend — Tổng Quan

Hệ thống có **hai loại frontend chính** và **ba biến thể portal**:

### Phân Loại Frontend

| Loại | Mục đích | Stack | Project/Source |
|------|----------|-------|---------------|
| **Frontend Main** | Admin / người quản lý | ASP.NET MVC + cshtml + jQuery + Telerik Kendo UI | `HRM.Presentation.Main` |
| **Frontend Portal cũ** | Employee self-service (legacy) | ASP.NET MVC + cshtml + jQuery + AngularJS | `HRM.Presentation.EmpPortal` |
| **Frontend Portal v2 (mới)** | Employee self-service — shell app | Angular 15+ | `src/` trong source Frontend |
| **Frontend Portal v3 (mới)** | Employee self-service — micro-frontends | Angular 15+ Module Federation | `projects/` trong source Frontend |

> Portal v2 và v3 đều nằm trong cùng một repository Angular (`./Frontend/`). v2 = shell host (port 4200), v3 = các Remote micro-frontend (port 4201–4210).

---

## Frontend — Angular Micro-frontend (`./Frontend/`)

### Top-Level Structure

```
Frontend/
├── src/                        # Shell app (Host, port 4200)
├── projects/                   # Micro-frontend apps & shared libraries
├── libs/                       # External packages (GoJS, Kendo, SurveyJS, vnr custom)
├── e2e/                        # End-to-end tests
├── docs/                       # Documentation
├── angular.json                # 15 projects defined (1 shell + 10 MFEs + 4 libs)
├── webpack.config.js           # Host Module Federation config
├── webpack.prod.config.js      # Production build config
├── tsconfig.json               # TypeScript paths & compiler options
├── package.json                # Dependencies (Yarn)
├── .eslintrc.json
├── .prettierrc
└── .stylelintrc.json
```

---

### 1. Shell App (`src/`)

Entry point — loads micro-frontends via Module Federation.

```
src/
├── app/
│   ├── app.component.ts
│   ├── app.module.ts
│   ├── app-routing.module.ts
│   ├── app-routing-loader.ts       # Dynamic route preloading strategy
│   ├── components/                 # Shell-level components
│   ├── pages/                      # Shell pages (login, home…)
│   └── resources/menu/
│       └── routes.config.ts        # Platform route configuration
├── bootstrap.ts                    # HMR + Module Federation bootstrap
├── main.ts
├── index.html
├── silent-refresh.html             # OIDC silent token refresh
├── environments/
├── assets/
└── global.scss
```

---

### 2. Micro-frontend Apps (`projects/`)

Mỗi app là một Angular remote được expose qua Module Federation.

| Project | Port | Business Domain |
|---------|------|----------------|
| `insurance` | 4201 | Bảo hiểm |
| `attendance` | 4202 | Chấm công & ca làm |
| `human-resources` | 4203 | Nhân sự & hồ sơ nhân viên |
| `salary` | 4204 | Lương & tính lương |
| `tenant-management` | 4205 | Quản lý tenant (multi-tenant) |
| `tenant-portal` | 4206 | Employee self-service portal |
| `recruitment` | 4207 | Tuyển dụng |
| `canteen` | 4208 | Nhà ăn |
| `training` | 4209 | Đào tạo & phát triển |
| `talent` | 4210 | Nhân tài & hiệu suất |

**Cấu trúc bên trong mỗi Micro-frontend (pattern chung):**

```
projects/<module>/
├── src/app/
│   ├── app.component.ts
│   ├── app.module.ts
│   ├── app-routing.module.ts
│   ├── <module>.module.ts           # Feature module được expose qua MF
│   ├── <module>-routing.module.ts
│   ├── pages/                       # Feature pages (mỗi page là một lazy-loaded module)
│   │   ├── <feature-page-1>/
│   │   ├── <feature-page-2>/
│   │   └── dashboard/
│   └── shared/                      # Code dùng chung trong module
│       ├── api/                     # API service wrappers (HTTP calls)
│       ├── services/                # Business logic services & Facades
│       ├── store/                   # NgRx local store
│       │   ├── actions.ts
│       │   ├── reducers.ts
│       │   ├── selectors.ts
│       └── state.ts
│       ├── components/              # Shared components trong module
│       ├── directives/
│       ├── models/                  # TypeScript interfaces & types
│       ├── pipes/
│       ├── data/                    # Static data & constants
│       └── utils/
├── webpack.config.js               # Remote Module Federation config
├── webpack.prod.config.js
└── tsconfig.app.json
```

**Attendance pages (ví dụ):** `att-assistant-manager`, `att-benefits`, `att-calendar`, `att-change-shift`, `att-daily-work`, `att-day-replacement`, `att-late-early`, `att-leaveday`, `att-manage-form`, `att-overtime`, `att-shift`, `att-shift-assignment`, `att-tamscanlog`, `bussiness`, `dashboard`.

**Salary pages (ví dụ):** `dashboard`, `payroll`, `config-payroll`, `sal-approve-payroll`, `sal-base-salary`, `sal-detail-error`, `sal-product-salary`, `sal-reward`, `sal-taxation`, `family-business-list`, `statistics-employees`.

---

### 3. Shared Libraries (`projects/`)

#### `shared-core` — Core Services, Store, Auth, VNR Components

```
projects/shared-core/core/
├── @vnr/                        # VNR component library (30+ components)
│   ├── components/
│   │   ├── vnr-alert/
│   │   ├── vnr-button/
│   │   ├── vnr-comment/
│   │   ├── vnr-dynamic-control/
│   │   ├── vnr-filter-advance/
│   │   ├── vnr-grid-configs/
│   │   ├── vnr-grid-button-action/
│   │   ├── vnr-modal-upload-file/
│   │   ├── vnr-select-emp/
│   │   ├── vnr-spreadsheet/
│   │   ├── vnr-advanced-emp-search/
│   │   ├── vnr-button-camera/
│   │   └── ... (30+ total)
│   ├── directives/
│   ├── models/
│   ├── enums/
│   ├── services/
│   └── vnr-core.module.ts
│
├── @vnr-store/                  # NgRx Global Store
│   ├── reducers.ts              # Root reducer
│   ├── user/                    # User state (actions, reducers, effects)
│   │   └── profile-form/
│   ├── settings/                # App settings state
│   └── systems/                 # System state
│
├── @vnr-services/               # Core Services
│   ├── api/
│   │   ├── api.service.ts
│   │   └── common-api.service.ts
│   ├── common/
│   │   ├── config.service.ts
│   │   ├── common.service.ts
│   │   ├── http-error-interceptor.service.ts
│   │   ├── signalr.service.ts
│   │   ├── vnr-translate.service.ts
│   │   └── indexed-db.service.ts
│   ├── jwt/
│   ├── firebase/
│   ├── permission/
│   │   ├── permission.service.ts
│   │   └── checkSession.service.ts
│   ├── menu/
│   ├── theme-settings/
│   └── topbar/
│
├── @vnr-ui/                     # UI Kit & Theme
│   ├── kit/core/pipe/
│   ├── vendors/antd/themes/     # Ant Design theme overrides
│   ├── components/
│   └── cleanui/                 # CleanUI theme library
│
├── @vnr-pipes/                  # Global Pipes (15+)
│   ├── clear-html.pipe
│   ├── format-file.pipe
│   ├── has-menu-item-children.pipe
│   ├── permissionFilter.pipe
│   ├── safe-html.pipe
│   └── ...
│
├── @vnr-layouts/                # Layout components
├── @vnr-modules/                # Shared Angular modules
│   ├── vnr-share-http.module.ts
│   └── vnr-shared-core-service.module.ts
├── @vnr-utils/
├── @vnr-resources/
│
└── auth/                        # Authentication Module
    ├── auth.service.ts
    ├── auth-config.ts
    ├── auth-config.service.ts
    ├── auth-storage.service.ts
    └── auth.module.ts
```

#### `shared-components` — Reusable UI Components

```
projects/shared-components/components/
├── approval-process/         # Workflow approval UI
├── config/
├── config-form-detail/
├── cropper-image/
├── detailed-drawer/
├── details-information/
├── directives/
├── full-screen-grid/
├── password-confirm/
├── pipe/
├── reason/
├── spinning-lazy/
├── vnr-dynamic/              # Dynamic component loader
├── vnr-view-detail/
└── vnr-components.module.ts
```

#### `shared-module` — Angular Modules

```
projects/shared-module/modules/
├── antd.module.ts            # Ant Design imports & config
├── shared.module.ts          # Main shared module
├── vnr-module.module.ts
└── app-routing-loader.ts
```

#### `shared-resources` — Config & i18n

```
projects/shared-resources/
├── i18n-config.ts
├── menu-config.ts
├── root-menu.enum.ts
└── [domain]/                 # Per-domain resources
    ├── attendance/
    │   ├── enums/
    │   ├── menu/
    │   └── i18n/
    ├── salary/
    ├── human-resources/
    ├── insurance/
    ├── recruitment/
    ├── canteen/
    ├── training/
    ├── talent/
    ├── tenant-management/
    └── tenant-portal/
```

---

### 4. Module Federation Setup

**Host (`webpack.config.js` — shell app, port 4200):**

```js
remotes: {
  insurance:        'http://localhost:4201/remoteEntry.js',
  attendance:       'http://localhost:4202/remoteEntry.js',
  humanResources:   'http://localhost:4203/remoteEntry.js',
  salary:           'http://localhost:4204/remoteEntry.js',
  tenantManagement: 'http://localhost:4205/remoteEntry.js',
  tenantPortal:     'http://localhost:4206/remoteEntry.js',
  recruitment:      'http://localhost:4207/remoteEntry.js',
  canteen:          'http://localhost:4208/remoteEntry.js',
  training:         'http://localhost:4209/remoteEntry.js',
  talent:           'http://localhost:4210/remoteEntry.js',
}

// Shared singletons (eager):
// @angular/core, @angular/common, @angular/router, @angular/forms
// @ngrx/store, @ngrx/effects, @ngrx/router-store
// rxjs, @ngx-translate/core
// ng-zorro-antd, @ant-design/icons-angular
// @shared, @shared-resources (custom path aliases)
```

**Remote (mỗi micro-frontend, e.g., attendance `webpack.config.js`):**

```js
name: 'attendance',
filename: 'remoteEntry.js',
exposes: {
  './VnrAttendanceModule': './projects/attendance/src/app/attendance.module.ts'
}
```

Dynamic routes được inject qua `PLATFORM_ROUTES` token và merge tại runtime từ `resources/menu/routes.config.ts`.

---

### 5. Key Architectural Patterns (Frontend)

| Pattern | Áp dụng |
|---------|---------|
| **Micro-frontend** | Webpack Module Federation — mỗi domain là một Remote |
| **Facade** | `<module>-shared.facade.ts` bọc NgRx + API calls |
| **NgRx** | Global store (user/settings/systems) + local store per MFE |
| **Feature-based folders** | `pages/` (lazy-loaded) + `shared/` per MFE |
| **Shared Library** | `@vnr/*` namespace cho components, services, pipes, store |
| **Dynamic Routing** | Routes preloaded từ menu config, inject via DI token |
| **i18n** | `@ngx-translate` + VN/EN/ZH per-domain translation files |
| **Permission guard** | `permission.service.ts` + `checkSession.service.ts` |
