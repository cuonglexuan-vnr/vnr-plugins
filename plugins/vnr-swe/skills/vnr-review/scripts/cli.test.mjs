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
const WRONG_FOLDER = 'Không thấy docs/review/rules. Mở terminal tại thư mục vnr.hrm.wiki (nơi có docs/ và src/) rồi gõ lại /vnr-review.';
const REPO = 'vnr.hrm.web', CELL = 'fe_slop_1';
let ws, state;
const sh = (cwd, ...a) => execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd, encoding: 'utf8' });
const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
const readJson = f => JSON.parse(readFileSync(f, 'utf8'));
const tmp = prefix => mkdtempSync(join(os.tmpdir(), prefix));
const withTmp = (prefix, fn) => { const d = tmp(prefix); try { fn(d); } finally { rmSync(d, { recursive: true, force: true }); } };

const SLOP = `---
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
**Cần đọc thêm:** —
**Gợi ý sửa:** Bỏ mock.
### SLOP-02 — Ghi chú
**Mức độ:** WARN
**Gợi ý sửa:** Sửa comment.
### SLOP-03 — Commit message
**Mức độ:** WARN
**Phạm vi:** \`(commit message)\`
**Gợi ý sửa:** Đặt tên commit theo quy ước.
`;
const PROPOSED = `### SLOP-04 — Đề xuất
**Mức độ:** FAIL
**Trạng thái:** đề xuất
**Cách phát hiện:**
- regex-gate: notaregex
**Gợi ý sửa:** x.
`;
const NO_S1 = '---\nschema: "1"\naspect: other\nversion: "1"\nrepo: both\napplies_to:\n  - "apps/**/*.ts"\n---\n## 3. Các luật\n### OTH-01 — X\n**Mức độ:** WARN\n**Gợi ý sửa:** x.\n';

before(() => {
  ws = tmp('vnr-review-ws-'); state = join(ws, 'state');
  mkdirSync(join(ws, 'docs/review/rules'), { recursive: true });
  writeFileSync(join(ws, 'docs/review/config.json'), JSON.stringify({ maxJobs: 5 }));   // khoá v1 lạ: bị bỏ qua
  writeFileSync(join(ws, 'docs/review/rules/slop.md'), SLOP);
  const remote = join(ws, 'remote.git'); sh(ws, 'init', '--bare', '-b', 'develop', remote);
  const fe = join(ws, 'src', REPO); mkdirSync(join(ws, 'src')); sh(ws, 'clone', '-q', remote, fe);
  writeFileSync(join(fe, 'nx.json'), '{}'); mkdirSync(join(fe, 'apps')); writeFileSync(join(fe, 'apps/a.ts'), 'ok\n');
  sh(fe, 'add', '-A'); sh(fe, 'commit', '-qm', 'base'); sh(fe, 'push', '-qu', 'origin', 'develop');
  writeFileSync(join(fe, 'notes.txt'), 'n\n'); sh(fe, 'add', 'notes.txt'); sh(fe, 'commit', '-qm', 'update stuff');   // commit chưa push cho luật phạm vi commit
  writeFileSync(join(fe, 'apps/a.ts'), 'ok\nconst MOCK = 1; const TODO = 2;\n');
});
after(() => rmSync(ws, { recursive: true, force: true }));

// plan vào một state; trả stdout, plan và ledger đã ghi.
const planInto = st => {
  const p = run('plan', '--ws', ws, '--state', st);
  assert.equal(p.status, 0, p.stdout + p.stderr);
  return { p, plan: readJson(join(st, `plan-${REPO}.json`)), ledger: readJson(join(st, 'ledger.json')) };
};
const writeResult = (st, rules) => {
  mkdirSync(join(st, 'results', REPO), { recursive: true });
  writeFileSync(join(st, 'results', REPO, `${CELL}.json`), JSON.stringify({ cell: 'fe/slop/1', rules }));
};
const okRows = (slop01 = [], slop02 = []) => [
  { code: 'SLOP-01', status: 'checked', findings: slop01 }, { code: 'SLOP-02', status: 'checked', findings: slop02 }, { code: 'SLOP-03', status: 'n/a', note: 'commit ổn' },
];
const mock = line => ({ file: 'apps/a.ts', line, excerpt: 'const MOCK = 1;', issue: 'Dữ liệu mẫu trong code', fix: 'Bỏ hằng MOCK' });

test('check writes INDEX and digests', () => {
  const r = run('check', '--ws', ws);
  assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /3 luật đọc được/);
  assert.ok(existsSync(join(ws, 'docs/review/INDEX.md')) && existsSync(join(ws, '.claude/rules/review-fe.md')));
});

test('--help lists every command and the new exit codes', () => {
  const r = run('--help');
  assert.equal(r.status, 0);
  for (const c of ['plan', 'ledger', 'verify-jobs', 'report', 'check']) assert.match(r.stdout, new RegExp(`^  ${c} `, 'm'));
  assert.match(r.stdout, /ledger 0 ok \/ 4/); assert.match(r.stdout, /verify-jobs 0 ok \/ 4/); assert.match(r.stdout, /\(--ci\) incomplete coverage/);
  assert.doesNotMatch(r.stdout, /--model|--full/);
});

test('plan writes plan, ledger and one job + prompt per cell; no index.json', () => {
  const { p, plan, ledger } = planInto(state);
  const lines = p.stdout.trim().split('\n');
  assert.match(p.stdout, /^vnr\.hrm\.web @ \S+ \(vs origin\/develop, upstream\) · 2 file · 1 nhóm · 3 luật trong phạm vi · 1 lượt review$/m);
  assert.deepEqual(lines.slice(-3).map(l => l.split('=')[0]), ['STATE', 'PARALLEL', 'CELLS']);
  assert.equal(lines.at(-1), `CELLS=${ledger.cells.length}`); assert.equal(lines.at(-2), 'PARALLEL=8');
  assert.match(plan.sha7, /^[0-9a-f]{7}$/);
  assert.deepEqual(ledger.cells.map(c => [c.id, c.resultFile, c.attempts, c.failed]), [['fe/slop/1', `results/${REPO}/${CELL}.json`, 0, false]]);
  assert.deepEqual(readdirSync(join(state, 'jobs', REPO)).sort(), [`${CELL}.json`, `${CELL}.prompt.md`]);
  const job = readJson(join(state, 'jobs', REPO, `${CELL}.json`));
  assert.equal(job.id, 'fe/slop/1'); assert.equal(job.model, 'sonnet'); assert.ok(!('prompt' in job));
  assert.deepEqual(job.codes, ['SLOP-01', 'SLOP-02', 'SLOP-03']);
  const prompt = readFileSync(join(state, 'jobs', REPO, `${CELL}.prompt.md`), 'utf8');
  for (const c of job.codes) assert.ok(prompt.includes(c), c);
  assert.ok(prompt.includes('ĐÚNG MỘT dòng cho MỖI mã: SLOP-01, SLOP-02, SLOP-03'));
  assert.ok(prompt.includes(`Repo: ${plan.repo.root}.`)); assert.doesNotMatch(prompt, /CWD/);
  assert.match(prompt, /const MOCK = 1/); assert.match(prompt, /Từ điển\./); assert.match(prompt, /### \(commit [0-9a-f]+\)\n@@ commit/);
  assert.match(readFileSync(join(state, 'started.json'), 'utf8'), /"startedAt":"\d{4}-/);
});

test('plan: luật đề xuất được đếm, cảnh báo regex-gate bị ẩn, cảnh báo khác vẫn in', () => {
  withTmp('vnr-review-warn-', w => {
    mkdirSync(join(w, 'docs/review/rules'), { recursive: true });
    writeFileSync(join(w, 'docs/review/rules/slop.md'), SLOP + PROPOSED);
    writeFileSync(join(w, 'docs/review/rules/other.md'), NO_S1);
    mkdirSync(join(w, 'src')); const fe = join(w, 'src', REPO); sh(w, 'clone', '-q', join(ws, 'remote.git'), fe);
    writeFileSync(join(fe, 'apps/a.ts'), 'ok\nconst MOCK = 1;\n');
    const p = run('plan', '--ws', w, '--state', join(w, 'st'));
    assert.equal(p.status, 0, p.stdout + p.stderr);
    assert.match(p.stdout, / · 2 nhóm · 3 luật trong phạm vi · 2 lượt review · bỏ qua 1 luật đề xuất$/m);
    assert.doesNotMatch(p.stdout + p.stderr, /bỏ gate/);
    assert.match(p.stdout, /§1 rỗng/);
  });
});

test('ledger: không kết quả → RETRY 1, RETRY 2, rồi FAILED; ghi lại ledger.json', () => {
  withTmp('vnr-review-ledger-', d => {
    const st = join(d, 'st'); planInto(st);
    let r = run('ledger', '--state', st);
    assert.equal(r.status, 0, r.stderr); assert.equal(r.stdout.trim(), `RETRY ${REPO} ${CELL} sonnet 1\nPENDING=1 FAILED=0`);
    r = run('ledger', '--state', st);
    assert.equal(r.stdout.trim(), `RETRY ${REPO} ${CELL} sonnet 2\nPENDING=1 FAILED=0`);
    r = run('ledger', '--state', st);
    assert.equal(r.status, 0); assert.doesNotMatch(r.stdout, /RETRY/); assert.match(r.stdout, /^PENDING=0 FAILED=1$/m);
    const l = readJson(join(st, 'ledger.json'));
    assert.equal(l.cells[0].attempts, 2); assert.equal(l.cells[0].failed, true);
  });
});

test('ledger: ô đã có kết quả hợp lệ → không RETRY, PENDING=0, attempts không tăng', () => {
  withTmp('vnr-review-ledger-ok-', d => {
    const st = join(d, 'st'); planInto(st);
    writeResult(st, [{ code: 'SLOP-01', status: 'PASS', findings: null }, { code: 'SLOP-02' }, { code: 'SLOP-03', status: 'n/a' }]);
    for (let i = 0; i < 3; i++) assert.equal(run('ledger', '--state', st).stdout.trim(), 'PENDING=0 FAILED=0');
    assert.equal(readJson(join(st, 'ledger.json')).cells[0].attempts, 0);
  });
});

test('ledger: state hỏng / thiếu → exit 4', () => {
  assert.equal(run('ledger', '--state').status, 4);
  assert.equal(run('ledger').status, 4);
  withTmp('vnr-review-ledger-bad-', d => {
    const r = run('ledger', '--state', d);
    assert.equal(r.status, 4); assert.match(r.stderr, /ledger\.json/);
  });
});

test('verify-jobs: một job cho mỗi (mã FAIL, file trong diff); WARN và file ngoài diff không verify; chạy lại như cũ', () => {
  withTmp('vnr-review-vj-', d => {
    const st = join(d, 'st'); const { plan } = planInto(st);
    const f = plan.cells[0].files.indexOf('apps/a.ts');
    assert.equal(run('verify-jobs', '--state', st).stdout.trim(), 'VERIFY=0', 'chưa có kết quả → không job');
    writeResult(st, okRows([mock(2), mock(3), { ...mock(1), file: 'apps/zzz.ts' }], [{ ...mock(2), issue: 'TODO' }]));
    const r = run('verify-jobs', '--state', st);
    const key = `${CELL}-SLOP-01-${f}`;
    assert.equal(r.status, 0, r.stderr); assert.equal(r.stdout.trim(), `VERIFY ${REPO} ${key} sonnet\nVERIFY=1`);
    assert.deepEqual(readdirSync(join(st, 'verify-jobs', REPO)), [`${key}.json`]);
    const job = readJson(join(st, 'verify-jobs', REPO, `${key}.json`));
    assert.deepEqual(Object.keys(job).sort(), ['block', 'cell', 'code', 'file', 'findings', 'hunk', 'key', 'repoRoot']);
    assert.equal(job.repoRoot, plan.repo.root); assert.equal(job.cell, 'fe/slop/1'); assert.equal(job.code, 'SLOP-01'); assert.equal(job.file, 'apps/a.ts');
    assert.equal(job.key, key); assert.match(job.block, /SLOP-01/); assert.match(job.hunk, /const MOCK = 1/); assert.deepEqual(job.findings.map(x => x.line), [2, 3]);
    assert.equal(run('verify-jobs', '--state', st).stdout, r.stdout, 'idempotent');
    assert.deepEqual(readdirSync(join(st, 'verify-jobs', REPO)), [`${key}.json`]);
  });
});

test('verify-jobs: finding FAIL trên file giả (commit) cũng được verify, hunk là nội dung commit', () => {
  withTmp('vnr-review-vj2-', d => {
    const st = join(d, 'st'); const { plan } = planInto(st);
    const files = plan.cells[0].files, commit = files.find(x => x.startsWith('(commit '));
    const key = `${CELL}-SLOP-01-${files.indexOf(commit)}`;
    writeResult(st, okRows([{ ...mock(1), file: commit }]));
    assert.match(run('verify-jobs', '--state', st).stdout, new RegExp(`^VERIFY ${REPO} ${key} sonnet$`, 'm'));
    assert.match(readJson(join(st, 'verify-jobs', REPO, `${key}.json`)).hunk, /update stuff/);
  });
});

test('verify-jobs: finding ghi đường dẫn tuyệt đối có \\ hoặc ./ vẫn được verify (cùng một job)', () => {
  withTmp('vnr-review-vj3-', d => {
    const st = join(d, 'st'); const { plan } = planInto(st);
    const abs = join(plan.repo.root, 'apps', 'a.ts').replace(/\//g, '\\');
    writeResult(st, okRows([{ ...mock(2), file: abs }, { ...mock(3), file: './apps/a.ts' }]));
    const key = `${CELL}-SLOP-01-${plan.cells[0].files.indexOf('apps/a.ts')}`;
    const r = run('verify-jobs', '--state', st);
    assert.equal(r.stdout.trim(), `VERIFY ${REPO} ${key} sonnet
VERIFY=1`);
    const job = readJson(join(st, 'verify-jobs', REPO, `${key}.json`));
    assert.equal(job.file, 'apps/a.ts'); assert.deepEqual(job.findings.map(f => [f.file, f.line]), [['apps/a.ts', 2], ['apps/a.ts', 3]]);
  });
});

test('verify-jobs: state hỏng → exit 4', () => {
  assert.equal(run('verify-jobs', '--state').status, 4);
  withTmp('vnr-review-vj-bad-', d => assert.equal(run('verify-jobs', '--state', d).status, 4));
});

// --- report (cần renderReport của Task 3) ---
test('round-trip: plan → kết quả → verify-jobs → confirmed → report FAIL; wrong → dòng biến mất', () => {
  withTmp('vnr-review-rt-', d => {
    const st = join(d, 'st'); planInto(st);
    writeResult(st, okRows([mock(2)]));
    const key = run('verify-jobs', '--state', st).stdout.match(/^VERIFY \S+ (\S+) /m)[1];
    mkdirSync(join(st, 'verify', REPO), { recursive: true });
    writeFileSync(join(st, 'verify', REPO, `${key}.json`), JSON.stringify({ verdict: 'confirmed', reason: 'thấy MOCK' }));
    const r = run('report', '--state', st, '--plugin-version', '2.0.0');
    assert.equal(r.status, 1, r.stdout + r.stderr); assert.match(r.stdout, /^\| 1 \| FAIL \| SLOP-01 \| /m);
    assert.match(r.stdout, /^\*\*#1 · FAIL · SLOP-01\*\*$/m); assert.equal(r.stdout.trimEnd().split('\n').at(-1), 'VERDICT:FAIL');
    assert.match(r.stderr, /^rules: slop v2$/m);
    writeFileSync(join(st, 'verify', REPO, `${key}.json`), JSON.stringify({ verdict: 'wrong', reason: 'không phải mock' }));
    const ok = run('report', '--state', st, '--plugin-version', '2.0.0');
    assert.equal(ok.status, 0, ok.stdout + ok.stderr); assert.doesNotMatch(ok.stdout, /(FAIL|WARN) (\||·) SLOP-01/);
    assert.equal(ok.stdout.trimEnd().split('\n').at(-1), 'VERDICT:PASS');
  });
});

test('report --ci: ô thiếu kết quả → exit 4, stderr "Chưa kiểm hết"', () => {
  withTmp('vnr-review-ci-', d => {
    const st = join(d, 'st'); planInto(st);
    const r = run('report', '--state', st, '--ci');
    assert.equal(r.status, 4, r.stdout + r.stderr); assert.match(r.stderr, /Chưa kiểm hết/);
  });
});

test('report: mã lạ trong kết quả → stderr, không vào báo cáo', () => {
  withTmp('vnr-review-unk-', d => {
    const st = join(d, 'st'); planInto(st);
    writeResult(st, [...okRows(), { code: 'XX-99', status: 'checked', findings: [mock(2)] }]);
    const r = run('report', '--state', st);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stderr, /XX-99/); assert.doesNotMatch(r.stdout, /XX-99/);
  });
});

test('plan exits 2 when nothing changed, with the SE message', () => {
  withTmp('vnr-review-clean-', clean => {
    mkdirSync(join(clean, 'docs/review/rules'), { recursive: true }); writeFileSync(join(clean, 'docs/review/rules/x.md'), SLOP);
    mkdirSync(join(clean, 'src')); sh(clean, 'clone', '-q', join(ws, 'remote.git'), join(clean, 'src', REPO));
    const r = run('plan', '--ws', clean, '--state', join(clean, 'st'));
    assert.equal(r.status, 2); assert.equal(r.stdout.trim(), 'Không có thay đổi so với code đã push.');
  });
});

test('plan --repo fe still resolves the be sibling and records it; stale state is purged', () => {
  withTmp('vnr-review-sib-', w => {
    mkdirSync(join(w, 'docs/review/rules'), { recursive: true }); writeFileSync(join(w, 'docs/review/rules/slop.md'), SLOP);
    mkdirSync(join(w, 'src'));
    const fe = join(w, 'src', REPO); sh(w, 'clone', '-q', join(ws, 'remote.git'), fe);
    writeFileSync(join(fe, 'apps/a.ts'), 'ok\nconst MOCK = 1;\n');
    const be = join(w, 'src/vnr.hrm.solution'); sh(w, 'init', '-q', be); writeFileSync(join(be, 'x.sln'), '');
    const st = join(w, 'st');
    mkdirSync(join(st, 'results/ghost'), { recursive: true }); writeFileSync(join(st, 'plan-ghost.json'), '{}');
    const p = run('plan', '--ws', w, '--repo', 'fe', '--state', st);
    assert.equal(p.status, 0, p.stdout + p.stderr);
    const plan = readJson(join(st, `plan-${REPO}.json`));
    assert.equal(plan.siblings.be, be);
    assert.ok(readFileSync(join(st, 'jobs', REPO, `${CELL}.prompt.md`), 'utf8').includes(be), 'prompt nêu repo anh em');
    assert.ok(!existsSync(join(st, 'plan-ghost.json')) && !existsSync(join(st, 'results/ghost')), 'state cũ phải bị xoá');
  });
});

test('plan chạy lại vào cùng --state: ledger.json, verify-jobs/, verify/ cũ bị xoá và sinh lại', () => {
  withTmp('vnr-review-purge-', d => {
    const st = join(d, 'st'); planInto(st);
    const l = readJson(join(st, 'ledger.json')); l.cells[0].attempts = 7; l.stale = true; writeFileSync(join(st, 'ledger.json'), JSON.stringify(l));
    mkdirSync(join(st, 'verify-jobs', REPO), { recursive: true }); writeFileSync(join(st, 'verify-jobs', REPO, 'OLD.json'), '{}');
    mkdirSync(join(st, 'verify', REPO), { recursive: true }); writeFileSync(join(st, 'verify', REPO, 'OLD.json'), '{}');
    const { ledger } = planInto(st);
    assert.ok(!('stale' in ledger)); assert.equal(ledger.cells[0].attempts, 0);
    assert.ok(!existsSync(join(st, 'verify-jobs')) && !existsSync(join(st, 'verify')), 'verify-jobs/ và verify/ cũ phải bị xoá');
  });
});

test('plan --repo matching nothing exits 1', () => {
  const r = run('plan', '--ws', ws, '--repo', 'nope', '--state', join(ws, 'st-none'));
  assert.equal(r.status, 1); assert.match(r.stderr, /Không tìm thấy repo/);
});

test('bare value flag: plan exit 1, report/ledger/verify-jobs exit 4', () => {
  const r = run('plan', '--ws', ws, '--state');
  assert.equal(r.status, 1); assert.match(r.stderr, /--state cần một giá trị/);
  for (const c of ['report', 'ledger', 'verify-jobs']) assert.equal(run(c, '--state').status, 4, c);
});

test('plan names an invalid config.json and exits 1', () => {
  withTmp('vnr-review-cfg-', w => {
    mkdirSync(join(w, 'docs/review/rules'), { recursive: true }); writeFileSync(join(w, 'docs/review/config.json'), '{oops');
    const r = run('plan', '--ws', w, '--state', join(w, 'st'));
    assert.equal(r.status, 1); assert.match(r.stderr, /config\.json không phải JSON hợp lệ/);
  });
});

test('plan / check ở sai thư mục: thông báo cho SE, exit 1', () => {
  withTmp('vnr-review-norules-', w => {
    const r = run('plan', '--ws', w, '--state', join(w, 'st'));
    assert.equal(r.status, 1); assert.equal(r.stderr.trim(), WRONG_FOLDER);
    const c = run('check', '--ws', w);
    assert.equal(c.status, 1); assert.equal(c.stderr.trim(), WRONG_FOLDER);
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

test('report: plan-*.json hỏng → exit 4', () => {
  withTmp('vnr-review-bad-', d => {
    writeFileSync(join(d, 'plan-x.json'), '{oops');
    const r = run('report', '--state', d);
    assert.equal(r.status, 4); assert.match(r.stderr, /lỗi khi tạo báo cáo/);
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

// Đổi mức một luật trong plan-<repo>.json và job của ô (report đọc plan, verify-jobs đọc job).
const setLevel = (st, code, level) => {
  const pf = join(st, `plan-${REPO}.json`), jf = join(st, 'jobs', REPO, `${CELL}.json`);
  const plan = readJson(pf), job = readJson(jf);
  for (const c of [...plan.cells.filter(c => c.fileId === CELL), job]) c.rules.find(r => r.code === code).level = level;
  writeFileSync(pf, JSON.stringify(plan)); writeFileSync(jf, JSON.stringify(job));
};

test('luật FAIL+WARN: finding level WARN → không verify, dòng WARN; level FAIL → verify, confirmed → FAIL; thiếu level → WARN', () => {
  withTmp('vnr-review-lv-', d => {
    const st = join(d, 'st'); planInto(st); setLevel(st, 'SLOP-01', 'FAIL+WARN');
    const report = () => run('report', '--state', st, '--plugin-version', '2.0.0');
    writeResult(st, okRows([{ ...mock(2), level: 'WARN' }]));
    assert.equal(run('verify-jobs', '--state', st).stdout.trim(), 'VERIFY=0');
    let r = report(); assert.equal(r.status, 0, r.stdout + r.stderr); assert.match(r.stdout, /\| WARN \| SLOP-01 \|/); assert.match(r.stdout, /^VERDICT:WARN$/m);
    writeResult(st, okRows([mock(2)]));
    assert.equal(run('verify-jobs', '--state', st).stdout.trim(), 'VERIFY=0', 'thiếu level trên FAIL+WARN → WARN');
    writeResult(st, okRows([{ ...mock(2), level: 'FAIL' }]));
    const key = run('verify-jobs', '--state', st).stdout.match(/^VERIFY \S+ (\S+) /m)[1];
    mkdirSync(join(st, 'verify', REPO), { recursive: true });
    writeFileSync(join(st, 'verify', REPO, `${key}.json`), JSON.stringify({ verdict: 'confirmed', reason: 'x' }));
    r = report(); assert.equal(r.status, 1, r.stdout + r.stderr); assert.match(r.stdout, /\| FAIL \| SLOP-01 \|/); assert.match(r.stdout, /^VERDICT:FAIL$/m);
  });
});

test('verify-jobs: file bị cắt hunk vẫn gửi hunk thật (truncatedHunks), không bao giờ hunk rỗng', () => {
  withTmp('vnr-review-vj4-', d => {
    const st = join(d, 'st'); planInto(st);
    const jf = join(st, 'jobs', REPO, `${CELL}.json`), job = readJson(jf);
    const h = job.hunks.find(x => x.path === 'apps/a.ts');
    job.hunks = job.hunks.filter(x => x !== h); job.truncated = ['apps/a.ts']; job.truncatedHunks = { 'apps/a.ts': h.text };
    writeFileSync(jf, JSON.stringify(job));
    writeResult(st, okRows([mock(2)]));
    const key = run('verify-jobs', '--state', st).stdout.match(/^VERIFY \S+ (\S+) /m)[1];
    assert.match(readJson(join(st, 'verify-jobs', REPO, `${key}.json`)).hunk, /const MOCK = 1/);
  });
});

// --- buildPrompt(cell, plan) ---
const cellOf = extra => ({
  id: 'fe/x/1', aspect: 'x', title: 'Nhóm X', codes: ['X-01', 'X-02'], rules: [{ code: 'X-01', block: 'B1' }, { code: 'X-02', block: 'B2' }],
  files: ['a.ts'], hunks: [{ path: 'a.ts', text: '@@ -1 +1 @@\n+a' }], section1: 'S1', readMore: { files: [], unresolved: [] }, noIgnoreCodes: [], ...extra,
});
const planOf = { repo: { root: '/w/web' }, siblings: { be: '/w/sol' } };

test('buildPrompt: đầu prompt, repoRoot, anh em, khối luật, hunk, danh sách mã', () => {
  const p = buildPrompt(cellOf(), planOf);
  const lines = p.split('\n');
  assert.equal(lines[0], 'Bạn là reviewer. Áp dụng ĐÚNG 2 luật dưới đây (nhóm x — Nhóm X), không thêm luật từ trí nhớ.');
  assert.equal(lines[1], 'Repo: /w/web. Mọi đường dẫn dưới đây là tương đối với thư mục đó — ghép /w/web khi Read/Grep/Glob (Glob: path = /w/web). Repo anh em: be: /w/sol. KHÔNG sửa file.');
  assert.match(p, /\n## Từ điển nhóm x\nS1\n## Luật \(2\)\nB1\n\n---\n\nB2\n/);
  assert.match(p, /\n## Thay đổi cần xét — 1 file \(chỉ phần thay đổi; mở file để xem đầy đủ\)\n### a\.ts\n@@ -1 \+1 @@\n\+a\n/);
  assert.match(p, /TRỪ các luật: \(không có\)\./); assert.match(p, /\n## Nên đọc thêm: \(không có\)\n/);
  assert.match(p, /\n## Trả về — CHỈ một khối JSON, ĐÚNG MỘT dòng cho MỖI mã: X-01, X-02\n\{"cell":"fe\/x\/1","rules":\[\{"code":"<MÃ>","status":"checked\|n\/a"/);
  assert.match(p, /"findings":\[\{"file":"<path tương đối>","level":"FAIL\|WARN","line"/);
  assert.match(p, /`level`: FAIL nếu khớp "FAIL khi", WARN nếu khớp "WARN khi"; luật mức WARN → luôn WARN/);
  assert.match(p, /Mỗi chỗ vi phạm \(file \+ dòng\) là một finding riêng/);
  assert.doesNotMatch(p, /quá dài/);
});

test('buildPrompt: noIgnore, file bị cắt hunk, nên đọc thêm, không có anh em, thiếu title', () => {
  const p = buildPrompt(cellOf({ title: null, noIgnoreCodes: ['X-02'], files: ['a.ts', 'b.ts'], truncated: ['b.ts'], truncatedHunks: { 'b.ts': '@@ -1,2 +3,3 @@\n+a\n+b\n+c\n@@ -9 +10 @@\n+x\n@@ -20,4 +14,0 @@' }, readMore: { files: ['c.ts', '../sol/d.cs'], unresolved: [] } }), { repo: { root: '/w/web' } });
  assert.match(p, /\(nhóm x — x\)/); assert.match(p, /Repo anh em: \(không có\)\./); assert.match(p, /TRỪ các luật: X-02\./);
  assert.match(p, /— 2 file \(/); assert.match(p, /\nCác file sau quá dài nên không kèm hunk — Read trực tiếp, chỉ các dòng đã đổi:\n- b\.ts: dòng 3–5, 10\n/);
  assert.match(p, /\n## Nên đọc thêm: c\.ts, \.\.\/sol\/d\.cs\n/);
});
