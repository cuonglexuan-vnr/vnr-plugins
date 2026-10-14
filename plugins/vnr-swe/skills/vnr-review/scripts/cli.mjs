#!/usr/bin/env node
// plugins/vnr-swe/skills/vnr-review/scripts/cli.mjs — entry cho SKILL.md: plan · report · check. `--help` bằng tiếng Anh (quy ước CLI).
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, statSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path, { join, resolve } from 'node:path';
import os from 'node:os';
import { findRepos, baseline, collectDiff, git } from './diff.mjs';
import { loadRules } from './rules.mjs';
import { buildPlan, DEFAULT_CONFIG } from './plan.mjs';
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

const HELP = `vnr-review CLI (machine layer of the /vnr-review skill)
Requires Node >= ${MIN_NODE}.

  plan   [--ws <dir>] [--repo fe|be|<name>] [--base <ref>] [--full] [--aspect a,b] [--state <dir>]
  report --state <dir> [--ci] [--plugin-version <v>] [--elapsed-ms <n>]   (defaults: plugin.json version, time since plan)
  check  [--ws <dir>]

Exit codes: plan 0 ok / 1 usage, missing rules dir, bad config.json or all repos failed / 2 nothing changed
            report 0 PASS|WARN / 1 FAIL / 4 run error (bad or missing --state, no plan-*.json, corrupt plan-*.json)
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

// Prompt đầy đủ cho một subagent — skill chỉ đọc một file job và chuyển nguyên văn.
export function buildPrompt(job) {
  const hunks = job.hunks.join('\n');
  const files = job.files ?? [job.file];
  const isCommit = job.file === '(commit)', isBranch = job.file === '(branch)';
  const list = files.map(f => `- ${f}`).join('\n');
  const heading = isBranch ? 'tên nhánh' : `${files.length} ${isCommit ? 'commit chưa push' : 'file'}\n${list}`;
  // Một file/commit: ví dụ dùng đúng nhãn đó; nhiều mục: placeholder để mỗi finding tự ghi file của nó.
  const example = files.length === 1 ? files[0] : isCommit ? '<commit chứa vi phạm>' : '<file chứa vi phạm>';
  const noHits = isCommit || isBranch ? '(không có gate — xem toàn bộ nội dung)' : '(không có dòng khớp regex — xem toàn bộ hunk)';
  const hits = job.hits.length ? job.hits.map(h => `${h.n}: ${h.text}`).join('\n') : noHits;
  const truncated = job.truncated?.length ? `\n\nCác file sau không kèm hunk (quá dài) — đọc khi cần:\n${job.truncated.map(f => `- ${f}`).join('\n')}` : '';
  const ignoreRule = job.noIgnore ? 'Luật này KHÔNG cho bỏ qua — marker review-ignore không có hiệu lực.' : 'Chỉ marker `review-ignore <MÃ>: <lý do>` (có lý do) mới có hiệu lực.';
  const readable = job.readMore.files.length ? job.readMore.files.map(f => `- ${f}`).join('\n') : '(không có)';
  const unresolved = job.readMore.unresolved.length ? `\nMục "Cần đọc thêm" không giải ra file nào (trả NEEDS_CONTEXT nếu điều kiện cần chúng): ${job.readMore.unresolved.join(' · ')}` : '';
  return `Bạn là reviewer. Chỉ áp dụng ĐÚNG MỘT luật dưới đây, không thêm luật từ trí nhớ. Chỉ FAIL khi điều kiện "FAIL khi" NHÌN THẤY trong hunk hoặc file được phép đọc. Không chắc → NEEDS_CONTEXT, không đoán. ${ignoreRule}

## Từ điển khía cạnh ${job.aspect}
${job.section1}

## Luật
${job.block}

## Thay đổi cần xét — ${heading}
Dòng khớp gate:
${hits}

Hunk:
${hunks}${truncated}

## File được phép đọc thêm (đường dẫn tương đối từ gốc repo; ../ = repo anh em)
${readable}${unresolved}

## Trả về — CHỈ một khối JSON, không giải thích thêm
{"code":"${job.code}","verdict":"FAIL|WARN|PASS|NEEDS_CONTEXT","findings":[{"file":"${example}","line":<số>,"excerpt":"<≤100 ký tự>","why":"<≤2 câu tiếng Việt>"}],"needs_context":["<điều kiện không quyết được + thiếu gì>"]}
"file": đường dẫn ĐÚNG của file (hoặc "(commit <sha>)" / "(branch)") chứa vi phạm — mỗi finding ghi file của chính nó.`;
}

// Xoá kết quả của lần chạy trước trong state dir có sẵn — repo cũ không được lọt vào `report`.
// Chỉ xoá khi thư mục trông như state cũ (có plan-*.json hoặc jobs/ results/ verify-jobs/ verify/); ngược lại để nguyên.
function cleanState(state) {
  if (!existsSync(state)) return;
  const entries = readdirSync(state);
  const plans = entries.filter(f => /^plan-.*\.json$/.test(f));
  const dirs = ['jobs', 'results', 'verify-jobs', 'verify'].filter(d => entries.includes(d));
  for (const f of plans) rmSync(join(state, f), { force: true });
  for (const d of dirs) rmSync(join(state, d), { recursive: true, force: true });
}

function cmdPlan(o) {
  const ws = resolve(o.ws ?? process.cwd());
  const rulesDir = join(ws, 'docs', 'review', 'rules');
  if (!existsSync(rulesDir)) { console.error(`Không thấy ${rulesDir} — chạy từ gốc vnr.hrm.wiki hoặc truyền --ws`); return 1; }
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
  let total = 0, changed = 0, errored = 0;
  for (const repo of repos) {
    try {
      const b = baseline(repo.root, { override: o.base });
      if (!b.ref) { console.log(`${repo.name}: không xác định được baseline (không upstream, không develop) — bỏ qua`); continue; }
      const diff = collectDiff(repo.root, b.ref);
      if (!diff.files.length) { console.log(`${repo.name}: không có thay đổi so với ${b.ref}`); continue; }
      changed++;
      const rules = loadRules(rulesDir, { repo: repo.kind });
      const siblings = Object.fromEntries(allRepos.filter(r => r !== repo).map(r => [r.kind, r.root]));
      const commitMessages = git(repo.root, ['log', `${b.ref}..HEAD`, '--format=%B'], { allowFail: true });
      // Commit chưa push: sha ngắn, subject, body — cho luật phạm vi (commit message).
      const commits = git(repo.root, ['log', `${b.ref}..HEAD`, '--format=%h%x1f%s%x1f%b%x1e'], { allowFail: true }).split('\x1e').map(r => r.replace(/^\n/, '')).filter(r => r.trim())
        .map(r => { const [sha, subject, body = ''] = r.split('\x1f'); return { sha: sha.trim().slice(0, 10), subject: subject.trim(), body: body.trim() }; });
      const branch = git(repo.root, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
      const plan = buildPlan({ repo, baseline: b, diff, rules, config, siblings, commitMessages, commits, branch, full: !!o.full, aspects: o.aspect ? String(o.aspect).split(',') : null });
      plan.branch = branch;
      plan.siblings = siblings;
      writeFileSync(join(state, `plan-${repo.name}.json`), JSON.stringify(plan, null, 1));
      const jobsDir = join(state, 'jobs', repo.name); mkdirSync(jobsDir, { recursive: true });
      const vJobsDir = join(state, 'verify-jobs', repo.name); mkdirSync(vJobsDir, { recursive: true });
      for (const job of plan.jobs) {
        writeFileSync(join(jobsDir, `${job.id}.json`), JSON.stringify({ ...job, prompt: buildPrompt(job) }, null, 1));
        // Mẫu cho verifier: orchestrator chỉ ghi file nhỏ {template, jobId, index, finding} trỏ tới đây, không chép lại block/hunks.
        writeFileSync(join(vJobsDir, `${job.id}.template.json`), JSON.stringify({ jobId: job.id, repoRoot: repo.root, block: job.block, hunks: job.hunks, readMoreFiles: job.readMore.files }, null, 1));
      }
      // Mục lục cho orchestrator: repo + danh sách job/model; không phải mở plan-*.json hay từng file job.
      writeFileSync(join(jobsDir, 'index.json'), JSON.stringify({
        repo: repo.name, repoRoot: repo.root, branch, baseline: { ref: b.ref, how: b.how },
        jobs: plan.jobs.map(j => ({ id: j.id, code: j.code, model: j.model, file: j.file, files: j.files, noIgnore: j.noIgnore })),
      }, null, 1));
      total += plan.jobs.length;
      console.log(`${repo.name} @ ${plan.branch} (vs ${b.from ?? b.ref}, ${b.how}) · ${diff.files.length} file · ${plan.jobs.length} job LLM · ${plan.regexWarnings.length} cảnh báo regex · ${plan.skippedJobs.length} chưa kiểm · luật: ${plan.ruleSets.map(s => `${s.aspect} v${s.version}`).join(', ')}`);
      for (const e of plan.errors) console.log(`  ! ${e}`);
    } catch (e) { errored++; console.error(`${repo.name}: lỗi git — ${e.message}`); }
  }
  if (errored === repos.length) return 1;
  if (!changed) { console.log('Không có thay đổi so với remote trong repo nào.'); return 2; }
  console.log(['STATE=' + state, 'PARALLEL=' + config.parallel, 'JOBS=' + total].join('\n'));
  return 0;
}

// File hỏng bị bỏ qua (báo stderr); job tương ứng hiện là "không có kết quả" thay vì làm hỏng cả báo cáo.
function readJsonDir(dir) {
  const out = {};
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
    try { out[f.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(dir, f), 'utf8')); }
    catch { console.error(`bỏ qua file kết quả hỏng: ${f}`); }
  }
  return out;
}

const readJson = file => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; } };

function cmdReport(o) {
  try { return reportImpl(o); }
  catch (e) { console.error(`report: lỗi khi tạo báo cáo — ${e.message}`); return 4; }   // vd. plan-*.json hỏng
}

function reportImpl(o) {
  if (typeof o.state !== 'string') { console.error('Thiếu --state <dir>'); return 4; }
  const state = resolve(o.state);
  if (!existsSync(state)) { console.error(`Không thấy state dir ${state} — chạy \`plan\` trước`); return 4; }
  const planFiles = readdirSync(state).filter(f => /^plan-.*\.json$/.test(f));
  const startedAt = Date.parse(readJson(join(state, 'started.json'))?.startedAt);
  const elapsedMs = o['elapsed-ms'] !== undefined ? Number(o['elapsed-ms']) : Number.isNaN(startedAt) ? 0 : Math.max(0, Date.now() - startedAt);
  const pluginVersion = o['plugin-version'] ?? readJson(PLUGIN_JSON)?.version ?? '?';
  // Nhiều repo: mỗi repo bỏ dòng VERDICT riêng, cuối cùng một dòng VERDICT chung (xấu nhất).
  const finalLine = planFiles.length < 2;
  let anyFail = false, worst = 'PASS'; const outs = [];
  for (const f of planFiles) {
    const plan = JSON.parse(readFileSync(join(state, f), 'utf8'));
    const results = readJsonDir(join(state, 'results', plan.repo.name));
    const verifications = Object.values(readJsonDir(join(state, 'verify', plan.repo.name))).flat();
    const { text, verdict } = renderReport(plan, { results, verifications, elapsedMs, pluginVersion, ci: !!o.ci, finalLine });
    outs.push(text); if (verdict === 'FAIL') anyFail = true;
    if (verdict === 'FAIL' || (verdict === 'WARN' && worst === 'PASS')) worst = verdict;
  }
  if (!outs.length) { console.error(`Không có plan-*.json trong ${state} — chạy \`plan\` trước`); return 4; }
  console.log(finalLine ? outs[0] : `${outs.join('\n\n')}\n\nVERDICT:${worst}`);
  return anyFail ? 1 : 0;
}

function cmdCheck(o) {
  const ws = resolve(o.ws ?? process.cwd());
  const rulesDir = join(ws, 'docs', 'review', 'rules');
  if (!existsSync(rulesDir)) { console.error(`Không thấy ${rulesDir} — chạy từ gốc vnr.hrm.wiki hoặc truyền --ws`); return 1; }
  const r = checkRules(rulesDir);
  console.log(r.lines.join('\n'));
  if (!r.ok) { console.log('\n✗ Có lỗi chặn — không sinh INDEX/digest.'); return 1; }
  const w = writeOutputs(ws, r.sets);
  console.log('\n✓ Đã sinh: ' + w.written.map(p => p.replace(ws, '').replace(/\\/g, '/')).join(' · '));
  return 0;
}

// Chỉ chạy khi được gọi trực tiếp — test import buildPrompt không kích hoạt CLI.
// Realpath cả hai phía: gọi qua symlink/junction, kể cả khi Node chạy với --preserve-symlinks-main.
if (process.argv[1] && norm(realOr(resolve(process.argv[1]))) === norm(realOr(fileURLToPath(import.meta.url)))) {
  if (typeof path.matchesGlob !== 'function') { console.error(`vnr-review cần Node >= ${MIN_NODE} (path.matchesGlob) — đang dùng ${process.versions.node}`); process.exit(3); }
  const o = args(process.argv.slice(2)); const cmd = o._[0];
  if (!cmd || o.help) { console.log(HELP); process.exit(0); }
  const bare = VALUE_OPTS.find(k => k in o && typeof o[k] !== 'string');
  if (bare) { console.error(`--${bare} cần một giá trị`); process.exit(cmd === 'report' ? 4 : 1); }
  const code = cmd === 'plan' ? cmdPlan(o) : cmd === 'report' ? cmdReport(o) : cmd === 'check' ? cmdCheck(o) : (console.error(HELP), 1);
  process.exit(code);
}
