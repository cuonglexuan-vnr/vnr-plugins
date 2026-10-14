// plugins/vnr-swe/skills/vnr-review/scripts/check.mjs
// Kiểm 6 mốc máy đọc của file luật (không chấm văn phong) và sinh INDEX + digest phòng ngừa.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseRuleFile, CODE_RE } from './rules.mjs';

const HEADER = '<!-- generated from docs/review/rules by `/vnr-review check` — do not edit; sửa file luật rồi chạy lại -->';
const PATHS = { fe: 'src/vnr.hrm.web/**', be: 'src/vnr.hrm.solution/**' };
// Trần số dòng symbol mỗi khía cạnh trong digest (giữ digest nhỏ vì được nạp vào ngữ cảnh khi sửa code).
const MAX_SYMBOL_ROWS = 8;
const isFail = r => r.level === 'FAIL' || r.level === 'FAIL+WARN';

// Heading "### " trong §3 (bỏ qua hàng rào ```); heading ngoài §3 (Phụ lục, Ca kiểm thử…) không phải luật nên không xét.
function section3Headings(src) {
  let in3 = false, fence = false; const out = [];
  for (const l of src.replace(/\r\n?/g, '\n').split('\n')) {
    if (l.startsWith('```')) { fence = !fence; continue; }
    if (fence) continue;
    if (/^## /.test(l)) in3 = /^## 3\./.test(l);
    else if (in3 && /^### /.test(l)) out.push(l);
  }
  return out;
}

export function checkRules(dir) {
  const lines = [], sets = [], seen = new Map(); let ok = true;
  const files = readdirSync(dir).filter(f => f.endsWith('.md') && statSync(join(dir, f)).isFile()).sort();
  for (const f of files) {
    const src = readFileSync(join(dir, f), 'utf8');
    const set = parseRuleFile(src, { path: f });
    lines.push(`docs/review/rules/${f}`);
    if (!set.ok) { ok = false; set.errors.forEach(e => lines.push(`  ✗ ${e}`)); continue; }
    const gates = set.rules.filter(r => r.regexGates.length).length, pg = set.rules.filter(r => r.pathGates.length).length;
    const nonFile = set.rules.filter(r => r.scopeKind && r.scopeKind !== 'files').length;
    lines.push(`  ✓ ${set.rules.length} luật đọc được · ${gates} có regex-gate · ${pg} có path-gate · ${set.rules.filter(isFail).length} mức FAIL${nonFile ? ` · ${nonFile} luật commit/nhánh` : ''}`);
    // Heading "### " không thành luật (sai mã, thiếu Mức độ) → skill sẽ bỏ qua; heading mục lục quen thuộc thì miễn.
    const headings = section3Headings(src);
    const bad = headings.filter(h => !CODE_RE.test(h) && !/^### (Nhóm|Kiểm|Bản đồ|Symbol|Thuật ngữ|Phủ|Phải bắt|Không được bắt|Cách áp|Khía cạnh)/.test(h));
    const noLevel = set.warnings.filter(w => /thiếu\/sai "Mức độ"/.test(w));
    if (bad.length || noLevel.length) lines.push(`  ⚠ ${bad.length + noLevel.length} heading không đọc được thành luật → skill sẽ bỏ qua: ${[...bad.map(h => h.slice(4, 40)), ...noLevel.map(w => w.split(':')[0])].join(' · ')}`);
    if (!/^\d+$/.test(set.version)) lines.push(`  ⚠ version "${set.version}" — khung #7906 yêu cầu số nguyên`);
    if (!set.schema) lines.push(`  ⚠ thiếu schema: "1" trong frontmatter`);
    // Cảnh báo parser đáng cho owner biết: luật có thể bị skill bỏ qua âm thầm.
    set.warnings.filter(w => /regex|không đọc được luật|không thấy "## 1\."|chưa đóng|trùng mã trong file/.test(w)).forEach(w => lines.push(`  ⚠ ${w}`));
    const dup = set.rules.find(r => seen.has(r.code));
    if (dup) { ok = false; lines.push(`  ✗ trùng mã ${dup.code} với ${seen.get(dup.code)} — skill sẽ bỏ file này`); continue; }
    set.rules.forEach(r => seen.set(r.code, f)); sets.push(set);
  }
  return { lines, ok, sets };
}

// Gom các file luật cùng `aspect` (một khía cạnh có thể trải nhiều file) theo thứ tự gặp đầu tiên.
function groupByAspect(sets) {
  const m = new Map();
  for (const s of sets) m.has(s.aspect) ? m.get(s.aspect).push(s) : m.set(s.aspect, [s]);
  return [...m.values()];
}

export function generateIndex(sets) {
  const L = ['# INDEX — bộ luật review trước khi push', HEADER, '', 'Mỗi luật một dòng. Chi tiết (điều kiện, ví dụ, ngoại lệ) ở `rules/<aspect>.md`. Bỏ qua một finding: `review-ignore <MÃ>: <lý do>` trên dòng vi phạm.', ''];
  for (const g of groupByAspect(sets)) {
    const [s] = g, versions = [...new Set(g.map(x => x.version))].join('/');
    const total = g.reduce((n, x) => n + x.rules.length, 0);
    L.push(`## ${s.aspect} — ${s.title} (v${versions}, repo: ${s.repo}, ${total} luật${g.length > 1 ? `, ${g.length} file` : ''})`, '', '| Mã | Tên | Mức | Phạm vi |', '|---|---|---|---|');
    for (const r of g.flatMap(x => x.rules)) L.push(`| \`${r.code}\` | ${r.name} | ${r.level} | ${r.scope.map(g => `\`${g}\``).join(', ')} |`);
    L.push('');
  }
  return L.join('\n');
}

// Dòng bảng "Symbol chuẩn" của §1 (chỉ mục con `### Symbol…`; không có thì cả §1). Trần MAX_SYMBOL_ROWS áp ở generateDigest.
// Bỏ cột "Dùng khi" (cột 3 của bảng 4 cột) để digest nhỏ; giữ Symbol, Path, Thay cho (phần ngăn code tự viết lại).
function symbolRows(section1) {
  let ls = section1.split('\n');
  const i = ls.findIndex(l => /^### Symbol/.test(l));
  if (i >= 0) { ls = ls.slice(i + 1); const j = ls.findIndex(l => /^##/.test(l)); if (j >= 0) ls = ls.slice(0, j); }
  return ls.filter(l => /^\|\s*`/.test(l)).map(row => {
    const c = row.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(x => x.trim());
    return `| ${(c.length === 4 ? [c[0], c[1], c[3]] : c).join(' | ')} |`;
  });
}

export function generateDigest(sets, repo) {
  const L = ['---', 'paths:', `  - "${PATHS[repo]}"`, '---', HEADER, '', `# Luật review (${repo.toUpperCase()}) — đọc trước khi viết code`, '',
    'Code mới phải dùng symbol chuẩn dưới đây thay vì tự viết; vi phạm luật FAIL sẽ bị `/vnr-review` chặn trước khi push.', ''];
  for (const g of groupByAspect(sets.filter(s => s.repo === repo || s.repo === 'both'))) {
    const aspect = g[0].aspect;
    // Hợp các bảng symbol của mọi file trong khía cạnh: bỏ dòng trùng, giữ thứ tự gặp đầu tiên, trần chung MAX_SYMBOL_ROWS.
    const rows = [...new Set(g.flatMap(s => symbolRows(s.section1)))].slice(0, MAX_SYMBOL_ROWS);
    if (rows.length) { L.push(`### ${aspect} — symbol chuẩn`, '', '| Symbol | Path | Thay cho |', '|---|---|---|', ...rows, ''); }
    const fails = g.flatMap(s => s.rules).filter(isFail);
    if (fails.length) { L.push(`### ${aspect} — luật FAIL`, '', ...fails.map(r => `- ${r.code} — ${r.name}`), ''); }
  }
  return L.join('\n');
}

export function writeOutputs(wsRoot, sets) {
  const out = [[join(wsRoot, 'docs', 'review', 'INDEX.md'), generateIndex(sets)], [join(wsRoot, '.claude', 'rules', 'review-fe.md'), generateDigest(sets, 'fe')], [join(wsRoot, '.claude', 'rules', 'review-be.md'), generateDigest(sets, 'be')]];
  const written = [];
  for (const [p, text] of out) { mkdirSync(join(p, '..'), { recursive: true }); writeFileSync(p, text + '\n', 'utf8'); written.push(p); }
  return { written };
}
