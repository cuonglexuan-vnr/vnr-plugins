# CLAUDE.md — vnr.hrm.marketplace

@AGENTS.md

Tệp gốc của repo (không có tệp cha). `AGENTS.md` là bản đồ; tệp này là quy tắc làm việc.
Khi tệp này, `AGENTS.md` và mã nguồn nói khác nhau: nguồn cụ thể hơn thắng.

## Repo này là gì

Nguồn của marketplace Claude Code `vnr-marketplace`, phân phối hai plugin **chỉ gồm nội dung** (markdown + vài script Node/PowerShell/Python,
không biên dịch):

- `plugins/vnr-swe/` — pipeline Spec-Driven Development cho dev HRM. Một User Story của BA đi qua:
  `plan → plan review (HITL) → tasks → testcases → implement (gate: build) → code review → arch + sec review (gate: review) → e2e stubs → report`
  (thứ tự thật nằm ở `plugins/vnr-swe/skills/vnr-auto-pipeline/workflow.yml`). Nguyên tắc: không code khi chưa có spec,
  không merge khi chưa qua gate; agent làm, người quyết ở checkpoint.
- `plugins/vnr-sa/` — công cụ cho Solution Architect (`vnr-md2docx`, `vnr-tfs`).

Mã HRM (.NET, Angular, Flutter) và quy tắc kiến trúc theo stack **không** nằm ở đây: chúng thuộc dự án cài plugin, đọc qua
`docs/wiki/manifest.json` của dự án đó bằng `plugins/vnr-swe/scripts/resolve-context.mjs`. Đừng viết quy tắc stack cứng vào plugin.

## Đọc AGENTS.md trước khi sửa

Trước khi sửa một tệp dưới `plugins/`, `bin/` hoặc `scripts/`, đọc `AGENTS.md` của thư mục đó (và của thư mục cha nếu tệp nằm
sâu hơn một cấp) để có bản đồ: Key Files, Subdirectories, phụ thuộc chéo. Chỉ bỏ qua với sửa vặt khi đã biết rõ cấu trúc xung quanh.

## Cập nhật AGENTS.md trong cùng một việc

Khi tạo, xoá hoặc đổi vai trò của tệp, cập nhật `AGENTS.md` của thư mục đó ngay trong cùng task, không tách thành việc riêng:

- Thêm tệp → thêm dòng vào bảng Key Files. Xoá tệp → bỏ dòng.
- Tạo thư mục con → thêm vào bảng Subdirectories **và** tạo `AGENTS.md` cho nó. Xoá thư mục → bỏ dòng và xoá `AGENTS.md` của nó.
- Thư mục chưa có `AGENTS.md` → tạo lần đầu khi bạn sửa tệp trong đó (bản đồ lớn dần theo việc thật, không đổ hàng loạt tệp rỗng).
- Thêm skill/agent/plugin → cũng cập nhật bảng trong `README.md` của plugin đó (và `.claude-plugin/marketplace.json` nếu là plugin mới).

Không cập nhật cho sửa lỗi hay refactor không đổi mục đích của tệp.

## Quy ước ngôn ngữ

- **Tiếng Anh:** định danh (tên tệp, skill, agent, biến, hàm, khoá frontmatter, tên nhánh), lệnh, chuỗi log/lỗi kỹ thuật,
  văn bản `--help` của CLI.
- **Tiếng Việt:** phần còn lại — mọi `README.md`, thân skill/agent, comment trong script (kể cả help `<# .SYNOPSIS … #>`
  của PowerShell), mô tả trong tệp cấu hình, `AGENTS.md`, mô tả PR. Thuật ngữ theo `docs/glossary.md`.
  Thân skill/agent hiện còn hỗn hợp Anh/Việt; khi sửa một tệp, giữ ngôn ngữ tệp đó đang dùng cho đến khi tệp được dịch trọn.

## Tự đủ — người đọc chỉ có repo này

Comment trong mã và các tệp ngữ cảnh (`CLAUDE.md`, `AGENTS.md`, `SKILL.md`, agent) được đồng đội đọc mà không có máy của bạn.
Không nhắc đường dẫn ngoài repo, thư mục làm việc riêng (`.self/`, thư mục change, tên plan hay phiên chat), mã task cục bộ, hay
"quyết định trong chat" — ghi thẳng sự việc vào tệp. Mã work item dùng chung (PBI trên TFS) chỉ ghi khi cả đội theo dõi ở đó.

## Quy tắc riêng của repo

- Đường dẫn trong nội dung plugin luôn qua `$PLUGIN_DIR/…` (skill/agent) hoặc `${CLAUDE_PLUGIN_ROOT}/…` (hook):
  plugin chạy từ plugin store của Claude, không nằm trong project người dùng.
- Đổi nội dung được đóng gói (`.claude-plugin/`, `plugins/`, `README.md`) → tăng `version` trong `.claude-plugin/marketplace.json`
  (đó là version gửi lên registry) và thêm mục tương ứng vào `CHANGELOG.md`.
- Zip phát hành là phẳng và allow-list (`scripts/build-marketplace-zip.mjs`); tooling, `.git`, `.self/` không bao giờ vào zip.
- Gate trước khi báo xong, chạy từ gốc repo:

  ```sh
  npm test                                      # zip builder (node:test)
  node bin/vnr-bootstrap.mjs --help             # bootstrap còn chạy được
  ```

  Nội dung skill/agent không có test tự động: kiểm bằng `claude plugin marketplace add <đường dẫn repo>` rồi
  `claude plugin install <plugin>` và chạy thử skill vừa sửa. Publish (`npm run publish:registry`, cần `AK_TOKEN`) chỉ khi
  được yêu cầu, sau khi merge.
- Không commit, không push: người dùng xem và commit một lần bằng tay. Để lại việc đã xong ở trạng thái staged theo đường
  dẫn cụ thể (`git add -- path/…`), không `git add -A`.
