# /vnr-customize — Hướng dẫn sử dụng

> Skill cho phép customize hoặc tạo mới skill/agent trong bộ vnr-plugin bằng cách ghi đè (override) vào project scope (`.claude/`).

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Khi nào cần dùng](#2-khi-nào-cần-dùng)
3. [Cú pháp](#3-cú-pháp)
4. [Các kịch bản sử dụng](#4-các-kịch-bản-sử-dụng)
   - 4.1 Override skill có sẵn
   - 4.2 Override agent có sẵn
   - 4.3 Tạo mới skill
   - 4.4 Tạo mới agent
   - 4.5 Chế độ tương tác (interactive)
5. [Cấu trúc file được sinh ra](#5-cấu-trúc-file-được-sinh-ra)
6. [Dependency scan & cảnh báo](#6-dependency-scan--cảnh-báo)
7. [Các rule bắt buộc](#7-các-rule-bắt-buộc)
8. [Cách hoàn tác (revert)](#8-cách-hoàn-tác-revert)
9. [Skill/Agent không được phép customize](#9-skillagent-không-được-phép-customize)
10. [FAQ](#10-faq)

---

## 1. Tổng quan

Bộ vnr-plugin cung cấp sẵn các skill (slash command) và agent (system prompt) phục vụ cho pipeline phát triển phần mềm. Tuy nhiên, mỗi dự án có thể có yêu cầu riêng — ví dụ thay đổi bước plan, bổ sung thêm rule cho developer agent, hay thêm một skill mới hoàn toàn.

`/vnr-customize` cho phép bạn:

| Hành động | Mô tả |
|-----------|-------|
| **Override skill** | Sao chép skill gốc từ plugin vào `.claude/skills/`, từ đó chỉnh sửa mà không ảnh hưởng bản gốc |
| **Override agent** | Sao chép agent gốc từ plugin vào `.claude/agents/`, từ đó chỉnh sửa system prompt |
| **Tạo mới skill** | Tạo skill hoàn toàn mới tại `.claude/skills/` với template chuẩn |
| **Tạo mới agent** | Tạo agent hoàn toàn mới tại `.claude/agents/` với template chuẩn |

**Nguyên tắc cốt lõi**: Override, không sửa trực tiếp. File gốc trong `vnr-plugin/` luôn được giữ nguyên để đảm bảo update plugin không mất customization.

---

## 2. Khi nào cần dùng

| Tình huống | Giải pháp |
|------------|-----------|
| Muốn thay đổi cách `vnr-plan` sinh plan.md (ví dụ: thêm section riêng của dự án) | `/vnr-customize override skill vnr-plan` |
| Muốn chỉnh sửa system prompt của vnr-developer (ví dụ: thêm coding convention riêng) | `/vnr-customize override agent vnr-developer` |
| Dự án cần một skill mới để chạy lint trước khi implement | `/vnr-customize new skill vnr-lint` |
| Cần một agent chuyên dụng review database migration | `/vnr-customize new agent vnr-db-reviewer` |
| Muốn chỉnh sửa vnr-wiki | **Không được phép** — xem [mục 9](#9-skillagent-không-được-phép-customize) |

---

## 3. Cú pháp

```
/vnr-customize <action> <type> [name]
```

| Tham số | Giá trị | Bắt buộc | Mô tả |
|---------|---------|----------|-------|
| `action` | `override` hoặc `new` | Có (hỏi nếu thiếu) | Ghi đè skill/agent có sẵn hoặc tạo mới |
| `type` | `skill` hoặc `agent` | Có (hỏi nếu thiếu) | Loại đối tượng cần customize |
| `name` | Tên với prefix `vnr-` | Có (hỏi nếu thiếu) | Tên của skill/agent. Prefix `vnr-` được tự động thêm nếu thiếu |

**Từ đồng nghĩa được chấp nhận:**

| Nhập vào | Hiểu là |
|----------|---------|
| `update`, `edit`, `modify` | `override` |
| `create`, `add` | `new` |

**Thứ tự tham số linh hoạt** — các lệnh sau đều hợp lệ:

```
/vnr-customize override skill vnr-plan
/vnr-customize skill override vnr-plan
/vnr-customize vnr-plan override skill
```

---

## 4. Các kịch bản sử dụng

### 4.1 Override skill có sẵn

**Mục tiêu**: Chỉnh sửa hành vi của `/vnr-plan` cho riêng dự án này.

```
/vnr-customize override skill vnr-plan
```

**Kết quả:**

```
repo/
  .claude/
    skills/
      vnr-plan/
        SKILL.md          <-- Bản ghi đè, có thể chỉnh sửa tự do
```

File sinh ra giữ nguyên toàn bộ nội dung gốc, thêm trường `customization` trong frontmatter:

```yaml
---
name: "vnr-plan"
description: "Execute the implementation planning workflow..."
# ... (giữ nguyên các trường gốc)
customization:
  source: "vnr-plugin/skills/vnr-plan/SKILL.md"
  type: "skill-override"
  created: "2026-04-14"
---
```

Sau đó bạn chỉnh sửa nội dung Markdown bên dưới frontmatter theo nhu cầu.

---

### 4.2 Override agent có sẵn

**Mục tiêu**: Thêm coding convention riêng cho vnr-developer agent.

```
/vnr-customize override agent vnr-developer
```

**Kết quả:**

```
repo/
  .claude/
    agents/
      vnr-developer.md   <-- Bản ghi đè, có thể chỉnh sửa tự do
```

**Lưu ý quan trọng**: Các skill đang tham chiếu agent qua đường dẫn gốc `vnr-plugin/agents/vnr-developer.md`. Sau khi override agent, bạn cần **override luôn các skill** liên quan và cập nhật đường dẫn agent sang `.claude/agents/vnr-developer.md`.

Skill sẽ tự động quét và cảnh báo bạn về điều này (xem [mục 6](#6-dependency-scan--cảnh-báo)).

---

### 4.3 Tạo mới skill

**Mục tiêu**: Tạo skill `/vnr-lint` để chạy lint trước khi implement.

```
/vnr-customize new skill vnr-lint
```

Skill sẽ hỏi bạn:
1. Mô tả ngắn gọn (description)
2. Gợi ý tham số (argument hint)

**Kết quả:**

```
repo/
  .claude/
    skills/
      vnr-lint/
        SKILL.md          <-- Template có sẵn, bạn điền nội dung
```

File template:

```yaml
---
name: "vnr-lint"
description: "Run linting checks before implementation"
argument-hint: ""
user-invocable: true
customization:
  source: "new"
  type: "custom-skill"
  created: "2026-04-14"
---
```

Sau khi tạo, skill sẽ hỏi bạn có muốn điền nội dung ngay không.

---

### 4.4 Tạo mới agent

**Mục tiêu**: Tạo agent chuyên review database migration.

```
/vnr-customize new agent vnr-db-reviewer
```

Skill sẽ hỏi bạn:
1. Role title (ví dụ: "Database Migration Reviewer")
2. Mô tả ngắn gọn

**Kết quả:**

```
repo/
  .claude/
    agents/
      vnr-db-reviewer.md   <-- Template có sẵn, bạn điền system prompt
```

---

### 4.5 Chế độ tương tác (interactive)

Nếu bạn gọi không có tham số:

```
/vnr-customize
```

Skill sẽ hỏi lần lượt:

```
Bạn muốn làm gì?
[1] Override skill/agent có sẵn (customize plugin mặc định)
[2] Tạo mới skill/agent

> 1

Bạn muốn customize loại nào?
[1] Skill (slash command — ví dụ: /vnr-plan, /vnr-tasks)
[2] Agent (system prompt — ví dụ: vnr-planner, vnr-developer)

> 1

Các skill có thể override:

| #  | Skill                | Mô tả                                |
|----|----------------------|---------------------------------------|
| 1  | vnr-analyze          | Phân tích tính nhất quán              |
| 2  | vnr-auto-pipeline    | Pipeline tự động 9 bước              |
| 3  | vnr-checklist        | Sinh checklist tùy chỉnh             |
| 4  | vnr-clarify          | Làm rõ đặc tả                        |
| 5  | vnr-constitution     | Quản lý constitution                  |
| 6  | vnr-context-retrieval| Hướng dẫn truy xuất context           |
| 7  | vnr-implement        | Thực thi implementation               |
| 8  | vnr-plan             | Lập kế hoạch                          |
| 9  | vnr-run-e2e          | Chạy Playwright E2E tests             |
| 10 | vnr-run-testcases    | Chạy manual testcases                 |
| 11 | vnr-specify          | Viết đặc tả tính năng                 |
| 12 | vnr-tasks            | Chia plan thành tasks                 |

Chọn skill? (nhập số hoặc tên)
> 8
```

---

## 5. Cấu trúc file được sinh ra

### Skill override / new

```
.claude/skills/{name}/SKILL.md
```

Frontmatter bắt buộc:

```yaml
---
name: "{name}"
description: "..."
user-invocable: true          # true nếu muốn gọi trực tiếp bằng /{name}
customization:
  source: "vnr-plugin/skills/{name}/SKILL.md"   # hoặc "new"
  type: "skill-override"                         # hoặc "custom-skill"
  created: "YYYY-MM-DD"
---
```

### Agent override / new

```
.claude/agents/{name}.md
```

Frontmatter bắt buộc:

```yaml
---
name: "{name}"
role: "..."
description: "..."
customization:
  source: "vnr-plugin/agents/{name}.md"   # hoặc "new"
  type: "agent-override"                  # hoặc "custom-agent"
  created: "YYYY-MM-DD"
---
```

### Tổng quan cấu trúc sau khi customize

```
repo/
  .claude/
    skills/                       <-- Project-scope skills (ưu tiên hơn plugin)
      vnr-plan/
        SKILL.md
      vnr-lint/                   <-- Skill mới
        SKILL.md
    agents/                       <-- Project-scope agents
      vnr-developer.md
      vnr-db-reviewer.md          <-- Agent mới
    settings.json
  vnr-plugin/                     <-- Plugin gốc — KHÔNG CHỈNH SỬA
    skills/
    agents/
    ...
```

---

## 6. Dependency scan & cảnh báo

Sau mỗi lần tạo/override, skill **tự động quét** toàn bộ bộ vnr-plugin để tìm các tham chiếu liên quan.

### Các loại tham chiếu được phát hiện

| Loại | Ví dụ | Mức độ |
|------|-------|--------|
| **DIRECT_CALL** | `vnr-auto-pipeline` gọi `skill: "vnr-plan"` | Cần override caller |
| **AGENT_BINDING** | `vnr-implement` có `<agent_to_use>vnr-developer</agent_to_use>` | Cần override skill và cập nhật path |
| **ARTIFACT_DEPENDENCY** | Script kiểm tra `plan.md` tồn tại | Đảm bảo output tương thích |
| **DOCUMENTATION_REF** | Tên xuất hiện trong bảng, comment | Chỉ thông tin |
| **SCRIPT_REF** | Script tham chiếu tên skill/agent | Cần review thủ công |

### Ví dụ output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 KẾT QUẢ QUÉT PHỤ THUỘC cho: vnr-plan (skill)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  5 tham chiếu tìm thấy trong 3 file của vnr-plugin

┌───────────────────────────────────────────────
│ DIRECT_CALL
├───────────────────────────────────────────────
│ vnr-plugin/skills/vnr-auto-pipeline/SKILL.md
│   Dòng 119:  skill: "vnr-plan"
│   → vnr-auto-pipeline gọi vnr-plan trực tiếp.
│
│ AGENT_BINDING
├───────────────────────────────────────────────
│ vnr-plugin/skills/vnr-plan/SKILL.md
│   Dòng 23:  <agent_to_use>vnr-planner agent</agent_to_use>
│   → Skill này bind với agent vnr-planner.
│
│ ARTIFACT_DEPENDENCY
├───────────────────────────────────────────────
│ vnr-plugin/scripts/powershell/check-prerequisites.ps1
│   Dòng 98:  "Run /vnr-plan first..."
│   → Script kiểm tra plan.md output.
└───────────────────────────────────────────────

📋 ĐỀ XUẤT HÀNH ĐỘNG TIẾP THEO

| # | Hành động      | Đối tượng          | Lý do                              |
|---|----------------|--------------------|------------------------------------|
| 1 | Override skill | vnr-auto-pipeline  | Gọi vnr-plan trực tiếp             |
| 2 | Review script  | check-prerequisites| Kiểm tra định dạng output plan.md  |

Bạn muốn customize thêm mục nào? (nhập số "1,2" hoặc "skip")
```

---

## 7. Các rule bắt buộc

Khi customize, bạn **phải** tuân thủ các rule sau:

| # | Rule | Mô tả |
|---|------|-------|
| 1 | **Constitution compliance** | Không được xóa hoặc làm yếu các rule trong `vnr-plugin/memory/constitution.md`. Có thể bổ sung thêm rule riêng. |
| 2 | **Artifact format compatibility** | Nếu skill sinh artifact (plan.md, tasks.md, ...), định dạng output phải tương thích với các consumer phía sau. Tên file, vị trí, các section bắt buộc phải giữ nguyên. |
| 3 | **Standards reference** | Vẫn phải tham chiếu `vnr-plugin/standards/` cho tech stack và architecture. Có thể bổ sung, không được mâu thuẫn. |
| 4 | **Wiki integration** | Skill/agent trước đó đọc `docs/wiki/` thì phải tiếp tục đọc. Xóa wiki context sẽ làm mất liên tục kiến thức. |
| 5 | **Protected items** | `vnr-wiki` và `vnr-wiki-sync` không được override. |
| 6 | **Override, don't delete** | Chỉ ghi đè bằng project scope, không sửa file gốc trong `vnr-plugin/`. |

---

## 8. Cách hoàn tác (revert)

Để hoàn tác một customization, chỉ cần **xóa file/folder** override:

```bash
# Hoàn tác skill override
rm -rf .claude/skills/vnr-plan/

# Hoàn tác agent override
rm .claude/agents/vnr-developer.md
```

Sau khi xóa, Claude Code sẽ tự động sử dụng lại phiên bản gốc từ plugin.

**Lưu ý**: Nếu bạn đã override các skill liên quan (ví dụ override vnr-auto-pipeline để trỏ đến agent mới), nhớ hoàn tác tất cả để tránh tham chiếu đến file không tồn tại.

---

## 9. Skill/Agent không được phép customize

| Đối tượng | Lý do |
|-----------|-------|
| `vnr-wiki` | Quản lý wiki knowledge base — tất cả agent đều đọc từ đây. Thay đổi có thể làm hỏng pipeline. |
| `vnr-wiki-sync` | Đồng bộ dữ liệu từ `docs/raw/` sang `docs/wiki/`. Thay đổi có thể mất dữ liệu wiki. |

Nếu muốn thay đổi hành vi wiki:
- Cập nhật nội dung trực tiếp trong `docs/wiki/` hoặc `docs/raw/`
- Tạo skill bổ sung mới thay vì override

---

## 10. FAQ

### Q: Override có ảnh hưởng đến người dùng khác trong team không?

**Có**, nếu `.claude/` được commit lên repo. File trong `.claude/skills/` và `.claude/agents/` là project scope — áp dụng cho tất cả người dùng làm việc trên repo này. Hãy thông báo team trước khi commit.

### Q: Tôi có thể override nhiều skill/agent cùng lúc không?

Có. Chạy `/vnr-customize` nhiều lần, hoặc sử dụng tính năng **interactive follow-up** — sau mỗi override, skill sẽ gợi ý các item liên quan và bạn có thể chọn override tiếp.

### Q: Tôi override agent nhưng slash command vẫn dùng agent cũ?

Đúng. Skill tham chiếu agent qua **đường dẫn file** (ví dụ `vnr-plugin/agents/vnr-developer.md`). Sau khi override agent sang `.claude/agents/vnr-developer.md`, bạn cần **override luôn skill** và cập nhật đường dẫn. Skill sẽ tự động cảnh báo bạn về điều này trong Dependency Scan.

### Q: Override có bị mất khi update plugin không?

**Không**. File override nằm trong `.claude/`, hoàn toàn tách biệt với `vnr-plugin/`. Khi update plugin (chạy lại `vnr-bootstrap init --force`), chỉ `vnr-plugin/` bị ghi đè, `.claude/` không bị ảnh hưởng.

### Q: Làm sao biết file nào là override và file nào là gốc?

Kiểm tra trường `customization` trong YAML frontmatter:

```yaml
customization:
  source: "vnr-plugin/skills/vnr-plan/SKILL.md"  # <- đây là override
  type: "skill-override"
  created: "2026-04-14"
```

Nếu `source: "new"` thì đây là skill/agent mới do bạn tạo.

### Q: Tôi muốn override vnr-auto-pipeline để thay đổi thứ tự các bước?

```
/vnr-customize override skill vnr-auto-pipeline
```

Sau đó chỉnh sửa `.claude/skills/vnr-auto-pipeline/SKILL.md`. Lưu ý pipeline tham chiếu nhiều skill và agent khác — Dependency Scan sẽ liệt kê tất cả để bạn quyết định có cần override thêm không.
