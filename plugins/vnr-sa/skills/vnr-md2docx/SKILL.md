---
name: "vnr-md2docx"
description: "Convert a VNR playbook Markdown document into a branded DOCX deliverable using the standard VNR Word template (cover page, revision/approval history, auto TOC, auto-numbered headings, captioned tables, header/footer). Use when the user asks to export/convert a .md to .docx, produce a deliverable from the playbook, or re-export after editing a VNR-* document."
argument-hint: "<path-to.md> [-o <audience-folder>]"
compatibility: "Requires the vnr-sa plugin installed"
user-invocable: true
metadata:
  author: "vnr-sa"
  source: "skills/vnr-md2docx/md_to_docx.py"
---

# vnr-md2docx — VNR deliverable exporter (Markdown → DOCX)

Convert a VNR playbook Markdown document into a formatted `.docx` deliverable that matches
the VNR brand template — same styles, margins, cover page, header/footer, auto-updating
Table of Contents, auto-numbered headings and captioned tables as the hand-crafted
reference documents.

The engine is `md_to_docx.py` (bundled in this skill folder). It clones the template and
rebuilds the body from the Markdown, so output is always style-consistent.

## When to use

- "Export / convert `VNR-KH-001` to Word/DOCX"
- "Chuyển tài liệu markdown này sang docx theo template chuẩn"
- "Re-export the deliverable after I edited the playbook `.md`"
- Producing any `.docx` deliverable from a playbook `.md`

## Prerequisites

- Python 3 with `python-docx`. If a run exits with `ERROR: the 'python-docx' package is
  required` (exit code 2), run `pip install python-docx` and retry once.

## Step 1 — Resolve the brand template (ask if missing)

`/vnr-md2docx` needs a VNR brand `.docx` template; the cover logo is loaded from that
template's own folder, so resolving the template resolves the logo too. Find it in this order
and **do not proceed without a valid template**:

1. **User-supplied** — if the user gave a template path (or `--template`), use it.
2. **Project-local** — the normal case when Claude is opened on the Deliverables repo. Test it
   with Python (handles Windows paths and spaces safely):
   ```bash
   python -c "import os,sys;sys.exit(0 if os.path.isfile(sys.argv[1]) else 1)" "${CLAUDE_PROJECT_DIR}/templates/word/VNR-ARCH_Tai_Lieu_Dac_Ta_Kien_Truc_He_Thong.docx" && echo FOUND || echo MISSING
   ```
   If `FOUND`, use that path.
3. **Ask the user** — if `MISSING` (vnr-sa is installed in a project without the brand
   template), use AskUserQuestion to get the template location: either the full path to a brand
   `.docx` template, or the path to a Deliverables repo (then use
   `<that>/templates/word/VNR-ARCH_Tai_Lieu_Dac_Ta_Kien_Truc_He_Thong.docx`). Never guess.

Call the resolved path `<TEMPLATE>`.

## Step 2 — Run the exporter

```bash
python "${CLAUDE_SKILL_DIR}/md_to_docx.py" "<INPUT.md>" -o "<OUTPUT>" --template "<TEMPLATE>"
```

- `${CLAUDE_SKILL_DIR}` resolves to this skill's folder (where `md_to_docx.py` lives) — works
  regardless of the shell's current directory. Quotes handle Windows spaces.
- `<INPUT.md>` — the playbook Markdown path the user gives (it may live outside the project).
- `<OUTPUT>` — if the project is the Deliverables repo, use an audience folder under
  `${CLAUDE_PROJECT_DIR}` (table below), e.g. `${CLAUDE_PROJECT_DIR}/customer/deployment`.
  Otherwise pass the path the user wants, or omit `-o` to write next to the input `.md`.
  `-o` accepts a directory (filename derived from the `.md`) or an explicit `...\file.docx`.

### Pick the output folder by audience

| Audience | Folder |
|----------|--------|
| Khách hàng (deployment / operations / security) | `customer/deployment`, `customer/operations`, `customer/security` |
| PM / Director (proposals / reports / roadmaps) | `management/proposals`, `management/reports`, `management/roadmaps` |
| Onboarding | `onboarding` |
| Training (handouts / slides) | `training/handouts`, `training/slides` |
| Architecture (overview / guidelines) | `architecture/overview`, `architecture/guidelines` |
| Reviews (architecture / infrastructure / security) | `reviews/architecture`, `reviews/infrastructure`, `reviews/security` |

Keep the code prefix in the filename: `VNR-KH-001-...docx`, `VNR-ARCH-001-...docx`, `VNR-ROAD-001-...docx`.

### Options

| Option | Meaning | Default |
|--------|---------|---------|
| `-o, --output` | Output `.docx` file **or** a directory | next to the input `.md` |
| `-t, --template` | DOCX template to clone | VNR-ARCH template (pass explicitly, as above) |
| `--code` | Document code on cover + header (e.g. `VNR-KH-001`) | parsed from filename → metadata |
| `--title` | Cover title | first `#` H1 in the markdown |
| `--version` | Version (e.g. `v1.0`) | metadata `Phiên bản` → `v1.0` |
| `--project-code` | Project code line on the cover | `<Mã dự án>` |
| `--date` | Cover date line (e.g. `"TPHCM, 05/2026"`) | current month/year |
| `--author` | Name in the revision-history table | metadata `Author` → `SA Team` |
| `--no-cover` | Skip cover page + front matter (revision/approval/TOC) | cover included |
| `--quiet` | Suppress the per-file log line | verbose |

Metadata precedence for each field: **CLI flag > document metadata > default**. The tool reads
metadata from either YAML frontmatter (`--- ... ---`) or the playbook blockquote style
(`> **Phiên bản:** v1.0`, `> **Author:** ...`, `> **Cập nhật lần cuối:** 2026-05-28`).

## What the tool produces

1. **Cover page** — logo, `VnResource Co., Ltd`, uppercase title, project/doc code, version, date.
2. **Front matter** — *Lịch sử cập nhật* (revision) + *Lịch sử phê duyệt* (approval) tables, and a
   *Mục lục* with a live Word TOC field.
3. **Body** — from the Markdown:
   - Headings auto-numbered via Word `Heading 1/2/3` styles. **Do not** hand-number headings in
     the `.md`; manual `1.` / `1.2.` prefixes are stripped to avoid double numbering.
   - Bullet & numbered lists (real Word bullets), fenced code blocks (Courier New 9pt),
     blockquotes (muted italic), inline **bold** / *italic* / `code`.
   - Tables with auto-fitted column widths + auto captions (`Bảng N.M. <description>`).
   - The first H1 becomes the cover title and is not repeated in the body; a `Mục lục` /
     `Danh sách bảng` section in the source is skipped (the template provides its own).
4. **Header/Footer** — company, uppercase title, `CODE / version`, internal-circulation footer.

## Workflow rules

- **Source of truth is the playbook `.md`.** Never edit a `.docx` directly — edit the `.md`, then re-export.
- **Placement by audience** — put the output in the right folder (table above).
- **Keep the code prefix** in the filename: `VNR-KH-001-...docx`, `VNR-ARCH-001-...docx`.

## Recommended steps for the agent

1. Confirm the input `.md` path and pick the correct output folder by audience (see table above).
2. Run the command; check the `[OK] <CODE> -> <file>.docx (<bytes>)` line for success. If it
   errors with `python-docx required`, `pip install python-docx` and retry once.
3. If the source has metadata, verify the resolved code/title/version look right (they print in the
   log); pass `--code` / `--title` / `--version` explicitly if the source lacks metadata.
4. Tell the user to open the `.docx` in Word and press `Ctrl+A`, then `F9` to build the Table of Contents.

## Notes & limitations

- Nested list indentation is flattened to a single bullet level (matches the reference exports).
- H4 renders as Heading 3 (template max depth). Images referenced in Markdown are not embedded
  (only the cover logo is). Mermaid/diagram fences render as code text, not rendered images.
