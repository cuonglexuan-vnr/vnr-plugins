# Công Nghệ Sử Dụng (Vnr Tech Stack)
**Lĩnh vực:** Quản lý Nhân sự / Human Resources Management

---

## Backend 1 — Ứng Dụng Chính (HRM9 — Legacy, `.NET Framework 4.6.2`)

**Vị trí source**: `HRM9/Main/Source/` (Business + Data + Infrastructure + Presentation)

- **Runtime**: .NET Framework 4.6.2
- **Web Framework**: ASP.NET MVC 5 + ASP.NET Web API 5.2.9
- **Middleware Pipeline**: OWIN/Katana (`Microsoft.Owin` 4.2.2) — dùng cho xác thực, CORS, SignalR
- **Cơ sở dữ liệu**: SQL Server
- **ORM**: Entity Framework 6.4.4 (Database-First — sinh code từ database)
- **Truy cập dữ liệu**: Chủ yếu qua Stored Procedure và LINQ; tầng repository tập trung tại `HRM.Data.BaseRepository`
- **Caching**: Redis (`StackExchange.Redis`)
- **Real-time**: SignalR 2.4.3 (`Microsoft.AspNet.SignalR.Core`)
- **JSON**: Newtonsoft.Json 13.0
- **API Docs**: NSwag 13.17.0 (Swagger qua OWIN — `NSwag.AspNet.Owin`, `NSwag.AspNet.WebApi`)
- **Validation**: FluentValidation 10.x
- **Background Jobs**: Custom task scheduler (`HRM.Business.TaskSchedule` — `ScheduleTaskExcute`)
- **Calc Engine**: Engine tính toán công thức lương/phúc lợi (`HRM.Infrastructure.CalcEngine`)
- **Logging / Error Tracking**: ELMAH (`HRM.Infrastructure.Logging`)
- **Testing**: NUnit 2.6.3 (6 unit test + 2 integration test project)
- **Thư viện nội bộ**: `VnResource.Helper.dll` — helper dùng chung toàn hệ thống

### Cấu Trúc Tầng (Layer Structure)

| Thư mục | Mô tả |
|---------|-------|
| `Business/` | ~46 domain project theo pattern `HRM.Business.<Module>.Domain` + `.Models` |
| `Data/` | `HRM.Data.BaseRepository`, `HRM.Data.Entity` (EF6), `HRM.Data.Repository` |
| `Infrastructure/` | CalcEngine, Logging (ELMAH), Middleware (MS Graph), Security, Storage, Utilities |
| `Presentation/` | ASP.NET MVC apps, Web API, Windows Service |

### Các Ứng Dụng Presentation Chính

| Project | Mục đích |
|---------|---------|
| `HRM.Presentation.Main` | Web UI chính dành cho quản lý (admin) |
| `HRM.Presentation.EmpPortal` | Self-service portal cho nhân viên |
| `HRM.Presentation.ApiService` | REST API tích hợp bên ngoài |
| `HRM.Presentation.HrmSystem.Web` | Quản trị hệ thống |
| `HRM.Presentation.RecruitmentOnline` | Portal tuyển dụng public |
| `HRM.MobileApp.WebApi` / `HRM.Presentation.MobileApi` | Backend cho mobile |
| `HRM.Presentation.WindowsService` | Background job processor |
| `HRM.SC.Service.Api` | Entry point API của ServiceCenter (host Web API modules) |
| `HRM.Integration.Service.Api` | API tích hợp bên ngoài (EF6) |

---

## Backend 2 — Service Center (`HRM.ServiceCenter` — Kiến Trúc Modular)

**Vị trí source**: `HRM9/Main/Source/Projects/` + `HRM9/Main/Source/Presentation/HRM.SC.Service.Api/`

ServiceCenter có **hai tầng runtime khác nhau**:

### Tầng 1 — SC Modules (`.NET Framework 4.6.2`, Web API 5.2.9)

Các module nghiệp vụ vẫn chạy trên .NET Framework 4.6.2, hosted qua `HRM.SC.Service.Api`. Mỗi module chia thành 3 layer: `.Api` / `.Business` / `.Models`.

- **ORM**: Entity Framework 6.4.4
- **Micro-ORM**: Dapper 2.0.123 — dùng song song với EF6 tại `HRM.SC.Core.Business`
- **Validation**: FluentValidation 10.x
- **API Docs**: NSwag 13.17.0
- **Core library**: `HRM.SC.Core`, `HRM.SC.Core.Api`, `HRM.SC.Core.Business`, `HRM.SC.Core.Models`

#### Các Module (`.NET Framework 4.6.2`)
| Module | Namespace | Ghi chú |
|--------|-----------|---------|
| Nhân sự (HR) | `HRM.SC.Module.Hre` | |
| Chấm công | `HRM.SC.Module.Att` | |
| Lương | `HRM.SC.Module.Sal` | |
| Bảo hiểm | `HRM.SC.Module.Ins` | |
| Tuyển dụng | `HRM.SC.Module.Recruitment` | |
| Đào tạo | `HRM.SC.Module.Training` | |
| Nhân tài | `HRM.SC.Module.Talent` | |
| Nhà ăn | `HRM.SC.Module.Can` | |
| Chat nội bộ | `HRM.SC.Module.Chat` | Có thêm layer `.Application` |
| Xử lý dữ liệu | `HRM.SC.Module.ProcessData` | |
| Phản ánh / Khiếu nại | `HRM.SC.Module.Com` | |
| Shared / Dùng chung | `HRM.SC.Module.Shared` | Có thêm Export, Import, Libraries |

#### Integration Modules (`.NET Framework 4.6.2`)
| Module | Namespace |
|--------|-----------|
| AI Chatbot | `HRM.Integration.Module.AI` |
| Chấm công (Integration) | `HRM.Integration.Module.Att` |
| Danh mục (Integration) | `HRM.Integration.Module.Cat` |
| Nhân sự (Integration) | `HRM.Integration.Module.Hre` |
| Lương (Integration) | `HRM.Integration.Module.Sal` |

### Tầng 2 — SC Infrastructure & New Services (`.NET 7.0`, ASP.NET Core)

- **Identity Provider**: `HRM.SC.Service.Identity` — IdentityServer4 (v4.1.2) + EF + Dapper 2.0.123
- **API Gateway**: `Vnr.ApiGateway` — Ocelot (v19.0.2) + CacheManager + **Firewall** (v3.0.0) lọc IP
- **Security**: `HRM.SC.Core.Security` — IdentityServer4 v4.1.2
- **Logging**: Serilog (`serilog.aspnetcore` v7.0.0, `Serilog.Extensions.Logging.File` v3.0.0)

#### Các Service Độc Lập (`.NET 7.0`, Clean Architecture qua `HRM.SC.NetCore`)

`HRM.SC.NetCore` là base framework (.NET 7.0) dùng cho các service mới với Clean Architecture:

| Layer | Project |
|-------|---------|
| Core | `HRM.SC.NetCore.Core` (MediatR 12.1.1, FluentValidation 11, EF Core 7.0.8, Swashbuckle) |
| Application | `HRM.SC.NetCore.Application` |
| Domain | `HRM.SC.NetCore.Domain` |
| Models | `HRM.SC.NetCore.Models` |
| Utilities | `HRM.SC.NetCore.Utilities` |

| Service | Runtime | Công nghệ nổi bật |
|---------|---------|-----------------|
| `HRM.Service.Chat` | .NET 7.0 | AutoMapper 12, MediatR 12.1.1, Serilog |
| `HRM.Service.TenantManagement` | .NET 7.0 | AutoMapper 12, MediatR 12.1.1, EF Core 7, MiniProfiler, Polly |
| `HRM.Service.MultiLangTranslator` | .NET 7.0 | Dịch đa ngôn ngữ |

---

## Xác Thực & Bảo Mật

- **JWT Bearer** — xác thực token qua IdentityServer4
- **OpenID Connect (OIDC)** — `Microsoft.Owin.Security.OpenIdConnect`
- **External Providers** hỗ trợ:
  - Google OAuth (`AuthGoogleConfiguration`)
  - Azure AD / Microsoft Account (`AzureOpenIdConnectConfiguration`, MSAL)
  - WsFederation (`AuthWsFederationConfiguration`)
  - IdentityServer4 (`AuthIdentityServer4Configuration`)
- **PKCE** — hỗ trợ cho public client (`IdsUtility.PkceHelper`)
- **Cookie Authentication** — quản lý `SameSite`, `LogoutSessionManager` (front/back channel logout)
- **Rate Limiting** — `RateLimitingMiddleware` (giới hạn upload 5 lần/phút/IP)
- **Firewall Middleware** — lọc IP tại API Gateway (`Firewall` v3.0.0)
- **Security Headers** — tự động xóa `X-Powered-By`, `Server`, `X-AspNet-Version` tại Gateway

---

## Lưu Trữ File

- **Hiện tại** Lưu trữ trực tiếp ở server
- **Azure Blob Storage** (`HRM.Infrastructure.Storage.AzureUpload`)
- **MinIO** — S3-compatible object storage (`HRM.Infrastructure.Storage.MinioUpload`)
- Trừu tượng hóa qua `VnrStorageManagement` (có thể đổi backend dễ dàng)

---

## Tích Hợp Bên Ngoài

- **Microsoft Graph API** (v4.26.0) — Office 365, dữ liệu user Azure AD (`HRM.Infrastructure.Middleware.MsGraph`)
- **Firebase Cloud Messaging (FCM)** — push notification (`Sys_FCMNotificationServices`)
- **LinkedIn API** — tích hợp tuyển dụng (`LinkedInService`)
- **OpenAI API** (`OpenAI.Chat` SDK, model `gpt-4o-mini`) — AI Chatbot hỗ trợ nghiệp vụ HR (xem phép, tra cứu lương, tuyển dụng)

---

## Frontend 1 — Admin UI (Legacy)

- **Framework**: ASP.NET MVC (server-side rendering, .NET Framework 4.6.2)
- **UI Library**: Telerik Kendo UI (jQuery-based) — `Kendo.Mvc.dll`
- **Real-time client**: SignalR jQuery client (`jquery.signalR-2.4.3.js`)

---

## Frontend 2 — Modern User Portal (`vnrportal` — Angular Micro-frontend)

### Nền tảng & Kiến trúc

- **Framework**: Angular **15** (`^15.2.5`) + TypeScript 4.9.5
- **Kiến trúc**: Micro-frontend — Webpack Module Federation (`@angular-architects/module-federation` 14.2.3)
- **Build tool**: Angular CLI 15 + `ngx-build-plus` (custom webpack builder)
- **Package manager**: Yarn
- **Shell app**: `vnrportal` (trong `src/`)
- **Runtime**: RxJS 7.8.0

### Danh Sách Micro-frontend Projects (`projects/`)

| Project | Nghiệp vụ |
|---------|-----------|
| `attendance` | Chấm công |
| `salary` | Lương |
| `human-resources` | Nhân sự |
| `insurance` | Bảo hiểm |
| `recruitment` | Tuyển dụng |
| `canteen` | Nhà ăn |
| `training` | Đào tạo |
| `talent` | Nhân tài |
| `tenant-management` | Quản lý tenant |
| `tenant-portal` | Tenant portal |
| `shared-core` | Store & core logic dùng chung |
| `shared-components` | Components dùng chung |
| `shared-module` | Modules dùng chung |
| `shared-resources` | Tài nguyên dùng chung |

### ⭐ Design System Nội Bộ — `vnr-module` (PRIORITY #1)

> **Đây là framework UI chính của dự án.** Mọi màn hình mới đều phải ưu tiên dùng `vnr-module` trước. Chỉ dùng NG-Zorro hoặc Kendo khi `vnr-module` chưa hỗ trợ use-case đó.

- **Package**: `vnr-module` 0.2.1 — thư viện UI nội bộ (private registry `http://172.21.35.3:56000`)
- **Source**: `Vnr.Dev.Package.Controls-v02/projects/vnr-module/` (tham khảo khi cần hiểu API)
- **Import vào feature module**: qua `VnrModuleModule` được re-export từ `@shared-module`

#### Thành Phần Chính của `vnr-module`

| Module | Components / Directives | Dùng cho |
|--------|------------------------|----------|
| `VnrGridsModule` | `vnr-grid`, `vnr-tree-list` | Hiển thị danh sách, bảng dữ liệu |
| `VnrInputsModule` | `vnr-input`, `vnr-textarea`, `NzInputDirective` | Ô nhập liệu văn bản |
| `VnrSelectsModule` | `vnr-select`, `vnr-multi-select` | Dropdown, combobox |
| `VnrPickersModule` | `vnr-date-picker`, `vnr-date-range-picker` | Chọn ngày tháng |
| `VnrUploadsModule` | `vnr-upload` | Tải file đính kèm |
| `validation` | Validation directives & components | Hiển thị lỗi form |
| `common` | `VnrSystemsSettingsService`, pipes, directives dùng chung | Services & utilities |
---

### UI Component Libraries (Bổ Sung)

> Dùng các thư viện sau **chỉ khi** `vnr-module` chưa có component phù hợp.

- **NG-Zorro** (`ng-zorro-antd` ^15.1.0) — Ant Design for Angular; nền tảng mà `vnr-module` wrapper lên
- **Kendo UI for Angular** (`@progress/kendo-angular-*` 16.7.0) — các component đặc thù nặng:
  - Grid, TreeList, TreeView — danh sách dữ liệu cực lớn (khi `vnr-grid` không đủ)
  - Scheduler — lịch làm việc
  - Charts, Barcodes — biểu đồ
  - Excel Export, PDF Export — xuất báo cáo
  - Editor — rich text editor
  - DateInputs, Dropdowns, Upload, Dialog, v.v.
- **Angular Material** (`@angular/material` ^15.2.7) — một số component bổ sung
- **ng-bootstrap** (`@ng-bootstrap/ng-bootstrap` ^7.0.0) — Bootstrap components
- **Bootstrap** 4.5.2 — CSS framework

### State Management

- **NgRx** 15.4.0:
  - `@ngrx/store` — global state
  - `@ngrx/effects` — side effects
  - `@ngrx/router-store` — router state sync
- Store được tổ chức trong `projects/shared-core/core/@vnr-store/`

### Xác Thực (Frontend)

- **angular-oauth2-oidc** 13.0.1 — OIDC/OAuth2 client (đăng nhập qua IdentityServer4)
- **Firebase** (`@angular/fire` ^6.0.2, `firebase` ^7.14.4) — xác thực và push notification phía client

### Real-time

- **@microsoft/signalr** ^8.0.0 — SignalR .NET client (kết nối real-time với backend HRM9)

### Charting & Visualization

- **HighCharts** (`highcharts` ^8.2.2 + `angular-highcharts` ^10.0.1) — biểu đồ chính
- **ApexCharts** (`apexcharts` ^3.19.0 + `ng-apexcharts` ^1.2.3) — biểu đồ phụ
- **Chart.js** (`angular2-chartjs` ^0.5.1) — biểu đồ đơn giản
- **Chartist** (`chartist` ^0.11.4 + `ng-chartist`) — biểu đồ nhẹ
- **GoJS** 2.1.38 (local `.tgz`) + `gojs-angular` 2.0.4 — sơ đồ tổ chức, org chart

### Surveys & Forms

- **SurveyJS** 1.9.84:
  - `survey-angular-ui`, `survey-core` — hiển thị survey
  - `survey-creator-angular`, `survey-creator-core` — thiết kế survey
  - `survey-pdf` — xuất survey ra PDF
  - `survey-analytics` (local `.tgz`) — phân tích kết quả
- **vnr-survey** 0.1.6 — thư viện survey nội bộ (private registry)

### Rich Text & Code Editors

- **Quill** (`quill` ^1.3.7 + `ngx-quill` ^8.1.7) — rich text editor chính
- **Summernote** (`summernote` 0.8.20 + `ngx-summernote` 0.8.8) — rich text editor phụ
- **CodeMirror** (`codemirror` ^5.62.0 + `@ctrl/ngx-codemirror` ^5.0.0) — code editor (dùng cho formula/script)
- **Ace Editor** (`ace-builds` ^1.4.12) — code editor thay thế

### Xuất Dữ Liệu (Export)

- **xlsx** ^0.17.0 — xuất Excel phía client
- **jsPDF** ^1.5.3 + `jspdf-autotable` — xuất PDF phía client
- **@progress/kendo-angular-excel-export** — xuất Excel qua Kendo
- **@progress/kendo-angular-pdf-export** — xuất PDF qua Kendo
- **file-saver** — tải file về máy

### Tiện Ích & UX

- **@ngx-translate/core** ^12.1.2 + `@ngx-translate/http-loader` — đa ngôn ngữ (VI / EN / ZH)
- **ngx-toastr** 15.2.2 — thông báo toast
- **@ngx-loading-bar** ^5.1.2 — loading bar HTTP / router
- **ngx-mask** 14.3.3 — input mask (số điện thoại, CMND, v.v.)
- **ngx-image-cropper** ^7.0.2 — cắt ảnh avatar
- **ngx-webcam** ^0.4.1 — chụp ảnh từ webcam
- **ngx-color-picker** ^11.0.0 — color picker
- **ngx-captcha** ^9.0.1 — reCAPTCHA
- **ngx-cookie-service** ^14.0.1 — quản lý cookie
- **ngx-indexed-db** 11.0.2 — lưu dữ liệu offline qua IndexedDB
- **ngx-infinite-scroll** ^10.0.1 — infinite scroll
- **ngx-ui-tour** ^8.1.2 — hướng dẫn UI (onboarding tour)
- **@ctrl/ngx-emoji-mart** ^9.2.0 — emoji picker (chat)
- **angular-gridster2** ^11.0.0 — dashboard dạng lưới kéo thả
- **sortablejs** + `ngx-sortablejs` — kéo thả sắp xếp danh sách
- **ngx-nestable** ^0.9.4 — danh sách phân cấp kéo thả
- **date-fns** ^2.25.0 — xử lý ngày tháng
- **lodash** ^4.17.15 — utility functions
- **swiper** ^6.5.9 — carousel / slider

### Testing & Code Quality

- **Jasmine** ~3.6.0 + **Karma** ~6.3.4 — unit testing
- **Protractor** ~7.0.0 — e2e testing
- **ESLint** ^7.32.0 + `@angular-eslint` — linting TypeScript/Angular
- **Prettier** ^1.19.1 — code formatting
- **Stylelint** ^13.8.0 — linting SCSS/CSS
- **Husky** ^4.3.8 + `lint-staged` — pre-commit hooks
- **webpack-bundle-analyzer** — phân tích kích thước bundle
