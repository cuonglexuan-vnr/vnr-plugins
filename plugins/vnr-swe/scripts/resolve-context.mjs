#!/usr/bin/env node
/**
 * resolve-context.mjs — bộ phân giải Wiki Loading Contract.
 *
 * KHÔNG phụ thuộc công nghệ. Đi kèm plugin vnr-swe. KHÔNG chứa token riêng của dự án/stack.
 * Mọi dữ liệu định tuyến nằm trong manifest của wiki DỰ ÁN (docs/wiki/manifest.json).
 * Không có manifest  =>  trả kết quả rỗng / no-op  =>  pipeline chạy như trước.
 *
 * Hai chế độ:
 *
 *   1. Chế độ CLI  (skill / agent gọi khi vào phase):
 *        node resolve-context.mjs --phase <plan|implement|review> --paths "a.cshtml,b/c.ts"
 *      In JSON:
 *        { ok, manifest, phase, stacks:[ids], mandatory:[paths], cards:[paths], on_demand:[paths] }
 *      Bên gọi PHẢI đọc đầy đủ mọi tệp trong `mandatory` + `cards` trước khi tạo kết quả.
 *
 *   2. Chế độ hook  (hook PreToolUse(Write|Edit) gọi, JSON của hook qua stdin):
 *        node resolve-context.mjs --hook
 *      Đọc tool_input.file_path, khớp với stack, rồi in:
 *        { hookSpecificOutput: { hookEventName:"PreToolUse", additionalContext:"<card text>" } }
 *      Chèn các thẻ ràng buộc ngắn gọn vào ngữ cảnh của (sub)agent ở mỗi lần ghi.
 *      Không khớp / không có manifest => không in gì (no-op im lặng).
 *
 * Schema của manifest (docs/wiki/manifest.json), mọi đường dẫn tính từ gốc dự án:
 *   {
 *     "version": "1",
 *     "stacks": [
 *       { "id": "<stack-id>",
 *         "match": ["<glob>", ...],        // glob tệp chọn stack này
 *         "card":  "<path>",               // thẻ ràng buộc ngắn gọn (hook chèn vào, tier-1)
 *         "always":    ["<path>", ...],    // trang tier-1, nạp đầy đủ khi vào phase
 *         "on_demand": ["<path>", ...] }   // trang tier-2, nạp khi chạm tới thành phần liên quan
 *     ],
 *     "phases": {
 *       "plan":      { "always": ["<path>", ...] },
 *       "implement": { "always": ["<path>", ...] },
 *       "review":    { "always": ["<path>", ...] }
 *     }
 *   }
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, isAbsolute, relative } from 'node:path';

const MANIFEST_REL = 'docs/wiki/manifest.json';
const CARD_BUDGET = 9000; // giữ additionalContext thấp hơn nhiều so với trần 10k

// ---------- bộ khớp glob nhỏ, tự đủ (không phụ thuộc gói ngoài) ----------
// Hỗ trợ: ** (mọi độ sâu), * (trong một đoạn), ? (một ký tự), {a,b} (lựa chọn), dấu chấm nguyên văn.
// Dễ dãi: glob không neo khớp ở mọi độ sâu (ngầm hiểu có **/ ở đầu).
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        // ** (có thể kèm / theo sau) => mọi độ sâu
        i++;
        if (glob[i + 1] === '/') i++;
        re += '(?:.*/)?';
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else if (c === '{') {
      const end = glob.indexOf('}', i);
      if (end === -1) { re += '\\{'; }
      else {
        const alts = glob.slice(i + 1, end).split(',').map(escapeLiteral);
        re += '(?:' + alts.join('|') + ')';
        i = end;
      }
    } else {
      re += escapeLiteral(c);
    }
  }
  // Glob không neo (không có / hay ** ở đầu) => cho phép khớp ở mọi độ sâu.
  const anchored = glob.startsWith('/') || glob.startsWith('**');
  const prefix = anchored ? '^' : '^(?:.*/)?';
  return new RegExp(prefix + re + '$');
}
function escapeLiteral(s) {
  return s.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}
function normalize(p) {
  return String(p).replace(/\\/g, '/');
}
// Bỏ khối YAML frontmatter ở đầu (--- … ---) để thẻ chèn vào không mang theo metadata thừa.
function stripFrontmatter(text) {
  const m = /^\s*---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(text);
  return m ? text.slice(m[0].length) : text;
}
// Khớp đường dẫn tệp (có thể tuyệt đối) với glob, chấp nhận cả đường dẫn tương đối theo cwd lẫn tuyệt đối.
function pathMatchesGlob(filePath, glob, root) {
  const norm = normalize(filePath);
  const candidates = new Set([norm]);
  if (isAbsolute(filePath)) {
    const rel = normalize(relative(root, filePath));
    if (rel && !rel.startsWith('..')) candidates.add(rel);
  }
  const re = globToRegExp(glob);
  for (const cand of candidates) {
    if (re.test(cand)) return true;
  }
  return false;
}

// ---------- nạp manifest ----------
function loadManifest(root) {
  const path = join(root, MANIFEST_REL);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null; // manifest sai định dạng => coi như không có (no-op êm)
  }
}

function matchStacks(manifest, paths, root) {
  const matched = [];
  for (const stack of manifest.stacks || []) {
    const globs = stack.match || [];
    const hit = paths.some((p) => globs.some((g) => pathMatchesGlob(p, g, root)));
    if (hit) matched.push(stack);
  }
  return matched;
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

// ---------- Chế độ CLI ----------
function runCli(args, root) {
  const phase = typeof args['--phase'] === 'string' ? args['--phase'] : '';
  const pathsArg = typeof args['--paths'] === 'string' ? args['--paths'] : '';
  const paths = pathsArg
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const manifest = loadManifest(root);
  if (!manifest) {
    process.stdout.write(JSON.stringify({
      ok: true, manifest: 'absent', phase, stacks: [],
      mandatory: [], cards: [], on_demand: [],
      note: 'No docs/wiki/manifest.json — fall back to docs/wiki/index.md navigation.',
    }, null, 2));
    return;
  }

  const phaseAlways = (manifest.phases?.[phase]?.always) || [];
  const stacks = matchStacks(manifest, paths, root);

  const stackAlways = stacks.flatMap((s) => s.always || []);
  const cards = stacks.map((s) => s.card).filter(Boolean);
  const onDemand = stacks.flatMap((s) => s.on_demand || []);

  process.stdout.write(JSON.stringify({
    ok: true,
    manifest: 'found',
    phase,
    stacks: stacks.map((s) => s.id),
    mandatory: uniq([...phaseAlways, ...stackAlways]),
    cards: uniq(cards),
    on_demand: uniq(onDemand),
  }, null, 2));
}

// ---------- Chế độ hook ----------
function runHook(rootArg) {
  let raw = '';
  try { raw = readFileSync(0, 'utf8'); } catch { /* không có stdin */ }
  let input = {};
  try { input = JSON.parse(raw); } catch { /* bỏ qua */ }

  // Gốc dự án là cwd của hook (nơi chứa manifest), nếu không có thì dùng rootArg.
  const root = (typeof input?.cwd === 'string' && input.cwd) ? input.cwd : rootArg;
  const filePath = input?.tool_input?.file_path;
  const manifest = loadManifest(root);
  if (!filePath || !manifest) {
    process.stdout.write('{}'); // no-op im lặng
    return;
  }

  const stacks = matchStacks(manifest, [filePath], root);
  if (stacks.length === 0) {
    process.stdout.write('{}');
    return;
  }

  let out = '';
  for (const s of stacks) {
    if (!s.card) continue;
    const cardPath = join(root, s.card);
    if (!existsSync(cardPath)) continue;
    let text = '';
    try { text = readFileSync(cardPath, 'utf8'); } catch { continue; }
    text = stripFrontmatter(text);
    out += `\n[Wiki Loading Contract — ${s.id}]\n${text.trim()}\n`;
    if (out.length >= CARD_BUDGET) break;
  }
  if (!out.trim()) {
    process.stdout.write('{}');
    return;
  }
  if (out.length > CARD_BUDGET) out = out.slice(0, CARD_BUDGET) + '\n…(truncated; open the catalog page)';

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: out.trim(),
    },
  }));
}

// ---------- điểm vào ----------
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) { args[a] = next; i++; }
      else args[a] = true;
    }
  }
  return args;
}

const argv = process.argv.slice(2);
const args = parseArgs(argv);
const root = args['--root'] || process.cwd();

try {
  if (args['--hook']) runHook(root);
  else runCli(args, root);
} catch (e) {
  // Không bao giờ làm hỏng bên gọi — hạ về no-op.
  if (args['--hook']) process.stdout.write('{}');
  else process.stdout.write(JSON.stringify({ ok: false, manifest: 'error', error: String(e), stacks: [], mandatory: [], cards: [], on_demand: [] }));
}
