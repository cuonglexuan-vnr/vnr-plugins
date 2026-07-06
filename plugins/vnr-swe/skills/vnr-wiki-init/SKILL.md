---
name: "vnr-wiki-init"
description: "Bootstrap wiki repo cho pipeline: validate _schema, tạo axis tree, explore src/ detect repo roots/stacks, sinh arch-repo-roots.md, bàn giao cho vnr-wiki-add → vnr-wiki-sync."
argument-hint: "để trống (CWD) | đường dẫn repo root"
compatibility: "Requires the vnr-swe plugin. Wiki repo must already have docs/raw/_schema/ (the knowledge contract)."
metadata:
  author: "VNR"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

- **Rỗng** → CWD là repo root.
- **Đường dẫn** → đó là repo root cần init.

---

## Mục đích

`vnr-wiki-init` là bước **bootstrap** — dựng wiki structure trong repo, biến nó thành context store cho pipeline.

```
[wiki repo + src/]  ──vnr-wiki-init──▶  [axis tree + arch-repo-roots.md]
                    validate · explore · reason     ──vnr-wiki-add──▶  ──vnr-wiki-sync──▶  [wiki + manifest.json]
```

- **Input**: wiki repo (đã có `docs/raw/_schema/`, có thể đã đặt FE/BE vào `src/`).
- **Output**: axis tree + file seed bắt buộc `arch-repo-roots.md`.
- **Không** tự chạy sync — dừng lại và bàn giao.

---

## Hard Rules

1. **Technology-agnostic** — không hardcode stack/module/entity. Mọi thứ **khám phá runtime** + **hỏi user**.
2. **Không ghi đè** — file/dir đã tồn tại → skip (idempotent).
3. **Không tạo derived** — `docs/wiki/`, `index.md`, `manifest.json` do `vnr-wiki-sync` sinh.
4. **Chỉ seed bắt buộc** — `arch-repo-roots.md`. Các seed khác chỉ đề xuất.
5. **Dừng ở bàn giao** — mời `/vnr-wiki-add` → `/vnr-wiki-sync`, không tự chạy.

---

## Workflow

### Step 0 — Validate wiki structure

```
0a. Xác định REPO_ROOT (từ $ARGUMENTS hoặc CWD).
0b. Gate: docs/raw/_schema/ phải tồn tại.
    - Thiếu → DỪNG. Báo user:
      "Wiki repo cần có docs/raw/_schema/ (chứa README.md, frontmatter-spec.md, CONVENTIONS.md, templates/).
       Đây là knowledge contract của wiki — hãy tạo trước khi chạy init."
0c. Warn (không chặn) nếu thiếu: CLAUDE.md, WIKI-TEMPLATE.md — wiki repo nên có nhưng không bắt buộc để init.
0d. Kiểm tra đã có gì: axis tree? arch-repo-roots.md? src/?
```

### Step 1 — Ensure axis tree (mkdir, không template)

```
1a. Tạo dirs nếu chưa có:
    docs/raw/platform/{backend,frontend,shared}/
    docs/raw/stacks/
    docs/raw/modules/
    docs/raw/cross-module/
    docs/raw/_inbox/
1b. Nếu _inbox/README.md chưa có → tạo file ngắn: "Drop-zone cho /vnr-wiki-add. Bỏ notes tự do vào đây."
```

### Step 2 — Explore `src/` (auto-discover)

```
2a. Scan src/ tìm markers (không giả định tên folder):
    - Backend  : *.sln / *.csproj            → BE_ROOT
    - Frontend : package.json / angular.json  → FE_ROOT
    - Mobile   : pubspec.yaml                 → MOBILE_ROOT
    - Stack signals: lockfiles + framework deps → đề xuất stack id (không chốt).
2b. src/ rỗng → hướng dẫn user đặt repos vào src/ rồi chạy lại. Không bịa roots.
```

### Step 3 — Reason + confirm với user

```
3a. Trình bày: roots phát hiện + stacks đề xuất.
3b. Hỏi ≤ vài câu cho thứ code không nói được:
    - module/domain nghiệp vụ chính
    - custom UI wrapper
    - convention ngoài lint config
3c. Chốt giá trị cùng user — không tự quyết.
```

### Step 4 — Generate `arch-repo-roots.md` (bắt buộc)

```
4a. Viết docs/raw/platform/shared/arch-repo-roots.md:
    frontmatter: type: architecture · module: platform · phase: [plan, implement, review] · tier: always
    body: Roots table (BE/FE/WIKI/MOBILE) · Backend layout · Frontend layout · Build/run commands.
4b. File này pipeline đọc đầu tiên — tier:always, load ở mọi phase.
```

### Step 5 — Recommend next seeds (chỉ đề xuất)

```
5a. Liệt kê (không tạo) seed nên có tiếp:
    per-stack catalog + card · architecture overview · naming rules.
5b. Hướng dẫn user bỏ notes vào docs/raw/_inbox/.
```

### Step 6 — Hand off

```
6a. Không tự chạy tiếp. Mời: /vnr-wiki-add → /vnr-wiki-sync → okf-validate.
```

---

## Báo cáo sau khi chạy

- Wiki structure: validated / _schema missing (stopped)
- Axis tree: created / already present
- Roots detected: BE_ROOT, FE_ROOT, MOBILE_ROOT (hoặc "src/ rỗng")
- `arch-repo-roots.md`: created / already present
- Recommended next seeds
- **Next:** `/vnr-wiki-add` → `/vnr-wiki-sync`
