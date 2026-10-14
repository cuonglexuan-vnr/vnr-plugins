// plugins/vnr-swe/skills/vnr-review/scripts/plan.mjs
// Phân tầng FAIL-first, áp trần + ưu tiên, sinh job cho subagent.
import { inScope, runGates, findIgnores, resolveReadMore } from './gate.mjs';

export const DEFAULT_CONFIG = { maxJobs: 30, maxJobsPerRule: 4, reserve: ['sec'], parallel: 6, priority: ['sec', 'data', 'arch-be', 'arch-fe', 'slop', 'fw-be', 'fw-fe', 'name', 'uiux'] };

// "Cần đọc thêm" của một ứng viên nhiều file: gộp theo từng file (tối đa 10 file đầu), bỏ trùng, trần 10 file kết quả.
const MAX_READ_MORE_FILES = 10;
// Trần tổng độ dài hunk của job gộp; file vượt trần không kèm hunk mà chuyển sang "đọc khi cần".
const MAX_MERGED_HUNK_CHARS = 60_000;
function mergeReadMore(c, repo, siblings) {
  const parts = c.paths.slice(0, MAX_READ_MORE_FILES).map(p => resolveReadMore(c.rule.readMore, { file: p, repoRoot: repo.root, siblings }));
  if (parts.length === 1) return parts[0];
  return { files: [...new Set(parts.flatMap(p => p.files))].slice(0, MAX_READ_MORE_FILES), unresolved: [...new Set(parts.flatMap(p => p.unresolved))] };
}

export function buildPlan({ repo, baseline, diff, rules, config = DEFAULT_CONFIG, siblings = {}, commitMessages = '', commits = [], branch = '', full = false, aspects = null }) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const diffPaths = diff.files.map(f => f.path);
  const sets = rules.sets.filter(s => !aspects || aspects.includes(s.aspect));
  const codeIndex = new Map(); for (const s of sets) for (const r of s.rules) codeIndex.set(r.code, r);
  const ignored = [], invalidIgnores = [], candidates = [], regexWarnings = [];
  const isFailLevel = r => r.level === 'FAIL' || r.level === 'FAIL+WARN';
  const kindOf = r => r.scopeKind ?? 'files';
  const reHit = (rule, text) => rule.regexGates.some(re => { re.lastIndex = 0; return re.test(text); });
  const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0);                // không phụ thuộc locale máy
  const gateless = new Map();                                       // mã luật → ứng viên gộp của luật FAIL không gate

  for (const file of diff.files) {
    // Marker trong commit mang path riêng: chỉ nhận marker đúng file này, marker file khác tự báo khi tới lượt file đó.
    const igns = findIgnores(file, commitMessages).filter(i => i.path === file.path);
    for (const ig of igns) {
      const r = codeIndex.get(ig.code);
      if (!ig.valid) invalidIgnores.push(ig);
      else if (r?.noIgnore) invalidIgnores.push({ ...ig, valid: false, why: 'luật không cho bỏ qua' });
    }
    const okIgns = igns.filter(i => i.valid && !codeIndex.get(i.code)?.noIgnore);
    const ignoredHere = (code, n) => okIgns.find(i => i.code === code && (i.line === null || i.line === n));
    for (const set of sets) for (const rule of set.rules) {
      if (rule.level === 'RETIRED' || kindOf(rule) !== 'files' || !inScope(file.path, set, rule)) continue;
      const g = runGates(rule, file, diffPaths);
      const candidate = !g.hasGate || g.pathHit || g.regexHits.length > 0;
      if (!candidate) continue;
      const hits = g.regexHits.filter(h => { const ig = ignoredHere(rule.code, h.n); if (ig) ignored.push(ig); return !ig; });
      if (g.regexHits.length && !hits.length) continue;                 // mọi dòng khớp đều được bỏ qua có lý do
      if (!g.regexHits.length) { const ig = okIgns.find(i => i.code === rule.code); if (ig) { ignored.push(ig); continue; } }   // cấp file: marker hợp lệ bất kỳ dòng nào
      const isFail = isFailLevel(rule);
      if (!isFail && !full) { for (const h of hits) regexWarnings.push({ aspect: set.aspect, code: rule.code, name: rule.name, file: file.path, n: h.n, text: h.text, fix: rule.fix, reason: rule.reason }); continue; }
      // Tín hiệu duy nhất là path-gate (khớp cả diff, không riêng file này) hoặc không có gate → một job cho cả luật, không phải một job mỗi file.
      // hasHits chỉ đúng với luật chỉ có path-gate; luật có regex-gate mà file không khớp dòng nào thì path-gate chỉ là gate rộng (vd. {apps,libs}/**/*.ts), không phải tín hiệu.
      if (!hits.length && isFail) {
        const c = gateless.get(rule.code) ?? { set, rule, hasHits: g.pathHit && !rule.regexGates.length, hits: [], paths: [], hunks: [], chunks: [] };
        c.paths.push(file.path); c.chunks.push({ path: file.path, hunks: file.hunks }); gateless.set(rule.code, c);
        continue;
      }
      candidates.push({ set, rule, hasHits: hits.length > 0 || (g.pathHit && !rule.regexGates.length), hits, paths: [file.path], hunks: file.hunks });
    }
  }
  // Giới hạn fan-out mỗi luật: luật có hit ở quá `maxJobsPerRule` file → giữ các file nhiều hit nhất làm job đơn, gộp phần còn lại thành một job.
  const byRule = new Map(), fanout = [], gone = new Set();
  for (const c of candidates) if (c.hits.length) byRule.set(c.rule.code, [...(byRule.get(c.rule.code) ?? []), c]);
  for (const group of byRule.values()) {
    if (group.length <= cfg.maxJobsPerRule) continue;
    const ordered = [...group].sort((a, b) => b.hits.length - a.hits.length || cmp(a.paths[0], b.paths[0]));
    const rest = ordered.slice(cfg.maxJobsPerRule).sort((a, b) => cmp(a.paths[0], b.paths[0]));
    for (const c of rest) gone.add(c);
    fanout.push({
      set: rest[0].set, rule: rest[0].rule, hasHits: true, hits: rest.flatMap(c => c.hits), paths: rest.map(c => c.paths[0]), hunks: [],
      chunks: rest.map(c => ({ path: c.paths[0], hunks: c.hunks })),
    });
  }
  // Ứng viên gộp: ghép hunk theo từng file, dừng khi vượt trần (file đầu luôn được giữ); phần còn lại vào `truncated`.
  candidates.splice(0, candidates.length, ...candidates.filter(c => !gone.has(c)), ...fanout);
  for (const c of [...gateless.values(), ...fanout]) {
    let size = 0; const kept = [], truncated = [];
    for (const ch of c.chunks) {
      const n = ch.hunks.reduce((a, h) => a + h.length, 0);
      if (kept.length && size + n > MAX_MERGED_HUNK_CHARS) { truncated.push(ch.path); continue; }
      size += n; kept.push(ch);
    }
    c.hunks = kept.flatMap(ch => [`### ${ch.path}`, ...ch.hunks]); c.truncated = truncated;
  }
  candidates.push(...gateless.values());

  // Luật phạm vi commit / tên nhánh: không đụng diff.files; mỗi mục = một commit hoặc tên nhánh.
  const commitItems = commits.map(c => ({
    label: `(commit ${c.sha})`, text: c.subject, full: `${c.subject}\n${c.body ?? ''}`,
    hunk: ['@@ commit ' + c.sha + ' @@', '+' + c.subject, ...(c.body ?? '').split('\n').map(l => l.trimEnd()).filter(Boolean).map(l => '+' + l)].join('\n'),
  }));
  const branchItems = branch ? [{ label: '(branch)', text: branch, full: branch, hunk: `@@ branch @@\n+${branch}` }] : [];
  for (const set of sets) for (const rule of set.rules) {
    const kind = kindOf(rule);
    if (rule.level === 'RETIRED' || kind === 'files') continue;
    const items = kind === 'commit' ? commitItems : branchItems;
    const gated = rule.regexGates.length > 0;
    const hit = items.filter(i => !gated || reHit(rule, i.text) || reHit(rule, i.full));
    if (!hit.length) continue;
    if (!isFailLevel(rule) && !full) {
      if (gated) for (const i of hit) regexWarnings.push({ aspect: set.aspect, code: rule.code, name: rule.name, file: i.label, n: 0, text: i.text, fix: rule.fix, reason: rule.reason });
      continue;
    }
    candidates.push({
      set, rule, hasHits: gated, hits: gated ? hit.map(i => ({ n: 0, text: i.text })) : [],
      file: kind === 'commit' ? '(commit)' : '(branch)', paths: hit.map(i => i.label), hunks: hit.map(i => i.hunk), readMore: { files: [], unresolved: [] },
    });
  }

  const pri = a => { const i = cfg.priority.indexOf(a); return i < 0 ? cfg.priority.length : i; };
  const first = c => c.file ?? c.paths[0];
  // Luật có tín hiệu (hit regex / path-gate) đi trước luật không gate; trong mỗi nhóm theo ưu tiên aspect.
  candidates.sort((a, b) => (b.hasHits - a.hasHits) || pri(a.set.aspect) - pri(b.set.aspect) || b.hits.length - a.hits.length || cmp(a.rule.code, b.rule.code) || cmp(first(a), first(b)));
  // Khía cạnh trong `reserve` luôn được giữ (kể cả vượt maxJobs); các khía cạnh khác chia phần slot còn lại. Giữ nguyên thứ tự đã sắp.
  const reserved = candidates.filter(c => cfg.reserve.includes(c.set.aspect));
  const slots = Math.max(0, cfg.maxJobs - reserved.length);
  const keepSet = new Set([...reserved, ...candidates.filter(c => !reserved.includes(c)).slice(0, slots)]);
  const kept = candidates.filter(c => keepSet.has(c)), dropped = candidates.filter(c => !keepSet.has(c));
  const jobs = kept.map((c, i) => ({
    id: `${c.rule.code}__${i + 1}`, aspect: c.set.aspect, code: c.rule.code, name: c.rule.name, level: c.rule.level,
    model: c.rule.model || c.set.model || 'haiku', file: first(c), files: c.paths, hunks: c.hunks, hits: c.hits,
    section1: c.set.section1, block: c.rule.blockForRepo(repo.kind === 'be' ? 'be' : 'fe'),
    readMore: c.readMore ?? mergeReadMore(c, repo, siblings), fix: c.rule.fix, reason: c.rule.reason, noIgnore: !!c.rule.noIgnore,
    ...(c.truncated?.length ? { truncated: c.truncated } : {}),
  })).map(j => (j.truncated ? { ...j, readMore: { ...j.readMore, files: [...new Set([...j.readMore.files, ...j.truncated])] } } : j));
  const uniqIgn = [...new Map(ignored.map(i => [`${i.code}|${i.path}|${i.line}`, i])).values()];
  return {
    repo: { name: repo.name, kind: repo.kind, root: repo.root }, baseline, fileCount: diff.files.length, skippedFiles: diff.skipped,
    jobs, regexWarnings, ignored: uniqIgn, invalidIgnores, skippedJobs: dropped.map(c => ({ code: c.rule.code, file: first(c) })),
    ruleSets: sets.map(s => ({ aspect: s.aspect, version: s.version, ruleCount: s.rules.length })),
    warnings: rules.warnings, errors: rules.errors, config: cfg,
  };
}
