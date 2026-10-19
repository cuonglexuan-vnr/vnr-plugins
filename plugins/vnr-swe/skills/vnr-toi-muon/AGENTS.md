# plugins/vnr-swe/skills/vnr-toi-muon

## Key Files
| Tệp | Vai trò |
|---|---|
| `SKILL.md` | router `/vnr-toi-muon` cho **repo bất kỳ**: intake → lane Change (brainstorming → spec → writing-plans → STOP) / lane Bug → build không trông (SDD hoặc executing-plans, TDD) → gate so baseline → stage theo Files → ledger. Bản sao độc lập của `vnr-dev`, bỏ workspace HRM và `vnr-review` |
| `repo.md` | nhận diện repo (`git rev-parse --show-toplevel`), nhánh tích hợp (`--base` > `projects/<x>/dev` > `develop` > `main` > `master`), gate theo bằng chứng stack (nx, node, make/task, dotnet, python, go, rust), luật "đỏ sẵn", risky chung, khuôn tệp ghi đè `work/vnr-toi-muon.md` |

Phụ thuộc: plugin `superpowers@claude-plugins-official`; MCP `tfs` (intake PBI, tuỳ chọn). Không script, không agent riêng. Artefact ở `<ROOT>/work/<id>/`
(skill tự exclude qua `.git/info/exclude`). Khi `vnr-dev` được refactor thành wrapper, phần lõi sẽ lấy từ đây.
