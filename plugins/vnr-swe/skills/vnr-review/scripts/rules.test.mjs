// plugins/vnr-swe/skills/vnr-review/scripts/rules.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { parseRuleFile, loadRules } from './rules.mjs';

const SAMPLE = `---
schema: "1"
aspect: slop
title: "Dấu hiệu code do AI viết ẩu"
owner: cuong.lexuan
pbi: 7915
version: "2"
status: review
repo: both
applies_to:
  - "apps/**/*.ts"
  - "Src/**/*.cs"
excludes:
  - "**/*.spec.ts"
---

# Bộ luật review — SLOP

## 1. Phạm vi & từ điển
### Symbol chuẩn (golden path)
| Symbol | Path thật | Dùng khi | Thay cho |
|---|---|---|---|
| \`SupertoolApiClient\` | \`apps/supertool/src/app/core/api/supertool-api.client.ts\` | lấy dữ liệu | \`const X = []\` |

## 2. Bảng luật
| Mã | Tên | Mức | Phạm vi |
|---|---|---|---|

## 3. Các luật

### SLOP-01 — Dữ liệu mẫu không nối vào luồng chạy thật

**Mức độ:** FAIL
**Phạm vi:** \`apps/**/*.ts\`, \`Src/**/*.cs\`
**Mô tả:** Màn hình chạy thật chỉ đọc dữ liệu từ adapter HTTP.
**Lý do tồn tại:** Màn chạy trên dữ liệu mẫu trông như đã xong,
nhưng chưa nối backend.
**FAIL khi:** file import mảng mẫu.
**WARN khi:** —
**Cách phát hiện:**
- regex-gate: /(MOCK|FAKE|dữ liệu mẫu)/iu
- câu hỏi: "Dữ liệu đến từ đâu?"
**Cần đọc thêm:** \`{dir}/../data-access/*.adapter.ts\` · \`{be}/Src/**/Controllers/{class}Controller.cs\`
**❌ Sai** — \`vnr.hrm.web @ 1d18c168f2 · apps/x/seed.ts:1\`
\`\`\`ts
export const WF_MODULES = ['a'];
\`\`\`
**✅ Đúng** — \`vnr.hrm.web @ 1d18c168f2 · apps/x/a.adapter.ts:1\`
\`\`\`ts
this.api.get('/x')
\`\`\`
**❌ Sai** — \`vnr.hrm.solution @ 5c6419b995 · Src/X/Seed.cs:1\`
\`\`\`cs
var fake = new List<X>();
\`\`\`
**✅ Đúng** — \`vnr.hrm.solution @ 5c6419b995 · Src/X/Query.cs:1\`
\`\`\`cs
await _db.X.ToListAsync();
\`\`\`
**Gợi ý sửa:** Thay nguồn tĩnh bằng adapter HTTP.
**Ngoại lệ:** enum, hằng số UI.
**Nguồn:** #7915 ý 1

### SLOP-02 — Ghi chú khớp với code

**Mức độ:** WARN
**Phạm vi:** \`apps/**/*.ts\`
**Mô tả:** x
**Lý do tồn tại:** y
**FAIL khi:** —
**WARN khi:** comment nói ngược code.
**Cách phát hiện:**
- câu hỏi: "Comment còn đúng không?"
**Cần đọc thêm:** —
**Gợi ý sửa:** Sửa comment.
**Ngoại lệ:** Không có
**Nguồn:** #7915 ý 7
**Bỏ qua được:** không

### SLOP-03 — Luật hỏng regex

**Mức độ:** FAIL
**Phạm vi:** \`apps/**/*.ts\`
**Cách phát hiện:**
- regex-gate: /(?i)broken/u
- path-gate: \`libs/ui-framework/**\`, \`apps/**\`
- câu hỏi: "?"
**Gợi ý sửa:** x

### PL-1 — Không phải luật (thiếu Mức độ)
Đoạn văn.

## 4. Ngoại lệ chung
## 5. Ca kiểm thử
## 6. Nhật ký
`;

test('parses frontmatter, §1, rules and markers', () => {
  const set = parseRuleFile(SAMPLE, { path: 'slop.md' });
  assert.equal(set.ok, true);
  assert.equal(set.aspect, 'slop');
  assert.equal(set.repo, 'both');
  assert.equal(set.version, '2');
  assert.equal(set.schema, '1');
  assert.deepEqual(set.appliesTo, ['apps/**/*.ts', 'Src/**/*.cs']);
  assert.deepEqual(set.excludes, ['**/*.spec.ts']);
  assert.match(set.section1, /SupertoolApiClient/);
  assert.doesNotMatch(set.section1, /## 2\./);
  assert.deepEqual(set.rules.map(r => r.code), ['SLOP-01', 'SLOP-02', 'SLOP-03']);
  const r1 = set.rules[0];
  assert.equal(r1.name, 'Dữ liệu mẫu không nối vào luồng chạy thật');
  assert.equal(r1.level, 'FAIL');
  assert.deepEqual(r1.scope, ['apps/**/*.ts', 'Src/**/*.cs']);
  assert.equal(r1.regexGates.length, 1);
  assert.ok(r1.regexGates[0].test('// MOCK data'));
  assert.ok(r1.regexGates[0].test('mock'), 'flag i kept');
  assert.deepEqual(r1.readMore, ['{dir}/../data-access/*.adapter.ts', '{be}/Src/**/Controllers/{class}Controller.cs']);
  assert.equal(r1.fix, 'Thay nguồn tĩnh bằng adapter HTTP.');
  assert.equal(r1.reason, 'Màn chạy trên dữ liệu mẫu trông như đã xong, nhưng chưa nối backend.', 'reason nhiều dòng gộp một dòng');
  assert.equal(set.rules[2].reason.length <= 240, true);
  assert.equal(r1.noIgnore, false);
  assert.equal(set.rules[1].noIgnore, true);
  assert.equal(set.rules[1].level, 'WARN');
});

test('blockForRepo keeps only the ❌/✅ pair of that repo', () => {
  const r1 = parseRuleFile(SAMPLE, { path: 'slop.md' }).rules[0];
  const fe = r1.blockForRepo('fe'), be = r1.blockForRepo('be');
  assert.match(fe, /vnr\.hrm\.web/); assert.doesNotMatch(fe, /vnr\.hrm\.solution/);
  assert.match(be, /vnr\.hrm\.solution/); assert.doesNotMatch(be, /vnr\.hrm\.web/);
  assert.match(fe, /Gợi ý sửa/); assert.match(be, /Gợi ý sửa/);
  assert.doesNotMatch(fe, /var fake/); assert.doesNotMatch(be, /WF_MODULES/);
  assert.match(fe, /WF_MODULES/); assert.match(be, /var fake/);
});

test('blockForRepo keeps a header-less pair for both repos', () => {
  const F = '`'.repeat(3);
  const src = `---
aspect: x
repo: both
applies_to:
  - "a/**"
---
## 1. Phạm vi
## 2. Bảng
### X-01 — Cặp không header repo

**Mức độ:** WARN
**❌ Sai** — ví dụ chung
${F}ts
const bad = 1;
${F}
**✅ Đúng** — ví dụ chung
${F}ts
const good = 1;
${F}
**Gợi ý sửa:** x
`;
  const r = parseRuleFile(src, { path: 'x.md' }).rules[0];
  for (const repo of ['fe', 'be']) {
    const b = r.blockForRepo(repo);
    assert.match(b, /const bad/); assert.match(b, /const good/);
  }
});

function gate(spec) {
  const set = parseRuleFile(SAMPLE.replace('/(MOCK|FAKE|dữ liệu mẫu)/iu', spec), { path: 'x.md' });
  return { re: set.rules[0].regexGates[0], warnings: set.warnings.filter(w => /SLOP-01/.test(w)) };
}

test('regex flags: g/y stripped so .test() is stateless', () => {
  const { re } = gate('/foo/gu');
  assert.equal(re.flags, 'u');
  assert.ok(re.test('foo') && re.test('foo'));
  assert.equal(gate('/foo/y').re.flags, 'u');
});

test('regex flags: v is kept without appending u', () => {
  const { re, warnings } = gate('/foo/v');
  assert.equal(re.flags, 'v'); assert.deepEqual(warnings, []);
});

test('regex flags: trailing commentary is not read as flags', () => {
  const { re, warnings } = gate('/baz/u — xem a/b');
  assert.equal(re.source, 'baz'); assert.equal(re.flags, 'u'); assert.deepEqual(warnings, []);
  assert.equal(gate('/qux/ (ghi chú)').re.source, 'qux');
});

test('unnumbered trailing heading does not leak into the last rule block', () => {
  const src = SAMPLE.replace('### PL-1 — Không phải luật (thiếu Mức độ)', `## Phụ lục
LEAK`);
  const set = parseRuleFile(src, { path: 'x.md' });
  assert.doesNotMatch(set.rules.at(-1).block, /LEAK/);
});

test('frontmatter list items may be single-quoted', () => {
  const set = parseRuleFile(SAMPLE.replace('  - "apps/**/*.ts"', "  - 'apps/**/*.ts'"), { path: 'x.md' });
  assert.deepEqual(set.appliesTo, ['apps/**/*.ts', 'Src/**/*.cs']);
});

test('invalid regex degrades to no gate with a warning; path-gate parsed; block without Mức độ skipped', () => {
  const set = parseRuleFile(SAMPLE, { path: 'slop.md' });
  const r3 = set.rules[2];
  assert.equal(r3.regexGates.length, 0);
  assert.deepEqual(r3.pathGates, ['libs/ui-framework/**', 'apps/**']);
  assert.ok(set.warnings.some(w => /SLOP-03/.test(w) && /regex/.test(w)));
  assert.ok(set.warnings.some(w => /PL-1/.test(w)));
});

test('tolerates BOM and CRLF', () => {
  const set = parseRuleFile('\uFEFF' + SAMPLE.replace(/\n/g, '\r\n'), { path: 'x.md' });
  assert.equal(set.ok, true);
  assert.equal(set.rules.length, 3);
  assert.equal(set.rules[0].fix, 'Thay nguồn tĩnh bằng adapter HTTP.');
});

test('file without repo/applies_to is rejected', () => {
  const set = parseRuleFile('---\naspect: x\n---\n### X-01 — a\n**Mức độ:** FAIL\n', { path: 'x.md' });
  assert.equal(set.ok, false);
  assert.ok(set.errors.length >= 1);
});

test('loadRules filters by repo, skips _pending, drops duplicate codes', () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'vnr-review-'));
  try {
    writeFileSync(join(dir, 'slop.md'), SAMPLE);
    writeFileSync(join(dir, 'arch-be.md'), SAMPLE.replace('aspect: slop', 'aspect: arch-be').replace('repo: both', 'repo: be').replace(/SLOP-/g, 'ARCH-BE-'));
    writeFileSync(join(dir, 'uiux.md'), SAMPLE.replace('aspect: slop', 'aspect: uiux').replace('repo: both', 'repo: fe').replace(/SLOP-/g, 'UIUX-'));
    writeFileSync(join(dir, 'z-dup.md'), SAMPLE.replace('aspect: slop', 'aspect: dup'));
    mkdirSync(join(dir, '_pending')); writeFileSync(join(dir, '_pending', 'p.md'), SAMPLE.replace(/SLOP-/g, 'PEND-'));
    const fe = loadRules(dir, { repo: 'fe' });
    assert.deepEqual(fe.sets.map(s => s.aspect).sort(), ['slop', 'uiux']);
    assert.ok(fe.errors.some(e => /trùng mã/.test(e) && /dup\.md/.test(e)));
    const be = loadRules(dir, { repo: 'be' });
    assert.deepEqual(be.sets.map(s => s.aspect).sort(), ['arch-be', 'slop']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('regex body is lazy: commentary containing "/" is not swallowed', () => {
  const x = gate('/x/u — xem libs/ui');
  assert.equal(x.re.source, 'x'); assert.equal(x.re.flags, 'u'); assert.deepEqual(x.warnings, []);
  const f = gate('/foo/i — xem libs/mid');
  assert.equal(f.re.source, 'foo'); assert.equal(f.re.flags, 'iu'); assert.deepEqual(f.warnings, []);
});

test('regex body is lazy: real arch-fe line with two regexes', () => {
  const spec = String.raw`/@Component\s*\(/u — kèm điều kiện: khối decorator đến }) không khớp /changeDetection:\s*ChangeDetectionStrategy\.OnPush/u`;
  const { re, warnings } = gate(spec);
  assert.equal(re.source, String.raw`@Component\s*\(`);
  assert.equal(re.flags, 'u'); assert.deepEqual(warnings, []);
});

test('regex body keeps escaped slash and slash inside a class', () => {
  assert.ok(gate(String.raw`/a\/b/u`).re.test('a/b'));
  assert.ok(gate('/(^|[^/])foo/u').re.test('x foo'));
});

test('## heading and ### CODE inside a fence do not split or end a block', () => {
  const F = '`'.repeat(3);
  const src = `---
aspect: x
repo: both
applies_to:
  - "a/**"
---
## 1. Phạm vi
## 2. Bảng
### X-01 — Có fence chứa heading

**Mức độ:** WARN
**❌ Sai**
${F}md
## tiêu đề trong fence
### X-99 — không phải luật
${F}
**Gợi ý sửa:** giữ nguyên
`;
  const set = parseRuleFile(src, { path: 'x.md' });
  assert.deepEqual(set.rules.map(r => r.code), ['X-01']);
  assert.equal(set.rules[0].fix, 'giữ nguyên');
  assert.match(set.rules[0].block, /X-99/);
});

test('blockForRepo: other-repo header without a fence does not swallow later fields', () => {
  const src = `---
aspect: x
repo: both
applies_to:
  - "a/**"
---
## 1. Phạm vi
## 2. Bảng
### X-01 — Header không fence

**Mức độ:** WARN
**❌ Sai** — vnr.hrm.solution @ abc · Src/X.cs:1
**Gợi ý sửa:** sửa đi
`;
  const r = parseRuleFile(src, { path: 'x.md' }).rules[0];
  assert.match(r.blockForRepo('fe'), /Gợi ý sửa/);
  assert.doesNotMatch(r.blockForRepo('fe'), /vnr\.hrm\.solution/);
});

test('Phạm vi non-file tokens → scopeKind commit/branch, scope rỗng; còn lại files', () => {
  const mk = scope => `---
aspect: x
repo: both
applies_to:
  - "a/**"
---
## 1. Phạm vi
## 3. Các luật
### X-01 — Luật
**Mức độ:** WARN
**Phạm vi:** ${scope}
**Gợi ý sửa:** sửa
`;
  const one = s => parseRuleFile(mk(s), { path: 'x.md' }).rules[0];
  assert.deepEqual([one('`(commit message)`').scopeKind, one('`(commit message)`').scope], ['commit', []]);
  assert.deepEqual([one('`(tên nhánh)`').scopeKind, one('`(tên nhánh)`').scope], ['branch', []]);
  assert.deepEqual([one('`a/**/*.ts`').scopeKind, one('`a/**/*.ts`').scope], ['files', ['a/**/*.ts']]);
});

const MINI = `---
aspect: x
repo: be
applies_to:
  - "Src/**/*.cs"
---
## 1. Từ điển
## 3. Các luật
### X-01 — Một
**Mức độ:** FAIL
**Gợi ý sửa:** a
`;

test('fence ``` chưa đóng ở cuối thân → cảnh báo', () => {
  const set = parseRuleFile(MINI + '```\nchưa đóng\n', { path: 'x.md' });
  assert.ok(set.warnings.some(w => /x\.md: fence ``` chưa đóng/.test(w)), set.warnings.join('|'));
  assert.equal(parseRuleFile(MINI + '```\nđóng\n```\n', { path: 'x.md' }).warnings.some(w => /chưa đóng/.test(w)), false);
});

test('mã trùng trong một file → cảnh báo và giữ khối đầu', () => {
  const set = parseRuleFile(MINI + '### X-01 — Hai\n**Mức độ:** WARN\n**Gợi ý sửa:** b\n', { path: 'x.md' });
  assert.equal(set.rules.length, 1); assert.equal(set.rules[0].name, 'Một'); assert.equal(set.rules[0].level, 'FAIL');
  assert.ok(set.warnings.some(w => /trùng mã trong file/.test(w) && /X-01/.test(w)));
});

test('chuẩn hoá NFC: mã/nhãn tiếng Việt dạng NFD vẫn được nhận', () => {
  const set = parseRuleFile(MINI.replace('Mức độ', 'Mức độ'.normalize('NFD')).replace('Gợi ý sửa', 'Gợi ý sửa'.normalize('NFD')), { path: 'x.md' });
  assert.equal(set.rules.length, 1); assert.equal(set.rules[0].fix, 'a');
});

test('title từ frontmatter; thiếu → null', () => {
  assert.equal(parseRuleFile(SAMPLE, { path: 'slop.md' }).title, 'Dấu hiệu code do AI viết ẩu');
  assert.equal(parseRuleFile(MINI, { path: 'x.md' }).title, null);
});

test('proposed: "**Trạng thái:** đề xuất" → true; "hiệu lực" hoặc không có → false', () => {
  const st = s => parseRuleFile(MINI.replace('**Gợi ý sửa:** a', `**Gợi ý sửa:** a\n**Trạng thái:** ${s}`), { path: 'x.md' }).rules[0].proposed;
  assert.equal(st('đề xuất — chờ SA duyệt'), true);
  assert.equal(st('hiệu lực — spec v3.3'), false);
  assert.equal(parseRuleFile(MINI, { path: 'x.md' }).rules[0].proposed, false);
});

test('blockForRepo bỏ dòng xuất xứ (Nguồn…) ngoài fence, giữ Gợi ý sửa', () => {
  const r1 = parseRuleFile(SAMPLE, { path: 'slop.md' }).rules[0];
  assert.match(r1.block, /\*\*Nguồn:\*\*/);
  const fe = r1.blockForRepo('fe');
  assert.doesNotMatch(fe, /\*\*Nguồn:\*\*/); assert.match(fe, /\*\*Gợi ý sửa:\*\*/);
  const F = '`'.repeat(3);
  const src = MINI + `**Phê duyệt:** SA\n**Năng lực:** CAP-1\n${F}md\n**Nguồn:** trong fence\n${F}\n`;
  const b = parseRuleFile(src, { path: 'x.md' }).rules[0].blockForRepo('be');
  assert.doesNotMatch(b, /Phê duyệt|Năng lực/); assert.match(b, /\*\*Nguồn:\*\* trong fence/);
});
