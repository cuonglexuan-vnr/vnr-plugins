#!/usr/bin/env node
/**
 * resolve-context.mjs — the Wiki Loading Contract resolver.
 *
 * TECHNOLOGY-AGNOSTIC. Ships with vnr-plugin. Contains NO project/stack tokens.
 * All routing data lives in the PROJECT wiki's manifest (docs/wiki/manifest.json).
 * No manifest present  =>  emits an empty result / no-op  =>  pipeline behaves as today.
 *
 * Two modes:
 *
 *   1. CLI mode  (called by skills / agents at phase entry):
 *        node resolve-context.mjs --phase <plan|implement|review> --paths "a.cshtml,b/c.ts"
 *      Prints JSON:
 *        { ok, manifest, phase, stacks:[ids], mandatory:[paths], cards:[paths], on_demand:[paths] }
 *      The caller MUST read every file in `mandatory` + `cards` fully before producing output.
 *
 *   2. Hook mode  (called by a PreToolUse(Write|Edit) hook, hook JSON on stdin):
 *        node resolve-context.mjs --hook
 *      Reads tool_input.file_path, matches the stack(s), and prints:
 *        { hookSpecificOutput: { hookEventName:"PreToolUse", additionalContext:"<card text>" } }
 *      Injects the terse constraint card(s) into the (sub)agent's context on every write.
 *      No match / no manifest => prints nothing (silent no-op).
 *
 * Manifest schema (docs/wiki/manifest.json), all paths relative to the project root:
 *   {
 *     "version": "1",
 *     "stacks": [
 *       { "id": "<stack-id>",
 *         "match": ["<glob>", ...],        // file globs that select this stack
 *         "card":  "<path>",               // terse constraint card (hook-injected, tier-1)
 *         "always":    ["<path>", ...],    // tier-1 pages to load fully at phase entry
 *         "on_demand": ["<path>", ...] }   // tier-2 pages, loaded when component touched
 *     ],
 *     "phases": {
 *       "plan":      { "always": ["<path>", ...] },
 *       "implement": { "always": ["<path>", ...] },
 *       "review":    { "always": ["<path>", ...] }
 *     }
 *   }
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, isAbsolute, relative } from 'node:path';

const MANIFEST_REL = 'docs/wiki/manifest.json';
const CARD_BUDGET = 9000; // keep additionalContext well under the 10k cap

// ---------- tiny, self-contained glob matcher (zero deps) ----------
// Supports: ** (any depth), * (within a segment), ? (one char), {a,b} alternation, literal dots.
// Forgiving: an unanchored glob matches at any depth (implicit leading **/).
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        // ** (optionally followed by /) => any depth
        i++;
        if (glob[i + 1] === '/') i++;
        re += '(?:.*/)?';
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else if (c === '{') {
      const end = glob.indexOf('}', i);
      if (end === -1) { re += '\\{'; }
      else {
        const alts = glob.slice(i + 1, end).split(',').map(escapeLiteral);
        re += '(?:' + alts.join('|') + ')';
        i = end;
      }
    } else {
      re += escapeLiteral(c);
    }
  }
  // Unanchored glob (no leading slash / **) => allow matching at any depth.
  const anchored = glob.startsWith('/') || glob.startsWith('**');
  const prefix = anchored ? '^' : '^(?:.*/)?';
  return new RegExp(prefix + re + '$');
}
function escapeLiteral(s) {
  return s.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}
function normalize(p) {
  return String(p).replace(/\\/g, '/');
}
// Strip a leading YAML frontmatter block (--- … ---) so injected cards carry no metadata noise.
function stripFrontmatter(text) {
  const m = /^\s*---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(text);
  return m ? text.slice(m[0].length) : text;
}
// Match a (possibly absolute) file path against a glob, tolerant of cwd-relative or absolute input.
function pathMatchesGlob(filePath, glob, root) {
  const norm = normalize(filePath);
  const candidates = new Set([norm]);
  if (isAbsolute(filePath)) {
    const rel = normalize(relative(root, filePath));
    if (rel && !rel.startsWith('..')) candidates.add(rel);
  }
  const re = globToRegExp(glob);
  for (const cand of candidates) {
    if (re.test(cand)) return true;
  }
  return false;
}

// ---------- manifest loading ----------
function loadManifest(root) {
  const path = join(root, MANIFEST_REL);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null; // malformed manifest => treat as absent (graceful no-op)
  }
}

function matchStacks(manifest, paths, root) {
  const matched = [];
  for (const stack of manifest.stacks || []) {
    const globs = stack.match || [];
    const hit = paths.some((p) => globs.some((g) => pathMatchesGlob(p, g, root)));
    if (hit) matched.push(stack);
  }
  return matched;
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

// ---------- CLI mode ----------
function runCli(args, root) {
  const phase = typeof args['--phase'] === 'string' ? args['--phase'] : '';
  const pathsArg = typeof args['--paths'] === 'string' ? args['--paths'] : '';
  const paths = pathsArg
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const manifest = loadManifest(root);
  if (!manifest) {
    process.stdout.write(JSON.stringify({
      ok: true, manifest: 'absent', phase, stacks: [],
      mandatory: [], cards: [], on_demand: [],
      note: 'No docs/wiki/manifest.json — fall back to docs/wiki/index.md navigation.',
    }, null, 2));
    return;
  }

  const phaseAlways = (manifest.phases?.[phase]?.always) || [];
  const stacks = matchStacks(manifest, paths, root);

  const stackAlways = stacks.flatMap((s) => s.always || []);
  const cards = stacks.map((s) => s.card).filter(Boolean);
  const onDemand = stacks.flatMap((s) => s.on_demand || []);

  process.stdout.write(JSON.stringify({
    ok: true,
    manifest: 'found',
    phase,
    stacks: stacks.map((s) => s.id),
    mandatory: uniq([...phaseAlways, ...stackAlways]),
    cards: uniq(cards),
    on_demand: uniq(onDemand),
  }, null, 2));
}

// ---------- Hook mode ----------
function runHook(rootArg) {
  let raw = '';
  try { raw = readFileSync(0, 'utf8'); } catch { /* no stdin */ }
  let input = {};
  try { input = JSON.parse(raw); } catch { /* ignore */ }

  // The project root is the hook's cwd (where the manifest lives), falling back to rootArg.
  const root = (typeof input?.cwd === 'string' && input.cwd) ? input.cwd : rootArg;
  const filePath = input?.tool_input?.file_path;
  const manifest = loadManifest(root);
  if (!filePath || !manifest) {
    process.stdout.write('{}'); // silent no-op
    return;
  }

  const stacks = matchStacks(manifest, [filePath], root);
  if (stacks.length === 0) {
    process.stdout.write('{}');
    return;
  }

  let out = '';
  for (const s of stacks) {
    if (!s.card) continue;
    const cardPath = join(root, s.card);
    if (!existsSync(cardPath)) continue;
    let text = '';
    try { text = readFileSync(cardPath, 'utf8'); } catch { continue; }
    text = stripFrontmatter(text);
    out += `\n[Wiki Loading Contract — ${s.id}]\n${text.trim()}\n`;
    if (out.length >= CARD_BUDGET) break;
  }
  if (!out.trim()) {
    process.stdout.write('{}');
    return;
  }
  if (out.length > CARD_BUDGET) out = out.slice(0, CARD_BUDGET) + '\n…(truncated; open the catalog page)';

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: out.trim(),
    },
  }));
}

// ---------- entry ----------
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) { args[a] = next; i++; }
      else args[a] = true;
    }
  }
  return args;
}

const argv = process.argv.slice(2);
const args = parseArgs(argv);
const root = args['--root'] || process.cwd();

try {
  if (args['--hook']) runHook(root);
  else runCli(args, root);
} catch (e) {
  // Never break the caller — degrade to no-op.
  if (args['--hook']) process.stdout.write('{}');
  else process.stdout.write(JSON.stringify({ ok: false, manifest: 'error', error: String(e), stacks: [], mandatory: [], cards: [], on_demand: [] }));
}
