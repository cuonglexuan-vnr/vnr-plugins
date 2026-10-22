#!/usr/bin/env node
// plugins/vnr-swe/skills/vnr-review/scripts/cli.mjs — entry cho SKILL.md: plan · ledger · verify-jobs · report · check. `--help` bằng tiếng Anh (quy ước CLI).
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, statSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path, { join, resolve } from 'node:path';
import os from 'node:os';
import { findRepos, baseline, collectDiff, git } from './diff.mjs';
import { loadRules } from './rules.mjs';
import { buildPlan, DEFAULT_CONFIG, hunkRanges } from './plan.mjs';
import { buildLedger, resultOk, normalizeResult, nextDispatch } from './ledger.mjs';
import { renderReport } from './report.mjs';
import { checkRules, writeOutputs } from './check.mjs';

// path.matchesGlob (gate.mjs) có từ Node 22.5.
const MIN_NODE = '22.5';
// Windows không phân biệt hoa/thường khi so sánh đường dẫn.
const norm = p => (process.platform === 'win32' ? p.toLowerCase() : p);
const realOr = p => { try { return realpathSync(p); } catch { return p; } };
const PLUGIN_JSON = fileURLToPath(new URL('../../../.claude-plugin/plugin.json', import.meta.url));
// Các tuỳ chọn bắt buộc có giá trị chuỗi — cờ trần là lỗi cú pháp.
const VALUE_OPTS = ['ws', 'repo', 'base', 'aspect', 'state', 'plugin-version', 'elapsed-ms'];
// Lệnh đọc state: mọi lỗi đầu vào là "lỗi chạy" (exit 4), không phải lỗi cú pháp.
const STATE_CMDS = ['ledger', 'verify-jobs', 'report'];
// Lời báo cho SE (không nhắc --ws: cờ đó chỉ dành cho người bảo trì, có trong --help).
const WRONG_FOLDER = 'Không thấy docs/review/rules. Mở terminal tại thư mục vnr.hrm.wiki (nơi có docs/ và src/) rồi gõ lại /vnr-review.';
const NOTHING_CHANGED = 'Không có thay đổi so với code đã push.';
// Cảnh báo biên dịch regex-gate từ rules.mjs: v2 không dùng gate nữa, `check` vẫn nhắc cho người viết luật.
const isGateWarning = w => /— bỏ gate$/.test(w);

const HELP = `vnr-review CLI (machine layer of the /vnr-review skill)
Requires Node >= ${MIN_NODE}.

  plan        [--ws <dir>] [--repo fe|be|<name>] [--base <ref>] [--aspect a,b] [--state <dir>]
  ledger      --state <dir>   next review wave: "RETRY <repo> <fileId> <model> <attempt>" lines, then "PENDING=<n> FAILED=<n>"
  verify-jobs --state <dir>   one job per (cell, rule, file) with FAIL-level findings: "VERIFY <repo> <key> <model>" lines, then "VERIFY=<n>"
  report      --state <dir> [--ci] [--plugin-version <v>] [--elapsed-ms <n>]   (defaults: plugin.json version, time since plan)
  check       [--ws <dir>]

Exit codes: plan 0 ok / 1 usage, missing rules dir, bad config.json or all repos failed / 2 nothing changed
            ledger 0 ok / 4 bad or missing --state, unreadable ledger.json
            verify-jobs 0 ok / 4 bad or missing --state, unreadable ledger.json
            report 0 PASS|WARN / 1 FAIL / 4 run error or (--ci) incomplete coverage
            check 0 ok / 1 problems
            any command: 3 unsupported Node version`;

// Phân tích argv: --khoá giá trị | --cờ | đối số vị trí.
function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { o._.push(a); continue; }
    const k = a.slice(2); const v = argv[i + 1];
    if (v !== undefined && !v.startsWith('--')) { o[k] = v; i++; } else o[k] = true;
  }
  return o;
}

// Prompt của một ô — subagent đọc nguyên file jobs/<repo>/<fileId>.prompt.md.
export function buildPrompt(cell, plan) {
  const root = plan.repo.root;
  const siblings = Object.entries(plan.siblings ?? {}).map(([kind, r]) => `${kind}: ${r}`).join(' · ') || '(không có)';
  const n = cell.rules.length;
  return [
    `Bạn là reviewer. Áp dụng ĐÚNG ${n} luật dưới đây (nhóm ${cell.aspect} — ${cell.title ?? cell.aspect}), không thêm luật từ trí nhớ.`,
    `Repo: ${root}. Mọi đường dẫn dưới đây là tương đối với thư mục đó — ghép ${root} khi Read/Grep/Glob (Glob: path = ${root}). Repo anh em: ${siblings}. KHÔNG sửa file.`,
    'Đọc theo thứ tự: hunk → file trong "Nên đọc thêm" → tối đa 12 Read khác. Chỉ FAIL khi điều kiện "FAIL khi" NHÌN THẤY trong code; không chắc → không báo.',
    'Mỗi finding ghi `level`: FAIL nếu khớp "FAIL khi", WARN nếu khớp "WARN khi"; luật mức WARN → luôn WARN.',
    `Bỏ qua dòng có \`review-ignore <MÃ>: <lý do>\` (có lý do) — TRỪ các luật: ${cell.noIgnoreCodes.join(', ') || '(không có)'}.`,
    `## Từ điển nhóm ${cell.aspect}`,
    cell.section1,
    `## Luật (${n})`,
    cell.rules.map(r => r.block).join('\n\n---\n\n'),
    `## Thay đổi cần xét — ${cell.files.length} file (chỉ phần thay đổi; mở file để xem đầy đủ)`,
    ...cell.hunks.map(h => `### ${h.path}\n${h.text}`),
    ...(cell.truncated?.length ? ['Các file sau quá dài nên không kèm hunk — Read trực tiếp, chỉ các dòng đã đổi:',
      ...cell.truncated.map(p => { const r = hunkRanges(cell.truncatedHunks?.[p]); return `- ${p}${r.length ? `: dòng ${r.join(', ')}` : ''}`; })] : []),
    `## Nên đọc thêm: ${cell.readMore.files.join(', ') || '(không có)'}`,
    `## Trả về — CHỈ một khối JSON, ĐÚNG MỘT dòng cho MỖI mã: ${cell.codes.join(', ')}`,
    `{"cell":"${cell.id}","rules":[{"code":"<MÃ>","status":"checked|n/a","note":"<bắt buộc khi n/a>","findings":[{"file":"<path tương đối>","level":"FAIL|WARN","line":<số dòng sau thay đổi>,"excerpt":"<≤100 ký tự>","issue":"<1 câu: chuyện gì sai, người đọc PR chưa đọc luật hiểu ngay>","fix":"<1 câu: làm gì; được nêu tên hàm/lệnh/field cần dùng>"}]}]}`,
  ].join('\n');
}

// Xoá kết quả của lần chạy trước trong state dir có sẵn — repo cũ không được lọt vào `report`.
// Chỉ xoá những gì `plan` và các bước sau sinh ra; tệp khác trong thư mục để nguyên.
function cleanState(state) {
  if (!existsSync(state)) return;
  const entries = readdirSync(state);
  const files = entries.filter(f => /^plan-.*\.json$/.test(f) || f === 'ledger.json' || f === 'started.json');
  const dirs = ['jobs', 'results', 'verify-jobs', 'verify'].filter(d => entries.includes(d));
  for (const f of files) rmSync(join(state, f), { force: true });
  for (const d of dirs) rmSync(join(state, d), { recursive: true, force: true });
}

function cmdPlan(o) {
  const ws = resolve(o.ws ?? process.cwd());
  const rulesDir = join(ws, 'docs', 'review', 'rules');
  if (!existsSync(rulesDir)) { console.error(WRONG_FOLDER); return 1; }
  const cfgPath = join(ws, 'docs', 'review', 'config.json');
  let config = DEFAULT_CONFIG;
  if (existsSync(cfgPath)) {
    try { config = { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(cfgPath, 'utf8')) }; }
    catch (e) { console.error(`${cfgPath} không phải JSON hợp lệ — ${e.message}`); return 1; }
  }
  const state = resolve(o.state ?? join(os.tmpdir(), 'vnr-review', new Date().toISOString().replace(/[:.]/g, '-')));
  // siblings lấy từ danh sách đầy đủ; --repo chỉ lọc vòng lặp.
  const allRepos = findRepos(ws).filter(r => r.kind);
  const repos = o.repo ? allRepos.filter(r => r.kind === o.repo || r.name === o.repo) : allRepos;
  if (!repos.length) { console.error(`Không tìm thấy repo nào (src/*) khớp${o.repo ? ` --repo ${o.repo}` : ''} trong ${ws}`); return 1; }
  // Kiểm state hợp lệ TRƯỚC khi xoá bất cứ thứ gì (lỗi --repo không được xoá lần chạy trước).
  if (existsSync(state) && !statSync(state).isDirectory()) { console.error(`--state ${state} là một file, cần thư mục`); return 1; }
  if (norm(state) === norm(ws) || norm(state) === norm(resolve(process.cwd()))) { console.error('state không được là thư mục làm việc'); return 1; }
  cleanState(state);
  mkdirSync(state, { recursive: true });
  // Mốc bắt đầu để `report` tự tính thời gian chạy.
  writeFileSync(join(state, 'started.json'), JSON.stringify({ startedAt: new Date().toISOString() }));
  const plans = []; let errored = 0;
  for (const repo of repos) {
    try {
      const b = baseline(repo.root, { override: o.base });
      if (!b.ref) { console.log(`${repo.name}: không xác định được baseline (không upstream, không develop) — bỏ qua`); continue; }
      const diff = collectDiff(repo.root, b.ref);
      if (!diff.files.length) continue;   // repo không đổi: không có plan, không có trong báo cáo
      const rules = loadRules(rulesDir, { repo: repo.kind });
      const siblings = Object.fromEntries(allRepos.filter(r => r !== repo).map(r => [r.kind, r.root]));
      const commitMessages = git(repo.root, ['log', `${b.ref}..HEAD`, '--format=%B'], { allowFail: true });
      // Commit chưa push: sha ngắn, subject, body — cho luật phạm vi (commit message).
      const commits = git(repo.root, ['log', `${b.ref}..HEAD`, '--format=%h%x1f%s%x1f%b%x1e'], { allowFail: true }).split('\x1e').map(r => r.replace(/^\n/, '')).filter(r => r.trim())
        .map(r => { const [sha, subject, body = ''] = r.split('\x1f'); return { sha: sha.trim().slice(0, 10), subject: subject.trim(), body: body.trim() }; });
      const branch = git(repo.root, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
      const plan = buildPlan({ repo, baseline: b, diff, rules, config, siblings, commitMessages, commits, branch, aspects: o.aspect ? String(o.aspect).split(',') : null });
      plan.sha7 = git(repo.root, ['rev-parse', '--short=7', 'HEAD']).trim();
      plan.siblings = siblings;
      writeFileSync(join(state, `plan-${repo.name}.json`), JSON.stringify(plan, null, 1));
      const jobsDir = join(state, 'jobs', repo.name); mkdirSync(jobsDir, { recursive: true });
      for (const cell of plan.cells) {
        writeFileSync(join(jobsDir, `${cell.fileId}.json`), JSON.stringify(cell, null, 1));
        writeFileSync(join(jobsDir, `${cell.fileId}.prompt.md`), buildPrompt(cell, plan));
      }
      plans.push(plan);
      const inScope = plan.ruleSets.reduce((s, r) => s + r.inScope, 0);
      const proposed = plan.ruleSets.reduce((s, r) => s + r.skippedProposed, 0);
      console.log(`${repo.name} @ ${branch} (vs ${b.from ?? b.ref}, ${b.how}) · ${diff.files.length} file · ${plan.ruleSets.length} nhóm · ${inScope} luật trong phạm vi · ${plan.cells.length} lượt review${proposed ? ` · bỏ qua ${proposed} luật đề xuất` : ''}`);
      for (const e of [...plan.errors, ...plan.warnings.filter(w => !isGateWarning(w))]) console.log(`  ! ${e}`);
    } catch (e) { errored++; console.error(`${repo.name}: lỗi git — ${e.message}`); }
  }
  if (errored === repos.length) return 1;
  if (!plans.length) { console.log(NOTHING_CHANGED); return 2; }
  let ledger;
  try { ledger = buildLedger(plans); } catch (e) { console.error(`plan: ${e.message}`); return 1; }
  writeFileSync(join(state, 'ledger.json'), JSON.stringify(ledger, null, 1));
  console.log(['STATE=' + state, 'PARALLEL=' + config.parallel, 'CELLS=' + ledger.cells.length].join('\n'));
  return 0;
}

const readJson = file => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; } };

// File hỏng bị bỏ qua (báo stderr); mục tương ứng hiện là "chưa có kết quả" thay vì làm hỏng cả báo cáo.
function readJsonDir(dir) {
  const out = {};
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
    try { out[f.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(dir, f), 'utf8')); }
    catch { console.error(`bỏ qua file kết quả hỏng: ${f}`); }
  }
  return out;
}

// State cho ledger/verify-jobs; null (đã báo stderr) khi thiếu --state hoặc ledger.json hỏng.
function loadLedger(o) {
  if (typeof o.state !== 'string') { console.error('Thiếu --state <dir>'); return null; }
  const state = resolve(o.state), file = join(state, 'ledger.json');
  const ledger = readJson(file);
  if (!Array.isArray(ledger?.cells)) { console.error(`Không đọc được ${file} — chạy \`plan\` trước`); return null; }
  return { state, ledger };
}
const jobOf = (state, cell) => readJson(join(state, 'jobs', cell.repo, `${cell.fileId}.json`));

// Một đợt: ô chưa có kết quả hợp lệ được giao (lại); ô hết lượt thành FAILED. Skill chỉ gọi lại sau khi cả đợt đã trả.
function cmdLedger(o) {
  const s = loadLedger(o); if (!s) return 4;
  const { state, ledger } = s;
  const r = nextDispatch(ledger, cell => resultOk(cell, readJson(join(state, cell.resultFile))));
  writeFileSync(join(state, 'ledger.json'), JSON.stringify(r.ledger, null, 1));
  for (const c of r.retry) console.log(`RETRY ${c.repo} ${c.fileId} ${jobOf(state, c)?.model ?? 'sonnet'} ${c.attempts}`);
  console.log(`PENDING=${r.retry.length} FAILED=${r.failed.length}`);
  return 0;
}

// Một job verify cho mỗi (ô, mã, file trong diff của ô) gom mọi finding mức FAIL (findingLevel); finding WARN hoặc ngoài diff không verify (report hiện WARN).
// `hunk` = hunk thật của file: trong `hunks`, hoặc `truncatedHunks` khi file bị cắt khỏi prompt.
// Sinh lại từ đầu mỗi lần gọi; verify/ (câu trả lời của verifier) không bị đụng.
function cmdVerifyJobs(o) {
  const s = loadLedger(o); if (!s) return 4;
  const { state, ledger } = s;
  const out = join(state, 'verify-jobs');
  rmSync(out, { recursive: true, force: true });
  const roots = {}; let n = 0;
  for (const entry of ledger.cells) {
    const json = readJson(join(state, entry.resultFile));
    const cell = resultOk(entry, json) && jobOf(state, entry);
    if (!cell) continue;
    roots[cell.repo] ??= readJson(join(state, `plan-${cell.repo}.json`))?.repo?.root ?? '';
    // file của finding đã quy về đúng mục trong cell.files (bỏ repoRoot, ./, \ ; hoa/thường trên win32).
    for (const [code, row] of normalizeResult(cell, json, roots[cell.repo]).rows) {
      const rule = cell.rules.find(r => r.code === code);
      for (const [file, findings] of Map.groupBy(row.findings.filter(f => f.level === 'FAIL' && cell.files.includes(f.file)), f => f.file)) {
        const key = `${cell.fileId}-${code}-${cell.files.indexOf(file)}`;
        const hunk = cell.hunks.find(h => h.path === file)?.text ?? cell.truncatedHunks?.[file] ?? '';
        mkdirSync(join(out, cell.repo), { recursive: true });
        writeFileSync(join(out, cell.repo, `${key}.json`), JSON.stringify({ repoRoot: roots[cell.repo], cell: cell.id, code, file, block: rule.block, hunk, findings, key }, null, 1));
        console.log(`VERIFY ${cell.repo} ${key} ${cell.model}`); n++;
      }
    }
  }
  console.log(`VERIFY=${n}`);
  return 0;
}

function cmdReport(o) {
  try { return reportImpl(o); }
  catch (e) { console.error(`report: lỗi khi tạo báo cáo — ${e.message}`); return 4; }   // vd. plan-*.json hỏng
}

function reportImpl(o) {
  if (typeof o.state !== 'string') { console.error('Thiếu --state <dir>'); return 4; }
  const state = resolve(o.state);
  if (!existsSync(state)) { console.error(`Không thấy state dir ${state} — chạy \`plan\` trước`); return 4; }
  const planFiles = readdirSync(state).filter(f => /^plan-.*\.json$/.test(f));
  if (!planFiles.length) { console.error(`Không có plan-*.json trong ${state} — chạy \`plan\` trước`); return 4; }
  const plans = planFiles.map(f => JSON.parse(readFileSync(join(state, f), 'utf8'))).filter(p => p.fileCount > 0);
  const ledger = readJson(join(state, 'ledger.json')) ?? { cells: [] };
  const results = {}, verifications = {};
  for (const p of plans) {
    results[p.repo.name] = readJsonDir(join(state, 'results', p.repo.name));
    verifications[p.repo.name] = readJsonDir(join(state, 'verify', p.repo.name));
  }
  const startedAt = Date.parse(readJson(join(state, 'started.json'))?.startedAt);
  const elapsedMs = o['elapsed-ms'] !== undefined ? Number(o['elapsed-ms']) : Number.isNaN(startedAt) ? 0 : Math.max(0, Date.now() - startedAt);
  const pluginVersion = o['plugin-version'] ?? readJson(PLUGIN_JSON)?.version ?? '?';
  // Phiên bản bộ luật cho người bảo trì (stderr, không vào báo cáo dán PR).
  for (const p of plans) console.error(`rules: ${plans.length > 1 ? `${p.repo.name} ` : ''}${(p.ruleSets ?? []).map(s => `${s.aspect} v${s.version}`).join(' · ') || '(không có)'}`);
  const { text, verdict, incomplete, coverage, warnings = [] } = renderReport({ plans, ledger, results, verifications, elapsedMs, pluginVersion, ci: !!o.ci });
  for (const w of warnings) console.error(w);   // mã lạ trong kết quả: cho người bảo trì, không vào báo cáo
  console.log(text);
  // CI: chưa kiểm hết là lỗi chạy — cổng không được cho qua dù chưa thấy FAIL.
  if (o.ci && incomplete) { console.error(`Chưa kiểm hết (${coverage?.done ?? '?'}/${coverage?.total ?? '?'} luật) — chạy lại /vnr-review.`); return 4; }
  return verdict === 'FAIL' ? 1 : 0;
}

function cmdCheck(o) {
  const ws = resolve(o.ws ?? process.cwd());
  const rulesDir = join(ws, 'docs', 'review', 'rules');
  if (!existsSync(rulesDir)) { console.error(WRONG_FOLDER); return 1; }
  const r = checkRules(rulesDir);
  console.log(r.lines.join('\n'));
  if (!r.ok) { console.log('\n✗ Có lỗi chặn — không sinh INDEX/digest.'); return 1; }
  const w = writeOutputs(ws, r.sets);
  console.log('\n✓ Đã sinh: ' + w.written.map(p => p.replace(ws, '').replace(/\\/g, '/')).join(' · '));
  return 0;
}

const COMMANDS = { plan: cmdPlan, ledger: cmdLedger, 'verify-jobs': cmdVerifyJobs, report: cmdReport, check: cmdCheck };

// Chỉ chạy khi được gọi trực tiếp — test import buildPrompt không kích hoạt CLI.
// Realpath cả hai phía: gọi qua symlink/junction, kể cả khi Node chạy với --preserve-symlinks-main.
if (process.argv[1] && norm(realOr(resolve(process.argv[1]))) === norm(realOr(fileURLToPath(import.meta.url)))) {
  if (typeof path.matchesGlob !== 'function') { console.error(`vnr-review cần Node >= ${MIN_NODE} (path.matchesGlob) — đang dùng ${process.versions.node}`); process.exit(3); }
  const o = args(process.argv.slice(2)); const cmd = o._[0];
  if (!cmd || o.help) { console.log(HELP); process.exit(0); }
  const bare = VALUE_OPTS.find(k => k in o && typeof o[k] !== 'string');
  if (bare) { console.error(`--${bare} cần một giá trị`); process.exit(STATE_CMDS.includes(cmd) ? 4 : 1); }
  process.exit(COMMANDS[cmd] ? COMMANDS[cmd](o) : (console.error(HELP), 1));
}
