// plugins/vnr-swe/skills/vnr-review/scripts/rules.mjs
// Parse file luật theo khung #7906 — chỉ 6 mốc máy đọc; phần còn lại là văn bản cho LLM.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename, sep } from 'node:path';

export const CODE_RE = /^### ([A-Z]+(?:-[A-Z]+)*-\d+) — (.+)$/;
const LEVELS = new Set(['FAIL', 'WARN', 'FAIL+WARN', 'RETIRED']);
const BACKTICK = /`([^`]+)`/g;
// "Lý do tồn tại" hiện trong báo cáo (Vì / Vì sao) — cắt ở đây để job và plan không phình.
const MAX_REASON_CHARS = 240;
// Dòng xuất xứ/quản trị của khối luật — không giúp agent chấm, bỏ khỏi khối gửi đi.
const PROVENANCE = /^\*\*(Nguồn|Phê duyệt|Kiểm chứng|Trạng thái|Sẵn sàng|Catalog|Chủ sở hữu|Năng lực):\*\*/u;

function normalise(src) { return src.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').normalize('NFC'); }

function parseFrontmatter(lines) {
  if (lines[0] !== '---') return { fm: {}, end: 0 };
  const end = lines.indexOf('---', 1); if (end < 0) return { fm: {}, end: 0 };
  const fm = {}; let key = null;
  for (const raw of lines.slice(1, end)) {
    const m = raw.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (m) { key = m[1]; const v = m[2].trim(); fm[key] = v === '' ? [] : v.replace(/^(["'])(.*)\1$/, '$2'); continue; }
    const item = raw.match(/^\s+-\s+(.*)$/);
    if (item && key && Array.isArray(fm[key])) fm[key].push(item[1].trim().replace(/^(["'])(.*)\1$/, '$2'));
  }
  return { fm, end };
}

// Lấy mọi glob trong backtick của một dòng trường (bỏ chữ mô tả xung quanh).
function globsOf(text) {
  const out = [];
  for (const m of text.matchAll(BACKTICK)) { const g = m[1].trim(); if (/[\/*.{]/.test(g) && !/\s/.test(g)) out.push(g); }
  return out;
}

function field(block, name) {
  const i = block.findIndex(l => l.startsWith(`**${name}:**`));
  if (i < 0) return null;
  const first = block[i].slice(name.length + 5).trim();
  const rest = [];
  for (let k = i + 1; k < block.length && !block[k].startsWith('**') && !block[k].startsWith('```'); k++) rest.push(block[k]);
  return { line: i, first, rest, text: [first, ...rest].join('\n').trim() };
}

function compileRegex(spec, code, warnings) {
  // "- regex-gate: /…/flags   ghi chú tuỳ ý" → `/` đầu tiên (không escape) kèm flags rồi tới khoảng trắng, "(" hoặc hết dòng đóng regex.
  const m = spec.match(/^\/((?:\\.|[^\\])*?)\/([dgimsuvy]*)(?=\s|\(|$)/su);
  if (!m) { warnings.push(`${code}: regex không đúng dạng /…/flags — bỏ gate`); return null; }
  // Bỏ g/y (làm .test() có trạng thái qua lastIndex); thêm u trừ khi đã có u hoặc v (u+v không hợp lệ).
  let flags = m[2].replace(/[gy]/g, '');
  if (!/[uv]/.test(flags)) flags += 'u';
  try { return new RegExp(m[1], flags); }
  catch (e) { warnings.push(`${code}: regex không hợp lệ (${e.message.split('\n')[0]}) — bỏ gate`); return null; }
}

// Giữ cặp ❌/✅ có header chứa tên repo đang xét (vnr.hrm.web = fe, vnr.hrm.solution = be); không có header repo → giữ.
// Bỏ dòng xuất xứ (PROVENANCE) nằm ngoài fence.
function blockForRepo(lines, repo) {
  const other = repo === 'fe' ? /vnr\.hrm\.solution|\bBE\b/ : /vnr\.hrm\.web|\bFE\b/;
  const out = []; let skipping = false, inFence = false;
  for (const l of lines) {
    if (!inFence && /^\*\*(❌ Sai|✅ Đúng)/.test(l)) skipping = other.test(l);
    else if (!inFence && l.startsWith('**')) skipping = false;
    if (l.startsWith('```')) { if (!skipping) out.push(l); inFence = !inFence; if (!inFence && skipping) { skipping = false; } continue; }
    if (!skipping && (inFence || !PROVENANCE.test(l))) out.push(l);
  }
  return out.join('\n');
}

export function parseRuleFile(raw, { path = '' } = {}) {
  const lines = normalise(raw).split('\n');
  const warnings = [], errors = [];
  const { fm, end } = parseFrontmatter(lines);
  const set = {
    ok: true, path, aspect: fm.aspect ?? basename(path, '.md'), title: fm.title ?? null, repo: fm.repo ?? null,
    version: typeof fm.version === 'string' ? fm.version : '', schema: typeof fm.schema === 'string' ? fm.schema : null,
    status: fm.status ?? '', model: typeof fm.model === 'string' ? fm.model : null,
    appliesTo: Array.isArray(fm.applies_to) ? fm.applies_to : [], excludes: Array.isArray(fm.excludes) ? fm.excludes : [],
    section1: '', rules: [], warnings, errors,
  };
  if (!['be', 'fe', 'both'].includes(set.repo)) errors.push(`${path}: frontmatter thiếu/sai repo (be|fe|both)`);
  if (!set.appliesTo.length) errors.push(`${path}: frontmatter thiếu applies_to`);
  if (errors.length) { set.ok = false; return set; }

  const body = lines.slice(end + 1);
  const s1 = body.findIndex(l => /^## 1\./.test(l)), s2 = body.findIndex(l => /^## 2\./.test(l));
  if (s1 >= 0) set.section1 = body.slice(s1, s2 > s1 ? s2 : undefined).join('\n').trim();
  else warnings.push(`${path}: không thấy "## 1." — §1 rỗng`);

  // fenced[i] = dòng i nằm trong (hoặc là) hàng rào ``` — `## `/`### CODE — ` trong đó không tách khối.
  let open = false;
  const fenced = body.map(l => { const f = l.startsWith('```'); const r = open || f; if (f) open = !open; return r; });
  const starts = body.map((l, i) => (!fenced[i] && CODE_RE.test(l) ? i : -1)).filter(i => i >= 0);
  if (open) warnings.push(`${path}: fence ${'```'} chưa đóng — các luật sau có thể bị bỏ`);
  const seenCodes = new Set();
  starts.forEach((st, k) => {
    const block = body.slice(st, k + 1 < starts.length ? starts[k + 1] : undefined);
    const stop = block.findIndex((l, i) => i > 0 && !fenced[st + i] && /^## /.test(l)); const lines2 = stop > 0 ? block.slice(0, stop) : block;
    const [, code, name] = lines2[0].match(CODE_RE);
    if (seenCodes.has(code)) { warnings.push(`${path}: trùng mã trong file ${code} — giữ khối đầu`); return; }
    seenCodes.add(code);
    const lv = field(lines2, 'Mức độ');
    if (!lv || !LEVELS.has(lv.first)) { warnings.push(`${code}: thiếu/sai "Mức độ" — bỏ khối`); return; }
    const detect = field(lines2, 'Cách phát hiện');
    const pathGates = [], regexGates = [], regexHints = [];
    for (const l of detect?.rest ?? []) {
      const m = l.match(/^\s*-\s*(path-gate|regex-gate|regex-hint):\s*(.+)$/);
      if (!m) continue;
      if (m[1] === 'path-gate') pathGates.push(...globsOf(m[2]), ...(globsOf(m[2]).length ? [] : m[2].split(',').map(s => s.trim()).filter(s => /[\/*]/.test(s))));
      else { const re = compileRegex(m[2].trim(), code, warnings); if (re) (m[1] === 'regex-gate' ? regexGates : regexHints).push(re); }
    }
    const scopeText = field(lines2, 'Phạm vi')?.text ?? '';
    // Phạm vi không phải file: commit message / tên nhánh — không bao giờ rơi về appliesTo.
    const scopeKind = scopeText.includes('(commit message)') ? 'commit' : scopeText.includes('(tên nhánh)') ? 'branch' : 'files';
    const scope = scopeKind === 'files' ? globsOf(scopeText) : [];
    const rm = field(lines2, 'Cần đọc thêm')?.text ?? '';
    const readMore = rm.trim() === '—' ? [] : globsOf(rm);
    const model = lines2.find(l => /^\*\*Model:\*\*/.test(l))?.replace(/^\*\*Model:\*\*/, '').trim() ?? null;
    set.rules.push({
      code, name: name.trim(), level: lv.first, scopeKind, scope: scopeKind !== 'files' ? [] : scope.length ? scope : [...set.appliesTo], pathGates, regexGates, regexHints,
      readMore, fix: field(lines2, 'Gợi ý sửa')?.text ?? '', reason: (field(lines2, 'Lý do tồn tại')?.text ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_REASON_CHARS), noIgnore: /^\*\*Bỏ qua được:\*\*\s*không/mu.test(lines2.join('\n')),
      proposed: /^\*\*Trạng thái:\*\*\s*đề xuất/mu.test(lines2.join('\n')),
      model, block: lines2.join('\n'), blockForRepo: repo => blockForRepo(lines2, repo),
    });
  });
  if (!set.rules.length) warnings.push(`${path}: không đọc được luật nào`);
  return set;
}

export function loadRules(dir, { repo }) {
  const sets = [], warnings = [], errors = [], seen = new Map();
  const files = readdirSync(dir).filter(f => f.endsWith('.md') && statSync(join(dir, f)).isFile()).sort();
  for (const f of files) {
    const set = parseRuleFile(readFileSync(join(dir, f), 'utf8'), { path: join(dir, f).split(sep).join('/') });
    warnings.push(...set.warnings);
    if (!set.ok) { errors.push(...set.errors); continue; }
    if (set.repo !== 'both' && set.repo !== repo) continue;
    const dup = set.rules.find(r => seen.has(r.code));
    if (dup) { errors.push(`trùng mã ${dup.code} (đã có trong ${seen.get(dup.code)}) — bỏ file ${f}`); continue; }
    set.rules.forEach(r => seen.set(r.code, f));
    sets.push(set);
  }
  return { sets, warnings, errors };
}
