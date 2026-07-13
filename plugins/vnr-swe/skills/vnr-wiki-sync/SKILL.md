---
name: "vnr-wiki-sync"
description: "Synchronize the LLM wiki with the latest information from various sources docs/raw/"
argument-hint: "Optional: tên raw file cụ thể cần sync, hoặc để trống để sync tất cả"
compatibility: "Requires the vnr-swe plugin installed"
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
Nếu `$ARGUMENTS` chứa `--force-overwrite` → regenerate sạch từng page (thay thế toàn bộ, KHÔNG append) — xem "Update vs Create Logic".

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
├── manifest.json       # Derived artifact — Loading Contract routing (Step 3.5)
├── glossary.md         # Append-only term lookup table
├── log.md              # Append-only sync history
│
├── domains/            # Business knowledge: entities + workflows
├── patterns/           # Technical reference: how the system IS built
├── guides/             # How-to recipes: building NEW things
├── rules/              # Enforced coding standards
├── stacks/             # Per-UI-library component catalogs + terse constraint cards
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
    - BỎ QUA (không compile): docs/raw/_schema/ (templates/spec) và docs/raw/_inbox/
      (staging của vnr-wiki-add). Mọi folder/file bắt đầu bằng `_` đều bỏ qua.
```

### Step 2 — Process each raw file

Với mỗi raw file cần xử lý:

```
2a. Đọc toàn bộ nội dung raw file
2b. Phân tích → xác định content blocks
2c. Với mỗi content block, classify theo bảng dưới
2d. Xác định: page đã tồn tại? → UPDATE | page mới? → CREATE
2e. Tạo/cập nhật page với frontmatter đúng format (8 fields + source_raw — xem Page Format)
2f. Cross-references: relative markdown links [Title](../<folder>/<slug>.md) — KHÔNG dùng [[wikilink]]
2g. Nếu raw có nguồn ngoài (external URLs) → emit section "# Citations" ở cuối body (format: [1] [text](url))
```

### Step 3 — Regenerate index.md

```
3a. Đọc frontmatter của MỌI page trong tất cả folders (domains, patterns, guides, rules, stacks, decisions)
3b. Group theo folder
3c. Catalog mỗi folder = OKF §6 bullet list (KHÔNG dùng GFM table). Emit `type` INLINE trong mỗi bullet
    (giữ tín hiệu type để downstream agents "tìm entries tagged <type>" vẫn hoạt động — index.md không còn cột Type):
      ## <folder>/
      * [Title](<folder>/<slug>.md) — `<type>` — description
    · Loại trừ page có tier: card (constraint-injection artifacts, không phải page điều hướng)
    · Mỗi page xuất hiện đúng MỘT lần trong folder của nó (không lặp giữa các section)
    · `<type>` lấy từ frontmatter của page (entity, workflow, architecture, flow, component, recipe,
      standard, convention, constraint, catalog, adr). Đây là tín hiệu điều hướng cho pipeline agents.
3d. Giữ thêm 2 bảng value-add (OKF cho phép section bổ sung): "Quick Lookup by Intent" + "Cross-Reference Map"
3e. Frontmatter index.md CHỈ chứa okf_version: "0.1" (KHÔNG updated/total_pages).
    total_pages → 1 dòng body dưới tiêu đề: **Total pages:** N
3f. Overwrite docs/wiki/index.md hoàn toàn từ frontmatter data
```

### Step 3.5 — Regenerate manifest.json (Wiki Loading Contract routing) ⭐

`docs/wiki/manifest.json` là **derived artifact** — máy đọc bởi `scripts/resolve-context.mjs`. Regenerate từ các routing fields trong frontmatter:

```
3.5a. Quét frontmatter MỌI page tìm các trường routing: stack, applies_to (globs), card, phase, tier.
      BỎ QUA reserved files (index.md, log.md, glossary.md) và mọi page có folder: root — không đưa vào manifest.
3.5b. Build `stacks[]` — gom theo `stack` id:
      - page có tier: card        → stack.card  = path của page đó
      - page có tier: always      → thêm vào stack.always
      - page khác (on_demand/unset)→ thêm vào stack.on_demand
      - stack.match = union các `applies_to` globs của các page thuộc stack đó
3.5c. Build `phases{}` — page CÓ `phase:[...]` nhưng KHÔNG có `stack`:
      - với mỗi phase trong list, nếu tier=always (default cho phase pages) → thêm path vào phases.<phase>.always
3.5d. Ghi docs/wiki/manifest.json:
      { "version":"1", "stacks":[...], "phases":{plan,implement,review:{always:[...]}} }
      Paths tương đối project root (docs/wiki/<folder>/<file>.md).
3.5e. Nếu KHÔNG có page nào mang routing fields → ghi manifest tối thiểu { version, stacks:[], phases:{} }
      (resolver sẽ no-op → pipeline chạy như cũ). KHÔNG xoá manifest hand-authored nếu chưa có gì để thay.
```

> Defaults theo folder khi page thiếu routing fields (tùy chọn, để bootstrap): `stacks/*-catalog.md` → stack=frontmatter.stack, tier=always; `stacks/*.card.md` → tier=card; `rules/*` → phase:[implement,review]; `patterns/*` (architecture) → phase:[plan]. Chỉ áp khi page chưa khai báo tường minh.

### Step 4 — Append log.md

```
4a. Tạo entry mới (OKF §7 — heading là bare ISO date `## YYYY-MM-DD`; context nằm trong body):
## YYYY-MM-DD

**Sync:** <tên raw file hoặc "full sync">

**Actor:** vnr-wiki-sync  
**Sources processed:** [list raw files]  
**Pages created:** [list new pages]  
**Pages updated:** [list updated pages]  
**Pages unchanged:** [count]
```

### Step 5 — Validate

```
5a. Chạy validator (BẮT BUỘC — OKF conformance): node "<PLUGIN_DIR>/scripts/okf-validate.mjs" --root <project-root> --layer wiki → phải 0 ERROR (WARN frozen-log-entry của log cũ chấp nhận được)
5b. Frontmatter check: mọi concept page đủ 8 fields (id, title, folder, type, tags, related, timestamp, description); page tier: card chỉ cần id + type
5c. Link check: mọi cross-reference là relative markdown link và resolve được; KHÔNG còn [[wikilink]] trong docs/wiki/
5d. Description check: mọi description ≤ 120 chars (truncate ở word boundary nếu vượt)
5e. Manifest check: mọi path trong manifest.json tồn tại; mỗi stack có `match` + `card` (okf-validate: MANIFEST-PATHS)
5f. Orphan check: mọi concept page có ít nhất 1 inbound link (index bullet hoặc page khác)
5g. Báo cáo: pages created/updated/unchanged, validator ERROR/WARN counts, manifest (N stacks, M phases)
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

> **Contract authority:** `docs/raw/_schema/README.md` (OKF profile + ERROR/WARN map) và
> `docs/raw/_schema/OKF-SPEC.md` (chuẩn OKF v0.1). Published bundle phải strict OKF §9; validate Step 5.

Mọi wiki page phải có frontmatter đầy đủ:

```yaml
---
id: hre-profile                    # kebab-case, globally unique across ENTIRE wiki
title: "Hre_Profile Entity"        # Human-readable display name
folder: domains                    # domains | patterns | guides | rules | stacks | decisions
type: entity                       # See type taxonomy below
tags: [employee, profile, HRE]     # Lowercase, for semantic search
related: [domains/sys-userinfo, domains/hre-contract]  # bundle paths (folder/slug), not flat ids
timestamp: 2026-06-09T00:00:00Z    # ISO 8601 datetime of last change (OKF)
description: "..."                  # ≤120 chars — emitted inline in index.md bullet (OKF `description`)
source_raw: docs/raw/<...>.md      # provenance — originating raw source file
---
```

### Type Taxonomy

| Folder | Valid types |
|--------|-----------|
| `domains/` | `entity`, `workflow` |
| `patterns/` | `architecture`, `flow`, `component` |
| `guides/` | `recipe` |
| `rules/` | `standard`, `convention`, `constraint` |
| `stacks/` | `catalog`, `card` |
| `decisions/` | `adr` |
| `root` (reserved) | `glossary` — glossary.md only; excluded from index catalog + manifest |

### Optional routing fields (drive `manifest.json` — Step 3.5)

In addition to the 8 required fields, pages may declare:

```yaml
stack: <stack-id>                 # UI-library/stack this page belongs to
applies_to: ["<glob>", ...]       # file globs that select this stack
card: docs/wiki/stacks/<stack>.card.md   # (catalog pages) terse card for the stack
phase: [plan, implement, review]  # phases where a non-stack page is mandatory
tier: always | on_demand | card   # always=load at phase entry; card=hook-injected
```

---

## Update vs Create Logic

### UPDATE existing page

Hai chế độ (theo `$ARGUMENTS`):

**`--force-overwrite`** — regenerate sạch: thay thế TOÀN BỘ page (frontmatter + body) từ raw source, KHÔNG append. Mỗi page dựng lại một lần từ đầu → không có section trùng lặp. Card files (không có raw source) KHÔNG bị re-sync. Dùng sau migration / khi cần regenerate chuẩn format.

**Default (incremental)** — khi raw file có thêm thông tin về topic đã có page:

- **Thêm** sections mới vào page — không overwrite
- **Flag contradictions**: nếu thông tin mới mâu thuẫn với nội dung cũ:
  ```markdown
  > ⚠️ **Contradiction** (as of 2026-06-09): Raw source `modules/<m>/workflows/<w>/business-rules.md`
  > states X, but earlier source `platform/shared/<topic>.md` states Y. Verify with team.
  ```
- **Update frontmatter**: `timestamp`, `tags`, `related` nếu cần
- **Update description** nếu nội dung thay đổi đáng kể

### CREATE new page

Khi raw file có thông tin về topic chưa có page:

1. Determine folder + type + filename theo flowchart
2. Write full page với đủ frontmatter
3. Add cross-references: relative markdown links `[Title](../folder/slug.md)` trong body
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
8. **description ≤ 120 chars** — đây là gì xuất hiện trong index (OKF `description`)

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
