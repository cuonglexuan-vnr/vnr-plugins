// plugins/vnr-swe/skills/vnr-review/scripts/check.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { checkRules, generateIndex, generateDigest, writeOutputs } from './check.mjs';

const FE = `---
schema: "1"
aspect: uiux
title: "UI/UX"
version: "4.5"
status: draft
repo: fe
applies_to:
  - "apps/**/*.ts"
excludes: []
---
## 1. Phạm vi & từ điển
### Symbol chuẩn
| Symbol | Path | Dùng khi | Thay cho |
|---|---|---|---|
| \`VnrGrid\` | \`libs/ui-framework/grid\` | lưới | \`<table>\` |
## 2. Bảng luật
## 3. Các luật
### UIUX-01 — Màu lấy từ token
**Mức độ:** FAIL
**Phạm vi:** \`apps/**/*.scss\`
**Cách phát hiện:**
- regex-gate: /#[0-9a-f]{6}/iu
**Gợi ý sửa:** dùng var(--…)
### UIUX-02 — Nút chuẩn
**Mức độ:** WARN
**Gợi ý sửa:** x
### PL-1 — ghi chú
Đoạn.
## 4. Ngoại lệ chung
`;
const BE = FE.replace('aspect: uiux', 'aspect: data').replace('repo: fe', 'repo: be').replace('version: "4.5"', 'version: "1"').replace(/UIUX-/g, 'DATA-').replace('### PL-1 — ghi chú\nĐoạn.\n', '');

test('checkRules reports counts, unparsed headings, bad version, duplicates', () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'vnr-review-'));
  try {
    writeFileSync(join(dir, 'uiux.md'), FE); writeFileSync(join(dir, 'data.md'), BE); writeFileSync(join(dir, 'dup.md'), BE.replace('aspect: data', 'aspect: dup'));
    const r = checkRules(dir);
    const t = r.lines.join('\n');
    assert.match(t, /uiux\.md[\s\S]*2 luật đọc được/); assert.match(t, /1 có regex-gate/);
    assert.match(t, /PL-1/); assert.match(t, /version "4\.5"/);
    assert.match(t, /✗.*trùng mã DATA-01/);
    assert.equal(r.ok, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('generateIndex and generateDigest', () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'vnr-review-'));
  try {
    writeFileSync(join(dir, 'uiux.md'), FE); writeFileSync(join(dir, 'data.md'), BE);
    const { sets } = checkRules(dir);
    const idx = generateIndex(sets);
    assert.match(idx, /## uiux/); assert.match(idx, /\| `UIUX-01` \| Màu lấy từ token \| FAIL \| `apps\/\*\*\/\*\.scss` \|/); assert.match(idx, /UIUX-02/);
    const fe = generateDigest(sets, 'fe');
    assert.match(fe, /^---\npaths:\n  - "src\/vnr\.hrm\.web\/\*\*"\n---/); assert.match(fe, /generated from docs\/review/);
    assert.match(fe, /VnrGrid/); assert.match(fe, /- UIUX-01 — Màu lấy từ token/); assert.doesNotMatch(fe, /UIUX-02/); assert.doesNotMatch(fe, /DATA-01/);
    const be = generateDigest(sets, 'be'); assert.match(be, /DATA-01/); assert.doesNotMatch(be, /UIUX/);
    const ws = join(dir, 'ws'); mkdirSync(join(ws, 'docs', 'review'), { recursive: true });
    const w = writeOutputs(ws, sets);
    assert.ok(existsSync(join(ws, 'docs/review/INDEX.md')) && existsSync(join(ws, '.claude/rules/review-fe.md')) && existsSync(join(ws, '.claude/rules/review-be.md')));
    assert.equal(w.written.length, 3);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('generateDigest drops FAIL scope suffix and symbol rows beyond 8', () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'vnr-review-'));
  try {
    const rows = Array.from({ length: 10 }, (_, i) => `| \`Sym${i + 1}\` | \`libs/x\` | khi | \`old\` |`).join('\n');
    writeFileSync(join(dir, 'uiux.md'), FE.replace(/\| `VnrGrid`.*\n/, rows + '\n'));
    const { sets } = checkRules(dir);
    const fe = generateDigest(sets, 'fe');
    assert.match(fe, /Sym8/); assert.doesNotMatch(fe, /Sym9/);
    assert.match(fe, /\| Symbol \| Path \| Thay cho \|/); assert.doesNotMatch(fe, /Dùng khi/);
    assert.match(fe, /- UIUX-01 — Màu lấy từ token\n/); assert.doesNotMatch(fe, /apps\/\*\*\/\*\.scss/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('checkRules đưa cảnh báo parser (fence chưa đóng, trùng mã trong file, không đọc được luật) ra dòng ⚠', () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'vnr-review-'));
  try {
    writeFileSync(join(dir, 'a.md'), BE + '### DATA-01 — Lặp\n**Mức độ:** WARN\n```\nmở\n');
    writeFileSync(join(dir, 'b.md'), BE.replace('aspect: data', 'aspect: b').replace(/DATA-/g, 'B-').replace('## 3.', '## 9.').replace(/### B-0\d[^]*$/, ''));
    const t = checkRules(dir).lines.join('\n');
    assert.match(t, /⚠ .*a\.md: trùng mã trong file DATA-01/); assert.match(t, /⚠ .*a\.md: fence ``` chưa đóng/);
    assert.match(t, /⚠ .*b\.md: không đọc được luật nào/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('khía cạnh nhiều file: digest gộp một bảng symbol + một danh sách FAIL, INDEX một heading', () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'vnr-review-'));
  try {
    const symRows = (p, n) => Array.from({ length: n }, (_, i) => `| \`${p}${i + 1}\` | \`libs/x\` | khi | \`old\` |`).join('\n');
    // File 1: 6 symbol + VnrDup; file 2: VnrDup (trùng) + 6 symbol khác → hợp 13 dòng, trần 8.
    const f1 = FE.replace(/\| `VnrGrid`.*\n/, symRows('A', 6) + '\n| `VnrDup` | `libs/x` | khi | `old` |\n');
    const f2 = FE.replace('title: "UI/UX"', 'title: "UI/UX phần 2"').replace('version: "4.5"', 'version: "5"').replace(/UIUX-/g, 'UIUY-')
      .replace(/\| `VnrGrid`.*\n/, '| `VnrDup` | `libs/x` | khi | `old` |\n' + symRows('B', 6) + '\n');
    writeFileSync(join(dir, 'a.md'), f1); writeFileSync(join(dir, 'b.md'), f2);
    const { sets, ok } = checkRules(dir);
    assert.ok(ok); assert.equal(sets.length, 2);
    const fe = generateDigest(sets, 'fe');
    assert.equal(fe.match(/### uiux — symbol chuẩn/g).length, 1); assert.equal(fe.match(/### uiux — luật FAIL/g).length, 1);
    assert.equal(fe.match(/VnrDup/g).length, 1);
    assert.equal(fe.split('\n').filter(l => /^\| `/.test(l)).length, 8);
    assert.match(fe, /- UIUX-01 — [^\n]*\n- UIUY-01 — /);
    const idx = generateIndex(sets);
    assert.equal(idx.match(/^## uiux/gm).length, 1);
    assert.match(idx, /^## uiux — UI\/UX \(v4\.5\/5, repo: fe, 4 luật, 2 file\)$/m);
    assert.match(idx, /UIUX-02/); assert.match(idx, /UIUY-02/);
    assert.match(generateIndex([sets[0]]), /^## uiux — UI\/UX \(v4\.5, repo: fe, 2 luật\)$/m);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
