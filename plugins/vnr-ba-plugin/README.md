# vnr-ba-plugin

> **BA Plugin** — User Story authoring, EPIC/FEAT management, and BA→Dev handoff for the VNR BA team.

A content-driven plugin for the Claude Code / agent harness that equips Business Analysts with a structured, step-by-step toolkit for producing high-quality BA artifacts — from domain research to ready-to-develop User Stories.

---

## What It Provides

| Area | What you get |
|---|---|
| **EPIC management** | Guided 6-step workflow to produce a Stakeholder-Capability Matrix and a formal EPIC document |
| **FEAT authoring** | 7-section FEAT document with an Actor-Task Matrix linking actors to their tasks |
| **User Story creation** | Single-story and batch workflows with ~95% automation and one human checkpoint (Acceptance Criteria) |
| **Research Briefs** | Domain-research workflow that produces structured Research Brief documents |
| **BA Ground Rules** | Version-controlled BA Constitution with a Sync Impact Report for every update |
| **Review & Analysis** | Dedicated skills to analyze, review, and improve existing User Stories |
| **Guidance & Help** | Built-in BA help assistant that routes users to the right skill and explains how to use the toolkit |
| **Supplementary tools** | Wireframe assistant, retrospective facilitator, PBI composer, specification helper, and more |

---

## Skills (Commands)

Each skill is triggered by a phrase in the agent harness (e.g. `/vnr-ba-write-us` or the natural-language triggers listed below).

| Skill | Trigger phrases | Purpose |
|---|---|---|
| `vnr-ba-epic` | `ba epic` | Create or update an EPIC document |
| `vnr-ba-feat` | `ba feat` | Create or update a FEAT document and Actor-Task Matrix |
| `vnr-ba-us` | `ba us` | Create a single User Story from an Actor-Task entry |
| `vnr-ba-write-us` | `write us`, `write us from analyze`, `write us from wireframe`, `update us` | Fully automated 15-step User Story authoring workflow |
| `vnr-ba-researcher` | `ba research`, `ba researcher` | Run domain research and produce a Research Brief |
| `vnr-ba-constitution` | `ba constitution` | View or update the BA Ground Rules / Constitution |
| `vnr-ba-analyze-us` | `analyze us`, `ba analyze` | Analyze an existing User Story for gaps or issues |
| `vnr-ba-review-us` | `review us`, `ba review` | Peer-review a User Story against BA standards |
| `vnr-ba-wireframe` | `ba wireframe` | Generate or refine UI wireframe descriptions |
| `vnr-ba-pbi-compose` | `ba pbi`, `pbi compose` | Compose a Product Backlog Item from existing artifacts |
| `vnr-ba-specify` | `ba specify` | Produce detailed specifications for a feature |
| `vnr-ba-clarify` | `ba clarify` | Clarify ambiguous requirements interactively |
| `vnr-ba-design` | `ba design` | Draft a high-level design note or proposal |
| `vnr-ba-retrospective` | `ba retro` | Facilitate a BA retrospective |
| `vnr-ba-help` | `ba help`, `help me` | Interactive guide to all toolkit skills |

---

## User Story Artifact Structure

The `vnr-ba-write-us` workflow (15 steps, one BA checkpoint) produces a complete User Story document containing:

- **Metadata** — ID, title, FEAT link, priority, effort estimate
- **Business Context** — goal, actors, pre-/post-conditions
- **Acceptance Criteria** — human-reviewed, structured scenarios *(the single BA approval checkpoint)*
- **Business Rules** — numbered rules referenced from ACs
- **Data Dictionary** — field definitions, types, and constraints
- **Validation Messages** — user-facing error and success messages
- **Activity Diagram** — Mermaid flowchart of the happy path and alternates
- **UI/UX Description** — screen-by-screen interaction notes
- **Tracking & Events** — analytics events tied to user actions
- **Traceability Matrix** — maps ACs → Business Rules → Data fields

---

## Output Paths

Artifacts are written to the workspace under these conventions:

| Artifact | Default path |
|---|---|
| User Stories | `spec-kit/specs/<feature>/` |
| FEAT documents | `specs/<feature>/spec.md` |
| EPIC documents | `specs/<epic>/` |
| Research Briefs | `specs/<feature>/research.md` |
| Data models | `specs/<feature>/data-model.md` |
| Plans & tasks | `specs/<feature>/plan.md`, `tasks.md` |

> Paths can be adjusted by modifying the agent configuration files in `agents/`.

---

## Installation

1. **Copy the plugin** into the harness plugins directory (or whichever path your harness scans for plugins).

2. **Merge permissions** — `settings.json` at the plugin root declares the required harness permission set. Merge or review these into your global harness settings.

3. **Configure MCP endpoints** (optional) — `.mcp.json` defines two SSE server connections:
   - `tfs` — internal TFS integration (`http://172.21.55.10:8000/sse`)
   - `amis-task` — task management integration (`http://172.21.55.10:8001/sse`)

   Update the URLs and set the `AMIS_USER_ID` environment variable if you use these integrations.

4. **Restart the harness** so it picks up the new plugin from `.claude-plugin/plugin.json`.

5. **Verify** by running `ba help` — the help skill should respond with the toolkit guide.

---

## Agents

The plugin ships two agents that define the roles, responsibilities, and I/O contracts for the harness.

### `vnr-ba-agent` — Business Analyst / Spec-kit Owner

> BA Agent — spec-kit owner. Writes and maintains specs, defines business rules and acceptance criteria.

| Attribute | Detail |
|---|---|
| **Role** | Business Analyst |
| **Inputs** | `spec-kit/context/*`, `business-requirements/` |
| **Outputs** | `spec-kit/specs/*` |

**Responsibilities**
- Write and maintain all business specification documents.
- Define business rules and acceptance criteria (no code, no technical design).

**Global Rules**
- The `spec-kit/` is the **single source of truth** — all BA artifacts must live there.
- This agent must **never** produce code or technical design documents.

---

### `vnr-ba-planner` — BA Planner / Senior Delivery Planner

> Plans BA delivery based on existing specs. Manages feature directories under `/specs`.

| Attribute | Detail |
|---|---|
| **Role** | Senior Delivery Planner / Technical PM |
| **Primary output** | `/specs/<feature>/plan.md` |

**Responsibilities**
- Create delivery plans from existing spec content.
- Manage the `/specs/<feature>/` directory structure per feature.
- Coordinate with the Task Agent (which owns `tasks.md`).

**Directory Structure (mandatory awareness)**

```
/specs/
 └── <feature-folder>/
      ├── spec.md          # business scope — source of truth (read by Planner)
      ├── research.md      # background & analysis (optional)
      ├── data-model.md    # dependencies — READ-ONLY, do not modify
      ├── plan.md          # ← Planner output (delivery plan)
      ├── tasks.md         # written by Task Agent, not Planner
      ├── checklists/      # risk reference
      └── contracts/       # interface reference
```

**Constraints**
- `data-model.md` is read-only — the Planner must never modify it.
- Every feature must have exactly one subfolder under `/specs/`.
- `tasks.md` is owned by the Task Agent; the Planner only reads it.

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
3. If the endpoint URLs change, update `.mcp.json` accordingly.
4. MCP servers are **optional** — the core BA skills work without them, but features that push to TFS or AMIS task boards require the connections.

---

## Configuration Files

| File | Purpose |
|---|---|
| `.claude-plugin/plugin.json` | Plugin metadata (name, version, description, author) |
| `settings.json` | Harness permission policy for the plugin |
| `.mcp.json` | MCP / SSE server endpoint definitions |
| `agents/vnr-ba-agent.md` | BA agent role definition and I/O contract |
| `agents/vnr-ba-planner.md` | Planner agent role definition |
| `templates/us-template.md` | Canonical User Story template |

---

## Plugin Metadata

| Field | Value |
|---|---|
| Name | `vnr-ba-plugin` |
| Version | `1.0.0` |
| Author | VNR BA Team |
| Runtime | Claude Code / agent harness (content-only, no compiled code) |
| Language | Vietnamese (primary), English (technical notes) |

---

## How Workflows Work

Each skill follows the same pattern enforced by the harness:

```
SKILL.md  →  workflow.md  →  steps/step-01.md … step-N.md
```

- **One step at a time**: the harness loads and executes each step file individually.
- **Human checkpoints**: key decisions (e.g., AC approval in `vnr-ba-write-us`) require explicit BA confirmation before the workflow continues.
- **Templates**: final artifacts are rendered using Markdown templates (e.g., `templates/us-template.md`).

This design keeps BA oversight over critical quality gates while automating the mechanical parts of artifact creation.

---

## Notes

- This plugin is **documentation-only** — there is no compiled or executable source code.
- All workflow instructions and templates are written in **Vietnamese** to match the VNR BA team's working language.
- Before deploying in a shared or production harness, review and tighten the permission list in `settings.json` to only the actions your team requires.
