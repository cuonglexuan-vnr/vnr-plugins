# plugins/vnr-swe/agents

Agent của pipeline SDD và của `/vnr-review`. Mỗi agent một file `vnr-<role>.md`; skill gọi qua `$PLUGIN_DIR/agents/<agent>.md`
hoặc `subagent_type: "vnr-swe:<agent>"`.

## Quy ước
- Tên file = `name` trong frontmatter. Khoá frontmatter: `name`, `role`, `step`, `description`, `model` (+ `tools` khi cần giới hạn).
- Thân agent giữ ngôn ngữ đang dùng của file (Anh/Việt hỗn hợp cho đến khi được dịch trọn).

## Agent của `/vnr-review`
| Tệp | Vai trò |
|---|---|
| `vnr-rule-checker.md` | kiểm MỘT luật trên MỘT job (file/commit/nhánh) theo prompt do `cli.mjs plan` sinh; chỉ Read/Grep/Glob; trả một khối JSON |
| `vnr-rule-verifier.md` | xác minh MỘT finding FAIL (confirmed \| unsure \| wrong) từ file verify-job `{template, jobId, index, finding}`; chỉ Read/Grep/Glob |

Các agent còn lại (`vnr-planner`, `vnr-*-reviewer`, `vnr-*-developer`, …) thuộc pipeline `vnr-auto-pipeline`; vai trò ở frontmatter `role`/`step`.
