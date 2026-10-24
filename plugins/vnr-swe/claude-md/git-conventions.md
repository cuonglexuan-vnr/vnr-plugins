# Git conventions

Khối này do DevHub ghi ở bước "Ngữ cảnh cho Claude" của Trang chủ; đừng sửa tay (DevHub ghi đè khi chạy lại bước đó). Áp cho **mọi repo** trên máy này.

Khi SE nói "commit", "commit đi", "lưu lại", "tạo commit", "save changes" → dùng skill `/vnr-commit`: tự stage, tự viết message theo quy ước team, commit ngay, không hỏi, không push.
Khi SE nói "push", "tạo PR", "mở PR", "gửi review", "create pull request" → dùng skill `/vnr-pr`: push + mở PR, tiêu đề tiếng Anh, mô tả tiếng Việt.
Không tự commit/push/PR khi SE chưa bảo. SE bảo thì làm qua hai skill trên — không tự nghĩ ra message, tên nhánh hay mô tả PR theo kiểu khác.

Quy ước (chi tiết trong skill, SA team ghi đè ở `vnr.hrm.wiki/docs/review/git-conventions.md`):
- Nhánh `<type>/<id>-<slug>` (`feat` · `fix` · `refactor` · `perf` · `test` · `docs` · `build` · `chore` · `revert`); không commit thẳng lên `develop` / `master` / `main` / `projects/<x>/dev`.
- Commit: Conventional Commits — tiêu đề tiếng Anh `<type>(<scope>): <mô tả>` ≤ 72 ký tự; thân tiếng Việt khi cần; footer `VNR W<tuần> #<id>`; không footer ghi công cụ.
- PR: tiêu đề cùng dạng tiêu đề commit (tiếng Anh); mô tả tiếng Việt bốn mục Vì sao · Thay đổi · Kiểm tra · Work item.
