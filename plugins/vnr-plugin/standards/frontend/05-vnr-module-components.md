# Frontend Component Library — vnr-module vs ng-zorro

> **MANDATORY**: Tất cả agents (vnr-planner, vnr-task-breaker, vnr-developer) phải tuân theo chuẩn này.  
> **KHÔNG BAO GIỜ** dùng `nz-*` components trực tiếp trong thiết kế plan hoặc task.  
> **LUÔN LUÔN** dùng `vnr-module` equivalents từ `@hrm-frontend-workspace/vnr-module`.

---

## Tại sao?

`ng-zorro-antd` (`nz-*`) là thư viện UI thô. VNR bọc và mở rộng chúng trong `vnr-module` để:
- Tích hợp permission, i18n, toast, loading state mặc định.
- Đảm bảo UX nhất quán theo VNR Design System.
- Chuẩn hóa API contract giữa các remote app.

**Dùng `nz-*` trực tiếp = vi phạm kiến trúc, sẽ bị reject ở code review.**

---

## Bảng ánh xạ (Mapping Table)

| ❌ KHÔNG dùng (`nz-*` / Material / CDK trực tiếp) | ✅ THAY BẰNG (`vnr-module`) | Import từ |
|---|---|---|
| `nz-table`, `nz-thead`, `nz-tbody`, `nz-tr`, `nz-td` | `vnr-grid` (grid chuẩn) hoặc `vnr-grid-new` (grid mới) | `vnr-module/components/grids/` |
| `nz-modal`, `NzModalService.create()`, `NzModalService.confirm()`, `NzModalService.error()` | VNR dialog/modal wrapper từ `vnr-module/components/modal/` | `vnr-module/components/modal/` |
| `nz-page-header` + action buttons tự build | `vnr-toolbar` (toolbar v1) hoặc `vnr-toolbar-v2` (toolbar v2) | `vnr-module/components/toolbar/` |
| `nz-select`, `nz-option` (generic) | VNR advanced select | `vnr-module/components/selects/` |
| `nz-date-picker`, `nz-range-picker` | VNR date picker | `vnr-module/components/pickers/` |
| org picker tự build | VNR org picker | `vnr-module/components/pickers/` |
| employee picker tự build | VNR employee picker | `vnr-module/components/pickers/` |
| `nz-input`, `nz-textarea`, `nz-input-number` | VNR input components | `vnr-module/components/inputs/` |
| `nz-upload` | VNR file upload | `vnr-module/components/uploads/` |
| `nz-list` | VNR list view wrapper | `vnr-module/components/listview/` |
| form error DIV tự build | VNR validation components | `vnr-module/components/validation/` |
| `nz-tree`, `nz-tree-select` | VNR treelist | `vnr-module/components/treelist/` |
| Filter UI tự build (form + search button) | VNR advanced filter builder | `vnr-module/components/filter/` |

---

## Quy tắc chi tiết cho từng loại component

### Grids (Danh sách dữ liệu)

```
✅ <vnr-grid ...>          — danh sách chuẩn (có phân trang, sort, filter tích hợp)
✅ <vnr-grid-new ...>      — grid phiên bản mới (dùng cho feature mới từ 2025)
❌ <nz-table ...>
❌ <kendo-grid ...>        — chỉ dùng nếu feature đặc thù cần Kendo (pivot, grouping phức tạp)
```

**Import module**: `VnrGridModule` hoặc `VnrGridNewModule` từ `@hrm-frontend-workspace/vnr-module`.

### Modal / Dialog

```
✅ VNR modal wrapper service (inject từ vnr-module/components/modal)
   — confirm dialog:  vnrModal.confirm({ title, content, onOk })
   — error dialog:    vnrModal.error({ title, content })
   — custom dialog:   vnrModal.open(Component, config)
❌ NzModalService.confirm()
❌ NzModalService.error()
❌ NzModalService.create()
```

**Với drawer (form bên cạnh)**:
```
✅ VNR drawer wrapper từ vnr-module/components/modal/ (nếu có)
   hoặc VnrFormBaseComponent pattern (openComponentByType('drawer', ...))
❌ <nz-drawer ...>
```

### Toolbar / Page Header

```
✅ <vnr-toolbar>        — toolbar v1 (tìm kiếm + action buttons bên phải)
✅ <vnr-toolbar-v2>     — toolbar v2 (layout mới, flex)
❌ <nz-page-header>
❌ tự build div + nz-button-group
```

### Filter

```
✅ VNR advanced filter builder từ vnr-module/components/filter/
❌ tự build form nz-select + nz-date-picker
```

### Selects / Dropdowns

```
✅ VNR advanced select (vnr-module/components/selects/) — cho dropdown entity
✅ VNR org picker      — chọn phòng ban / đơn vị
✅ VNR employee picker — chọn nhân viên
❌ <nz-select> + <nz-option> (generic) — chỉ chấp nhận khi select đơn giản không có entity
❌ <nz-tree-select>
```

### Inputs / Form Fields

```
✅ VNR input components (vnr-module/components/inputs/)
❌ <nz-input>
❌ <nz-textarea>
❌ <nz-input-number>
```

### Validation Messages

```
✅ VNR validation components (vnr-module/components/validation/)
❌ <nz-form-explain>
❌ tự build <div class="error-msg">
```

### Upload

```
✅ VNR file upload (vnr-module/components/uploads/)
❌ <nz-upload>
```

### Treelist / Tree

```
✅ VNR treelist (vnr-module/components/treelist/)
❌ <nz-tree>
❌ <nz-tree-select>
```

### List View (non-grid)

```
✅ VNR list view wrapper (vnr-module/components/listview/)
❌ <nz-list>
❌ <nz-list-item>
```

---

## Ghi chú trong task descriptions

Khi viết task (trong `tasks.md`), phải dùng tên component `vnr-module` chính xác:

```markdown
# ✅ Đúng
- [ ] T031 [S1] Create container template `scc-talent-tier-container.component.html`
  _vnr-toolbar-v2 (title="Phân tầng nhân tài", addBtn ref). VNR advanced select filter
  (active/all/inactive). vnr-grid-new (columns: drag-handle, color tag, name, 9-box text,
  status switch, action buttons). vnr-grid-new empty state VM-I01/VM-I02._

# ❌ Sai
- [ ] T031 [S1] Create container template ...
  _nz-card[nzTitle=...]. nz-select filter. nz-table[nzData][nzLoading]. nz-empty._
```

---

## Ngoại lệ được phép (Approved Exceptions)

Một số `nz-*` / `kendo-*` components được phép dùng trực tiếp khi **không có vnr-module equivalent**:

| Component | Điều kiện |
|-----------|-----------|
| `nz-switch` | Toggle trạng thái đơn giản — OK nếu vnr-module chưa có wrapper |
| `nz-tag` | Label/badge hiển thị — OK nếu chỉ display |
| `nz-divider` | Separator layout — OK |
| `nz-alert` | Thông báo inline — OK nếu vnr-module chưa có |
| `nz-result` | Error/empty state page-level — OK |
| `nz-tooltip`, `[nz-tooltip]` | Tooltip — OK |
| `nz-checkbox`, `nz-radio` | Checkbox/radio đơn giản — OK nếu không trong form phức tạp |
| `nz-icon` | Icon render — OK |
| `nz-spin`, `nz-skeleton` | Loading state — OK nếu vnr-module chưa có wrapper |
| `kendo-grid` | Chỉ khi feature cần grouping / pivot / Excel export nâng cao |
| `cdkDragDrop`, `cdkDropList` | Drag-drop từ `@angular/cdk` — OK, không có vnr-module equivalent |

**Nguyên tắc**: Ngoài danh sách trên, bất kỳ `nz-*` nào khác đều phải có justification rõ ràng trong task hoặc plan.

---

## Checklist cho agents

Trước khi hoàn thành plan hoặc tasks, self-check:

- [ ] Không có `nz-table` nào trong component templates — đã thay bằng `vnr-grid` / `vnr-grid-new`?
- [ ] Không có `NzModalService` call nào — đã thay bằng VNR modal wrapper?
- [ ] Không có `nz-select` nào cho entity picker — đã thay bằng VNR advanced select / pickers?
- [ ] Không có `nz-drawer` nào — đã dùng VNR drawer wrapper hoặc `VnrFormBaseComponent`?
- [ ] Không có `nz-input` / `nz-textarea` nào trong form — đã thay bằng VNR input components?
- [ ] Filter UI dùng VNR filter builder, không tự build?
- [ ] Toolbar dùng `vnr-toolbar` / `vnr-toolbar-v2`?

---

## Tài liệu tham khảo

| Path | Nội dung |
|------|---------|
| `src/frontend/libs/vnr-module/components/grids/` | Grid components source |
| `src/frontend/libs/vnr-module/components/modal/` | Modal/drawer wrapper source |
| `src/frontend/libs/vnr-module/components/toolbar/` | Toolbar v1 & v2 source |
| `src/frontend/libs/vnr-module/components/filter/` | Advanced filter builder |
| `src/frontend/libs/vnr-module/components/pickers/` | Date, org, employee pickers |
| `src/frontend/libs/vnr-module/components/selects/` | Advanced select |
| `src/frontend/libs/vnr-module/components/inputs/` | VNR inputs |
| `src/frontend/libs/vnr-module/components/uploads/` | File upload |
| `src/frontend/libs/vnr-module/components/listview/` | List view |
| `src/frontend/libs/vnr-module/components/validation/` | Form validation |
| `src/frontend/libs/vnr-module/components/treelist/` | Treelist |
