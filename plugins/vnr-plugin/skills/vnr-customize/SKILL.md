---
name: "vnr-customize"
description: "Customize or create new skills/agents by overriding plugin defaults into project scope (.claude folder)."
argument-hint: "<action> <type> [name]  (e.g., 'override skill vnr-plan', 'new agent vnr-reviewer')"
compatibility: "Requires vnr-plugin installed in the project"
metadata:
  author: "vnr-plugins"
  source: "skills/vnr-customize"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

---

## Constants

```
PLUGIN_DIR          = <repo-root>/vnr-plugin  (resolve by searching upward for the vnr-plugin/ directory)
PLUGIN_SKILLS_DIR   = $PLUGIN_DIR/skills
PLUGIN_AGENTS_DIR   = $PLUGIN_DIR/agents
PROJECT_SKILLS_DIR   = .claude/skills
PROJECT_AGENTS_DIR   = .claude/agents
PLUGIN_SCRIPTS_DIR  = $PLUGIN_DIR/scripts

PROTECTED_SKILLS = ["vnr-wiki", "vnr-wiki-sync"]

KNOWN_SKILLS = [
  "vnr-analyze", "vnr-auto-pipeline", "vnr-checklist", "vnr-clarify",
  "vnr-constitution", "vnr-context-retrieval", "vnr-customize",
  "vnr-implement", "vnr-plan", "vnr-run-e2e", "vnr-run-testcases",
  "vnr-specify", "vnr-tasks", "vnr-wiki", "vnr-wiki-sync"
]

KNOWN_AGENTS = [
  "vnr-arch-reviewer", "vnr-developer", "vnr-planner",
  "vnr-qc-generator", "vnr-sec-reviewer", "vnr-task-breaker",
  "vnr-tech-writer", "vnr-test-engineer", "vnr-testcase-writer"
]
```

---

## Phase 1 — Parse & Validate Input

Parse `$ARGUMENTS` to extract three components:

| Component | Values | Default |
|-----------|--------|---------|
| **action** | `new` or `override` | _(ask if missing)_ |
| **type** | `skill` or `agent` | _(ask if missing)_ |
| **name** | Name with or without `vnr-` prefix | _(ask if missing)_ |

**Parsing rules:**
- Accept flexible ordering: `override skill vnr-plan`, `skill override vnr-plan`, `vnr-plan override skill`
- Normalize the name: ensure it has the `vnr-` prefix (e.g., `plan` → `vnr-plan`)
- Accept synonyms: `update`/`edit`/`modify` → `override`; `create`/`add` → `new`

**If any component is missing, enter interactive mode:**

1. If **action** is missing:
   ```
   What would you like to do?
   [1] Override an existing skill/agent (customize plugin defaults)
   [2] Create a new skill/agent
   ```

2. If **type** is missing:
   ```
   What type do you want to customize?
   [1] Skill (slash command — e.g., /vnr-plan, /vnr-tasks)
   [2] Agent (system prompt — e.g., vnr-planner, vnr-developer)
   ```

3. If **name** is missing for **override**, list available items:

   For skills, list KNOWN_SKILLS (excluding PROTECTED_SKILLS) in a table:
   ```
   Available skills to override:

   | # | Skill | Description |
   |---|-------|-------------|
   | 1 | vnr-plan | Implementation planning |
   | 2 | vnr-tasks | Task breakdown from plan |
   | ... | ... | ... |

   Which skill? (enter number or name)
   ```

   For agents, list KNOWN_AGENTS in a table with role info.

4. If **name** is missing for **new**, ask:
   ```
   Enter the name for the new <type> (will be prefixed with vnr- if needed):
   ```

---

## Phase 2 — Validation

Perform these checks in order. Stop on the first failure.

### 2.1 Protected check

If `name` is in PROTECTED_SKILLS (`vnr-wiki` or `vnr-wiki-sync`):

```
⛔ Cannot customize "${name}".

vnr-wiki and vnr-wiki-sync are protected system skills that manage the wiki
knowledge base. Customizing them could break the wiki synchronization pipeline
used by all agents.

If you need to change wiki behavior, consider:
- Updating docs/wiki/ content directly
- Creating a new supplementary skill instead
```

**Stop execution.**

### 2.2 Source existence check (for override)

If action is `override`:

- **Skill**: Check `{PLUGIN_SKILLS_DIR}/{name}/SKILL.md` exists
- **Agent**: Check `{PLUGIN_AGENTS_DIR}/{name}.md` exists

If source not found:
```
⛔ Source not found: {path}
Available {type}s: {list}
```

### 2.3 Target conflict check (for new)

If action is `new`:

- **Skill**: Check if `{PROJECT_SKILLS_DIR}/{name}/SKILL.md` already exists
- **Agent**: Check if `{PROJECT_AGENTS_DIR}/{name}.md` already exists
- Also check if name conflicts with an existing plugin skill/agent

If target exists:
```
⚠️ A {type} named "{name}" already exists at: {path}
Do you want to override it instead? [yes] / [no]
```

If user says yes, switch action to `override`.

### 2.4 Naming convention check (for new)

- Name must start with `vnr-`
- Name must be lowercase, alphanumeric with hyphens only
- Name must not collide with KNOWN_SKILLS or KNOWN_AGENTS (unless intentional override)

---

## Phase 3 — Execute Create/Override

### 3.1 Ensure target directories exist

```bash
mkdir -p {PROJECT_SKILLS_DIR}/{name}   # for skills
mkdir -p {PROJECT_AGENTS_DIR}          # for agents
```

### 3.2 Override a Skill

1. Read the source skill: `{PLUGIN_SKILLS_DIR}/{name}/SKILL.md`
2. Create the directory `{PROJECT_SKILLS_DIR}/{name}/`
3. Create the project-scope skill file at: `{PROJECT_SKILLS_DIR}/{name}/SKILL.md`
4. Transform the content:
   - **Keep** the YAML frontmatter block (`---` ... `---`) intact — project-scope skills require proper frontmatter
   - **Add** a `customization` field inside the frontmatter to track the override origin:
     ```yaml
     ---
     name: "{name}"
     description: "{original description}"
     # ... (keep all original frontmatter fields)
     customization:
       source: "vnr-plugin/skills/{name}/SKILL.md"
       type: "skill-override"
       created: "{YYYY-MM-DD}"
     ---
     ```
   - Keep the rest of the content intact
5. Report:
   ```
   ✅ Skill override created: {PROJECT_SKILLS_DIR}/{name}/SKILL.md
   Source: {PLUGIN_SKILLS_DIR}/{name}/SKILL.md

   This project-scope skill will take precedence over the plugin skill.
   You can now edit the file to customize its behavior.
   ```

### 3.3 Override an Agent

1. Read the source agent: `{PLUGIN_AGENTS_DIR}/{name}.md`
2. Create the project-scope agent file at: `{PROJECT_AGENTS_DIR}/{name}.md`
3. Transform the content:
   - **Keep** the YAML frontmatter (`---` ... `---`) intact
   - **Add** a `customization` field inside the frontmatter to track the override origin:
     ```yaml
     ---
     name: "{name}"
     role: "{original role}"
     # ... (keep all original frontmatter fields)
     customization:
       source: "vnr-plugin/agents/{name}.md"
       type: "agent-override"
       created: "{YYYY-MM-DD}"
     ---
     ```
   - Keep the rest of the content intact
4. Report:
   ```
   ✅ Agent override created: {PROJECT_AGENTS_DIR}/{name}.md
   Source: {PLUGIN_AGENTS_DIR}/{name}.md

   ⚠️ IMPORTANT: Skills that reference this agent still read from the PLUGIN path
   (vnr-plugin/agents/{name}.md). You need to also override the skills that use
   this agent and update the agent path to: .claude/agents/{name}.md
   ```

### 3.4 Create a New Skill

1. Create the directory `{PROJECT_SKILLS_DIR}/{name}/`
2. Generate a new skill file at `{PROJECT_SKILLS_DIR}/{name}/SKILL.md` using this template:

   ```markdown
   ---
   name: "{name}"
   description: "{ask user for a one-line description}"
   argument-hint: "{ask user for argument hint, or leave empty}"
   user-invocable: true
   customization:
     source: "new"
     type: "custom-skill"
     created: "{YYYY-MM-DD}"
   ---

   ## User Input

   ```text
   $ARGUMENTS
   ```

   You **MUST** consider the user input before proceeding (if not empty).

   ## Outline

   <!-- Define your skill's execution steps here -->

   1. **Setup**: Describe prerequisites and context loading
   2. **Execute**: Describe the main workflow
   3. **Report**: Describe output and next steps

   ## Rules

   - Follow the constitution: `$PLUGIN_DIR/memory/constitution.md`
   - Follow project standards: `$PLUGIN_DIR/standards/`
   ```

3. Ask the user:
   ```
   New skill created at: {PROJECT_SKILLS_DIR}/{name}/SKILL.md

   Would you like me to help you fill in the skill content now?
   Describe what this skill should do and I'll draft the implementation.
   ```

### 3.5 Create a New Agent

1. Generate a new agent file at `{PROJECT_AGENTS_DIR}/{name}.md` using this template:

   ```markdown
   ---
   name: "{name}"
   role: "{ask user for role title}"
   description: "{ask user for a one-line description}"
   customization:
     source: "new"
     type: "custom-agent"
     created: "{YYYY-MM-DD}"
   ---

   # {Role Title}

   ## Vai tro

   <!-- Define the agent's role and expertise here -->

   ## Ngu canh bat buoc phai doc truoc

   <!-- List files the agent must read before executing -->
   - `$PLUGIN_DIR/memory/constitution.md`
   - `$PLUGIN_DIR/standards/backend/` (if backend-related)
   - `$PLUGIN_DIR/standards/frontend/` (if frontend-related)

   ## Quy trinh thuc hien

   <!-- Define the agent's step-by-step execution workflow -->

   1. **Doc context**: Read required files
   2. **Thuc hien**: Main execution steps
   3. **Bao cao**: Report results
   ```

2. Ask the user:
   ```
   New agent created at: {PROJECT_AGENTS_DIR}/{name}.md

   Would you like me to help you define the agent's role and workflow?
   Describe what this agent should do and I'll draft the system prompt.
   ```

---

## Phase 4 — Dependency Scan

**This phase is MANDATORY after every create/override operation.**

Scan ALL files in the vnr-plugin directory (skills, agents, scripts) for references to the customized item. Only scan the vnr-plugin directory — do not scan user project files.

### 4.1 Build search patterns

For the target `{name}`, build these search patterns:

| Pattern Type | Examples |
|-------------|----------|
| Exact name | `vnr-plan` |
| Slash command | `/vnr-plan`, `/vnr-plan` |
| Skill tool ref | `skill: "vnr-plan"`, `skill: 'vnr-plan'` |
| Agent file path | `$PLUGIN_DIR/agents/vnr-planner.md` |
| Agent tag | `<agent_to_use>.*vnr-planner.*</agent_to_use>` |
| Script reference | `vnr-plan`, `plan.md`, `tasks.md` (for output artifacts) |

### 4.2 Scan files

Search these locations for any of the patterns above:

1. **All SKILL.md files**: `{PLUGIN_SKILLS_DIR}/*/SKILL.md`
2. **All agent files**: `{PLUGIN_AGENTS_DIR}/*.md`
3. **All script files**: `{PLUGIN_SCRIPTS_DIR}/**/*`
4. **Extensions config**: `$PLUGIN_DIR/extensions.yml` (if exists)

For each match, record:
- File path
- Line number(s)
- Match context (the line containing the reference)
- Reference type (skill call, agent reference, artifact dependency, etc.)

### 4.3 Classify references

Classify each reference into one of these categories:

| Category | Meaning | Action Needed |
|----------|---------|---------------|
| **DIRECT_CALL** | This skill/agent is directly invoked | Override this caller too to redirect |
| **AGENT_BINDING** | A skill binds to this agent via `<agent_to_use>` | Override the skill to point to new agent path |
| **ARTIFACT_DEPENDENCY** | References output artifacts (e.g., plan.md, tasks.md) | Ensure output format compatibility |
| **DOCUMENTATION_REF** | Mentioned in comments, tables, or docs | No action needed (informational) |
| **SCRIPT_REF** | Referenced in a script file | Manual review recommended |

### 4.4 Build dependency report

Group findings by the referencing file and present as a structured report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DEPENDENCY SCAN RESULTS for: {name} ({type})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  {N} references found across {M} files in vnr-plugin

┌─────────────────────────────────────────────────
│ DIRECT_CALL references
├─────────────────────────────────────────────────
│ 📄 vnr-plugin/skills/vnr-auto-pipeline/SKILL.md
│    Line 119:  skill: "vnr-plan"
│    Line 134:  skill: "vnr-tasks"
│    → These skills are called by vnr-auto-pipeline.
│      If you changed the behavior/output format,
│      vnr-auto-pipeline may need updating too.
│
│ 📄 vnr-plugin/skills/vnr-implement/SKILL.md
│    Line 23:  <agent_to_use>vnr-developer agent</agent_to_use>
│    → This skill binds to the vnr-developer agent.
│      Override this skill to use your custom agent path.
├─────────────────────────────────────────────────
│ ARTIFACT_DEPENDENCY references
├─────────────────────────────────────────────────
│ 📄 vnr-plugin/scripts/powershell/check-prerequisites.ps1
│    Line 98:  "Run /vnr-plan first to create the implementation plan."
│    → Script checks for plan.md output.
│      Ensure your customized skill still produces plan.md.
└─────────────────────────────────────────────────
```

---

## Phase 5 — Suggestions & Follow-up

Based on the dependency scan results, generate actionable suggestions.

### 5.1 Required follow-up actions

For each **DIRECT_CALL** or **AGENT_BINDING** reference, suggest an override:

```
📋 SUGGESTED FOLLOW-UP ACTIONS

Based on the dependency scan, these related items may need customization:

| # | Action | Item | Reason |
|---|--------|------|--------|
| 1 | Override skill | vnr-auto-pipeline | Calls vnr-plan directly (line 119) |
| 2 | Override skill | vnr-implement | Binds to vnr-developer agent (line 23) |
| 3 | Review script | check-prerequisites.ps1 | Checks plan.md output format |
```

### 5.2 Interactive follow-up

Ask the user if they want to proceed with any suggested overrides:

```
Would you like to customize any of these related items?
Enter the number(s) to override (e.g., "1,2"), or "skip" to finish.
```

If the user selects items:
- For each selected item, **re-execute this skill** from Phase 3 with action=`override` for that item
- After each override, run Phase 4 again for the newly overridden item
- Continue until no more follow-ups are selected or user says "skip"/"done"

### 5.3 Agent path update reminder

If the original action was **override agent**, and the dependency scan found skills that bind to it:

```
⚠️ AGENT PATH UPDATE REQUIRED

The following skills reference the original agent at:
  vnr-plugin/agents/{name}.md

After overriding these skills, update the agent path to:
  .claude/agents/{name}.md

Skills to update:
- vnr-plugin/skills/{skill1}/SKILL.md → override to .claude/skills/{skill1}/SKILL.md
- vnr-plugin/skills/{skill2}/SKILL.md → override to .claude/skills/{skill2}/SKILL.md
```

---

## Phase 6 — Summary Report

After all operations complete, output a final summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VNR-CUSTOMIZE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created/Modified files:
  ✅ .claude/skills/vnr-plan/SKILL.md (skill override)
  ✅ .claude/skills/vnr-auto-pipeline/SKILL.md (skill override)
  ✅ .claude/agents/vnr-planner.md (agent override)

Dependencies scanned: {N} references across {M} files
Warnings addressed: {X} of {Y}
Skipped: {list of skipped suggestions}

Next steps:
  1. Edit the overridden files to apply your customizations
  2. Test with: /{name} (to verify the override works)
  3. Review skipped dependencies if behavior changes

Note: Project-scope skills (.claude/skills/) take precedence
over plugin skills. To revert, simply delete the override directory.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Customization Rules

These rules **MUST** be enforced during customization. They serve as guardrails to maintain compatibility with the vnr-plugin ecosystem.

### Rule 1: Constitution compliance

All customized skills/agents **MUST** still reference and comply with `$PLUGIN_DIR/memory/constitution.md`. You may add project-specific rules on top, but must not remove or weaken constitution rules.

### Rule 2: Artifact format compatibility

If a customized skill produces output artifacts (e.g., `plan.md`, `tasks.md`, `test-scenarios.md`), the output format **MUST** remain compatible with downstream consumers. Specifically:
- File names and locations must not change unless all consumers are also updated
- Required sections/fields must still be present (additional sections are fine)
- Markdown structure (headings, lists, tables) must remain parseable by scripts

### Rule 3: Standards reference

All customized skills/agents **SHOULD** still reference `$PLUGIN_DIR/standards/` for tech stack and architecture guidelines. Custom standards can be added, but base standards should not be contradicted.

### Rule 4: Wiki integration

Skills that previously read from `docs/wiki/` (via `vnr-wiki` strategy) **MUST** continue to do so. Removing wiki context breaks knowledge continuity across the pipeline.

### Rule 5: No modification of protected items

`vnr-wiki` and `vnr-wiki-sync` cannot be overridden or replaced. They are core infrastructure skills that maintain the knowledge base.

### Rule 6: Override, don't delete

Customization works by **overriding** (adding a project-scope version that takes precedence), not by modifying the plugin originals. The plugin files in `$PLUGIN_DIR/` must remain untouched to allow clean updates.

---

## Error Handling

| Error | Recovery |
|-------|----------|
| Plugin directory not found | Instruct: `npx vnr-bootstrap init` to set up the plugin |
| Source skill/agent not found | List available items and ask user to pick |
| `.claude/` directory not found | Create it automatically |
| Write permission denied | Instruct user to check file permissions |
| Dependency scan finds circular reference | Report it as a warning but do not block |
