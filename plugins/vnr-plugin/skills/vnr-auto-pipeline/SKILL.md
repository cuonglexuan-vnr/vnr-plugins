---
name: "vnr-auto-pipeline"
description: >-
  Pipeline tự động từ spec → report: Plan → Tasks → QC → Implement → Unit Test →
  Arch + Sec Review (song song) → Run Tests → E2E → Report.
  Checkpoint confirm sau mỗi bước quan trọng.
argument-hint: "<feature-name> [--from=N]"
compatibility: "Requires spec-kit project structure with vnr-plugin/ directory"
user-invocable: true
disable-model-invocation: true
---

## User Input

```text
$ARGUMENTS
```

Parse `$ARGUMENTS` → lấy `<feature>` (bắt buộc) và `--from=N` (tuỳ chọn, default = 0).

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

- **Checkpoint**: Dừng và chờ user confirm `[yes]` trước khi sang bước tiếp theo tại các bước đánh dấu 🛑.
- **Skill tool**: Dùng cho các bước có sẵn skill (vnr-plan, vnr-tasks, vnr-implement). Không chạy PS script thủ công.
- **Agent tool**: Dùng `subagent_type: "general-purpose"` cho các bước cần agent chuyên dụng. Mỗi Agent prompt phải bắt đầu bằng việc đọc file agent tương ứng.
- **Song song**: Steps 5+6 dispatch cả 2 Agent tool calls trong cùng 1 message.
- **Constitution**: `vnr-plugin/memory/constitution.md` là tài liệu quy tắc gốc — mọi agent phải tuân thủ.
- **Wiki context**: Các bước Plan (1), QC (2), Implement (3), Report (9) phải đọc `docs/wiki/` trước khi thực hiện. Xem hướng dẫn tại `vnr-plugin/skills/vnr-wiki/SKILL.md`.

---

## Agent Registry

| Step | Agent | File | Cách gọi |
|------|-------|------|----------|
| Pre | — | `docs/wiki/` | Skill tool: `vnr-wiki` (Steps 1,2,3,9) |
| 1a | vnr-planner | `vnr-plugin/agents/vnr-planner.md` | Skill tool: `vnr-plan` |
| 1b | vnr-task-breaker | `vnr-plugin/agents/vnr-task-breaker.md` | Skill tool: `vnr-tasks` |
| 2 | vnr-qc-generator | `vnr-plugin/agents/vnr-qc-generator.md` | Agent tool |
| 3 | vnr-developer | `vnr-plugin/agents/vnr-developer.md` | Skill tool: `vnr-implement` |
| 4 | vnr-test-engineer | `vnr-plugin/agents/vnr-test-engineer.md` | Agent tool |
| 5 | vnr-arch-reviewer | `vnr-plugin/agents/vnr-arch-reviewer.md` | Agent tool (song song) |
| 6 | vnr-sec-reviewer | `vnr-plugin/agents/vnr-sec-reviewer.md` | Agent tool (song song) |
| 7 | — | — | CLI: `dotnet test` / `npm test` |
| 8 | — | — | CLI: `npx playwright test` |
| 9 | vnr-tech-writer | `vnr-plugin/agents/vnr-tech-writer.md` | Agent tool |

---

## Bước 0 — Validate & Khởi động

Nếu `--from=N` được truyền vào → bỏ qua validate, nhảy thẳng đến Step N.

```bash
# Kiểm tra spec tồn tại
ls specs/<feature>/spec.md

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
- `specs/<feature>/plan.md` và `tasks.md` đã tồn tại → hỏi: "Plan & Tasks đã có. Bắt đầu từ Step 2? `[yes]` / `[chạy lại từ Step 1]`"

Hiển thị progress tracker:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VNR AUTO-PIPELINE  [Feature: <feature>]
 Spec: specs/<feature>/spec.md
 BE branch: feature/<feature> (src/backend/)
 FE branch: feature/<feature> (src/frontend/)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⬜ Step 1    Plan + Tasks
 ⬜ Step 2a   QC Generate (e2e stubs)
 ⬜ Step 2b   Testcase Writer (testcases.md)
 ⬜ Step 3    Implement
 ⬜ Step 4    Unit Test Write
 ⬜ Step 5+6  Arch Review + Security Review
 ⬜ Step 7    Run Tests
 ⬜ Step 8    E2E Automation
 ⬜ Step 9    Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bắt đầu pipeline? [yes] / [no]
```

---

## Step 1 — Plan & Tasks 🛑

<agent_to_use>Sử dụng vnr-planner agent (Step 1a) và vnr-task-breaker agent (Step 1b)</agent_to_use>

### 1a. Plan

```
Dùng Skill tool:
  skill: "vnr-plan"
  args: ""
```

Skill `vnr-plan` sẽ đọc `vnr-plugin/agents/vnr-planner.md` nội bộ, thực hiện:
- Đọc `specs/<feature>/spec.md` + standards + docs
- Sinh `plan.md`, `data-model.md`, `contracts/`, `research.md`

**Checkpoint nội bộ**: Khi vnr-plan hỏi `[A] Approve / [E] Edit` → **dừng, chờ user**.
**Failure**: gate fail hoặc NEEDS CLARIFICATION không resolve → dừng pipeline.

### 1b. Tasks (sau khi plan approved)

```
Dùng Skill tool:
  skill: "vnr-tasks"
  args: ""
```

Skill `vnr-tasks` sẽ đọc `vnr-plugin/agents/vnr-task-breaker.md` nội bộ, sinh `tasks.md`.

**Checkpoint**:

```
✅ Step 1 hoàn thành
  plan.md — [N phases] | data-model.md — [N entities] | contracts: [N endpoints]
  tasks.md — [N tasks] ([N parallel groups])
→ Tiếp tục Step 2? [yes] / [xem plan/tasks trước] / [abort]
```

---

## Step 2 — QC Generate + Testcase Writer (SONG SONG) 🛑

Dispatch **cả 2 Agent tool calls trong cùng 1 message**:

### Step 2a — QC Generate (e2e stubs)

<agent_to_use>Sử dụng vnr-qc-generator agent</agent_to_use>

```
Dùng Agent tool:
  subagent_type: "general-purpose"
  prompt: |
    Đọc và tuân theo system prompt: vnr-plugin/agents/vnr-qc-generator.md

    FEATURE: <feature>

    ĐỌC WIKI TRƯỚC (business context):
    - docs/wiki/index.md → xác định entries liên quan
    - docs/wiki/concepts/<feature>.md → AC, business rules → Happy Path scenarios
    - docs/wiki/entities/<entity>.md → validation rules → Validation & Error scenarios
    - docs/wiki/concepts/<auth>.md → phân quyền → Authorization scenarios
    (Tuân theo vnr-plugin/skills/vnr-wiki/SKILL.md nếu cần điều hướng thêm)

    ĐỌC SPEC:
    - specs/<feature>/spec.md
    - specs/<feature>/plan.md
    - specs/<feature>/contracts/api-commitments.md (nếu có)
    - vnr-plugin/standards/backend/03-permission.md
    - vnr-plugin/standards/frontend/03-permission.md

    CẤU TRÚC SOURCE: src/frontend/ là git repo riêng, e2e tests tại src/frontend/e2e/

    THỰC HIỆN:
    1. Tạo specs/<feature>/test-scenarios.md:
       - Nhóm: Happy Path, Validation & Error, Authorization, Edge Cases
       - Format: Given/When/Then với TC-ID, Priority (High/Medium/Low), Role
    2. Tạo src/frontend/e2e/<feature>.e2e.spec.ts:
       - test.todo() cho mỗi scenario, group bằng test.describe
       - Không implement body — chỉ stubs

    BÁO CÁO: số scenarios per nhóm, path 2 files.
```

### Step 2b — Testcase Writer

<agent_to_use>Sử dụng vnr-testcase-writer agent</agent_to_use>

```
Dùng Agent tool:
  subagent_type: "general-purpose"
  prompt: |
    Đọc và tuân theo system prompt: vnr-speckit/agents/vnr-testcase-writer.md

    FEATURE: <feature>

    ĐỌC WIKI TRƯỚC (business context):
    - docs/wiki/index.md → xác định entries liên quan
    - docs/wiki/concepts/<feature>.md → AC, business rules
    - docs/wiki/entities/<entity>.md → validation rules, field constraints
    (Tuân theo vnr-speckit/skills/vnr-wiki/SKILL.md nếu cần điều hướng thêm)

    ĐỌC SPEC & PLAN:
    - specs/<feature>/spec.md
    - specs/<feature>/plan.md
    - specs/<feature>/tasks.md
    - specs/<feature>/contracts/api-commitments.md (nếu có)
    - specs/<feature>/ui-detail.md (nếu có)
    - vnr-speckit/standards/backend/03-permission.md
    - vnr-speckit/standards/frontend/03-permission.md

    THỰC HIỆN:
    Tạo specs/<feature>/testcases.md:
    - Testcase chi tiết cho manual testing (pre-condition, steps, expected, test data)
    - Phân loại theo module: API, UI, Authorization, Integration
    - Priority: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)

    BÁO CÁO: số testcases per module, path file.
```
**Checkpoint**:
**Sau khi CẢ 2 hoàn thành**, tổng hợp:

```
✅ Step 2 hoàn thành
  Step 2a: test-scenarios.md — [N scenarios] (H High, M Medium, L Low)
           e2e stubs — [N test.todo()] in src/frontend/e2e/<feature>.e2e.spec.ts
  Step 2b: testcases.md — [N testcases] (P0/P1/P2/P3)
→ Tiếp tục Step 3? [yes] / [review scenarios/testcases] / [abort]
```

---

## Step 3 — Implement 🛑

<agent_to_use>Sử dụng vnr-developer agent</agent_to_use>

```
Dùng Skill tool:
  skill: "vnr-implement"
  args: ""
```

Skill `vnr-implement` sẽ đọc `vnr-plugin/agents/vnr-developer.md` nội bộ, thực hiện:
- Load tasks.md + plan.md + contracts/ + data-model.md
- Execute từng task theo phase, đánh dấu `[x]` khi done
- Dừng nếu non-parallel task fails

**Checkpoint nội bộ**: Khi vnr-implement hỏi về checklists → **dừng, chờ user**.
**Build fail** → dừng pipeline.

**Checkpoint**:

```
✅ Step 3 hoàn thành
  Tasks: X/N ✅ | Files: N created, N modified
  Build: ✅ OK
→ Tiếp tục Step 4? [yes] / [review code] / [abort]
```

---

## Step 4 — Unit Test Write

<agent_to_use>Sử dụng vnr-test-engineer agent</agent_to_use>

```
Dùng Agent tool:
  subagent_type: "general-purpose"
  prompt: |
    Đọc và tuân theo system prompt: vnr-plugin/agents/vnr-test-engineer.md

    FEATURE: <feature>

    ĐỌC WIKI (business context để viết đúng test cases):
    - docs/wiki/index.md → entries liên quan
    - docs/wiki/entities/<entity>.md → validation rules → boundary test cases
    - docs/wiki/concepts/<feature>.md → business rules → exception test cases
    (Tuân theo vnr-plugin/skills/vnr-wiki/SKILL.md nếu cần điều hướng thêm)

    CẤU TRÚC SOURCE:
    - src/backend/ = git repo riêng (ASP.NET Core)
    - src/frontend/ = git repo riêng (Angular 19)
    - E2E tests tại src/frontend/e2e/

    ĐỌC SPEC & CODE:
    - specs/<feature>/test-scenarios.md
    - specs/<feature>/plan.md
    - specs/<feature>/contracts/api-commitments.md (nếu có)
    - Chạy: cd src/backend && git diff --name-only HEAD~1 (xác định BE files)
    - Chạy: cd src/frontend && git diff --name-only HEAD~1 (xác định FE files)

    THỰC HIỆN:
    1. BACKEND (xUnit + Moq): test per Handler + Validator
       - Output: src/backend/Tests/...
       - Happy path, validation fail, business rules, repository verify
    2. FRONTEND (Jasmine): test per Component + Service
       - Output: src/frontend/apps/<remote-app>/**/*.spec.ts
       - Create, load on init, empty state, HTTP calls
    3. PLAYWRIGHT: implement body cho tất cả Happy Path (thay test.todo)
       - File: src/frontend/e2e/<feature>.e2e.spec.ts
       - Giữ test.todo cho scenarios cần data phức tạp

    TARGET: coverage ≥ 80%
    KHÔNG modify source code — chỉ viết test files.
    BÁO CÁO: số test methods (BE / FE), số Playwright stubs implemented.
```

**Không checkpoint** — tự động chuyển sang Step 5+6.

```
✅ Step 4 hoàn thành
  BE: [N methods] | FE: [N specs] | Playwright: [X/Y Happy Path implemented]
→ Chuyển sang Step 5+6 (Review song song)...
```

---

## Step 5+6 — Arch Review + Security Review (SONG SONG) 🛑

Dispatch **cả 2 Agent tool calls trong cùng 1 message**:

### Agent 1 — Architecture Review

<agent_to_use>Sử dụng vnr-arch-reviewer agent</agent_to_use>

```
Dùng Agent tool:
  subagent_type: "general-purpose"
  prompt: |
    Đọc và tuân theo system prompt: vnr-plugin/agents/vnr-arch-reviewer.md

    FEATURE: <feature>

    ĐỌC BẮT BUỘC:
    - vnr-plugin/standards/backend/02-architecture-and-structure.md
    - vnr-plugin/standards/frontend/02-architecture-and-structure.md
    - specs/<feature>/contracts/api-commitments.md (nếu có)
    - docs/raw/api-http-contracts.md (nếu có)
    - vnr-plugin/memory/constitution.md (Principle II)

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
    Đọc và tuân theo system prompt: vnr-plugin/agents/vnr-sec-reviewer.md

    FEATURE: <feature>

    ĐỌC BẮT BUỘC:
    - vnr-plugin/standards/backend/03-permission.md
    - vnr-plugin/standards/frontend/03-permission.md
    - vnr-plugin/hooks/security-hooks.json (scan patterns)
    - vnr-plugin/memory/constitution.md (Principle III)

    SCOPE: git diff --name-only HEAD~1 → xác định BE/FE/full-stack.
    KHÔNG kết luận nếu chưa đọc ít nhất 1 file thay đổi.

    Chạy checklist OWASP từ agent file (14 checks BE + 7 checks FE).
    Scan patterns từ security-hooks.json trên tất cả files thay đổi.

    OUTPUT: Kết luận PASS ✅ / WARN ⚠️ / FAIL ⛔ + bảng findings + OWASP ref.
```
**Checkpoint**:
**Sau khi CẢ 2 hoàn thành**, tổng hợp:

```
✅ Step 5+6 hoàn thành
  Architecture: ✅ PASS / ⚠️ WARN (N findings) / ⛔ FAIL (N critical)
  Security:     ✅ PASS / ⚠️ WARN (N findings) / ⛔ FAIL (N critical)

[Nếu FAIL] ⛔ Pipeline dừng. Cần fix trước khi tiếp tục.
  → [fix rồi chạy lại: /vnr-auto-pipeline <feature> --from=5] / [abort]

[Nếu PASS/WARN] → Tiếp tục Step 7? [yes] / [abort]
```

---

## Step 7 — Run Unit Tests 🛑

```bash
# Backend (nếu có .cs changes)
BE_SCOPE=$(cd src/backend && git diff --name-only HEAD~1)
if echo "$BE_SCOPE" | grep -q '\.cs$'; then
  cd src/backend && rtk dotnet test --verbosity normal --logger "console;verbosity=normal"
fi

# Frontend (nếu có .ts changes)
FE_SCOPE=$(cd src/frontend && git diff --name-only HEAD~1)
if echo "$FE_SCOPE" | grep -q '\.ts$'; then
  cd src/frontend && rtk npm test -- --watch=false --browsers=ChromeHeadless
fi
```

Parse kết quả: Total / Passed / Failed / Skipped / Coverage.

**Điều kiện**:
- **PASS**: Failed = 0 (Coverage ≥ 80% nếu đo được)
- **FAIL**: Bất kỳ failure nào

```
✅ Step 7 hoàn thành
  Backend: X passed (coverage: Z%)
  Frontend: X passed (coverage: Z%)

[Nếu FAIL] ⛔ Tests failed.
  → [fix rồi chạy lại: /vnr-auto-pipeline <feature> --from=7] / [abort]

[Nếu PASS] → Tiếp tục Step 8? [yes] / [abort]
```

---

## Step 8 — E2E Automation (Playwright)

```bash
# Health check backend trước
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health 2>/dev/null || echo "000")

if [ "$HTTP_CODE" != "200" ]; then
  echo "⚠️ Backend API chưa chạy (HTTP $HTTP_CODE). SKIP E2E — không FAIL pipeline."
  echo "Start bằng: cd src/backend && dotnet run --project <ApiProject>"
else
  cd src/frontend && rtk npx playwright test e2e/<feature>.e2e.spec.ts --reporter=list
fi
```

Parse: X passed, Y failed, Z skipped (test.todo = skipped).

**Điều kiện**:
- **PASS**: 0 failed
- **WARN**: chỉ có skipped (todo stubs) và 0 failed
- **FAIL**: ≥ 1 failed
- **SKIP**: API down — không FAIL pipeline

**Không checkpoint** — tự động chuyển sang Step 9.

```
✅ Step 8 hoàn thành
  E2E: X passed, Y todo / ⚠️ tất cả stubs / ⛔ X failed / ⏭ SKIPPED (API down)
→ Chuyển sang Step 9 (Report)...
```

---

## Step 9 — Report

<agent_to_use>Sử dụng vnr-tech-writer agent</agent_to_use>

```
Dùng Agent tool:
  subagent_type: "general-purpose"
  prompt: |
    Đọc và tuân theo system prompt: vnr-plugin/agents/vnr-tech-writer.md

    FEATURE: <feature>

    ĐỌC WIKI (để viết user guide đúng ngữ cảnh nghiệp vụ):
    - docs/wiki/index.md → entries liên quan
    - docs/wiki/topics/<module>.md → tổng quan module → intro section
    - docs/wiki/concepts/<feature>.md → workflow → hướng dẫn step-by-step
    - docs/wiki/entities/<entity>.md → field labels → tên đúng với UI
    (Tuân theo vnr-plugin/skills/vnr-wiki/SKILL.md nếu cần điều hướng thêm)

    CẤU TRÚC SOURCE:
    - src/backend/ = git repo riêng (ASP.NET Core)
    - src/frontend/ = git repo riêng (Angular 19)
    - Playwright screenshots: src/frontend/test-results/ và src/frontend/playwright-report/

    ĐỌC SPEC & ARTIFACTS:
    - specs/<feature>/spec.md
    - specs/<feature>/plan.md
    - specs/<feature>/test-scenarios.md
    - specs/<feature>/testcases.md (nếu có — từ Step 2b)
    - specs/<feature>/contracts/api-commitments.md (nếu có)

    DỮ LIỆU TỪ CÁC BƯỚC TRƯỚC (đã có trong context):
    - Step 5: Architecture Review verdict + findings
    - Step 6: Security Review verdict + findings
    - Step 7: Unit Test results (total, passed, failed, coverage)
    - Step 8: E2E results (passed, failed, todo)

    SCREENSHOTS TỪ PLAYWRIGHT:
    Tìm screenshots tại các vị trí sau (theo thứ tự ưu tiên):
    1. src/frontend/test-results/ — Playwright mặc định lưu screenshots khi test fail
    2. src/frontend/playwright-report/ — HTML report có embedded screenshots
    3. src/frontend/e2e/screenshots/ — Custom screenshots (nếu test code chụp thủ công)
    Chỉ tham chiếu file tồn tại thực tế. Bỏ qua nếu không có.

    THỰC HIỆN:
    1. Tạo specs/<feature>/result/final-report.md
       - Summary table: Arch | Security | Unit Tests | E2E
       - Findings chi tiết từ mỗi review step
       - Files changed: cd src/backend && git diff --stat HEAD~5; cd src/frontend && git diff --stat HEAD~5
       - Sign-off checklist

    2. Tạo specs/<feature>/result/user-guide.md
       - Tiếng Việt, hướng end-user
       - Menu path, chức năng, phân quyền, FAQ
       - Nếu Playwright docs-reporter đã tạo → bổ sung, không ghi đè
       - Screenshots: dùng relative path từ specs/<feature>/result/ đến src/frontend/test-results/ hoặc copy screenshots vào specs/<feature>/result/screenshots/

    BÁO CÁO: path 2 files, tóm tắt verdict tổng.
```

---

## Pipeline Complete

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VNR AUTO-PIPELINE COMPLETE ✅  [Feature: <feature>]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✅ Plan + Tasks    ✅ QC + Testcases   ✅ Implement
 ✅ Unit Tests      ✅ Arch Review      ✅ Security
 ✅ Run Tests       ✅ E2E              ✅ Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Artifacts:
  specs/<feature>/result/final-report.md
  specs/<feature>/result/user-guide.md
  specs/<feature>/test-scenarios.md
  specs/<feature>/testcases.md

Next (commit riêng từng repo):
  cd src/backend  && rtk git add . && rtk git commit -m "feat(<feature>): <mô tả BE>"
  cd src/frontend && rtk git add . && rtk git commit -m "feat(<feature>): <mô tả FE>"
  → Tạo PR cho mỗi repo: feature/<feature> → main
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Recovery — Chạy lại từ bước cụ thể

```
/vnr-auto-pipeline <feature> --from=2    ← từ QC Generate
/vnr-auto-pipeline <feature> --from=3    ← từ Implement
/vnr-auto-pipeline <feature> --from=5    ← từ Arch+Sec Review
/vnr-auto-pipeline <feature> --from=7    ← từ Run Tests
/vnr-auto-pipeline <feature> --from=9    ← chỉ Report
```

Khi `--from=N`: bỏ qua validation các bước trước, nhảy thẳng đến Step N.
Nếu step trước đã sinh artifacts (plan.md, tasks.md, ...) → sử dụng lại, không tạo mới.

---

## Gate Summary (từ Constitution)

| Chuyển tiếp | Điều kiện |
|-------------|----------|
| Step 1 → 2a+2b | plan.md + tasks.md được user approve |
| Step 2a+2b → 3 | test-scenarios.md + testcases.md được user approve |
| Step 3 → 4 | Build thành công (0 error) — cả BE và FE |
| Step 4 → 5+6 | Tự động — không cần approve |
| Step 5+6 → 7 | Arch PASS + Security PASS (hoặc user override WARN) |
| Step 7 → 8 | Unit test 0 failures |
| Step 8 → 9 | Tự động — WARN nếu có failures |
| Step 9 → PR | Sign-off checklist đầy đủ |
