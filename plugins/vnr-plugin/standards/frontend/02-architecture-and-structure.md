# Frontend Architecture & Structure — hrm-frontend-workspace

> Source: GitNexus index (67,019 symbols · 173,833 relationships) + direct codebase inspection
> Last updated: 2026-04-09

---

## 1. High-Level Architecture

The workspace is a **Nx monorepo** following a **Micro-Frontend** architecture using **Module Federation**. It is composed of two layers:

```
hrm-frontend-workspace/
├── apps/           ← Deployable applications (shell + 11 remotes + 2 e2e + storybook)
└── libs/           ← Shared libraries (14 packages published to internal npm registry)
```

**Mental model:**

```
Browser
  └── shell (host, port 4200)
        ├── loads & renders layout (libs/layout)
        ├── handles auth (libs/core/auth)
        ├── manages global state (libs/store)
        └── lazy-loads remotes at runtime via Module Federation
              ├── attendance
              ├── dashboard
              ├── human-resources
              ├── insurance
              ├── objEval
              ├── recruitment
              ├── salary
              ├── succession
              ├── system
              ├── training
              └── example
```

---

## 2. Module Federation

### Shell as Host

`apps/shell/module-federation.config.ts` declares the shell as the **host** with all shared libraries set to:

```ts
{ singleton: true, strictVersion: false, eager: true, requiredVersion: false }
```

This ensures that all remotes share exactly one instance of Angular, NgRx, and all `@hrm-frontend-workspace/*` libs — no duplication, no version conflicts.

### Remote Registration

Remote URLs are resolved at runtime from a dynamic manifest (not hardcoded in `webpack.config`). Each remote is registered via `loadRemoteModule` from `@nx/angular/mf`:

```ts
// apps/shell/src/app/app.routes.ts
loadChildren: () => loadRemoteModule('human-resources', './Routes').then(m => m.remoteRoutes)
```

### What Each Remote Exposes

Every remote must expose exactly **one entry point**:

| Exposed as | Points to |
|-----------|-----------|
| `'./Routes'` | `app.routes.ts` → `remoteRoutes: Route[]` |

### Build Output

```
dist/apps/shell/               ← Host (served at /)
dist/apps/shell/apps/dashboard/
dist/apps/shell/apps/human-resources/
dist/apps/shell/apps/objEval/
...
```

---

## 3. Directory Structure

### `apps/` — Applications

```
apps/
├── shell/                     ← Host app
│   ├── src/app/
│   │   ├── app.config.ts      ← Angular providers & DI setup
│   │   ├── app.routes.ts      ← Top-level route table (loads remotes)
│   │   └── pages/
│   │       ├── auth/          ← Login, 403, 404 pages
│   │       └── public/        ← Public (unauthenticated) pages
│   ├── module-federation.config.ts
│   ├── webpack.config.ts
│   └── webpack.prod.config.ts
├── attendance/
├── dashboard/
├── human-resources/
├── insurance/
├── objEval/
├── recruitment/
├── salary/
├── succession/
├── system/
├── training/
├── example/
├── shell-e2e/                 ← Playwright E2E for shell
├── objEval-e2e/               ← Playwright E2E for objEval
└── storybook-docs/            ← Storybook for shared components
```

### `libs/` — Shared Libraries

```
libs/
├── core/                      ← Singleton platform services
├── domain/                    ← Business logic & facades
├── models/                    ← TypeScript types, interfaces, enums
├── store/                     ← NgRx global state
├── ui/                        ← Shared UI components
├── layout/                    ← Layout shells
├── common/                    ← Pipes, directives, utilities, tokens
├── design-tokens/             ← Design system tokens
├── dashboard-engine/          ← Dashboard rendering engine
├── ai/                        ← AI feature integration
├── vnr-module/                ← VNR platform components
├── ds-foundation/             ← Design System primitives (a11y, overlay, focus)
├── ds-theme/                  ← Design System theming
└── resources/                 ← Static shared resources
```

---

## 4. Shared Libraries — Internal Detail

### `libs/core/` — Platform Core

The central platform library. All services are `providedIn: 'root'`.

```
core/
├── app/
│   ├── services/
│   │   ├── config.service.ts          ← App configuration (appConfig$)
│   │   ├── app-config.service.ts      ← Runtime app settings
│   │   ├── notification.service.ts    ← Push notification service
│   │   ├── download-file.service.ts   ← File download helper
│   │   ├── common.service.ts          ← Common utilities
│   │   └── database-migration.service.ts
│   ├── app.config.ts                  ← Angular app providers
│   └── system.config.ts               ← Root module config (translate loader, etc.)
├── auth/
│   ├── guards/
│   │   ├── auth.guard.ts              ← Route auth + permission check
│   │   ├── editing.guard.ts           ← Unsaved changes guard
│   │   └── maintenance.guard.ts       ← Maintenance mode guard
│   ├── configs/
│   │   └── auth-config.ts             ← OIDC config builder
│   └── services/
│       ├── user-facade.service.ts     ← User state facade
│       └── router-history.service.ts
├── http/                              ← HTTP utilities
├── interceptors/
│   └── http.interceptor.ts            ← HttpClientInterceptor (auth header, token refresh, response decrypt)
├── permission/                        ← Permission loading & checking
├── log/                               ← Logging service
├── cache/                             ← Cache utilities
└── i18n/                              ← i18n loader config
```

**`HttpClientInterceptor`** is the central HTTP middleware — it attaches Bearer tokens, handles token refresh (queuing concurrent requests during refresh), manages SSO vs JWT mode switching, and decrypts encrypted responses.

### `libs/domain/` — Business Logic

Facades that abstract NgRx store operations from remote apps. Never used directly by `libs/core`.

```
domain/
├── human-resources/           ← HRE business facades & services
├── evaluation/                ← Evaluation domain facades
├── succession/                ← Succession domain facades
├── training/                  ← Training domain facades
├── system/
│   └── services/
│       └── signalr.service.ts ← SignalR real-time connection
├── portal/                    ← Portal/dashboard domain
└── shared/                    ← Cross-domain shared logic
```

### `libs/models/` — Types & Interfaces

Pure TypeScript — no Angular dependencies.

```
models/
├── app/                       ← App-level tokens (APP_CONFIG, AUTH_SERVICE_TOKEN, etc.)
├── auth/                      ← IAuthService, IJWTAuthService, IRedirectLoginService
├── cache/                     ← Cache model interfaces
├── http/                      ← HTTP model interfaces
├── i18n/                      ← i18n interfaces
├── log/                       ← Logging interfaces
├── permission/                ← IPermissionService, PrivilegeType enum
└── ui/                        ← UI model interfaces (ModuleNameEnum, etc.)
```

**Conventions:** All interfaces use `I`-prefix (e.g. `IEmployee`, `IPermissionService`). Enums are PascalCase (e.g. `ModuleNameEnum`, `PrivilegeType`).

### `libs/store/` — NgRx Global State

```
store/
├── user/                      ← User slice: actions, reducer, selectors
├── settings/                  ← App settings slice (persisted to cookies)
├── notifications/             ← Notifications slice
└── reducers.ts                ← Root reducer combination
```

**Selectors:** `getUser`, `getSettings`, etc. — consumed by `HttpClientInterceptor` and layout components.

### `libs/layout/` — Application Layouts

Six distinct layout shells:

| Layout | Module | Used by |
|--------|--------|---------|
| `auth-layout` | `LayoutAuthComponent` | Login, 403, 404 |
| `main-layout` | — | Full main app with sidebar + topbar |
| `main-portal-layout` | `LayoutMainPortalComponent` | Portal / dashboard views |
| `module-layout` | `LayoutModuleComponent` | All business module remotes |
| `public-layout` | `LayoutPublicComponent` | Public unauthenticated pages |
| `example-layout` | `LayoutExampleComponent` | Reference/example app |

Shared layout components (`libs/layout/shared/`):

- `TopbarComponent` — topbar with user menu, language switcher, notifications, launcher
- `SidebarComponent` — left sidebar navigation
- `MenuLeftComponent` — menu items, skeleton loading state
- `ACLComponent` — ACL wrapper (hides content based on permission)

### `libs/ui/` — Shared UI Components

Reusable presentational components built on top of Kendo UI, ng-zorro, Angular Material. All are **dumb components** (no store access).

Notable sub-components:

```
ui/components/
├── vnr-layout/                ← Module page layout wrapper
├── vnr-social-auth/           ← Social auth login providers
├── kanban-board/              ← Kanban board with local state (Akita-like queries)
└── ...
```

### `libs/common/` — Utilities

```
common/
├── directives/                ← Shared structural/attribute directives
├── i18n/                      ← Translation token constants
├── models/                    ← Shared models used by common utilities
├── services/                  ← EnvironmentService, utility services
├── tokens/                    ← Angular injection tokens
├── types/                     ← Shared TypeScript types
└── utils/                     ← Pure utility functions
```

**`EnvironmentService`** — resolves the current `.env` values at runtime; used by `HttpClientInterceptor` and other core services.

### `libs/vnr-module/` — VNR Platform Components

Reusable smart & semi-smart components specific to the VNR platform. Each sub-package is independently consumable.

```
vnr-module/components/
├── grids/                     ← VNR grid (built on Kendo Grid): vnr-grid, vnr-grid-new
├── treelist/                  ← VNR treelist (built on Kendo TreeList)
├── filter/                    ← Advanced filter builder (quick & advanced modes)
├── toolbar/                   ← Feature toolbar v1 & v2
├── modal/                     ← Dialog/modal wrapper
├── pickers/                   ← Various pickers (date, org, employee)
├── selects/                   ← Advanced select components
├── inputs/                    ← VNR-specific inputs
├── uploads/                   ← File upload components
├── listview/                  ← List view wrapper
├── config/                    ← Runtime configuration components
├── config-form/               ← Form configuration components
├── formula-config/            ← Formula builder
├── conversational-ui/         ← Chat/conversational UI components
├── validation/                ← Form validation components
└── vnr-select-emp/            ← Employee selector
```

---

## 5. Remote App Internal Structure

Every remote app follows the same **feature-first, page-scoped** folder structure:

```
apps/<remote>/src/app/
├── app.routes.ts              ← exposes remoteRoutes: Route[]
├── app.config.ts              ← remote-level providers
└── pages/
    └── <feature-group>/
        └── <feature>/
            ├── api/
            │   └── <feature>.api.ts       ← HTTP calls (Angular service, one per feature)
            ├── container/
            │   └── <feature>.component.ts ← Smart container (dispatches to store/facade)
            ├── data/
            │   └── <feature>.model.ts     ← Local models (if not in libs/models)
            ├── facade/
            │   └── <feature>.facade.ts    ← Facade (wraps store + API calls)
            ├── <feature>-routing.module.ts
            └── <feature>.module.ts
```

**Example — `human-resources` remote:**

```
apps/human-resources/src/app/pages/
├── hre-list-employee/
│   ├── api/
│   ├── container/
│   ├── data/
│   ├── facade/
│   ├── hre-list-employee-routing.module.ts
│   └── hre-list-employee.module.ts
├── hre-management-employee/
├── hre-profile-human/
├── hre-onboarding/
├── hre-offboarding/
├── hre-structure/
├── hre-settings/
└── ...
```

---

## 6. Data Flow

```
User interaction
  → Smart Container Component (OnPush, dispatches Action or calls Facade)
       → Facade (libs/domain or local facade/)
            → NgRx Store (dispatch Action)  or  API Service (direct HTTP)
                 → NgRx Effect (catches Action, calls API service)
                      → API Service (.api.ts) → HttpClientInterceptor → Backend
                           ← HTTP Response (decrypted, token refreshed if needed)
                      ← Effect dispatches Success/Failure Action
                 ← Reducer updates Store slice
            ← Selector (selectXxx) emits new value via Observable
       ← Component re-renders (OnPush, triggered by async pipe)
```

**Key rule:** Remote apps never access `libs/store` directly. They always go through `libs/domain` facades.

---

## 7. Authentication & Authorization Flow

```
Browser load
  → shell bootstraps
  → HttpClientInterceptor registered globally
  → AuthGuard.canActivate() called on every protected route
       → checks user$ from UserFacade (NgRx store)
       → if not authorized → redirect to /auth/login
       → if route has data.permission → PermissionService.checkPermission()
            → loads permissions if not yet loaded
            → if denied → redirect to /auth/403
```

**Auth modes:**
- **OIDC (SSO):** `angular-oauth2-oidc` handles login redirect, token storage, silent refresh
- **JWT:** custom `IJWTAuthService` (token stored locally, manual refresh via interceptor queue)

Mode is controlled by `VITE_USE_SSO` env var.

**Token refresh:** `HttpClientInterceptor` uses a `BehaviorSubject<string|null>` (`tokenSubject`) to queue concurrent requests while a token refresh is in-flight, then replays them with the new token.

---

## 8. Routing Architecture

All routing is Angular lazy-loaded. The shell owns the top-level route table:

| Route | Layout | Auth | Remote |
|-------|--------|------|--------|
| `/` | — | — | redirects to `/dashboard/portal` |
| `/dashboard/*` | `LayoutMainPortalComponent` | `AuthGuard` | `dashboard` remote |
| `/human-resources/*` | `LayoutModuleComponent` | `AuthGuard` | `human-resources` remote |
| `/objEval/*` | `LayoutModuleComponent` | `AuthGuard` | `objEval` remote |
| `/system/*` | `LayoutModuleComponent` | `AuthGuard` | `system` remote |
| `/attendance/*` | `LayoutModuleComponent` | `AuthGuard` | `attendance` remote |
| `/succession/*` | `LayoutModuleComponent` | `AuthGuard` | `succession` remote |
| `/training/*` | `LayoutModuleComponent` | `AuthGuard` | `training` remote |
| `/auth/*` | `LayoutAuthComponent` | none | local auth pages |
| `/public/*` | `LayoutPublicComponent` | none | local public pages |
| `/404` | — | none | local 404 |
| `/**` | — | — | redirects to `/404` |

`InitLayoutResolver` runs before each module route to initialize layout settings (theme, menu, user info).

`MaintenanceGuard` wraps `canActivateChild` on module routes — blocks navigation when maintenance mode is active.

---

## 9. Component Conventions

| Rule | Detail |
|------|--------|
| Change detection | `OnPush` on all presentation (dumb) components |
| Smart components | Own NgRx dispatch/select, use facades, rarely use `ChangeDetectorRef` |
| Dumb components | `@Input()` / `@Output()` only, no service injection beyond view helpers |
| File naming | `kebab-case.component.ts`, `kebab-case.service.ts`, `kebab-case.facade.ts`, etc. |
| CSS | BEM methodology in SCSS |
| Observables | `$`-suffix on observable properties (e.g. `data$`, `isLoading$`) |
| i18n strings | Always via `ngx-translate`, keys as `module.component.text` |
| Interfaces | `I`-prefix (e.g. `IEmployee`) |
| Enums | PascalCase (e.g. `ModuleNameEnum`, `PrivilegeType`) |
| Selectors | `selectXxx` prefix |
| NgRx Actions | `[Source] Event` format (e.g. `[HreList] Load Employees`) |

---

## 10. Lib Dependency Rules

Dependencies flow **strictly downward** — no circular deps:

```
apps (remotes)
  └── depends on → libs/domain, libs/vnr-module, libs/ui, libs/layout, libs/common, libs/models, libs/store

libs/domain
  └── depends on → libs/store, libs/models, libs/common

libs/store
  └── depends on → libs/models

libs/ui
  └── depends on → libs/models, libs/common

libs/core
  └── depends on → libs/models, libs/common, libs/store

libs/common
  └── depends on → libs/models

libs/models
  └── (no internal lib dependencies — pure TypeScript)
```

Enforce with `dependency-cruiser` (`^16.10.2`) — rules defined in `.dependency-cruiser.js`.

---

## 11. Build & Dev Workflow

### Development

```bash
npm start                         # Interactive: choose env, SSO, watched libs
npm run start:shell               # Shell only (no remotes, fastest)
npm run start:hr                  # Shell + human-resources remote
npm run start:<alias>             # Shell + one specific remote
```

Shell serves on **port 4200**. Each remote has its own dev port defined in `project.json`.

### Library Development (without rebuild)

Copy `tsconfig-dev-core.base.json` over `tsconfig.base.json` to redirect all `@hrm-frontend-workspace/*` path aliases to local `libs/` source instead of compiled npm packages. Revert before production builds.

### Production Build

```bash
npm run build-libs               # Build all libs first (required)
npm run build-apps:prod          # Build shell + all remotes sequentially
```

Build outputs to `dist/apps/shell/` (shell) and `dist/apps/shell/apps/<remote>/` (remotes).

### Memory Budget

| Build type | Nx heap limit |
|-----------|--------------|
| Shell (build) | `--max_old_space_size=32768` (32 GB) |
| Remotes (build/test) | `--max_old_space_size=16384` (16 GB) |

---

## 12. Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Jest + `jest-preset-angular` | Services, facades, reducers, selectors, pipes |
| Component | Jest + Testing Library | Isolated component behavior |
| API mock | `msw` (Mock Service Worker) | HTTP layer mocking in unit/Storybook |
| E2E | Playwright | Full user flows (shell + remote running together) |
| Visual | Storybook 8.x | Component catalog + visual review |

```bash
nx test <project>                 # Run unit tests
nx e2e shell-e2e                  # Run E2E (requires shell + remote running)
playwright test --ui              # Playwright UI mode for debugging
```
