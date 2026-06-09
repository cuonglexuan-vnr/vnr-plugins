---
name: "vnr-auto-pipeline"
description: >-
  Pipeline tự động từ spec → report: Plan → Plan Review → Tasks → Testcases →
  Implement → Arch + Sec Review (song song) → E2E Stubs → Report.
  HITL checkpoint duy nhất: Plan Review (Step 1b). Sau khi approve plan, pipeline chạy hoàn toàn tự động.
argument-hint: "<feature-name> [--from=N]"
compatibility: "Requires spec-kit project structure with vnr-plugin/ directory"
user-invocable: true
disable-model-invocation: true
---

## User Input

```text
$ARGUMENTS
```

Parse `$ARGUMENTS` → lấy `<feature>` (bắt buộc — tên folder trong `specs/`, thường là US-ID như `SCC-E01-F01-U02`) và `--from=N` (tuỳ chọn, default = 0).

> **Lưu ý đổi hướng**: Từ khi BA chuyển sang output per-User-Story, pipeline chạy **cho một User Story duy nhất**. Input chính tại `specs/<feature>/<feature>_*.md` (shape: `templates/userstory-template.md`). Nếu BA cung cấp `<feature>_*_ui-detail.md` → dùng; nếu không, vnr-planner sẽ sinh `ui-detail.md` fallback khi feature có mobile screens.

**Path Resolution**: `$PLUGIN_DIR` = thư mục `vnr-plugin` tại repo root (tìm bằng cách scan ngược từ thư mục hiện tại cho đến khi thấy `vnr-plugin/`). Dùng trong tất cả các agent prompts bên dưới.

---

## Cấu trúc source code

```
src/
├── backend/        # ASP.NET Core — GIT REPO RIÊNG
└── frontend/       # Angular 19 — GIT REPO RIÊNG
    └── e2e/        # Playwright E2E tests
```

> **QUAN TRỌNG**: `src/backend/` và `src/frontend/` là **2 git repository riêng biệt**.
> Mọi thao tác git (tạo nhánh, commit, push) phải **cd vào đúng thư mục** trước khi chạy.

---

## Nguyên tắc thực thi

- **Checkpoint duy nhất**: Step 1b (Plan Review) — dừng và chờ user approve plan. Sau khi plan approved, pipeline chạy tự động đến hết.
- **Auto-stop**: Pipeline tự dừng nếu build fail (Step 3) hoặc Arch/Security FAIL (Step 4+5). User phải fix rồi `--from=N` để tiếp.
- **Skill tool**: Dùng cho các bước có sẵn skill (vnr-plan, vnr-tasks, vnr-implement). Không chạy PS script thủ công.
- **Agent tool**: Dùng `subagent_type: "general-purpose"` cho các bước cần agent chuyên dụng. Mỗi Agent prompt phải bắt đầu bằng việc đọc file agent tương ứng.
- **Song song**: Steps 4+5 dispatch cả 2 Agent tool calls trong cùng 1 message.
- **Constitution**: `$PLUGIN_DIR/memory/constitution.md` là tài liệu quy tắc gốc — mọi agent phải tuân thủ.
- **Wiki context**: Các bước Plan (1a), Testcase (2), Implement (3), Report (7) phải đọc `docs/wiki/` trước khi thực hiện. Xem hướng dẫn tại `$PLUGIN_DIR/skills/vnr-wiki/SKILL.md`.

---

## Agent Registry

| Step | Agent | File | Cách gọi |
|------|-------|------|----------|
| Pre | — | `docs/wiki/` | Skill tool: `vnr-wiki` (Steps 1a, 2, 3, 7) |
| 1a | vnr-planner | `$PLUGIN_DIR/agents/vnr-planner.md` | Skill tool: `vnr-plan` |
| 1b | vnr-plan-reviewer | `$PLUGIN_DIR/agents/vnr-plan-reviewer.md` | Agent tool |
| 1c | vnr-task-breaker | `$PLUGIN_DIR/agents/vnr-task-breaker.md` | Skill tool: `vnr-tasks` |
| 2 | vnr-testcase-writer | `$PLUGIN_DIR/agents/vnr-testcase-writer.md` | Agent tool |
| 3 | vnr-backend-developer / vnr-frontend-developer / vnr-mobile-developer | auto-detected by scope from tasks.md | Skill tool: `vnr-implement` |
| 4 | vnr-arch-reviewer | `$PLUGIN_DIR/agents/vnr-arch-reviewer.md` | Agent tool (song song) |
| 5 | vnr-sec-reviewer | `$PLUGIN_DIR/agents/vnr-sec-reviewer.md` | Agent tool (song song) |
| 6 | — | — | CLI: stub check/create |
| 7 | vnr-tech-writer | `$PLUGIN_DIR/agents/vnr-tech-writer.md` | Agent tool |

---

## Bước 0 — Validate & Khởi động

Nếu `--from=N` được truyền vào → bỏ qua validate, nhảy thẳng đến Step N.

```bash
# Kiểm tra User Story file tồn tại
ls specs/<feature>/<feature>_*.md

# Kiểm tra branch trong CẢ 2 repo
cd src/backend && rtk git branch --show-current
cd src/frontend && rtk git branch --show-current
```

- Cả 2 repo đều ở branch khớp `feature/<feature>` → OK.
- Chưa có branch → tạo mới:
  ```bash
  cd src/backend && git checkout -b feature/<feature>
  cd src/frontend && git checkout -b feature/<feature>
  ```
- `specs/<feature>/plan.md` và `tasks.md` đã tồn tại → hỏi: "Plan & Tasks đã có. Bắt đầu từ Step 2? `[yes]` / `[chạy lại từ Step 1a]`"

Hiển thị progress tracker:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VNR AUTO-PIPELINE  [Feature: <feature>]
 User Story: specs/<feature>/<feature>_*.md
 BE branch: feature/<feature> (src/backend/)
 FE branch: feature/<feature> (src/frontend/)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⬜ Step 1a   Plan
 ⬜ Step 1b   Plan Review
 ⬜ Step 1c   Tasks
 ⬜ Step 2    Testcases
 ⬜ Step 3    Implement
 ⬜ Step 4+5  Arch Review + Security Review
 ⬜ Step 6    E2E Stubs
 ⬜ Step 7    Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bắt đầu pipeline? [yes] / [no]
```

---

## Step 1a — Plan

<agent_to_use>Sử dụng vnr-planner agent</agent_to_use>

```
Dùng Skill tool:
  skill: "vnr-plan"
  args: ""
```

Skill `vnr-plan` sẽ đọc `$PLUGIN_DIR/agents/vnr-planner.md` nội bộ, thực hiện:
- Đọc `specs/<feature>/<feature>_*.md` + standards + docs
- Sinh `plan.md`, `data-model.md`, `contracts/`, `research.md`

**Checkpoint nội bộ**: Khi vnr-plan hỏi `[A] Approve / [E] Edit` → **dừng, chờ user**.
**Failure**: gate fail hoặc NEEDS CLARIFICATION không resolve → dừng pipeline.

---

## Step 1b — Plan Review 🛑

<agent_to_use>Sử dụng vnr-plan-reviewer agent</agent_to_use>

Chạy ngay sau khi `vnr-plan` sinh artifacts xong (tự động, không cần user trigger).

```
Dùng Agent tool:
  subagent_type: "general-purpose"
  prompt: |
    Đọc và tuân theo system prompt: $PLUGIN_DIR/agents/vnr-plan-reviewer.md

    FEATURE: <feature>

    ĐỌC BẮT BUỘC (theo thứ tự):
    - specs/<feature>/<feature>_*.md          (User Story gốc — source of truth)
    - specs/<feature>/plan.md                 (plan vừa sinh)
    - specs/<feature>/data-model.md           (data model)
    - specs/<feature>/contracts/api-commitments.md (API contracts)
    - specs/<feature>/research.md             (nếu có)
    - $PLUGIN_DIR/standards/backend/02-architecture-and-structure.md
    - $PLUGIN_DIR/standards/frontend/02-architecture-and-structure.md
    - $PLUGIN_DIR/memory/constitution.md

    THỰC HIỆN:
    Chạy đầy đủ 18 checks (P-01 đến P-18) từ agent file.
    Phân loại: Critical (🔴) và Warning (🟡).

    OUTPUT: Kết luận PASS ✅ / WARN ⚠️ / FAIL ⛔ + bảng findings + gợi ý Human Reviewer.
```

**Checkpoint** 🛑:

```
✅ Step 1b hoàn thành — Plan Review
  Verdict: ✅ PASS / ⚠️ WARN (N issues) / ⛔ FAIL (N critical)
  [Bảng findings hiển thị bên trên]

[Nếu FAIL] ⛔ Plan có vấn đề critical. Vui lòng:
  → [reject — sửa plan rồi chạy lại: /vnr-auto-pipeline <feature> --from=1a]
  → [override — tiếp tục dù FAIL (không khuyến nghị)]

[Nếu PASS/WARN] → Duyệt plan?
  [approve] — tiếp tục Step 1c (Tasks)
  [modify] — điều chỉnh plan.md trực tiếp rồi gõ [approve]
  [reject] — chạy lại từ Step 1a: /vnr-auto-pipeline <feature> --from=1a
```

---

## Step 1c — Tasks

<agent_to_use>Sử dụng vnr-task-breaker agent</agent_to_use>

```
Dùng Skill tool:
  skill: "vnr-tasks"
  args: ""
```

Skill `vnr-tasks` sẽ đọc `$PLUGIN_DIR/agents/vnr-task-breaker.md` nội bộ, sinh `tasks.md`.

Sau khi hoàn thành, hiển thị summary và **tự động chuyển sang Step 2**:

```
✅ Step 1c hoàn thành
  plan.md — [N phases] | data-model.md — [N entities] | contracts: [N endpoints]
  tasks.md — [N tasks] ([N parallel groups])
→ Tự động chuyển sang Step 2 (Testcase Writer)...
```

---

## Step 2 — Testcase Writer

<agent_to_use>Sử dụng vnr-testcase-writer agent</agent_to_use>

```
Dùng Agent tool:
  subagent_type: "general-purpose"
  prompt: |
    Đọc và tuân theo system prompt: $PLUGIN_DIR/agents/vnr-testcase-writer.md

    FEATURE: <feature>

    ĐỌC WIKI TRƯỚC (business context):
    - docs/wiki/index.md → xác định entries liên quan
    - docs/wiki/domains/ → entities (validation rules, field constraints)
    - docs/wiki/domains/permission-model.md → permission business rules
    (Tuân theo vnr-plugin/skills/vnr-wiki/SKILL.md nếu cần điều hướng thêm)

    ĐỌC SPEC & PLAN:
    - specs/<feature>/<feature>_*.md
    - specs/<feature>/plan.md
    - specs/<feature>/tasks.md
    - specs/<feature>/contracts/api-commitments.md (nếu có)
    - specs/<feature>/<feature>_*_ui-detail.md hoặc specs/<feature>/ui-detail.md (nếu có)
    - $PLUGIN_DIR/standards/backend/03-permission.md
    - $PLUGIN_DIR/standards/frontend/03-permission.md

    THỰC HIỆN:
    Tạo specs/<feature>/testcases.md:
    - Testcase chi tiết cho manual testing (pre-condition, steps, expected, test data)
    - Phân loại theo module: API, UI, Authorization, Integration
    - Priority: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)

    BÁO CÁO: số testcases per module, path file.
```

Sau khi hoàn thành, hiển thị summary và **tự động chuyển sang Step 3**:

```
✅ Step 2 hoàn thành
  testcases.md — [N testcases] (P0: N, P1: N, P2: N, P3: N)
→ Tự động chuyển sang Step 3 (Implement)...
```

---

## Step 3 — Implement

<agent_to_use>vnr-implement skill tự động dispatch đến vnr-backend-developer / vnr-frontend-developer / vnr-mobile-developer dựa trên scope của tasks.md</agent_to_use>

```
Dùng Skill tool:
  skill: "vnr-implement"
  args: ""
```

Skill `vnr-implement` tự động phát hiện scope từ `tasks.md` và dispatch **tuần tự**:
- `src/backend/` tasks → vnr-backend-developer (ASP.NET Core)
- `src/frontend/` tasks → vnr-frontend-developer (Angular 19)
- `src/app-mobile/` tasks → vnr-mobile-developer (Flutter)

Dispatch: Backend → Frontend → Mobile (BE build phải PASS trước khi FE bắt đầu).

**Auto-stop**: Build fail → dừng pipeline. User fix rồi `--from=3`.

Sau khi hoàn thành, hiển thị summary và **tự động chuyển sang Step 4+5**:

```
✅ Step 3 hoàn thành
  Tasks: X/N ✅ | Files: N created, N modified
  Build: ✅ OK
→ Tự động chuyển sang Step 4+5 (Arch + Security Review)...
```

---

## Step 4+5 — Arch Review + Security Review (SONG SONG)

Dispatch **cả 2 Agent tool calls trong cùng 1 message**:

### Agent 1 — Architecture Review

<agent_to_use>Sử dụng vnr-arch-reviewer agent</agent_to_use>

```
Dùng Agent tool:
  subagent_type: "general-purpose"
  prompt: |
    Đọc và tuân theo system prompt: $PLUGIN_DIR/agents/vnr-arch-reviewer.md

    FEATURE: <feature>

    ĐỌC BẮT BUỘC:
    - $PLUGIN_DIR/standards/backend/02-architecture-and-structure.md
    - $PLUGIN_DIR/standards/frontend/02-architecture-and-structure.md
    - specs/<feature>/contracts/api-commitments.md (nếu có)
    - docs/raw/api-http-contracts.md (nếu có)
    - $PLUGIN_DIR/memory/constitution.md (Principle II)

    SCOPE: git diff --name-only HEAD~1 → xác định BE/FE/full-stack.
    KHÔNG kết luận nếu chưa đọc ít nhất 1 file thay đổi.

    Chạy checklist từ agent file (14 checks BE + 10 checks FE).

    OUTPUT: Kết luận PASS ✅ / WARN ⚠️ / FAIL ⛔ + bảng findings.
```

### Agent 2 — Security Review

<agent_to_use>Sử dụng vnr-sec-reviewer agent</agent_to_use>

```
Dùng Agent tool:
  subagent_type: "general-purpose"
  prompt: |
    Đọc và tuân theo system prompt: $PLUGIN_DIR/agents/vnr-sec-reviewer.md

    FEATURE: <feature>

    ĐỌC BẮT BUỘC:
    - $PLUGIN_DIR/standards/backend/03-permission.md
    - $PLUGIN_DIR/standards/frontend/03-permission.md
    - $PLUGIN_DIR/hooks/security-hooks.json (scan patterns)
    - $PLUGIN_DIR/memory/constitution.md (Principle III)

    SCOPE: git diff --name-only HEAD~1 → xác định BE/FE/full-stack.
    KHÔNG kết luận nếu chưa đọc ít nhất 1 file thay đổi.

    Chạy checklist OWASP từ agent file (14 checks BE + 7 checks FE).
    Scan patterns từ security-hooks.json trên tất cả files thay đổi.

    OUTPUT: Kết luận PASS ✅ / WARN ⚠️ / FAIL ⛔ + bảng findings + OWASP ref.
```

**Sau khi CẢ 2 hoàn thành**, tổng hợp:

```
✅ Step 4+5 hoàn thành
  Architecture: ✅ PASS / ⚠️ WARN (N findings) / ⛔ FAIL (N critical)
  Security:     ✅ PASS / ⚠️ WARN (N findings) / ⛔ FAIL (N critical)
```

**Auto-stop nếu FAIL:**
- Nếu Arch hoặc Security = ⛔ FAIL → pipeline dừng. User fix rồi `--from=4`.
- Nếu PASS hoặc WARN → **tự động chuyển sang Step 6**.

```
[Nếu FAIL] ⛔ Pipeline dừng tự động. Output:
  → Fix issues rồi chạy lại: /vnr-auto-pipeline <feature> --from=4

[Nếu PASS/WARN] → Tự động chuyển sang Step 6 (E2E Stubs)...
```

---

## Step 6 — E2E Stubs (Placeholder)

> Bước này là **placeholder** cho automation test team. Pipeline **KHÔNG chạy tests**.
> Automation team sẽ implement body sau — pipeline chỉ đảm bảo stub file tồn tại.

```bash
E2E_FILE="src/frontend/e2e/<feature>.e2e.spec.ts"

if [ -f "$E2E_FILE" ]; then
  echo "✅ Stub file đã tồn tại: $E2E_FILE"
else
  echo "⚠️ Stub file chưa có — tạo minimal stub từ testcases.md (P0+P1)..."
  mkdir -p src/frontend/e2e
  # Tạo stub với test.todo() cho mỗi testcase P0+P1
  cat > "$E2E_FILE" << 'STUB'
import { test } from '@playwright/test';

// AUTO-GENERATED STUB — Automation team implements body
// Source: specs/<feature>/testcases.md (P0 + P1 testcases)
// DO NOT implement test body here — coordinate with automation team

test.describe('<feature>', () => {
  // TODO: Automation team sẽ implement từ testcases.md
  test.todo('[P0] Happy path — điền từ testcases.md');
  test.todo('[P0] Authorization — điền từ testcases.md');
  test.todo('[P1] Validation — điền từ testcases.md');
});
STUB
  echo "✅ Stub file đã tạo: $E2E_FILE"
fi
```

Trạng thái luôn là **⏭ STUB** — không FAIL pipeline.

```
⏭ Step 6 — E2E Stubs
  Stub file: src/frontend/e2e/<feature>.e2e.spec.ts ✅ exists / ✅ created
  Status: Pending automation team implementation
  Testcases tham chiếu: specs/<feature>/testcases.md
→ Chuyển sang Step 7 (Report)...
```

---

## Step 7 — Report

<agent_to_use>Sử dụng vnr-tech-writer agent</agent_to_use>

```
Dùng Agent tool:
  subagent_type: "general-purpose"
  prompt: |
    Đọc và tuân theo system prompt: $PLUGIN_DIR/agents/vnr-tech-writer.md

    FEATURE: <feature>

    ĐỌC WIKI (để viết user guide đúng ngữ cảnh nghiệp vụ):
    - docs/wiki/index.md → entries liên quan
    - docs/wiki/patterns/ → tổng quan module, flow → intro section
    - docs/wiki/domains/ → entities, workflows → hướng dẫn step-by-step
    (Tuân theo vnr-plugin/skills/vnr-wiki/SKILL.md nếu cần điều hướng thêm)

    CẤU TRÚC SOURCE:
    - src/backend/ = git repo riêng (ASP.NET Core)
    - src/frontend/ = git repo riêng (Angular 19)
    - E2E stubs: src/frontend/e2e/<feature>.e2e.spec.ts (stubs — chưa chạy)

    ĐỌC SPEC & ARTIFACTS:
    - specs/<feature>/<feature>_*.md
    - specs/<feature>/plan.md
    - specs/<feature>/testcases.md
    - specs/<feature>/contracts/api-commitments.md (nếu có)

    DỮ LIỆU TỪ CÁC BƯỚC TRƯỚC (đã có trong context):
    - Step 4: Architecture Review verdict + findings
    - Step 5: Security Review verdict + findings
    - Step 6: E2E Stubs status (stub file path)

    THỰC HIỆN:
    1. Tạo specs/<feature>/result/final-report.md
       - Summary table: Arch | Security | E2E Stubs
       - Findings chi tiết từ mỗi review step
       - Files changed: cd src/backend && git diff --stat HEAD~5; cd src/frontend && git diff --stat HEAD~5
       - Sign-off checklist

    2. Tạo specs/<feature>/result/user-guide.md
       - Tiếng Việt, hướng end-user
       - Menu path, chức năng, phân quyền, FAQ
       - Nếu Playwright docs-reporter đã tạo → bổ sung, không ghi đè

    BÁO CÁO: path 2 files, tóm tắt verdict tổng.
```

---

## Pipeline Complete

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VNR AUTO-PIPELINE COMPLETE ✅  [Feature: <feature>]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✅ Plan + Plan Review  ✅ Tasks        ✅ Testcases
 ✅ Implement           ✅ Arch Review  ✅ Security
 ⏭ E2E Stubs (pending) ✅ Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Artifacts:
  specs/<feature>/result/final-report.md
  specs/<feature>/result/user-guide.md
  specs/<feature>/testcases.md
  src/frontend/e2e/<feature>.e2e.spec.ts  ← automation team next

Next (commit riêng từng repo):
  cd src/backend  && rtk git add . && rtk git commit -m "feat(<feature>): <mô tả BE>"
  cd src/frontend && rtk git add . && rtk git commit -m "feat(<feature>): <mô tả FE>"
  → Tạo PR cho mỗi repo: feature/<feature> → main
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Recovery — Chạy lại từ bước cụ thể

```
/vnr-auto-pipeline <feature> --from=1a   ← từ Plan (chạy lại planner)
/vnr-auto-pipeline <feature> --from=1b   ← từ Plan Review (re-review plan hiện có)
/vnr-auto-pipeline <feature> --from=1c   ← từ Tasks (plan đã approve)
/vnr-auto-pipeline <feature> --from=2    ← từ Testcase Writer
/vnr-auto-pipeline <feature> --from=3    ← từ Implement
/vnr-auto-pipeline <feature> --from=4    ← từ Arch+Sec Review
/vnr-auto-pipeline <feature> --from=6    ← từ E2E Stubs check
/vnr-auto-pipeline <feature> --from=7    ← chỉ Report
```

Khi `--from=N`: bỏ qua validation các bước trước, nhảy thẳng đến Step N.
Nếu step trước đã sinh artifacts (plan.md, tasks.md, ...) → sử dụng lại, không tạo mới.

---

## Gate Summary (từ Constitution)

| Chuyển tiếp | Điều kiện |
|-------------|----------|
| Step 1a → 1b | Tự động — Plan Review chạy ngay sau Plan |
| Step 1b → 1c | 🛑 **HITL duy nhất** — plan.md được user approve (sau khi xem findings) |
| Step 1c → 2  | Tự động — Tasks xong → Testcase Writer bắt đầu ngay |
| Step 2 → 3   | Tự động — Testcases xong → Implement bắt đầu ngay |
| Step 3 → 4+5 | Tự động nếu build thành công (0 errors). Auto-stop nếu build fail. |
| Step 4+5 → 6 | Tự động nếu Arch PASS/WARN + Security PASS/WARN. Auto-stop nếu FAIL. |
| Step 6 → 7 | Tự động — stub luôn pass |
| Step 7 → Done | Tự động — pipeline hoàn thành |
