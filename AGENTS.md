<!-- Tạo: 2026-10-08 -->

# vnr.hrm.marketplace

## Mục đích

Repo nguồn của **Claude Code marketplace `vnr-marketplace`**, chứa hai plugin nội dung (markdown, không biên dịch):
`vnr-swe` (quy trình Spec-Driven Development cho dev HRM) và `vnr-sa` (bộ công cụ cho Solution Architect).
Người dùng cuối cài qua `vnr-bootstrap` (`npx github:cuonglexuan-vnr/vnr-plugins init vnr-swe`, hoặc
`install-vnr-swe.ps1` / `.cmd`) — bootstrap gọi `claude plugin marketplace add` + `claude plugin install`, **không** chép
tệp vào project. DevHub nhận marketplace dưới dạng một zip phẳng trên registry VNR
(`https://registry.vnresource.net/api/v1/repositories/vnr-ai/download/marketplace.zip`) — tên kho trên registry khác tên marketplace, cố ý.

Không có ở đây: mã nguồn HRM (BE .NET, FE Angular, Flutter) mà các agent của `vnr-swe` thao tác — đó là repo của dự án
cài plugin; quy tắc kiến trúc theo stack cũng nằm ở wiki của dự án đó (`docs/wiki/manifest.json`), không nằm trong plugin.

## Key Files

| Tệp | Vai trò |
|---|---|
| `.claude-plugin/marketplace.json` | Manifest marketplace `vnr-marketplace`: danh sách plugin + `source` + `version` (version được gửi lên registry) |
| `package.json` | Gói `@vnr/claude-bootstrap` (Node ≥ 18.18): bin `vnr-bootstrap`, script `test`, `publish:registry` |
| `bin/vnr-bootstrap.mjs` | CLI `vnr-bootstrap init [plugin-id] [--scope project\|user] [--refresh-marketplace]`; mặc định `vnr-swe`, scope `project` |
| `install-vnr-swe.ps1`, `install-vnr-swe.cmd` | Wrapper Windows gọi bootstrap cho `vnr-swe` trong một thư mục project |
| `scripts/build-marketplace-zip.mjs` | Dựng zip phẳng, chỉ gồm `MARKETPLACE_ZIP_INCLUDE` = `.claude-plugin`, `plugins`, `README.md` |
| `scripts/build-marketplace-zip.test.mjs` | `node:test`: zip phẳng, loại `.git`/tooling, từ chối khi thiếu manifest |
| `scripts/publish-to-registry.mjs` | PUT zip lên registry; env `AK_TOKEN` (bắt buộc), `AK_REPO_BASE`, `AK_ARTIFACT` |
| `README.md` | Hướng dẫn cài và publish (tiếng Việt) — được đóng vào zip, người dùng cuối đọc |
| `docs/glossary.md` | Bảng thuật ngữ dùng thống nhất cho mọi tài liệu/comment/mô tả |
| `assets/pat-page.png` | Ảnh minh hoạ trang tạo PAT |

## Subdirectories

| Thư mục | Vai trò |
|---|---|
| `plugins/vnr-swe/` | Plugin SDD: `skills/` (`vnr-*`, mỗi skill một `SKILL.md`), `agents/` (14 agent), `memory/constitution.md`, `templates/`, `hooks/`, `scripts/` |
| `plugins/vnr-sa/` | Plugin SA: skill `vnr-md2docx` (Markdown → DOCX theo template VNR, Python) và `vnr-tfs` (PBI/Task TFS từ `config.yml` + template HTML) |
| `docs/` | Tài liệu chính thức của repo (hiện: bảng thuật ngữ) |
| `bin/` | Entry CLI của bootstrap |
| `scripts/` | Tooling phát hành marketplace (không đóng vào zip) |

## Cho AI agent

### Khuôn

- **Thêm plugin** → `plugins/<plugin>/.claude-plugin/plugin.json` + `README.md`, thêm mục vào
  `.claude-plugin/marketplace.json` (`name`, `source: ./plugins/<plugin>`, `version`, `category`), và (nên có)
  `plugins/<plugin>/devhub.catalog.json` — thông tin giới thiệu trong Tiện ích của DevHub: `icon` (emoji), `tags`,
  `examples` (câu hỏi mẫu), `defaultScope`, `providesTable` (bảng "Dùng cho"), `changelog`. Nexus đọc tệp này khi đồng bộ;
  tệp sai → plugin vẫn vào catalog, tệp bị bỏ qua kèm cảnh báo. Không có việc gì phải làm ở nexus: nguồn `vnr-marketplace`
  đã xác minh, nên mọi plugin ở đây hiện dưới «Dành riêng cho VNR».
- **Thêm skill** → `plugins/<plugin>/skills/<vnr-name>/SKILL.md`, frontmatter `name`, `description`, `argument-hint`,
  `user-invocable: true` (thêm `compatibility`, `metadata` nếu cần); thân bắt đầu bằng `$ARGUMENTS`. Tệp phụ (script,
  template, config) đặt cạnh `SKILL.md` trong cùng thư mục skill.
- **Thêm agent** (`vnr-swe`) → `plugins/vnr-swe/agents/vnr-<role>.md`, frontmatter `name`, `role`, `step`, `description`,
  `model`; skill trỏ tới agent bằng `$PLUGIN_DIR/agents/<agent>.md`.
- Trong nội dung plugin, mọi đường dẫn tới tệp của plugin đi qua `$PLUGIN_DIR/…` (skill/agent) hoặc
  `${CLAUDE_PLUGIN_ROOT}/…` (hook) — plugin chạy từ plugin store của Claude, không nằm trong project người dùng.
- Ngữ cảnh theo stack không hard-code trong plugin: agent gọi
  `node "$PLUGIN_DIR/scripts/resolve-context.mjs" --phase <plan|implement|review> --paths "…"`; hook
  `PreToolUse(Write|Edit|MultiEdit)` trong `hooks/hooks.json` gọi cùng script với `--hook`. Không có manifest wiki → no-op.
- `plugins/vnr-swe/skills/vnr-auto-pipeline/workflow.yml` định nghĩa các phase của pipeline; `plugins/vnr-swe/extensions.yml` gắn `vnr-wiki` / `vnr-wiki-sync`
  vào `before_plan`, `before_implement`, `after_implement`.

### Kiểm thử

- `npm test` = `node --test "scripts/*.test.mjs"` — chỉ phủ zip builder. Test dựng repo giả trong `os.tmpdir()`
  (`mkdtempSync`) và đọc lại zip bằng `adm-zip`.
- Nội dung skill/agent không có test tự động; kiểm bằng cách cài marketplace cục bộ
  (`claude plugin marketplace add <đường dẫn repo>` rồi `claude plugin install <plugin>`) và chạy skill.
- `plugins/vnr-swe/scripts/okf-validate.mjs` kiểm wiki của **dự án dùng plugin** (`--layer wiki|raw`), không kiểm repo này.

### Phụ thuộc

- Dev: `adm-zip` (devDependency duy nhất). Runtime bootstrap: Node ≥ 18.18, `claude` CLI trong `PATH`.
- `plugins/vnr-swe/.mcp.json`: MCP `tfs` (SSE, header PAT/org/project là placeholder) và `amis-task`;
  `devhub.required-env.json` khai `AMIS_USER_ID`, `USER_EMAIL` cho DevHub điền.
- `vnr-md2docx`: Python 3 + `python-docx` (`requirements.txt`).
- Registry VNR (Artifact Keeper) để phân phối; DevHub đồng bộ qua Settings › Marketplaces.
