// plugins/vnr-swe/skills/vnr-review/scripts/plan.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, DEFAULT_CONFIG } from './plan.mjs';

const mkRule = (code, level, extra = {}) => ({ code, name: code, level, scope: ['apps/**/*.ts'], pathGates: [], regexGates: [/MOCK/u], regexHints: [], readMore: [], fix: 'sửa ' + code, noIgnore: false, model: null, block: 'B ' + code, blockForRepo: () => 'B ' + code, ...extra });
const mkSet = (aspect, rules) => ({ ok: true, aspect, repo: 'fe', version: '1', appliesTo: ['apps/**/*.ts'], excludes: ['**/*.spec.ts'], section1: 'S1 ' + aspect, rules, warnings: [], errors: [] });
const file = (p, texts) => ({ path: p, status: 'M', added: texts.map((t, i) => ({ n: i + 1, text: t })), hunks: ['@@ +1 @@'] });
const base = { repo: { name: 'vnr.hrm.web', kind: 'fe', root: '/tmp/x' }, baseline: { ref: 'origin/x', how: 'upstream' }, siblings: {}, commitMessages: '', full: false, aspects: null, config: DEFAULT_CONFIG };

test('FAIL rule with regex hit → job; WARN → regexWarnings; no hit → nothing', () => {
  const rules = { sets: [mkSet('slop', [mkRule('SLOP-01', 'FAIL'), mkRule('SLOP-02', 'WARN'), mkRule('SLOP-03', 'FAIL', { regexGates: [/NOPE/u] })])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, rules, diff: { files: [file('apps/a.ts', ['const MOCK = 1'])], skipped: [] } });
  assert.deepEqual(plan.jobs.map(j => j.code), ['SLOP-01']);
  assert.equal(plan.jobs[0].section1, 'S1 slop'); assert.equal(plan.jobs[0].model, 'haiku');
  assert.deepEqual(plan.regexWarnings.map(w => [w.code, w.n]), [['SLOP-02', 1]]);
});

test('reason của luật đi vào job và regexWarnings', () => {
  const rules = { sets: [mkSet('slop', [mkRule('SLOP-01', 'FAIL', { reason: 'lý do F' }), mkRule('SLOP-02', 'WARN', { reason: 'lý do W' })])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, rules, diff: { files: [file('apps/a.ts', ['MOCK'])], skipped: [] } });
  assert.equal(plan.jobs[0].reason, 'lý do F');
  assert.equal(plan.regexWarnings[0].reason, 'lý do W');
});

test('--full turns WARN hits into jobs; gate-less FAIL rule is one job (first in-scope file; spec excluded)', () => {
  const rules = { sets: [mkSet('slop', [mkRule('SLOP-02', 'WARN'), mkRule('SLOP-05', 'FAIL', { regexGates: [] })])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, full: true, rules, diff: { files: [file('apps/a.ts', ['MOCK']), file('apps/b.spec.ts', ['MOCK'])], skipped: [] } });
  assert.deepEqual(plan.jobs.map(j => j.code).sort(), ['SLOP-02', 'SLOP-05']);
  assert.ok(plan.jobs.every(j => j.file === 'apps/a.ts'), 'spec file excluded');
});

test('valid ignore removes the hit; ignore on noIgnore rule is invalid', () => {
  const rules = { sets: [mkSet('sec', [mkRule('SEC-01', 'FAIL', { noIgnore: true }), mkRule('SEC-02', 'FAIL', { regexGates: [/FAKE/u] })])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, rules, diff: { files: [file('apps/a.ts', ['MOCK // review-ignore SEC-01: vì', 'FAKE // review-ignore SEC-02: vì'])], skipped: [] } });
  assert.deepEqual(plan.jobs.map(j => j.code), ['SEC-01']);
  assert.equal(plan.ignored.length, 1);
  assert.equal(plan.invalidIgnores[0].code, 'SEC-01');
  assert.equal(plan.invalidIgnores[0].why, 'luật không cho bỏ qua');
});

test('commit-message ignore only applies to its own path', () => {
  const rules = { sets: [mkSet('sec', [mkRule('SEC-02', 'FAIL')])], warnings: [], errors: [] };
  const diff = { files: [file('apps/a.ts', ['MOCK'])], skipped: [] };
  const other = buildPlan({ ...base, commitMessages: 'review-ignore: SEC-02 apps/other.ts vì', rules, diff });
  assert.deepEqual(other.jobs.map(j => j.code), ['SEC-02']);
  assert.equal(other.ignored.length, 0);
  const own = buildPlan({ ...base, commitMessages: 'review-ignore: SEC-02 apps/a.ts vì', rules, diff });
  assert.equal(own.jobs.length, 0);
  assert.equal(own.ignored.length, 1);
});

test('cap by priority then hits; skipped listed deterministically', () => {
  const rules = { sets: [mkSet('uiux', [mkRule('UIUX-01', 'FAIL')]), mkSet('sec', [mkRule('SEC-01', 'FAIL')]), mkSet('name', [mkRule('NAME-01', 'FAIL')])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, config: { ...DEFAULT_CONFIG, maxJobs: 2 }, rules, diff: { files: [file('apps/a.ts', ['MOCK'])], skipped: [] } });
  assert.deepEqual(plan.jobs.map(j => j.code), ['SEC-01', 'NAME-01']);
  assert.deepEqual(plan.skippedJobs, [{ code: 'UIUX-01', file: 'apps/a.ts' }]);
});

test('--aspect filters sets; empty diff → no jobs', () => {
  const rules = { sets: [mkSet('uiux', [mkRule('UIUX-01', 'FAIL')]), mkSet('sec', [mkRule('SEC-01', 'FAIL')])], warnings: [], errors: [] };
  assert.deepEqual(buildPlan({ ...base, aspects: ['sec'], rules, diff: { files: [file('apps/a.ts', ['MOCK'])], skipped: [] } }).jobs.map(j => j.code), ['SEC-01']);
  assert.equal(buildPlan({ ...base, rules, diff: { files: [], skipped: [] } }).jobs.length, 0);
});

test('file-level rule (path-gate only): inline marker on any line suppresses the job', () => {
  const rules = { sets: [mkSet('sec', [mkRule('SEC-09', 'FAIL', { regexGates: [], pathGates: ['apps/a.ts'] })])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, rules, diff: { files: [file('apps/a.ts', ['x', 'y // review-ignore SEC-09: vì'])], skipped: [] } });
  assert.equal(plan.jobs.length, 0);
  assert.equal(plan.ignored.length, 1);
  assert.equal(plan.ignored[0].code, 'SEC-09');
});

test('WARN rule with every regex hit ignored → no job, no warning, ignore listed', () => {
  const rules = { sets: [mkSet('slop', [mkRule('SLOP-02', 'WARN')])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, rules, diff: { files: [file('apps/a.ts', ['MOCK // review-ignore SLOP-02: vì'])], skipped: [] } });
  assert.equal(plan.jobs.length, 0);
  assert.equal(plan.regexWarnings.length, 0);
  assert.equal(plan.ignored.length, 1);
});

// --- luật phạm vi commit/nhánh, luật FAIL không gate gộp một job, xếp hạng ---
const sk = (kind, extra = {}) => mkRule('NAME-90', 'WARN', { scopeKind: kind, scope: [], regexGates: [/^(?!feat|fix)/u], ...extra });
const commits = [{ sha: 'abc1234567', subject: 'update stuff', body: '' }, { sha: 'def', subject: 'fix(x): y', body: '' }];
const aDiff = { files: [file('apps/a.ts', ['MOCK'])], skipped: [] };

test('commit-scope WARN rule: one regex warning per matching commit, never runs on code files', () => {
  const rules = { sets: [mkSet('name', [sk('commit')])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, rules, diff: aDiff, commits });
  assert.equal(plan.jobs.length, 0);
  assert.deepEqual(plan.regexWarnings.map(w => [w.code, w.file, w.n, w.text]), [['NAME-90', '(commit abc1234567)', 0, 'update stuff']]);
});

test('commit-scope FAIL rule: one job (commit) listing matching commits', () => {
  const rules = { sets: [mkSet('name', [sk('commit', { level: 'FAIL' })])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, rules, diff: aDiff, commits });
  assert.equal(plan.jobs.length, 1);
  const j = plan.jobs[0];
  assert.equal(j.file, '(commit)'); assert.deepEqual(j.files, ['(commit abc1234567)']);
  assert.match(j.hunks.join('\n'), /@@ commit abc1234567 @@\n\+update stuff/);
  assert.deepEqual(j.hits, [{ n: 0, text: 'update stuff' }]); assert.deepEqual(j.readMore, { files: [], unresolved: [] });
});

test('commit-scope rule without gate → one job with ALL commits; body counts when subject does not match', () => {
  const rules = { sets: [mkSet('name', [sk('commit', { level: 'FAIL', regexGates: [] })])], warnings: [], errors: [] };
  assert.equal(buildPlan({ ...base, rules, diff: aDiff, commits }).jobs[0].files.length, 2);
  const r2 = { sets: [mkSet('name', [sk('commit', { regexGates: [/PBI/u] })])], warnings: [], errors: [] };
  const w = buildPlan({ ...base, rules: r2, diff: aDiff, commits: [{ sha: 'a1', subject: 'feat: x', body: 'PBI #1' }] }).regexWarnings;
  assert.deepEqual(w.map(x => x.file), ['(commit a1)']);
});

test('branch-scope rule: warning only when the branch name matches the regex', () => {
  const rules = { sets: [mkSet('name', [sk('branch', { regexGates: [/^(?!br\.)/u] })])], warnings: [], errors: [] };
  const w = buildPlan({ ...base, rules, diff: aDiff, branch: 'feature/x' }).regexWarnings;
  assert.deepEqual(w.map(x => [x.file, x.text]), [['(branch)', 'feature/x']]);
  assert.equal(buildPlan({ ...base, rules, diff: aDiff, branch: 'br.dev/u/t' }).regexWarnings.length, 0);
  const f = { sets: [mkSet('name', [sk('branch', { level: 'FAIL', regexGates: [/^(?!br.)/u] })])], warnings: [], errors: [] };
  const j = buildPlan({ ...base, rules: f, diff: aDiff, branch: 'feature/x' }).jobs[0];
  assert.equal(j.file, '(branch)'); assert.deepEqual(j.files, ['(branch)']);
});

const threeFiles = { files: ['apps/a.ts', 'apps/b.ts', 'apps/c.ts'].map(p => file(p, ['x'])), skipped: [] };

test('gate-less FAIL rule → ONE job over all in-scope files', () => {
  const rules = { sets: [mkSet('arch-fe', [mkRule('ARCH-FE-01', 'FAIL', { regexGates: [] })])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, rules, diff: threeFiles });
  assert.equal(plan.jobs.length, 1);
  const j = plan.jobs[0];
  assert.deepEqual(j.files, ['apps/a.ts', 'apps/b.ts', 'apps/c.ts']); assert.equal(j.file, 'apps/a.ts');
  for (const p of j.files) assert.ok(j.hunks.includes(`### ${p}`));
  assert.deepEqual(j.hits, []);
});

test('ranking: gated rule with hits outranks gate-less rule of a higher-priority aspect', () => {
  const rules = { sets: [mkSet('arch-fe', [mkRule('ARCH-FE-01', 'FAIL', { regexGates: [] })]), mkSet('slop', [mkRule('SLOP-01', 'FAIL')])], warnings: [], errors: [] };
  const diff = { files: [file('apps/a.ts', ['MOCK', 'MOCK'])], skipped: [] };
  assert.deepEqual(buildPlan({ ...base, rules, diff }).jobs.map(j => j.code), ['SLOP-01', 'ARCH-FE-01']);
});

test('per-file ignore drops one file from the gate-less job', () => {
  const rules = { sets: [mkSet('arch-fe', [mkRule('ARCH-FE-01', 'FAIL', { regexGates: [] })])], warnings: [], errors: [] };
  const diff = { files: [file('apps/a.ts', ['x // review-ignore ARCH-FE-01: vì']), file('apps/b.ts', ['x'])], skipped: [] };
  const plan = buildPlan({ ...base, rules, diff });
  assert.deepEqual(plan.jobs[0].files, ['apps/b.ts']); assert.equal(plan.ignored.length, 1);
  const all = { files: [file('apps/a.ts', ['x // review-ignore ARCH-FE-01: vì'])], skipped: [] };
  assert.equal(buildPlan({ ...base, rules, diff: all }).jobs.length, 0);
});

test('path-gate rộng + regex-gate không khớp: một job cho cả luật, xếp sau luật có hit', () => {
  const rules = { sets: [mkSet('arch-fe', [mkRule('ARCH-FE-01', 'FAIL', { pathGates: ['apps/**/*.ts'], regexGates: [/NOPE/u] })]), mkSet('slop', [mkRule('SLOP-01', 'FAIL')])], warnings: [], errors: [] };
  const diff = { files: [file('apps/a.ts', ['MOCK']), file('apps/b.ts', ['x']), file('apps/c.ts', ['x'])], skipped: [] };
  const jobs = buildPlan({ ...base, rules, diff }).jobs;
  assert.deepEqual(jobs.map(j => [j.code, j.files.length]), [['SLOP-01', 1], ['ARCH-FE-01', 3]]);
});

test('noIgnore của luật đi vào job', () => {
  const rules = { sets: [mkSet('sec', [mkRule('SEC-01', 'FAIL', { noIgnore: true }), mkRule('SEC-02', 'FAIL', { regexGates: [/FAKE/u] })])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, rules, diff: { files: [file('apps/a.ts', ['MOCK FAKE'])], skipped: [] } });
  assert.deepEqual(plan.jobs.map(j => [j.code, j.noIgnore]), [['SEC-01', true], ['SEC-02', false]]);
});

test('job gộp: hunk vượt trần 60 000 ký tự → file cuối bị cắt, chuyển vào readMore.files + truncated', () => {
  const rules = { sets: [mkSet('arch-fe', [mkRule('ARCH-FE-01', 'FAIL', { regexGates: [] })])], warnings: [], errors: [] };
  const big = p => ({ ...file(p, ['x']), hunks: ['y'.repeat(30000)] });
  const plan = buildPlan({ ...base, rules, diff: { files: ['apps/a.ts', 'apps/b.ts', 'apps/c.ts'].map(big), skipped: [] } });
  const j = plan.jobs[0];
  assert.deepEqual(j.files, ['apps/a.ts', 'apps/b.ts', 'apps/c.ts']);
  assert.deepEqual(j.truncated, ['apps/c.ts']);
  assert.ok(j.hunks.includes('### apps/b.ts') && !j.hunks.includes('### apps/c.ts'));
  assert.ok(j.readMore.files.includes('apps/c.ts'));
  // Không vượt trần → không có truncated.
  const ok = buildPlan({ ...base, rules, diff: threeFiles }).jobs[0];
  assert.deepEqual(ok.truncated ?? [], []);
});

test('maxJobsPerRule: luật trúng 7 file → 4 job đơn (nhiều hit nhất) + 1 job gộp 3 file', () => {
  const rules = { sets: [mkSet('arch-be', [mkRule('ARCH-01', 'FAIL')])], warnings: [], errors: [] };
  const hitsPer = [1, 5, 2, 4, 3, 1, 1];                                                       // a0..a6; hit nhiều nhất: a1, a3, a4, a2
  const files = hitsPer.map((n, i) => file(`apps/a${i}.ts`, Array(n).fill('MOCK')));
  const plan = buildPlan({ ...base, config: { ...DEFAULT_CONFIG, maxJobsPerRule: 4, maxJobs: 30 }, rules, diff: { files, skipped: [] } });
  const jobs = plan.jobs.filter(j => j.code === 'ARCH-01');
  assert.equal(jobs.length, 5);
  assert.deepEqual(jobs.filter(j => j.files.length === 1).map(j => j.file).sort(), ['apps/a1.ts', 'apps/a2.ts', 'apps/a3.ts', 'apps/a4.ts']);
  const merged = jobs.find(j => j.files.length > 1);
  assert.deepEqual(merged.files, ['apps/a0.ts', 'apps/a5.ts', 'apps/a6.ts']);
  assert.equal(merged.hits.length, 3);
  assert.deepEqual(merged.hunks.filter(h => h.startsWith('### ')), merged.files.map(f => `### ${f}`));
  assert.equal(plan.config.maxJobsPerRule, 4);
});

test('maxJobsPerRule: 0 → mọi file trúng gộp một job; ≤ giới hạn thì giữ job đơn', () => {
  const rules = { sets: [mkSet('arch-be', [mkRule('ARCH-01', 'FAIL')])], warnings: [], errors: [] };
  const files = [0, 1, 2].map(i => file(`apps/a${i}.ts`, ['MOCK']));
  const zero = buildPlan({ ...base, config: { ...DEFAULT_CONFIG, maxJobsPerRule: 0 }, rules, diff: { files, skipped: [] } });
  assert.equal(zero.jobs.length, 1); assert.equal(zero.jobs[0].files.length, 3);
  const three = buildPlan({ ...base, config: { ...DEFAULT_CONFIG, maxJobsPerRule: 3 }, rules, diff: { files, skipped: [] } });
  assert.equal(three.jobs.length, 3); assert.ok(three.jobs.every(j => j.files.length === 1));
});

test('job gộp do fan-out là hasHits: xếp trước luật không gate, và áp trần 60 000 ký tự', () => {
  const big = p => ({ ...file(p, ['MOCK']), hunks: ['x'.repeat(40_000)] });
  const rules = { sets: [mkSet('sec', [mkRule('SEC-09', 'FAIL', { regexGates: [] })]), mkSet('arch-be', [mkRule('ARCH-01', 'FAIL')])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, config: { ...DEFAULT_CONFIG, maxJobsPerRule: 0 }, rules, diff: { files: [big('apps/a.ts'), big('apps/b.ts')], skipped: [] } });
  assert.deepEqual(plan.jobs.map(j => j.code), ['ARCH-01', 'SEC-09']);
  assert.deepEqual(plan.jobs[0].truncated, ['apps/b.ts']);
  assert.ok(plan.jobs[0].readMore.files.includes('apps/b.ts'));
});

test('reserve: khía cạnh sec không bao giờ bị trần cắt', () => {
  const rules = { sets: [mkSet('arch-be', [mkRule('A-01', 'FAIL'), mkRule('A-02', 'FAIL'), mkRule('A-03', 'FAIL'), mkRule('A-04', 'FAIL')]), mkSet('sec', [mkRule('SEC-01', 'FAIL', { regexGates: [] })])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, config: { ...DEFAULT_CONFIG, maxJobs: 3 }, rules, diff: { files: [file('apps/a.ts', ['MOCK'])], skipped: [] } });
  assert.deepEqual(plan.jobs.map(j => j.code), ['A-01', 'A-02', 'SEC-01']);
  assert.deepEqual(plan.skippedJobs.map(s => s.code), ['A-03', 'A-04']);
  assert.deepEqual(plan.config.reserve, ['sec']);
});

test('reserve: ứng viên được giữ vượt maxJobs vẫn giữ hết, phần còn lại vào skippedJobs', () => {
  const rules = { sets: [mkSet('sec', [mkRule('SEC-01', 'FAIL'), mkRule('SEC-02', 'FAIL'), mkRule('SEC-03', 'FAIL')]), mkSet('name', [mkRule('N-01', 'FAIL')])], warnings: [], errors: [] };
  const plan = buildPlan({ ...base, config: { ...DEFAULT_CONFIG, maxJobs: 2 }, rules, diff: { files: [file('apps/a.ts', ['MOCK'])], skipped: [] } });
  assert.deepEqual(plan.jobs.map(j => j.code), ['SEC-01', 'SEC-02', 'SEC-03']);
  assert.deepEqual(plan.skippedJobs.map(s => s.code), ['N-01']);
});
