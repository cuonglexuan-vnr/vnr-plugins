# Frontend Rules & Team Conventions — hrm-frontend-workspace

> Áp dụng: Nx + Angular 19 Micro-Frontend (Module Federation)
> Nguồn: `new_standards/VNR_Frontend_Code_Rules.md`
> Mục đích: Đảm bảo nhất quán, hiệu năng và dễ bảo trì trong monorepo.

---

## 1. Nguyên tắc chung

- Tuân thủ pattern container/presentation; dùng `VnrContainerBaseComponent` và `VnrFormBaseComponent` cho CRUD.
- Component presentation: `OnPush`, immutable data, `async` pipe.
- Components stateful: dùng **Facade pattern** để tương tác với NgRx store.
- Mỗi feature module remote phải expose routes qua `app.routes.ts` (`remoteRoutes`).
- Shared libs (`libs/*`) phải có public API file `index.ts`.

---

## 2. Cấu trúc & Naming

| Loại | Convention |
|------|-----------|
| Projects | `apps/<name>/`, `libs/<name>/` (kebab-case) |
| Component files | `feature-name.component.ts` (kebab-case), class PascalCase |
| Container components | `*-container.component.ts` extends `VnrContainerBaseComponent` |
| Presentation components | `*-list.component.ts`, `*-detail.component.ts` |
| Modules | `FeatureModule` in `feature.module.ts` |
| Services | `feature.service.ts`, `feature-api.service.ts`, `feature.facade.ts` |
| Interfaces | `I`-prefix (e.g. `IEmployee`) |
| Observables | `$`-suffix (e.g. `data$`) |
| CSS | BEM methodology in SCSS |
| i18n keys | `module.component.text` |

---

## 3. Module Federation Rules

- Remote phải `expose` `'./Routes'` trong `module-federation.config.ts`.
- Shell lazy-load remotes: `loadRemoteModule('remote','./Routes').then(m => m!.remoteRoutes)`.
- Không import remote modules trực tiếp vào shell code.
- Shared libs: `singleton: true` trong module-federation shared config.
- Tránh `eager: true` cho libs lớn trừ khi cần thiết.

---

## 4. VnrContainerBase & VnrFormBase

**Container** (`extends VnrContainerBaseComponent`):
- Gọi `this.initContainerBase()` trong `ngOnInit()`.
- Override `handleEvent()` để xử lý toolbar events.
- Dùng `openComponentByType('drawer', Component, context)` để mở forms.

**Form** (`extends VnrFormBaseComponent`):
- Implement `buildForm(): FormGroup`.
- Implement `getApiCreateUrl()`, `getApiUpdateUrl()`, `getApiDetailUrl()`.
- Gọi `this.initializeForm()` trong `ngOnInit()`.

---

## 5. NgRx & Facade Rules

| Rule | Detail |
|------|--------|
| Store access | Components không access `Store` trực tiếp — dùng Facade |
| Actions | `${Feature}Actions.load${Entities}` / `${Feature}Actions.create${Entity}` |
| Effects | Handle API calls, dispatch success/failure actions |
| Reducers | Pure functions, dùng `createReducer` |
| Selectors | Memoized selectors (`selectXxx` prefix) |
| Tests | Unit tests cho reducers, effects, facades |

---

## 6. HTTP & API Rules

- Dùng `HttpClient` với typed responses: `this.http.get<ApiResult<GoalDto>>(url)`.
- API contract: `IApiResult<T> { success: boolean; data?: T; message?: string }`.
- Dùng interceptors cho token injection và global error handling.
- Base components dùng `saveApi()` patterns trong `VnrFormBaseComponent`.

---

## 7. Performance & Change Detection

- Presentation components: `ChangeDetectionStrategy.OnPush`.
- Tránh `async` calls trong templates không dùng `async` pipe.
- Dùng `trackBy` cho `*ngFor`.
- Dùng memoized selectors cho large store slices.
- Lazy-load heavy libs (charts, gojs) chỉ trong modules cần.

---

## 8. Testing

| Layer | Tool | Target |
|-------|------|--------|
| Unit | Jest | `*.spec.ts` kế bên component |
| E2E | Playwright | `nx e2e <project>` |
| Coverage | — | ≥ 80% cho changed modules |

- Mock Facades/Services trong component tests.
- E2E cho các critical flows (login, CRUD).

---

## 9. Accessibility & i18n

- Dùng `@ngx-translate/core` cho tất cả strings; keys: `module.component.text`.
- **Tất cả file i18n đều tập trung tại `apps/shell/assets/i18n/`** (VN.json, EN.json, CN.json).
  - Không tạo thư mục `assets/i18n/` riêng trong các remote app.
  - Khi thêm tính năng mới, append keys vào đúng section trong các file shell i18n.
- ARIA attributes cho interactive components (dialogs, grids).
- Storybook cho UI documentation & accessibility checks.

---

## 10. Linting & Formatting

- ESLint + Angular ESLint config; Prettier cho formatting.
- Husky/commitlint recommended but optional.

---

## 11. Build & Deployment

```bash
npm run build-libs                    # Build libs trước
nx build shell                        # → dist/apps/shell
nx build objEval --outputPath=dist/apps/shell/apps/objEval
```

Đảm bảo module-federation shared config alignment giữa shell và remotes.

---

## 12. Security

- Dùng `AuthGuard` trên routes và kiểm tra permissions trên UI actions.
- Không expose sensitive data trong frontend code (no secrets in repo).
- Validate inputs client-side nhưng dựa vào backend validation là source of truth.

---

## 13. Component Library Selection — vnr-module vs nz-*

> **Đây là quy tắc bắt buộc** — vi phạm sẽ bị reject ở code review.

VNR wrap và mở rộng `ng-zorro-antd` trong `@hrm-frontend-workspace/vnr-module`. **Luôn dùng `vnr-module` components thay vì `nz-*` trực tiếp.**

| Chức năng | ✅ Dùng | ❌ Không dùng |
|-----------|---------|--------------|
| Danh sách dữ liệu | `vnr-grid`, `vnr-grid-new` | `nz-table` |
| Modal / confirm / error dialog | VNR modal wrapper (vnr-module/components/modal/) | `NzModalService` |
| Drawer / form slide-in | VNR drawer wrapper / `VnrFormBaseComponent` | `nz-drawer` |
| Dropdown entity picker | VNR advanced select, org picker, employee picker | `nz-select` |
| Date picker | VNR date picker | `nz-date-picker` |
| Input / Textarea | VNR input components | `nz-input`, `nz-textarea` |
| File upload | VNR file upload | `nz-upload` |
| List view | VNR list view wrapper | `nz-list` |
| Tree / tree-select | VNR treelist | `nz-tree` |
| Filter UI | VNR advanced filter builder | custom nz-form |
| Toolbar / page header | `vnr-toolbar`, `vnr-toolbar-v2` | `nz-page-header` |
| Form validation messages | VNR validation components | div tự build |

**Ngoại lệ được phép** (không có vnr-module equivalent):  
`nz-switch`, `nz-tag`, `nz-divider`, `nz-alert`, `nz-result`, `nz-tooltip`, `nz-checkbox`, `nz-radio`, `nz-icon`, `nz-spin`, `nz-skeleton`, `cdkDragDrop`.

📖 **Chi tiết đầy đủ:** `vnr-plugin/standards/frontend/05-vnr-module-components.md`

---

## 14. Pre-merge Checklist

- [ ] Component & service unit tests added (≥80% coverage)
- [ ] Facade pattern dùng khi có NgRx
- [ ] Lint & format passed (`npm run nx-lint`)
- [ ] Accessibility basics checked (aria, keyboard)
- [ ] Module Federation exposes `./Routes` nếu là remote
- [ ] Không có direct imports của remote modules trong shell
- [ ] E2E tests cho critical flows
- [ ] Không có secrets trong code
- [ ] **Không có `nz-table`, `NzModalService`, `nz-drawer`, `nz-input` trong code** — dùng `vnr-module` equivalents (xem `05-vnr-module-components.md`)

---

## Tài liệu tham khảo

| File | Mô tả |
|------|-------|
| `libs/ui/components/vnr-base/components/vnr-container-base.component.ts` | Container base |
| `libs/ui/components/vnr-base/components/vnr-form-base.component.ts` | Form base |
| `apps/shell/module-federation.config.ts` | Shell MF config |
| `apps/objEval/module-federation.config.ts` | Remote MF config (example) |
| `apps/shell/src/app/app.routes.ts` | Shell route table |
| `apps/objEval/src/app/app.routes.ts` | Remote routes (example) |
| `libs/core/auth/services/auth.service.ts` | Auth service |
| `libs/store/reducers.ts` | Root reducer |
| `vnr-plugin/standards/frontend/01-tech-stack.md` | Tech stack |
| `vnr-plugin/standards/frontend/02-architecture-and-structure.md` | Architecture |
| `vnr-plugin/standards/frontend/03-permission.md` | Permission system |
