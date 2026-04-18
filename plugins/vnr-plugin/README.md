# vnr-plugin

> **VNR Plugin** — A plugin to help with VNR requirements.

A content-driven plugin for the Claude Code / agent harness that provides a full development pipeline — from feature specification to implementation, testing, review, and final reporting. It orchestrates a team of specialized agents through structured, step-by-step workflows.

---

## What It Provides

| Area | What you get |
|---|---|
| **Specification** | Guided creation and validation of feature specs with quality checklists |
| **Planning** | Architecture-aware implementation plans, data models, and API contracts |
| **Task breakdown** | Ordered, dependency-aware task lists organized by user story and phase |
| **Implementation** | Phase-by-phase code execution driven by tasks.md |
| **QC & Testing** | Test scenario generation, testcase writing, E2E test execution, and QC review |
| **Code Review** | Architecture and security review with PASS / PASS+WARN / FAIL verdicts |
| **Documentation** | Final reports and end-user guides from pipeline artifacts |
| **Knowledge base** | Wiki/docs reading and LLM-wiki synchronization |
| **Automation** | Full automated pipeline from spec → plan → tasks → implement → test → review → report |
| **Customization** | Project-scoped skill and agent overrides |

---

## Skills (Commands)

| Skill | Command | Purpose |
|---|---|---|
| `vnr-specify` | `/vnr-specify` | Create or update a feature spec (`spec.md`) from a natural-language description |
| `vnr-clarify` | `/vnr-clarify` | Ask up to 5 targeted questions to resolve underspecified areas in a spec |
| `vnr-analyze` | `/vnr-analyze` | Non-destructive cross-artifact analysis — find gaps between spec, plan, and tasks |
| `vnr-checklist` | `/vnr-checklist` | Generate a requirements-quality checklist ("unit tests for the spec") |
| `vnr-plan` | `/vnr-plan` | Produce `plan.md`, `data-model.md`, and `contracts/` from the feature spec |
| `vnr-tasks` | `/vnr-tasks` | Break the plan into an ordered, dependency-aware `tasks.md` |
| `vnr-implement` | `/vnr-implement` | Execute the implementation plan phase-by-phase using `tasks.md` |
| `vnr-run-testcases` | `/vnr-run-testcases` | Show, track, and update testcase statuses from `testcases.md` |
| `vnr-run-e2e` | `/vnr-run-e2e` | Run Playwright E2E tests, collect screenshots, and generate an HTML report |
| `vnr-qc-assistant` | `/vnr-qc-assistant` | Dual-mode QA assistant: apply QC feedback or audit testcases for improvements |
| `vnr-wiki` | `/vnr-wiki` | Read and navigate `docs/wiki/` to gather domain/business context |
| `vnr-wiki-sync` | `/vnr-wiki-sync` | Synchronize the compiled LLM wiki with the latest raw source documents |
| `vnr-constitution` | `/vnr-constitution` | Create or update the project constitution and sync dependent templates |
| `vnr-auto-pipeline` | `/vnr-auto-pipeline` | Run the full automated pipeline: spec → plan → tasks → QC → implement → tests → review → report |
| `vnr-customize` | `/vnr-customize` | Create or override project-scoped skills/agents to customize plugin defaults |

---

## Automated Pipeline (`vnr-auto-pipeline`)

The flagship skill runs the entire development pipeline end-to-end with checkpoints:

```
spec.md → plan.md → tasks.md → QC scenarios → implement → unit tests → arch review → sec review → E2E tests → final report
```

Each stage delegates to the appropriate specialized agent. The pipeline is checkpointed — it can be resumed from any failed stage.

---

## Agents

The plugin ships a team of specialized agents. Each agent has a defined role, I/O contract, and constraints.

### `vnr-planner` — Software Architect / Tech Lead

> Produces implementation plans from feature specs, following project conventions and constitution.

| Attribute | Detail |
|---|---|
| **Role** | Software Architect / Tech Lead |
| **Inputs** | `spec.md`, `memory/constitution.md`, wiki context, templates |
| **Outputs** | `plan.md`, `data-model.md`, `contracts/api-commitments.md`, `research.md` |

**Constraints:** Read-only relative to implementation (does not write code). Errors on unresolved gates. Must follow templates and constitution checks.

---

### `vnr-task-breaker` — Tech Lead (Task Breaker)

> Breaks a delivery plan into granular, file-path-specific, dependency-aware tasks.

| Attribute | Detail |
|---|---|
| **Role** | Tech Lead |
| **Inputs** | `plan.md` (required), `data-model.md`, `contracts/`, standards |
| **Outputs** | `specs/<feature>/tasks.md` — organized by phase and user story, with T-IDs, dependencies, and parallel markers |

**Constraints:** Tasks must be granular and file-path-specific. Must not merge unrelated layers into one task.

---

### `vnr-developer` — Full-Stack Developer

> Implements code artifacts phase-by-phase following tasks.md.

| Attribute | Detail |
|---|---|
| **Role** | Full-Stack Developer |
| **Inputs** | `tasks.md` (required), `plan.md` (required), `data-model.md`, `contracts/`, `research.md` |
| **Outputs** | Implemented code in `src/backend` and/or `src/frontend`; marks tasks `[x]` when done |

**Constraints:** Do not add features beyond tasks. Follows Clean Architecture / CQRS and project conventions. Does not commit cross-repo in a single command.

---

### `vnr-qc-generator` — QC Engineer (Shift-Left)

> Generates test scenarios and Playwright stubs before implementation.

| Attribute | Detail |
|---|---|
| **Role** | QC Engineer |
| **Inputs** | Wiki (index/concepts/entities), `spec.md`, `plan.md`, standards |
| **Outputs** | `specs/<feature>/test-scenarios.md` (Gherkin-like), `src/frontend/e2e/<feature>.e2e.spec.ts` (stubs with `test.todo`) |

**Constraints:** Creates stubs only (`test.todo`) — does not implement test bodies.

---

### `vnr-test-engineer` — Test Engineer

> Writes unit tests and implements Playwright E2E tests from stubs.

| Attribute | Detail |
|---|---|
| **Role** | Test Engineer |
| **Inputs** | `test-scenarios.md`, `plan.md`, `contracts/api-commitments.md`, git diff |
| **Outputs** | Unit test files (xUnit/Moq for backend, Jasmine for frontend), Playwright implementations replacing `test.todo` stubs |

**Constraints:** Does **not** modify application source code — writes tests only. Targets ≥ 80% coverage.

---

### `vnr-qc-assistant` — QA/QC Assistant (Dual-Mode)

> Applies QC feedback to testcases or audits them for quality improvements.

| Attribute | Detail |
|---|---|
| **Role** | QA/QC Assistant |
| **Inputs** | `specs/<feature>/testcases.md` (required); in Reviewer mode also `spec.md`, `plan.md`, `tasks.md`, wiki |
| **Outputs** | **Feedback mode:** updated `testcases.md` + edit summary. **Reviewer mode:** 10-check review table + improvement suggestions |

**Constraints:** Feedback mode strictly applies QC feedback only. Reviewer mode does not modify files unless QC authorizes. Asks user when mode is ambiguous.

---

### `vnr-testcase-writer` — QA Test Analyst

> Writes detailed manual testcases from spec and plan artifacts.

| Attribute | Detail |
|---|---|
| **Role** | QA Test Analyst |
| **Inputs** | `spec.md`, `plan.md`, `tasks.md`, wiki |
| **Outputs** | `specs/<feature>/testcases.md` — manual testcases with pre-conditions, test data, steps, expected results |

**Constraints:** Produces human-readable, testable manual cases. Maps to automation TC IDs where possible. Does not write test code.

---

### `vnr-arch-reviewer` — Software Architect Reviewer

> Reviews code changes for architecture compliance.

| Attribute | Detail |
|---|---|
| **Role** | Software Architect Reviewer |
| **Inputs** | Git diff scope, architecture standards (backend/frontend), specs/contracts, changed files |
| **Outputs** | Markdown architecture review with verdict **PASS** / **PASS+WARN** / **FAIL** and a findings table (file:line, violation, suggested fix) |

**Constraints:** Read-only — does not modify code. Critical findings result in FAIL verdict.

---

### `vnr-sec-reviewer` — Security Reviewer

> Reviews code changes for security vulnerabilities.

| Attribute | Detail |
|---|---|
| **Role** | Security Reviewer |
| **Inputs** | Git diff scope, security standards, `security-hooks.json` scan patterns, changed files |
| **Outputs** | Markdown security review with verdict **PASS** / **PASS+WARN** / **FAIL**, findings mapped to OWASP categories |

**Constraints:** Read-only. FAIL verdict should stop the pipeline. Follows scanning patterns from hooks.

---

### `vnr-tech-writer` — Technical Writer

> Produces the final report and end-user guide from pipeline artifacts.

| Attribute | Detail |
|---|---|
| **Role** | Technical Writer |
| **Inputs** | Architecture + security findings, unit & E2E results, screenshots, spec/plan, wiki context |
| **Outputs** | `specs/<feature>/result/final-report.md`, `specs/<feature>/result/user-guide.md` |

**Constraints:** Bases outputs on factual artifacts only (no speculation). Prefers Vietnamese for end-user language. Only references existing files/screenshots.

---

## Output Structure

Every feature produces artifacts under a consistent directory layout:

```
specs/
 └── <feature-folder>/
      ├── spec.md               # business scope — source of truth
      ├── research.md           # background & analysis (optional)
      ├── data-model.md         # data dependencies (read-only for most agents)
      ├── plan.md               # implementation plan (vnr-planner output)
      ├── tasks.md              # task breakdown (vnr-task-breaker output)
      ├── test-scenarios.md     # QC scenarios (vnr-qc-generator output)
      ├── testcases.md          # manual testcases (vnr-testcase-writer output)
      ├── checklists/           # spec quality checklists
      ├── contracts/
      │    └── api-commitments.md
      └── result/
           ├── final-report.md  # pipeline summary (vnr-tech-writer output)
           └── user-guide.md    # end-user documentation

src/
 ├── backend/                   # backend implementation (vnr-developer output)
 └── frontend/
      └── e2e/
           └── <feature>.e2e.spec.ts   # E2E tests (vnr-test-engineer output)
```

---

## MCP Servers

The plugin connects to two internal SSE (Server-Sent Events) MCP servers configured in `.mcp.json`.

| Server | Type | URL | Purpose |
|---|---|---|---|
| `tfs` | SSE | `http://172.21.55.10:8000/sse` | TFS integration (work items, changesets) |
| `amis-task` | SSE | `http://172.21.55.10:8001/sse` | AMIS task management integration |

### Configuration

```json
{
  "mcpServers": {
    "tfs": {
      "type": "sse",
      "url": "http://172.21.55.10:8000/sse"
    },
    "amis-task": {
      "type": "sse",
      "url": "http://172.21.55.10:8001/sse",
      "env": {
        "AMIS_USER_ID": "your_user_id_here"
      }
    }
  }
}
```

**Setup steps:**
1. Ensure the host machine has network access to `172.21.55.10` (internal network).
2. Replace `"your_user_id_here"` with your actual AMIS user ID.
3. If endpoint URLs change, update `.mcp.json` accordingly.
4. MCP servers are **optional** — core skills work without them, but features that push to TFS or AMIS task boards require the connections.

---

## Installation

1. **Copy the plugin** into the harness plugins directory (or whichever path your harness scans for plugins).

2. **Review permissions** — `settings.json` sets `defaultPermissionMode: "acceptEdits"`. Adjust to match your team's policy.

3. **Configure MCP endpoints** (optional) — update `.mcp.json` with the correct URLs and set `AMIS_USER_ID`.

4. **Restart the harness** so it picks up the new plugin from `.claude-plugin/plugin.json`.

5. **Verify** by running `/vnr-wiki` — it should navigate the docs/wiki/ and return context.

---

## Templates

The `templates/` directory provides canonical templates used by agents and skills:

| Template | Purpose |
|---|---|
| `spec-template.md` | Feature specification structure |
| `plan-template.md` | Implementation plan structure |
| `tasks-template.md` | Task breakdown format |
| `checklist-template.md` | Requirements quality checklist |
| `constitution-template.md` | Project constitution/governance |
| `agent-file-template.md` | Agent definition template |

---

## Configuration Files

| File | Purpose |
|---|---|
| `.claude-plugin/plugin.json` | Plugin metadata (name, version, description, author) |
| `settings.json` | Harness default permission mode |
| `.mcp.json` | MCP / SSE server endpoint definitions |
| `extensions.yml` | Plugin extension definitions |
| `integration.json` | External integration configuration |
| `init-options.json` | Plugin initialization options |
| `hooks/security-hooks.json` | Security scanning patterns for `vnr-sec-reviewer` |

---

## Plugin Metadata

| Field | Value |
|---|---|
| Name | `vnr-plugin` |
| Version | `1.0.0` |
| Author | VNR Team |
| Runtime | Claude Code / agent harness (content-driven) |
| Description | A plugin to help with VNR requirements |

---

## How Workflows Work

Each skill follows the same harness-enforced pattern:

```
SKILL.md  →  workflow.md  →  steps/step-01.md … step-N.md
```

- **One step at a time**: the harness loads and executes each step file individually.
- **Specialized agents**: each step delegates to a named agent (e.g., `vnr-planner`, `vnr-developer`) that has a defined I/O contract.
- **Human checkpoints**: the automated pipeline pauses at defined gates for human review before proceeding.
- **Templates**: all output artifacts are rendered using the canonical templates in `templates/`.
