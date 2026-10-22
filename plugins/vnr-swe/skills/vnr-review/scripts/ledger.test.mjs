// plugins/vnr-swe/skills/vnr-review/scripts/ledger.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLedger, resultOk, normalizeResult, nextDispatch, normalizePath } from './ledger.mjs';

const cellOf = (repo, kind, aspect, i, codes) => ({
  id: `${kind}/${aspect}/${i}`, fileId: `${kind}_${aspect}_${i}`, repo, kind, aspect, title: aspect.toUpperCase(), chunk: `${i}/2`,
  codes, files: ['a.ts'], rules: codes.map(code => ({ code, level: 'FAIL', block: 'B' })), hunks: [], model: 'sonnet',
});
const planOf = (name, kind, cells) => ({ repo: { name, kind, root: `/r/${name}` }, cells });

test('buildLedger: một dòng mỗi ô, resultFile theo repo/fileId, attempts 0', () => {
  const l = buildLedger([planOf('web', 'fe', [cellOf('web', 'fe', 'ui', 1, ['A-01', 'A-02']), cellOf('web', 'fe', 'ui', 2, ['A-03'])]), planOf('sol', 'be', [cellOf('sol', 'be', 'api', 1, ['B-01'])])]);
  assert.deepEqual(l.cells.map(c => [c.id, c.fileId, c.repo, c.resultFile, c.attempts, c.failed]), [
    ['fe/ui/1', 'fe_ui_1', 'web', 'results/web/fe_ui_1.json', 0, false],
    ['fe/ui/2', 'fe_ui_2', 'web', 'results/web/fe_ui_2.json', 0, false],
    ['be/api/1', 'be_api_1', 'sol', 'results/sol/be_api_1.json', 0, false],
  ]);
  assert.deepEqual(Object.keys(l.cells[0]).sort(), ['aspect', 'attempts', 'chunk', 'codes', 'failed', 'fileId', 'files', 'id', 'kind', 'repo', 'resultFile', 'title']);
});

test('buildLedger: hai repo cùng kind trùng id → không throw; trùng id trong một repo → throw, không nhắc "ô"', () => {
  const c = cellOf('web', 'fe', 'ui', 1, ['A-01']);
  const l = buildLedger([planOf('web', 'fe', [c]), planOf('web2', 'fe', [{ ...c, repo: 'web2' }])]);
  assert.deepEqual(l.cells.map(x => x.resultFile), ['results/web/fe_ui_1.json', 'results/web2/fe_ui_1.json']);
  assert.throws(() => buildLedger([planOf('web', 'fe', [c, { ...c }])]), e => /trùng id lượt review fe\/ui\/1/.test(e.message) && !/(^|[\s(])ô([\s)/]|$)/.test(e.message));
});

const cell = cellOf('web', 'fe', 'ui', 1, ['A-01', 'A-02']);

test('resultOk: đủ mã là xong, dù status lạ hoặc findings null', () => {
  assert.equal(resultOk(cell, { rules: [{ code: 'A-01', status: 'checked', findings: [] }, { code: 'A-02', status: 'n/a', note: 'x' }] }), true);
  assert.equal(resultOk(cell, { rules: [{ code: 'A-01', status: 'PASS' }, { code: 'A-02' }] }), true);
  assert.equal(resultOk(cell, { rules: [{ code: 'A-01', findings: null }, { code: 'A-02', status: 'checked' }] }), true);
});

test('resultOk: thiếu mã, rules không phải mảng, dòng không có code, null → false', () => {
  assert.equal(resultOk(cell, { rules: [{ code: 'A-01' }] }), false);
  assert.equal(resultOk(cell, { rules: { 'A-01': {}, 'A-02': {} } }), false);
  assert.equal(resultOk(cell, { rules: [{ code: 'A-01' }, { status: 'checked' }, null] }), false);
  assert.equal(resultOk(cell, null), false);
});

test('normalizeResult: gộp dòng trùng mã, giữ n/a, mã lạ thành cảnh báo', () => {
  const f1 = { file: 'a.ts', line: 1 }, f2 = { file: 'a.ts', line: 9 };
  const { rows, warnings } = normalizeResult(cell, { rules: [
    { code: 'A-01', status: 'PASS', findings: [f1] },
    { code: 'A-01', status: 'checked', findings: [f2] },
    { code: 'A-02', status: 'n/a', note: 'không có template' },
    { code: 'Z-99', status: 'checked', findings: [] },
    { status: 'checked' },
  ] });
  assert.deepEqual([...rows.keys()], ['A-01', 'A-02']);
  assert.deepEqual(rows.get('A-01'), { status: 'checked', note: '', findings: [{ ...f1, level: 'FAIL' }, { ...f2, level: 'FAIL' }] });
  assert.deepEqual(rows.get('A-02'), { status: 'n/a', note: 'không có template', findings: [] });
  assert.equal(warnings.length, 1); assert.equal(warnings[0], 'fe/ui/1: mã Z-99 không thuộc nhóm luật được giao — bỏ qua');
});

test('normalizeResult: findings null/không phải mảng → []; một dòng n/a + một dòng checked → checked', () => {
  const { rows } = normalizeResult(cell, { rules: [{ code: 'A-01', findings: null }, { code: 'A-02', status: 'n/a', findings: 'x' }, { code: 'A-02', status: 'checked' }] });
  assert.deepEqual(rows.get('A-01'), { status: 'checked', note: '', findings: [] });
  assert.equal(rows.get('A-02').status, 'checked');
});

test('nextDispatch: 2 ô không kết quả → RETRY 1, RETRY 2, rồi failed', () => {
  let ledger = buildLedger([planOf('web', 'fe', [cellOf('web', 'fe', 'ui', 1, ['A-01']), cellOf('web', 'fe', 'ui', 2, ['A-02'])])]);
  const none = () => false;
  let r = nextDispatch(ledger, none);
  assert.deepEqual(r.retry.map(c => c.attempts), [1, 1]); assert.equal(r.failed.length, 0);
  r = nextDispatch(r.ledger, none);
  assert.deepEqual(r.retry.map(c => c.attempts), [2, 2]); assert.equal(r.failed.length, 0);
  r = nextDispatch(r.ledger, none);
  assert.equal(r.retry.length, 0); assert.equal(r.failed.length, 2);
  assert.ok(r.ledger.cells.every(c => c.failed && c.attempts === 2));
});

test('nextDispatch: ô đã có kết quả không bao giờ tăng attempts (gọi thêm giữa các đợt)', () => {
  const ledger = buildLedger([planOf('web', 'fe', [cellOf('web', 'fe', 'ui', 1, ['A-01']), cellOf('web', 'fe', 'ui', 2, ['A-02'])])]);
  const ok = c => c.id === 'fe/ui/1';
  let r = nextDispatch(ledger, ok);
  for (let i = 0; i < 4; i++) r = nextDispatch(r.ledger, ok);
  const done = r.ledger.cells.find(c => c.id === 'fe/ui/1');
  assert.equal(done.attempts, 0); assert.equal(done.failed, false);
  assert.ok(!r.retry.some(c => c.id === 'fe/ui/1') && !r.failed.some(c => c.id === 'fe/ui/1'));
});

const WIN = process.platform === 'win32';

test('normalizePath: bỏ repoRoot, ./, \\ → /; file giả giữ nguyên', () => {
  assert.equal(normalizePath('/r/web/apps/a.ts', '/r/web'), 'apps/a.ts');
  assert.equal(normalizePath('/r/web/apps/a.ts', '/r/web/'), 'apps/a.ts');
  assert.equal(normalizePath('C:\\w\\web\\apps\\a.ts', 'C:\\w\\web'), 'apps/a.ts');
  assert.equal(normalizePath('./apps/a.ts', '/r/web'), 'apps/a.ts');
  assert.equal(normalizePath('apps\\a.ts'), 'apps/a.ts');
  assert.equal(normalizePath('/r/webx/a.ts', '/r/web'), '/r/webx/a.ts', 'chỉ bỏ khi đúng ranh giới thư mục');
  assert.equal(normalizePath('(commit abc1234)', '/r/web'), '(commit abc1234)');
  assert.equal(normalizePath(undefined, '/r/web'), undefined);
});

test('normalizePath: repoRoot khác hoa/thường chỉ bị bỏ trên win32', () => {
  assert.equal(normalizePath('c:/W/WEB/apps/a.ts', 'C:\\w\\web'), WIN ? 'apps/a.ts' : 'c:/W/WEB/apps/a.ts');
});

test('normalizeResult: file của finding chuẩn hoá về đúng mục trong cell.files', () => {
  const c = { ...cellOf('web', 'fe', 'ui', 1, ['A-01']), files: ['apps/A.ts', '(commit abc1234)'] };
  const { rows } = normalizeResult(c, { rules: [{ code: 'A-01', findings: [
    { file: '/r/web/apps/A.ts', line: 1 }, { file: './apps/A.ts', line: 2 }, { file: 'apps\\A.ts', line: 3 }, { file: '(commit abc1234)', line: 1 },
    { file: 'apps/a.ts', line: 4 }, { line: 5 },
  ] }] }, '/r/web');
  assert.deepEqual(rows.get('A-01').findings.map(f => f.file), ['apps/A.ts', 'apps/A.ts', 'apps/A.ts', '(commit abc1234)', WIN ? 'apps/A.ts' : 'apps/a.ts', undefined]);
});

test('normalizeResult: level hiệu lực = FAIL chỉ khi luật FAIL/FAIL+WARN và finding khớp "FAIL khi"', () => {
  const c = { ...cellOf('web', 'fe', 'ui', 1, ['F-01', 'FW-01', 'W-01']), rules: [{ code: 'F-01', level: 'FAIL' }, { code: 'FW-01', level: 'FAIL+WARN' }, { code: 'W-01', level: 'WARN' }] };
  const lv = (code, level) => normalizeResult(c, { rules: [{ code, findings: [{ file: 'a.ts', line: 1, ...(level === undefined ? {} : { level }) }] }] }).rows.get(code).findings[0].level;
  assert.equal(lv('F-01'), 'FAIL', 'luật chỉ FAIL, thiếu level → FAIL');
  assert.equal(lv('F-01', 'FAIL'), 'FAIL'); assert.equal(lv('F-01', 'WARN'), 'WARN');
  assert.equal(lv('FW-01'), 'WARN', 'FAIL+WARN thiếu level → WARN (thận trọng)');
  assert.equal(lv('FW-01', 'WARN'), 'WARN'); assert.equal(lv('FW-01', 'FAIL'), 'FAIL'); assert.equal(lv('FW-01', 'fail'), 'FAIL');
  assert.equal(lv('W-01', 'FAIL'), 'WARN', 'luật WARN luôn WARN');
});
