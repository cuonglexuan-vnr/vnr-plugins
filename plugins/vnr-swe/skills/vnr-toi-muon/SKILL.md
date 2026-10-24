---
name: vnr-toi-muon
description: >-
  "Tôi muốn…" — làm một PBI, một yêu cầu hay sửa một bug trong **bất kỳ repo nào** từ đầu đến cuối: hỏi làm rõ, chốt spec, lên kế hoạch
  cho bạn duyệt, rồi tự code theo TDD, tự chạy build/test, review toàn nhánh và để nhánh + staged cho bạn commit. Dùng khi dev nói
  "tôi muốn <việc>", "làm PBI <id>", "sửa bug <mô tả>", "tiếp tục <tên>". Khác /vnr-dev: không cần workspace HRM, không review theo bộ luật.
argument-hint: "<PBI id | mô tả | đường dẫn file spec | URL | resume <tên>> [--base <nhánh>]"
compatibility: "Cần plugin superpowers. Chạy trong một repo git bất kỳ (mở Claude ở gốc hoặc thư mục con)."
user-invocable: true
---

$ARGUMENTS

Bạn điều phối; superpowers làm từng bước. `PLUGIN_DIR` = `${CLAUDE_PLUGIN_ROOT}`. Đọc `$PLUGIN_DIR/skills/vnr-toi-muon/repo.md` trước: nó nói cách
nhận ra repo, nhánh tích hợp, gate và path nguy hiểm cho mọi stack. Không bắt dev cấu hình gì. Trả lời tiếng Việt, thuật ngữ kỹ thuật tiếng Anh.
`ROOT` = `git rev-parse --show-toplevel`. `WORK = ROOT/work/<id>/`. `PLAN` = `WORK/<id>-plan.md` (tên riêng theo `id` để ledger SDD `.superpowers/sdd/<id>-plan/` không trùng).

## B0 — Nhận diện (theo repo.md)
- Không phải repo git → hỏi một câu (mở Claude ở repo nào?) rồi dừng. Xác định `ROOT`, stack, gate, nhánh tích hợp (`--base` thắng mọi suy luận).
- `git status --short` ở `ROOT`, **bỏ qua** `work/`: còn thay đổi khác → nếu là `resume` và nhánh hiện tại là nhánh của `<id>` thì tiếp (việc của lượt trước); ngược lại dừng, in danh sách, không đụng gì. Sạch → tiếp.
- `work/` không bao giờ vào commit: `git check-ignore -q work/` thất bại → thêm dòng `work/` vào `ROOT/.git/info/exclude` (không sửa `.gitignore`).
- `WORK` tạo nếu chưa có. `work/README.md` là ledger: `| id | PBI | stage | ngày | tiếp theo |` — một dòng mỗi `id` (`id` = PBI id; không có → slug kebab-case ≤ 5 từ): chưa có thì thêm (`intent`), có rồi thì ghi đè đúng dòng đó; không thêm văn xuôi.

## B1 — Intake, chọn lane
Trước khi gọi skill nào khác, và lại ở dòng **đầu tiên** của tin nhắn đầu gửi dev (kể cả khi tin đó là câu hỏi của brainstorming), in nguyên văn: `Lane: Change|Bug · repo: <tên thư mục ROOT> · stack: <theo repo.md> · base: <nhánh tích hợp>`.
| Đầu vào | Làm gì |
|---|---|
| PBI id (số) | `mcp__tfs__get_work_item` (`expand: all`) + đọc mọi `*.md` trong `WORK`. Không có MCP → bảo dev dán nội dung PBI hoặc file. |
| đường dẫn file `.md` | copy nguyên văn vào `WORK/spec-ba.md` (giữ tên gốc trong dòng đầu), đọc nó; ảnh cạnh file gốc (`images/`) đọc tại chỗ |
| URL | WebFetch; không được → hỏi dev dán nội dung |
| câu mô tả | dùng làm đề bài |
| `resume <id>` | đọc `PLAN` (lane Change) hoặc `WORK/bug.md` (lane Bug), `## Decisions taken unattended`, `WORK/baseline-gates.md`; tiến độ ở ledger `.superpowers/sdd/<id>-plan/progress.md` dưới `ROOT` (cả big lẫn small; superpowers không tick checkbox); không còn tệp → theo cột `stage`/`tiếp theo` của `work/README.md`; checkout nhánh của `<id>` nếu đã tạo (kiểm sạch như B3 bước 3 trước); vào lại bước đầu tiên chưa xong |
Lane **Bug** khi dev nói "bug", "fix", "lỗi", dán stack trace, hoặc mô tả hành vi sai; còn lại lane **Change**.
Thiếu thông tin → hỏi **đúng một** câu (riêng khi repo.md không nhận ra gate/base: một câu gộp, một lần, ghi `work/vnr-toi-muon.md`), rồi tiếp.
Agent nền (khảo sát code, Explore): chờ kết quả trong cùng lượt; không `ScheduleWakeup`.

## B2 — Lane Change, phần có dev (hai điểm dừng, không bao giờ tự duyệt)
1. `superpowers:brainstorming` → `WORK/spec.md`. Hỏi từng câu, ưu tiên trắc nghiệm, ngắn; chỉ hỏi điều đề bài để ngỏ hoặc tự mâu thuẫn.
   Trước khi đưa phương án về schema, kiểu dữ liệu hay API: đọc CLAUDE.md, AGENTS.md, `.claude/rules/` của repo và code đang có; phương án trái quy ước repo thì nêu rõ là trái, không khuyến nghị.
   Sau câu hỏi cuối viết thẳng `WORK/spec.md` (kèm mục *Ngoài phạm vi* và *Lệch đề bài* nếu có). **STOP 1** = lần duyệt duy nhất trước plan.
2. In `Đang viết plan (~<N> task)…`, rồi `superpowers:writing-plans` → `PLAN`; dán khối *Envelope* dưới đây vào `## Global Constraints`.
   Plan ước ≥ 4 task hoặc đụng *Risky*: chỉ task đầu có code đầy đủ; task còn lại ghi Files + hành vi + dòng Expected của test (implementer tự viết code) — không phải placeholder, ghi đè "No Placeholders"/Placeholder scan của writing-plans.
   **big** = ≥ 4 task HOẶC đụng path trong mục *Risky* của repo.md. small → sang B3 không hỏi.
   big → **STOP 2**: dev đọc plan, gõ "go".
   Ledger → `planned` (cả small), `building` khi vào B3.

## B3 — Phần không trông (Envelope là luật)
3. Nhánh `<type>/<id>-<slug>` (`feat` · `fix` · `refactor` · `chore` · `docs`; không có id → `<type>/<slug>`; slug 2–5 từ tiếng Anh kebab-case từ tên spec): chưa có → tạo từ nhánh tích hợp; có rồi (resume) → checkout. Không worktree. Trước khi tạo/checkout: kiểm sạch như B0.
   Ngay sau khi tạo, **trước khi sửa bất kỳ file nào**: chạy gate của repo.md một lần → `WORK/baseline-gates.md` (mỗi gate: lệnh · kết quả · tên test đỏ sẵn); gate cần tên project/package lấy theo Files của `PLAN` (Bug: file trong trace). Tệp đã có (resume, Bug → Change) → dùng lại.
4. big → `superpowers:subagent-driven-development`; small → `superpowers:executing-plans`; `superpowers:test-driven-development` bên trong.
   Không xoá `.superpowers/sdd/`; lượt mới chỉ xoá tệp phẳng cũ `.superpowers/sdd/progress.md` nếu có. Sau mỗi task xong: in `Task <n>/<N> xong` và ghi đè cột `tiếp theo` của ledger = `Task <n+1>/<N> (<tên>)`.
5. `superpowers:verification-before-completion`: chạy **từng** gate của repo.md riêng rẽ, đọc output thật, so với `WORK/baseline-gates.md`.
6. Gate xanh (repo.md §3: exit 0, hoặc chỉ còn đúng các test đỏ sẵn trong baseline) → `git add -- <paths>` với paths = mục **Files** của các task (lane Bug: `## Files` trong `bug.md`) — file khác xuất hiện → một dòng Decisions rồi mới stage. Gate đỏ (lỗi build hoặc test đỏ mới) → không stage, ledger `blocked (<gate> đỏ: <test>)`, vẫn sang bước 7. **Không** commit/push/PR.
7. Ledger → `built (<nhánh>[; đỏ sẵn: <test>])` hoặc `blocked (<lý do>)`. Chép `progress.md` của ledger SDD/executing-plans, nếu còn, vào `WORK/progress.md`.
   Kết thúc bằng: tóm tắt review cuối toàn nhánh (của SDD/executing-plans) · nhánh · lệnh xem diff (`git diff --cached <nhánh tích hợp>`; blocked: `git diff <nhánh tích hợp>` + `git status --short`) · "Dev commit tay".

## Lane Bug — làm đúng thứ tự, không bỏ bước dù bug trông đơn giản
1. Ngữ cảnh trước: đọc CLAUDE.md, AGENTS.md, `.claude/rules/` của repo (nếu có), **rồi** mới đọc source quanh chỗ lỗi.
2. Viết `WORK/bug.md`: triệu chứng/trace, `## Files` dự kiến sửa, khối *Envelope* (mục `## Envelope`). Không tái hiện được → hỏi tối đa **một** câu. Từ đây không trông; mỗi quyết định ghi `## Decisions taken unattended` trong `bug.md`.
3. Nhánh `fix/<id>-<slug>` theo B3 bước 3, rồi baseline `WORK/baseline-gates.md`. **Chưa sửa file nào trước khi baseline xong**.
4. **REQUIRED SUB-SKILL:** `superpowers:systematic-debugging` (Phase 4 = TDD: viết test tái hiện, chạy thấy đỏ, rồi mới sửa). 3 vòng sửa thất bại → `blocked`, giả thuyết ghi `## Blockers` trong `bug.md`.
5. Tiếp B3 từ bước 5. Sửa > 3 file → dừng lane Bug, ghi lý do vào `bug.md`, chuyển lane Change tại `writing-plans` với đầu vào `WORK/bug.md` (plan ghi ra `PLAN`, qua **STOP 2**).

## Ghi đè mặc định của sub-skill (user > tệp này > sub-skill; không sửa tệp sub-skill)
| Sub-skill mặc định | Ở đây |
|---|---|
| brainstorming / writing-plans: lưu `docs/superpowers/…`, commit; hỏi "Subagent-Driven or Inline?" | `WORK/` (`spec.md`, `PLAN`); không commit; big/small tự quyết |
| brainstorming: trình thiết kế từng phần, hỏi duyệt từng phần | sau câu hỏi cuối viết thẳng `WORK/spec.md`; một lần duyệt = STOP 1 |
| mọi bước "commit" / "stage" (writing-plans Step 5, SDD implementer, finishing) | **không** commit, **không** stage trong task; chỉ B3 bước 6 stage sau khi gate xanh. **Không bao giờ** commit/push/PR — dev làm tay. SDD reviewer đọc `git diff -- <Files của task>` + file mới của task; review cuối đọc `git diff <nhánh tích hợp>` + `git ls-files --others --exclude-standard` |
| using-git-worktrees hỏi; "không bắt đầu trên main" | không worktree, không stash, không thư mục ngoài `ROOT`; nhánh của bước 3 |
| SDD / executing-plans / systematic-debugging hỏi khi xung đột, BLOCKED, ≥ 3 lần sửa hỏng | plan quyết; vi phạm Envelope → `blocked`; một dòng `## Decisions taken unattended` trong `PLAN` (lane Bug: `bug.md`); tiếp task độc lập kế tiếp |
| SDD "luôn chỉ định model" | implementer: `model: haiku` chỉ khi task có code đầy đủ VÀ đụng ≤ 2 file; còn lại — kể cả mọi reviewer — **không** truyền `model` |
| TDD "hỏi người" khi ngoại lệ | task chỉ có docs/prompt/config → không cần test hỏng trước; bằng chứng = dòng Expected của task |
| finishing-a-development-branch (chạy lại full suite, dừng khi đỏ; menu chọn) | không gọi: B3 bước 5 là bước kiểm duy nhất (so baseline); kết quả = giữ nguyên nhánh, staged khi gate xanh, chưa commit |

## Envelope (dán vào PLAN § Global Constraints, lane Bug: bug.md § Envelope; dòng riêng của plan thắng khối này)
Được tự quyết: tên · bố cục tệp trong các thư mục plan nêu · hình dạng test · refactor nhỏ trong tệp đã đụng · model mỗi lần dispatch (theo bảng ghi đè).
Cấm: `git commit` / `git push` / PR · worktree, `git stash` · đụng path *Risky* mà plan không nêu · xoá hay làm yếu test · chạy service đang chạy · ghi auto-memory hay tệp ngoài `WORK/`, `ROOT` và `.superpowers/`.
Quy ước: theo CLAUDE.md / AGENTS.md / `.claude/rules/` của repo. Mỗi quyết định không trông: một dòng (giờ · task · gì · vì sao · cách hoàn tác) trong `PLAN § Decisions taken unattended` (lane Bug: `bug.md`) — ledger SDD và auto-memory không thay được mục này.
Mọi điểm dừng của sub-skill: `blocked` + tiếp task độc lập kế tiếp. Không hỏi, không chờ.
