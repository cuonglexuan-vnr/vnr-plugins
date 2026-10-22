// plugins/vnr-swe/skills/vnr-review/scripts/report.mjs
// Báo cáo markdown của /vnr-review (orchestrator dán nguyên văn, không fence): tiêu đề PASS/WARN/FAIL, bảng 4 cột (# · Kết quả · Luật · Vị trí = tên file),
// mỗi dòng bảng một thẻ chi tiết cùng số (đường dẫn đầy đủ, Vấn đề, Sửa), dòng chân độ phủ, dòng cuối luôn là `VERDICT:<…>`.
// Ô xong tính lại từ kết quả trên đĩa (`resultOk`), không tin trạng thái trong ledger. Nhiều repo: một tiêu đề chung, mỗi repo một mục ###.
import { resultOk, normalizeResult } from './ledger.mjs';

// Số dòng bảng (và thẻ) tối đa của một repo; phần còn lại gói vào một dòng "+n dòng khác".
const MAX_ROWS = 10;
// Độ dài tối đa của "Vấn đề" và của "Sửa" trong thẻ.
const CLIP = 400;
const LEGEND = '**FAIL**: phải sửa trước khi push · **WARN**: nên xem; cố ý giữ thì ghi chú bỏ qua (xem user-guide)';
const RANK = { PASS: 0, WARN: 1, FAIL: 2 };
const fmtMs = ms => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`; };
// Một dòng markdown: không fence, ≤ n ký tự; `<` ngoài cặp backtick → `&lt;` (thẻ như <nz-select> không bị render nuốt); trong bảng thêm thoát `|`.
const md = (s, n = Infinity, cell = false) => {
  let t = String(s ?? '').replace(/\s+/g, ' ').trim().replace(/`{3,}/g, '`');
  if (t.length > n) t = t.slice(0, n - 1) + '…';
  t = t.split(/(`[^`]*`)/).map((p, i) => (i % 2 ? p : p.replaceAll('<', '&lt;'))).join('');
  return cell ? t.replaceAll('|', '\\|') : t;
};
// File giả `(commit abc1234)` / `(branch)` / `(không rõ file)` giữ nguyên, không `:dòng`. Tách theo `/` lẫn `\` (không phụ thuộc OS).
const isPseudo = f => /^\(.*\)$/.test(f);
const base = f => (isPseudo(f) ? f : f.split(/[\\/]/).pop());

// Một repo: dòng bảng theo mã luật, nhóm luật chưa kiểm hết, độ phủ, verdict.
function reviewRepo(plan, results = {}, verifications = {}) {
  const done = new Set(plan.cells.filter(c => resultOk(c, results[c.fileId])));
  const warnings = [], byCode = new Map();
  for (const cell of done) {
    const { rows, warnings: w } = normalizeResult(cell, results[cell.fileId], plan.repo.root);
    warnings.push(...w);
    for (const [code, row] of rows) {
      const rule = cell.rules.find(r => r.code === code);
      for (const f of row.findings) {
        // FAIL chỉ khi finding mức FAIL (findingLevel), file trong diff của ô và verifier xác nhận; `wrong` bỏ hẳn;
        // ngoài diff hoặc chưa trả lời → WARN. Finding mức WARN không qua verify, không bao giờ bị bỏ.
        let level = 'WARN';
        if (f.level === 'FAIL' && cell.files.includes(f.file)) {
          const v = verifications[`${cell.fileId}-${code}-${cell.files.indexOf(f.file)}`]?.verdict;
          if (v === 'wrong') continue;
          if (v === 'confirmed') level = 'FAIL';
        }
        // Không rõ file thì số dòng vô nghĩa; dòng null/0 → chỉ file.
        const file = typeof f.file === 'string' && f.file.trim() ? f.file.trim() : '(không rõ file)';
        const line = !isPseudo(file) && f.line ? `:${String(f.line).trim()}` : '';
        if (!byCode.has(code)) byCode.set(code, { code, items: [] });
        byCode.get(code).items.push({ level, file, line, issue: f.issue || rule.name, fix: f.fix || rule.fix });
      }
    }
  }
  // Cùng mã gộp một dòng: mức xấu nhất; vị trí, issue và fix lấy từ finding FAIL đầu tiên (nếu có).
  // Bảng: tên file `:dòng`; thẻ: đường dẫn đầy đủ trong backtick; `(+n)` = số vị trí khác.
  const rows = [...byCode.values()].map(({ code, items }) => {
    items.sort((a, b) => RANK[b.level] - RANK[a.level]);
    const count = new Set(items.map(i => i.file + i.line)).size, [first] = items;
    const more = count > 1 ? ` (+${count - 1})` : '';
    return {
      code, level: first.level, count,
      short: md(base(first.file) + first.line, Infinity, true) + more,
      full: (isPseudo(first.file) ? first.file : `\`${(first.file + first.line).replaceAll('`', '')}\``) + more,
      issue: md(first.issue, CLIP), fix: md(first.fix, CLIP),
    };
  }).sort((a, b) => RANK[b.level] - RANK[a.level] || b.count - a.count || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));

  const sets = (plan.ruleSets ?? []).map(s => ({ ...s, left: plan.cells.filter(c => c.aspect === s.aspect && !done.has(c)).reduce((n, c) => n + c.codes.length, 0) }));
  const incomplete = sets.some(s => s.left);
  const fails = rows.filter(r => r.level === 'FAIL').length;
  return {
    plan, rows, sets, incomplete, warnings,
    checked: [...done].reduce((n, c) => n + c.codes.length, 0),
    inScope: sets.reduce((n, s) => n + s.inScope, 0),
    counts: rows.length ? ` (${fails} FAIL · ${rows.length - fails} WARN)` : '',
    verdict: fails ? 'FAIL' : rows.length || incomplete ? 'WARN' : 'PASS',
  };
}

// Phần thân một repo: bảng + thẻ (nếu có dòng), chú giải, ⚠ nhóm chưa kiểm hết, dòng độ phủ.
function body(r, pluginVersion) {
  const { plan, rows, sets } = r, L = [];
  // Mỗi khối ngoài bảng là một đoạn riêng (dòng trống phía trước): markdown nối các dòng liền nhau thành một đoạn,
  // và dòng thường ngay sau bảng GFM bị coi là một hàng của bảng.
  const para = (...s) => { if (L.length) L.push(''); L.push(...s); };
  if (rows.length) {
    const shown = rows.slice(0, MAX_ROWS);
    L.push('| # | Kết quả | Luật | Vị trí |', '|---|---|---|---|');
    // `#` đánh từ 1 theo thứ tự hiển thị, lại từ 1 trong mỗi mục repo; thẻ dùng cùng số.
    shown.forEach((row, i) => L.push(`| ${i + 1} | ${row.level} | ${row.code} | ${row.short} |`));
    shown.forEach((row, i) => para(`**#${i + 1} · ${row.level} · ${row.code}**`, `- Vị trí: ${row.full}`, `- Vấn đề: ${row.issue}`, ...(row.fix ? [`- Sửa: ${row.fix}`] : [])));
    if (rows.length > MAX_ROWS) para(`_(+${rows.length - MAX_ROWS} dòng khác: ${rows.slice(MAX_ROWS).map(x => x.code).join(', ')})_`);
    para(LEGEND);
  }
  for (const s of sets.filter(s => s.left)) para(`⚠ Chưa kiểm hết: nhóm "${s.title ?? s.aspect}" còn ${s.left} luật chưa xem. Gõ /vnr-review ${plan.repo.kind} để chạy lại.`);
  if (!sets.length) { para(`Không có luật nào áp dụng cho ${plan.fileCount} file thay đổi · vnr-review ${pluginVersion}`); return L; }
  const invalid = plan.invalidIgnores ?? [];
  const truncated = new Set(plan.cells.flatMap(c => c.truncated ?? []));
  para([
    `Đã kiểm ${r.checked} luật, đủ ${sets.filter(s => !s.left).length}/${sets.length} nhóm`,
    `${plan.ignored?.length ?? 0} chỗ bỏ qua theo ghi chú`,
    ...(invalid.length ? [`${invalid.length} ghi chú bỏ qua không được chấp nhận (${[...new Set(invalid.map(i => i.code))].join(', ')})`] : []),
    ...(truncated.size ? [`${truncated.size} file quá lớn chưa đọc hết`] : []),
    `vnr-review ${pluginVersion}`,
  ].join(' · '));
  return L;
}

// `ledger` nhận để giữ giao diện với cli; ô xong luôn tính lại từ `results`.
export function renderReport({ plans, ledger, results = {}, verifications = {}, elapsedMs = 0, pluginVersion = '?', ci = false }) {
  const repos = plans.map(p => reviewRepo(p, results[p.repo.name], verifications[p.repo.name]));
  const verdict = repos.reduce((v, r) => (RANK[r.verdict] > RANK[v] ? r.verdict : v), 'PASS');
  const time = ci ? '' : ` · ${fmtMs(elapsedMs)}`;   // CI bỏ thời gian để đầu ra ổn định
  const L = [];
  if (repos.length === 1) {
    const [r] = repos, p = r.plan;
    const untracked = p.untrackedCount > 0 ? ` (${p.untrackedCount} chưa git add)` : '';
    L.push(`## vnr-review — ${verdict}${r.counts} · ${p.repo.name} @ ${p.branch || 'HEAD'} (${p.sha7}) · ${p.fileCount} file${untracked}${time}`, '', ...body(r, pluginVersion));
  } else {
    const files = repos.reduce((n, r) => n + r.plan.fileCount, 0);
    L.push(`## vnr-review — ${verdict} · ${repos.map(r => `${r.plan.repo.name} ${r.verdict}${r.counts}`).join(' · ')} · ${files} file${time}`);
    for (const r of repos) {
      if (r.verdict === 'PASS') L.push('', `### ${r.plan.repo.name} — PASS · đã kiểm ${r.checked} luật`);
      else L.push('', `### ${r.plan.repo.name} (${r.plan.sha7})`, '', ...body(r, pluginVersion));
    }
  }
  const coverage = { done: repos.reduce((n, r) => n + r.checked, 0), total: repos.reduce((n, r) => n + r.inScope, 0) };
  // VERDICT luôn là dòng cuối của báo cáo (một dòng cho mọi repo); --ci thêm COVERAGE/RULES sau nó.
  L.push('', `VERDICT:${verdict}`);
  if (ci) {
    L.push(`COVERAGE=${coverage.done}/${coverage.total}`);
    for (const r of repos) L.push(`RULES=${repos.length > 1 ? `${r.plan.repo.name} ` : ''}${r.sets.map(s => `${s.aspect} v${s.version}`).join(' · ') || '(không có)'}`);
  }
  return { text: L.join('\n'), verdict, incomplete: repos.some(r => r.incomplete), coverage, warnings: repos.flatMap(r => r.warnings) };
}
