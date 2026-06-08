---
name: "vnr-wiki"
description: >-
  Hướng dẫn agent đọc và điều hướng docs/wiki/ để lấy context nghiệp vụ
  (entities, concepts, topics, sources) trước khi plan, implement hoặc review.
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

`docs/wiki/` là **knowledge base nghiệp vụ** của dự án — được tổng hợp và index từ `docs/raw/` bởi `vnr-wiki-sync`.

> Mọi agent cần hiểu nghiệp vụ **phải đọc wiki trước**, không đọc thẳng `docs/raw/` trừ khi cần kiểm chứng nguồn gốc.

---

## Cấu trúc Wiki

```
docs/
├── raw/                    # INPUT — tài liệu gốc (KHÔNG sửa trực tiếp)
│   ├── api-http-contracts.md
│   ├── backend-architecture.md
│   ├── figma-ui-mapping.md
│   ├── frontend-architecture.md
│   └── solution-layout.md
│
└── wiki/                   # OUTPUT — đã được index & chuẩn hoá (ĐỌC TỪ ĐÂY)
    ├── index.md            # ← LUÔN ĐỌC ĐẦU TIÊN: danh mục toàn bộ entries
    ├── log.md              # Lịch sử sync: khi nào wiki được cập nhật, từ nguồn nào
    │
    ├── entities/           # Domain entities: table, fields, relationships, business rules
    ├── concepts/           # Khái niệm nghiệp vụ: workflow, state machine, business rule sets
    ├── topics/             # Chủ đề tổng hợp: feature overview, module summary
    ├── sources/            # Metadata nguồn gốc: mapping entry ↔ raw doc + page
    └── comparisons/        # So sánh, ADR, trade-off giữa các approach
```

---

## Quy tắc điều hướng

### Bước 1 — Luôn bắt đầu bằng `docs/wiki/index.md`

`index.md` chứa danh mục toàn bộ wiki entries với mô tả 1 dòng. Đọc để:
- Xác định entry nào liên quan đến task/query hiện tại.
- Lấy đường dẫn chính xác đến file cần đọc.

### Bước 2 — Điều hướng theo loại thông tin cần tìm

| Cần tìm | Đọc ở | Ví dụ |
|---------|-------|-------|
| Cấu trúc dữ liệu, fields, FK, validation | `entities/` | `entities/idp.md`, `entities/employee.md` |
| Business rule, workflow, state machine | `concepts/` | `concepts/idp-approval-flow.md` |
| Tổng quan feature, module overview | `topics/` | `topics/succession-planning.md` |
| Nguồn gốc thông tin, tham chiếu raw doc | `sources/` | `sources/idp.md` |
| So sánh approach, ADR | `comparisons/` | `comparisons/auth-approaches.md` |

### Bước 3 — Kiểm chứng với `docs/raw/` khi cần

Chỉ đọc `docs/raw/` khi:
- Wiki entry chưa cover thông tin cần thiết.
- Cần xác nhận chi tiết kỹ thuật chính xác (field types, API endpoint params).
- `log.md` cho thấy raw doc được cập nhật sau lần sync gần nhất.

---

## Chiến lược tìm kiếm theo task

### Khi plan feature mới (vnr-plan)
```
1. Đọc docs/wiki/index.md → tìm entities liên quan
2. Đọc docs/wiki/entities/<entity>.md → field list, validation, FK
3. Đọc docs/wiki/concepts/<workflow>.md → business rules, state transitions
4. Đọc docs/wiki/topics/<module>.md → context module rộng hơn
5. Kiểm tra docs/wiki/sources/<entry>.md → lấy reference đến raw doc nếu cần đào sâu
```

### Khi implement (vnr-backend-developer / vnr-frontend-developer)
```
1. Đọc docs/wiki/entities/<entity>.md → entity fields → ánh xạ sang Domain model
2. Đọc docs/wiki/concepts/<workflow>.md → business rules → ánh xạ sang Handler logic
3. Đọc docs/raw/api-http-contracts.md → endpoint đã tồn tại → tránh trùng lặp
4. Đọc docs/raw/solution-layout.md → xác định đúng service slice
```

### Khi review architecture/security (vnr-arch-reviewer, vnr-sec-reviewer)
```
1. Đọc docs/wiki/concepts/<auth-flow>.md → permission model, ownership rules
2. Đọc docs/raw/backend-architecture.md → kiến trúc tầng cụ thể
3. So sánh với code thực tế từ git diff
```

### Khi viết test (vnr-qc-generator, vnr-test-engineer)
```
1. Đọc docs/wiki/concepts/<feature>.md → AC, business rules → Happy Path scenarios
2. Đọc docs/wiki/entities/<entity>.md → validation rules → Validation & Error scenarios
3. Đọc docs/wiki/concepts/<auth>.md → phân quyền → Authorization scenarios
```

### Khi viết report/user guide (vnr-tech-writer)
```
1. Đọc docs/wiki/topics/<module>.md → tổng quan module để viết context
2. Đọc docs/wiki/concepts/<feature>.md → workflow → hướng dẫn sử dụng step-by-step
3. Đọc docs/wiki/entities/<entity>.md → field labels → đặt tên đúng với UI
```

---

## Đọc `log.md` để kiểm tra độ tươi

```markdown
# Cách đọc docs/wiki/log.md

log.md ghi lại mỗi lần sync:
- Timestamp sync gần nhất
- Raw files nào được xử lý
- Entries nào được tạo mới / cập nhật / xoá

→ Nếu raw doc có timestamp MỚI HƠN lần sync cuối → wiki có thể chưa cập nhật.
   Đọc trực tiếp raw doc đó thay vì wiki entry.
```

---

## Fallback — Khi wiki không có thông tin cần thiết

```
1. Kiểm tra log.md → raw file nào chứa domain đó
2. Đọc trực tiếp docs/raw/<file>.md
3. Ghi chú: "Wiki chưa có entry cho <topic> — đọc từ raw/<file>"
4. (Tuỳ chọn) Sau khi xong task → chạy /vnr-wiki-sync để cập nhật wiki
```

---

## Tích hợp với các agent khác

Các skill/agent tự động gọi `vnr-wiki` khi cần context:

| Trigger | Skill gọi wiki |
|---------|---------------|
| `/vnr-plan` | vnr-planner đọc wiki trước khi thiết kế |
| `/vnr-implement` | vnr-backend-developer / vnr-frontend-developer đọc wiki để ánh xạ business → code |
| `/vnr-auto-pipeline` | Step 1, 2, 3 đều cần wiki context |

Để inject wiki context vào bất kỳ Agent tool call nào, thêm vào prompt:

```
Trước khi thực hiện:
1. Đọc docs/wiki/index.md
2. Tìm và đọc các wiki entries liên quan đến <feature/domain>
3. Tuân theo hướng dẫn điều hướng trong vnr-plugin/skills/vnr-wiki/SKILL.md
```
