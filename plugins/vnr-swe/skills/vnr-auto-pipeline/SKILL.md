---
name: "vnr-auto-pipeline"
description: "Orchestrator: loads workflow.yml and drives phases via TaskCreate/TaskUpdate + Skill/Agent dispatch."
argument-hint: "<feature> [--from=<phase-id>]"
user-invocable: true
disable-model-invocation: true
---

## Input

```
$ARGUMENTS
```

Parse: `FEATURE` (required — folder name under `specs/`, e.g. `ATT-E01-F03-U01`) and `--from=<phase-id>` (optional, default = first phase).

Resolve `PLUGIN_DIR` = `${CLAUDE_PLUGIN_ROOT}` (the installed plugin root).

**Variable substitution**: every `{feature}` placeholder in workflow.yml values (`hitl_preview_file`, `inline_prompt`, `on_reject.recovery`, `commands`) must be replaced with the actual `$FEATURE` value before use.

---

## Orchestrator Protocol

> You are a **pure orchestrator**. You do NOT execute any phase logic yourself.
> You only: read workflow.yml → manage tasks → dispatch Skill/Agent tools → handle gates.

### Step 1 — Read workflow definition

Read `$PLUGIN_DIR/skills/vnr-auto-pipeline/workflow.yml` to get all phases.

### Step 2 — Validate prerequisites (skip if `--from` supplied)

- `specs/$FEATURE/spec.md` must exist. If missing → stop with: `Missing: specs/$FEATURE/spec.md`
- Detect repo structure: read `docs/wiki/index.md` → entries tagged `architecture` or `recipe`; fallback: scan `src/` for known project markers (`.sln`, `*.csproj` for BE; `angular.json`/`package.json` for FE; `pubspec.yaml` for Mobile). Do NOT default to hardcoded paths like `src/backend/` or `src/frontend/`.
  - For each repo directory discovered: verify branch is `feature/$FEATURE`, create if missing
- **Resume via the durable ledger (preferred):** call `TaskList()`; if prior `[$FEATURE]` phase tasks exist, `TaskGet` them and read each `description` for a `VERDICT: pass|fail` marker. The first phase that is not `completed`/`VERDICT: pass` is the resume point. (Task state survives compaction; `description` markers are readable — `metadata` is not.)
  - Present that as the recommended option in an `AskUserQuestion`: "Interrupted run detected — resume from `<phase>`?" with options `resume <phase> (recommended)` / `testcases` / `plan (re-run)` / `implement`.
- **Fallback (no prior tasks):** if `specs/$FEATURE/plan.md` AND `specs/$FEATURE/tasks.md` both exist →
  `AskUserQuestion`: "Artifacts found. Resume from which phase?" options: `testcases (recommended)` / `plan (re-run planning)` / `implement`.

### Step 3 — Create task panel

Call `TaskCreate` for **every phase** in workflow.yml (in order, all at once).
Subject: `[$FEATURE] <phase.name>` | Description: `Pipeline phase: <phase.id>`

### Step 4 — Phase loop

For each phase in workflow.yml order:

**a) Skip if before FROM_PHASE:**
`TaskUpdate: completed` (status = completed)

**b) Mark in progress:**
`TaskUpdate: in_progress`

**c) Dispatch by `phase.type`:**

| type | Action |
|------|--------|
| `skill` | `Skill { skill: "<phase.skill>", args: "" }` |
| `agent` | **If `phase.inline_prompt` exists** → `Agent { subagent_type: "general-purpose", prompt: phase.inline_prompt (with {feature} substituted) }` **Else** → `Agent { subagent_type: "general-purpose", prompt: "Read agent file: $PLUGIN_DIR/agents/<phase.agent>.md\nFEATURE: $FEATURE\nPLUGIN_DIR: $PLUGIN_DIR\nSPECS_DIR: specs/$FEATURE" }` |
| `parallel` | Dispatch ALL `phase.sub_agents` as separate Agent calls **in one message simultaneously** using the same agent prompt pattern as above |
| `cli` | `Bash` each command in `phase.commands[]` (with {feature} substituted) |

**d) HITL gate (`phase.hitl: true`):**

After agent completes:
1. Read `specs/$FEATURE/plan.md` content.
2. **Conditional stack-confirm gate (auto-skips):** parse the plan's `## Stack & Constraints`. **Only if it resolved >1 UI stack** (genuinely ambiguous routing), first call a single-select `AskUserQuestion`: "This feature touched multiple UI stacks — confirm the stack for the work" with one option per resolved stack and the matching constraint card in that option's `preview`. Write the confirmed stack back into the plan's `## Stack & Constraints`. **Skip entirely** if 0–1 stacks, or if no manifest. (This is the pre-code checkpoint against wrong-component generation.)
3. Call the main review `AskUserQuestion`:
   - `question`: `phase.hitl_question` (with the reviewer's Critical/Warning counts interpolated).
   - Options from `phase.hitl_options[]`.
   - `approve` option `preview`: the `plan.md` content (markdown).
   - `reject` option `preview`: the reviewer findings from `specs/$FEATURE/result/plan-review.md` (so the user sees *why* to reject, side-by-side). Falls back to the agent's returned verdict text if the file is absent.
4. Branch on answer:
   - `approve` → continue to next phase
   - `modify` → display: "Edit `specs/$FEATURE/plan.md` then return." Ask second `AskUserQuestion` with options: `approve` / `reject — restart from --from=plan`
     - `approve` → continue to next phase (no re-review; manual edit = user responsibility)
     - `reject` → stop: `Pipeline stopped. Re-run: /vnr-auto-pipeline $FEATURE --from=plan`
   - `reject` → stop: `Pipeline stopped. Re-run: /vnr-auto-pipeline $FEATURE <phase.on_reject.recovery>`

**e) Gate check (`phase.gate`):**

- `gate: build` → if output signals failure (contains keywords like `error`, `FAILED`, `Build failed`, exit code non-zero, or any fatal compilation/type error pattern) → stop with recovery command
- `gate: review` → if output contains `⛔ FAIL` → stop with recovery command
- `always_pass: true` → never stop regardless of output

**Persist the verdict to the durable ledger** (compaction-proof resume signal): after evaluating the gate, `TaskUpdate` this phase's task to **append a marker to its `description`** — `… | VERDICT: pass` or `… | VERDICT: fail | RECOVERY: --from=<phase-id>`.
> Note: the task `metadata` field is **write-only/opaque** (not returned by `TaskGet`) — use the `description` field for any verdict you intend to read back. The stdout-grep above stays the primary pass/fail mechanism; the description marker is additive durability for resume.

**f) Mark completed:**
`TaskUpdate: completed`

### Step 5 — Final summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PIPELINE COMPLETE ✅  [$FEATURE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Artifacts:
  specs/$FEATURE/plan.md
  specs/$FEATURE/tasks.md
  specs/$FEATURE/testcases.md
  specs/$FEATURE/result/final-report.md
  specs/$FEATURE/result/user-guide.md
  [E2E stub: path reported by e2e-stubs phase]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Recovery Reference

Run `/vnr-auto-pipeline $FEATURE --from=<phase-id>` to resume from any phase.
Phase IDs: `plan` | `plan-review` | `tasks` | `testcases` | `implement` | `code-review` | `arch-sec-review` | `e2e-stubs` | `report`
