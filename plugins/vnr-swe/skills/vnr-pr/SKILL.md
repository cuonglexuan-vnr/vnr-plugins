---
name: vnr-pr
description: >-
  Push nhánh hiện tại và mở pull request theo quy ước team: tiêu đề Conventional Commits tiếng Anh, mô tả tiếng Việt bốn mục
  (Vì sao · Thay đổi · Kiểm tra · Work item), tạo PR trên TFS qua MCP, in link. Không hỏi. Dùng khi SE nói "push", "tạo PR",
  "mở PR", "gửi review", "create pull request". Chạy trong repo bất kỳ; không có MCP thì in sẵn tiêu đề + mô tả để dán; đính kèm
  báo cáo /vnr-review khi chạy trong workspace vnr.hrm.wiki.
argument-hint: "[--base <nhánh đích>]"
compatibility: "Repo git bất kỳ có remote. PR tự động cần MCP tfs (DevHub › Nối TFS); không có thì in text để dán."
user-invocable: true
---

$ARGUMENTS

`PLUGIN_DIR` = `${CLAUDE_PLUGIN_ROOT}`. Không hỏi SE câu nào. Trả lời tiếng Việt, thuật ngữ kỹ thuật tiếng Anh.

## P0. Quy ước, repo đích, nhánh đích
1. Làm đúng B0 của `$PLUGIN_DIR/skills/vnr-commit/SKILL.md` (đọc `convention.md`, nạp lớp wiki nếu có, chọn repo đích). Ở gốc wiki: repo đích là
   `src/<repo>` có commit chưa push hoặc tree bẩn; cả hai → làm BE trước rồi FE, hai PR. In dòng đầu cùng dạng với `/vnr-commit`.
2. Nhánh đích: `--base` nếu có; không thì nhánh hiện tại dạng `projects/<x>/…` → `projects/<x>/dev`; còn lại `develop` nếu có trên remote
   (`git ls-remote --heads origin develop`), rồi `main`, rồi `master`.
3. Nhánh hiện tại là nhánh tích hợp (`## branch`) → in "đang đứng trên <nhánh>, không mở PR từ nhánh tích hợp", dừng.

## P1. Trạng thái
- `git status --short` khác rỗng → gọi Skill `vnr-swe:vnr-commit` trước (cùng phiên), rồi tiếp. Ở gốc wiki, `/vnr-commit` tự commit mọi
  `src/<repo>` bẩn trong một lượt (mỗi repo một commit) — gọi đúng một lần, không gọi lại cho repo thứ hai.
- `git fetch origin <đích>`; `git rev-list --count origin/<đích>..HEAD` = 0 → in "nhánh chưa có commit nào so với <đích>", dừng. Không push, không PR.

## P2. Push
`git push -u origin HEAD`. Bị từ chối (non-fast-forward) → in nguyên lỗi, dừng; không `--force`.

## P3. Tiêu đề và mô tả (theo `## pr`)
- Commit trên nhánh: `git log origin/<đích>..HEAD --format='%s%n%b'`.
- Tiêu đề: một commit → nguyên tiêu đề của nó; nhiều → một dòng `<type>(<scope>): <tóm tắt>` tiếng Anh, `type` của commit nặng nhất
  (`feat` > `fix` > còn lại), ≤ 72 ký tự.
- Mô tả tiếng Việt, đúng bốn mục `## Vì sao` · `## Thay đổi` · `## Kiểm tra` · `## Work item`. `## Work item`: `#<id>` theo B2 của
  `/vnr-commit`; không có → `—`.
- `## Kiểm tra`, theo thứ tự:
  1. Nội dung `baseline-gates.md` và `review.md` trong `work/<id>/` (do `/vnr-dev`, `/vnr-toi-muon` ghi) nếu có.
  2. **Chỉ khi biết gốc wiki** (B0 thấy `docs/review/git-conventions.md` ở cwd hoặc `../../`): đọc `<gốc wiki>/work/vnr-review/<tên thư mục
     repo đích>.md`. Độ mới (sau bước commit ở P1): lấy `tree=<id>` ở dòng đầu `<!-- vnr-review tree=<id> -->`, so với
     `git -C <repo đích> rev-parse HEAD^{tree}` — `<id>` là tree của code đã review nếu commit trọn, trừ file never-commit, đúng phần
     `/vnr-commit` stage, nên review rồi mới commit vẫn khớp. File không có dòng `tree=` (bản cũ) → lấy `(<sha7>)` ở dòng `## vnr-review —`
     đầu tiên, so với `git -C <repo đích> rev-parse --short=7 HEAD`. Bằng nhau → dán nguyên văn báo cáo (bỏ dòng `<!-- … -->`; markdown,
     không bọc khối code). Khác → dán như vậy, thêm ngay trên báo cáo một dòng:
     `⚠ Kết quả /vnr-review đã lệch với code hiện tại — bạn nên chạy lại /vnr-review.` Không có file → `/vnr-review: chưa chạy`.
  3. Không có gì ở (1) và không ở trong workspace → `chưa chạy` như cũ.
- Báo cáo đính kèm có `VERDICT:FAIL` → vẫn đính kèm, không chặn; ngay trước P4 in cho SE đúng một dòng:
  `Báo cáo /vnr-review còn FAIL — PR vẫn được tạo, reviewer sẽ thấy trong mô tả.`

## P4. Tạo PR
1. Remote (`git remote get-url origin`) là TFS/Azure DevOps (có `/_git/<repo>`) và MCP `tfs` nối được → tool `create_pull_request`
   với repository = `<repo>` trong URL, source = nhánh hiện tại, target = nhánh đích, title, description. In link PR trả về.
2. Không MCP, MCP báo lỗi, hoặc remote khác → in tiêu đề + mô tả trong khối code để dán, kèm link tạo PR:
   TFS `<remote-url>/pullrequestcreate?sourceRef=<nhánh>&targetRef=<đích>`; GitHub `<remote-url>/compare/<đích>...<nhánh>?expand=1`; khác → chỉ in text.

## P5. Báo cáo
Một dòng: `PR: <link>` hoặc `PR chưa tạo được (<lý do>) — dán text trên vào TFS`.

## Cấm
`--force` · tạo PR từ nhánh tích hợp · sửa file nội dung · hỏi SE.
