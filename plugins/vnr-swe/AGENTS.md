# plugins/vnr-swe

Plugin SDD cho dev HRM. Nội dung markdown + script Node/PowerShell/Python, không biên dịch.

## Key Files
| Tệp | Vai trò |
|---|---|
| `.claude-plugin/plugin.json` | tên, version plugin (tăng khi đổi nội dung đóng gói) |
| `README.md` | bảng skill/agent cho người dùng cuối — cập nhật khi thêm skill/agent |
| `.mcp.json` | MCP `tfs`, `amis-task` (placeholder) |
| `devhub.catalog.json` | thông tin giới thiệu plugin trong Tiện ích DevHub (icon, tags, examples, changelog) |
| `extensions.yml` | gắn `vnr-wiki` / `vnr-wiki-sync` vào `before_plan`, `before_implement`, `after_implement` |
| `devhub.required-env.json` | contract DevHub (version-locked) |
| `memory/constitution.md` | quy tắc gốc mọi agent tuân theo |

## Subdirectories
| Thư mục | Vai trò |
|---|---|
| `skills/` | một skill một thư mục `vnr-*/SKILL.md` (`vnr-review/` có AGENTS.md riêng); `vnr-review` = review diff trước khi push theo bộ luật ở `docs/review/` của workspace |
| `agents/` | agent `vnr-<role>.md` (xem AGENTS.md trong đó); `vnr-rule-checker` / `vnr-rule-verifier` phục vụ `vnr-review` |
| `scripts/` | script dùng chung (`okf-validate.mjs`, `resolve-context.mjs`); lớp máy của `vnr-review` nằm trong `skills/vnr-review/scripts/` |
| `hooks/` | `hooks.json` PreToolUse (resolve-context) · `security-hooks.json` patterns |
| `templates/` | mẫu đầu ra của pipeline |
