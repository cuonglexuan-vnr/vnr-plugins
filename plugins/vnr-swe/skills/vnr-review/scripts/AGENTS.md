# skills/vnr-review/scripts — lớp script của skill `vnr-review`

Mọi việc lặp lại được của `/vnr-review` nằm ở đây (0 token): tìm repo, diff, parse luật, lọc phạm vi, chia ô, sổ theo dõi lượt review, báo cáo, kiểm luật.
`SKILL.md` chỉ gọi `cli.mjs` và dispatch subagent. Yêu cầu Node ≥ 22.5 (`path.matchesGlob`).

## Key Files
| Tệp | Vai trò |
|---|---|
| `cli.mjs` | entry: `plan` · `ledger` · `verify-jobs` · `report` (`--save <dir>`: thêm mỗi repo một file `<repo>.md`, dòng đầu `<!-- vnr-review tree=<treeId> -->` rồi báo cáo; stdout không có dòng đó) · `check`; `plan` ghi `treeId` (`contentTree`) vào plan để `/vnr-pr` kiểm độ mới — xem `--help`; `buildPrompt(cell, plan)` sinh prompt của một ô (xem "Thư mục state") |
| `ledger.mjs` | thuần, không fs: `buildLedger` (một dòng mỗi ô, id duy nhất trong từng repo), `resultOk` (đủ mã là xong), `normalizeResult(cell, json, repoRoot)` (một dòng mỗi mã; `file` của finding quy về mục trong `cell.files`; `level` của finding = mức hiệu lực `findingLevel`), `findingLevel(rule, finding)` (FAIL chỉ khi luật FAIL/FAIL+WARN và checker ghi `level:"FAIL"`; thiếu `level`: luật chỉ FAIL → FAIL, FAIL+WARN → WARN), `normalizePath` (bỏ repoRoot, `./`, `\`), `nextDispatch` (giao lại tối đa 2 lượt, ô đã xong không bao giờ tăng lượt); `report.mjs` dùng chung `resultOk`/`normalizeResult`/`normalizePath` |
| `rules.mjs` | parse file luật (6 mốc máy đọc, `title`, cờ `proposed`), lọc theo repo, phát hiện trùng mã; khối gửi agent bỏ dòng xuất xứ |
| `diff.mjs` | tìm repo trong `src/*`, baseline `@{upstream}` / merge-base, hunk `-U0`, file untracked; `contentTree(repoRoot)` → tree id của working tree nếu commit ngay (index tạm `GIT_INDEX_FILE`: `read-tree HEAD` · `add -A` · bỏ `NEVER_COMMIT` · `write-tree`; index thật không đổi); `NEVER_COMMIT` = bản sao mục `## never-commit` của `skills/vnr-commit/convention.md` |
| `gate.mjs` | glob + lọc phạm vi (`applies_to`/`excludes`/`Phạm vi`), marker `review-ignore`, giải `Cần đọc thêm` |
| `plan.mjs` | gộp luật theo `aspect`, bỏ luật đề xuất, chia ô (≤ `chunkSize` luật, ≤ `cellBlockChars` ký tự; FAIL trước) kèm hunk theo thứ tự diff; trần 60 000 ký tự hunk file thật (commit/branch không tính): file thật đầu luôn giữ, file sau không vừa → `truncated` + `truncatedHunks` (bỏ qua rồi xét tiếp, không dây chuyền); `hunkRanges(text)` → khoảng dòng đã đổi cho prompt |
| `report.mjs` | `renderReport` → báo cáo markdown (không fence, khuôn ở `templates/report.template.md`): tiêu đề `## vnr-review — PASS\|WARN\|FAIL`, bảng 4 cột `# · Kết quả · Luật · Vị trí` một dòng mỗi mã (≤ 10 dòng; `#` từ 1 theo thứ tự hiển thị, lại từ 1 mỗi repo; `Kết quả` = `FAIL`/`WARN` không in đậm; `Luật` = chỉ mã; `Vị trí` = tên file `:dòng` ` (+n)`, file giả `(commit …)`/`(branch)` giữ nguyên), rồi mỗi dòng một thẻ cùng số `**#n · mức · mã**` + bullet `Vị trí` (đường dẫn đầy đủ trong backtick; nhiều chỗ → `Vị trí (n chỗ):` mỗi chỗ một dòng, bỏ trùng, tối đa 10 rồi `… và n chỗ khác`) · `Vấn đề` · `Sửa` (bỏ khi rỗng; issue/fix cắt 400), `⚠ Chưa kiểm hết` cho nhóm còn ô thiếu kết quả, dòng độ phủ; nhiều repo một tiêu đề + mục `###`; dòng cuối luôn `VERDICT:` (một dòng cho mọi repo), `--ci` thêm `COVERAGE=`/`RULES=` sau nó. FAIL chỉ khi finding mức FAIL (`findingLevel`) và verifier `confirmed`; finding mức FAIL ngoài diff hoặc chưa verify → WARN; `wrong` → bỏ; finding mức WARN luôn là WARN (không verify, không bị bỏ). Ô bảng: `|` thoát; bảng và thẻ: `<` ngoài backtick → `&lt;`; mỗi thẻ và mỗi dòng chân là một đoạn riêng. Trả `{text, verdict, incomplete, coverage, warnings}` (`warnings` = mã lạ, cli in ra stderr) |
| `check.mjs` | kiểm 6 mốc, sinh `INDEX.md` + digest `.claude/rules/review-{fe,be}.md` |
| `*.test.mjs` | `node:test`, chạy qua `npm test` ở gốc repo |

## Thư mục state
Trong `--state <dir>` (`plan` xoá sạch các mục dưới đây của lần chạy trước rồi sinh lại):

| Mục | Ai ghi | Nội dung |
|---|---|---|
| `plan-<repo>.json` | `plan` | kết quả `buildPlan` + `sha7`, `treeId`, `siblings` — chỉ repo có thay đổi; `report` đọc |
| `ledger.json` | `plan`, `ledger` | `{cells:[{id, fileId, repo, …, resultFile, attempts, failed}]}`; `ledger` tăng `attempts` cho ô chưa có kết quả |
| `jobs/<repo>/<fileId>.json` | `plan` | một ô nguyên dạng (luật, file, hunk, model; file bị cắt: `truncated` + `truncatedHunks{path: hunk}`) |
| `jobs/<repo>/<fileId>.prompt.md` | `plan` | prompt của ô; subagent checker đọc trọn file này |
| `results/<repo>/<fileId>.json` | skill | JSON checker trả về (`{cell, rules:[{code, status, note, findings:[{file, level, line, …}]}]}`) |
| `verify-jobs/<repo>/<key>.json` | `verify-jobs` | `key` = `<fileId>-<code>-<f>` (`f` = chỉ số file trong `cell.files`): `{repoRoot, cell, code, file, block, hunk, findings, key}` — chỉ finding mức FAIL; `hunk` lấy từ `hunks` hoặc `truncatedHunks` |
| `verify/<repo>/<key>.json` | skill | câu trả lời verifier `{verdict: confirmed\|wrong, reason}` |
| `started.json` | `plan` | mốc thời gian để `report` tự tính thời gian chạy |

Dòng stdout máy đọc: `plan` → `STATE=` · `PARALLEL=` · `CELLS=`; `ledger` → `RETRY <repo> <fileId> <model> <attempt>` · `PENDING=<n> FAILED=<n>`;
`verify-jobs` → `VERIFY <repo> <key> <model>` · `VERIFY=<n>`.
