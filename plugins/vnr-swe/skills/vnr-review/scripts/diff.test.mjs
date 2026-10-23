import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { findRepos, baseline, collectDiff, contentTree } from './diff.mjs';

// Cô lập khỏi cấu hình git của máy (autocrlf, gpgsign...) cho cả helper này lẫn diff.mjs.
// os.devNull trên Windows không dùng được cho git; '/dev/null' thì git-for-windows hiểu.
process.env.GIT_CONFIG_GLOBAL = '/dev/null'; process.env.GIT_CONFIG_NOSYSTEM = '1';

let ws, remote, fe, body;
const sh = (cwd, ...a) => execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd, encoding: 'utf8' });

before(() => {
  ws = mkdtempSync(join(os.tmpdir(), 'vnr-review-ws-'));
  remote = join(ws, 'remote.git'); sh(ws, 'init', '--bare', '-b', 'develop', remote);
  mkdirSync(join(ws, 'src')); fe = join(ws, 'src', 'vnr.hrm.web');
  sh(ws, 'clone', remote, fe);
  writeFileSync(join(fe, 'nx.json'), '{}'); mkdirSync(join(fe, 'apps'), { recursive: true });
  writeFileSync(join(fe, 'apps', 'a.ts'), 'line1\nline2\n'); writeFileSync(join(fe, 'bin.dat'), Buffer.from([0, 1, 2, 255]));
  body = Array.from({ length: 10 }, (_, k) => `export const v${k} = ${k};\n`).join('');
  writeFileSync(join(fe, 'apps', 'old.ts'), body); writeFileSync(join(fe, 'apps', 'pure.ts'), body + 'tail\n');
  sh(fe, 'add', '-A'); sh(fe, 'commit', '-qm', 'base'); sh(fe, 'push', '-q', '-u', 'origin', 'develop');
  sh(fe, 'switch', '-qc', 'feat/x'); sh(fe, 'push', '-q', '-u', 'origin', 'feat/x');
  // commit chưa push + staged + unstaged + untracked + rename + delete + binary
  writeFileSync(join(fe, 'apps', 'a.ts'), 'line1\nline2 changed\nline3 new\n'); sh(fe, 'commit', '-qam', 'c1');
  writeFileSync(join(fe, 'apps', 'b.ts'), 'const MOCK = 1;\n'); sh(fe, 'add', 'apps/b.ts');
  writeFileSync(join(fe, 'apps', 'c.ts'), 'untracked\n');
  sh(fe, 'mv', 'apps/old.ts', 'apps/new.ts'); writeFileSync(join(fe, 'apps', 'new.ts'), body + 'export const edited = 1;\n');
  sh(fe, 'mv', 'apps/pure.ts', 'apps/pure2.ts');
  sh(fe, 'mv', 'bin.dat', 'bin2.dat'); writeFileSync(join(fe, 'bin2.dat'), Buffer.from([0, 9, 9, 255]));
});
after(() => rmSync(ws, { recursive: true, force: true }));

test('findRepos finds src/* git repos with kind', () => {
  const repos = findRepos(ws);
  assert.deepEqual(repos.map(r => [r.name, r.kind]), [['vnr.hrm.web', 'fe']]);
});

test('baseline prefers @{upstream}: ref là merge-base với upstream, không phải đầu upstream', () => {
  const b = baseline(fe);
  assert.equal(b.how, 'upstream'); assert.equal(b.ref, sh(fe, 'merge-base', 'HEAD', 'origin/feat/x').trim());
});

test('baseline falls back to merge-base with develop when no upstream', () => {
  sh(fe, 'branch', '--unset-upstream');
  const b = baseline(fe);
  assert.equal(b.how, 'merge-base'); assert.match(b.ref, /^[0-9a-f]{40}$/);
  sh(fe, 'branch', '-u', 'origin/feat/x');
});

test('collectDiff includes commits, staged, unstaged, untracked; added lines carry numbers; binary skipped', () => {
  const d = collectDiff(fe, baseline(fe).ref);
  const byPath = Object.fromEntries(d.files.map(f => [f.path, f]));
  assert.deepEqual(byPath['apps/a.ts'].added.map(l => [l.n, l.text]), [[2, 'line2 changed'], [3, 'line3 new']]);
  assert.equal(byPath['apps/b.ts'].status, 'A'); assert.equal(byPath['apps/b.ts'].added[0].text, 'const MOCK = 1;');
  assert.equal(byPath['apps/c.ts'].status, 'U'); assert.equal(byPath['apps/c.ts'].added[0].n, 1);
  assert.ok(!byPath['bin.dat'] || byPath['bin.dat'].added.length === 0);
  assert.ok(d.skipped.some(s => s.path === 'bin2.dat' && /binary/i.test(s.why)));
});

test('collectDiff with no changes returns empty', () => {
  // fe còn staged/untracked, nên dùng clone sạch
  const clean = join(ws, 'clean'); sh(ws, 'clone', '-q', remote, clean);
  assert.equal(collectDiff(clean, 'origin/develop').files.length, 0);
});

test('rename: chỉ dòng sửa là added; rename thuần không có added', () => {
  const byPath = Object.fromEntries(collectDiff(fe, baseline(fe).ref).files.map(f => [f.path, f]));
  assert.equal(byPath['apps/new.ts'].status, 'R');
  assert.deepEqual(byPath['apps/new.ts'].added.map(l => [l.n, l.text]), [[11, 'export const edited = 1;']]);
  assert.equal(byPath['apps/pure2.ts'].status, 'R');
  assert.deepEqual(byPath['apps/pure2.ts'].added, []);
});

test('collectDiff ném lỗi rõ ràng khi baseline null; thư mục untracked bị bỏ qua', () => {
  assert.throws(() => collectDiff(fe, null), /baseline không xác định/);
  const nested = join(fe, 'nested'); mkdirSync(nested); sh(nested, 'init', '-q');
  const d = collectDiff(fe, baseline(fe).ref);
  assert.ok(d.skipped.some(s => s.path === 'nested/' && s.why === 'thư mục'));
  assert.match(d.files.find(f => f.path === 'apps/c.ts').hunks[0], /\n\+untracked$/);
});

test('upstream đã đi trước (fetch chưa merge): file của remote không lọt vào diff, commit local vẫn có', () => {
  const other = join(ws, 'other'); sh(ws, 'clone', '-q', '-b', 'feat/x', remote, other);
  writeFileSync(join(other, 'nx.json'), '{"remote":1}\n'); sh(other, 'commit', '-qam', 'remote only'); sh(other, 'push', '-q');
  sh(fe, 'fetch', '-q');
  const b = baseline(fe);
  assert.equal(b.how, 'upstream');
  const paths = collectDiff(fe, b.ref).files.map(f => f.path);
  assert.ok(!paths.includes('nx.json'), 'remote-only change must not appear reversed');
  assert.ok(paths.includes('apps/a.ts'), 'unpushed local commit still reviewed');
});

test('contentTree = tree của commit "add -A trừ never-commit"; index thật không đổi', () => {
  const r = mkdtempSync(join(os.tmpdir(), 'vnr-review-tree-'));
  try {
    sh(r, 'init', '-q'); writeFileSync(join(r, 'a.txt'), 'v1\n'); sh(r, 'add', '-A'); sh(r, 'commit', '-qm', 'base');
    writeFileSync(join(r, 'a.txt'), 'v2\n'); sh(r, 'add', 'a.txt'); writeFileSync(join(r, 'a.txt'), 'v3\n');   // staged + unstaged
    writeFileSync(join(r, 'b.txt'), 'untracked\n'); writeFileSync(join(r, '.env'), 'SECRET=1\n');   // untracked + never-commit
    mkdirSync(join(r, 'p', 'bin'), { recursive: true }); writeFileSync(join(r, 'p', 'bin', 'o.txt'), 'build\n');   // never-commit ở thư mục con
    const cached = sh(r, 'diff', '--cached');
    const tree = contentTree(r);
    assert.equal(sh(r, 'diff', '--cached'), cached, 'index thật không bị đụng');
    sh(r, 'add', '-A'); sh(r, 'reset', '-q', '--', '.env', 'p/bin'); sh(r, 'commit', '-qm', 'same content');
    assert.equal(tree, sh(r, 'rev-parse', 'HEAD^{tree}').trim());
    assert.ok(!sh(r, 'ls-tree', '-r', '--name-only', 'HEAD').includes('.env'));
  } finally { rmSync(r, { recursive: true, force: true }); }
});
