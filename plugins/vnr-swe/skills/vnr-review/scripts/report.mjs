// plugins/vnr-swe/skills/vnr-review/scripts/report.mjs
// Gộp kết quả subagent thành báo cáo tiếng Việt gọn + dòng VERDICT cho hook/CI.
// Module thuần: không import module anh em; `plan.branch` do cli.mjs bổ sung.
const fmtMs = ms => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`; };
const clip = (s, n = 100) => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const INDENT = '\n' + ' '.repeat(22); // căn các dòng tiếp theo của mục nhiều dòng

// Cảnh báo regex: số dòng file:dòng tối đa dưới mỗi luật, và độ dài excerpt.
const REGEX_HITS_PER_RULE = 5;
const REGEX_EXCERPT = 80;
// Độ dài tối đa của dòng lý do (Vì / Vì sao).
const REASON_CHARS = 200;

// finalLine=false: bỏ dòng VERDICT cuối — nhiều repo dùng chung một dòng VERDICT do cli.mjs ghép.
export function renderReport(plan, { results = {}, verifications = [], elapsedMs = 0, pluginVersion = '?', ci = false, finalLine = true }) {
  const fail = [], warn = [], needs = [];
  for (const job of plan.jobs) {
    const res = results[job.id];
    // Job nhiều file: nhãn "(N file)" thay vì file đầu; finding vẫn giữ file riêng của nó.
    const label = (job.files?.length ?? 0) > 1 ? `(${job.files.length} file)` : job.file;
    if (!res) { needs.push({ code: job.code, file: label, note: 'không có kết quả từ subagent' }); continue; }
    for (const nc of res.needs_context ?? []) needs.push({ code: job.code, file: label, note: clip(nc, 200) });
    // Chỉ thêm "không quyết được" khi subagent không nêu rõ cần gì — tránh dòng trùng.
    if (res.verdict === 'NEEDS_CONTEXT' && !(res.needs_context ?? []).length) needs.push({ code: job.code, file: label, note: 'không quyết được' });
    const findings = res.findings ?? [];
    // Kết quả tự mâu thuẫn: FAIL/WARN không có finding → không im lặng thành PASS.
    if ((res.verdict === 'FAIL' || res.verdict === 'WARN') && !findings.length) needs.push({ code: job.code, file: label, note: `verdict ${res.verdict} không kèm finding — kết quả không nhất quán` });
    findings.forEach((f, index) => {
      const item = { code: job.code, name: job.name, file: f.file || job.file, line: f.line, excerpt: clip(f.excerpt), fix: job.fix, why: clip(f.why, REASON_CHARS) || clip(job.reason, REASON_CHARS) };
      if (res.verdict === 'PASS') warn.push(item);                       // PASS mà có finding → coi là WARN
      else if (res.verdict === 'FAIL') {
        // Verifier: confirmed giữ FAIL, unsure hạ xuống WARN, wrong loại bỏ.
        const v = verifications.find(x => x.jobId === job.id && x.index === index)?.verdict;
        if (v === 'wrong') return;
        if (v === 'unsure') { warn.push({ ...item, unsure: true }); return; }
        fail.push(item);
      } else if (res.verdict === 'WARN') warn.push(item);
    });
  }
  const rw = plan.regexWarnings ?? [];
  const verdict = fail.length ? 'FAIL' : (warn.length || rw.length || needs.length) ? 'WARN' : 'PASS';

  const L = [];
  const tail = ci ? '' : ` · ${fmtMs(elapsedMs)}`; // CI bỏ thời gian để đầu ra ổn định
  L.push(`Review  ${plan.repo.name} @ ${plan.branch ?? 'HEAD'}  (vs ${plan.baseline.from ?? plan.baseline.ref} · ${plan.fileCount} file${tail})`);
  L.push(`Luật: ${plan.ruleSets.map(s => `${s.aspect} v${s.version}`).join(' · ')}        (plugin vnr-swe ${pluginVersion})`);
  for (const e of plan.errors ?? []) L.push(`! ${e}`);
  L.push('');
  const parts = [`${fail.length} FAIL`, `${warn.length} WARN`, `${rw.length} cảnh báo regex`, `${needs.length} cần ngữ cảnh`];
  L.push(`KẾT LUẬN: ${verdict}${verdict === 'PASS' ? '' : ' — ' + parts.join(' · ')}`);
  const section = (title, items) => {
    if (!items.length) return;
    L.push('', title);
    for (const i of items) {
      L.push(`  ${i.code}  ${i.name}${i.unsure ? ' (chưa chắc)' : ''}`);
      L.push(`    ${i.file}:${i.line ?? '?'}   \`${i.excerpt}\``);
      if (i.why) L.push(`    Vì: ${i.why}`);
      if (i.fix) L.push(`    → ${i.fix}`);
    }
  };
  section('FAIL', fail); section('WARN', warn);
  const line = (title, body) => L.push('', `${title}   ${body}`);
  if (rw.length) {
    L.push('', `Cảnh báo regex (${rw.length}) — chưa kiểm sâu; /vnr-review --full để kiểm`);
    const byCode = new Map(); // Map giữ thứ tự gặp đầu tiên của mã luật
    for (const w of rw) { if (!byCode.has(w.code)) byCode.set(w.code, { name: w.name, reason: clip(w.reason, REASON_CHARS), hits: [] }); byCode.get(w.code).hits.push(w); }
    for (const [code, { name, reason, hits }] of byCode) {
      L.push(`  ${code}  ${name}  (${hits.length})`);
      if (reason) L.push(`    Vì sao: ${reason}`);
      hits.sort((x, y) => (x.file < y.file ? -1 : x.file > y.file ? 1 : x.n - y.n));
      for (const h of hits.slice(0, REGEX_HITS_PER_RULE)) L.push(`    ${h.file}:${h.n ?? 0}   \`${clip(h.text, REGEX_EXCERPT)}\``);
      if (hits.length > REGEX_HITS_PER_RULE) L.push(`    … và ${hits.length - REGEX_HITS_PER_RULE} dòng nữa`);
    }
  }
  if (needs.length) line(`Cần ngữ cảnh (${needs.length})`, needs.map(n => `${n.code} ${n.file} — ${n.note}`).join(INDENT));
  if (plan.ignored?.length) line(`Bỏ qua có lý do (${plan.ignored.length})`, plan.ignored.map(i => `${i.code} ${i.path}${i.line ? ':' + i.line : ''}  "${clip(i.reason)}"`).join(INDENT));
  if (plan.invalidIgnores?.length) line(`Marker không hợp lệ (${plan.invalidIgnores.length})`, plan.invalidIgnores.map(i => `${i.code} ${i.path}${i.line ? ':' + i.line : ''} — ${i.why}`).join(INDENT));
  if (plan.skippedJobs?.length) line(`Chưa kiểm (${plan.skippedJobs.length})`, plan.skippedJobs.map(s => `${s.code} ${s.file}`).join(' · ') + '      → chạy lại với --aspect hoặc tăng maxJobs');
  if (plan.skippedFiles?.length) line(`File bỏ qua (${plan.skippedFiles.length})`, plan.skippedFiles.map(s => `${s.path} (${s.why})`).join(' · '));
  if (finalLine) L.push('', `VERDICT:${verdict}`);
  return { text: L.join('\n'), verdict };
}
