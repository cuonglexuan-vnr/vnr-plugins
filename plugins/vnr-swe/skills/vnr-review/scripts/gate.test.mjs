// plugins/vnr-swe/skills/vnr-review/scripts/gate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { matchGlob, inScope, findIgnores, resolveReadMore } from './gate.mjs';

const set = { appliesTo: ['apps/**/*.ts', 'libs/**/*.ts'], excludes: ['**/*.spec.ts'] };
const rule = { code: 'SLOP-01', level: 'FAIL', scope: ['apps/**/*.ts'], noIgnore: false };

test('matchGlob anchors at root and is case-sensitive', () => {
  assert.ok(matchGlob('apps/x/y.ts', 'apps/**/*.ts'));
  assert.ok(!matchGlob('src/apps/x/y.ts', 'apps/**/*.ts'));
  assert.ok(matchGlob('src/apps/x/y.ts', '**/apps/**/*.ts'));
  assert.ok(!matchGlob('src/Modules/A.cs', 'src/**/*.cs'.replace('src', 'Src')));
  assert.ok(matchGlob('libs/ui-framework/a.ts', '{apps,libs}/**/*.ts'));
  assert.ok(matchGlob('Directory.Packages.props', 'Directory.Packages.props'));
});

test('inScope = applies_to ∧ ¬excludes ∧ Phạm vi', () => {
  assert.ok(inScope('apps/a.ts', set, rule));
  assert.ok(!inScope('apps/a.spec.ts', set, rule));
  assert.ok(!inScope('libs/a.ts', set, rule), 'in applies_to but not in rule scope');
});

test('findIgnores parses comment styles, requires a reason, honours noIgnore via caller', () => {
  const file = { path: 'apps/a.ts', added: [
    { n: 1, text: 'x(); // review-ignore SEC-03: proxy chỉ dùng dev' },
    { n: 2, text: '<!-- review-ignore UIUX-07: màn legacy -->' },
    { n: 3, text: '-- review-ignore DATA-05: bảng tạm' },
    { n: 4, text: '// review-ignore SLOP-01' },
  ] };
  const ig = findIgnores(file, 'feat: x\n\nreview-ignore: NAME-FE-03 apps/a.json khoá legacy\n');
  const by = Object.fromEntries(ig.map(i => [i.code, i]));
  assert.equal(by['SEC-03'].line, 1); assert.equal(by['SEC-03'].reason, 'proxy chỉ dùng dev'); assert.equal(by['SEC-03'].valid, true);
  assert.equal(by['UIUX-07'].valid, true); assert.equal(by['DATA-05'].valid, true);
  assert.equal(by['SLOP-01'].valid, false); assert.match(by['SLOP-01'].why, /lý do/);
  assert.equal(by['NAME-FE-03'].path, 'apps/a.json'); assert.equal(by['NAME-FE-03'].line, null);
});

test('resolveReadMore expands placeholders, caps at 10, reports unresolved', () => {
  const ws = mkdtempSync(join(os.tmpdir(), 'vnr-review-'));
  try {
    const fe = join(ws, 'vnr.hrm.web'), be = join(ws, 'vnr.hrm.solution');
    mkdirSync(join(fe, 'apps/supertool/src/app/features/st-x/data-access'), { recursive: true });
    mkdirSync(join(fe, 'apps/supertool/src/app/features/st-x/pages'), { recursive: true });
    writeFileSync(join(fe, 'apps/supertool/src/app/features/st-x/data-access/st-x.http.adapter.ts'), '');
    mkdirSync(join(be, 'Src/Modules/X/Controllers'), { recursive: true });
    writeFileSync(join(be, 'Src/Modules/X/Controllers/UserController.cs'), '');
    for (let i = 0; i < 12; i++) writeFileSync(join(be, 'Src/Modules/X/Controllers', `C${i}Controller.cs`), '');
    const ctx = { file: 'apps/supertool/src/app/features/st-x/pages/user.page.ts', repoRoot: fe, siblings: { be } };
    const r = resolveReadMore(['{dir}/../data-access/*.adapter.ts', '{be}/Src/**/Controllers/{class}Controller.cs', '{be}/Src/**/Controllers/*.cs', 'libs/**/{basename}'], ctx);
    assert.ok(r.files.includes('apps/supertool/src/app/features/st-x/data-access/st-x.http.adapter.ts'));
    assert.ok(r.files.some(f => f.endsWith('vnr.hrm.solution/Src/Modules/X/Controllers/UserController.cs')));
    assert.equal(r.files.filter(f => /\/C\d+Controller\.cs$/.test(f)).length, 10);
    assert.deepEqual(r.unresolved, ['libs/**/{basename}']);
    assert.deepEqual(resolveReadMore(['{be}/x.cs'], { ...ctx, siblings: {} }).unresolved, ['{be}/x.cs']);
  } finally { rmSync(ws, { recursive: true, force: true }); }
});

test('findIgnores: marker commit thiếu lý do không nuốt dòng kế tiếp (LF và CRLF)', () => {
  const file = { path: 'a.ts', added: [] };
  for (const nl of ['\n', '\r\n']) {
    const ig = findIgnores(file, `review-ignore: SEC-01 a.ts${nl}review-ignore: SEC-02 b.ts ok${nl}`);
    const by = Object.fromEntries(ig.map(i => [i.code, i]));
    assert.equal(ig.length, 2);
    assert.equal(by['SEC-01'].valid, false); assert.equal(by['SEC-01'].reason, ''); assert.match(by['SEC-01'].why, /lý do/);
    assert.equal(by['SEC-02'].valid, true); assert.equal(by['SEC-02'].path, 'b.ts'); assert.equal(by['SEC-02'].reason, 'ok');
  }
});

test('resolveReadMore: pattern neo thư mục, thoát gốc → unresolved, "$" trong đường dẫn giữ nguyên', () => {
  const ws = mkdtempSync(join(os.tmpdir(), 'vnr-review-'));
  try {
    mkdirSync(join(ws, 'apps/x/sub'), { recursive: true });
    mkdirSync(join(ws, 'other/apps/x'), { recursive: true });
    mkdirSync(join(ws, 'apps/$d'), { recursive: true });
    writeFileSync(join(ws, 'apps/x/sub/a.ts'), '');
    writeFileSync(join(ws, 'other/apps/x/b.ts'), '');
    writeFileSync(join(ws, 'apps/$d/m.ts'), '');
    const ctx = { file: 'apps/$d/p.ts', repoRoot: ws, siblings: {} };
    const r = resolveReadMore(['apps/x/**/*.ts', '../outside/*.ts', '{dir}/m.ts'], ctx);
    assert.deepEqual(r.files, ['apps/x/sub/a.ts', 'apps/$d/m.ts']);
    assert.deepEqual(r.unresolved, ['../outside/*.ts']);
    assert.deepEqual(resolveReadMore(['**/b.ts'], ctx).files, ['other/apps/x/b.ts']);
  } finally { rmSync(ws, { recursive: true, force: true }); }
});
