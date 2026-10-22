// plugins/vnr-swe/skills/vnr-review/scripts/ledger.mjs
// Sổ theo dõi các lượt review (thuần, không fs): ô nào đã có kết quả hợp lệ, ô nào giao lại, ô nào bỏ cuộc.
// Một ô được giao tối đa MAX_ATTEMPTS lần; ô đã có kết quả không bao giờ bị tính thêm lượt.
const MAX_ATTEMPTS = 2;
// Windows không phân biệt hoa/thường trong đường dẫn.
const WIN = process.platform === 'win32';
const samePath = (a, b) => (WIN ? a.toLowerCase() === b.toLowerCase() : a === b);

// Đường dẫn agent ghi → tương đối, dạng posix: bỏ tiền tố repoRoot (đúng ranh giới thư mục) và './'.
// File giả "(commit <sha>)" / "(branch)" và giá trị không phải chuỗi giữ nguyên.
export function normalizePath(file, repoRoot = '') {
  if (typeof file !== 'string' || file.startsWith('(')) return file;
  let p = file.trim().replaceAll('\\', '/');
  const root = String(repoRoot ?? '').replaceAll('\\', '/').replace(/\/+$/, '');
  if (root && samePath(p.slice(0, root.length + 1), root + '/')) p = p.slice(root.length + 1);
  return p.replace(/^(\.\/)+/, '');
}

export function buildLedger(plans) {
  const seen = new Set(), cells = [];
  for (const plan of plans) for (const c of plan.cells) {
    // Kết quả nằm theo repo (results/<repo>/…) nên id chỉ cần duy nhất trong một repo.
    const k = `${c.repo}|${c.id}`;
    if (seen.has(k)) throw new Error(`trùng id lượt review ${c.id} (repo ${c.repo})`);
    seen.add(k);
    cells.push({ id: c.id, fileId: c.fileId, repo: c.repo, kind: c.kind, aspect: c.aspect, title: c.title, chunk: c.chunk, codes: c.codes, files: c.files,
      resultFile: `results/${c.repo}/${c.fileId}.json`, attempts: 0, failed: false });
  }
  return { cells };
}

// Kết quả hợp lệ ⇔ có mảng `rules` và mỗi mã của ô có ít nhất một dòng; status/findings lạ vẫn tính là xong.
export function resultOk(cell, json) {
  return Array.isArray(json?.rules) && cell.codes.every(c => json.rules.some(r => r && r.code === c));
}

// Mức hiệu lực của một finding: FAIL chỉ khi luật mức FAIL/FAIL+WARN và checker ghi đã khớp "FAIL khi".
// Thiếu `level`: luật chỉ FAIL → FAIL; luật FAIL+WARN → WARN (thận trọng). Luật WARN → luôn WARN.
export function findingLevel(rule, f) {
  const lv = typeof f?.level === 'string' ? f.level.trim().toUpperCase() : '';
  if (rule?.level === 'FAIL') return lv === 'WARN' ? 'WARN' : 'FAIL';
  return rule?.level === 'FAIL+WARN' && lv === 'FAIL' ? 'FAIL' : 'WARN';
}

// Một dòng mỗi mã: gộp dòng trùng (findings nối lại; một dòng checked là checked), mã ngoài ô → cảnh báo.
// `file` của finding: chuẩn hoá theo normalizePath rồi quy về đúng mục trong `cell.files` nếu khớp — verify-jobs và report so sánh bằng ===.
// `level` của finding được ghi đè bằng mức hiệu lực (findingLevel) — verify-jobs và report chỉ đọc giá trị này.
export function normalizeResult(cell, json, repoRoot = '') {
  const canon = f => { const p = normalizePath(f, repoRoot); return typeof p === 'string' ? cell.files.find(x => samePath(x, p)) ?? p : p; };
  const rows = new Map(), warnings = [];
  for (const r of Array.isArray(json?.rules) ? json.rules : []) {
    if (!r || typeof r.code !== 'string') continue;
    if (!cell.codes.includes(r.code)) { warnings.push(`${cell.id}: mã ${r.code} không thuộc nhóm luật được giao — bỏ qua`); continue; }
    const status = r.status === 'n/a' ? 'n/a' : 'checked';
    const rule = cell.rules?.find(x => x.code === r.code);
    const findings = Array.isArray(r.findings) ? r.findings.filter(f => f && typeof f === 'object')
      .map(f => ({ ...f, ...('file' in f ? { file: canon(f.file) } : {}), level: findingLevel(rule, f) })) : [];
    const prev = rows.get(r.code);
    if (!prev) { rows.set(r.code, { status, note: typeof r.note === 'string' ? r.note : '', findings }); continue; }
    if (status === 'checked') prev.status = 'checked';
    if (!prev.note && typeof r.note === 'string') prev.note = r.note;
    prev.findings.push(...findings);
  }
  return { rows, warnings };
}

// Ô chưa xong: còn lượt → tăng attempts và giao lại; hết lượt → failed. Ô xong giữ nguyên.
export function nextDispatch(ledger, isOk) {
  const retry = [], failed = [];
  const cells = ledger.cells.map(c => {
    if (isOk(c)) return c;
    if (c.attempts < MAX_ATTEMPTS) { const n = { ...c, attempts: c.attempts + 1 }; retry.push(n); return n; }
    const n = { ...c, failed: true }; failed.push(n); return n;
  });
  return { ledger: { ...ledger, cells }, retry, failed };
}
