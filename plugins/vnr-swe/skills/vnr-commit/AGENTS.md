# plugins/vnr-swe/skills/vnr-commit

## Key Files
| Tệp | Vai trò |
|---|---|
| `SKILL.md` | `/vnr-commit`: B0 nạp quy ước (mặc định + lớp wiki nếu có) và chọn repo đích → B1 nhánh → B2 work item → B3 stage (trừ never-commit) → B4 message + `git commit -F` → B5 báo cáo. Không hỏi (trừ "FE hay BE?" khi cả hai bẩn), không push |
| `convention.md` | lớp quy ước mặc định: `## branch` · `## commit` · `## pr` · `## never-commit` · `## scopes`; `vnr.hrm.wiki/docs/review/git-conventions.md` thay trọn mục cùng tên |

Phụ thuộc: git CLI. `/vnr-pr` cùng plugin đọc `convention.md` và lặp lại B0 của skill này. Không script, không agent.
