// plugins/vnr-swe/skills/vnr-review/scripts/plan.mjs
// Gộp luật theo aspect, bỏ luật đề xuất, lọc phạm vi, chia ô (≤ chunkSize luật và ≤ cellBlockChars ký tự khối luật) cho subagent.
import { inScope, findIgnores, resolveReadMore } from './gate.mjs';

// Khoá lạ trong config.json (vd. maxJobs của v1) bị bỏ qua.
export const DEFAULT_CONFIG = { chunkSize: 20, cellBlockChars: 60_000, parallel: 8, skipProposed: true };
// Trần tổng hunk file thật của một ô (commit/branch không tính): file thật đầu luôn giữ; mỗi file sau giữ nếu còn vừa,
// không thì vào `truncated` (agent tự Read các dòng đã đổi) và hunk của nó vào `truncatedHunks` (cho verify-jobs).
const MAX_HUNK_CHARS = 60_000;
// Trần số file "Cần đọc thêm" của một ô (agent có ≤ 12 Read ngoài hunk).
const MAX_READ_MORE_FILES = 10;
const isFail = r => r.level === 'FAIL' || r.level === 'FAIL+WARN';

// Các khoảng dòng sau thay đổi của một hunk text (`@@ -a,b +c,d @@` → c–c+d-1); hunk chỉ xoá (d = 0) bỏ qua.
export function hunkRanges(text) {
  const out = [];
  for (const m of String(text ?? '').matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const c = Number(m[1]), d = m[2] === undefined ? 1 : Number(m[2]);
    if (d > 0) out.push(d === 1 ? `${c}` : `${c}–${c + d - 1}`);
  }
  return out;
}

// Mọi file luật cùng aspect thành một nhóm, theo thứ tự gặp đầu tiên; mỗi luật giữ set của chính nó để xét phạm vi.
function groupByAspect(sets) {
  const m = new Map();
  for (const set of sets) {
    if (!m.has(set.aspect)) m.set(set.aspect, { aspect: set.aspect, title: set.title ?? null, model: null, versions: [], texts: [], members: [] });
    const g = m.get(set.aspect);
    g.model ??= set.model ?? null;
    if (!g.versions.includes(set.version)) g.versions.push(set.version);
    if (set.section1) g.texts.push(set.section1);
    g.members.push(...set.rules.map(rule => ({ set, rule })));
  }
  return [...m.values()].map(({ versions, texts, ...g }) => ({ ...g, version: versions.join('/'), section1: texts.join('\n\n') }));
}

// "Cần đọc thêm" của ô: giải theo từng (luật, file), bỏ trùng, dừng ở trần.
// ponytail: mỗi (luật, file) một lần quét thư mục; thêm cache theo pattern đã giải nếu plan chậm trên repo lớn.
function cellReadMore(chunk, repo, siblings) {
  const files = new Set(), unresolved = new Set();
  for (const a of chunk) {
    if (!a.rule.readMore?.length) continue;
    for (const p of a.paths) {
      if (files.size >= MAX_READ_MORE_FILES) break;
      if (p.startsWith('(')) continue;                                         // file giả (commit)/(branch)
      const r = resolveReadMore(a.rule.readMore, { file: p, repoRoot: repo.root, siblings });
      r.files.forEach(f => files.add(f)); r.unresolved.forEach(u => unresolved.add(u));
    }
  }
  return { files: [...files].slice(0, MAX_READ_MORE_FILES), unresolved: [...unresolved] };
}

export function buildPlan({ repo, baseline, diff, rules, config = DEFAULT_CONFIG, siblings = {}, commitMessages = '', commits = [], branch = '', aspects = null }) {
  const cfg = Object.fromEntries(Object.entries(DEFAULT_CONFIG).map(([k, v]) => [k, config?.[k] ?? v]));
  const blockRepo = repo.kind === 'be' ? 'be' : 'fe';
  // Mục để xét: commit / tên nhánh (file giả, đặt trước để không bao giờ bị cắt) rồi file theo thứ tự diff.
  const commitItems = commits.map(c => ({
    path: `(commit ${c.sha})`, pseudo: true,
    text: [`@@ commit ${c.sha} @@`, '+' + c.subject, ...(c.body ?? '').split('\n').map(l => l.trimEnd()).filter(Boolean).map(l => '+' + l)].join('\n'),
  }));
  const branchItems = branch ? [{ path: '(branch)', pseudo: true, text: `@@ branch @@\n+${branch}` }] : [];
  const items = [...commitItems, ...branchItems, ...diff.files.map(f => ({ path: f.path, text: f.hunks.join('\n') }))];

  const cells = [], ruleSets = [];
  for (const g of groupByAspect(rules.sets.filter(s => !aspects || aspects.includes(s.aspect)))) {
    const active = []; let skippedProposed = 0;
    for (const { set, rule } of g.members) {
      if (rule.level === 'RETIRED') continue;
      if (cfg.skipProposed && rule.proposed) { skippedProposed++; continue; }
      const kind = rule.scopeKind ?? 'files';
      const paths = kind === 'commit' ? commitItems.map(i => i.path) : kind === 'branch' ? branchItems.map(i => i.path)
        : diff.files.filter(f => inScope(f.path, set, rule)).map(f => f.path);
      if (paths.length) active.push({ rule, paths: new Set(paths), block: rule.blockForRepo(blockRepo) });
    }
    if (!active.length) continue;
    ruleSets.push({ aspect: g.aspect, title: g.title, version: g.version, ruleCount: g.members.length, inScope: active.length, skippedProposed });

    // FAIL/FAIL+WARN trước (giữ thứ tự file), rồi WARN; ô mới khi thêm luật kế tiếp vượt chunkSize hoặc cellBlockChars.
    const chunks = []; let cur = [], size = 0;
    for (const a of [...active.filter(a => isFail(a.rule)), ...active.filter(a => !isFail(a.rule))]) {
      if (cur.length && (cur.length + 1 > cfg.chunkSize || size + a.block.length > cfg.cellBlockChars)) { chunks.push(cur); cur = []; size = 0; }
      cur.push(a); size += a.block.length;
    }
    chunks.push(cur);

    chunks.forEach((chunk, i) => {
      const id = `${repo.kind}/${g.aspect}/${i + 1}`;
      const mine = items.filter(it => chunk.some(a => a.paths.has(it.path)));
      const hunks = [], truncated = [], truncatedHunks = {}; let total = 0, kept = 0;
      for (const it of mine) {
        if (!it.pseudo && kept && total + it.text.length > MAX_HUNK_CHARS) { truncated.push(it.path); truncatedHunks[it.path] = it.text; continue; }
        hunks.push({ path: it.path, text: it.text });
        if (!it.pseudo) { total += it.text.length; kept++; }
      }
      cells.push({
        id, fileId: id.replaceAll('/', '_'), repo: repo.name, kind: repo.kind, aspect: g.aspect, title: g.title,
        chunk: `${i + 1}/${chunks.length}`, chunkIndex: i + 1, chunkCount: chunks.length,
        model: chunk.find(a => a.rule.model)?.rule.model ?? g.model ?? 'sonnet',
        codes: chunk.map(a => a.rule.code),
        rules: chunk.map(({ rule, block }) => ({ code: rule.code, name: rule.name, level: rule.level, block, fix: rule.fix ?? '', noIgnore: !!rule.noIgnore })),
        files: mine.map(it => it.path), hunks, ...(truncated.length ? { truncated, truncatedHunks } : {}),
        section1: g.section1, readMore: cellReadMore(chunk, repo, siblings),
        noIgnoreCodes: chunk.filter(a => a.rule.noIgnore).map(a => a.rule.code),
      });
    });
  }

  // Marker review-ignore: agent tự bỏ qua; script chỉ đếm cho dòng chân. Marker trong commit chỉ nhận đúng path của file đó.
  const inCell = new Map(cells.flatMap(c => c.rules.map(r => [r.code, r])));
  const ignored = new Map(), invalidIgnores = [];
  for (const file of diff.files) for (const ig of findIgnores(file, commitMessages).filter(i => i.path === file.path)) {
    const r = inCell.get(ig.code);
    if (!ig.valid) invalidIgnores.push(ig);
    else if (r?.noIgnore) invalidIgnores.push({ ...ig, valid: false, why: 'luật không cho bỏ qua' });
    else if (r) ignored.set(`${ig.code}|${ig.path}|${ig.line}`, ig);
  }

  return {
    repo: { name: repo.name, kind: repo.kind, root: repo.root }, baseline, branch,
    fileCount: diff.files.length, untrackedCount: diff.files.filter(f => f.status === 'U').length, skippedFiles: diff.skipped,
    cells, ruleSets, ignored: [...ignored.values()], invalidIgnores, warnings: rules.warnings, errors: rules.errors, config: cfg,
  };
}
