# plugins/vnr-swe/skills/vnr-dev

## Key Files
| Tệp | Vai trò |
|---|---|
| `SKILL.md` | router `/vnr-dev`: intake → lane Change (brainstorming → spec → writing-plans → STOP) / lane Bug → build không trông (SDD hoặc executing-plans, TDD) → verification → finishing → `/vnr-review` → ledger. Bảng ghi đè sub-skill + Envelope ở cuối |
| `workspace.md` | quy tắc nhận diện chế độ (`workspace`/`single-repo`/`unknown`), nhánh tích hợp (`--base` > `projects/<customer>/dev` > `develop`), gate FE/BE, path risky, khuôn tệp ghi đè `work/vnr-dev.md` |

Phụ thuộc: plugin `superpowers@claude-plugins-official` (dependency ở marketplace entry); skill `vnr-review` cùng plugin; MCP `tfs` (intake PBI, tuỳ chọn).
Không có script, không có agent riêng. Artefact của SE nằm ở `<cwd>/work/<id>/` (gitignored trong `vnr.hrm.wiki`).
