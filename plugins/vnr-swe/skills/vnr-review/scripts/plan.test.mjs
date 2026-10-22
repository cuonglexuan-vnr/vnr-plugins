// plugins/vnr-swe/skills/vnr-review/scripts/plan.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, DEFAULT_CONFIG } from './plan.mjs';

const mkRule = (code, extra = {}) => ({ code, name: code, level: 'FAIL', scopeKind: 'files', scope: ['**/*.ts'], readMore: [], fix: '', noIgnore: false, model: null, proposed: false, block: 'B ' + code, blockForRepo: () => 'B ' + code, ...extra });
const mkSet = (aspect, rules, extra = {}) => ({ aspect, title: null, version: '1', model: null, appliesTo: ['**/*.ts'], excludes: [], section1: 'S', rules, ...extra });
const mkRules = sets => ({ sets, warnings: [], errors: [] });
const file = (path, extra = {}) => ({ path, status: 'M', added: [], hunks: ['@@ -1 +1 @@\n+x'], ...extra });
const diff = { files: [file('a.ts')], skipped: [] };
const base = { repo: { name: 'vnr.hrm.web', kind: 'fe', root: '/tmp/x' }, baseline: { ref: 'origin/x', how: 'upstream' }, diff, siblings: {}, commitMessages: '', commits: [], branch: '', aspects: null, config: DEFAULT_CONFIG };
const codes = n => Array.from({ length: n }, (_, i) => `X-${String(i + 1).padStart(2, '0')}`);

test('DEFAULT_CONFIG cố định; khoá cũ bị bỏ qua, không lỗi', () => {
  assert.deepEqual(DEFAULT_CONFIG, { chunkSize: 20, cellBlockChars: 60_000, parallel: 8, skipProposed: true });
  const plan = buildPlan({ ...base, rules: mkRules([mkSet('x', [mkRule('X-01')])]), config: { maxJobs: 30 } });
  assert.deepEqual(plan.config, DEFAULT_CONFIG);
  assert.equal(plan.cells.length, 1);
});

test('chia ô theo số luật, FAIL trước (ổn định) rồi WARN', () => {
  // 25 luật xen kẽ: 15 FAIL/FAIL+WARN + 10 WARN.
  const rules = codes(25).map((c, i) => mkRule(c, { level: i % 5 < 3 ? (i % 2 ? 'FAIL+WARN' : 'FAIL') : 'WARN' }));
  const fails = rules.filter(r => r.level !== 'WARN').map(r => r.code), warns = rules.filter(r => r.level === 'WARN').map(r => r.code);
  assert.equal(fails.length, 15);
  const plan = buildPlan({ ...base, rules: mkRules([mkSet('x', rules)]) });
  assert.deepEqual(plan.cells.map(c => [c.id, c.fileId, c.chunk, c.chunkIndex, c.chunkCount]), [['fe/x/1', 'fe_x_1', '1/2', 1, 2], ['fe/x/2', 'fe_x_2', '2/2', 2, 2]]);
  assert.deepEqual(plan.cells[0].codes, [...fails, ...warns.slice(0, 5)]);
  assert.deepEqual(plan.cells[1].codes, warns.slice(5));
  const c = plan.cells[0];
  assert.equal(c.repo, 'vnr.hrm.web'); assert.equal(c.kind, 'fe'); assert.equal(c.aspect, 'x'); assert.equal(c.section1, 'S');
  assert.deepEqual(c.rules[0], { code: 'X-01', name: 'X-01', level: 'FAIL', block: 'B X-01', fix: '', noIgnore: false });
  assert.deepEqual(c.files, ['a.ts']); assert.deepEqual(c.hunks, [{ path: 'a.ts', text: '@@ -1 +1 @@\n+x' }]);
  assert.deepEqual(c.readMore, { files: [], unresolved: [] }); assert.deepEqual(c.noIgnoreCodes, []);
  assert.equal(c.truncated, undefined);
  assert.deepEqual(plan.ruleSets, [{ aspect: 'x', title: null, version: '1', ruleCount: 25, inScope: 25, skippedProposed: 0 }]);
});

test('chia ô theo độ dài khối luật', () => {
  const big = 'y'.repeat(25_000);
  const plan = buildPlan({ ...base, rules: mkRules([mkSet('x', codes(3).map(c => mkRule(c, { block: big, blockForRepo: () => big })))]) });
  assert.deepEqual(plan.cells.map(c => c.codes.length), [2, 1]);
  const one = buildPlan({ ...base, config: { ...DEFAULT_CONFIG, cellBlockChars: 10 }, rules: mkRules([mkSet('x', codes(2).map(c => mkRule(c, { block: big, blockForRepo: () => big })))]) });
  assert.deepEqual(one.cells.map(c => c.codes.length), [1, 1], 'luật vượt trần vẫn có ô riêng');
});

test('hai file luật cùng aspect → một nhóm: id duy nhất, một dòng ruleSets, version gộp, title của file đầu', () => {
  const a = mkSet('x', codes(15).map(c => mkRule(c)), { title: 'Nhóm X', version: '1', section1: 'S1' });
  const b = mkSet('x', codes(25).slice(15).map(c => mkRule(c)), { title: 'Khác', version: '2', section1: 'S2' });
  const plan = buildPlan({ ...base, rules: mkRules([a, b]) });
  const ids = plan.cells.map(c => c.id);
  assert.deepEqual(ids, ['fe/x/1', 'fe/x/2']); assert.equal(new Set(ids).size, ids.length);
  assert.equal(plan.ruleSets.length, 1);
  assert.deepEqual(plan.ruleSets[0], { aspect: 'x', title: 'Nhóm X', version: '1/2', ruleCount: 25, inScope: 25, skippedProposed: 0 });
  assert.equal(plan.cells[0].title, 'Nhóm X'); assert.equal(plan.cells[0].section1, 'S1\n\nS2');
  const v = buildPlan({ ...base, rules: mkRules([a, { ...b, version: '1' }]) });
  assert.equal(v.ruleSets[0].version, '1', 'version trùng không lặp');
});

test('phạm vi theo set của chính luật: excludes của set này không áp cho set kia', () => {
  const a = mkSet('x', [mkRule('X-01')], { excludes: ['a.ts'] }), b = mkSet('x', [mkRule('X-02')]);
  assert.deepEqual(buildPlan({ ...base, rules: mkRules([a, b]) }).cells[0].codes, ['X-02']);
});

test('luật đề xuất bị bỏ (đếm skippedProposed); skipProposed:false thì giữ; RETIRED luôn bỏ', () => {
  const set = mkSet('x', [mkRule('X-01'), mkRule('X-02', { proposed: true }), mkRule('X-03', { level: 'RETIRED' })]);
  const plan = buildPlan({ ...base, rules: mkRules([set]) });
  assert.deepEqual(plan.cells.map(c => c.codes), [['X-01']]);
  assert.equal(plan.ruleSets[0].skippedProposed, 1); assert.equal(plan.ruleSets[0].inScope, 1);
  const keep = buildPlan({ ...base, config: { ...DEFAULT_CONFIG, skipProposed: false }, rules: mkRules([set]) });
  assert.deepEqual(keep.cells.map(c => c.codes), [['X-01', 'X-02']]);
  assert.equal(keep.ruleSets[0].skippedProposed, 0);
});

test('luật ngoài phạm vi vắng mặt; nhóm 0 luật trong phạm vi không có trong ruleSets', () => {
  const plan = buildPlan({ ...base, rules: mkRules([mkSet('x', [mkRule('X-01'), mkRule('X-02', { scope: ['**/*.cs'] })]), mkSet('y', [mkRule('Y-01', { scope: ['**/*.cs'] })])]) });
  assert.deepEqual(plan.cells.map(c => c.codes), [['X-01']]);
  assert.deepEqual(plan.ruleSets.map(s => s.aspect), ['x']);
  assert.equal(plan.ruleSets[0].ruleCount, 2);
});

test('file của ô = hợp các file trong phạm vi của luật trong ô, theo thứ tự diff', () => {
  const d = { files: [file('b.html'), file('a.ts'), file('c.cs')], skipped: [] };
  const set = mkSet('x', [mkRule('X-01'), mkRule('X-02', { scope: ['**/*.html'] })], { appliesTo: ['**/*.ts', '**/*.html'] });
  const c = buildPlan({ ...base, diff: d, rules: mkRules([set]) }).cells[0];
  assert.deepEqual(c.files, ['b.html', 'a.ts']); assert.deepEqual(c.hunks.map(h => h.path), ['b.html', 'a.ts']);
});

test('luật tên nhánh: trong phạm vi khi có nhánh, file giả (branch); luật commit: (commit <sha>)', () => {
  const set = mkSet('name', [mkRule('N-01', { scopeKind: 'branch', scope: [] })]);
  const plan = buildPlan({ ...base, branch: 'feat/x', rules: mkRules([set]) });
  assert.deepEqual(plan.cells[0].files, ['(branch)']); assert.match(plan.cells[0].hunks[0].text, /feat\/x/);
  assert.equal(buildPlan({ ...base, branch: '', rules: mkRules([set]) }).cells.length, 0);
  const cm = mkSet('name', [mkRule('N-02', { scopeKind: 'commit', scope: [] })]);
  const commits = [{ sha: 'abc1234', subject: 'update stuff', body: 'chi tiết' }];
  const c = buildPlan({ ...base, commits, rules: mkRules([cm]) }).cells[0];
  assert.deepEqual(c.files, ['(commit abc1234)']);
  assert.deepEqual(c.hunks, [{ path: '(commit abc1234)', text: '@@ commit abc1234 @@\n+update stuff\n+chi tiết' }]);
  assert.equal(buildPlan({ ...base, commits: [], rules: mkRules([cm]) }).cells.length, 0);
});

test('model: luật > bộ luật > sonnet', () => {
  const m = (rm, sm) => buildPlan({ ...base, rules: mkRules([mkSet('x', [mkRule('X-01', { model: rm })], { model: sm })]) }).cells[0].model;
  assert.equal(m('opus', 'haiku'), 'opus'); assert.equal(m(null, 'haiku'), 'haiku'); assert.equal(m(null, null), 'sonnet');
});

test('hunk theo thứ tự diff, trần 60 000 ký tự; file thật đầu luôn giữ, file sau giữ nếu còn vừa, không thì → truncated (không dây chuyền)', () => {
  const sized = (p, n) => file(p, { hunks: ['z'.repeat(n)] });
  const rules = mkRules([mkSet('x', [mkRule('X-01')])]);
  const ok = buildPlan({ ...base, rules, diff: { files: [sized('c.ts', 50_000), sized('a.ts', 5_000), sized('b.ts', 5_000)], skipped: [] } }).cells[0];
  assert.deepEqual(ok.hunks.map(h => h.path), ['c.ts', 'a.ts', 'b.ts']); assert.equal(ok.truncated, undefined);
  const big = buildPlan({ ...base, rules, diff: { files: [sized('c.ts', 70_000), sized('a.ts', 5), sized('b.ts', 5)], skipped: [] } }).cells[0];
  assert.deepEqual(big.hunks.map(h => h.path), ['c.ts']); assert.deepEqual(big.truncated, ['a.ts', 'b.ts']);
  assert.deepEqual(big.files, ['c.ts', 'a.ts', 'b.ts']); assert.deepEqual(big.truncatedHunks, { 'a.ts': 'z'.repeat(5), 'b.ts': 'z'.repeat(5) });
  const skip = buildPlan({ ...base, rules, diff: { files: [sized('c.ts', 50_000), sized('a.ts', 30_000), sized('b.ts', 2_000)], skipped: [] } }).cells[0];
  assert.deepEqual(skip.hunks.map(h => h.path), ['c.ts', 'b.ts'], 'file nhỏ sau file bị cắt vẫn được giữ');
  assert.deepEqual(skip.truncated, ['a.ts']); assert.deepEqual(skip.truncatedHunks, { 'a.ts': 'z'.repeat(30_000) });
  assert.equal(ok.truncatedHunks, undefined);
});

test('commit/branch không tính vào trần hunk; file thật đầu vẫn luôn giữ', () => {
  const set = mkSet('x', [mkRule('X-01'), mkRule('X-02', { scopeKind: 'commit', scope: [] })]);
  const commits = [{ sha: 'abc1234', subject: 's', body: 'b'.repeat(70_000) }];
  const sized = (p, n) => file(p, { hunks: ['z'.repeat(n)] });
  const c = buildPlan({ ...base, commits, rules: mkRules([set]), diff: { files: [sized('c.ts', 55_000), sized('a.ts', 5_000)], skipped: [] } }).cells[0];
  assert.deepEqual(c.hunks.map(h => h.path), ['(commit abc1234)', 'c.ts', 'a.ts']); assert.equal(c.truncated, undefined);
});

test('marker review-ignore: hợp lệ → ignored; trên luật không cho bỏ qua → invalidIgnores, luật vẫn trong ô', () => {
  const set = mkSet('sec', [mkRule('SEC-01', { noIgnore: true }), mkRule('SEC-02')]);
  const added = [{ n: 1, text: 'x // review-ignore SEC-01: vì' }, { n: 2, text: 'y // review-ignore SEC-02: vì' }];
  const plan = buildPlan({ ...base, rules: mkRules([set]), diff: { files: [file('a.ts', { added })], skipped: [] } });
  assert.equal(plan.ignored.length, 1); assert.equal(plan.ignored[0].code, 'SEC-02');
  assert.equal(plan.invalidIgnores.length, 1); assert.equal(plan.invalidIgnores[0].code, 'SEC-01'); assert.equal(plan.invalidIgnores[0].why, 'luật không cho bỏ qua');
  assert.deepEqual(plan.cells[0].codes, ['SEC-01', 'SEC-02']); assert.deepEqual(plan.cells[0].noIgnoreCodes, ['SEC-01']);
  const bad = buildPlan({ ...base, rules: mkRules([set]), diff: { files: [file('a.ts', { added: [{ n: 1, text: '// review-ignore SEC-02' }] })], skipped: [] } });
  assert.equal(bad.invalidIgnores.length, 1); assert.equal(bad.ignored.length, 0);
});

test('lọc --aspect; số file, untracked, branch, file bị bỏ qua', () => {
  const rules = mkRules([mkSet('uiux', [mkRule('U-01')]), mkSet('sec', [mkRule('SEC-01')])]);
  const d = { files: [file('a.ts'), file('n.ts', { status: 'U' })], skipped: [{ path: 'big.bin' }] };
  const plan = buildPlan({ ...base, aspects: ['sec'], branch: 'feat/x', rules, diff: d });
  assert.deepEqual(plan.cells.map(c => c.aspect), ['sec']); assert.deepEqual(plan.ruleSets.map(s => s.aspect), ['sec']);
  assert.equal(plan.fileCount, 2); assert.equal(plan.untrackedCount, 1); assert.equal(plan.branch, 'feat/x');
  assert.deepEqual(plan.skippedFiles, [{ path: 'big.bin' }]);
  assert.deepEqual(plan.repo, { name: 'vnr.hrm.web', kind: 'fe', root: '/tmp/x' });
  assert.equal(buildPlan({ ...base, rules, diff: { files: [], skipped: [] } }).cells.length, 0);
});
