# vnr-swe — Spec-Driven Development Framework for Claude Code

## What This Is

An internal Claude Code plugin that enforces **Spec-Driven Development (SDD)** across our engineering org. Built on [github/speckit](https://github.com/speckit) principles.

**Final purpose:** Standardize and accelerate feature delivery while enforcing quality gates — from BA spec to production-ready code with full traceability (spec <-> code <-> test).

## Core Concept

Every feature follows one truth: **no code without a spec, no merge without passing gates.**

```
BA User Story → Plan → Plan Review → Tasks → Testcases → Implement → Arch + Sec Review → Report
```

Developers can either:
- **Run individual skills** (`/vnr-plan`, `/vnr-implement`, etc.) for a specific phase
- **Run the full pipeline** (`/vnr-auto-pipeline <US-ID>`) for end-to-end automation with HITL checkpoints

## Architecture

```
plugins/vnr-swe/
├── skills/          # Workflow orchestration (one skill per phase)
├── agents/          # Specialized AI agents (planner, developer, reviewer, etc.)
├── standards/       # Architecture rules (01–06 numbered flat files)
├── templates/       # Canonical output templates
├── memory/          # constitution.md — project governance rules
└── hooks/           # Pre-flight checks, security scan patterns
```

## Skill Registry

| Skill | Phase | Purpose |
|-------|-------|---------|
| `vnr-specify` | Spec | Stub a User Story when BA hasn't delivered one |
| `vnr-clarify` | Spec | Resolve underspecified areas (up to 5 questions) |
| `vnr-plan` | Plan | Produce plan.md, data-model.md, contracts/ |
| `vnr-tasks` | Plan | Break plan into dependency-aware tasks.md |
| `vnr-implement` | Build | Execute tasks — auto-dispatches to BE/FE/Mobile agents |
| `vnr-qc-assistant` | QC | Apply QC feedback or audit testcases |
| `vnr-run-testcases` | QC | Track and update manual testcase statuses |
| `vnr-run-e2e` | QC | Run Playwright E2E tests |
| `vnr-auto-pipeline` | All | Full automated pipeline with HITL checkpoints |
| `vnr-wiki` | Context | Load domain/business context from docs/wiki/ |
| `vnr-customize` | Meta | Override skills/agents at project scope |

## Agent Team

| Agent | Role | Scope |
|-------|------|-------|
| `vnr-planner` | Software Architect | Plan + data model + API contracts |
| `vnr-plan-reviewer` | Plan Quality Reviewer | 18-check review → PASS/WARN/FAIL |
| `vnr-task-breaker` | Tech Lead | Ordered, file-path-specific task breakdown |
| `vnr-backend-developer` | Backend Dev | .NET Framework 4.6.2, Database-First, EF6, SP (`src/backend/`) |
| `vnr-frontend-developer` | Frontend Dev | Angular 15, Micro-frontend, vnr-module (`src/frontend/`) |
| `vnr-mobile-developer` | Mobile Dev | Flutter, GetX (`src/app-mobile/`) |
| `vnr-testcase-writer` | QA Analyst | Manual testcases from spec/plan |
| `vnr-qc-generator` | QC Engineer | Gherkin scenarios + Playwright stubs |
| `vnr-test-engineer` | Test Engineer | Unit tests + E2E implementation |
| `vnr-arch-reviewer` | Arch Reviewer | Clean Arch compliance → PASS/WARN/FAIL |
| `vnr-sec-reviewer` | Security Reviewer | OWASP checklist → PASS/WARN/FAIL |
| `vnr-tech-writer` | Tech Writer | final-report.md + user-guide.md |

## Quality Gates (Mandatory)

| Transition | Condition |
|------------|-----------|
| Spec → Plan | BA User Story file exists in `specs/<US-ID>/` |
| Plan → Tasks | plan.md approved by human (after plan-reviewer findings) |
| Tasks → Implement | tasks.md approved |
| Implement → Review | Build passes (0 errors) |
| Review → Merge | Arch PASS + Security PASS + Code review approved |

## Critical Rules

1. **Spec-first**: No implementation without a spec file in `specs/<US-ID>/`
2. **Architecture compliance**: All code must pass arch-review (Clean Arch, CQRS, naming) + sec-review
3. **Full traceability**: Every task traces back to an AC/BR in the User Story
4. **Boundary enforcement**: Agents only touch their designated scope (BE/FE/Mobile)
5. **AI executes, Human decides**: Agents automate tasks; humans approve at HITL checkpoints

## Output Structure

```
specs/<US-ID>/
├── <US-ID>_<slug>.md            # BA User Story (source of truth, read-only for SWE)
├── plan.md                      # Implementation plan
├── data-model.md                # Entity definitions
├── tasks.md                     # Ordered task breakdown
├── testcases.md                 # Manual testcases
├── contracts/api-commitments.md # API contracts
└── result/
    ├── final-report.md          # Pipeline summary + sign-off
    └── user-guide.md            # End-user documentation (Vietnamese)
```

## Tech Stack

- **Backend**: .NET Framework 4.6.2 — Database-First, EF6, Stored Procedures, Controller pattern
- **Frontend**: Angular 15 — Micro-frontend (Module Federation), vnr-module design system, NgRx
- **Mobile**: Flutter/Dart — Clean Architecture + GetX
- **Monorepo**: `src/backend/` and `src/frontend/` are separate git repos

## Development Notes

- Plugin is **content-driven** (markdown-based, no compiled code)
- Each skill follows: `SKILL.md → workflow.md → steps/step-01..N.md`
- Constitution (`memory/constitution.md`) is the governance root — all agents must comply
- Standards in `standards/` are **flat numbered files** (01 through 06) covering tech stack, architecture, data/auth, BE framework, FE framework, and team conventions
- Templates in `templates/` ensure consistent output format across all agents
