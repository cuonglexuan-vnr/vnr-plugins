---
name: "vnr-wiki-add"
description: "Intake/front-door cho wiki: nhận raw notes (md/txt) chưa theo format → phân tích, structure hoá thành raw file đúng _schema → đặt vào đúng folder trong docs/raw/. KHÔNG tự sync."
argument-hint: "Đường dẫn file dump | để trống để xử lý docs/raw/_inbox/ | hoặc paste nội dung trực tiếp"
compatibility: "Requires vnr-plugin project structure with docs/raw/_schema/ (CONVENTIONS.md + frontmatter-spec.md)"
metadata:
  author: "VNR"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

Giải nghĩa `$ARGUMENTS`:
- Là **đường dẫn file** (`.md`/`.txt`) → xử lý file đó.
- **Rỗng** → xử lý mọi file trong `docs/raw/_inbox/` (nếu folder tồn tại & có file). Nếu `_inbox/` rỗng/không có → yêu cầu user paste nội dung hoặc đưa path.
- Là **nội dung paste** (nhiều dòng, không phải path) → xử lý trực tiếp nội dung đó.

---

## Mục đích

`vnr-wiki-add` là **cửa vào (intake)** của wiki — bước còn thiếu trước `vnr-wiki-sync`.

```
[notes lộn xộn]  ──vnr-wiki-add──▶  [raw file đúng _schema, đúng folder]  ──vnr-wiki-sync──▶  [wiki + manifest.json]
                  analyze·route·fill           docs/raw/<...>/<file>.md          compile
```

User **không cần** tự viết YAML frontmatter hay nhớ folder nào. Chỉ cần viết kiến thức ở dạng tự do; skill này lo phần còn lại.

- **Input**: văn bản tự do (có hoặc không có frontmatter, đúng hoặc sai format).
- **Output**: **một (hoặc nhiều) raw file có cấu trúc** trong `docs/raw/`, đúng `_schema/frontmatter-spec.md`, đặt đúng folder.
- **Không** chạy `vnr-wiki-sync` tự động — dừng ở lớp raw (immutable source-of-truth) để user review, rồi **mời** sync.

---

## Hard Rules (Không bao giờ vi phạm)

1. **Technology-agnostic** — skill này KHÔNG hardcode tên stack/module/entity của bất kỳ project nào. Mọi taxonomy (axes, stack ids, module names) phải **khám phá lúc runtime** bằng cách: (a) đọc `docs/raw/_schema/CONVENTIONS.md` + `frontmatter-spec.md`, (b) scan cây thư mục `docs/raw/`. Suy ra cấu trúc từ những gì thấy, không từ trí nhớ.
2. **KHÔNG hallucinate dữ liệu định danh** — tên bảng DB, entity, service, state, id... CHỈ điền nếu xuất hiện trong nội dung user. Nếu thiếu → để `> TODO:` rõ ràng + `confidence: low`. Thà để trống còn hơn bịa.
3. **Raw frontmatter ≠ wiki frontmatter.** Skill này emit theo `_schema/frontmatter-spec.md` (`title, type, module, created, updated` + extras cho workflow). KHÔNG dùng format 8-field của wiki page (đó là việc của `vnr-wiki-sync`).
4. **KHÔNG ghi vào `docs/raw/_schema/`** — đó là templates/spec, immutable đối với skill này.
5. **KHÔNG sửa nội dung raw file đang tồn tại một cách phá huỷ** — chỉ CREATE file mới, hoặc APPEND có kiểm soát khi user đồng ý merge (xem Step 7). Sync vẫn là bên duy nhất compile raw → wiki.
6. **Dừng ở raw** — sau khi ghi, chỉ **đề nghị** chạy `/vnr-wiki-sync`, không tự chạy.
7. **Giữ nguyên prose của user** — restructure vào sections của template, không viết lại/diễn giải nội dung kỹ thuật của user. Chỉ sắp xếp + thêm khung.

---

## Workflow Step-by-Step

### Step 0 — Load contract (bắt buộc, mỗi lần chạy)

```
0a. Đọc docs/raw/_schema/CONVENTIONS.md      → quy ước đặt tên file/folder, ngôn ngữ, module-internal structure.
0b. Đọc docs/raw/_schema/frontmatter-spec.md → required fields theo từng `type`, danh sách type hợp lệ.
0c. Scan cây docs/raw/ (bỏ qua _schema/, _inbox/) → học các AXIS cấp cao đang tồn tại
    (thường: platform/{backend,frontend,shared}, stacks/<id>, modules/<module>/..., cross-module/)
    và liệt kê các module/stack đã có (để tái dùng tên, tránh tạo trùng).
0d. (Nếu có) đọc docs/wiki/manifest.json để biết các stack id đang được route.
```

> Nếu `docs/raw/_schema/` không tồn tại → báo user: repo chưa có wiki template, không thể intake. Dừng.

### Step 1 — Ingest

Lấy nội dung dump theo `$ARGUMENTS` (path | _inbox | paste — xem phần User Input). Đọc **toàn bộ**. Nếu file đã có frontmatter (đúng/sai) → tách ra, dùng làm gợi ý, sẽ chuẩn hoá lại.

Nếu xử lý `_inbox/` có nhiều file → xử lý **từng file một**, lặp lại Step 2–8 cho mỗi file.

### Step 2 — Analyze

Phân tích nội dung để xác định:

```
2a. Ngôn ngữ chính (thường tiếng Việt; giữ thuật ngữ kỹ thuật tiếng Anh).
2b. DOMINANT type (chọn 1 từ danh sách type của frontmatter-spec):
    workflow | domain-concept | business-rules | validations | db-impact |
    api-signatures | scenarios | pitfalls | state-machine | decision-table |
    transaction-boundary | sequence-diagram | event | rules | integration | shared | …
2c. AXIS (target cấp cao):
    - Nói về 1 UI library cụ thể (controls, components)        → stack
    - Tech backend xuyên suốt, không thuộc 1 module            → platform/backend
    - Tech frontend xuyên suốt, không thuộc 1 module           → platform/frontend
    - Kiến trúc/quy ước/auth/build dùng chung                  → platform/shared
    - Kiến thức nghiệp vụ của 1 module                         → module
    - Quy trình trải dài nhiều module                          → cross-module
2d. Trích metadata ứng viên: module name, entities, tables (reads/writes), states,
    services — CHỈ những gì xuất hiện tường minh trong nội dung.
2e. Phát hiện multi-doc: nếu dump chứa nhiều type rõ rệt của 1 workflow
    (mô tả quy trình + bảng rule + validation + tác động DB) → đề xuất tách thành
    workflow-bundle nhiều file (Step 5).
```

### Step 3 — Route (RAW decision tree)

Dựa trên AXIS (2c) + type (2b) + cây thư mục học ở Step 0c:

```
stack            → docs/raw/stacks/<stack-id>/<topic>.md
platform/backend → docs/raw/platform/backend/<topic>.md
platform/frontend→ docs/raw/platform/frontend/<topic>.md
platform/shared  → docs/raw/platform/shared/<topic>.md
module:
  - domain-concept            → docs/raw/modules/<module>/domain/<concept>.md
  - workflow (+ các doc bundle)→ docs/raw/modules/<module>/workflows/<workflow>/<doc-type>.md
  - rules/events/integration  → docs/raw/modules/<module>/{rules|events|integrations}/<topic>.md
cross-module     → docs/raw/cross-module/<topic>.md
```

Quy tắc đặt tên (theo CONVENTIONS):
- **kebab-case**, không dấu tiếng Việt, không khoảng trắng.
- workflow folder/file: **động từ + danh từ** (`calculate-monthly-salary`).
- domain/module: **danh từ** (`leave-day`, `salary`).

Nếu `<stack-id>` hoặc `<module>` chưa tồn tại trong cây → đây là cái mới: xác nhận tên với user (gộp vào ≤2 câu hỏi ở Step 4 nếu cần).

### Step 4 — Gap analysis (hybrid: infer + hỏi ≤2)

```
4a. Lấy required fields cho `type` đã chọn (từ frontmatter-spec).
    - Mọi file:            title, type, module, created, updated
    - type: workflow thêm: id (module.workflow.<name>), priority, status
4b. Điền field suy ra CHẮC CHẮN từ nội dung (vd: title, module nếu rõ, id từ path).
    - created/updated = ngày hôm nay (lấy từ context currentDate; nếu không có → để TODO, không bịa).
4c. Field thiếu mà KHÔNG suy ra được:
    - Critical & không đoán nổi (vd: module khi mơ hồ, tên stack mới, priority/status)
      → gom tối đa **2 câu hỏi** AskUserQuestion. Ưu tiên hỏi cái chặn việc route/đặt tên.
    - Còn lại → điền placeholder `> TODO:` trong body + set confidence: low. KHÔNG hỏi thêm.
4d. Dữ liệu định danh (tables, entities, states, services) thiếu → LUÔN để TODO, KHÔNG hỏi dồn,
    KHÔNG bịa.
```

> Trần câu hỏi = 2 mỗi file. Nếu vẫn thiếu sau 2 câu → dùng TODO + confidence: low cho phần còn lại.

### Step 5 — Generate

```
5a. Chọn template khớp type trong docs/raw/_schema/templates/ (workflow.md, business-rules.md,
    validations.md, db-impact.md, state-machine.md, decision-table.md, …). Nếu không có template
    khớp → tạo cấu trúc tối thiểu: frontmatter hợp lệ + các H2 hợp lý cho type đó.
5b. Map prose của user vào các section của template. GIỮ NGUYÊN nội dung kỹ thuật;
    chỉ sắp xếp, thêm heading, chuyển list/bảng về Markdown chuẩn.
5c. Emit frontmatter base (đúng _schema). Thêm ROUTING FIELDS khi liên quan, để
    vnr-wiki-sync (Step 3.5) build được manifest.json:
      - Nội dung stack-specific → thêm: stack: <id>, applies_to: ["<glob>"], tier: always|on_demand
        (và card: <path> nếu đây là trang catalog của stack).
      - Nội dung là rule/convention bắt buộc theo phase → thêm: phase: [plan|implement|review], tier: always.
5d. Multi-doc (2e): tạo nhiều file trong cùng workflow folder, link với nhau bằng relative path
    theo CONVENTIONS (vd workflow.md ↔ business-rules.md ↔ db-impact.md).
5e. Thêm marker xuất xứ ở cuối body:
      > _Nguồn: intake từ `<tên dump/_inbox file hoặc "paste">` bởi vnr-wiki-add — <ngày>._
```

### Step 6 — Lint (validate trước khi ghi)

Kiểm tra, sửa nếu fail:
```
6a. Đủ required fields cho type? (thiếu → quay lại 4 hoặc thêm TODO)
6b. type ∈ danh sách hợp lệ của frontmatter-spec?
6c. id (nếu workflow) đúng format module.workflow.<name>?
6d. created/updated đúng YYYY-MM-DD?
6e. filename kebab-case, không dấu, không space, không trùng file đang có (xem Step 7)?
6f. Nếu có routing fields: applies_to là mảng glob hợp lệ; stack id nhất quán với cây stacks/.
```

### Step 7 — Dedup check

```
7a. Có raw file cùng slug/cùng topic ở folder đích không?
    (so khớp filename + đối chiếu title/nội dung)
7b. CÓ → hỏi user: [append vào file cũ] | [tạo file mới tên khác] | [huỷ].
    - append: chèn section mới, KHÔNG overwrite; nếu mâu thuẫn nội dung cũ → thêm
      > ⚠️ Contradiction (<ngày>): nguồn mới nói X, file cũ nói Y. Cần verify.
7c. KHÔNG → tạo mới.
```

### Step 8 — Write + Preview

```
8a. Ghi file vào docs/raw/<routed-path>/<file>.md (tạo folder cha nếu chưa có,
    trừ _schema/).
8b. In preview cho user:
    - Routing decision: axis → folder → filename (+ lý do 1 dòng).
    - Frontmatter đã sinh.
    - Danh sách TODO/low-confidence cần user bổ sung sau.
    - Nếu multi-doc: danh sách các file đã tạo.
    - Nếu xử lý _inbox: gợi ý đã sẵn sàng archive/xoá file nguồn (xem Step 9).
```

### Step 9 — Offer sync (KHÔNG tự chạy)

```
9a. Hỏi: "Đã tạo raw file. Chạy /vnr-wiki-sync để compile vào wiki bây giờ?" [có | để sau]
9b. Nếu xử lý từ _inbox và user xác nhận OK → đề nghị di chuyển file nguồn sang
    docs/raw/_inbox/_processed/ (hoặc xoá) để tránh xử lý lại. Hỏi trước khi xoá.
```

---

## RAW Routing — quick reference

| Nội dung nói về… | AXIS | Folder đích |
|---|---|---|
| Component/control của 1 UI library | stack | `stacks/<stack-id>/` |
| Backend tech xuyên suốt (framework, csproj, entity rebuild) | platform | `platform/backend/` |
| Frontend tech xuyên suốt (MFE framework, build) | platform | `platform/frontend/` |
| Kiến trúc / quy ước / auth / data / tech-stack dùng chung | platform | `platform/shared/` |
| Khái niệm/entity nghiệp vụ của 1 module | module | `modules/<module>/domain/` |
| Quy trình nghiệp vụ (workflow) | module | `modules/<module>/workflows/<workflow>/` |
| Rule/event/integration cấp module | module | `modules/<module>/{rules,events,integrations}/` |
| Quy trình trải nhiều module | cross-module | `cross-module/` |

> Các AXIS trên là layout VNR điển hình — **luôn xác nhận lại bằng cây thư mục thực tế** (Step 0c). Project khác có thể khác; ưu tiên cấu trúc đang tồn tại.

---

## Frontmatter — skill emit gì

**Base (mọi file):**
```yaml
---
title: "<tiêu đề người đọc>"
type: <type ∈ frontmatter-spec>
module: "<tên-module | shared | platform>"
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
confidence: low            # nâng dần khi nội dung được verify
---
```

**Thêm cho `type: workflow`:**
```yaml
id: "<module>.workflow.<ten-workflow>"
priority: medium            # critical | high | medium | low
status: draft               # draft | stable | deprecated
entities: []                # CHỈ điền nếu có trong nội dung, không thì để [] + TODO
tables:
  reads: []
  writes: []
states: []
```

**Thêm routing fields (khi stack/phase-specific) — để sync build manifest.json:**
```yaml
stack: "<stack-id>"                 # nội dung thuộc 1 UI library
applies_to: ["<glob>"]              # vd: ["**/*.cshtml"], ["**/projects/**/*.ts"]
tier: always                        # always | on_demand | card
card: "docs/wiki/stacks/<id>.card.md"   # chỉ với trang catalog
phase: [plan, implement, review]    # với rule/convention bắt buộc theo phase
```

---

## _inbox convention

- Thư mục `docs/raw/_inbox/` là nơi user thả note thô (`.md`/`.txt`).
- Chạy `/vnr-wiki-add` (không tham số) → xử lý mọi file trong `_inbox/`.
- File đã xử lý: đề nghị chuyển sang `docs/raw/_inbox/_processed/` (hỏi trước).
- `_inbox/` và `_processed/` KHÔNG phải nguồn để `vnr-wiki-sync` compile — chỉ là staging của intake.

---

## Ví dụ

**Input** (user paste, không frontmatter):
```
Tính lương tháng: lấy công chuẩn từ bảng chấm công, nhân hệ số, trừ BHXH.
Chỉ chạy được khi kỳ lương đã chốt. Nếu thiếu dữ liệu công thì rollback toàn bộ.
```

**Skill xử lý:**
- type = `workflow`; axis = module; module mơ hồ → **hỏi 1 câu**: "Module nào? (salary / payroll / …)".
- Giả sử user chọn `salary` → route: `docs/raw/modules/salary/workflows/calculate-monthly-salary/workflow.md`.
- Phát hiện multi-doc nhẹ (có transaction/rollback) → đề xuất thêm `transaction-boundary.md` (optional, hỏi gọn hoặc để TODO).
- Tables/hệ số/BHXH: nhắc tới nhưng **không có tên bảng cụ thể** → `tables.reads/writes: []` + `> TODO: tên bảng chấm công, bảng BHXH`.
- frontmatter: `id: salary.workflow.calculate-monthly-salary`, `priority: medium`, `status: draft`, `confidence: low`.
- Ghi file → preview routing + TODO → hỏi có sync không.

---

## Sau khi chạy

Report:
```
✅ vnr-wiki-add complete
  Nguồn: <path/_inbox/paste>
  Đã tạo: docs/raw/<...>/<file>.md  (+N file bundle nếu có)
  Routing: <axis> → <folder>  (lý do)
  TODO cần bổ sung: [list | none]
  Bước tiếp: chạy /vnr-wiki-sync để compile vào wiki  (chưa tự chạy)
```
