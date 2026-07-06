---
name: "vnr-arch-review"
description: >-
  Review kiến truc code (BE + FE) — dispatch vnr-arch-reviewer per scope in parallel,
  output PASS / WARN / FAIL. Standalone invocable or embedded in pipeline.
argument-hint: "<feature|file-path|glob> [--ci] [--scope=be|fe|all] [--verbose] [--fix-hints]"
compatibility: "Requires docs/wiki/index.md for repo root discovery"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

---

## Step 1 — Parse Input & Flags

Parse `$ARGUMENTS` to extract:

**Flags** (strip before processing positional):
- `--ci` — non-interactive mode: suppress banners, append machine-readable verdict line, fail-closed
- `--scope=be|fe|all` — limit review to one scope (default: `all`)
- `--verbose` — include INFO-level findings in output
- `--fix-hints` — include code snippets for suggested fixes

**Positional** (what remains after stripping flags):

| Pattern | Detection | Action |
|---------|-----------|--------|
| Contains `/` or `\` or `*` or ends with known extension | **File path or glob** | Expand via Glob → `FILES` list. Infer `FEATURE` from `specs/<id>/` ancestry in path; else `FEATURE = "bare"` |
| Alphanumeric + hyphens, NO path separators (e.g. `ATT-E01-F03-U01`) | **Feature/PBI ID** | Set `FEATURE`. Discover `FILES` from `specs/<FEATURE>/tasks.md` → extract file paths; OR `git diff --name-only main...feature/<FEATURE>` |
| Empty | **Git diff fallback** | Detect `FEATURE` from current branch name (`feature/<id>` → `<id>`); if not on feature branch → `FEATURE = "bare"`. `FILES` = `git diff --name-only` (vs merge-base of default branch) |

**Validation:**
- If `FILES` is empty after expansion → STOP: "No files to review. Provide a file path, feature ID, or ensure there are uncommitted/unpushed changes."

---

## Step 2 — Resolve PLUGIN_DIR & Output Path

Resolve `PLUGIN_DIR` = `${CLAUDE_PLUGIN_ROOT}` (the installed plugin root).

**Output path policy:**
- `FEATURE != "bare"` → `OUTPUT_PATH = specs/<FEATURE>/result/arch-review.md`
- `FEATURE == "bare"` → `OUTPUT_PATH = .claude/arch-review-<YYYYMMDD-HHmmss>.md`

---

## Step 3 — Repo Root Discovery (from wiki)

Read `docs/wiki/index.md` → find entries tagged `architecture` (under `## patterns/` heading).

Extract:
- `BE_ROOT`: backend repo directory (e.g. `src/HRM9`)
- `FE_ROOT`: frontend repo directory (e.g. `src/Vnr.Dev.HrmPortal`)
- `MOBILE_ROOT`: mobile repo directory (if exists)

**Fallback** (no wiki or no architecture entry): scan `src/` for project markers:
- `.sln` or `*.csproj` → BE_ROOT
- `angular.json` or `nx.json` → FE_ROOT
- `pubspec.yaml` → MOBILE_ROOT

---

## Step 4 — Scope Classification

Split `FILES` by repo root prefix:

```
BE_FILES  = FILES.filter(path starts with BE_ROOT + "/")
FE_FILES  = FILES.filter(path starts with FE_ROOT + "/")
```

Apply `--scope` flag:
- `--scope=be` → clear FE_FILES
- `--scope=fe` → clear BE_FILES
- `--scope=all` → keep both (default)

**Skip empty scopes** — if a scope has 0 files, do not dispatch an agent for it.

If BOTH scopes are empty after filtering → STOP: "No files match any known repo root. Check paths against wiki-declared roots: BE={BE_ROOT}, FE={FE_ROOT}."

Display scope summary:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VNR ARCH REVIEW  [Feature: <FEATURE>]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Scope:
   Backend  [{BE_ROOT}] : X files
   Frontend [{FE_ROOT}] : Y files
 Mode: <interactive | CI>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 5 — Wiki Context Resolution (per scope)

For each non-empty scope, run the Wiki Loading Contract resolver:

```bash
node "$PLUGIN_DIR/scripts/resolve-context.mjs" --phase review --paths "<comma-separated files for scope>"
```

Capture the JSON output:
- `mandatory[]` — wiki pages to read fully (architecture rules for this stack)
- `cards[]` — terse constraint cards (UI component rules, naming)
- `on_demand[]` — additional pages if specific components are touched

If resolver returns `manifest: "absent"` → note for dispatch: agent falls back to `docs/wiki/index.md` navigation (entries tagged `standard`, `constraint`, `convention`).

---

## Step 6 — Parallel Dispatch

Spawn `vnr-arch-reviewer` agent **per non-empty scope** — dispatch ALL in one message simultaneously.

For each scope agent, construct prompt:

```
Read agent file: $PLUGIN_DIR/agents/vnr-arch-reviewer.md

FEATURE: <FEATURE>
PLUGIN_DIR: <PLUGIN_DIR>
SPECS_DIR: specs/<FEATURE>
SCOPE: <backend|frontend>
FILES:
<newline-separated file list for this scope>

WIKI_PAGES: [<mandatory + on_demand paths>]
CARD_REF: [<cards paths>]

INSTRUCTIONS:
- Review ONLY the files listed above (this is the <SCOPE> scope).
- Load and apply rules from WIKI_PAGES and CARD_REF deterministically.
- Do NOT review files outside your scope.
- Output findings using the standard format from your agent file.
- Prefix your output with "## <Backend|Frontend> Findings" heading.
```

If `--verbose` flag → append: "Include INFO-level findings (minor style issues)."
If `--fix-hints` flag → append: "Include code snippets showing the suggested fix for each finding."

---

## Step 7 — Synthesis

After all dispatched agents return:

1. **Collect** each scope's findings table
2. **Deduplicate** — if same file + same line + same violation appears in both (unlikely given scope isolation, but guard against shared files)
3. **Count severities:**
   - `TOTAL_CRITICAL` = sum of 🔴 Critical across all scopes
   - `TOTAL_WARNING` = sum of 🟡 Warning across all scopes
4. **Compute verdict:**
   - `TOTAL_CRITICAL >= 1` → `FAIL ⛔`
   - `TOTAL_WARNING >= 1, TOTAL_CRITICAL == 0` → `WARN ⚠️`
   - `TOTAL_CRITICAL == 0 AND TOTAL_WARNING == 0` → `PASS ✅`

---

## Step 8 — Output

Compose final report:

```markdown
# Architecture Review — <FEATURE>

## Ket luan: <VERDICT_EMOJI>

## Backend Findings

| # | Muc do | File:dong | Rule | Vi pham | De xuat sua |
|---|--------|-----------|------|---------|-------------|
<BE findings rows — or "Khong co findings." if scope empty/clean>

## Frontend Findings

| # | Muc do | File:dong | Rule | Vi pham | De xuat sua |
|---|--------|-----------|------|---------|-------------|
<FE findings rows — or "Khong co findings." if scope empty/clean>

## Summary
- Backend:  Critical: X, Warning: Y
- Frontend: Critical: X, Warning: Y
- Total:    Critical: X, Warning: Y

VERDICT:<PASS|WARN|FAIL>
```

**Write** the report to `OUTPUT_PATH`.

**Display** summary banner (unless `--ci`):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ARCH REVIEW COMPLETE  [<FEATURE>]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Verdict: <VERDICT_EMOJI>
 Critical: X | Warning: Y
 Report:  <OUTPUT_PATH>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**CI mode** (`--ci`): suppress banners, output ONLY the report content. Last line MUST be `VERDICT:<PASS|WARN|FAIL>` (machine-parseable by pipeline scripts).

---

## Error Handling

| Condition | Action |
|-----------|--------|
| No files to review | STOP with message |
| Wiki not found / no manifest | Proceed — agent uses fallback (index.md navigation) |
| Resolver error | Proceed — agent uses fallback |
| One scope agent fails | Report that scope as "Review inconclusive" + surface error; other scope still contributes |
| All scope agents fail | Report FAIL with error details |

---

## Integration Notes

- **Standalone:** `/vnr-arch-review <args>` — for ad-hoc review
- **Pipeline:** `workflow.yml` `arch-sec-review` phase dispatches agent directly (unchanged). This skill adds standalone power without disrupting the pipeline.
- **CI:** use `--ci` flag. Gate scripts grep last line for `VERDICT:FAIL`.
