# vnr-swe

> Plugin Claude Code cho dev VNR: **năm lệnh**, phần còn lại AI tự làm.

Hướng dẫn cho người dùng: https://sa-hrm.vnrlocal.com/docs/marketplace/user/vnr-swe/lam-pbi-voi-vnr-dev

| Lệnh | Khi nào | Bạn làm gì |
|---|---|---|
| `/vnr-dev <PBI id \| mô tả \| file spec BA \| resume <id>>` | nhận một PBI, một yêu cầu hay một bug | trả lời vài câu làm rõ, duyệt spec, duyệt plan (khi lớn). AI code, build, test, review, để nhánh + staged cho bạn commit |
| `/vnr-review [fe\|be]` | trước khi push | đọc một bảng FAIL/WARN, mỗi dòng một chỗ phải sửa; dán vào mô tả PR. Gõ "sửa theo báo cáo" nếu muốn AI sửa |
| `/vnr-toi-muon <PBI id \| mô tả \| file spec \| resume <id>>` | làm việc trong **repo bất kỳ** (không cần workspace HRM) | như `/vnr-dev`: trả lời vài câu, duyệt spec, duyệt plan (khi lớn); AI code, build, test, review toàn nhánh, để nhánh + staged. Không có `/vnr-review` ở cuối |
| `/vnr-commit` | muốn lưu phần đang làm | không gì cả: chỉ cần nói "commit". AI stage, viết message theo quy ước team (tiêu đề tiếng Anh, thân tiếng Việt, work item), commit ngay |
| `/vnr-pr` | xong, muốn gửi review | không gì cả: chỉ cần nói "tạo PR". AI push, mở PR trên TFS với tiêu đề tiếng Anh + mô tả tiếng Việt (kèm báo cáo `/vnr-review` khi chạy trong `vnr.hrm.wiki`), trả link |

Nền: plugin [`superpowers`](https://github.com/obra/superpowers) (brainstorming, writing-plans, TDD, systematic-debugging…). `/vnr-dev` chỉ
điều phối các skill đó theo cách làm của VNR. Lệnh `/vnr-auto-pipeline` cũ không còn — gõ `/vnr-dev`.

## Cài đặt (SE)

1. **DevHub › Trang chủ › Cài đặt tất cả.** DevHub cài Claude Code, `superpowers`, `vnr-swe` (scope user) và ghi hai khối *HRM Wiki* và *Git conventions* vào CLAUDE.md
   của máy bạn (bước "Ngữ cảnh cho Claude"). Cài `vnr-swe` từ Tiện ích thì chưa có khối — về Trang chủ bấm bước đó. Khối được giữ lại khi gỡ plugin.
2. Clone `vnr.hrm.wiki`; bên trong clone FE vào `src/vnr.hrm.web`, BE vào `src/vnr.hrm.solution` (đúng tên).
3. Node ≥ 22.5 (`node --version`).

Cài tay (không DevHub): `claude plugin install superpowers@claude-plugins-official` rồi `npx github:cuonglexuan-vnr/vnr-plugins init vnr-swe`.

## Dùng `/vnr-dev`

```
cd vnr.hrm.wiki        # hoặc cd thẳng vào src/vnr.hrm.web / src/vnr.hrm.solution
claude
/vnr-dev 7916          # PBI id → AI đọc PBI trên TFS và mọi file .md trong work/7916/
/vnr-dev D:\spec\090_SPEC_cham-cong.md     # file BA → copy vào work/<id>/spec-ba.md
/vnr-dev tôi muốn thêm cột ngày sinh vào grid nhân viên
/vnr-dev sửa bug: lưu nhân viên báo 500 khi bỏ trống email
/vnr-dev resume 7916   # làm tiếp từ bước dang dở
```

Luồng: hỏi làm rõ (ngắn, trắc nghiệm) → `work/<id>/spec.md` (bạn duyệt) → `work/<id>/<id>-plan.md` (bạn duyệt khi ≥ 4 task hoặc đụng
chỗ nguy hiểm) → AI tạo nhánh `<type>/<id>-<slug>` từ `develop` (hoặc `projects/<customer>/dev`), code theo TDD, chạy build/test, chạy
`/vnr-review`, dán báo cáo → bạn xem `git diff --cached <nhánh tích hợp>` trong repo đích rồi **commit** (nói "commit" → `/vnr-commit`). AI không commit/push/PR khi bạn chưa bảo.

Mở Claude thẳng trong một repo (`src/vnr.hrm.web`…) vẫn làm được PBI, nhưng `/vnr-review` cần bộ luật ở gốc `vnr.hrm.wiki`: khi đó `/vnr-dev` ghi `review: NOT RUN` và bạn chạy `/vnr-review` tại gốc wiki.

Không cần cấu hình: skill tự nhận ra đang ở `vnr.hrm.wiki` hay trong một repo, và nhánh dự án. Muốn ghi đè (nhánh gốc, gate, chỗ nguy
hiểm): tạo `work/vnr-dev.md` theo mẫu trong `skills/vnr-dev/workspace.md`. Thư mục `work/` không commit.

## Dùng `/vnr-toi-muon` (repo bất kỳ)

```
cd <repo nào cũng được>     # mở ở gốc hoặc thư mục con đều được
claude
/vnr-toi-muon thêm cột trạng thái vào bảng đơn hàng
/vnr-toi-muon 7916                      # PBI id (cần MCP tfs)
/vnr-toi-muon D:\spec\090_SPEC.md       # file spec
/vnr-toi-muon sửa bug: export CSV lỗi khi tên có dấu
/vnr-toi-muon resume 7916
```

Cùng luồng và cùng kỷ luật với `/vnr-dev` (spec → plan → code TDD → gate so với test đỏ sẵn → review toàn nhánh → staged, không commit),
nhưng tự nhận ra stack của repo (nx, node, make/task, dotnet, python, go, rust) và nhánh gốc (`develop` → `main` → `master`); không chạy
`/vnr-review`. Artefact ở `work/<id>/` tại gốc repo (tự exclude khỏi git). Ghi đè gate/nhánh: `work/vnr-toi-muon.md` theo mẫu trong
`skills/vnr-toi-muon/repo.md`. Đang ở workspace `vnr.hrm.wiki` thì dùng `/vnr-dev` để có review theo bộ luật.

## Dùng `/vnr-commit` và `/vnr-pr`

```
commit            # hoặc /vnr-commit — AI stage, viết message, commit; in message và `git log -1`
tạo PR            # hoặc /vnr-pr — AI push, mở PR (TFS qua MCP), trả link; không MCP thì in text để dán
```

Quy ước: Conventional Commits, tiêu đề tiếng Anh ≤ 72 ký tự, thân tiếng Việt khi cần, footer `VNR W<tuần> #<id>` (work item lấy từ tên nhánh
`<type>/<id>-<slug>` hoặc `work/<id>/`), mô tả PR tiếng Việt bốn mục (Vì sao · Thay đổi · Kiểm tra · Work item). Mặc định nằm trong plugin
(`skills/vnr-commit/convention.md`); ở `vnr.hrm.wiki`, SA team ghi đè bằng `docs/review/git-conventions.md`. Chạy được ở repo bất kỳ.
Sai ý → `git commit --amend` hoặc nói "sửa lại: …".

## Dùng `/vnr-review`

Hướng dẫn đầy đủ cho SE: `docs/review/user-guide.md` trong `vnr.hrm.wiki`. Tóm tắt: `/vnr-review` (cả FE+BE), `/vnr-review fe`,
`/vnr-review be`; chỉ xét code chưa push; luật ở `docs/review/rules/`; `/vnr-review check` cho owner bộ luật.

## Bên trong plugin

| Đường dẫn | Vai trò |
|---|---|
| `skills/vnr-dev/SKILL.md`, `workspace.md` | router `/vnr-dev` + quy tắc nhận diện repo/nhánh/gate |
| `skills/vnr-toi-muon/SKILL.md`, `repo.md` | router cho repo bất kỳ + nhận diện stack/nhánh/gate |
| `skills/vnr-commit/SKILL.md`, `convention.md` | `/vnr-commit` + lớp quy ước git mặc định |
| `skills/vnr-pr/SKILL.md` | `/vnr-pr`: push + PR |
| `skills/vnr-review/` | `SKILL.md` điều phối; `scripts/` (Node, có test); `templates/report.template.md` |
| `agents/vnr-rule-checker.md`, `vnr-rule-verifier.md` | hai agent sonnet của `/vnr-review` |
| `claude-md/hrm-wiki-rules.md`, `claude-md/git-conventions.md`, `devhub.claude-md.json` | hai khối CLAUDE.md DevHub ghi vào máy SE (hợp đồng: `blocks[{id, scope, source}]`): workspace HRM, và điều hướng commit / PR cho mọi repo |
| `.mcp.json` | MCP `tfs` (đọc PBI; PAT placeholder) và `amis-task` |
| `devhub.required-env.json` | biến DevHub tự điền (`AMIS_USER_ID`, `USER_EMAIL`) |
| `devhub.catalog.json` | giới thiệu plugin trong Tiện ích DevHub |

MCP `tfs`: điền `Authorization: Bearer <PAT>` trong `.mcp.json` (DevHub làm giúp) để `/vnr-dev <PBI id>` đọc được PBI; không có MCP thì
dán nội dung PBI hoặc đưa file spec.
