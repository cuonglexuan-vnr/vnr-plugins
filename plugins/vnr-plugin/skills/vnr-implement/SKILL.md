---
name: "vnr-implement"
description: "Execute the implementation plan by processing and executing all tasks defined in tasks.md"
argument-hint: "Optional implementation guidance or task filter"
compatibility: "Requires vnr-plugin project structure with vnr-plugin/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/implement.md"
user-invocable: true
---


## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Repo Root Discovery

**Trước khi thực hiện**, agent phải discover đường dẫn thực tế của từng repo từ wiki:

1. Đọc `docs/wiki/index.md` → tìm entries tagged `architecture` hoặc `recipe`.
2. Từ các entries đó, xác định:
   - `BE_ROOT`: thư mục chứa backend repo (e.g. `src/HRM9`, `src/backend`, v.v.)
   - `FE_ROOT`: thư mục chứa frontend repo (e.g. `src/Vnr.Dev.HrmPortal`, `src/frontend`, v.v.)
   - `MOBILE_ROOT`: thư mục chứa mobile repo (e.g. `src/app-mobile`, v.v.)
3. Nếu wiki không có entry rõ ràng → fallback: đọc `docs/raw/solution-layout.md` hoặc scan thư mục `src/` để detect.
4. Ghi nhớ các giá trị này — mọi bước filter và cd sau đây đều dùng giá trị đã discover, **không dùng literal path hardcoded**.

Dispatch là **tuần tự**: Backend → Frontend → Mobile. Nếu BE build fail → dừng, không chuyển sang FE.

## Pre-Execution Checks

**Check for extension hooks (before implementation)**:
- Check if `$PLUGIN_DIR/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_implement` key
- If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
- For each executable hook, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    
    Wait for the result of the hook command before proceeding to the Outline.
    ```
- If no hooks are registered or `$PLUGIN_DIR/extensions.yml` does not exist, skip silently

## Outline

1. **Setup** (optional): If `vnr-plugin/scripts/powershell/check-prerequisites.ps1` exists, run it with `-Json -RequireTasks -IncludeTasks` from repo root and parse PLUGIN_DIR, FEATURE_DIR and AVAILABLE_DOCS list. If the script is absent, resolve PLUGIN_DIR by scanning parent directories for `vnr-plugin/`, and FEATURE_DIR as `specs/<feature>/`.

2. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files in the checklists/ directory
   - For each checklist, count:
     - Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
     - Completed items: Lines matching `- [X]` or `- [x]`
     - Incomplete items: Lines matching `- [ ]`
   - Create a status table:

     ```text
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```

   - Calculate overall status:
     - **PASS**: All checklists have 0 incomplete items
     - **FAIL**: One or more checklists have incomplete items

   - **If any checklist is incomplete**:
     - Display the table with incomplete item counts
     - **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
     - Wait for user response before continuing
     - If user says "no" or "wait" or "stop", halt execution
     - If user says "yes" or "proceed" or "continue", proceed to step 3

   - **If all checklists are complete**:
     - Display the table showing all checklists passed
     - Automatically proceed to step 3

3. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **REQUIRED**: Read `specs/<feature>/spec.md` (BA output) — Business Rules, ACs, Data Dictionary, Validation Messages drive implementation correctness
   - **IF EXISTS**: Read `ui-detail.md` for screen layout and component details
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios

4. **Project Setup Verification**:
   - **REQUIRED**: Create/verify ignore files based on actual project setup:

   **Detection & Creation Logic**:
   - Check if the following command succeeds to determine if the repository is a git repo (create/verify .gitignore if so):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

   - Check if Dockerfile* exists or Docker in plan.md → create/verify .dockerignore
   - Check if .eslintrc* exists → create/verify .eslintignore
   - Check if eslint.config.* exists → ensure the config's `ignores` entries cover required patterns
   - Check if .prettierrc* exists → create/verify .prettierignore
   - Check if .npmrc or package.json exists → create/verify .npmignore (if publishing)
   - Check if terraform files (*.tf) exist → create/verify .terraformignore
   - Check if .helmignore needed (helm charts present) → create/verify .helmignore

   **If ignore file already exists**: Verify it contains essential patterns, append missing critical patterns only
   **If ignore file missing**: Create with full pattern set for detected technology

   **Common Patterns by Technology** (from plan.md tech stack):
   - **Node.js/JavaScript/TypeScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
   - **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
   - **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
   - **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
   - **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
   - **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
   - **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
   - **Rust**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
   - **Kotlin**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
   - **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
   - **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `*.dll`, `autom4te.cache/`, `config.status`, `config.log`, `.idea/`, `*.log`, `.env*`
   - **Swift**: `.build/`, `DerivedData/`, `*.swiftpm/`, `Packages/`
   - **R**: `.Rproj.user/`, `.Rhistory`, `.RData`, `.Ruserdata`, `*.Rproj`, `packrat/`, `renv/`
   - **Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

   **Tool-Specific Patterns**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`
   - **Kubernetes/k8s**: `*.secret.yaml`, `secrets/`, `.kube/`, `kubeconfig*`, `*.key`, `*.crt`

5. Parse tasks.md structure and extract:
   - **Task phases**: Setup, Tests, Core, Integration, Polish
   - **Task dependencies**: Sequential vs parallel execution rules
   - **Task details**: ID, description, file paths, parallel markers [P]
   - **Execution flow**: Order and dependency requirements

5.5 **Display scope summary** — dùng `BE_ROOT`, `FE_ROOT`, `MOBILE_ROOT` đã discover để hiển thị:
   ```
   Repo roots discovered:
     Backend  : {BE_ROOT}     (e.g. src/HRM9)
     Frontend : {FE_ROOT}     (e.g. src/Vnr.Dev.HrmPortal)
     Mobile   : {MOBILE_ROOT} (e.g. src/app-mobile)
   Dispatch: BE → FE → Mobile (each agent self-filters; reports "No tasks — skipped" if nothing matches)
   ```

5.6 **Resolve the Wiki Loading Contract per scope (L3 prompt-injection)** — for each scope, gather the file paths from `tasks.md` (the `File` entries under that root) and run:
   ```
   node "$PLUGIN_DIR/scripts/resolve-context.mjs" --phase implement --paths "<paths under {BE_ROOT} | {FE_ROOT} | {MOBILE_ROOT}>"
   ```
   Capture the JSON output (`mandatory`, `cards`, `on_demand`). You will inject these into each developer subagent's dispatch prompt so the contract reaches the agent that actually writes code — independent of context compaction. If the resolver reports `manifest: "absent"`, skip this (agents fall back to `index.md`).

6. **Execute implementation — Sequential per-scope dispatch**:

   > **Quan trọng**: Mỗi phase luôn được spawn như một subagent chuyên biệt. Không dùng boolean để skip — agent tự filter tasks của mình và báo "0 tasks — skip" nếu không có task thuộc scope đó.
   >
   > **L3 — luôn truyền context đã resolve vào prompt dispatch** của mỗi developer subagent (cùng với FEATURE/PLUGIN_DIR/<ROOT>):
   > `WIKI_PAGES=[<mandatory + on_demand cho scope đó>]` và `CARD_REF=[<cards cho scope đó>]`.
   > Đây là kênh giao context chính (prompt luôn tới được subagent); PreToolUse hook là lớp gia cố write-time.

   ### 6a — Backend Phase

   <agent_to_use>Spawn vnr-backend-developer subagent — đọc `$PLUGIN_DIR/agents/vnr-backend-developer.md`. Truyền: FEATURE, PLUGIN_DIR, BE_ROOT (repo root thực tế đã discover), và `WIKI_PAGES`/`CARD_REF` đã resolve cho scope BE ở bước 5.6.</agent_to_use>

   - Agent filter tasks: chỉ execute tasks có `File` path bắt đầu bằng `{BE_ROOT}/`
   - Nếu không có task nào khớp → agent báo "No BE tasks — phase skipped" và kết thúc ngay
   - Phase-by-phase theo thứ tự trong tasks.md
   - Parallel tasks `[P]` trong cùng phase: thực hiện song song
   - Sau khi hoàn thành tất cả BE tasks: **chạy build** (command từ `docs/wiki/index.md` → `recipe` entry hoặc từ `plan.md` Technical Context → Commands)
   - **Nếu build FAIL → dừng toàn bộ, báo lỗi, KHÔNG chuyển sang 6b**
   - Đánh dấu `[x]` từng task BE vào tasks.md ngay sau khi hoàn thành

   ### 6b — Frontend Phase

   > Chỉ bắt đầu sau khi 6a kết thúc (BE build PASS hoặc "No BE tasks — phase skipped").

   <agent_to_use>Spawn vnr-frontend-developer subagent — đọc `$PLUGIN_DIR/agents/vnr-frontend-developer.md`. Truyền: FEATURE, PLUGIN_DIR, FE_ROOT (repo root thực tế đã discover), và `WIKI_PAGES`/`CARD_REF` đã resolve cho scope FE ở bước 5.6 (chứa UI component catalog đúng stack).</agent_to_use>

   - **Đọc `specs/<feature>/contracts/api-commitments.md` trước khi implement bất kỳ API service call nào**
   - Agent filter tasks: chỉ execute tasks có `File` path bắt đầu bằng `{FE_ROOT}/` và không phải E2E test path
   - Nếu không có task nào khớp → agent báo "No FE tasks — phase skipped" và kết thúc ngay
   - Phase-by-phase theo thứ tự trong tasks.md
   - Parallel tasks `[P]` trong cùng phase: thực hiện song song
   - Sau khi hoàn thành tất cả FE tasks: **chạy build** (command từ `docs/wiki/index.md` → `recipe` entry hoặc từ `plan.md` Technical Context → Commands)
   - **Nếu build FAIL → dừng, báo lỗi, KHÔNG chuyển sang 6c**
   - Đánh dấu `[x]` từng task FE vào tasks.md ngay sau khi hoàn thành

   ### 6c — Mobile Phase

   > Chỉ bắt đầu sau khi các phase trước kết thúc.

   <agent_to_use>Spawn vnr-mobile-developer subagent — đọc `$PLUGIN_DIR/agents/vnr-mobile-developer.md`. Truyền: FEATURE, PLUGIN_DIR, MOBILE_ROOT (repo root thực tế đã discover).</agent_to_use>

   - Agent filter tasks: chỉ execute tasks có `File` path bắt đầu bằng `{MOBILE_ROOT}/`
   - Nếu không có task nào khớp → agent báo "No Mobile tasks — phase skipped" và kết thúc ngay
   - Phase-by-phase theo thứ tự trong tasks.md
   - Parallel tasks `[P]` trong cùng phase: thực hiện song song
   - Đánh dấu `[x]` từng task Mobile vào tasks.md ngay sau khi hoàn thành

7. Implementation execution rules:
   - **Setup first**: Initialize project structure, dependencies, configuration
   - **Tests before code**: If you need to write tests for contracts, entities, and integration scenarios
   - **Core development**: Implement models, services, CLI commands, endpoints
   - **Integration work**: Database connections, middleware, logging, external services
   - **Polish and validation**: Unit tests, performance optimization, documentation

8. Progress tracking and error handling:
   - Report progress after each completed task
   - Halt execution if any non-parallel task fails
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - Provide clear error messages with context for debugging
   - Suggest next steps if implementation cannot proceed
   - **IMPORTANT** For completed tasks, make sure to mark the task off as [X] in the tasks file.

9. Completion validation:
   - Verify all required tasks are completed (across all scopes: BE + FE + Mobile)
   - Check that implemented features match the original specification
   - Validate that tests pass and coverage meets requirements
   - Confirm the implementation follows the technical plan
   - Report final status with summary:
     ```
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Implementation Complete
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Backend  [{BE_ROOT}]     : X/N tasks ✅ | Build: ✅ PASS / ⛔ FAIL / ⬜ SKIPPED
     Frontend [{FE_ROOT}]     : X/N tasks ✅ | Build: ✅ PASS / ⛔ FAIL / ⬜ SKIPPED
     Mobile   [{MOBILE_ROOT}] : X/N tasks ✅ | ⬜ SKIPPED
     Files: N created, N modified
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ```

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/vnr-tasks` first to regenerate the task list.

10. **Check for extension hooks**: After completion validation, check if `$PLUGIN_DIR/extensions.yml` exists in the project root.
    - If it exists, read it and look for entries under the `hooks.after_implement` key
    - If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
    - Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
    - For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
      - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
      - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
    - For each executable hook, output the following based on its `optional` flag:
      - **Optional hook** (`optional: true`):
        ```
        ## Extension Hooks

        **Optional Hook**: {extension}
        Command: `/{command}`
        Description: {description}

        Prompt: {prompt}
        To execute: `/{command}`
        ```
      - **Mandatory hook** (`optional: false`):
        ```
        ## Extension Hooks

        **Automatic Hook**: {extension}
        Executing: `/{command}`
        EXECUTE_COMMAND: {command}
        ```
    - If no hooks are registered or `$PLUGIN_DIR/extensions.yml` does not exist, skip silently
