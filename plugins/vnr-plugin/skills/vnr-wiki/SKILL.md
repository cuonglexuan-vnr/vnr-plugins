---
name: "vnr-wiki"
description: >-
  Hướng dẫn agent đọc và điều hướng docs/wiki/ để lấy context nghiệp vụ và kỹ thuật
  trước khi plan, implement hoặc review.
argument-hint: "<câu hỏi hoặc domain cần tìm hiểu>"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

Nếu `$ARGUMENTS` không rỗng → dùng làm query để điều hướng đến section phù hợp.
Nếu rỗng → load toàn bộ index làm orientation.

---

## Mục đích

`docs/wiki/` là **knowledge base nghiệp vụ và kỹ thuật** của dự án — được tổng hợp từ `docs/raw/` bởi `vnr-wiki-sync`.

> Mọi agent cần hiểu hệ thống **phải đọc wiki trước**, không đọc thẳng `docs/raw/` trừ khi cần kiểm chứng nguồn gốc.

---

## Cấu trúc Wiki

```
docs/wiki/
├── index.md            # ← LUÔN ĐỌC ĐẦU TIÊN: catalog toàn bộ entries + Quick Lookup
├── glossary.md         # Tra cứu thuật ngữ / viết tắt
├── log.md              # Lịch sử sync
│
├── domains/            # Business knowledge (entities + workflows)
├── patterns/           # Technical reference: hệ thống hoạt động như thế nào
├── guides/             # How-to recipes: cách build tính năng mới
├── rules/              # Coding standards: phải tuân theo
└── decisions/          # ADRs: tại sao quyết định như vậy
```

---

## Bước 1 — LUÔN bắt đầu bằng `docs/wiki/index.md`

`index.md` có:
1. **Quick Lookup by Intent** — bảng "nếu bạn cần X, xem ở Y"
2. **Catalog theo folder** — mọi page với mô tả 1 dòng
3. **Cross-Reference Map** — khi tìm X nhưng không thấy ngay

Đọc Quick Lookup table trước để xác định folder, sau đó tìm page trong catalog.

---

## Bước 2 — Điều hướng theo mục đích

| Mục đích | Folder | Ví dụ |
|----------|--------|-------|
| Fields, FK, validation của entity DB | `domains/` | `hre-profile.md`, `sys-userinfo.md` |
| Business workflow, state machine | `domains/` | `permission-model.md`, `workflow-*` files |
| Hệ thống hoạt động như thế nào (runtime) | `patterns/` | `backend-request-flow.md` |
| Kiến trúc tổng quan, tech stack | `patterns/` | `system-overview.md`, `tech-stack.md` |
| Cách build tính năng mới (step-by-step) | `guides/` | `how-to-wire-permissions.md` |
| Naming convention, coding rules | `rules/` | `naming-conventions.md`, `coding-conventions.md` |
| Tại sao dùng approach X | `decisions/` | `adr-*.md` |
| Thuật ngữ không quen | `glossary.md` | lookup table |

---

## Chiến lược tìm kiếm theo phase

### Khi plan feature mới (vnr-plan)

```
1. docs/wiki/index.md → Quick Lookup → xác định entities + workflows liên quan
2. docs/wiki/domains/<entity>.md → fields, FK, validation rules
3. docs/wiki/domains/permission-model.md → business permission rules (nếu feature có phân quyền)
4. docs/wiki/patterns/system-overview.md → context module/layer nằm ở đâu trong hệ thống
```

### Khi implement (vnr-backend-developer)

```
1. docs/wiki/index.md → tìm entities + patterns liên quan
2. docs/wiki/domains/<entity>.md → field → Domain/Entity mapping
3. docs/wiki/patterns/backend-request-flow.md → SP calling pattern chuẩn
4. docs/wiki/patterns/backend-layers.md → đúng layer, đúng project
5. docs/wiki/rules/coding-conventions.md → Controller, Service, Audit conventions
6. docs/wiki/rules/naming-conventions.md → đặt tên đúng
7. docs/wiki/guides/how-to-wire-permissions.md → nếu feature cần permission
```

### Khi implement (vnr-frontend-developer)

```
1. docs/wiki/index.md → tìm patterns + rules liên quan
2. docs/wiki/patterns/frontend-page-structure.md → module/component structure
3. docs/wiki/patterns/frontend-request-flow.md → HTTP call pattern qua Facade
4. docs/wiki/patterns/vnr-module-design-system.md → component API
5. docs/wiki/rules/coding-conventions.md → FE conventions
6. docs/wiki/rules/i18n-conventions.md → i18n keys
7. docs/wiki/guides/how-to-wire-permissions.md → nếu feature cần permission
```

### Khi review architecture/security (vnr-arch-reviewer, vnr-sec-reviewer)

```
1. docs/wiki/patterns/system-overview.md → architecture constraints
2. docs/wiki/patterns/backend-layers.md → expected layer structure
3. docs/wiki/patterns/frontend-page-structure.md → expected FE structure
4. docs/wiki/domains/permission-model.md → permission model
5. docs/wiki/rules/coding-conventions.md → standards to verify against
```

### Khi viết testcases (vnr-testcase-writer)

```
1. docs/wiki/index.md → tìm domain entities + workflows
2. docs/wiki/domains/<entity>.md → validation rules → Negative test scenarios
3. docs/wiki/domains/permission-model.md → permission rules → Authorization scenarios
4. docs/wiki/patterns/frontend-request-flow.md → Happy path flow → E2E scenarios
```

### Khi viết report/user guide (vnr-tech-writer)

```
1. docs/wiki/patterns/system-overview.md → context hệ thống tổng quan
2. docs/wiki/domains/<entity>.md → field labels đúng với UI
3. docs/wiki/domains/permission-model.md → phân quyền để viết hướng dẫn
```

---

## Bước 3 — Kiểm chứng với `docs/raw/` khi cần

Chỉ đọc `docs/raw/` khi:
- Wiki entry chưa cover thông tin cần thiết.
- `log.md` cho thấy raw doc được cập nhật sau lần sync gần nhất.
- Cần xác nhận chi tiết kỹ thuật chính xác (field types, API endpoint params).

---

## Fallback — Khi wiki không có thông tin

```
1. Kiểm tra glossary.md → thuật ngữ có được định nghĩa không
2. Kiểm tra log.md → raw file nào chứa domain đó
3. Đọc trực tiếp docs/raw/<file>.md
4. Ghi chú: "Wiki chưa có entry cho <topic> — đọc từ raw/<file>"
5. (Tuỳ chọn) Sau khi xong task → chạy /vnr-wiki-sync để cập nhật wiki
```

---

## Invariants (Agent phải biết)

1. `index.md` luôn chứa MỌI page — nếu không có trong index thì page đó không tồn tại
2. `glossary.md` là lookup table — không phải page có nội dung sâu
3. Wikilinks dùng `[[id]]` = frontmatter `id` field của page (không phải filename đầy đủ)
4. Mỗi page có frontmatter `summary` — đó là nội dung xuất hiện trong index
5. `decisions/` dùng `adr-NNN-slug.md` format — nếu không có thì quyết định đó chưa được document
