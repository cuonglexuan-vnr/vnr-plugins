# plugins/vnr-swe/skills/vnr-review

## Key Files
| Tệp | Vai trò |
|---|---|
| `SKILL.md` | điều phối `/vnr-review`: B1 `cli.mjs plan` → B2 vòng `ledger` + dispatch `vnr-swe:vnr-rule-checker` mỗi dòng `RETRY` (tối đa 3 vòng) → B3 `verify-jobs` + dispatch `vnr-swe:vnr-rule-verifier` → B4 `report` dán nguyên văn, không fence; đúng hai dòng tiến trình; định nghĩa "sửa theo báo cáo"; chế độ `check` |
| `templates/report.template.md` | khuôn đầu ra của `CLI report` (kèm ví dụ thật): orchestrator dán stdout nguyên văn theo khuôn này, không bọc fence, không bullet/gộp/đổi từ |

Phụ thuộc: `scripts/` (lớp máy, xem AGENTS.md trong đó) · `../../agents/vnr-rule-{checker,verifier}.md` · bộ luật `docs/review/` của workspace.
