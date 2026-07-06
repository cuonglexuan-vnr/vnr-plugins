# Implementation Plan: [US-ID — Title]

**Branch**: `[<US-ID>]` | **Date**: [DATE] | **User Story**: [link to `<US-ID>_*.md`]
**Input**: User Story file at `/specs/<US-ID>/<US-ID>_*.md` (shape: `templates/userstory-template.md`).
Optional: `/specs/<US-ID>/<US-ID>_*_ui-detail.md` (BA-provided) or `/specs/<US-ID>/ui-detail.md` (SWE fallback).

**Note**: This template is filled in by the `/vnr-plan` command. The scope of the plan is exactly one User Story.

## Summary

[Extract from User Story: statement (Section 1), business context (Section 2), primary ACs (Section 4), and research-driven technical approach.]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Stack & Constraints

<!--
  Filled by /vnr-plan via the Wiki Loading Contract resolver:
    node "$PLUGIN_DIR/scripts/resolve-context.mjs" --phase plan --paths "<repos/globs this feature touches>"
  This makes mis-routing reviewable BEFORE code is generated (plan-reviewer checks it).
  If the resolver reports manifest:"absent", note "No manifest — fell back to index.md navigation".
-->

**Resolved UI stack(s)**: [e.g., `ng-modern-ngzorro` for FE `projects/**`, `mvc-kendo-cshtml` for legacy views — or "none / N/A"]
**Mandatory wiki pages loaded** (id list): [from resolver `mandatory` + `cards`]
**Component commitments**: [the specific custom components/controls this plan will use, per the resolved catalog — e.g. `<vnr-grid>`, `<vnr-combobox>`, `VnrInputFactory.builderTextBox()`. NEVER native `<input>/<select>/<table>`.]
**Convention commitments**: [naming, i18n key format, migration/versioning, layer rules pulled from the loaded pages]

## Project Structure

### Documentation (this feature)

```text
specs/<US-ID>/
├── <US-ID>_<slug>.md              # BA-provided User Story (input — do not edit)
├── <US-ID>_<slug>_ui-detail.md    # BA-provided UI detail (optional input)
├── plan.md                        # This file (/vnr-plan command output)
├── research.md                    # Phase 0 output (/vnr-plan command)
├── data-model.md                  # Phase 1 output — derived from US Section 6
├── quickstart.md                  # Phase 1 output (/vnr-plan command)
├── contracts/                     # Phase 1 output (/vnr-plan command)
├── ui-detail.md                   # Phase 1 output — ONLY if BA ui-detail missing and US has UI screens
└── tasks.md                       # Phase 2 output (/vnr-tasks command - NOT created by /vnr-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
