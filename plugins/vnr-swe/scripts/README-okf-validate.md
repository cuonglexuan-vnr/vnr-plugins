# okf-validate.mjs — OKF v0.1 conformance validator

Technology-agnostic, zero-dependency Node.js validator for an LLM-wiki bundle that follows the
**OKF (Open Knowledge Format) v0.1** spec. Ships with `vnr-swe`; contains no project/stack tokens.
Mirrors `resolve-context.mjs` (same frontmatter-strip + glob style).

## Usage

```sh
node scripts/okf-validate.mjs --root <projectRoot> [--layer wiki|raw|both] [--json] [--strict]
node scripts/okf-validate.mjs --root <projectRoot> --path docs/wiki/domains/x.md   # single file
```

| Flag | Default | Meaning |
|---|---|---|
| `--root` | cwd | project root (`docs/wiki` and `docs/raw` live under it) |
| `--layer` | `wiki` | `wiki` (strict §9 + profile) · `raw` (authoring) · `both` |
| `--json` | off | emit one JSON finding per line (`{severity,rule,file,line,R,message}`) |
| `--strict` | off | treat WARN as failure for the exit code |
| `--path` | — | validate a single file only (per-file checks) |

**Exit:** `0` no ERRORs · `1` ERRORs (or any WARN with `--strict`) · `2` script failure.

## Two profiles (per the project's OKF Conformance Profile / ADR-001)

- **wiki** — the *published* OKF bundle. Strict: full 8-field frontmatter, relative links, index/log structure.
- **raw** — the *authoring* layer. Requires only parseable frontmatter + non-empty `type`. Exempts
  `_schema/**`, `_inbox/**`, `MIGRATION.md`, `README.md`.

## Checks  (ERROR = OKF §9 / profile MUST · WARN = SHOULD / internal-quality)

| Rule | Severity | Asserts |
|---|---|---|
| `FM-PARSEABLE` | ERROR | every non-reserved `.md` has a YAML frontmatter block |
| `FM-REQUIRED-FIELDS` | ERROR | the 8 fields present (`tier: card` pages: only `id` + `type`) |
| `TIMESTAMP-FORMAT` | ERROR | `timestamp` is ISO 8601 |
| `DESCRIPTION-LEN` | ERROR | `description` ≤ 120 chars |
| `ID-UNIQUE` | ERROR | no duplicate `id` across the bundle |
| `INDEX-FM-ONLY-OKFVER` / `INDEX-OKFVER` | ERROR | `index.md` frontmatter is exactly `okf_version` |
| `CATALOG-FORMAT` | ERROR | `index.md` per-folder catalog is a §6 bullet list, not a GFM table |
| `MANIFEST-PATHS` | ERROR | every `manifest.json` path exists on disk |
| `LOG-RESERVED` | ERROR / WARN | `log.md` headings are bare `## YYYY-MM-DD`; pre-migration bracket-date entries are WARN `frozen-log-entry` (append-only → expected & permanent) |
| `LINK-NO-WIKILINK` | WARN | published bundle should use relative links, not `[[id]]` |
| `LINK-RESOLVES` | WARN | relative link target exists — **quality, NOT §9** (OKF §5.3 requires consumers tolerate broken links) |
| `RELATED-RESOLVES` | WARN | `related: [folder/slug]` values resolve — quality |
| `RAW-FM-PARSEABLE` / `RAW-FM-TYPE` | ERROR | (raw layer) frontmatter + non-empty `type` |

## Integration
- **`vnr-wiki-sync` Step 5** invokes it (`--layer wiki`); a sync must reach **0 ERROR**.
- Standalone CLI for spot checks; CI can gate on the exit code.

## Expected, non-actionable WARNs
- `frozen-log-entry` WARNs — permanent (the log is append-only; old bracket-date headings stay).
- A page that *documents the format* (e.g. `decisions/adr-001-okf-conformance-profile.md`) may itself
  contain illustrative `[[id]]` / `[text](path)` snippets — these surface as WARN-level LINK findings,
  not conformance errors.
