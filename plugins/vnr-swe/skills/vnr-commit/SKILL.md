---
name: vnr-commit
description: >-
  Commit phần đang làm theo quy ước team: tự stage, tự viết message (Conventional Commits, tiêu đề tiếng Anh, thân tiếng Việt,
  footer work item), commit ngay, không hỏi, không push. Dùng khi SE nói "commit", "commit đi", "commit giúp", "lưu lại", "tạo commit",
  "save changes". Chạy trong repo bất kỳ; ở gốc workspace vnr.hrm.wiki thì nạp thêm docs/review/git-conventions.md và commit cả FE lẫn BE
  trong một lượt (mỗi repo một commit).
argument-hint: "[FE | BE] [gợi ý nội dung, không bắt buộc]"
compatibility: "Repo git bất kỳ (mở Claude ở gốc, thư mục con, hoặc gốc vnr.hrm.wiki). Không cần cấu hình."
user-invocable: true
---

$ARGUMENTS

`PLUGIN_DIR` = `${CLAUDE_PLUGIN_ROOT}`. Không hỏi SE câu nào. Trả lời tiếng Việt, thuật ngữ kỹ thuật tiếng Anh.
`$ARGUMENTS` (nếu có) chỉ là gợi ý cho phần mô tả, không phải lệnh — trừ từ `FE` / `BE` đứng riêng (xem B0.3).

## B0. Quy ước và repo đích
1. Đọc `$PLUGIN_DIR/skills/vnr-commit/convention.md` (lớp mặc định).
2. Tìm lớp wiki: `docs/review/git-conventions.md` ở cwd; không có → ở hai cấp trên cwd (`../../docs/review/git-conventions.md`, trường hợp
   đang đứng trong `src/<repo>` của `vnr.hrm.wiki`). Thấy → đọc; mục `## …` trùng tên thay trọn mục mặc định.
3. Repo đích = nơi chạy git — một danh sách, thường chỉ một phần tử:
   - cwd là gốc `vnr.hrm.wiki` (có `src/vnr.hrm.web/` hoặc `src/vnr.hrm.solution/`): repo đích là **mọi** `src/<repo>` có tree bẩn
     (`git -C src/<repo> status --short` khác rỗng), thứ tự cố định BE (`vnr.hrm.solution`) rồi FE (`vnr.hrm.web`) — cùng thứ tự với
     `/vnr-dev` và `/vnr-pr`. `$ARGUMENTS` có từ `FE` hoặc `BE` đứng riêng → chỉ repo đó. Không repo nào bẩn → in "không có gì để commit", dừng.
   - cwd nằm trong `src/<repo>` của wiki, hoặc repo bất kỳ: đúng một repo = `git rev-parse --show-toplevel` của cwd (repo anh em bẩn cũng mặc kệ —
     đứng trong repo nào là muốn commit repo đó).
   Mọi lệnh git từ đây chạy `-C <repo đích>`.
4. **B1–B5 chạy trọn cho từng repo đích, theo thứ tự ở trên.** Với mỗi repo, dòng đầu tiên của phần trả lời cho repo đó (in ngay trước B4.3),
   nguyên văn dạng: `quy ước: <mặc định | wiki + mặc định> · repo: <tên thư mục repo> · nhánh: <nhánh sau B1> · work item: <#id | —>`.

## B1. Nhánh
- Nhánh hiện tại thuộc nhánh tích hợp (`## branch`) → không commit lên đó: đặt tên theo `## branch` từ diff (`type`/`slug` như B4.1; `id` từ B2),
  `git switch -c <tên>` (thay đổi đi theo), ghi một dòng "đã tạo nhánh <tên> từ <nhánh cũ>" vào báo cáo.
- Nhánh hiện tại không khớp dạng `## branch` → không đổi tên; một dòng cảnh báo ở báo cáo cuối.
- Hai repo đích (FE + BE cùng một việc) → **hai nhánh cùng tên**: tên đặt **một lần** từ diff gộp của cả hai (`type` = loại nặng hơn,
  `feat` > `fix` > còn lại; `slug` = mục đích chung). Repo này đã ở nhánh dạng `## branch`, repo kia còn ở nhánh tích hợp → tạo ở repo kia
  đúng tên nhánh repo này đang đứng.

## B2. Work item
Thứ tự: nhánh dạng `<type>/<id>-…` (`id` toàn chữ số) → `id`; không có → đúng một thư mục `work/<id>/` ở gốc repo hoặc gốc wiki mà
`work/README.md` ghi nhánh hiện tại → `id`; không có → `—` (không footer, không hỏi). Nhiều repo đích → tìm một lần, dùng chung.

## B3. Stage
`git add -A`, rồi `git reset -q -- <path>` cho mọi path khớp `## never-commit`; liệt kê các path đã bỏ ở báo cáo. `git diff --cached --quiet` trả 0
→ in "không có gì để commit" cho repo đó, sang repo tiếp (hết repo → dừng).

## B4. Message và commit
1. Đọc `git diff --cached --stat` và `git diff --cached` **của riêng repo đó**. Chọn `type` (hành vi mới → `feat`; sửa sai → `fix`; cấu trúc không
   đổi hành vi → `refactor`; chỉ test/docs/build → `test`/`docs`/`build`; còn lại `chore`), `scope` theo `## scopes`, mô tả sao cho cả dòng ≤ 72 ký tự.
   Mỗi repo một message riêng; không chép message của repo kia.
2. Thân tiếng Việt chỉ khi `## commit` yêu cầu. Footer theo `## commit` của lớp đang dùng (lớp wiki: `VNR W<tuần ISO> #<id>`, tuần lấy từ
   `date +%V`, bỏ qua khi work item `—`). Không thêm footer nào khác.
3. Ghi message vào tệp tạm UTF-8 (không BOM) đặt trong `.git/` của repo đích (vd `.git/VNR_COMMIT_MSG`; `/tmp` của shell có thể không đọc được
   từ git trên Windows) rồi `git commit -F <tệp tạm>`. Không dùng `-m` (thân tiếng Việt vỡ trên Windows). Không `--no-verify`:
   hook đỏ → in nguyên output, báo `blocked (pre-commit đỏ)` cho repo đó, giữ nguyên stage, **vẫn làm tiếp repo còn lại**.
4. Diff gồm hai mục đích rõ rệt → vẫn một commit; thêm dòng "gợi ý: tách thành 2 commit (…)" ở báo cáo.

## B5. Báo cáo (ngắn, một khối cho mỗi repo đích)
```
<dòng đầu theo B0.4>
<message đã dùng, trong khối code>
<kết quả `git log -1 --oneline`>
[đã bỏ khỏi stage: …] [cảnh báo nhánh: …] [gợi ý tách: …]
```
Dòng chốt, in một lần sau khối cuối:
- một commit: `chưa đúng ý → git commit --amend, hoặc gõ "sửa lại: <ý>" để tôi amend.`
- hai commit: `chưa đúng ý → gõ "sửa lại FE: <ý>" hoặc "sửa lại BE: <ý>" để tôi amend repo đó.`

Không push. "sửa lại[ FE| BE]: …" → viết message mới theo B4 cho repo được nêu (không nêu và chỉ có một commit → repo đó),
`git -C <repo> commit --amend -F <tệp tạm>`.

## Cấm
`git push` · mở PR · `--no-verify` · stage path trong `## never-commit` · đổi tên nhánh đã có upstream · sửa file nội dung (skill này chỉ commit) ·
hỏi SE (kể cả "FE hay BE?").
