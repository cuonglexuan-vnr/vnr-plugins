#!/usr/bin/env node
/**
 * okf-validate.mjs — OKF v0.1 conformance validator for an LLM-wiki bundle.
 *
 * TECHNOLOGY-AGNOSTIC. Ships with the vnr-swe plugin. Contains NO project/stack tokens.
 * Zero dependencies (node:fs + node:path only). Mirrors resolve-context.mjs style.
 *
 * Two profiles (per the HRM9 <-> OKF Conformance Profile / ADR-001):
 *   --layer wiki  (default) : docs/wiki/ — strict OKF §9 + Profile R01-R22
 *   --layer raw             : docs/raw/  — authoring layer: frontmatter + non-empty `type` only
 *   --layer both            : run both
 *
 * Usage:
 *   node okf-validate.mjs --root <projectRoot> [--layer wiki|raw|both] [--json] [--strict]
 *   node okf-validate.mjs --root <projectRoot> --path docs/wiki/domains/x.md   (single file)
 *
 * Severity: ERROR = OKF §9 / Profile MUST violation; WARN = SHOULD / internal-quality.
 * Exit: 0 = no ERRORs (WARNs allowed) | 1 = ERRORs (or any WARN under --strict) | 2 = script failure.
 *
 * Conformance vs quality: LINK-RESOLVES and RELATED-RESOLVES are internal-quality WARNs
 * (OKF §5.3 requires consumers tolerate broken links); they are NOT §9 conformance gates.
 * LOG-RESERVED frozen-log-entry WARNs are expected/permanent (log.md is append-only).
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const WIKI_DIR = 'docs/wiki';
const RAW_DIR = 'docs/raw';
const REQUIRED_FIELDS = ['id', 'title', 'folder', 'type', 'tags', 'related', 'timestamp', 'description'];
const FOLDER_HEADING_RE = /^#{2,3}\s+(domains|patterns|guides|rules|stacks|decisions)\b/i;

// ---------- helpers (style mirrored from resolve-context.mjs) ----------
function norm(p) { return String(p).replace(/\\/g, '/'); }

const FM_RE = /^\s*---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
function parseFrontmatter(text) {
  const m = FM_RE.exec(text);
  if (!m) return { found: false, keys: new Map() };
  const keys = new Map();
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_]+)\s*:\s*(.*)$/.exec(line);
    if (kv) keys.set(kv[1], kv[2].trim());
  }
  return { found: true, keys };
}
function stripQuotes(s) {
  s = String(s == null ? '' : s).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  return s;
}
function parseInlineArray(v) {
  const m = /^\[(.*)\]$/.exec(stripQuotes(v).trim());
  if (!m) return [];
  return m[1].split(',').map((s) => stripQuotes(s).trim()).filter(Boolean);
}
function walkMd(dir) {
  const out = [];
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkMd(full));
    else if (e.isFile() && e.name.endsWith('.md')) out.push(full);
  }
  return out;
}
function makeReporter() {
  const findings = [];
  return {
    findings,
    add(severity, rule, file, line, R, message) {
      findings.push({ severity, rule, file: norm(file), line: line || 0, R: R || '', message });
    },
  };
}

// ---------- wiki layer (strict OKF §9 + Profile) ----------
function validateWiki(root, rep, only) {
  const wikiAbs = join(root, WIKI_DIR);
  let files = walkMd(wikiAbs);
  if (only) files = files.filter((f) => norm(f) === norm(only) || norm(relative(root, f)) === norm(only));
  const idMap = new Map();

  for (const file of files) {
    const relPath = norm(relative(root, file));
    const base = norm(file).split('/').pop();
    let text = '';
    try { text = readFileSync(file, 'utf8'); } catch { continue; }

    if (base === 'index.md') { checkIndex(text, relPath, rep); continue; }   // reserved (OKF §3.1)
    if (base === 'log.md') { checkLog(text, relPath, rep); continue; }       // reserved (OKF §3.1)

    const fm = parseFrontmatter(text);
    if (!fm.found) {
      rep.add('ERROR', 'FM-PARSEABLE', relPath, 1, 'R01', 'no YAML frontmatter block');
      checkBodyLinks(text, file, relPath, rep);
      continue;
    }
    const isCard = stripQuotes(fm.keys.get('tier') || '') === 'card';
    const need = isCard ? ['id', 'type'] : REQUIRED_FIELDS;
    for (const f of need) {
      if (!fm.keys.has(f) || stripQuotes(fm.keys.get(f)) === '') {
        rep.add('ERROR', 'FM-REQUIRED-FIELDS', relPath, 1, isCard ? 'R02' : 'R02/R09', `missing or empty '${f}'${isCard ? ' (card)' : ''}`);
      }
    }
    if (fm.keys.has('timestamp')) {
      const ts = stripQuotes(fm.keys.get('timestamp'));
      if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2}))?$/.test(ts)) {
        rep.add('ERROR', 'TIMESTAMP-FORMAT', relPath, 1, 'R10', `timestamp not ISO 8601: '${ts}'`);
      }
    }
    if (fm.keys.has('description')) {
      const d = stripQuotes(fm.keys.get('description'));
      if (d.length > 120) rep.add('ERROR', 'DESCRIPTION-LEN', relPath, 1, 'R11', `description ${d.length} > 120 chars`);
    }
    // legacy-field detection (surfaces pre-migration state / regressions)
    if (fm.keys.has('summary')) rep.add('WARN', 'LEGACY-FIELD', relPath, 1, 'R09', "legacy 'summary' (rename to 'description')");
    if (fm.keys.has('updated')) rep.add('WARN', 'LEGACY-FIELD', relPath, 1, 'R10', "legacy 'updated' (rename to 'timestamp')");

    if (fm.keys.has('id')) {
      const id = stripQuotes(fm.keys.get('id'));
      if (id) { if (!idMap.has(id)) idMap.set(id, []); idMap.get(id).push(relPath); }
    }
    if (fm.keys.has('related')) {
      for (const rel of parseInlineArray(fm.keys.get('related'))) {
        const target = join(wikiAbs, rel.endsWith('.md') ? rel : rel + '.md');
        if (!existsSync(target)) rep.add('WARN', 'RELATED-RESOLVES', relPath, 1, 'R21', `related '${rel}' does not resolve to a page`);
      }
    }
    checkBodyLinks(text, file, relPath, rep);
    checkWikilinks(text, relPath, rep);
  }

  if (!only) {
    for (const [id, fs] of idMap) {
      if (fs.length > 1) rep.add('ERROR', 'ID-UNIQUE', fs.join(' , '), 1, 'R15', `id '${id}' used by ${fs.length} pages`);
    }
    checkManifest(root, rep);
  }
}

function checkWikilinks(text, relPath, rep) {
  const body = text.replace(FM_RE, '');
  const matches = body.match(/\[\[[^\]]+\]\]/g);
  if (matches && matches.length) {
    rep.add('WARN', 'LINK-NO-WIKILINK', relPath, 1, 'R05', `${matches.length} [[wikilink]](s) — published bundle must use relative markdown links`);
  }
}

function checkBodyLinks(text, file, relPath, rep) {
  const body = text.replace(FM_RE, '');
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(body))) {
    let target = m[1].trim();
    if (!target || /^[a-z]+:\/\//i.test(target) || target.startsWith('#') || target.startsWith('mailto:')) continue;
    target = target.split('#')[0];
    if (!target.endsWith('.md')) continue;
    if (!existsSync(join(dirname(file), target))) {
      rep.add('WARN', 'LINK-RESOLVES', relPath, 1, 'R12', `broken relative link '${m[1]}'`);
    }
  }
}

function checkIndex(text, relPath, rep) {
  const fm = parseFrontmatter(text);
  if (!fm.found) {
    rep.add('ERROR', 'INDEX-FM-ONLY-OKFVER', relPath, 1, 'R03/R04', 'index.md must declare an okf_version-only frontmatter block');
  } else {
    if (!fm.keys.has('okf_version')) rep.add('ERROR', 'INDEX-OKFVER', relPath, 1, 'R04', "index.md missing 'okf_version'");
    for (const k of fm.keys.keys()) {
      if (k !== 'okf_version') rep.add('ERROR', 'INDEX-FM-ONLY-OKFVER', relPath, 1, 'R03', `index.md frontmatter has forbidden key '${k}'`);
    }
  }
  const lines = text.split(/\r?\n/);
  let inCatalog = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,6}\s+/.test(lines[i])) { inCatalog = FOLDER_HEADING_RE.test(lines[i]); continue; }
    if (inCatalog) {
      const t = lines[i].trim();
      if (t.startsWith('|') && t.lastIndexOf('|') > 0) {
        rep.add('ERROR', 'CATALOG-FORMAT', relPath, i + 1, 'R06', 'folder catalog uses a GFM table row; OKF §6 requires a bullet list');
        inCatalog = false; // one finding per section
      }
    }
  }
}

function checkLog(text, relPath, rep) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^##\s+/.test(line)) continue;
    if (/^##\s+\d{4}-\d{2}-\d{2}\s*$/.test(line)) continue;                       // bare ISO date — OK
    if (/^##\s+\[\d{4}-\d{2}-\d{2}\]/.test(line)) {                               // frozen append-only entry
      rep.add('WARN', 'LOG-RESERVED', relPath, i + 1, 'R07', 'frozen-log-entry: bracket-date heading (append-only; expected/permanent)');
      continue;
    }
    rep.add('ERROR', 'LOG-RESERVED', relPath, i + 1, 'R07', `log heading not a bare ISO date: '${line.trim()}'`);
  }
}

function checkManifest(root, rep) {
  const mfPath = join(root, WIKI_DIR, 'manifest.json');
  if (!existsSync(mfPath)) return; // absent manifest is valid (resolver no-ops)
  let mf;
  try { mf = JSON.parse(readFileSync(mfPath, 'utf8')); }
  catch { rep.add('ERROR', 'MANIFEST-PATHS', 'docs/wiki/manifest.json', 1, 'R16h', 'manifest.json is not valid JSON'); return; }
  const paths = [];
  for (const s of mf.stacks || []) {
    if (s.card) paths.push(s.card);
    for (const p of s.always || []) paths.push(p);
    for (const p of s.on_demand || []) paths.push(p);
  }
  for (const ph of Object.values(mf.phases || {})) for (const p of ph.always || []) paths.push(p);
  for (const p of paths) {
    if (!existsSync(join(root, p))) rep.add('ERROR', 'MANIFEST-PATHS', 'docs/wiki/manifest.json', 1, 'R16h', `manifest path missing on disk: ${p}`);
  }
}

// ---------- raw layer (authoring profile: frontmatter + non-empty type only) ----------
function isExemptRaw(relPath) {
  const p = norm(relPath);
  if (/(^|\/)_/.test(p)) return true; // any _-prefixed file/folder: _schema/, _inbox/, ...
  const base = p.split('/').pop();
  return base === 'MIGRATION.md' || base === 'README.md' || base === 'index.md' || base === 'log.md';
}
function validateRaw(root, rep, only) {
  const rawAbs = join(root, RAW_DIR);
  let files = walkMd(rawAbs);
  if (only) files = files.filter((f) => norm(f) === norm(only) || norm(relative(root, f)) === norm(only));
  for (const file of files) {
    const relPath = norm(relative(root, file));
    if (isExemptRaw(relPath)) continue;
    let text = '';
    try { text = readFileSync(file, 'utf8'); } catch { continue; }
    const fm = parseFrontmatter(text);
    if (!fm.found) { rep.add('ERROR', 'RAW-FM-PARSEABLE', relPath, 1, 'R17', 'raw concept file has no frontmatter'); continue; }
    if (!fm.keys.has('type') || stripQuotes(fm.keys.get('type')) === '') {
      rep.add('ERROR', 'RAW-FM-TYPE', relPath, 1, 'R18', "raw concept file missing non-empty 'type'");
    }
  }
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

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = (typeof args['--root'] === 'string' && args['--root']) ? args['--root'] : process.cwd();
  const layer = (typeof args['--layer'] === 'string') ? args['--layer'] : 'wiki';
  const only = (typeof args['--path'] === 'string') ? args['--path'] : null;
  const rep = makeReporter();

  if (layer === 'wiki' || layer === 'both') validateWiki(root, rep, only);
  if (layer === 'raw' || layer === 'both') validateRaw(root, rep, only);

  const errors = rep.findings.filter((f) => f.severity === 'ERROR');
  const warns = rep.findings.filter((f) => f.severity === 'WARN');

  if (args['--json']) {
    for (const f of rep.findings) process.stdout.write(JSON.stringify(f) + '\n');
  } else if (rep.findings.length === 0) {
    process.stdout.write(`OKF validate (layer=${layer}): 0 findings — conformant.\n`);
  } else {
    for (const f of rep.findings) {
      process.stdout.write(`${f.severity.padEnd(5)} ${f.rule.padEnd(20)} ${String(f.R).padEnd(9)} ${f.file}${f.line ? ':' + f.line : ''}\n        ${f.message}\n`);
    }
    process.stdout.write(`\nSummary: ${errors.length} ERROR, ${warns.length} WARN  (layer=${layer})\n`);
  }

  if (errors.length > 0 || (args['--strict'] && warns.length > 0)) process.exit(1);
  process.exit(0);
}

try { main(); }
catch (e) { process.stderr.write('okf-validate: fatal: ' + String((e && e.stack) || e) + '\n'); process.exit(2); }
