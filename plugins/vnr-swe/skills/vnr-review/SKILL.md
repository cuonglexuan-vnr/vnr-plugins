---
name: "vnr-review"
description: >-
  Review trước khi push / kiểm tra code trước khi push: review phần code thay đổi (chưa push) của repo BE/FE trong workspace vnr.hrm.wiki theo bộ luật ở docs/review/.
  Báo cáo tiếng Việt gọn: FAIL / WARN / PASS + dòng VERDICT cho hook. Chạy 5–10 phút. Chế độ `check` cho owner bộ luật.
argument-hint: "[fe|be|<tên-repo>] [--base <ref>] [--full] [--aspect a,b] [--ci] [--no-verify] [--out <file>] | check"
compatibility: "Chạy tại gốc vnr.hrm.wiki (có docs/review/rules). Node ≥ 22."
user-invocable: true
---

$ARGUMENTS

Bạn điều phối; mọi việc lặp lại được do script làm. `PLUGIN_DIR` = `${CLAUDE_PLUGIN_ROOT}`. `CLI` = `node "$PLUGIN_DIR/skills/vnr-review/scripts/cli.mjs"`.
Khi ghi prompt cho subagent hoặc lệnh Bash, thay `$PLUGIN_DIR` bằng đường dẫn tuyệt đối của `${CLAUDE_PLUGIN_ROOT}` — subagent không biết biến này. Lấy giá trị bằng Bash `echo "$CLAUDE_PLUGIN_ROOT"` một lần ở đầu lượt chạy.
Không in tiến trình dài dòng — SE chỉ cần báo cáo cuối.
`--no-verify` và `--out <file>` là cờ của skill (bỏ B6 / ghi file ở B7), **không** truyền cho `CLI`.

## Chế độ `check` (owner bộ luật)
Nếu đối số là `check`: chạy `CLI check`, in nguyên văn kết quả, dừng. Không sinh gì khác.

## B1–B4 — script
1. Chạy `CLI plan` với các cờ nhận được (`fe|be|<repo>` → `--repo`, `--base`, `--full`, `--aspect`). Exit 2 → dán stdout của CLI vào câu trả lời và dừng. Exit khác 0 và 2 → dán nguyên văn stdout + stderr (phần nào không rỗng) và dừng.
   `--full` = luật mức WARN cũng được subagent kiểm (mặc định WARN chỉ báo theo regex); vẫn CHỈ xét phần code chưa push, không bao giờ cả repo.
2. Đọc ba dòng cuối stdout: `STATE=<dir>`, `PARALLEL=<n>`, `JOBS=<n>`. `JOBS=0` → nhảy tới B7.
   Mỗi repo có mục lục riêng `<STATE>/jobs/<repo>/index.json` (`{repo, repoRoot, branch, baseline, jobs:[{id, code, model, file, files, noIgnore}]}`); liệt kê bằng `<STATE>/jobs/*/index.json`.

## B5 — một subagent cho một job
Đọc `index.json` của từng repo; không mở `plan-*.json`, không mở file job và **không** dán `prompt` vào prompt của subagent — sẽ nạp mọi job vào phiên của SE. Với mỗi job trong `jobs`:
- Dispatch **Agent** với `subagent_type: "vnr-swe:vnr-rule-checker"`, `model: <job.model>` (mặc định `haiku`; owner đặt `model:` ở header bộ luật để ghi đè), `effort: "medium"`. Prompt, bốn dòng:
  `CWD của repo: <repoRoot>`
  `Đọc file job <STATE>/jobs/<repo>/<jobId>.json và làm theo trường "prompt" của nó.`
  `Chỉ dùng Read/Grep/Glob. Không Edit/Write/Bash. Trả lời CHỈ một khối JSON.`
  `Nếu agent không có sẵn, dùng general-purpose và đọc file agent <abs PLUGIN_DIR>/agents/vnr-rule-checker.md trước.`
- Chạy tối đa `PARALLEL` agent cùng lúc (gửi theo lô trong một message).
- Kết quả: trích khối JSON đầu tiên trong câu trả lời, ghi vào `<STATE>/results/<repo>/<jobId>.json`. Không có JSON (hoặc khối JSON hỏng) → ghi `{"code":"<job.code>","verdict":"NEEDS_CONTEXT","findings":[],"needs_context":["subagent không trả JSON"]}` (`code` lấy từ mục của job trong `index.json`).

## B6 — xác minh finding FAIL (bỏ nếu `--no-verify`)
Với mỗi `results` có `verdict: "FAIL"` và mỗi finding (chỉ số 0-based `<i>` trong `findings`): ghi CHỈ `<STATE>/verify-jobs/<repo>/<jobId>-<i>.json` = `{"template":"<đường dẫn tuyệt đối tới <STATE>/verify-jobs/<repo>/<jobId>.template.json>","jobId":"<jobId>","index":<i>,"finding":<JSON finding>}` — không chép block/hunks, không mở file job; rồi dispatch Agent (`subagent_type: "vnr-swe:vnr-rule-verifier"`, `model: "haiku"`, `effort: "medium"`) với prompt, bốn dòng:
  `CWD của repo: <repoRoot>`
  `Đọc file <STATE>/verify-jobs/<repo>/<jobId>-<i>.json (có trường template trỏ tới file khối luật + hunk) và xác minh finding trong đó.`
  `Chỉ dùng Read/Grep/Glob. Không Edit/Write/Bash. Trả lời CHỈ một khối JSON.`
  `Nếu agent không có sẵn, dùng general-purpose và đọc file agent <abs PLUGIN_DIR>/agents/vnr-rule-verifier.md trước.`
Ghi JSON trả về vào `<STATE>/verify/<repo>/<jobId>-<i>.json`; không có JSON → ghi `{"jobId":"<jobId>","index":<i>,"verdict":"unsure","note":"verifier không trả JSON"}`. Chạy song song tối đa `PARALLEL`.

## B7 — báo cáo
Chạy `CLI report --state <STATE>` (+ `--ci` nếu có); phiên bản plugin và thời gian chạy do CLI tự lấy. Exit 1 = có FAIL (bình thường). Exit 4 = lỗi chạy → dán stderr và dừng. Dán nguyên văn stdout của CLI report trong khối ``` theo đúng khuôn `$PLUGIN_DIR/skills/vnr-review/templates/report.template.md` (không bullet, không gộp, không đổi từ, không vẽ lại bảng tóm tắt) vào câu trả lời cho SE (không chỉ hiện ở tool output) — không tóm tắt lại, không thêm lời bình. `--out <file>` → ghi thêm stdout đó vào file.
Sau báo cáo, nếu không `--ci`, thêm đúng một dòng: `Gõ "sửa theo báo cáo" để tôi sửa các finding FAIL/WARN.`

## Ràng buộc
- Không sửa code trong lúc review. Không đọc file NGUỒN của repo ngoài danh sách job; không mở `plan-*.json` (`index.json`, `results/`, `verify-jobs/`, `verify/` là của skill — đọc/ghi bình thường).
- Subagent checker/verifier chỉ dùng Read/Grep/Glob, không Edit/Write/Bash. Subagent chỉ đọc: file job/verify-job (và template) được giao, các file trong 'File được phép đọc thêm' của job, và file nguồn mà hunk thuộc về.
- Không bao giờ tự thêm luật, không hạ FAIL thành PASS vì "có vẻ ổn" — chỉ verifier (B6) được hạ xuống WARN.
- Mọi đường dẫn trong plugin đi qua `$PLUGIN_DIR`.
