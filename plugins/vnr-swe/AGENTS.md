# plugins/vnr-swe
Plugin cho dev VNR: năm lệnh (`/vnr-dev`, `/vnr-review`, `/vnr-toi-muon`, `/vnr-commit`, `/vnr-pr`), nội dung markdown + script Node của `vnr-review`, không biên dịch. Nền `superpowers`.

## Key Files
| Tệp | Vai trò |
|---|---|
| `.claude-plugin/plugin.json` | tên, version (2.x), mô tả; **không** khai dependency ở đây — dependency `superpowers` nằm ở entry trong `.claude-plugin/marketplace.json` gốc repo |
| `README.md` | hướng dẫn SE cho các lệnh — cập nhật khi đổi hành vi |
| `.mcp.json` | MCP `tfs` (intake PBI của `/vnr-dev`), `amis-task` (placeholder) |
| `devhub.catalog.json` | giới thiệu plugin trong Tiện ích DevHub (icon, tags, examples, changelog) |
| `devhub.required-env.json` | contract DevHub (version-locked) |
| `devhub.claude-md.json` | contract DevHub: các khối ghi vào CLAUDE.md máy SE (`blocks[{id, scope: user\|project, source}]`), thay trọn khối giữa `<!-- BEGIN:<id> -->`/`<!-- END:<id> -->`; DevHub ghi ở bước "Ngữ cảnh cho Claude" của Trang chủ, đọc từ bản marketplace đã sync (không cần cài), không gỡ khi uninstall, chỉ `scope: user` được hỗ trợ |

## Subdirectories
| Thư mục | Vai trò |
|---|---|
| `skills/vnr-dev/` | router làm PBI trên nền superpowers + `workspace.md` (nhận diện repo/nhánh/gate) — xem AGENTS.md trong đó |
| `skills/vnr-toi-muon/` | router làm PBI trong repo bất kỳ (bản sao độc lập của vnr-dev, không vnr-review) + `repo.md` (nhận diện stack/nhánh/gate) — xem AGENTS.md trong đó |
| `skills/vnr-review/` | review diff trước khi push theo bộ luật `docs/review/` của workspace — xem AGENTS.md trong đó |
| `skills/vnr-commit/` | commit theo quy ước team, không hỏi; `convention.md` = lớp quy ước mặc định (lớp wiki `docs/review/git-conventions.md` ghi đè theo mục) — xem AGENTS.md trong đó |
| `skills/vnr-pr/` | push + mở PR (TFS MCP, hoặc in text) với tiêu đề EN, mô tả VI; trong workspace wiki đính kèm `work/vnr-review/<repo>.md` — xem AGENTS.md trong đó |
| `agents/` | agent của `vnr-review` (không có AGENTS.md riêng: validator coi mọi .md trong agents/ là agent) — `vnr-rule-checker.md` kiểm một phần nhóm luật trên phần code thay đổi, trả JSON mỗi mã một dòng; `vnr-rule-verifier.md` tìm bằng chứng bác bỏ finding FAIL của một (mã, file) (confirmed \| wrong); cả hai chỉ Read/Grep/Glob, model sonnet |
| `claude-md/` | thân các khối CLAUDE.md mà `devhub.claude-md.json` trỏ tới (`hrm-wiki-rules.md` ≤ 40 dòng: workspace HRM; `git-conventions.md`: điều hướng "commit" → `/vnr-commit`, "tạo PR" → `/vnr-pr` ở mọi repo + tóm tắt quy ước) |
