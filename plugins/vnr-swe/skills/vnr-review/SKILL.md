---
name: "vnr-review"
description: >-
  Review trước khi push / kiểm tra code trước khi push: review phần code thay đổi (chưa push) của repo BE/FE trong workspace vnr.hrm.wiki theo bộ luật ở docs/review/.
  Báo cáo tiếng Việt một bảng PASS / WARN / FAIL, dán thẳng vào mô tả PR. Chạy vài phút. Chế độ `check` cho owner bộ luật.
argument-hint: "[fe|be|<tên-repo>] [--base <ref>] [--aspect a,b] [--ci] [--out <file>] | check"
compatibility: "Chạy tại gốc vnr.hrm.wiki (có docs/review/rules). Node ≥ 22.5."
user-invocable: true
---

$ARGUMENTS

Bạn điều phối; mọi việc lặp lại được do script làm. `PLUGIN_DIR` = `${CLAUDE_PLUGIN_ROOT}`. `CLI` = `node "$PLUGIN_DIR/skills/vnr-review/scripts/cli.mjs"`.
Khi ghi prompt cho subagent hoặc lệnh Bash, thay `$PLUGIN_DIR` bằng đường dẫn tuyệt đối của `${CLAUDE_PLUGIN_ROOT}` — subagent không biết biến này. Lấy giá trị bằng Bash `echo "$CLAUDE_PLUGIN_ROOT"` một lần ở đầu lượt chạy.
Cho tới báo cáo, SE chỉ thấy đúng hai dòng tiến trình (B1, B2) — không in gì khác. `--out <file>` là cờ của skill (B4), **không** truyền cho `CLI`.

## Chế độ `check` (owner bộ luật)
Nếu đối số là `check`: chạy `CLI check`, in nguyên văn kết quả, dừng. Không sinh gì khác.

## B1 — plan
Chạy `CLI plan` với các cờ nhận được (`fe|be|<repo>` → `--repo`, `--base`, `--aspect`). Exit 2 → dán stdout vào câu trả lời và dừng. Exit 1 (hay khác 0) → dán nguyên văn stdout + stderr (phần nào không rỗng) và dừng.
Exit 0: stdout có một dòng mỗi repo (`<repo> @ <nhánh> … · <k> file · <g> nhóm · <r> luật trong phạm vi · <c> lượt review`), rồi `STATE=<dir>`, `PARALLEL=<n>`, `CELLS=<n>`. Lấy `repoRoot` của từng repo một lần: Bash `node -p "require(process.argv[1]).repo.root" "<STATE>/plan-<repo>.json"`.
In dòng tiến trình 1: `Đang review <n> file theo <m> luật (<CELLS> lượt, vài phút)…` (`n` = tổng `<k>`, `m` = tổng `<r>` của các dòng repo). Ngay sau đó, nếu stdout/stderr của `plan` có dòng repo bị bỏ (`<repo>: không xác định được baseline …`, `<repo>: lỗi git — …`) hoặc dòng `  ! …`: in nguyên văn các dòng đó, không gì khác. `CELLS=0` → B4.

## B2 — review
Mỗi lượt review là một phần của một nhóm luật (nội bộ, không nói với SE). Lặp tối đa 3 vòng:
1. Chạy `CLI ledger --state <STATE>`. Stdout: các dòng `RETRY <repo> <fileId> <model> <attempt>`, rồi `PENDING=<n> FAILED=<n>`. `PENDING=0` → B3. Từ vòng thứ 2, nếu có dòng `RETRY`: in dòng tiến trình 2 `Kiểm lại <PENDING> lượt chưa có kết quả…` (một lần).
2. Mỗi dòng `RETRY` → một **Agent** `subagent_type: "vnr-swe:vnr-rule-checker"`, `model: <model>` (giá trị tool Agent không nhận → `sonnet`), `effort: "medium"`, prompt đúng bốn dòng:
   `Repo: <repoRoot>`
   `Đọc HẾT file <STATE>/jobs/<repo>/<fileId>.prompt.md (theo trang tới dòng cuối) và làm theo.`
   `Chỉ Read/Grep/Glob; ghép <repoRoot> vào mọi đường dẫn; không Edit/Write/Bash.`
   `Trả CHỈ một khối JSON.`
   Gửi tối đa `PARALLEL` agent trong một message (nhiều đợt nếu nhiều dòng hơn). Agent type không có → `general-purpose`, thêm dòng đầu `Đọc <abs PLUGIN_DIR>/agents/vnr-rule-checker.md trước.`
3. Trích khối JSON đầu tiên trong câu trả lời, ghi vào `<STATE>/results/<repo>/<fileId>.json`; không có JSON (hoặc hỏng) → không ghi (ledger giao lại). Gọi lại bước 1 CHỈ sau khi mọi agent của vòng đã trả.

## B3 — verify
Chạy `CLI verify-jobs --state <STATE>`. Stdout: các dòng `VERIFY <repo> <key> <model>`, rồi `VERIFY=<n>`. Mỗi dòng `VERIFY` → một **Agent** `subagent_type: "vnr-swe:vnr-rule-verifier"`, `model: <model>` (như B2), `effort: "medium"`, prompt đúng bốn dòng:
   `Repo: <repoRoot>`
   `Đọc HẾT file <STATE>/verify-jobs/<repo>/<key>.json và tìm bằng chứng BÁC BỎ finding trong đó.`
   `Chỉ Read/Grep/Glob; ghép <repoRoot> vào mọi đường dẫn; không Edit/Write/Bash.`
   `Trả CHỈ một khối JSON.`
Song song tối đa `PARALLEL`; agent type không có → như B2 với `vnr-rule-verifier.md`. Ghi khối JSON trả về vào `<STATE>/verify/<repo>/<key>.json`; không có JSON → không ghi (báo cáo hạ thành WARN).

## B4 — báo cáo
Chạy `CLI report --state <STATE> [--ci] 2>"<STATE>/report.err"` — stderr (phiên bản luật, cảnh báo cho người bảo trì) vào file, tool output chỉ còn stdout. Exit 0 = PASS/WARN, 1 = có FAIL (bình thường). Exit 4: stdout không rỗng (`--ci` chưa kiểm hết) → dán stdout như dưới rồi dòng CUỐI của `report.err`; stdout rỗng (lỗi chạy) → dán `report.err` và dừng.
Dán stdout NGUYÊN VĂN vào câu trả lời cho SE (không chỉ hiện ở tool output), KHÔNG bọc trong ``` — đúng khuôn `$PLUGIN_DIR/skills/vnr-review/templates/report.template.md`: không bullet, không gộp, không đổi từ, không tóm tắt, không lời bình. `--out <file>` → ghi thêm stdout đó vào file. Chỉ khi exit 1 và không `--ci`: sau báo cáo, cách một dòng trống, thêm đúng một dòng: `Gõ "sửa theo báo cáo" để tôi sửa các mục FAIL (không commit).`

## Khi SE gõ "sửa theo báo cáo"
- Báo cáo đã in nên được đọc `jobs/`, `results/`, `verify/`. Chỉ sửa finding (`file`, `line`, `issue`, `fix` trong `<STATE>/results/<repo>/<fileId>.json`) của luật mức FAIL mà `<STATE>/verify/<repo>/<fileId>-<code>-<f>.json` có `"verdict":"confirmed"` (`<f>` = chỉ số của `file` trong `files` của `jobs/<repo>/<fileId>.json`); bỏ `wrong`, chưa verify, file ngoài `files`. WARN chỉ khi SE nói rõ.
- Finding trên `(commit …)` / `(branch)`: không sửa, báo SE "cần sửa tay (commit message / tên nhánh)".
- Chỉ chạm `file:line` của finding (ghép `repoRoot`); không tự thêm `review-ignore`; không commit, không push. Kết thúc: `git diff --stat` của từng repo đã sửa, rồi dòng `Chạy lại /vnr-review để kiểm.`

## Ràng buộc
- Không sửa code trong lúc review. Trong B1–B4 không Read file trong `jobs/`, `verify-jobs/` hay `plan-*.json` — subagent tự đọc; nạp vào phiên của SE là phí. Mọi đường dẫn trong plugin đi qua `$PLUGIN_DIR`.
- Subagent checker/verifier đọc được cả repo (Read/Grep/Glob, đường dẫn ghép `repoRoot`) nhưng không sửa gì, không Edit/Write/Bash.
- Không bao giờ tự thêm luật, không đổi kết quả vì "có vẻ ổn" — chỉ verifier (B3) được bác bỏ finding FAIL.
