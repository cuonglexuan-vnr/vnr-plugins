// plugins/vnr-swe/skills/vnr-review/scripts/report.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport } from './report.mjs';

const ROOT = 'D:\\ws\\src\\vnr.hrm.web';
const EN = 'apps/supertool/public/assets/i18n/EN.json';
const PANEL = 'libs/ui-framework/src/property-panel/property-panel.component.ts';
const HOST = 'apps/supertool/src/app/core/verdi-widget/supertool-verdi-host-actions.ts';

const rule = (code, level, fix = `Sửa ${code}.`) => ({ code, name: `Tên luật ${code}`, level, block: `### ${code}`, fix, noIgnore: false });
const mkCell = (kind, aspect, i, rules, files, extra = {}) => ({
  id: `${kind}/${aspect}/${i}`, fileId: `${kind}_${aspect}_${i}`, repo: extra.repo ?? 'vnr.hrm.web', kind, aspect, title: aspect.toUpperCase(),
  chunk: `${i}/1`, codes: rules.map(r => r.code), rules, files, hunks: [], ...extra,
});
// ruleSets suy ra từ các ô (một nhóm mỗi aspect), như buildPlan.
const mkPlan = ({ name = 'vnr.hrm.web', kind = 'fe', root = ROOT, cells, ...rest }) => {
  const ruleSets = [...Map.groupBy(cells, c => c.aspect)].map(([aspect, cs]) => ({ aspect, title: cs[0].title, version: '1', ruleCount: 9, inScope: cs.reduce((n, c) => n + c.codes.length, 0), skippedProposed: 0 }));
  return { repo: { name, kind, root }, branch: 'feat/x', sha7: 'a1b2c3d', fileCount: 12, untrackedCount: 0, cells, ruleSets, ignored: [], invalidIgnores: [], ...rest };
};
// Kết quả hợp lệ cho cả ô: mỗi mã một dòng checked, findings theo mã.
const ok = (cell, byCode = {}) => ({ cell: cell.id, rules: cell.codes.map(code => ({ code, status: 'checked', findings: byCode[code] ?? [] })) });
const render = (plans, results, verifications = {}, opts = {}) =>
  renderReport({ plans, ledger: { cells: [] }, results, verifications, elapsedMs: 160_000, pluginVersion: '2.0.0', ...opts });
const lines = text => text.split('\n').filter(Boolean);

// Ví dụ §7 của spec (BE): DATA-20 xác nhận FAIL, SLOP-11 (2 vị trí) và NAME-08 là WARN; 55 luật / 6 nhóm, 7 file bị cắt.
const SQL = 'SQL/PostgreSQL/Migration/script_seed_p071_job_relation_chart.sql';
const BUILDER = 'Src/Modules/Hre/Vnr.Hrm.Hre.Application/JobRelationChart/JobRelationChartBuilder.cs';
const CTRL = 'Src/Modules/Hre/Vnr.Hrm.Hre.Api/Controllers/JobRelationChartController.cs';
const BIG = Array.from({ length: 7 }, (_, i) => `Src/Generated/Big${i + 1}.cs`);
const fillers = (prefix, n) => Array.from({ length: n }, (_, i) => rule(`${prefix}-${String(i + 50).padStart(2, '0')}`, 'WARN'));
const beFiles = [SQL, BUILDER, CTRL, ...BIG];
const beCells = [
  mkCell('be', 'data', 1, [rule('DATA-20', 'FAIL'), ...fillers('DATA', 8)], beFiles, { truncated: BIG }),
  mkCell('be', 'slop', 1, [rule('SLOP-11', 'WARN'), ...fillers('SLOP', 8)], beFiles),
  mkCell('be', 'name', 1, [rule('NAME-08', 'WARN'), ...fillers('NAME', 8)], beFiles),
  ...['arch', 'sec', 'fw'].map((a, i) => mkCell('be', a, 1, fillers(a.toUpperCase(), i ? 9 : 10), beFiles)),
];
const s7Plan = mkPlan({ name: 'vnr.hrm.solution', kind: 'be', root: 'D:\\ws\\src\\vnr.hrm.solution', branch: 'feat/job-relation-chart', sha7: 'adbec63', fileCount: 58, untrackedCount: 2, cells: beCells });
const s7Results = {
  ...Object.fromEntries(beCells.slice(3).map(c => [c.fileId, ok(c)])),
  be_data_1: ok(beCells[0], { 'DATA-20': [{ file: SQL, line: 1, level: 'FAIL', issue: 'Script seed INSERT thẳng, không kiểm tra bản ghi đã có: chạy lại migration sẽ nhân đôi dữ liệu cấu hình', fix: 'bọc mỗi INSERT bằng `WHERE NOT EXISTS` theo khoá nghiệp vụ' }] }),
  be_slop_1: ok(beCells[1], { 'SLOP-11': [7, 31].map(line => ({ file: BUILDER, line, issue: 'Comment lặp lại đúng tên hàm, không nói thêm điều gì', fix: 'xoá comment, hoặc ghi lý do thay vì mô tả' })) }),
  be_name_1: ok(beCells[2], { 'NAME-08': [{ file: CTRL, line: 12, issue: 'Tên action <GetData> không nói dữ liệu gì', fix: 'đổi thành `GetJobRelationChart`' }] }),
};
const s7 = { plans: [s7Plan], results: { 'vnr.hrm.solution': s7Results }, verifications: { 'vnr.hrm.solution': { 'be_data_1-DATA-20-0': { verdict: 'confirmed' } } } };

// NAME-20 (6 vị trí) và FW-FE-33 xác nhận FAIL, UIUX-28 là WARN.
const name1 = mkCell('fe', 'name', 1, [rule('NAME-20', 'FAIL'), rule('NAME-05', 'WARN')], [EN]);
const fw1 = mkCell('fe', 'fw', 1, [rule('FW-FE-33', 'FAIL+WARN')], [PANEL]);
const ux1 = mkCell('fe', 'uiux', 1, [rule('UIUX-28', 'WARN')], [HOST]);
const fixturePlan = mkPlan({ branch: 'feat/verdi-post-approve', cells: [name1, fw1, ux1], ignored: [{ code: 'NAME-05', path: EN, line: 3, reason: 'x' }] });
const fixtureResults = {
  [name1.fileId]: ok(name1, { 'NAME-20': [6270, 6271, 6272, 6273, 6274, 6275].map(line => ({ file: EN, line, issue: 'Khoá i18n đặt sai quy ước (6 khoá)', fix: 'đổi sang dạng `verdi.widget.postApprove.hint`' })) }),
  [fw1.fileId]: ok(fw1, { 'FW-FE-33': [{ file: PANEL, line: 15, level: 'FAIL', issue: 'Lib dùng chung import thẳng ng-zorro', fix: 'khai ng-zorro là peer dependency của lib' }] }),
  [ux1.fileId]: ok(ux1, { 'UIUX-28': [{ file: HOST, line: 90, issue: 'Chọn nhiều trang rồi bấm hàng loạt chỉ xử lý trang đang xem', fix: 'gửi danh sách khoá đã chọn' }] }),
};
const fixtureVerify = { 'fe_name_1-NAME-20-0': { verdict: 'confirmed' }, 'fe_fw_1-FW-FE-33-0': { verdict: 'confirmed' } };

test('FAIL một repo: đúng khuôn §7 của spec (bảng tên file + thẻ đường dẫn đầy đủ + VERDICT)', () => {
  const r = render(s7.plans, s7.results, s7.verifications, { elapsedMs: 114_000 });
  assert.equal(r.text, [
    '## vnr-review — FAIL (1 FAIL · 2 WARN) · vnr.hrm.solution @ feat/job-relation-chart (adbec63) · 58 file (2 chưa git add) · 1m54s',
    '',
    '| # | Kết quả | Luật | Vị trí |',
    '|---|---|---|---|',
    '| 1 | FAIL | DATA-20 | script_seed_p071_job_relation_chart.sql:1 |',
    '| 2 | WARN | SLOP-11 | JobRelationChartBuilder.cs:7 (+1) |',
    '| 3 | WARN | NAME-08 | JobRelationChartController.cs:12 |',
    '',
    '**FAIL**: phải sửa trước khi push · **WARN**: nên xem; cố ý giữ thì ghi chú bỏ qua (xem user-guide)',
    '',
    '**#1 · FAIL · DATA-20**',
    `- Vị trí: \`${SQL}:1\``,
    '- Vấn đề: Script seed INSERT thẳng, không kiểm tra bản ghi đã có: chạy lại migration sẽ nhân đôi dữ liệu cấu hình',
    '- Sửa: bọc mỗi INSERT bằng `WHERE NOT EXISTS` theo khoá nghiệp vụ',
    '',
    '**#2 · WARN · SLOP-11**',
    '- Vị trí (2 chỗ):',
    `  - \`${BUILDER}:7\``,
    `  - \`${BUILDER}:31\``,
    '- Vấn đề: Comment lặp lại đúng tên hàm, không nói thêm điều gì',
    '- Sửa: xoá comment, hoặc ghi lý do thay vì mô tả',
    '',
    '**#3 · WARN · NAME-08**',
    `- Vị trí: \`${CTRL}:12\``,
    '- Vấn đề: Tên action &lt;GetData> không nói dữ liệu gì',
    '- Sửa: đổi thành `GetJobRelationChart`',
    '',
    'Đã kiểm 55 luật, đủ 6/6 nhóm · 0 chỗ bỏ qua theo ghi chú · 7 file quá lớn chưa đọc hết · vnr-review 2.0.0',
    '',
    'VERDICT:FAIL',
  ].join('\n'));
  assert.equal(r.verdict, 'FAIL'); assert.equal(r.incomplete, false); assert.deepEqual(r.coverage, { done: 55, total: 55 });
});

test('FE: bảng chỉ tên file, thẻ đủ đường dẫn; VERDICT luôn là dòng cuối dù không --ci', () => {
  const r = render([fixturePlan], { 'vnr.hrm.web': fixtureResults }, { 'vnr.hrm.web': fixtureVerify });
  assert.match(r.text, /^\| 1 \| FAIL \| NAME-20 \| EN\.json:6270 \(\+5\) \|$/m);
  assert.match(r.text, /^\| 2 \| FAIL \| FW-FE-33 \| property-panel\.component\.ts:15 \|$/m);
  assert.ok(r.text.includes(`**#1 · FAIL · NAME-20**\n- Vị trí (6 chỗ):\n${[6270, 6271, 6272, 6273, 6274, 6275].map(l => `  - \`${EN}:${l}\`\n`).join('')}- Vấn đề: Khoá i18n đặt sai quy ước (6 khoá)\n- Sửa: đổi sang dạng \`verdi.widget.postApprove.hint\`\n\n**#2 · FAIL · FW-FE-33**`));
  assert.match(r.text, /vnr-review 2\.0\.0\n\nVERDICT:FAIL$/);
  assert.doesNotMatch(r.text, /COVERAGE=|RULES=/, 'không --ci → không COVERAGE/RULES');
});

test('verify: confirmed → FAIL, wrong → bỏ dòng, thiếu → WARN; finding ngoài diff → WARN dù luật FAIL', () => {
  const res = { 'vnr.hrm.web': fixtureResults };
  const wrong = render([fixturePlan], res, { 'vnr.hrm.web': { ...fixtureVerify, 'fe_name_1-NAME-20-0': { verdict: 'wrong' } } });
  assert.doesNotMatch(wrong.text, /NAME-20/); assert.match(wrong.text, /\| FAIL \| FW-FE-33 /);
  const none = render([fixturePlan], res, {});
  assert.equal(none.verdict, 'WARN');
  assert.match(none.text, /\| WARN \| NAME-20 \|/); assert.doesNotMatch(none.text, /FAIL \| [A-Z]/);
  const out = { ...fixtureResults, [fw1.fileId]: ok(fw1, { 'FW-FE-33': [{ file: 'libs/other.ts', line: 3, issue: 'i', fix: 'f' }] }) };
  const r = render([fixturePlan], { 'vnr.hrm.web': out }, { 'vnr.hrm.web': fixtureVerify });
  assert.match(r.text, /\| WARN \| FW-FE-33 \| other\.ts:3 \|/); assert.match(r.text, /- Vị trí: `libs\/other\.ts:3`/);
});

test('một mã: FAIL lẫn WARN gộp một dòng mức FAIL, vị trí đầu là vị trí FAIL', () => {
  const c = mkCell('fe', 'slop', 1, [rule('SLOP-01', 'FAIL')], ['apps/a.ts', 'apps/b.ts']);
  const res = { [c.fileId]: ok(c, { 'SLOP-01': [{ file: 'apps/a.ts', line: 1, issue: 'chưa xác nhận' }, { file: 'apps/b.ts', line: 2, issue: 'đã xác nhận' }] }) };
  const r = render([mkPlan({ cells: [c] })], { 'vnr.hrm.web': res }, { 'vnr.hrm.web': { 'fe_slop_1-SLOP-01-1': { verdict: 'confirmed' } } });
  assert.match(r.text, /^\| 1 \| FAIL \| SLOP-01 \| b\.ts:2 \(\+1\) \|$/m);
  assert.match(r.text, /^\*\*#1 · FAIL · SLOP-01\*\*\n- Vị trí \(2 chỗ\):\n  - `apps\/b\.ts:2`\n  - `apps\/a\.ts:1`\n- Vấn đề: đã xác nhận\n/m);
  assert.match(r.text, /^## vnr-review — FAIL \(1 FAIL · 0 WARN\) · /);
});

test('chuẩn hoá dòng: file thiếu, path tuyệt đối Windows, dòng null/0, issue/fix thiếu, cắt 400, |, xuống dòng, (commit)/(branch)', () => {
  const c = mkCell('fe', 'slop', 1, [rule('A-01', 'WARN', 'Gợi ý | của luật'), rule('B-02', 'WARN'), rule('C-03', 'WARN'), rule('D-04', 'WARN'), rule('E-05', 'WARN'), rule('F-06', 'WARN')], ['apps/a.ts', '(commit abc1234)', '(branch)']);
  const long = 'x'.repeat(500);
  const res = { [c.fileId]: ok(c, {
    'A-01': [{ line: 4, issue: 'a | b\nc   d' }],
    'B-02': [{ file: `${ROOT}\\apps\\a.ts`, line: 0, issue: long, fix: long }],
    'C-03': [{ file: `${ROOT}\\apps\\sub\\zz.ts`, line: null, fix: 'f' }],
    'D-04': [{ file: '(commit abc1234)', line: 3, issue: 'commit sai quy ước', fix: 'đặt lại' }],
    'E-05': [{ file: './apps/a.ts', line: 7, issue: '```js\nx\n```', fix: 'f' }],
    'F-06': [{ file: '(branch)', issue: 'tên nhánh sai', fix: 'đổi tên' }],
  }) };
  const t = render([mkPlan({ cells: [c] })], { 'vnr.hrm.web': res }).text;
  const card = code => t.slice(t.indexOf(` · ${code}**`)).split('\n\n')[0].split('\n').slice(1);
  assert.match(t, /^\| \d+ \| WARN \| A-01 \| \(không rõ file\) \|$/m);
  assert.deepEqual(card('A-01'), ['- Vị trí: (không rõ file)', '- Vấn đề: a | b c d', '- Sửa: Gợi ý | của luật'], 'ngoài bảng không thoát |');
  assert.match(t, /^\| \d+ \| WARN \| B-02 \| a\.ts \|$/m, 'path Windows → tách theo /, chỉ tên file; dòng 0 → không :dòng');
  const [, issue, fix] = card('B-02');
  assert.equal(issue, `- Vấn đề: ${'x'.repeat(399)}…`); assert.equal(fix, `- Sửa: ${'x'.repeat(399)}…`);
  assert.equal(card('B-02')[0], '- Vị trí: `apps/a.ts`');
  assert.match(t, /^\| \d+ \| WARN \| C-03 \| zz\.ts \|$/m);
  assert.deepEqual(card('C-03'), ['- Vị trí: `apps/sub/zz.ts`', '- Vấn đề: Tên luật C-03', '- Sửa: f']);
  assert.match(t, /^\| \d+ \| WARN \| D-04 \| \(commit abc1234\) \|$/m, 'pseudo-file giữ nguyên, không :dòng');
  assert.equal(card('D-04')[0], '- Vị trí: (commit abc1234)');
  assert.match(t, /^\| \d+ \| WARN \| F-06 \| \(branch\) \|$/m); assert.equal(card('F-06')[0], '- Vị trí: (branch)');
  assert.match(t, /^\| \d+ \| WARN \| E-05 \| a\.ts:7 \|$/m);
  assert.doesNotMatch(t, /```/);
});

test('thẻ nhiều vị trí: liệt kê đủ, bỏ trùng, giữ thứ tự; tối đa 10 dòng rồi "… và n chỗ khác"; (+n) = số chỗ − 1', () => {
  const files = Array.from({ length: 12 }, (_, i) => `apps/f${i}.ts`);
  const c = mkCell('fe', 'slop', 1, [rule('M-01', 'WARN'), rule('M-02', 'WARN')], [...files, '(branch)']);
  const res = { [c.fileId]: ok(c, {
    'M-01': files.map((file, i) => ({ file, line: i + 1, issue: 'i' })),
    'M-02': [{ file: 'apps/f0.ts', line: 3 }, { file: 'apps/f1.ts' }, { file: 'apps/f0.ts', line: 3 }, { file: '(branch)', line: 9 }],
  }) };
  const t = render([mkPlan({ cells: [c] })], { 'vnr.hrm.web': res }).text;
  // Các dòng Vị trí của thẻ: từ sau tiêu đề thẻ tới trước "- Vấn đề".
  const loc = code => { const c = t.slice(t.indexOf(` · ${code}**`)).split('\n').slice(1); return c.slice(0, c.findIndex(l => l.startsWith('- Vấn đề'))); };
  assert.match(t, /^\| \d+ \| WARN \| M-01 \| f0\.ts:1 \(\+11\) \|$/m);
  assert.deepEqual(loc('M-01'), ['- Vị trí (12 chỗ):', ...files.slice(0, 10).map((f, i) => `  - \`${f}:${i + 1}\``), '  - … và 2 chỗ khác']);
  assert.match(t, /^\| \d+ \| WARN \| M-02 \| f0\.ts:3 \(\+2\) \|$/m);
  assert.deepEqual(loc('M-02'), ['- Vị trí (3 chỗ):', '  - `apps/f0.ts:3`', '  - `apps/f1.ts`', '  - (branch)']);
});

test('không có fix (cả finding lẫn luật) → thẻ không có dòng "Sửa"', () => {
  const c = mkCell('fe', 'slop', 1, [rule('SLOP-01', 'WARN', '')], ['apps/a.ts']);
  const res = { [c.fileId]: ok(c, { 'SLOP-01': [{ file: 'apps/a.ts', line: 1, issue: 'Dữ liệu mẫu' }] }) };
  const t = render([mkPlan({ cells: [c] })], { 'vnr.hrm.web': res }).text;
  assert.match(t, /^\| 1 \| WARN \| SLOP-01 \| a\.ts:1 \|$/m);
  assert.match(t, /^\| 1 \| WARN \| SLOP-01 \| a\.ts:1 \|\n\n\*\*FAIL\*\*: [^\n]*\n\n\*\*#1 · WARN · SLOP-01\*\*/m, 'chú giải ngay dưới bảng, trước thẻ');
  assert.match(t, /^- Vấn đề: Dữ liệu mẫu\n\nĐã kiểm /m);
  assert.doesNotMatch(t, /- Sửa:/);
});

test('thứ tự: FAIL trước, trong mức theo số vị trí giảm dần rồi mã; ≤ 10 dòng rồi dòng "+n dòng khác"', () => {
  const codes = Array.from({ length: 13 }, (_, i) => `W-${String(i + 1).padStart(2, '0')}`);
  const c = mkCell('fe', 'slop', 1, [rule('F-02', 'FAIL'), rule('F-01', 'FAIL'), ...codes.map(x => rule(x, 'WARN'))], ['apps/a.ts']);
  const at = n => Array.from({ length: n }, (_, i) => ({ file: 'apps/a.ts', line: i + 1, issue: 'i', fix: 'f' }));
  const byCode = { 'F-01': at(1), 'F-02': at(1), ...Object.fromEntries(codes.map(x => [x, at(1)])), 'W-13': at(3) };
  const r = render([mkPlan({ cells: [c] })], { 'vnr.hrm.web': { [c.fileId]: ok(c, byCode) } }, { 'vnr.hrm.web': { 'fe_slop_1-F-01-0': { verdict: 'confirmed' }, 'fe_slop_1-F-02-0': { verdict: 'confirmed' } } });
  const order = r.text.split('\n').filter(l => /^\| \d+ \|/.test(l)).map(l => l.split(' | ').slice(0, 3));
  assert.deepEqual(order.map(o => o[2]), ['F-01', 'F-02', 'W-13', 'W-01', 'W-02', 'W-03', 'W-04', 'W-05', 'W-06', 'W-07']);
  assert.deepEqual(order.map(o => o[0]), Array.from({ length: 10 }, (_, i) => `| ${i + 1}`), 'cột # đánh số 1..10 theo thứ tự hiển thị');
  assert.deepEqual(order.map(o => o[1]), ['FAIL', 'FAIL', ...Array(8).fill('WARN')], 'cột Kết quả chữ thường, không in đậm');
  assert.match(r.text, /^_\(\+5 dòng khác: W-08, W-09, W-10, W-11, W-12\)_$/m);
  const cards = r.text.split('\n').filter(l => /^\*\*#\d+ · /.test(l));
  assert.deepEqual(cards.map(l => l.match(/^\*\*#(\d+) · (\w+) · (\S+)\*\*$/).slice(1).join(' ')), order.map((o, i) => `${i + 1} ${o[1]} ${o[2]}`), 'thẻ cùng số, mức, mã với dòng bảng; ≤ 10');
  assert.ok(r.text.indexOf('**#10 · ') < r.text.indexOf('_(+5 dòng khác'), '"+n dòng khác" sau các thẻ');
  assert.ok(r.text.indexOf('**FAIL**: phải sửa') < r.text.indexOf('**#1 · '), 'chú giải trước thẻ đầu tiên');
  assert.match(r.text, /^## vnr-review — FAIL \(2 FAIL · 13 WARN\)/);
});

test('chưa kiểm hết: ⚠ cho từng nhóm thiếu, verdict WARN, --ci in COVERAGE', () => {
  const a1 = mkCell('be', 'arch', 1, [rule('ARCH-01', 'FAIL'), rule('ARCH-02', 'WARN')], ['a.cs']);
  const a2 = mkCell('be', 'arch', 2, [rule('ARCH-03', 'WARN')], ['a.cs']);
  const n1 = mkCell('be', 'name', 1, [rule('NAME-01', 'WARN')], ['a.cs']);
  const p = mkPlan({ name: 'vnr.hrm.api', kind: 'be', cells: [a1, a2, n1] });
  p.ruleSets[0].title = null;
  const res = { 'vnr.hrm.api': { [a1.fileId]: ok(a1), [n1.fileId]: ok(n1), [a2.fileId]: { rules: [] } } };
  const r = render([p], res);
  assert.equal(r.verdict, 'WARN'); assert.equal(r.incomplete, true); assert.deepEqual(r.coverage, { done: 3, total: 4 });
  assert.deepEqual(lines(r.text).slice(1), [
    '⚠ Chưa kiểm hết: nhóm "arch" còn 1 luật chưa xem. Gõ /vnr-review be để chạy lại.',
    'Đã kiểm 3 luật, đủ 1/2 nhóm · 0 chỗ bỏ qua theo ghi chú · vnr-review 2.0.0',
    'VERDICT:WARN',
  ]);
  assert.match(r.text, /để chạy lại\.\n\nĐã kiểm 3 luật/, 'mỗi dòng chân là một đoạn riêng');
  assert.match(r.text, /^## vnr-review — WARN · vnr\.hrm\.api @ feat\/x \(a1b2c3d\) · 12 file · 2m40s$/m);
  const ci = render([p], res, {}, { ci: true });
  assert.deepEqual(lines(ci.text).slice(-3), ['VERDICT:WARN', 'COVERAGE=3/4', 'RULES=arch v1 · name v1']);
});

test('PASS: tiêu đề + dòng chân + VERDICT; chưa git add; ghi chú bỏ qua bị từ chối; file quá lớn', () => {
  const c = mkCell('fe', 'slop', 1, [rule('SLOP-01', 'FAIL'), rule('SLOP-02', 'WARN')], ['apps/a.ts', 'apps/b.ts'], { truncated: ['apps/b.ts'] });
  const p = mkPlan({ cells: [c], untrackedCount: 2, invalidIgnores: [{ code: 'SEC-01' }, { code: 'SEC-01' }, { code: 'SEC-02' }] });
  const r = render([p], { 'vnr.hrm.web': { [c.fileId]: ok(c) } });
  assert.equal(r.verdict, 'PASS');
  assert.deepEqual(lines(r.text), [
    '## vnr-review — PASS · vnr.hrm.web @ feat/x (a1b2c3d) · 12 file (2 chưa git add) · 2m40s',
    'Đã kiểm 2 luật, đủ 1/1 nhóm · 0 chỗ bỏ qua theo ghi chú · 3 ghi chú bỏ qua không được chấp nhận (SEC-01, SEC-02) · 1 file quá lớn chưa đọc hết · vnr-review 2.0.0',
    'VERDICT:PASS',
  ]);
  assert.doesNotMatch(r.text, /\| # \||\*\*#|\*\*FAIL\*\*:/, 'PASS: không bảng, không thẻ, không chú giải');
});

test('không có luật nào trong phạm vi', () => {
  const r = render([mkPlan({ cells: [], fileCount: 3 })], { 'vnr.hrm.web': {} });
  assert.equal(r.verdict, 'PASS'); assert.equal(r.incomplete, false); assert.deepEqual(r.coverage, { done: 0, total: 0 });
  assert.deepEqual(lines(r.text).slice(1), ['Không có luật nào áp dụng cho 3 file thay đổi · vnr-review 2.0.0', 'VERDICT:PASS']);
});

test('nhiều repo: một tiêu đề (xấu nhất), ### mỗi repo, repo PASS một dòng; --ci RULES theo repo', () => {
  const be = mkCell('be', 'arch', 1, [rule('ARCH-01', 'WARN'), rule('ARCH-02', 'WARN')], ['a.cs'], { repo: 'vnr.hrm.api' });
  const api = mkPlan({ name: 'vnr.hrm.api', kind: 'be', root: 'D:\\ws\\src\\vnr.hrm.api', cells: [be], sha7: 'b2c3d4e', fileCount: 8 });
  const results = { 'vnr.hrm.web': fixtureResults, 'vnr.hrm.api': { [be.fileId]: ok(be) } };
  const r = render([fixturePlan, api], results, { 'vnr.hrm.web': fixtureVerify });
  assert.equal(r.verdict, 'FAIL'); assert.deepEqual(r.coverage, { done: 6, total: 6 });
  const t = r.text.split('\n');
  assert.equal(t[0], '## vnr-review — FAIL · vnr.hrm.web FAIL (2 FAIL · 1 WARN) · vnr.hrm.api PASS · 20 file · 2m40s');
  assert.equal(t[2], '### vnr.hrm.web (a1b2c3d)');
  assert.equal(t[4], '| # | Kết quả | Luật | Vị trí |');
  assert.deepEqual(t.slice(-3), ['### vnr.hrm.api — PASS · đã kiểm 2 luật', '', 'VERDICT:FAIL']);
  assert.equal(t.filter(l => l.startsWith('VERDICT:')).length, 1, 'một dòng VERDICT sau mọi mục repo');
  assert.equal(t.filter(l => l.startsWith('## ')).length, 1);
  const ci = render([fixturePlan, api], results, { 'vnr.hrm.web': fixtureVerify }, { ci: true });
  assert.match(ci.text, /^## vnr-review — FAIL · vnr\.hrm\.web FAIL \(2 FAIL · 1 WARN\) · vnr\.hrm\.api PASS · 20 file$/m);
  assert.deepEqual(lines(ci.text).slice(-4), ['VERDICT:FAIL', 'COVERAGE=6/6', 'RULES=vnr.hrm.web name v1 · fw v1 · uiux v1', 'RULES=vnr.hrm.api arch v1']);
  // Cột # đánh lại từ 1 trong mỗi mục repo.
  const both = render([fixturePlan, api], { ...results, 'vnr.hrm.api': { [be.fileId]: ok(be, { 'ARCH-01': [{ file: 'a.cs', line: 1, issue: 'i', fix: 'f' }] }) } }, { 'vnr.hrm.web': fixtureVerify });
  assert.deepEqual(both.text.split('\n').filter(l => /^\| \d+ \|/.test(l)).map(l => l.split(' | ')[0]), ['| 1', '| 2', '| 3', '| 1']);
  assert.deepEqual(both.text.split('\n').filter(l => /^\*\*#\d+/.test(l)).map(l => l.split(' · ')[0]), ['**#1', '**#2', '**#3', '**#1'], 'thẻ đánh số lại theo repo');
});

test('--ci: không thời gian; VERDICT/COVERAGE/RULES cuối', () => {
  const r = render([fixturePlan], { 'vnr.hrm.web': fixtureResults }, { 'vnr.hrm.web': fixtureVerify }, { ci: true });
  assert.match(r.text, /^## vnr-review — FAIL \(2 FAIL · 1 WARN\) · vnr\.hrm\.web @ feat\/verdi-post-approve \(a1b2c3d\) · 12 file$/m);
  assert.doesNotMatch(r.text, /\dm\d\ds/);
  assert.deepEqual(lines(r.text).slice(-3), ['VERDICT:FAIL', 'COVERAGE=4/4', 'RULES=name v1 · fw v1 · uiux v1']);
});

test('mã lạ trong kết quả → warnings (không vào báo cáo)', () => {
  const c = mkCell('fe', 'slop', 1, [rule('SLOP-01', 'WARN')], ['apps/a.ts']);
  const json = { rules: [{ code: 'SLOP-01', status: 'checked', findings: [] }, { code: 'XX-99', findings: [{ file: 'apps/a.ts', line: 1 }] }] };
  const r = render([mkPlan({ cells: [c] })], { 'vnr.hrm.web': { [c.fileId]: json } });
  assert.equal(r.verdict, 'PASS'); assert.equal(r.warnings.length, 1); assert.match(r.warnings[0], /XX-99/);
  assert.doesNotMatch(r.text, /XX-99/);
});

test('không fence, không chữ "ô" đứng riêng trong mọi đầu ra', () => {
  const a1 = mkCell('fe', 'arch', 1, [rule('ARCH-01', 'WARN')], ['a.ts']);
  const outs = [
    render([fixturePlan], { 'vnr.hrm.web': fixtureResults }, { 'vnr.hrm.web': fixtureVerify }),
    render(s7.plans, s7.results, s7.verifications),
    render([mkPlan({ cells: [a1] })], { 'vnr.hrm.web': {} }, {}, { ci: true }),
    render([mkPlan({ cells: [] })], { 'vnr.hrm.web': {} }),
  ];
  for (const { text } of outs) {
    assert.doesNotMatch(text, /```/);
    assert.doesNotMatch(text, /(^|[\s(])ô([\s)/.,]|$)/mu);
  }
});

test('level của finding: FAIL+WARN khớp "WARN khi" → WARN, không verify, không bị bỏ; khớp "FAIL khi" + confirmed → FAIL; luật FAIL thiếu level → FAIL', () => {
  const c = mkCell('fe', 'uiux', 1, [rule('UIUX-03', 'FAIL+WARN'), rule('F-01', 'FAIL')], ['apps/a.ts']);
  const at = (code, extra) => ({ [code]: [{ file: 'apps/a.ts', line: 1, issue: 'i', fix: 'f', ...extra }] });
  const rr = (byCode, v) => render([mkPlan({ cells: [c] })], { 'vnr.hrm.web': { [c.fileId]: ok(c, byCode) } }, { 'vnr.hrm.web': v });
  for (const verdict of ['confirmed', 'wrong']) {
    const w = rr(at('UIUX-03', { level: 'WARN' }), { 'fe_uiux_1-UIUX-03-0': { verdict } });
    assert.match(w.text, /^\| \d+ \| WARN \| UIUX-03 \|/m, verdict); assert.equal(w.verdict, 'WARN');
  }
  assert.match(rr(at('UIUX-03', {}), { 'fe_uiux_1-UIUX-03-0': { verdict: 'confirmed' } }).text, /WARN \| UIUX-03/, 'thiếu level → WARN');
  assert.match(rr(at('UIUX-03', { level: 'FAIL' }), { 'fe_uiux_1-UIUX-03-0': { verdict: 'confirmed' } }).text, /FAIL \| UIUX-03/);
  assert.match(rr(at('F-01', {}), { 'fe_uiux_1-F-01-0': { verdict: 'confirmed' } }).text, /FAIL \| F-01/);
});

test('md: < ngoài backtick (thẻ cũng như bảng) thoát thành &lt; (thẻ HTML không biến mất khi render); trong backtick giữ nguyên', () => {
  const c = mkCell('fe', 'uiux', 1, [rule('UIUX-01', 'WARN')], ['apps/a.html']);
  const res = { [c.fileId]: ok(c, { 'UIUX-01': [{ file: 'apps/a.html', line: 2, issue: 'Dùng <nz-select> thay `<select>`', fix: 'đổi <a> thành <button>' }] }) };
  const t = render([mkPlan({ cells: [c] })], { 'vnr.hrm.web': res }).text;
  assert.match(t, /^- Vấn đề: Dùng &lt;nz-select> thay `<select>`$/m);
  assert.match(t, /^- Sửa: đổi &lt;a> thành &lt;button>$/m);
});
