# VNR Plugin — LLM Session Context

> **For fresh Claude Code sessions.** Read this file once. You will know the full SDLC, all workflows, and how to take action without any further explanation.

---

## 1. What Is This Plugin?

`vnr-plugin` is a **Spec-Driven Development (SDD) framework** for Claude Code. It enforces a structured delivery pipeline on an internal Vietnamese HR platform (HRM-Core) — from BA User Story to production-ready code.

**The golden rule: no code without an approved spec, no merge without passing gates.**

The plugin is **content-driven** (markdown-only, no compiled code). Every skill is a `SKILL.md` file. Every agent is an `AGENT.md` file. The `memory/constitution.md` is the governance root — every agent reads it.

**Key architectural fact:** `src/backend/` and `src/frontend/` are **2 separate git repositories**. Every git operation must `cd` into the correct repo first.

---

## 2. The SDLC Pipeline

```
spec.md (BA output at specs/<feature>/spec.md)
         │
         ▼
  [plan]          /vnr-plan ────────────────── vnr-planner agent
         │                                     → plan.md, data-model.md, contracts/, research.md
         ▼
  [plan-review]   Plan Review ──────────────── vnr-plan-reviewer agent
         │                    🛑 ONLY HUMAN CHECKPOINT — AskUserQuestion: approve/modify/reject
         ▼
  [tasks]         /vnr-tasks ──────────────── vnr-task-breaker agent
         │                                   → tasks.md
         ▼
  [testcases]     Testcase Writer ──────────── vnr-testcase-writer agent
         │                                   → testcases.md
         ▼
  [implement]     /vnr-implement ──────────── vnr-backend-developer → vnr-frontend-developer → vnr-mobile-developer
         │                                   (sequential: BE → FE → Mobile, build gate between each)
         ▼
  [code-review]   Code Review ────────────── vnr-code-reviewer agent
         │                                   → AC completeness, logic correctness, code quality
         ▼
  [arch-sec-review] Arch + Security ─────────┐ (PARALLEL)
                    vnr-arch-reviewer ────────┤
                    vnr-sec-reviewer  ────────┘ → PASS/WARN/FAIL
         ▼
  [e2e-stubs]     E2E Stubs ────────────────── Stub only (never fails pipeline)
         │                                   → path discovered from wiki or plan.md
         ▼
  [report]        Report ──────────────────── vnr-tech-writer agent
                                             → final-report.md + user-guide.md (Vietnamese)
```

**`/vnr-auto-pipeline <feature>`** runs this entire flow automatically. It is the most commonly used skill.

---

## 3. Quick Start Guide

### Most Common: Run Full Pipeline
```
/vnr-auto-pipeline SCC-E01-F01-U02
```
1. Ensure `specs/SCC-E01-F01-U02/spec.md` (BA spec) exists
2. Ensure repos are on branch `feature/SCC-E01-F01-U02`
3. Wait for `plan-review` checkpoint → select **approve** in the AskUserQuestion dialog
4. Everything else runs automatically

### Manual Step-by-Step
```
/vnr-plan SCC-E01-F01-U02     ← produces plan.md etc.
/vnr-tasks SCC-E01-F01-U02    ← produces tasks.md
/vnr-implement SCC-E01-F01-U02 ← implements all tasks
```

### Resume After Failure
```
/vnr-auto-pipeline SCC-E01-F01-U02 --from=implement       ← restart from Implement
/vnr-auto-pipeline SCC-E01-F01-U02 --from=code-review     ← restart from Code Review
/vnr-auto-pipeline SCC-E01-F01-U02 --from=arch-sec-review ← restart from Arch+Sec Review
```

### Load Wiki Context (Before Plan/Implement)
```
/vnr-wiki SCC-E01-F01-U02
```
This is a **mandatory pre-hook** — always runs automatically before `/vnr-plan` and `/vnr-implement`. You can run it manually for context.

---

## 4. Core Skills Reference

### 4.1 `/vnr-plan` — Implementation Planning

**Purpose:** Transform `spec.md` (BA output) into full design artifacts.

**Pre-requisites:**
| Item | Required? |
|------|-----------|
| `specs/<feature>/spec.md` | ✅ BA spec must exist |
| `docs/wiki/index.md` | ✅ Read via mandatory `before_plan` wiki hook |
| `$PLUGIN_DIR/memory/constitution.md` | ✅ Read by planner agent |

**Workflow:** Phase 0 (research.md) → Phase 1 (data-model.md + contracts/) → Phase 2 (plan.md)

**Output:**
```
specs/<feature>/
├── research.md              ← NEEDS CLARIFICATION resolved
├── data-model.md            ← entities, relationships, validations
├── contracts/
│   └── api-commitments.md  ← endpoints, DTOs, permission keys
└── plan.md                  ← implementation plan with phases
```

---

### 4.2 `/vnr-tasks` — Task Generation

**Purpose:** Break `plan.md` into a dependency-ordered `tasks.md`.

**Workflow:**
1. Read spec.md → extract ACs, BRs, VMs, UI screens
2. Read wiki (via index.md) → path conventions, component choices
3. Choose **Shape A** (per-AC) or **Shape B** (per-UI screen)
4. Build task list with dependency graph

**Task format:**
```
- [ ] T001 [P] [AC-001] Description — `src/backend/path/to/File.ext`
```

---

### 4.3 `/vnr-implement` — Implementation Execution

**Scope detection:** reads path prefixes from tasks.md
```
HAS_BE     = path prefix src/backend/
HAS_FE     = path prefix src/frontend/ (excl. e2e/)
HAS_MOBILE = path prefix src/app-mobile/
```

**Execution order:** BE → FE → Mobile (sequential). Build must pass before next scope starts.
**Build command:** from `docs/wiki/index.md` → `recipe` entry, or from `plan.md` Technical Context.
**Gate:** Build fail → pipeline stops → fix → `--from=implement`

---

### 4.4 `/vnr-auto-pipeline` — Full Automation Pipeline ⭐ MOST USED

**Purpose:** End-to-end automated pipeline. Single human checkpoint at `plan-review`.

**Invocation:**
```
/vnr-auto-pipeline <feature>
/vnr-auto-pipeline <feature> --from=<phase-id>    ← resume from named phase
```

**Pre-requisites:**
```
specs/<feature>/spec.md        ← BA spec must exist
repos on branch feature/<feature>
```

---

#### Phase: plan
- Invokes: `/vnr-plan` skill → `vnr-planner` agent
- wiki hook fires: loads `docs/wiki/index.md` for domain context
- Produces: `research.md`, `data-model.md`, `contracts/`, `plan.md`

---

#### Phase: plan-review 🛑 THE ONLY HUMAN CHECKPOINT
- Invokes: `vnr-plan-reviewer` agent (wiki-driven checklist)
- Verdict: `✅ PASS` / `⚠️ WARN` / `⛔ FAIL`
- **HITL via AskUserQuestion dialog:**
  - `approve` → continue
  - `modify` → edit plan.md → approve or reject
  - `reject` → stop → `--from=plan`

---

#### Phase: tasks
- Invokes: `/vnr-tasks` skill → `vnr-task-breaker` agent

#### Phase: testcases
- Invokes: `vnr-testcase-writer` agent
- Produces: `specs/<feature>/testcases.md` (API | UI | Auth | Integration)

#### Phase: implement
- Invokes: `/vnr-implement` skill
- Build gate: fail → stop → `--from=implement`

#### Phase: code-review
- Invokes: `vnr-code-reviewer` agent
- Checks: AC/BR completeness, task completeness, code quality, logic correctness
- Gate: `review` → FAIL stops pipeline → `--from=code-review`

#### Phase: arch-sec-review (PARALLEL)
- `vnr-arch-reviewer` + `vnr-sec-reviewer` dispatched simultaneously
- Both wiki-driven (checklist from `docs/wiki/index.md`)
- Either FAIL → stop → `--from=arch-sec-review`

#### Phase: e2e-stubs (always passes)
- Discovers E2E path from wiki `recipe` entry
- Creates minimal stub if missing

#### Phase: report
- Invokes: `vnr-tech-writer` agent
- Produces: `specs/<feature>/result/final-report.md` + `user-guide.md`

---

#### Complete Output Map
| Phase | Artifact |
|-------|----------|
| plan | `specs/<feature>/plan.md`, `data-model.md`, `contracts/`, `research.md` |
| tasks | `specs/<feature>/tasks.md` |
| testcases | `specs/<feature>/testcases.md` |
| implement | source code in `src/backend/`, `src/frontend/`, `src/app-mobile/` |
| e2e-stubs | E2E stub file (path from wiki) |
| report | `specs/<feature>/result/final-report.md`, `user-guide.md` |

---

#### Gate Summary
| Transition | Condition | On Failure |
|-----------|-----------|------------|
| plan → plan-review | Automatic | — |
| **plan-review → tasks** | 🛑 **User selects `approve`** (AskUserQuestion) | `--from=plan` to redo plan |
| tasks → testcases | Automatic | — |
| testcases → implement | Automatic | — |
| implement → code-review | Build passes (all scopes) | Auto-stop → `--from=implement` |
| code-review → arch-sec-review | Code Review PASS/WARN | Auto-stop → `--from=code-review` |
| arch-sec-review → e2e-stubs | Arch PASS/WARN AND Sec PASS/WARN | Auto-stop → `--from=arch-sec-review` |
| e2e-stubs → report | Always (stub never fails) | — |

---

#### Recovery Reference
```bash
/vnr-auto-pipeline <feature> --from=plan             # Re-run Plan
/vnr-auto-pipeline <feature> --from=plan-review      # Re-run Plan Review only
/vnr-auto-pipeline <feature> --from=tasks            # From Tasks (plan already approved)
/vnr-auto-pipeline <feature> --from=testcases        # From Testcase generation
/vnr-auto-pipeline <feature> --from=implement        # From Implement (build fixed)
/vnr-auto-pipeline <feature> --from=code-review     # From Code Review (logic/AC fixed)
/vnr-auto-pipeline <feature> --from=arch-sec-review  # From Arch+Sec Review (code fixed)
/vnr-auto-pipeline <feature> --from=e2e-stubs        # From E2E Stub check
/vnr-auto-pipeline <feature> --from=report           # Report only
```
When `--from=<phase-id>`: skips all prior validation, **reuses existing artifacts**.

---

## 5. Wiki Knowledge Base (`/vnr-wiki`)

### What the Wiki Is

The wiki is the **knowledge driver for all agents**. Without it, agents guess at business context. With it, they produce accurate, project-aligned output.

> **The wiki lives in the TARGET PROJECT, not in this plugin.**
> Location: `docs/wiki/` in your project root.

### Wiki Directory Structure
```
docs/
├── raw/         ← Source documents (architecture, API, UI specs) — IMMUTABLE
└── wiki/        ← AI-generated, LLM-maintained knowledge base
    ├── index.md           ← ALWAYS READ FIRST — catalog + quick lookup + cross-reference map
    ├── glossary.md        ← Term definitions (append-only)
    ├── log.md             ← Sync history (append-only)
    ├── domains/           ← Entities + workflows (DB tables, state machines, business rules)
    ├── patterns/          ← How the system works (runtime flows, architecture, tech stack)
    ├── guides/            ← How to build a new feature (step-by-step recipes)
    ├── rules/             ← Enforced coding standards (must/must-not, naming conventions)
    └── decisions/         ← ADRs — why a decision was made (append-only)
```

### Navigation Guide: What to Read for Each Phase

All navigation goes through `index.md` first — agents discover relevant pages by tag, not by hardcoded path.

| Your Phase | Tags to look for in index.md |
|-----------|-----------|
| `/vnr-plan` | `entity`, `workflow`, `architecture`, `adr` |
| Backend development | `flow`, `recipe`, `standard`, `constraint` (for backend layer) |
| Frontend development | `flow`, `recipe`, `convention`, `standard` (for frontend layer) |
| Mobile development | `mobile`, `flow`, `recipe`, `standard` (for mobile layer) |
| Testcase writing | `entity`, `workflow`, `constraint` |
| Arch/Sec review | `standard`, `constraint`, `convention` (for arch); `security`, `constraint` (for sec) |

### Folder Purpose (Quick Lookup)

| Need | Folder |
|------|--------|
| Entity fields, FK, validation rules | `domains/` |
| Business workflows, state machines | `domains/` |
| How the system runs at runtime | `patterns/` |
| Architecture and tech stack overview | `patterns/` |
| How to build a feature step-by-step | `guides/` |
| Naming rules, coding conventions | `rules/` |
| Why an architectural decision was made | `decisions/` |
| Unknown terminology | `glossary.md` |

### Wiki Lifecycle Hooks (from `extensions.yml`)

| When | Hook | Mandatory? | Action |
|------|------|-----------|--------|
| Before `/vnr-plan` | `vnr-wiki` | ✅ **Yes** | Load business context from wiki |
| Before `/vnr-implement` | `vnr-wiki` | ✅ **Yes** | Load business context from wiki |
| After `/vnr-implement` | `vnr-wiki-sync` | ✅ **Yes** | Sync wiki from raw docs |

> `index.md` is the catalog of ALL pages. If a page isn't in `index.md`, it doesn't exist. Never read `docs/raw/` directly — use the wiki (it's already structured for LLMs).

### Wiki Sync (`/vnr-wiki-sync`)
Compiles `docs/raw/*.md` into `docs/wiki/` pages. Runs automatically after implement.

**Classification rules:**
- DB tables, fields → `domains/` (type: `entity`)
- Business processes, state transitions → `domains/` (type: `workflow`)
- How to build features → `guides/` (type: `recipe`)
- How system works → `patterns/` (type: `architecture|flow|component`)
- Coding standards → `rules/` (type: `standard|convention|constraint`)
- Tech decisions → `decisions/` (type: `adr`)
- Terms → `glossary.md` (no separate page)

---

## 6. Specs Directory Structure

```
specs/
└── <feature>/
    ├── spec.md                          ← BA Spec — SOURCE OF TRUTH, NEVER EDIT
    ├── ui-detail.md                     ← BA or SWE UI detail (optional)
    │
    ├── research.md                      ← /vnr-plan Phase 0 output
    ├── data-model.md                    ← /vnr-plan Phase 1 output
    ├── contracts/
    │   └── api-commitments.md          ← /vnr-plan Phase 2 output
    ├── plan.md                          ← /vnr-plan Phase 3 output
    │
    ├── tasks.md                         ← /vnr-tasks output
    ├── testcases.md                     ← vnr-testcase-writer output (manual QA)
    ├── test-scenarios.md                ← vnr-qc-generator output (Gherkin)
    │
    ├── checklists/
    │   └── requirements.md             ← /vnr-checklist output (gates /vnr-implement)
    │
    └── result/
        ├── final-report.md             ← vnr-tech-writer output
        ├── user-guide.md               ← vnr-tech-writer output (Vietnamese)
        └── screenshots/                ← E2E screenshots (if any)
```

---

## 7. Agents Reference

| Agent | Role | Pipeline Phase | Output |
|-------|------|--------------|--------|
| `vnr-planner` | Software Architect | plan | plan.md, data-model.md, contracts/, research.md |
| `vnr-plan-reviewer` | Plan Reviewer | plan-review | PASS/WARN/FAIL (wiki-driven checklist) |
| `vnr-task-breaker` | Tech Lead | tasks | tasks.md |
| `vnr-testcase-writer` | QA Analyst | testcases | testcases.md |
| `vnr-qc-generator` | QC Engineer | optional | test-scenarios.md + E2E stubs |
| `vnr-backend-developer` | BE Dev | implement | src/backend/ code |
| `vnr-frontend-developer` | FE Dev | implement | src/frontend/ code |
| `vnr-mobile-developer` | Mobile Dev | implement | src/app-mobile/ code |
| `vnr-arch-reviewer` | Arch Reviewer | arch-sec-review | PASS/WARN/FAIL (wiki-driven checklist) |
| `vnr-sec-reviewer` | Security Reviewer | arch-sec-review | PASS/WARN/FAIL (security-hooks.json scan) |
| `vnr-code-reviewer` | Code Reviewer | code-review | PASS/WARN/FAIL (AC completeness, logic, quality) |
| `vnr-tech-writer` | Tech Writer | report | final-report.md + user-guide.md (Vietnamese) |
| `vnr-qc-assistant` | QA/QC Assistant | QC cycle | testcases.md feedback + review |
| `vnr-test-engineer` | Test Engineer | post-implement | Unit tests + E2E implementation |

---

## 8. Critical Rules (Non-Negotiable)

These rules are enforced by `memory/constitution.md` and checked by arch/security reviewers.

### Process Rules
- ❌ No code before an approved spec (`specs/<feature>/spec.md` must exist)
- ❌ No merge if tests fail or coverage < 80%
- ❌ No skipping code review
- ❌ No skipping arch review or security review

### Universal Code Rules
- ❌ No business logic in Controller layer — Controller only calls service/handler
- ❌ No exposing domain entities directly — always use DTOs
- ❌ No hardcoded secrets, base URLs, or connection strings
- ❌ No sensitive data in logs (password, token, PII)
- ❌ No direct API calls from UI components — must go through service/facade layer
- ❌ No hardcoded base URL — inject via config token
- ❌ No direct imports between isolated app modules — use shared libs only

### Tech-Stack-Specific Rules
Tech-specific rules (framework components, widget libraries, patterns) live in `docs/wiki/rules/`.
Arch reviewers discover them dynamically from `docs/wiki/index.md → entries tagged standard/constraint`.
Security reviewers use `$PLUGIN_DIR/hooks/security-hooks.json` for scan patterns.

---

## 9. Recovery & Troubleshooting

### Auto-Stop Conditions

| Where It Stopped | Why | Fix | Resume |
|-----------------|-----|-----|--------|
| `plan-review` | Plan Review FAIL (critical finding) | Edit `plan.md` to address findings | `--from=plan` |
| `plan-review` | User selected `reject` in dialog | Plan discarded | `--from=plan` |
| `implement` | Build failure | Fix compilation/build errors | `--from=implement` |
| `code-review` | Code Review FAIL | Fix logic/AC violations (see code-reviewer findings) | `--from=code-review` |
| `arch-sec-review` | Arch FAIL | Fix arch violations (see arch-reviewer findings) | `--from=arch-sec-review` |
| `arch-sec-review` | Security FAIL | Fix security vulnerabilities (see sec-reviewer findings) | `--from=arch-sec-review` |

### Common Issues

**"spec.md not found"**
→ Ensure `specs/<feature>/spec.md` exists. This is the BA output file.

**"Repos not on feature branch"**
```bash
cd src/backend && git checkout -b feature/<feature>
cd src/frontend && git checkout -b feature/<feature>
```

**"plan.md / tasks.md already exist"**
→ Pipeline asks which phase to resume from via AskUserQuestion dialog.

**"Checklist gate blocked /vnr-implement"**
→ Open `specs/<feature>/checklists/`, complete or mark items. Then answer `yes` to proceed.

**"Wiki missing or index.md not found"**
→ Run `/vnr-wiki-sync` to build wiki from `docs/raw/` source documents.

### Complete `--from=<phase-id>` Reference
```
--from=plan             Re-run Plan (vnr-plan skill)
--from=plan-review      Re-run Plan Review only
--from=tasks            Re-run Tasks (plan already approved)
--from=testcases        Re-run Testcase writing
--from=implement        Re-run Implement (all scopes)
--from=code-review      Re-run Code Review (logic/AC/quality)
--from=arch-sec-review  Re-run Arch Review + Security Review (parallel)
--from=e2e-stubs        Re-run E2E Stub check/create
--from=report           Re-run Report only
```

---

## 10. Tech Stack Reference

Tech stack details live in `docs/wiki/` (the project's wiki, not the plugin).

Agents discover them via `docs/wiki/index.md` → entries tagged `architecture`, `flow`, `standard`, `convention`.

To browse tech context before planning or implementing:
```
/vnr-wiki <feature>
```

---

*Generated: 2026-06-10 | Last updated: 2026-06-10 | Source: vnr-plugins CLAUDE.md + all SKILL.md + all agent .md files + constitution.md*
