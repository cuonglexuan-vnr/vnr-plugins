# plugins/vnr-swe/skills/vnr-pr

## Key Files
| Tệp | Vai trò |
|---|---|
| `SKILL.md` | `/vnr-pr`: P0 quy ước + nhánh đích → P1 commit phần chưa commit (gọi `/vnr-commit`) và kiểm có commit mới → P2 push → P3 tiêu đề EN + mô tả VI bốn mục → P4 tạo PR qua MCP `tfs` (không có: in text + link tạo PR) → P5 link. Không hỏi |

Phụ thuộc: `skills/vnr-commit/convention.md` (mục `## pr`, `## branch`) và B0 của `/vnr-commit`; MCP `tfs` (tuỳ chọn). Không script, không agent.
