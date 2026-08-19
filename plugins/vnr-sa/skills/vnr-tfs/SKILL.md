---
name: "vnr-tfs"
description: "Create/inspect/sync VNR TFS PBIs and Tasks from concise prompts using config + templates. Preview before write."
argument-hint: "pbi | tasks <pbi-id> | task <pbi-id> | inspect <pbi-id> | sync <pbi-id> | config"
user-invocable: true
---

$ARGUMENTS

# VNR TFS Skill

Use this skill for TFS Product Backlog Item + Task work.

## Load first

Read from this skill folder:
- `config.yml`
- templates listed in `config.yml`

If required config/template is missing, stop and report the path.

## Modes

- `pbi` — draft PBI from user brief; preview; create only after confirmation.
- `tasks <pbi-id>` — fetch PBI; draft task breakdown; preview; create/link/sync only after confirmation.
- `task <pbi-id>` — draft one task; preview; create/link/sync only after confirmation.
- `inspect <pbi-id>` — read-only PBI + child tasks + estimate drift.
- `sync <pbi-id>` — recompute PBI effort from child tasks; preview diff; update only after confirmation.
- `config` — read-only effective config/template check.

If no mode is supplied, ask which mode. Reject work item types other than PBI and Task.

## Hard rules

- Always preview before any TFS create/update/link.
- Never create Task without `Customize.VNR.Component` and estimate.
- Initial Task estimates must be equal:
  - `Microsoft.VSTS.Scheduling.OriginalEstimate`
  - `Microsoft.VSTS.Scheduling.RemainingWork`
  - `Customize.VNR.OriginalEstimate`
- PBI effort must be derived from Story Point:
  - `Microsoft.VSTS.Scheduling.Effort = Customize.VNR.StoryPoint * 7`
- Child Task estimate sum should match PBI effort:
  - `sum(tasks.OriginalEstimate) = PBI Effort`
- Link Task to parent PBI from child side:
  - `System.LinkTypes.Hierarchy-Reverse`
- Inherit Task iteration from parent unless user overrides.
- Assign to config default user unless user overrides.

## TFS tool mapping

Use these MCP tools:
- create: `mcp__tfs__create_work_item`
- update: `mcp__tfs__update_work_item`
- get: `mcp__tfs__get_work_item`
- list: `mcp__tfs__list_work_items`
- link: `mcp__tfs__manage_work_item_link`

For child tasks, create first, then link:
```text
work_item_id = task id
target_work_item_id = parent pbi id
link_type = System.LinkTypes.Hierarchy-Reverse
operation = add
```

## Preview format

Keep preview concise:

```text
PBI
- title:
- effort:
- story point:
- iteration:

Tasks
| title | component | estimate |
|---|---|---|

Actions
- create:
- update:
- link:
- sync:

Confirm? yes/no
```

## Template rules

Render rich TFS fields from HTML templates only. Escape user text.
Write content in Vietnamese. Field names come from `config.yml`.

- List placeholders take `<li>` items only — the template supplies the `<ul>`.
- `purpose` / `performance` are prose, not bullets.
- `constraints` — phrased as "Không …".
- `pbiReview` — fixed boilerplate, insert verbatim.
- `verification` — an observable pass condition, not "đã xong".
- Drop the `Phụ thuộc:` / `Nguồn:` line when there is nothing to put there.
- Task title starts with a bracket tag: `[Deploy]`, `[AI]`, `[KB Prep]` …
