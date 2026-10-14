# skills/vnr-review/scripts — lớp script của skill `vnr-review`

Mọi việc lặp lại được của `/vnr-review` nằm ở đây (0 token): tìm repo, diff, parse luật, cổng, phân tầng, báo cáo, kiểm luật.
`SKILL.md` chỉ gọi `cli.mjs` và dispatch subagent. Yêu cầu Node ≥ 22 (`path.matchesGlob`).

## Key Files
| Tệp | Vai trò |
|---|---|
| `cli.mjs` | entry: `plan` · `report` · `check` — xem `--help`; `plan` sinh `jobs/<repo>/index.json`, `verify-jobs/*.template.json`, `started.json` (xem "Đầu ra của `plan`") |
| `rules.mjs` | parse file luật (6 mốc máy đọc), lọc theo repo, phát hiện trùng mã |
| `diff.mjs` | tìm repo trong `src/*`, baseline `@{upstream}` / merge-base, hunk `-U0`, file untracked |
| `gate.mjs` | glob, `path-gate`, `regex-gate` trên dòng `+` (che comment trước khi chạy regex), marker `review-ignore`, giải `Cần đọc thêm` |
| `plan.mjs` | phân tầng FAIL-first, trần + ưu tiên từ `config.json`, sinh jobs JSON |
| `report.mjs` | gộp kết quả subagent → báo cáo tiếng Việt + `VERDICT:` |
| `check.mjs` | kiểm 6 mốc, sinh `INDEX.md` + digest `.claude/rules/review-{fe,be}.md` |
| `*.test.mjs` | `node:test`, chạy qua `npm test` ở gốc repo |

## Đầu ra của `plan`
Trong `--state <dir>`: `plan-<repo>.json` (cho `report`) · `jobs/<repo>/{index.json,<jobId>.json}` (`index.json` = `{repo, repoRoot, branch, baseline, jobs[]}` là thứ duy nhất skill đọc) · `verify-jobs/<repo>/<jobId>.template.json` (block + hunks cho verifier) · `started.json` (mốc thời gian cho `report`).
