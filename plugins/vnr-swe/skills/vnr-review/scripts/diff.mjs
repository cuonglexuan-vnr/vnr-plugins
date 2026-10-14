// Tìm repo trong workspace, baseline so với remote, và hunk của mọi thay đổi chưa push.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 1_000_000;
const MAX_LINE = 4000;
const posix = p => p.replace(/\\/g, '/');

export function git(cwd, args, { allowFail = false } = {}) {
  try { return execFileSync('git', ['-c', 'core.quotepath=off', ...args], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { if (allowFail) return ''; throw new Error(`git ${args.join(' ')} thất bại trong ${cwd}: ${(e.stderr || e.message).toString().trim()}`); }
}

function kindOf(root) {
  if (existsSync(join(root, 'nx.json'))) return 'fe';
  if (readdirSync(root).some(f => f.endsWith('.sln'))) return 'be';
  return null;
}

export function findRepos(wsRoot) {
  const out = [];
  const isRepo = d => existsSync(join(d, '.git'));
  if (isRepo(wsRoot) && kindOf(wsRoot)) out.push({ name: posix(wsRoot).split('/').pop(), root: wsRoot, kind: kindOf(wsRoot) });
  const src = join(wsRoot, 'src');
  if (existsSync(src)) for (const name of readdirSync(src).sort()) {
    const root = join(src, name);
    if (statSync(root).isDirectory() && isRepo(root)) out.push({ name, root, kind: kindOf(root) });
  }
  return out;
}

// Baseline: merge-base với @{upstream} nếu có (không bao giờ là đầu upstream: remote đã fetch mà chưa merge sẽ hiện ngược trong diff); không thì merge-base mới nhất với origin/projects/*/dev, origin/develop, develop.
export function baseline(repoRoot, { override } = {}) {
  if (override) return { ref: override, how: 'override', candidates: [] };
  const up = git(repoRoot, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { allowFail: true }).trim();
  if (up) {
    const mb = git(repoRoot, ['merge-base', 'HEAD', up], { allowFail: true }).trim();
    if (mb) return { ref: mb, how: 'upstream', from: up, candidates: [] };
  }
  const remoteDev = git(repoRoot, ['branch', '-r', '--list', 'origin/projects/*/dev', 'origin/develop'], { allowFail: true })
    .split('\n').map(s => s.trim()).filter(Boolean);
  const candidates = [...new Set([...remoteDev, 'develop'])];
  let best = null;
  for (const c of candidates) {
    const mb = git(repoRoot, ['merge-base', 'HEAD', c], { allowFail: true }).trim(); if (!mb) continue;
    const t = Number(git(repoRoot, ['show', '-s', '--format=%ct', mb]).trim());
    if (!best || t > best.t) best = { ref: mb, t, from: c };
  }
  return best ? { ref: best.ref, how: 'merge-base', candidates, from: best.from } : { ref: null, how: 'none', candidates };
}

// Lấy các dòng thêm (kèm số dòng mới) và hunk thô của một file so với baseRef (gồm commit + staged + unstaged).
// `paths` = [oldPath?, path]: truyền cả hai đầu của rename để git ghép được cặp.
function addedLines(repoRoot, baseRef, paths) {
  const out = git(repoRoot, ['diff', '-U0', '--no-color', '-M', baseRef, '--', ...paths]);
  const lines = out.split('\n'); if (lines.at(-1) === '') lines.pop();
  const added = [], hunks = []; let n = 0, cur = null;
  for (const l of lines) {
    const h = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (h) { n = Number(h[1]); cur = [l]; hunks.push(cur); continue; }
    if (!cur) continue; cur.push(l);
    if (l.startsWith('+')) { if (l.length - 1 <= MAX_LINE) added.push({ n, text: l.slice(1).replace(/\r$/, '') }); n++; }
    else if (!l.startsWith('-') && !l.startsWith('\\')) n++;
  }
  return { added, hunks: hunks.map(h => h.join('\n')) };
}

export function collectDiff(repoRoot, baseRef) {
  if (!baseRef) throw new Error('baseline không xác định');
  const files = [], skipped = [];
  const ns = git(repoRoot, ['diff', '--name-status', '-z', '-M', baseRef, '--']).split('\0');
  for (let i = 0; i < ns.length - 1;) {
    const st = ns[i++]; if (!st) continue;
    const code = st[0]; let path = ns[i++], oldPath = null;
    if (code === 'R' || code === 'C') { oldPath = path; path = ns[i++]; }
    if (code === 'D') continue;
    if (code === 'U') { skipped.push({ path: posix(path), why: 'unmerged' }); continue; }
    const paths = oldPath ? [oldPath, path] : [path];
    try {
      const numstat = git(repoRoot, ['diff', '--numstat', '-M', baseRef, '--', ...paths]).trim();
      if (numstat.startsWith('-\t-')) { skipped.push({ path: posix(path), why: 'binary' }); continue; }
      const full = join(repoRoot, path);
      if (existsSync(full) && statSync(full).size > MAX_BYTES) { skipped.push({ path: posix(path), why: `> ${MAX_BYTES} bytes` }); continue; }
      files.push({ path: posix(path), status: code === 'C' ? 'A' : code === 'T' ? 'M' : code, ...addedLines(repoRoot, baseRef, paths) });
    } catch { skipped.push({ path: posix(path), why: 'git error' }); }
  }
  const untracked = git(repoRoot, ['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean);
  for (const path of untracked) {
    const full = join(repoRoot, path); let st;
    try { st = statSync(full); } catch { skipped.push({ path: posix(path), why: 'không đọc được' }); continue; }
    if (st.isDirectory()) { skipped.push({ path: posix(path), why: 'thư mục' }); continue; }
    if (st.size > MAX_BYTES) { skipped.push({ path: posix(path), why: `> ${MAX_BYTES} bytes` }); continue; }
    const buf = readFileSafe(full); if (!buf || buf.subarray(0, 8000).includes(0)) { skipped.push({ path: posix(path), why: 'binary' }); continue; }
    const text = buf.toString('utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n'); if (text.at(-1) === '') text.pop();
    const hunk = [`@@ -0,0 +1,${text.length} @@ (untracked)`, ...text.map(t => '+' + t)].join('\n');
    files.push({ path: posix(path), status: 'U', added: text.map((t, k) => ({ n: k + 1, text: t })).filter(l => l.text.length <= MAX_LINE), hunks: [hunk] });
  }
  return { files, skipped };
}

function readFileSafe(p) { try { return readFileSync(p); } catch { return null; } }
