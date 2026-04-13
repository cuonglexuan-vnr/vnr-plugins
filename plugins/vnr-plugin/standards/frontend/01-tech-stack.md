# Frontend Tech Stack — hrm-frontend-workspace

> Source: GitNexus index (67,019 symbols · 173,833 relationships · 300 execution flows) + `package.json`
> Last updated: 2026-04-09

---

## 1. Core Framework & Language

| Item | Version |
|------|---------|
| Angular | `~19.1.0` |
| TypeScript | `~5.7.2` |
| RxJS | `~7.8.0` |
| Zone.js | `~0.15.0` |

---

## 2. Monorepo & Build Tooling

| Tool | Version | Role |
|------|---------|------|
| Nx | `20.4.6` | Monorepo orchestration, task graph, caching |
| `@nx/angular` | `^20.4.6` | Angular Nx integration |
| `@nx/webpack` | `20.4.6` | Webpack executor for apps |
| `@nx/module-federation` | `20.4.6` | Module Federation support |
| `@module-federation/enhanced` | `^0.8.8` | Enhanced MF runtime |
| Webpack | (via Nx) | Bundler for all apps |
| SWC (`@swc/core`) | `~1.5.7` | Fast transpilation |
| Sass | `^1.89.2` | CSS preprocessor |
| PostCSS + Autoprefixer | — | CSS post-processing |
| `style-dictionary` | `^3.8.0` | Design token generation |
| `ng-packagr` | `^19.1.2` | Library packaging |

---

## 3. Architecture — Module Federation (Micro-Frontend)

The workspace follows a **host + remote** Module Federation pattern. All shared libraries use `singleton: true, eager: true`.

### Shell (Host) — `apps/shell` (port 4200)

```
apps/shell → loadRemoteModule(remote, './Routes') → remote.remoteRoutes
```

### Remote Apps

| App | Path prefix | Domain |
|-----|-------------|--------|
| `shell` | — | Host, layout, auth routing |
| `attendance` | `/attendance` | Attendance tracking |
| `dashboard` | `/dashboard` | Dashboards & portal |
| `human-resources` | `/human-resources` | Core HR |
| `insurance` | `/insurance` | Insurance |
| `objEval` | `/objEval` | Objective evaluation |
| `recruitment` | `/recruitment` | Recruitment |
| `salary` | `/salary` | Payroll / salary |
| `succession` | `/succession` | Succession planning |
| `system` | `/system` | System administration |
| `training` | `/training` | Training management |
| `example` | `/example` | Reference implementation |

Each remote exposes `'./Routes'` → `remoteRoutes` array.

---

## 4. Internal Shared Libraries

Published to the internal TFS npm registry as `@hrm-frontend-workspace/*`.

| Library | Package | Role |
|---------|---------|------|
| `core` | `@hrm-frontend-workspace/core` | Singleton services: HTTP client, auth (OIDC), app config, logging |
| `domain` | `@hrm-frontend-workspace/domain` | Business logic, facades |
| `models` | `@hrm-frontend-workspace/models` | TypeScript interfaces (`I`-prefix) and enums |
| `store` | `@hrm-frontend-workspace/store` | NgRx: actions, reducers, effects, selectors |
| `ui` | `@hrm-frontend-workspace/ui` | Shared presentational components (Kendo, ng-zorro, Material) |
| `layout` | `@hrm-frontend-workspace/layout` | 6 layout types: auth, example, main, portal, module, public |
| `common` | `@hrm-frontend-workspace/common` | Pipes, directives, utilities, i18n tokens |
| `design-tokens` | `@hrm-frontend-workspace/design-tokens` | Design system tokens (generated via style-dictionary) |
| `dashboard-engine` | `@hrm-frontend-workspace/dashboard-engine` | Dashboard configuration & rendering engine |
| `ai` | `@hrm-frontend-workspace/ai` | AI feature integration |
| `vnr-module` | `@hrm-frontend-workspace/vnr-module` | VNR platform module integration |
| `gojs` | `@hrm-frontend-workspace/gojs` | GoJS diagram library wrapper |
| `ds-foundation` | (internal) | Design System foundation: interaction zones, overlays, focus management, a11y |

---

## 5. State Management

| Package | Version | Usage |
|---------|---------|-------|
| `@ngrx/store` | `^19.0.1` | Centralized state store |
| `@ngrx/effects` | `^19.0.1` | Side-effect handling |
| `@ngrx/router-store` | `^19.0.1` | Router state integration |

**Conventions:**
- Actions: `[Source] Event` naming
- Selectors: `selectXxx` prefix
- Smart components dispatch/select; dumb components only emit events
- Facades (`libs/domain`) abstract store access from components

---

## 6. Authentication

| Package | Version | Role |
|---------|---------|------|
| `angular-oauth2-oidc` | `^19.0.0` | OAuth 2.0 / OpenID Connect client |
| `angular-oauth2-oidc-jwks` | `^17.0.2` | JWKS support |
| `jwt-decode` | `^4.0.0` | JWT decoding |

Auth config in `auth-config.json`. Guards: `AuthGuard`, `MaintenanceGuard` (from `@hrm-frontend-workspace/core`).

---

## 7. UI Component Libraries

### Primary — Kendo UI for Angular (`18.1.0`)

| Package | Components |
|---------|-----------|
| `kendo-angular-grid` | Data grid with sorting, filtering, grouping |
| `kendo-angular-treelist` | Hierarchical grid |
| `kendo-angular-charts` | Chart suite |
| `kendo-angular-chart-wizard` | Chart configuration wizard |
| `kendo-angular-barcodes` | Barcodes & QR codes |
| `kendo-angular-scheduler` | Calendar/scheduler |
| `kendo-angular-dateinputs` | Date pickers |
| `kendo-angular-dropdowns` | Dropdowns, multi-select |
| `kendo-angular-editor` | Rich text editor |
| `kendo-angular-upload` | File upload |
| `kendo-angular-dialog` | Dialogs / modals |
| `kendo-angular-inputs` | Form inputs |
| `kendo-angular-buttons` | Button suite |
| `kendo-angular-layout` | Panels, splitter, stepper |
| `kendo-angular-menu` | Menus |
| `kendo-angular-navigation` | Breadcrumb, drawer, appbar |
| `kendo-angular-toolbar` | Toolbar |
| `kendo-angular-tooltip` | Tooltips |
| `kendo-angular-treeview` | Tree view |
| `kendo-angular-listview` | List view |
| `kendo-angular-pager` | Pager |
| `kendo-angular-progressbar` | Progress bar |
| `kendo-angular-indicators` | Badges, loading indicator |
| `kendo-angular-popup` | Popup anchor |
| `kendo-angular-label` | Form labels |
| `kendo-angular-pdf-export` | PDF export |
| `kendo-angular-excel-export` | Excel export |
| `kendo-angular-spreadsheet` | Spreadsheet component |
| `kendo-angular-icons` | Icon set |
| `kendo-theme-default` | Default theme `^7.0.1` |
| `kendo-data-query` | Client-side data query helpers |

### Secondary

| Package | Version | Role |
|---------|---------|------|
| `ng-zorro-antd` | `^19.0.2` | Ant Design component library |
| `@angular/material` | `^19.1.5` | Material Design components |
| `@angular/cdk` | `^19.1.5` | Component Dev Kit (overlays, DnD, etc.) |
| `@ng-bootstrap/ng-bootstrap` | `^18.0.0` | Bootstrap Angular components |
| `bootstrap` | `^4.5.2` | Bootstrap CSS |
| `@ant-design/icons-angular` | `^19.0.0` | Ant Design icon set |
| Font Awesome Pro | `6.5.1` | Icon font (bundled in `libs/ui/assets`) |

---

## 8. Charts & Visualization

| Package | Version | Role |
|---------|---------|------|
| `highcharts` | `^12.3.0` | Highcharts core |
| `highcharts-angular` | `^5.1.0` | Angular wrapper |
| `angular-highcharts` | `^17.0.1` | Alternative wrapper |
| `gojs` | `^3.1.0` | Interactive diagrams / flow charts |
| `gojs-angular` | `2.0.8` | Angular wrapper for GoJS |
| `angular2-chartjs` | `^0.5.1` | Chart.js wrapper |
| `chartist` | `^1.3.0` | Lightweight SVG charts |
| `ng-chartist` | `^9.0.0` | Angular Chartist wrapper |
| Kendo Charts | `18.1.0` | (see UI section above) |

---

## 9. Rich Text & Code Editors

| Package | Version | Role |
|---------|---------|------|
| `ngx-summernote` | `^1.0.0` | Summernote rich text editor (Angular) |
| `summernote` | `^0.9.1` | Summernote core |
| `@codemirror/state` | `^6.5.3` | CodeMirror 6 state |
| `@codemirror/view` | `^6.39.5` | CodeMirror 6 editor view |
| `@codemirror/language` | `^6.12.1` | Language support |
| `@codemirror/commands` | `^6.10.1` | Built-in commands |
| `@codemirror/autocomplete` | `^6.20.0` | Autocomplete extension |
| `@codemirror/lang-javascript` | `^6.2.4` | JS/TS language mode |

---

## 10. Internationalization (i18n)

| Package | Version | Role |
|---------|---------|------|
| `@ngx-translate/core` | `^16.0.4` | Runtime translation service |
| `@ngx-translate/http-loader` | `^16.0.1` | HTTP-based translation loader |
| `@angular/localize` | `^19.1.7` | Angular built-in i18n |

**Convention:** All strings via `ngx-translate` using hierarchical keys `module.component.text`.

---

## 11. Real-time & Networking

| Package | Version | Role |
|---------|---------|------|
| `@microsoft/signalr` | `^8.0.0` | WebSocket / SignalR real-time |
| `@ngx-loading-bar/core` | `^7.0.0` | HTTP loading progress bar |
| `@ngx-loading-bar/http-client` | `^7.0.0` | HTTP interceptor integration |
| `@ngx-loading-bar/router` | `^7.0.0` | Router event integration |
| `@ngx-progressbar/core` | `^5.3.2` | Alternative progress bar |

---

## 12. Firebase

| Package | Version | Role |
|---------|---------|------|
| `firebase` | `^12.4.0` | Firebase JS SDK |
| `@angular/fire` | `^20.0.1` | Angular Firebase integration |

---

## 13. Form Utilities

| Package | Version | Role |
|---------|---------|------|
| `ngx-mask` | `^19.0.6` | Input masking |
| `ngx-captcha` | `^13.0.0` | CAPTCHA integration |
| `ngx-color-picker` | `^17.0.0` | Color picker component |
| `@ctrl/ngx-emoji-mart` | `^9.2.0` | Emoji picker |

---

## 14. Storage & Persistence

| Package | Version | Role |
|---------|---------|------|
| `ngx-indexed-db` | `19.4.3` | IndexedDB wrapper |
| `ngx-cookie-service` | `^19.1.0` | Cookie management |
| `store` | `^2.0.12` | localStorage abstraction |

---

## 15. Utility Libraries

| Package | Version | Role |
|---------|---------|------|
| `lodash` | `^4.17.21` | General-purpose utilities |
| `date-fns` | `^4.1.0` | Date manipulation (preferred) |
| `moment` | `^2.30.1` | Legacy date manipulation |
| `jwt-decode` | `^4.0.0` | JWT token decoding |
| `file-saver` | `^2.0.5` | Browser file download |
| `xlsx` | `^0.18.5` | Excel read/write |
| `pdfobject` | `^2.3.1` | PDF embedding |
| `swiper` | `^12.1.0` | Touch slider/carousel |
| `ngx-image-cropper` | `^9.1.5` | Client-side image crop |
| `ngx-infinite-scroll` | `^19.0.0` | Infinite scroll |
| `ngx-scrollbar` | `^18.0.0` | Custom scrollbar |
| `ngx-perfect-scrollbar` | `^10.1.1` | Perfect scrollbar (legacy) |
| `ngx-toastr` | `^19.0.0` | Toast notifications |
| `angular-gridster2` | `^19.0.0` | Dashboard grid layout |
| `angular2-uuid` | `^1.1.1` | UUID generation |
| `unorm` | `^1.6.0` | Unicode string normalization |
| `core-js` | `^3.40.0` | ES polyfills |
| `jquery` | `^3.5.1` | DOM utility (Summernote dep) |

---

## 16. Testing

| Package | Version | Role |
|---------|---------|------|
| `jest` | `^29.7.0` | Unit test runner |
| `jest-preset-angular` | `^14.5.4` | Angular Jest preset |
| `jest-environment-jsdom` | `^29.7.0` | DOM environment |
| `ts-jest` | `^29.3.1` | TypeScript Jest transformer |
| `@playwright/test` | `^1.51.1` | E2E test runner |
| `@nx/playwright` | `^20.7.2` | Nx Playwright integration |
| `msw` | `^2.7.3` | Mock Service Worker |
| Storybook | `^8.4.6` | Component development environment |
| `@storybook/angular` | `^8.6.4` | Angular Storybook integration |

**Test commands:**
```bash
nx test <project>              # Unit tests (Jest)
nx e2e shell-e2e               # E2E tests (Playwright)
playwright test --ui           # Playwright UI mode
```

---

## 17. Linting & Formatting

| Package | Version | Role |
|---------|---------|------|
| `eslint` | `^9.8.0` | JavaScript/TypeScript linting |
| `angular-eslint` | `^19.0.2` | Angular-specific lint rules |
| `typescript-eslint` | `^8.19.0` | TypeScript ESLint rules |
| `prettier` | `^3.6.2` | Code formatter |
| `stylelint` | `^16.26.1` | CSS/SCSS linting |
| `stylelint-config-standard-scss` | `^16.0.0` | SCSS standard config |
| `dependency-cruiser` | `^16.10.2` | Import graph validation |

---

## 18. Coding Conventions

| Concern | Convention |
|---------|-----------|
| File naming | `kebab-case` |
| Interfaces | `I`-prefix (e.g. `IEmployee`) |
| Observables | `$`-suffix (e.g. `data$`) |
| CSS methodology | BEM |
| Change detection | `OnPush` on all presentation components |
| Component pattern | Smart (NgRx dispatch/select) vs Dumb (emit only) |
| i18n strings | `ngx-translate` with `module.component.text` keys |
| State selectors | `selectXxx` prefix |
| NgRx actions | `[Source] Event` format |
| Store access | Via facades in `libs/domain` — never directly from remote apps |

---

## 19. Environment & Configuration

| Item | Detail |
|------|--------|
| `.env` file | Inside `apps/shell/` — loaded at dev time via `scripts/setup-env.js` |
| `VITE_API_URL` | Backend API base URL |
| `VITE_HRE_API_URL` | HRE service URL |
| `VITE_USE_SSO` | Toggle SSO (`true`/`false`) |
| `VITE_CLIENT_ID` | OIDC client ID |
| `VITE_ISSUER_URI` | OIDC issuer URI |
| `auth-config.json` | OIDC / OAuth 2.0 configuration |
| `NODE_OPTIONS` | `--max_old_space_size=32768` for shell builds, `16384` for remotes |

---

## 20. Dev Tooling

| Tool | Version | Role |
|------|---------|------|
| `@compodoc/compodoc` | `^1.1.26` | API documentation generation |
| `webpack-bundle-analyzer` | `^4.10.2` | Bundle size analysis |
| `speed-measure-webpack-plugin` | `^1.5.0` | Webpack build timing |
| `@stagewise/toolbar` | `^0.4.9` | Dev toolbar |
| `cross-env` | `^7.0.3` | Cross-platform env vars |
| `concurrently` | (via scripts) | Parallel process runner |
| `wait-on` | (via scripts) | Wait for URL/port availability |
