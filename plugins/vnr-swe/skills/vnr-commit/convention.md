# convention.md — quy ước git mặc định của `/vnr-commit` và `/vnr-pr`

Lớp mặc định, áp cho mọi repo. Khi tìm thấy `docs/review/git-conventions.md` của workspace `vnr.hrm.wiki` (xem SKILL.md §B0),
mục nào trong tệp đó có cùng tiêu đề `## …` thì **thay trọn** mục ở đây; mục không có thì giữ mặc định. Nguồn gốc: Conventional
Commits 1.0.0 (https://www.conventionalcommits.org/) và quyết định của team lead HRM (2026-10-22): tiêu đề tiếng Anh, thân tiếng Việt,
mô tả PR tiếng Việt.

## branch
- Dạng: `<type>/<id>-<slug>`; không có work item → `<type>/<slug>`.
- `type` ∈ `feat` · `fix` · `refactor` · `perf` · `test` · `docs` · `build` · `chore` · `revert`.
- `slug`: 2–5 từ tiếng Anh, kebab-case, lấy từ mục đích của thay đổi (không phải tên file).
- Nhánh tích hợp (không bao giờ commit thẳng lên): `develop`, `master`, `main`, `release/*`, `hotfix/*`, `projects/<x>/dev`.

## commit
- Tiêu đề: `<type>(<scope>)[!]: <description>` — tiếng Anh, thức mệnh lệnh, chữ thường, không chấm cuối, ≤ 72 ký tự,
  đúng một khoảng trắng sau `:`. `type` theo danh sách ở `## branch` (+ `style` nếu repo có CSS). `scope` theo `## scopes`; không có → bỏ ngoặc.
- `!` ngay trước `:` khi thay đổi phá tương thích (đổi/xoá endpoint, field, enum đang lưu, migration không lùi được); hoặc footer
  `BREAKING CHANGE: <mô tả>` (viết hoa).
- Thân: **tiếng Việt**, gạch đầu dòng, cách tiêu đề một dòng trống, nói VÌ SAO và đánh đổi, không kể lại `--stat`.
  Chỉ viết thân khi diff đụng ≥ 2 scope, đổi contract, hay sửa bug im lặng. Còn lại: không thân.
- Footer work item: không có ở lớp mặc định (lớp wiki quy định). Không footer ghi công cụ (`Co-Authored-By`, `Generated with`).
- Một commit = một mục đích. Diff rõ ràng gồm hai việc → vẫn một commit, cộng một dòng cảnh báo gợi ý tách.

## pr
- Tiêu đề: cùng dạng tiêu đề commit, tiếng Anh. Nhánh có đúng một commit → lấy nguyên tiêu đề commit đó; nhiều commit → một dòng mới tóm cả nhánh.
- Mô tả: tiếng Việt, đúng bốn mục theo thứ tự:
  `## Vì sao` (1–2 câu: vấn đề hay PBI) · `## Thay đổi` (gạch đầu dòng từ các commit; breaking/migration nói rõ) ·
  `## Kiểm tra` (gate đã chạy và kết quả in ra; chưa chạy ghi `chưa chạy`; dán báo cáo `/vnr-review` nếu có) · `## Work item` (`#<id>` hoặc `—`).
- Không footer ghi công cụ.

## never-commit
Luôn loại khỏi stage (kể cả khi `.gitignore` chưa có): `.env`, `.env.*`, `.claude/settings.local.json`, `work/`, `.superpowers/`,
`.self/`, `*.binlog`, `TestResults/`, `node_modules/`, `dist/`, `bin/`, `obj/`.

## scopes
Lấy từ đường dẫn file thay đổi, ưu tiên theo thứ tự: tên project Nx (`libs/<…>/<name>/`, `apps/<name>/` → `<name>`) · thư mục module
(`Src/Modules/<name>/` → `<name>` chữ thường) · thư mục cấp một có ý nghĩa (`docs`, `scripts`, `plugins/<name>`). Nhiều scope → scope có
nhiều file nhất; còn lại nói trong thân.
