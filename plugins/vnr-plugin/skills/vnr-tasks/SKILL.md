---
name: "vnr-tasks"
description: "Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts."
argument-hint: "Optional task generation constraints"
compatibility: "Requires vnr-plugin project structure with vnr-plugin/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/tasks.md"
user-invocable: true
---


## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Agent System Prompt

<agent_to_use>Sử dụng vnr-task-breaker agent — đọc `$PLUGIN_DIR/agents/vnr-task-breaker.md` để hiểu vai trò, quy tắc chia task và format bắt buộc trước khi thực hiện.</agent_to_use>

## Pre-Execution Checks

**Check for extension hooks (before tasks generation)**:
- Check if `$PLUGIN_DIR/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_tasks` key
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

1. **Setup**: Run `vnr-plugin/scripts/powershell/check-prerequisites.ps1 -Json` from repo root and parse PLUGIN_DIR, FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), the User Story file `<US-ID>_*.md` (shape: `templates/userstory-template.md`) — Sections 3 (BR), 4 (AC), 6 (Data Dictionary), 7 (VM), 8 (UI/UX), 10 (Traceability).
   - **Optional**: `<US-ID>_*_ui-detail.md` or `ui-detail.md` (UI breakdown), data-model.md (entities), contracts/ (interface contracts), research.md (decisions), quickstart.md (test scenarios).
   - Note: Not all projects have all documents. Generate tasks based on what's available.

3. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure.
   - Load the User Story file; the whole tasks.md is scoped to this one US.
   - Extract AC IDs from Section 4 and screen names from Section 8 — these drive Phase 3+ grouping.
   - Extract BR-Uxxx from Section 3 and VM codes from Section 7 — these drive validation and feedback tasks.
   - If data-model.md exists: Map entities back to fields in US Section 6.
   - If contracts/ exists: Map each contract to the AC(s) it serves.
   - Pick phase shape: **Shape A — per AC group** (Happy-Path / Validation / Edge) or **Shape B — per UI screen** (when Section 8 has multiple screens). Choose whichever produces cleaner, independently shippable increments.
   - Generate dependency graph (Setup → Foundational → AC/Screen phases → Polish).
   - Create parallel execution examples within phases.
   - Validate task completeness: every AC in Section 4 has ≥1 implementation task; every VM in Section 7 has ≥1 wiring task; every screen in Section 8 has ≥1 View + 1 Controller/Service task.

4. **Generate tasks.md**: Use `$PLUGIN_DIR/templates/tasks-template.md` as structure, fill with:
   - Correct US-ID + title from plan.md / User Story file.
   - Phase 1: Setup tasks (branches, scaffolds, dependencies).
   - Phase 2: Foundational tasks (migrations, base entities, cross-cutting prerequisites — BLOCKS Phase 3+).
   - Phase 3+: One phase per AC group OR per UI screen (Shape A or Shape B — DO NOT use "Phase per user story"; the whole tasks.md is already scoped to one US).
   - Each phase includes: phase goal, independent test criteria, tests (if requested), implementation tasks.
   - Final Phase: Polish & cross-cutting concerns (analytics events from Section 9, docs).
   - All tasks must follow the strict checklist format (see Task Generation Rules below).
   - Clear file paths for each task (respecting the `src/backend/` / `src/frontend/` dual-repo layout).
   - Dependencies section showing phase completion order.
   - Parallel execution examples per phase.
   - Implementation strategy section (MVP = Happy-Path AC group or primary screen).

5. **Report**: Output path to generated tasks.md and summary:
   - Total task count.
   - Task count per AC group (or per screen, if Shape B).
   - AC / BR / VM coverage counts (e.g., "12/12 AC covered, 9/9 BR covered, 13/13 VM wired").
   - Parallel opportunities identified.
   - Independent test criteria per phase.
   - Suggested MVP scope (Happy-Path ACs or primary screen).
   - Format validation: Confirm ALL tasks follow the checklist format (checkbox, ID, `[AC-xxx]` or `[Sn]` label, file paths).

6. **Check for extension hooks**: After tasks.md is generated, check if `$PLUGIN_DIR/extensions.yml` exists in the project root.
   - If it exists, read it and look for entries under the `hooks.after_tasks` key
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

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.

## Task Generation Rules

**CRITICAL**: The whole tasks.md is scoped to **one User Story**. Phase 3+ is organized by **AC group** (Happy-Path / Validation / Edge) OR by **UI screen** (Section 8), not by user story.

**Tests are OPTIONAL**: Only generate test tasks if explicitly requested in the US or if user requests TDD approach.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [AC/Screen?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
4. **[AC/Screen] label**: REQUIRED for Phase 3+ tasks only
   - Format: `[AC-001]`, `[AC-002]`, `[VAL-01]` (maps to AC IDs from US Section 4) OR `[S1]`, `[S2]` (maps to screens from US Section 8)
   - Setup phase: NO label
   - Foundational phase: NO label
   - Phase 3+ (AC or Screen phases): MUST have label
   - Polish phase: NO label (unless it directly traces back to an AC, e.g., analytics event for AC-001)
5. **Description**: Clear action with exact file path (prefixed with `src/backend/` or `src/frontend/` per the dual-repo convention)

**Examples**:

- ✅ CORRECT: `- [ ] T001 Create branches in src/backend/ and src/frontend/`
- ✅ CORRECT: `- [ ] T005 [P] Add migration for <Entity> in src/backend/Src/Services/<Svc>/Infrastructure/Migrations/`
- ✅ CORRECT: `- [ ] T012 [P] [AC-001] Create <Entity> DTO in src/backend/Src/Services/<Svc>/Application/Dtos/<Entity>Dto.cs`
- ✅ CORRECT: `- [ ] T014 [AC-001] Wire <feature>.service.ts in src/frontend/apps/<app>/src/.../<feature>.service.ts`
- ✅ CORRECT: `- [ ] T020 [S1] Implement list view in src/frontend/apps/<app>/src/.../<feature>-list.component.ts`
- ❌ WRONG: `- [ ] T001 [US1] Create model` (legacy [US1] label — use `[AC-xxx]` or `[Sn]`)
- ❌ WRONG: `- [ ] [AC-001] Create model` (missing Task ID)
- ❌ WRONG: `- [ ] T001 [AC-001] Create model` (missing file path)

### Task Organization

1. **From Acceptance Criteria (US Section 4)** — PRIMARY ORGANIZATION when using Shape A:
   - Group ACs into Happy-Path / Validation / Edge-case sets.
   - Each set becomes one phase in Phase 3+. Within a set, each AC gets ≥1 implementation task.

2. **From UI Screens (US Section 8)** — PRIMARY ORGANIZATION when using Shape B:
   - Each screen gets its own phase. Within a screen phase, include View + Controller/Service + validation wiring + empty/error states from Section 8.

3. **From Business Rules (US Section 3)**:
   - Each BR-Uxxx → at least one server-side guard task (handler/validator) AND one client-side guard task where applicable.
   - Place BR guard tasks inside the AC phase that triggers the rule (check Section 10 `AC ↔ BR` matrix).

4. **From Validation Messages (US Section 7)**:
   - Each VM code → one wiring task (field/form placement, toast, confirm dialog) in the AC or screen phase that surfaces it.
   - Include i18n key creation tasks if messages are new.

5. **From Data Dictionary (US Section 6)**:
   - Each required (`Bắt buộc: Có`) field → one DTO task + one validation task.
   - Each field with `Nguồn: {danh mục}` → one lookup/source-loading task.

6. **From Contracts**:
   - Map each endpoint/contract → to the AC it serves (tests-first if tests requested).

7. **From Setup/Infrastructure**:
   - Shared infrastructure → Phase 1.
   - Foundational/blocking tasks (migrations, base entities, DI) → Phase 2.

### Phase Structure

- **Phase 1**: Setup (branches, scaffolds, dependencies)
- **Phase 2**: Foundational (migrations, base entities, cross-cutting prerequisites — BLOCKS Phase 3+)
- **Phase 3+**: AC groups (Shape A) OR UI screens (Shape B)
  - Within a phase: Tests (if requested) → Models/DTOs → Services/Handlers → Controllers/Components → BR guards → VM wiring
  - Each phase should be a complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting (analytics events from Section 9, docs, traceability audit)
