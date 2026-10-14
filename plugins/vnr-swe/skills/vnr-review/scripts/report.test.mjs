// plugins/vnr-swe/skills/vnr-review/scripts/report.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport } from './report.mjs';

const plan = {
  repo: { name: 'vnr.hrm.web', kind: 'fe' }, baseline: { ref: 'origin/feat/x', how: 'upstream' }, fileCount: 14, skippedFiles: [],
  ruleSets: [{ aspect: 'arch-fe', version: '1', ruleCount: 29 }, { aspect: 'slop', version: '2', ruleCount: 12 }],
  jobs: [
    { id: 'SLOP-01__1', code: 'SLOP-01', name: 'Dữ liệu mẫu không nối vào luồng chạy thật', level: 'FAIL', file: 'apps/x/seed.ts', fix: 'Thay nguồn tĩnh bằng adapter HTTP.' },
    { id: 'ARCH-FE-04__2', code: 'ARCH-FE-04', name: 'Thay đổi lib lõi đi PR riêng', level: 'FAIL', file: 'libs/ui/x.ts', fix: 'Tách PR.' },
    { id: 'FW-FE-12__3', code: 'FW-FE-12', name: 'Gọi API qua core service', level: 'FAIL+WARN', file: 'apps/x/p.ts', fix: 'Dùng SupertoolApiClient.' },
    { id: 'SLOP-10__4', code: 'SLOP-10', name: 'X', level: 'FAIL', file: 'apps/x/e.ts', fix: 'f' },
  ],
  regexWarnings: [
    { code: 'UIUX-07', name: 'Màu cứng', file: 'apps/x/b.component.ts', n: 9, text: 'color: #fff' },
    { code: 'UIUX-07', name: 'Màu cứng', file: 'apps/x/a.component.ts', n: 41, text: 'color: #000' },
    { code: 'NAME-FE-03', name: 'Tên file', file: 'libs/y/z.ts', n: 12, text: 'export class foo' },
  ],
  ignored: [{ code: 'SEC-03', path: 'apps/x/dev-proxy.ts', line: 9, reason: 'chỉ dùng cho env dev' }],
  invalidIgnores: [{ code: 'SEC-01', path: 'apps/x/a.ts', line: 2, why: 'luật không cho bỏ qua' }],
  skippedJobs: [{ code: 'UIUX-01', file: 'apps/z.ts' }], warnings: [], errors: [],
};
const results = {
  'SLOP-01__1': { code: 'SLOP-01', verdict: 'FAIL', findings: [{ file: 'apps/x/seed.ts', line: 349, excerpt: "export const WF_MODULES = ['a']", why: 'mock' }], needs_context: [] },
  'ARCH-FE-04__2': { code: 'ARCH-FE-04', verdict: 'FAIL', findings: [{ file: 'libs/ui/x.ts', line: 18, excerpt: 'x', why: 'y' }], needs_context: [] },
  'FW-FE-12__3': { code: 'FW-FE-12', verdict: 'WARN', findings: [{ file: 'apps/x/p.ts', line: 61, excerpt: 'this.http.get', why: 'z' }], needs_context: [] },
  'SLOP-10__4': { code: 'SLOP-10', verdict: 'NEEDS_CONTEXT', findings: [], needs_context: ['thiếu {be}/…/UserController.cs'] },
};

test('full report shape and verdict', () => {
  const { text, verdict } = renderReport(plan, { results, verifications: [{ jobId: 'SLOP-01__1', index: 0, verdict: 'confirmed' }, { jobId: 'ARCH-FE-04__2', index: 0, verdict: 'unsure' }], elapsedMs: 170000, pluginVersion: '1.1.0', ci: false });
  assert.equal(verdict, 'FAIL');
  assert.match(text, /^Review  vnr\.hrm\.web/m);
  assert.match(text, /Luật: arch-fe v1 · slop v2/);
  assert.match(text, /KẾT LUẬN: FAIL — 1 FAIL · 2 WARN · 3 nghi ngờ · 1 cần ngữ cảnh/);
  // Bảng tóm tắt ngay dưới KẾT LUẬN: FAIL → WARN → nghi ngờ, cột cuối căn phải.
  assert.match(text, /KẾT LUẬN: FAIL[^\n]*\n\n\| Mức      \| Mã         \| Luật +\| Số chỗ \|\n\|----------\|------------\|-+\|-------:\|\n\| FAIL     \| SLOP-01    \| Dữ liệu mẫu[^|]*\| +1 \|\n\| WARN     \| ARCH-FE-04 \|[^\n]*\n\| WARN     \| FW-FE-12   \|[^\n]*\n\| nghi ngờ \| UIUX-07    \| Màu cứng +\| +2 \|\n\| nghi ngờ \| NAME-FE-03 \|[^\n]*\| +1 \|\n\nFAIL\n/);
  // Nhóm theo luật: tên + (N chỗ), Vì, →, rồi các vị trí.
  assert.match(text, /^FAIL\n  SLOP-01  Dữ liệu mẫu[^\n]*  \(1 chỗ\)\n    Vì: mock\n    → Thay nguồn tĩnh bằng adapter HTTP\.\n    apps\/x\/seed\.ts:349 /m);
  assert.match(text, /^WARN\n  ARCH-FE-04 [^\n]*\(1 chỗ\)\n(.*\n)*    libs\/ui\/x\.ts:18   `x`  \(chưa chắc\)$/m);
  assert.match(text, /^Nghi ngờ \(3\) — chưa kiểm sâu; \/vnr-review --full để kiểm\n  UIUX-07  Màu cứng  \(2\)\n    apps\/x\/a\.component\.ts:41   `color: #000`\n    apps\/x\/b\.component\.ts:9   `color: #fff`\n  NAME-FE-03  Tên file  \(1\)\n    libs\/y\/z\.ts:12   `export class foo`$/m);
  assert.match(text, /Cần ngữ cảnh \(1\)\s+SLOP-10 .*UserController/);
  assert.match(text, /Bỏ qua có lý do \(1\)\s+SEC-03 apps\/x\/dev-proxy\.ts:9  "chỉ dùng cho env dev"/);
  assert.match(text, /Marker không hợp lệ \(1\)\s+SEC-01 .*luật không cho bỏ qua/);
  assert.match(text, /Chưa kiểm \(1\)\s+UIUX-01 apps\/z\.ts/);
  assert.match(text, /\nVERDICT:FAIL$/);
  assert.match(text, /2m50s/);
});

test('wrong verification drops finding; no findings → PASS; missing result → cần ngữ cảnh', () => {
  const p = { ...plan, jobs: [plan.jobs[0], plan.jobs[3]], regexWarnings: [], ignored: [], invalidIgnores: [], skippedJobs: [] };
  const r1 = renderReport(p, { results: { 'SLOP-01__1': results['SLOP-01__1'] }, verifications: [{ jobId: 'SLOP-01__1', index: 0, verdict: 'wrong' }], elapsedMs: 1000, pluginVersion: '1', ci: true });
  assert.equal(r1.verdict, 'WARN', 'missing SLOP-10 result → cần ngữ cảnh → WARN');
  assert.match(r1.text, /không có kết quả/);
  assert.doesNotMatch(r1.text, /^FAIL$/m);
  const r2 = renderReport({ ...p, jobs: [] }, { results: {}, verifications: [], elapsedMs: 1, pluginVersion: '1', ci: true });
  assert.equal(r2.verdict, 'PASS'); assert.match(r2.text, /KẾT LUẬN: PASS/); assert.match(r2.text, /VERDICT:PASS$/);
  assert.doesNotMatch(r2.text, /\d+m\d+s/, 'ci omits elapsed');
});

test('ci: true bỏ thời gian nhưng giữ header và VERDICT', () => {
  const { text } = renderReport(plan, { results, verifications: [], elapsedMs: 170000, pluginVersion: '1.1.0', ci: true });
  assert.doesNotMatch(text, /2m50s/);
  assert.match(text, /^Review  vnr\.hrm\.web/m);
  assert.match(text, /\nVERDICT:(FAIL|WARN|PASS)$/);
});

test('NEEDS_CONTEXT có danh sách → mỗi mục đúng một dòng, không thêm "không quyết được"', () => {
  const p = { ...plan, jobs: [plan.jobs[3]], regexWarnings: [], ignored: [], invalidIgnores: [], skippedJobs: [] };
  const r = { 'SLOP-10__4': { code: 'SLOP-10', verdict: 'NEEDS_CONTEXT', findings: [], needs_context: ['thiếu a.cs', 'thiếu b.cs'] } };
  const { text } = renderReport(p, { results: r, verifications: [], elapsedMs: 1, pluginVersion: '1', ci: true });
  assert.match(text, /Cần ngữ cảnh \(2\)/);
  assert.equal(text.split('\n').filter(l => /SLOP-10 apps\/x\/e\.ts — thiếu/.test(l)).length, 2);
  assert.doesNotMatch(text, /không quyết được/);
});

test('finding của job commit và job nhiều file', () => {
  const p = {
    ...plan, regexWarnings: [], ignored: [], invalidIgnores: [], skippedJobs: [],
    jobs: [
      { id: 'NAME-01__1', code: 'NAME-01', name: 'Commit', level: 'FAIL', file: '(commit)', files: ['(commit abc1234567)'], fix: '' },
      { id: 'ARCH-FE-01__2', code: 'ARCH-FE-01', name: 'Đa file', level: 'FAIL', file: 'a.ts', files: ['a.ts', 'b.ts'], fix: '' },
    ],
  };
  const r = { 'NAME-01__1': { code: 'NAME-01', verdict: 'FAIL', findings: [{ file: '(commit abc1234567)', line: 0, excerpt: 'update stuff', why: 'x' }], needs_context: [] },
    'ARCH-FE-01__2': { code: 'ARCH-FE-01', verdict: 'FAIL', findings: [{ file: 'b.ts', line: 3, excerpt: 'y', why: 'x' }, { line: 4, excerpt: 'z', why: 'x' }], needs_context: [] } };
  const { text } = renderReport(p, { results: r, verifications: [], elapsedMs: 1, pluginVersion: '1', ci: true });
  assert.match(text, /^    \(commit abc1234567\):0   `update stuff`$/m);
  assert.match(text, /^    b\.ts:3   `y`$/m);
  assert.match(text, /^    a\.ts:4   `z`$/m);
});

test('Vì: dùng why của checker, không có thì rơi về lý do của luật', () => {
  const p = { ...plan, jobs: [{ ...plan.jobs[0], reason: 'lý do luật' }, { ...plan.jobs[1], reason: 'lý do luật 2' }, { ...plan.jobs[2] }], regexWarnings: [], ignored: [], invalidIgnores: [], skippedJobs: [] };
  const r = { ...results, 'ARCH-FE-04__2': { code: 'ARCH-FE-04', verdict: 'FAIL', findings: [{ file: 'libs/ui/x.ts', line: 18, excerpt: 'x' }], needs_context: [] } };
  const { text } = renderReport(p, { results: r, elapsedMs: 1, pluginVersion: '1', ci: true });
  assert.match(text, /\(1 chỗ\)\n    Vì: mock\n    → Thay nguồn[^\n]*\n    apps\/x\/seed\.ts:349   `export const WF_MODULES = \['a'\]`/);
  assert.match(text, /\(1 chỗ\)\n    Vì: lý do luật 2\n    → Tách PR\.\n    libs\/ui\/x\.ts:18   `x`/);
  assert.match(text, /\(1 chỗ\)\n    Vì: z\n    → Dùng SupertoolApiClient\.\n    apps\/x\/p\.ts:61   `this\.http\.get`/);
  const noWhy = renderReport({ ...p, jobs: [p.jobs[2]] }, { results: { 'FW-FE-12__3': { code: 'FW-FE-12', verdict: 'WARN', findings: [{ file: 'a', line: 1, excerpt: 'e' }] } }, elapsedMs: 1, pluginVersion: '1', ci: true }).text;
  assert.doesNotMatch(noWhy, /Vì:/);
});

test('Vì sao: một dòng dưới mỗi mã nghi ngờ, bỏ khi lý do rỗng', () => {
  const w = (code, n, reason) => ({ code, name: 'N', file: `f${n}.ts`, n, text: 't', reason });
  const p = { ...clean, jobs: [], regexWarnings: [w('A-1', 1, 'lý do A'), w('A-1', 2, 'lý do A'), w('B-1', 3, '')] };
  const { text } = renderReport(p, { ...opts, results: {} });
  assert.equal((text.match(/Vì sao:/g) ?? []).length, 1);
  assert.match(text, /  A-1  N  \(2\)\n    Vì sao: lý do A\n    f1\.ts:1/);
  assert.match(text, /  B-1  N  \(1\)\n    f3\.ts:3/);
});

const clean = { ...plan, regexWarnings: [], ignored: [], invalidIgnores: [], skippedJobs: [] };
const opts = { elapsedMs: 1, pluginVersion: '1', ci: true };

test('finalLine: false bỏ dòng VERDICT cuối; mặc định có', () => {
  const p = { ...clean, jobs: [] };
  assert.doesNotMatch(renderReport(p, { ...opts, results: {}, finalLine: false }).text, /VERDICT:/);
  assert.match(renderReport(p, { ...opts, results: {} }).text, /\nVERDICT:PASS$/);
});

test('PASS khớp chặt dòng KẾT LUẬN', () => {
  assert.match(renderReport({ ...clean, jobs: [] }, { ...opts, results: {} }).text, /KẾT LUẬN: PASS\n/);
});

test('job nhiều file: Cần ngữ cảnh hiện (N file), finding giữ file riêng', () => {
  const p = { ...clean, jobs: [{ id: 'A__1', code: 'A-01', name: 'n', level: 'FAIL', file: 'a.ts', files: ['a.ts', 'b.ts', 'c.ts'], fix: '' }] };
  const miss = renderReport(p, { ...opts, results: {} }).text;
  assert.match(miss, /A-01 \(3 file\) — không có kết quả/); assert.doesNotMatch(miss, /A-01 a\.ts/);
  const ctx = renderReport(p, { ...opts, results: { A__1: { verdict: 'NEEDS_CONTEXT', findings: [], needs_context: ['thiếu x'] } } }).text;
  assert.match(ctx, /A-01 \(3 file\) — thiếu x/);
});

test('verdict FAIL/WARN không kèm finding → cần ngữ cảnh; PASS kèm finding → WARN', () => {
  const job = { id: 'A__1', code: 'A-01', name: 'n', level: 'FAIL', file: 'a.ts', files: ['a.ts'], fix: '' };
  const p = { ...clean, jobs: [job] };
  for (const v of ['FAIL', 'WARN']) {
    const r = renderReport(p, { ...opts, results: { A__1: { verdict: v, findings: [], needs_context: [] } } });
    assert.equal(r.verdict, 'WARN'); assert.match(r.text, new RegExp(`verdict ${v} không kèm finding — kết quả không nhất quán`));
    assert.doesNotMatch(r.text, /^FAIL$/m);
  }
  const r = renderReport(p, { ...opts, results: { A__1: { verdict: 'PASS', findings: [{ file: 'a.ts', line: 1, excerpt: 'x', why: 'y' }], needs_context: [] } } });
  assert.equal(r.verdict, 'WARN'); assert.match(r.text, /^WARN\n  A-01 [^\n]*\(1 chỗ\)/m);
});

test('clip ghi chú needs_context (200) và lý do bỏ qua (100)', () => {
  const job = { id: 'A__1', code: 'A-01', name: 'n', level: 'FAIL', file: 'a.ts', files: ['a.ts'], fix: '' };
  const p = { ...clean, jobs: [job], ignored: [{ code: 'S-1', path: 'x.ts', line: 1, reason: 'r'.repeat(300) }] };
  const { text } = renderReport(p, { ...opts, results: { A__1: { verdict: 'NEEDS_CONTEXT', findings: [], needs_context: ['n'.repeat(500)] } } });
  assert.ok(!/n{201}/.test(text) && /n{200}/.test(text)); assert.ok(!/r{101}/.test(text) && /r{100}/.test(text));
});

test('nghi ngờ: tối đa 5 dòng/luật, cắt excerpt 80, giữ thứ tự mã, mục commit in (commit …):0', () => {
  const hit = (n, text = 't') => ({ code: 'W-1', name: 'Luật', file: `f${n}.ts`, n, text });
  const p = {
    ...clean, jobs: [],
    regexWarnings: [...[7, 6, 5, 4, 3, 2, 1].map(n => hit(n)), { code: 'W-0', name: 'Commit', file: '(commit abc1234567)', n: 0, text: 'x'.repeat(200) }],
  };
  const { text } = renderReport(p, { ...opts, results: {} });
  assert.match(text, /Nghi ngờ \(8\)/);
  assert.ok(text.indexOf('W-1  Luật  (7)') < text.indexOf('W-0  Commit  (1)'), 'first-seen order');
  const lines = text.split('\n').filter(l => /^    f\d\.ts:\d/.test(l));
  assert.deepEqual(lines.map(l => l.trim().split(' ')[0]), ['f1.ts:1', 'f2.ts:2', 'f3.ts:3', 'f4.ts:4', 'f5.ts:5']);
  assert.match(text, /^    … và 2 dòng nữa$/m);
  assert.match(text, /^    \(commit abc1234567\):0   `x{80}`$/m);
  assert.equal((text.match(/… và/g) ?? []).length, 1);
  assert.match(text, /KẾT LUẬN: WARN — 0 FAIL · 0 WARN · 8 nghi ngờ/);
});

test('nhóm theo mã luật: Vì/→ in một lần, mỗi vị trí một dòng, lý do riêng khác thì in dưới vị trí', () => {
  const p = { ...clean, jobs: [
    { id: 'N-20__1', code: 'N-20', name: 'Khoá i18n', level: 'FAIL', file: 'EN.json', fix: 'Đặt khoá camelCase.', reason: 'lý do luật' },
    { id: 'N-20__2', code: 'N-20', name: 'Khoá i18n', level: 'FAIL', file: 'VN.json', fix: 'Đặt khoá camelCase.', reason: 'lý do luật' },
  ] };
  const r = {
    'N-20__1': { code: 'N-20', verdict: 'FAIL', findings: [{ file: 'EN.json', line: 1, excerpt: 'a', why: 'snake' }, { file: 'EN.json', line: 2, excerpt: 'b', why: 'snake' }], needs_context: [] },
    'N-20__2': { code: 'N-20', verdict: 'FAIL', findings: [{ file: 'VN.json', line: 3, excerpt: 'c', why: 'khác' }], needs_context: [] },
  };
  const { text } = renderReport(p, { ...opts, results: r });
  assert.match(text, /^FAIL\n  N-20  Khoá i18n  \(3 chỗ\)\n    Vì: snake\n    → Đặt khoá camelCase\.\n    EN\.json:1   `a`\n    EN\.json:2   `b`\n    VN\.json:3   `c`\n      Vì: khác$/m);
  assert.equal((text.match(/→ Đặt khoá/g) ?? []).length, 1);
  assert.match(text, /\| FAIL +\| N-20 +\| Khoá i18n +\| +3 \|/);
});

test('bảng tóm tắt: không in khi không có FAIL/WARN/regex', () => {
  assert.doesNotMatch(renderReport({ ...clean, jobs: [] }, { ...opts, results: {} }).text, /\| Mức/);
});
