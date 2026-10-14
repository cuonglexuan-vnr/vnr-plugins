# plugins/vnr-swe/skills/vnr-review

## Key Files
| Tệp | Vai trò |
|---|---|
| `SKILL.md` | điều phối `/vnr-review`: gọi `scripts/cli.mjs` (`plan` · `report` · `check`), dispatch `vnr-swe:vnr-rule-checker` (B5) và `vnr-swe:vnr-rule-verifier` (B6), dán báo cáo (B7) |
| `templates/report.template.md` | khuôn đầu ra của `CLI report` (kèm ví dụ thật): orchestrator dán stdout nguyên văn theo khuôn này, không bullet/gộp/đổi từ |

Phụ thuộc: `scripts/` (lớp máy, xem AGENTS.md trong đó) · `../../agents/vnr-rule-{checker,verifier}.md` · bộ luật `docs/review/` của workspace.
