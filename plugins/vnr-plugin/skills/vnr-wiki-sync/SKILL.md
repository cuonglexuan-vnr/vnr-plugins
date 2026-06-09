---
name: "vnr-wiki-sync"
description: "Synchronize the LLM wiki with the latest information from various sources docs/raw/"
argument-hint: "Optional: tên raw file cụ thể cần sync, hoặc để trống để sync tất cả"
compatibility: "Requires vnr-plugin project structure with vnr-plugin/ directory"
metadata:
  author: "VNR"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

Nếu `$ARGUMENTS` chứa tên file → chỉ sync file đó.
Nếu rỗng → sync toàn bộ `docs/raw/`.

---

## Mục đích

`vnr-wiki-sync` **compile** raw source documents thành wiki pages có cấu trúc.

- **Input**: `docs/raw/*.md` (immutable — không bao giờ sửa)
- **Output**: `docs/wiki/` (LLM-owned markdown files)
- **Navigation**: `docs/wiki/index.md` (auto-generated từ frontmatter)

---

## Wiki Structure

```
docs/wiki/
├── index.md            # Derived artifact — auto-generated từ frontmatter
├── glossary.md         # Append-only term lookup table
├── log.md              # Append-only sync history
│
├── domains/            # Business knowledge: entities + workflows
├── patterns/           # Technical reference: how the system IS built
├── guides/             # How-to recipes: building NEW things
├── rules/              # Enforced coding standards
└── decisions/          # ADRs + architectural rationale
```

---

## Workflow Step-by-Step

### Step 1 — Inventory

```
1a. Đọc docs/wiki/log.md → xác định timestamp sync gần nhất
1b. Đọc docs/wiki/index.md → catalog các pages hiện có
1c. List files trong docs/raw/ → xác định files cần xử lý:
    - Nếu $ARGUMENTS có tên file → chỉ xử lý file đó
    - Nếu rỗng → xử lý tất cả raw files
```

### Step 2 — Process each raw file

Với mỗi raw file cần xử lý:

```
2a. Đọc toàn bộ nội dung raw file
2b. Phân tích → xác định content blocks
2c. Với mỗi content block, classify theo bảng dưới
2d. Xác định: page đã tồn tại? → UPDATE | page mới? → CREATE
2e. Tạo/cập nhật page với frontmatter đúng format
2f. Cập nhật cross-references ([[wikilinks]]) giữa các pages
```

### Step 3 — Regenerate index.md

```
3a. Đọc frontmatter của MỌI page trong tất cả 5 folders
3b. Group theo folder: domains/, patterns/, guides/, rules/, decisions/
3c. Build catalog table: [[id]] | type | summary (từ frontmatter)
3d. Overwrite docs/wiki/index.md hoàn toàn từ frontmatter data
```

### Step 4 — Append log.md

```
4a. Tạo entry mới:
## [YYYY-MM-DD] sync | <tên raw file hoặc "full sync">

**Actor:** vnr-wiki-sync  
**Sources processed:** [list raw files]  
**Pages created:** [list new pages]  
**Pages updated:** [list updated pages]  
**Pages unchanged:** [count]
```

### Step 5 — Validate

```
5a. Orphan check: mọi page phải có ít nhất 1 inbound link từ page khác hoặc index.md
5b. Frontmatter check: mọi page phải có đủ 8 fields (id, title, folder, type, tags, related, updated, summary)
5c. Link check: mọi [[wikilink]] phải trỏ đến id tồn tại trong wiki
5d. Summary check: mọi summary ≤ 120 chars
5e. Báo cáo: số pages created/updated/unchanged, warnings nếu có
```

---

## Classification Flowchart

Dùng để quyết định page mới thuộc folder nào:

```
Nội dung là term/abbreviation definition?
  YES → append vào glossary.md (không tạo page riêng)

Nội dung mô tả DB table (fields, FK, validation)?
  YES → domains/ (type: entity)
        filename: {entity-name}.md (lowercase, kebab-case)

Nội dung mô tả business process (states, transitions, actors, rules)?
  YES → domains/ (type: workflow)
        filename: workflow-{name}.md

Nội dung có numbered steps để build tính năng MỚI?
  YES → guides/ (type: recipe)
        filename: how-to-{verb-noun}.md

Nội dung mô tả HOW hệ thống hiện tại hoạt động (architecture, runtime flows, component structures)?
  YES → patterns/ (type: architecture | flow | component)
        filename: {descriptive-noun}.md

Nội dung là coding standard HIỆN đang được enforce (must/must-not)?
  YES → rules/ (type: standard | convention | constraint)
        filename: {noun}-conventions.md hoặc {noun}-rules.md

Nội dung giải thích TẠI SAO một quyết định kỹ thuật được đưa ra?
  YES → decisions/ (type: adr)
        filename: adr-{NNN}-{slug}.md
```

**Litmus test sentences:**
- "The business **models** X as..." → `domains/`
- "The system **does** X at runtime" → `patterns/`
- "To **build** X, follow steps 1-N" → `guides/`
- "X **must always** be Y" → `rules/`
- "We **chose** X **because**..." → `decisions/`
- "X **means**..." → `glossary.md`

---

## Page Format (Bắt buộc)

Mọi wiki page phải có frontmatter đầy đủ:

```yaml
---
id: hre-profile                    # kebab-case, globally unique across ENTIRE wiki
title: "Hre_Profile Entity"        # Human-readable display name
folder: domains                    # domains | patterns | guides | rules | decisions
type: entity                       # See type taxonomy below
tags: [employee, profile, HRE]     # Lowercase, for semantic search
related: [sys-userinfo, hre-contract]  # [[wikilink]] target IDs
updated: 2026-06-09                # Date of last sync
summary: "..."                     # ≤120 chars — copied verbatim into index.md
---
```

### Type Taxonomy

| Folder | Valid types |
|--------|-----------|
| `domains/` | `entity`, `workflow` |
| `patterns/` | `architecture`, `flow`, `component` |
| `guides/` | `recipe` |
| `rules/` | `standard`, `convention`, `constraint` |
| `decisions/` | `adr` |

---

## Update vs Create Logic

### UPDATE existing page

Khi raw file có thêm thông tin về topic đã có page:

- **Thêm** sections mới vào page — không overwrite
- **Flag contradictions**: nếu thông tin mới mâu thuẫn với nội dung cũ:
  ```markdown
  > ⚠️ **Contradiction** (updated 2026-06-09): Raw source `05-*.md` states X,
  > but earlier source `02-*.md` states Y. Verify with team.
  ```
- **Update frontmatter**: `updated`, `tags`, `related` nếu cần
- **Update summary** nếu nội dung thay đổi đáng kể

### CREATE new page

Khi raw file có thông tin về topic chưa có page:

1. Determine folder + type + filename theo flowchart
2. Write full page với đủ frontmatter
3. Add cross-references `[[wikilink]]` trong body
4. Set `related` frontmatter field

---

## Invariants (Không bao giờ vi phạm)

1. **`docs/raw/` là immutable** — không bao giờ sửa raw files
2. **`index.md` là derived** — không edit thủ công, chỉ regenerate từ frontmatter
3. **`log.md` là append-only** — chỉ thêm, không sửa entries cũ
4. **`decisions/` là append-only** — không sửa ADRs cũ, chỉ tạo ADR mới supersede
5. **Filenames globally unique** — không có 2 pages cùng id, dù khác folder
6. **Không tạo subdirectories** — tất cả pages là flat files trong folder
7. **Không tạo page chỉ để "link to"** — page phải có nội dung thực sự
8. **summary ≤ 120 chars** — đây là gì xuất hiện trong index

---

## Ví dụ log entry

```markdown
## [2026-06-09] sync | docs/raw/03-data-and-auth.md

**Actor:** vnr-wiki-sync  
**Sources processed:** `docs/raw/03-data-and-auth.md`

**Pages created:**
- `domains/permission-model.md` — Business permission model extracted from data-and-auth

**Pages updated:**
- `patterns/data-permission-flow.md` — Added SP dimensions filter detail
- `patterns/authentication-flow.md` — Added external provider config class names

**Pages unchanged:** 19  
**Warnings:** None
```

---

## Sau khi sync

Report tóm tắt:

```
✅ vnr-wiki-sync complete
  Sources processed: N files
  Pages created: N | Pages updated: N | Pages unchanged: N
  Index: docs/wiki/index.md (regenerated, N total pages)
  Log: docs/wiki/log.md (entry appended)
  Warnings: [none | list issues]
```
