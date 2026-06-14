---

description: "Task list template for implementing one feature"
---

# Tasks: [Feature ID — Title]

**Input**: Design documents in `specs/<feature>/` — `spec.md` (BA output), `plan.md`, and optionally `data-model.md`, `contracts/`, `research.md`, `ui-detail.md`.
**Prerequisites**: `plan.md` (required), `spec.md` (required — ACs drive phases), `research.md`, `data-model.md`, `contracts/`.

**Tests**: OPTIONAL — only include test tasks if explicitly requested.

**Path Conventions**: Discover from `docs/wiki/index.md` → entries tagged `convention` or `architecture`. The actual repo root paths for BE/FE/Mobile live in the wiki — agents must read them before writing any file path. The `src/backend/` / `src/frontend/` / `src/app-mobile/` examples below are **illustrative placeholders only**; replace with actual paths from wiki (e.g. `src/HRM9`, `src/Vnr.Dev.HrmPortal`).

**Organization**: All tasks belong to one feature. Phase 3+ is grouped by **AC group** (Happy-Path / Validation / Edge) or by **UI screen**. Pick whichever yields cleaner, independently shippable increments.

## Format: `[ID] [P?] [AC/Screen] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[AC]**: Traces the task to an AC (e.g., `[AC-001]`, `[VAL-02]`) or a screen (e.g., `[S1]`, `[S2]`)
- Include exact file paths in descriptions (from wiki path convention or plan.md)

## Phase 1: Setup

**Purpose**: Branches, scaffolds, dependencies specific to this US.

- [ ] T001 Create feature branches in `{BE_ROOT}/` and `{FE_ROOT}/`  *(replace with wiki-discovered paths)*
- [ ] T002 [P] Add/verify project dependencies per plan.md Technical Context
- [ ] T003 [P] Configure linting/formatting if new tooling needed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cross-cutting prerequisites that must exist before any AC implementation begins.

**⚠️ CRITICAL**: No AC work can begin until this phase is complete.

- [ ] T004 Create/update DB schema + migrations from US Section 6 (Data Dictionary)
- [ ] T005 [P] Create base entities/DTOs (US Section 6 → `{BE_ROOT}/Src/Services/<Svc>/Domain/`)  *(replace {BE_ROOT} with wiki path)*
- [ ] T006 [P] Register DI/routing hooks if the US introduces new endpoints
- [ ] T007 Seed/fixture data required for all ACs (if any)

**Checkpoint**: Foundation ready — AC/Screen phases can start.

---

## Phase 3 (Shape A): Happy-Path ACs 🎯 MVP

**Goal**: Deliver the primary success flow of the US.

**Independent Test**: Walk through AC-001 (and other Happy-Path ACs) end-to-end.

### Tests for Happy-Path ACs (OPTIONAL) ⚠️

- [ ] T010 [P] [AC-001] Integration test for AC-001 in `{BE_ROOT}/Tests/.../AC001Tests.cs`  *(replace {BE_ROOT})*
- [ ] T011 [P] [AC-001] E2E test in `{FE_ROOT}/e2e/<us-id>-happy.spec.ts`  *(replace {FE_ROOT})*

### Implementation

- [ ] T012 [P] [AC-001] Backend command/query handler in `{BE_ROOT}/Src/Services/<Svc>/Application/...`  *(replace {BE_ROOT})*
- [ ] T013 [P] [AC-001] Frontend service + UI wiring in `{FE_ROOT}/apps/<app>/.../<feature>.service.ts`  *(replace {FE_ROOT})*
- [ ] T014 [AC-001] Wire up primary screen (S1) from US Section 8 in `{FE_ROOT}/apps/<app>/.../<feature>.component.ts`  *(replace {FE_ROOT})*
- [ ] T015 [AC-001] Emit audit event from US Section 9 (e.g., `{Entity}Created`)

**Checkpoint**: Happy-Path ACs are demo-ready.

---

## Phase 4 (Shape A): Validation ACs

**Goal**: Enforce Business Rules (US Section 3) and surface Validation Messages (US Section 7).

### Implementation

- [ ] T020 [P] [AC-002] Implement BR-U001..BR-U00N checks (server + client)
- [ ] T021 [P] [AC-002] Wire VM-E01..VM-E0N messages with correct placement (field/form/toast)
- [ ] T022 [AC-002] Block submit when required fields are missing (US Section 6 "Bắt buộc" = Có)
- [ ] T023 [AC-002] Confirm dialog for VM-W01 warnings

**Checkpoint**: All BRs from US Section 3 are enforced; all VMs in US Section 7 are wired.

---

## Phase 5 (Shape A): Edge-Case ACs

**Goal**: Cover the remaining edge ACs and any conditional/toggle flows.

- [ ] T030 [P] [AC-003] Handle {edge case 1 from US Section 4}
- [ ] T031 [AC-003] Handle {edge case 2}
- [ ] T032 [AC-003] Empty-state VM-I01 on list screen

**Checkpoint**: All AC-xxx from US Section 4 pass.

---

<!--
  Shape B alternative (delete Shape A blocks above and use this when the US
  clearly maps to multiple screens):

  ## Phase 3 (Shape B): Screen 1 — {Tên màn hình}
  - [ ] T010 [P] [S1] ...
  - [ ] T011 [S1] ...
  ## Phase 4 (Shape B): Screen 2 — {Tên màn hình}
  - [ ] T020 [P] [S2] ...
  - [ ] T021 [S2] ...
-->

---

## Phase N: Polish & Cross-Cutting

- [ ] TXXX [P] Analytics events from US Section 9 wired in `{FE_ROOT}/...`  *(replace {FE_ROOT})*
- [ ] TXXX Traceability check — every AC in US Section 4 has ≥1 task and ≥1 test reference
- [ ] TXXX Documentation updates in `docs/`
- [ ] TXXX Run `/vnr-analyze` and resolve findings
- [ ] TXXX [P] Additional unit tests (if requested) in `{BE_ROOT}/Tests/unit/`, `{FE_ROOT}/...`  *(replace with wiki-discovered paths)*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all AC/Screen phases.
- **Phase 3+ (AC groups or Screens)**: Each depends on Foundational. Within an AC group, tests (if any) precede implementation.
- **Polish (Final Phase)**: Depends on all AC/Screen phases.

### Within a Phase

- Models/DTOs before services.
- Services before controllers/components.
- Validation logic alongside the AC it guards.
- Commit after each logical task group.

### Parallel Opportunities

- All `[P]` tasks within a phase can run in parallel.
- Backend and frontend tasks targeting different files are independently parallelizable once Foundational is done.

---

## Implementation Strategy

### MVP First (Happy-Path)

1. Phase 1 Setup → Phase 2 Foundational → Phase 3 Happy-Path ACs.
2. **STOP and VALIDATE**: Walk AC-001 end-to-end; confirm audit event from Section 9 fires.
3. Demo / review.

### Incremental Completion

1. After Happy-Path demo: add Validation ACs (Phase 4) → re-demo.
2. Add Edge-Case ACs (Phase 5) → final demo.
3. Polish phase.

### Parallel Team Strategy

- Backend dev: handlers + validation + migrations.
- Frontend dev: screens + VM wiring + UX states (Loading/Data/Empty/Error per US Section 8).
- Both converge on the contract defined in `plan.md` and `contracts/`.

---

## Notes

- `[P]` tasks = different files, no dependencies.
- `[AC-xxx]` / `[Sn]` label maps each task back to US Section 4 / Section 8 for traceability.
- Every AC in US Section 4 MUST have ≥1 implementation task; every VM in US Section 7 MUST have ≥1 wiring task.
- Verify tests fail before implementing (if tests requested).
- Avoid: vague tasks, same-file conflicts, cross-AC dependencies that break independent testing.
