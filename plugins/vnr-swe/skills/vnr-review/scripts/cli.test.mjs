// plugins/vnr-swe/skills/vnr-review/scripts/cli.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync, existsSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildPrompt } from './cli.mjs';

const CLI = fileURLToPath(new URL('./cli.mjs', import.meta.url));
let ws, state;
const sh = (cwd, ...a) => execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd, encoding: 'utf8' });
const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });

before(() => {
  ws = mkdtempSync(join(os.tmpdir(), 'vnr-review-ws-')); state = join(ws, 'state');
  mkdirSync(join(ws, 'docs/review/rules'), { recursive: true });
  writeFileSync(join(ws, 'docs/review/config.json'), JSON.stringify({ maxJobs: 5 }));
  writeFileSync(join(ws, 'docs/review/rules/slop.md'), `---
schema: "1"
aspect: slop
title: "SLOP"
version: "2"
status: review
repo: both
applies_to:
  - "apps/**/*.ts"
excludes: []
---
## 1. Phạm vi & từ điển
Từ điển.
## 2. Bảng luật
## 3. Các luật
### SLOP-01 — Dữ liệu mẫu
**Mức độ:** FAIL
**Phạm vi:** \`apps/**/*.ts\`
**Cách phát hiện:**
- regex-gate: /MOCK/u
**Cần đọc thêm:** —
**Gợi ý sửa:** Bỏ mock.
### SLOP-02 — Ghi chú
**Mức độ:** WARN
**Cách phát hiện:**
- regex-gate: /TODO/u
**Gợi ý sửa:** Sửa comment.
### SLOP-03 — Commit message
**Mức độ:** WARN
**Phạm vi:** \`(commit message)\`
**Cách phát hiện:**
- regex-gate: /^update/u
**Gợi ý sửa:** Đặt tên commit theo quy ước.
`);
  const remote = join(ws, 'remote.git'); sh(ws, 'init', '--bare', '-b', 'develop', remote);
  const fe = join(ws, 'src/vnr.hrm.web'); mkdirSync(join(ws, 'src')); sh(ws, 'clone', '-q', remote, fe);
  writeFileSync(join(fe, 'nx.json'), '{}'); mkdirSync(join(fe, 'apps')); writeFileSync(join(fe, 'apps/a.ts'), 'ok\n');
  sh(fe, 'add', '-A'); sh(fe, 'commit', '-qm', 'base'); sh(fe, 'push', '-qu', 'origin', 'develop');
  writeFileSync(join(fe, 'notes.txt'), 'n\n'); sh(fe, 'add', 'notes.txt'); sh(fe, 'commit', '-qm', 'update stuff');   // commit chưa push cho luật phạm vi commit
  writeFileSync(join(fe, 'apps/a.ts'), 'ok\nconst MOCK = 1; const TODO = 2;\n');
});
after(() => rmSync(ws, { recursive: true, force: true }));

test('check writes INDEX and digests', () => {
  const r = run('check', '--ws', ws);
  assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /3 luật đọc được/);
  assert.ok(existsSync(join(ws, 'docs/review/INDEX.md')) && existsSync(join(ws, '.claude/rules/review-fe.md')));
});

test('plan writes one job per FAIL candidate with a prompt; report renders from results', () => {
  const p = run('plan', '--ws', ws, '--state', state);
  assert.equal(p.status, 0, p.stderr); assert.match(p.stdout, /vnr\.hrm\.web/); assert.match(p.stdout, /1 job/);
  const plan = JSON.parse(readFileSync(join(state, 'plan-vnr.hrm.web.json'), 'utf8'));
  assert.equal(plan.jobs.length, 1); assert.equal(plan.regexWarnings.length, 2);
  assert.ok(plan.regexWarnings.some(w => w.code === 'SLOP-03' && /^\(commit [0-9a-f]+\)$/.test(w.file) && w.text === 'update stuff'), 'luật commit chạy trên commit, không trên dòng code');
  const jobFile = readdirSync(join(state, 'jobs/vnr.hrm.web')).find(f => f !== 'index.json');
  const index = JSON.parse(readFileSync(join(state, 'jobs/vnr.hrm.web/index.json'), 'utf8'));
  assert.deepEqual(Object.keys(index), ['repo', 'repoRoot', 'branch', 'baseline', 'jobs']);
  assert.equal(index.repo, 'vnr.hrm.web'); assert.equal(index.repoRoot, plan.repo.root); assert.equal(index.branch, plan.branch); assert.equal(index.baseline.ref, plan.baseline.ref);
  assert.deepEqual(index.jobs.map(j => [j.id, j.code, j.model, j.file, j.files, j.noIgnore]), [['SLOP-01__1', 'SLOP-01', 'haiku', 'apps/a.ts', ['apps/a.ts'], false]]);
  assert.match(readFileSync(join(state, 'started.json'), 'utf8'), /"startedAt":"\d{4}-/);
  const tpl = JSON.parse(readFileSync(join(state, 'verify-jobs/vnr.hrm.web/SLOP-01__1.template.json'), 'utf8'));
  assert.deepEqual(Object.keys(tpl).sort(), ['block', 'hunks', 'jobId', 'readMoreFiles', 'repoRoot']); assert.ok(tpl.hunks.length);
  const job = JSON.parse(readFileSync(join(state, 'jobs/vnr.hrm.web', jobFile), 'utf8'));
  assert.match(job.prompt, /ĐÚNG MỘT luật/); assert.match(job.prompt, /SLOP-01/); assert.match(job.prompt, /const MOCK = 1/); assert.match(job.prompt, /Từ điển\./);
  mkdirSync(join(state, 'results/vnr.hrm.web'), { recursive: true });
  writeFileSync(join(state, 'results/vnr.hrm.web', jobFile), JSON.stringify({ code: 'SLOP-01', verdict: 'FAIL', findings: [{ file: 'apps/a.ts', line: 2, excerpt: 'const MOCK = 1;', why: 'mock' }], needs_context: [] }));
  const r = run('report', '--state', state, '--ci', '--plugin-version', '1.1.0');
  assert.equal(r.status, 1); assert.match(r.stdout, /KẾT LUẬN: FAIL — 1 FAIL · 0 WARN · 2 nghi ngờ/); assert.match(r.stdout, /VERDICT:FAIL\s*$/);
  // Không truyền cờ: phiên bản plugin và thời gian chạy tự lấy từ plugin.json / started.json.
  const auto = run('report', '--state', state);
  assert.match(auto.stdout, /plugin vnr-swe \d+\.\d+/); assert.match(auto.stdout, /· \d+m\d\ds\)/);
  // Job FAIL rồi bị tắt: file kết quả hỏng bị bỏ qua và báo stderr, job hiện là "không có kết quả".
  writeFileSync(join(state, 'results/vnr.hrm.web', jobFile), '{oops');
  const bad = run('report', '--state', state, '--ci');
  assert.match(bad.stderr, /bỏ qua file kết quả hỏng: SLOP-01__1\.json/); assert.match(bad.stdout, /SLOP-01 apps\/a\.ts — không có kết quả/);
  assert.equal(bad.status, 0);
});

test('plan exits 2 when nothing changed', () => {
  const clean = mkdtempSync(join(os.tmpdir(), 'vnr-review-clean-'));
  try {
    mkdirSync(join(clean, 'docs/review/rules'), { recursive: true }); writeFileSync(join(clean, 'docs/review/rules/x.md'), readFileSync(join(ws, 'docs/review/rules/slop.md')));
    mkdirSync(join(clean, 'src')); sh(clean, 'clone', '-q', join(ws, 'remote.git'), join(clean, 'src/vnr.hrm.web'));
    const r = run('plan', '--ws', clean, '--state', join(clean, 'st'));
    assert.equal(r.status, 2); assert.match(r.stdout, /Không có thay đổi/);
  } finally { rmSync(clean, { recursive: true, force: true }); }
});

// --- Lỗi đầu vào & trạng thái ---
const tmp = prefix => mkdtempSync(join(os.tmpdir(), prefix));
const withTmp = (prefix, fn) => { const d = tmp(prefix); try { fn(d); } finally { rmSync(d, { recursive: true, force: true }); } };

test('plan --repo fe still resolves the be sibling and records it; stale state is purged', () => {
  withTmp('vnr-review-sib-', w => {
    mkdirSync(join(w, 'docs/review/rules'), { recursive: true });
    writeFileSync(join(w, 'docs/review/rules/slop.md'), readFileSync(join(ws, 'docs/review/rules/slop.md')));
    mkdirSync(join(w, 'src'));
    const fe = join(w, 'src/vnr.hrm.web'); sh(w, 'clone', '-q', join(ws, 'remote.git'), fe);
    writeFileSync(join(fe, 'apps/a.ts'), 'ok\nconst MOCK = 1;\n');
    const be = join(w, 'src/vnr.hrm.solution'); sh(w, 'init', '-q', be); writeFileSync(join(be, 'x.sln'), '');
    const st = join(w, 'st');
    mkdirSync(join(st, 'results/ghost'), { recursive: true }); writeFileSync(join(st, 'plan-ghost.json'), '{}');
    const p = run('plan', '--ws', w, '--repo', 'fe', '--state', st);
    assert.equal(p.status, 0, p.stdout + p.stderr);
    const plan = JSON.parse(readFileSync(join(st, 'plan-vnr.hrm.web.json'), 'utf8'));
    assert.equal(plan.siblings.be, be);
    assert.ok(!existsSync(join(st, 'plan-ghost.json')) && !existsSync(join(st, 'results/ghost')), 'state cũ phải bị xoá');
  });
});

test('plan --repo matching nothing exits 1', () => {
  const r = run('plan', '--ws', ws, '--repo', 'nope', '--state', join(ws, 'st-none'));
  assert.equal(r.status, 1); assert.match(r.stderr, /Không tìm thấy repo/);
});

test('bare value flag is a usage error', () => {
  const r = run('plan', '--ws', ws, '--state');
  assert.equal(r.status, 1); assert.match(r.stderr, /--state cần một giá trị/);
});

test('plan names an invalid config.json and exits 1', () => {
  withTmp('vnr-review-cfg-', w => {
    mkdirSync(join(w, 'docs/review/rules'), { recursive: true }); writeFileSync(join(w, 'docs/review/config.json'), '{oops');
    const r = run('plan', '--ws', w, '--state', join(w, 'st'));
    assert.equal(r.status, 1); assert.match(r.stderr, /config\.json không phải JSON hợp lệ/);
  });
});

test('plan without rules dir exits 1', () => {
  withTmp('vnr-review-norules-', w => {
    const r = run('plan', '--ws', w, '--state', join(w, 'st'));
    assert.equal(r.status, 1); assert.match(r.stderr, /Không thấy/);
  });
});

test('report on a missing state dir exits 4 with a message', () => {
  const r = run('report', '--state', join(ws, 'does-not-exist'));
  assert.equal(r.status, 4); assert.match(r.stderr, /Không thấy state dir/);
});

test('report on a state dir without plan-*.json exits 4 (no silent PASS)', () => {
  withTmp('vnr-review-empty-', d => {
    const r = run('report', '--state', d, '--ci');
    assert.equal(r.status, 4); assert.match(r.stderr, /Không có plan-\*\.json/);
  });
});

test('check without rules dir exits 1 with a message', () => {
  withTmp('vnr-review-nocheck-', w => {
    const r = run('check', '--ws', w);
    assert.equal(r.status, 1); assert.match(r.stderr, /Không thấy/);
  });
});

test('plan refuses --state equal to the workspace root and leaves it untouched', () => {
  writeFileSync(join(ws, 'plan-keep.json'), '{}');
  const r = run('plan', '--ws', ws, '--state', ws);
  assert.equal(r.status, 1); assert.match(r.stderr, /state không được là thư mục làm việc/);
  assert.ok(existsSync(join(ws, 'plan-keep.json')));
  rmSync(join(ws, 'plan-keep.json'));
});

test('plan refuses --state that is a file; a typo in --repo does not purge the previous state', () => {
  withTmp('vnr-review-st-', d => {
    const f = join(d, 'afile'); writeFileSync(f, 'x');
    let r = run('plan', '--ws', ws, '--state', f);
    assert.equal(r.status, 1); assert.match(r.stderr, /là một file/);
    const st = join(d, 'st'); mkdirSync(st); writeFileSync(join(st, 'plan-old.json'), '{}');
    r = run('plan', '--ws', ws, '--repo', 'nope', '--state', st);
    assert.equal(r.status, 1); assert.ok(existsSync(join(st, 'plan-old.json')));
  });
});

test('CLI runs when invoked through a symlink/junction', (t) => {
  withTmp('vnr-review-link-', d => {
    const link = join(d, 'link');
    try { symlinkSync(dirname(CLI), link, 'junction'); } catch { return t.skip('không tạo được symlink'); }
    const r = spawnSync(process.execPath, [join(link, 'cli.mjs'), '--help'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /vnr-review CLI/);
  });
});

// --- buildPrompt: gán file cho từng finding ---
const jobOf = extra => ({ code: 'X-01', aspect: 'x', section1: 'S', block: 'B', hunks: ['@@ h @@'], hits: [], readMore: { files: [], unresolved: [] }, ...extra });
const ATTRIB = /"file": đường dẫn ĐÚNG của file \(hoặc "\(commit <sha>\)" \/ "\(branch\)"\) chứa vi phạm — mỗi finding ghi file của chính nó/;

test('buildPrompt: job một file dùng đúng đường dẫn trong ví dụ', () => {
  const p = buildPrompt(jobOf({ file: 'apps/a.ts', files: ['apps/a.ts'] }));
  assert.match(p, /## Thay đổi cần xét — 1 file\n- apps\/a\.ts\n/); assert.match(p, /"file":"apps\/a\.ts"/); assert.match(p, ATTRIB);
});

test('buildPrompt: job nhiều file liệt kê đủ và không mặc định file đầu', () => {
  const p = buildPrompt(jobOf({ file: 'apps/a.ts', files: ['apps/a.ts', 'apps/b.ts', 'apps/c.ts'] }));
  assert.match(p, /— 3 file\n- apps\/a\.ts\n- apps\/b\.ts\n- apps\/c\.ts\n/);
  assert.doesNotMatch(p, /"file":"apps\/a\.ts"/); assert.match(p, /"file":"<file chứa vi phạm>"/); assert.match(p, ATTRIB);
});

test('buildPrompt: job commit / nhánh', () => {
  const c = buildPrompt(jobOf({ file: '(commit)', files: ['(commit abc1234567)'] }));
  assert.match(c, /— 1 commit chưa push\n- \(commit abc1234567\)\n/); assert.match(c, /"file":"\(commit abc1234567\)"/);
  assert.match(c, /\(không có gate — xem toàn bộ nội dung\)/); assert.match(c, ATTRIB);
  const b = buildPrompt(jobOf({ file: '(branch)', files: ['(branch)'] }));
  assert.match(b, /— tên nhánh\n/); assert.match(b, /"file":"\(branch\)"/);
});

test('report: --state trần và plan-*.json hỏng đều exit 4', () => {
  assert.equal(run('report', '--state').status, 4);
  withTmp('vnr-review-bad-', d => {
    writeFileSync(join(d, 'plan-x.json'), '{oops');
    const r = run('report', '--state', d);
    assert.equal(r.status, 4); assert.match(r.stderr, /lỗi khi tạo báo cáo/);
  });
});

test('plan chạy lại vào cùng --state xoá verify-jobs/ cũ', () => {
  withTmp('vnr-review-purge-', d => {
    const st = join(d, 'st');
    assert.equal(run('plan', '--ws', ws, '--state', st).status, 0);
    const stale = join(st, 'verify-jobs/vnr.hrm.web/OLD__9-0.json'); writeFileSync(stale, '{}');
    mkdirSync(join(st, 'verify/vnr.hrm.web'), { recursive: true }); writeFileSync(join(st, 'verify/vnr.hrm.web/OLD__9-0.json'), '{}');
    assert.equal(run('plan', '--ws', ws, '--state', st).status, 0);
    assert.ok(!existsSync(stale) && !existsSync(join(st, 'verify')), 'verify-jobs/ và verify/ cũ phải bị xoá');
    assert.ok(existsSync(join(st, 'verify-jobs/vnr.hrm.web/SLOP-01__1.template.json')));
  });
});

const miniPlan = (name, jobs = []) => ({
  repo: { name, kind: 'fe', root: '/x' }, baseline: { ref: 'origin/x' }, fileCount: 1, skippedFiles: [], branch: 'b', ruleSets: [], jobs,
  regexWarnings: [], ignored: [], invalidIgnores: [], skippedJobs: [], warnings: [], errors: [],
});

test('report nhiều repo: mỗi repo không có VERDICT riêng, chỉ một dòng VERDICT cuối = xấu nhất', () => {
  withTmp('vnr-review-multi-', d => {
    const job = { id: 'A-01__1', code: 'A-01', name: 'n', level: 'FAIL', file: 'a.ts', files: ['a.ts'], fix: '' };
    writeFileSync(join(d, 'plan-fe.json'), JSON.stringify(miniPlan('fe', [job])));
    writeFileSync(join(d, 'plan-be.json'), JSON.stringify(miniPlan('be')));
    mkdirSync(join(d, 'results/fe'), { recursive: true });
    writeFileSync(join(d, 'results/fe/A-01__1.json'), JSON.stringify({ code: 'A-01', verdict: 'FAIL', findings: [{ file: 'a.ts', line: 1, excerpt: 'x', why: 'y' }] }));
    const r = run('report', '--state', d, '--ci');
    assert.equal(r.status, 1);
    assert.equal((r.stdout.match(/^VERDICT:/gm) ?? []).length, 1);
    assert.match(r.stdout, /KẾT LUẬN: FAIL/); assert.match(r.stdout, /KẾT LUẬN: PASS/);
    assert.match(r.stdout, /\n\nVERDICT:FAIL\s*$/);
    assert.match(r.stdout, /^Tổng: (fe FAIL · be PASS|be PASS · fe FAIL)\n\n/, 'dòng Tổng ở đầu khi nhiều repo');
    assert.match(r.stdout, /^Tổng: [^\n]+\n\nKẾT LUẬN: (FAIL|PASS)[^\n]*\nReview  /, 'mỗi khối repo bắt đầu bằng KẾT LUẬN');
    // Cả hai PASS → VERDICT:PASS duy nhất.
    rmSync(join(d, 'results'), { recursive: true }); writeFileSync(join(d, 'plan-fe.json'), JSON.stringify(miniPlan('fe')));
    const ok = run('report', '--state', d, '--ci');
    assert.equal(ok.status, 0); assert.equal((ok.stdout.match(/^VERDICT:/gm) ?? []).length, 1); assert.match(ok.stdout, /VERDICT:PASS\s*$/);
  });
});

test('buildPrompt: luật noIgnore và luật cho phép ignore có câu khác nhau', () => {
  const yes = buildPrompt(jobOf({ file: 'a.ts', files: ['a.ts'], noIgnore: false }));
  assert.match(yes, /Chỉ marker `review-ignore <MÃ>: <lý do>` \(có lý do\) mới có hiệu lực\./); assert.doesNotMatch(yes, /KHÔNG cho bỏ qua/);
  const no = buildPrompt(jobOf({ file: 'a.ts', files: ['a.ts'], noIgnore: true }));
  assert.match(no, /Luật này KHÔNG cho bỏ qua — marker review-ignore không có hiệu lực\./); assert.doesNotMatch(no, /mới có hiệu lực/);
});

test('buildPrompt: placeholder khi không có dòng khớp, nhiều commit, file bị cắt hunk', () => {
  assert.match(buildPrompt(jobOf({ file: 'a.ts', files: ['a.ts'] })), /\(không có dòng khớp regex — xem toàn bộ hunk\)/);
  const c = buildPrompt(jobOf({ file: '(commit)', files: ['(commit a1)', '(commit b2)'] }));
  assert.match(c, /"file":"<commit chứa vi phạm>"/);
  const t = buildPrompt(jobOf({ file: 'a.ts', files: ['a.ts', 'b.ts'], truncated: ['b.ts'] }));
  assert.match(t, /Các file sau không kèm hunk \(quá dài\) — đọc khi cần:\n- b\.ts/);
  assert.doesNotMatch(buildPrompt(jobOf({ file: 'a.ts', files: ['a.ts'] })), /quá dài/);
});

test('CLI chạy được dù Node có --preserve-symlinks-main (gọi qua junction)', (t) => {
  withTmp('vnr-review-link2-', d => {
    const link = join(d, 'link');
    try { symlinkSync(dirname(CLI), link, 'junction'); } catch { return t.skip('không tạo được symlink'); }
    const r = spawnSync(process.execPath, ['--preserve-symlinks-main', '--preserve-symlinks', join(link, 'cli.mjs'), '--help'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /vnr-review CLI/);
  });
});

test('Node thiếu path.matchesGlob → exit 3 với thông báo rõ', () => {
  withTmp('vnr-review-node-', d => {
    const shim = join(d, 'shim.cjs');
    writeFileSync(shim, "Object.defineProperty(require('node:path'), 'matchesGlob', { value: undefined });");
    const r = spawnSync(process.execPath, ['-r', shim, CLI, '--help'], { encoding: 'utf8' });
    assert.equal(r.status, 3); assert.match(r.stderr, /vnr-review cần Node >= 22\.5 \(path\.matchesGlob\) — đang dùng /);
  });
});
