// Lọc phạm vi bằng glob, marker review-ignore, giải "Cần đọc thêm" — thuần script.
import path from 'node:path';
import { readdirSync, statSync, existsSync } from 'node:fs';

const posix = p => p.split(String.fromCharCode(92)).join('/');

// path.posix.matchesGlob (Node >= 22): phân biệt hoa/thường; glob không bắt đầu bằng "**/" neo ở gốc repo.
export function matchGlob(file, glob) {
  return path.posix.matchesGlob(posix(file), posix(glob));
}
const anyGlob = (file, globs) => globs.some(g => matchGlob(file, g));

// appliesTo ∧ ¬excludes ∧ Phạm vi của rule (rule không khai scope → dùng appliesTo của bộ).
export function inScope(file, set, rule) {
  return anyGlob(file, set.appliesTo) && !anyGlob(file, set.excludes)
    && anyGlob(file, rule.scope?.length ? rule.scope : set.appliesTo);
}

const MARK = /review-ignore\s+([A-Z]+(?:-[A-Z]+)*-\d+)\s*(?::\s*(.*?))?\s*(?:-->|\*\/)?\s*$/u;
// Chỉ dùng [ \t] làm dấu phân cách: \s sẽ vượt qua xuống dòng và nuốt marker kế tiếp.
const COMMIT = /^review-ignore:[ \t]+([A-Z]+(?:-[A-Z]+)*-\d+)[ \t]+(\S+)[ \t]*(.*)$/gmu;
const ignore = (code, line, path, reason) =>
  ({ code, line, path, reason, valid: reason.length > 0, ...(reason ? {} : { why: 'marker thiếu lý do' }) });

// Marker trong comment (// # -- <!-- --> /* */) của dòng thêm, và dạng trong commit message.
export function findIgnores(file, commitMessages = '') {
  const out = [];
  for (const { n, text } of file.added) {
    const m = text.match(MARK);
    if (m) out.push(ignore(m[1], n, file.path, (m[2] ?? '').trim()));
  }
  // Marker trong commit mang path riêng, không lọc theo file — caller khớp theo ignore.path.
  for (const m of commitMessages.replaceAll('\r\n', '\n').matchAll(COMMIT)) out.push(ignore(m[1], null, posix(m[2]), m[3].trim()));
  return out;
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'bin', 'obj', 'dist']);
function walk(root, rel, pattern, out, limit) {
  let entries;
  try { entries = readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return; } // thiếu/không đọc được → bỏ qua
  for (const d of entries) {
    if (out.length >= limit) return;
    if (SKIP_DIRS.has(d.name) || d.isSymbolicLink()) continue;
    const r = rel ? `${rel}/${d.name}` : d.name;
    if (d.isDirectory()) walk(root, r, pattern, out, limit);
    else if (matchGlob(r, pattern)) out.push(r);
  }
}

// Phần thư mục cố định đứng đầu pattern (trước segment đầu tiên có ký tự glob) — điểm bắt đầu quét.
function literalPrefix(pattern) {
  const segs = pattern.split('/').slice(0, -1), lit = [];
  for (const s of segs) { if (/[*?{[]/.test(s)) break; lit.push(s); }
  return lit.join('/');
}

// Giải các mục "Cần đọc thêm" thành file thật; mỗi mục ≤ limit file; 0 file → unresolved.
export function resolveReadMore(items, { file, repoRoot, siblings = {} }, limit = 10) {
  file = posix(file);
  const dir = path.posix.dirname(file), basename = path.posix.basename(file);
  const cls = basename.replace(/\.[^.]+$/, '').split('.')[0].replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
  const feat = (file.match(/features\/([^/]+)/) || [])[1] ?? path.posix.basename(dir);
  const files = [], unresolved = [];
  for (const raw of items) {
    // Hàm thay thế để ký tự "$" trong đường dẫn được giữ nguyên.
    let item = raw.replaceAll('{dir}', () => dir).replaceAll('{basename}', () => basename)
      .replaceAll('{class}', () => cls).replaceAll('{feature}', () => feat);
    let root = repoRoot;
    const sib = item.match(/^\{(be|fe)\}\/(.*)$/);
    if (sib) {
      if (!siblings[sib[1]]) { unresolved.push(raw); continue; }
      root = siblings[sib[1]]; item = sib[2];
    }
    item = path.posix.normalize(item);
    if (item.startsWith('../')) { unresolved.push(raw); continue; } // thoát khỏi gốc repo/sibling
    const found = [];
    walk(root, literalPrefix(item), item, found, limit);
    if (!found.length) { unresolved.push(raw); continue; }
    const prefix = root === repoRoot ? '' : posix(path.relative(repoRoot, root)) + '/';
    files.push(...found.map(f => prefix + f));
  }
  return { files: [...new Set(files)], unresolved };
}
