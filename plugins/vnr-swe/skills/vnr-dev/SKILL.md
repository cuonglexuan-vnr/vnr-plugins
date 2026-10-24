---
name: vnr-dev
description: >-
  "Tôi muốn…" — làm một PBI, một yêu cầu hay sửa một bug HRM từ đầu đến cuối: hỏi làm rõ, chốt spec, lên kế hoạch cho SE duyệt,
  rồi tự code, tự build/test, tự chạy /vnr-review và trả về một báo cáo. Dùng khi SE nói "làm PBI <id>", "tôi muốn <việc>",
  "sửa bug <mô tả>", "tiếp tục <tên>". Thay cho lệnh /vnr-auto-pipeline cũ.
argument-hint: "<PBI id | mô tả | đường dẫn file spec BA | URL | resume <tên>> [--base <nhánh>]"
compatibility: "Cần plugin superpowers (DevHub cài kèm). Chạy tại gốc vnr.hrm.wiki hoặc trong một repo FE/BE."
user-invocable: true
---

$ARGUMENTS

Bạn điều phối; superpowers làm từng bước. `PLUGIN_DIR` = `${CLAUDE_PLUGIN_ROOT}`. Đọc `$PLUGIN_DIR/skills/vnr-dev/workspace.md` trước: nó nói repo nào, nhánh nào,
gate nào, path nào nguy hiểm. Không bắt SE cấu hình gì. Trả lời tiếng Việt, thuật ngữ kỹ thuật tiếng Anh.
`PLAN` = `WORK/<id>-plan.md` (tên riêng theo `id` để ledger SDD `.superpowers/sdd/<id>-plan/` không trùng giữa các PBI).

## B0 — Nhận diện (theo workspace.md)
- Xác định chế độ (`workspace` | `single-repo` | `unknown`), repo đích, nhánh tích hợp (`--base` thắng mọi suy luận).
- `git status --short` ở repo đích, **bỏ qua** `work/` (chế độ `workspace`: repo đích chỉ rõ sau plan/bug.md → kiểm ở B3 bước 3 và lane Bug bước 2, chỉ repo sắp tạo nhánh; bẩn lúc không trông → ledger `blocked (repo bẩn)`, dừng): còn thay đổi khác → nếu là `resume` và nhánh hiện tại là nhánh của `<id>` thì tiếp (đó là việc của lượt trước); ngược lại dừng, in danh sách, không đụng gì. Sạch → tiếp.
- `work/` không bao giờ vào commit: repo đích chưa ignore nó (`git check-ignore -q work/` thất bại) → thêm dòng `work/` vào `.git/info/exclude` (không sửa `.gitignore` của repo).
- Thư mục làm việc `WORK = <cwd>/work/<id>/` (`id` = PBI id; không có PBI → slug kebab-case ≤ 5 từ). Tạo nếu chưa có.
  `work/README.md` là ledger: `| id | PBI | stage | ngày | tiếp theo |` — một dòng mỗi `id`: chưa có thì thêm (`intent`), có rồi thì ghi đè đúng dòng đó; không thêm văn xuôi.

## B1 — Intake, chọn lane
Trước khi gọi skill nào khác, và lại ở dòng **đầu tiên** của tin nhắn đầu gửi SE (kể cả khi tin đó là câu hỏi của brainstorming), in nguyên văn: `Lane: Change|Bug · mode: <chế độ> · repo: <repo đích hoặc "chưa rõ"> · base: <nhánh tích hợp>`.
| Đầu vào | Làm gì |
|---|---|
| PBI id (số) | `mcp__tfs__get_work_item` (`expand: all`) + đọc mọi `*.md` trong `WORK` (spec BA). Không có MCP → bảo SE dán nội dung PBI hoặc file. |
| đường dẫn file `.md` | copy nguyên văn vào `WORK/spec-ba.md` (giữ tên gốc trong dòng đầu), đọc nó; ảnh cạnh file gốc (`images/`) đọc tại chỗ |
| URL | WebFetch; không được → hỏi SE dán nội dung |
| câu mô tả | dùng làm đề bài |
| `resume <id>` | đọc `PLAN` (lane Change) hoặc `WORK/bug.md` (lane Bug), `## Decisions taken unattended`, `WORK/baseline-gates.md`; tiến độ ở ledger `.superpowers/sdd/<id>-plan/progress.md` dưới gốc git nơi SDD/executing-plans chạy (cả big lẫn small; superpowers không tick checkbox); không còn tệp (review cuối sạch đã xoá) → theo cột `stage`/`tiếp theo` của `work/README.md`; checkout nhánh của `<id>` nếu đã tạo (kiểm sạch như B3 bước 3 trước khi checkout); chạy ở cùng thư mục với lượt đầu (`work/` theo cwd); vào lại bước đầu tiên chưa xong |
Lane **Bug** khi SE nói "bug", "fix", "lỗi", dán stack trace, hoặc mô tả hành vi sai; còn lại lane **Change**.
Thiếu thông tin → hỏi **đúng một** câu (riêng chế độ `unknown` của workspace.md: hai câu, một lần), rồi tiếp.
Agent nền (khảo sát FE/BE, Explore): chờ kết quả trong cùng lượt; không `ScheduleWakeup`.

## B2 — Lane Change, phần có SE (hai điểm dừng, không bao giờ tự duyệt)
1. `superpowers:brainstorming` → `WORK/spec.md`. Hỏi từng câu, ưu tiên trắc nghiệm, ngắn; chỉ hỏi điều spec BA để ngỏ hoặc tự mâu thuẫn.
   Trước khi đưa phương án về schema, kiểu dữ liệu hay API: đọc CLAUDE.md + `.claude/rules/` của repo đích và code đang có; phương án trái quy ước repo thì nêu rõ là trái, không khuyến nghị.
   Sau câu hỏi cuối viết thẳng `WORK/spec.md` (kèm mục *Ngoài phạm vi* và *Lệch spec BA* nếu có). **STOP 1** = lần duyệt duy nhất trước plan.
2. In `Đang viết plan (~<N> task)…`, rồi `superpowers:writing-plans` → `PLAN`; dán khối *Envelope* dưới đây vào `## Global Constraints`.
   Plan ước ≥ 4 task hoặc đụng *Risky*: chỉ task đầu của mỗi repo có code đầy đủ; task còn lại ghi Files + hành vi + dòng Expected của test (implementer tự viết code) — không phải placeholder, ghi đè "No Placeholders"/Placeholder scan của writing-plans.
   **big** = ≥ 4 task HOẶC đụng path trong mục *Risky* của workspace.md. small → sang B3 không hỏi.
   big → **STOP 2**: SE đọc plan, gõ "go".
   Ledger → `planned` (cả small), `building` khi vào B3.

## B3 — Phần không trông (Envelope là luật)
3. Nhánh `<type>/<id>-<slug>` (`feat` · `fix` · `refactor` · `chore` · `docs`; không có id → `<type>/<slug>`; slug 2–5 từ tiếng Anh kebab-case từ tên spec) trong repo đích: chưa có → tạo từ nhánh tích hợp; có rồi (resume) → checkout. Không worktree. Trước khi tạo/checkout: kiểm sạch như B0.
   Ngay sau khi tạo, **trước khi sửa bất kỳ file nào**: chạy gate của workspace.md một lần → `WORK/baseline-gates.md` (đúng thư mục `WORK` của `<id>`; mỗi gate: lệnh · kết quả · tên test đỏ sẵn); `<project>`/csproj lấy theo file sẽ sửa (Change: mục Files của `PLAN`; Bug: file trong trace, không rõ → chỉ gate có lệnh cố định). Tệp đã có (resume, Bug → Change) → dùng lại.
4. big → `superpowers:subagent-driven-development`; small → `superpowers:executing-plans`; `superpowers:test-driven-development` bên trong.
   Không xoá `.superpowers/sdd/`: SDD/executing-plans tự tách ledger theo plan (`.superpowers/sdd/<id>-plan/`, marker `plan-path`). Lượt mới: chỉ xoá tệp phẳng cũ `.superpowers/sdd/progress.md` nếu có (bản superpowers cũ đọc nhầm nó).
   Sau mỗi task xong: in `Task <n>/<N> xong` và ghi đè cột `tiếp theo` của ledger = `Task <n+1>/<N> (<tên>)`.
5. `superpowers:verification-before-completion`: chạy **từng** gate của workspace.md riêng rẽ, đọc output thật, so với `WORK/baseline-gates.md`.
6. Gate xanh (theo workspace.md §3: exit 0, hoặc chỉ còn đúng các test đỏ sẵn trong baseline) → `git add -- <paths>` với paths = mục **Files** của các task (lane Bug: mục `## Files` trong `bug.md`, ghi mỗi file trước khi sửa) (file khác xuất hiện → một dòng Decisions rồi mới stage). Gate đỏ (lỗi build, hoặc test đỏ mới) → không stage, ledger `blocked (<gate> đỏ: <test>)`, vẫn sang bước 7. **Không** commit/push/PR.
7. Chế độ `workspace`: gọi Skill `vnr-swe:vnr-review` (đối số `fe` | `be` + `--base <nhánh tích hợp>` khi chỉ một repo bị đụng; không đối số khi cả hai; `--out WORK/review.md`). Dán báo cáo nguyên văn. Cwd không có `docs/review/rules/` → không gọi; ghi `review: NOT RUN — mở Claude tại gốc vnr.hrm.wiki rồi chạy /vnr-review` vào `WORK/review.md` và báo cáo cuối.
8. Ledger → `built (<nhánh>[; đỏ sẵn: <test>])` hoặc `blocked (<lý do>)`. Chép `progress.md` trong thư mục ledger SDD/executing-plans đã dùng, nếu còn (superpowers xoá nó khi review cuối sạch; lane Bug không có) vào `WORK/progress.md`.
   Kết thúc bằng ba dòng: nhánh · lệnh để SE xem diff (`git diff --cached <nhánh tích hợp>`; blocked: `git diff <nhánh tích hợp>` + `git status --short`) · "SE commit tay".

## Lane Bug — làm đúng thứ tự, không bỏ bước dù bug trông đơn giản
1. Wiki trước: mở `docs/wiki/index.md` (nếu có) và các trang trong `.claude/rules/*-wiki.md` của stack bị lỗi, **rồi** mới đọc source.
2. Viết `WORK/bug.md`: triệu chứng/trace, `## Files` dự kiến sửa, khối *Envelope* (mục `## Envelope`). Không tái hiện được → hỏi tối đa **một** câu. Từ đây không trông; mỗi quyết định ghi `## Decisions taken unattended` trong `bug.md`.
3. Nhánh `fix/<id>-<slug>` theo B3 bước 3, rồi baseline `WORK/baseline-gates.md`. **Chưa sửa file nào trước khi baseline xong** — sửa trước thì không chứng minh được "đỏ sẵn", mọi test đỏ thành đỏ mới.
4. **REQUIRED SUB-SKILL:** `superpowers:systematic-debugging` (Phase 4 = TDD: viết test tái hiện, chạy thấy đỏ, rồi mới sửa). 3 vòng sửa thất bại → `blocked`, giả thuyết ghi `## Blockers` trong `bug.md`.
5. Tiếp B3 từ bước 5. Sửa > 3 file → dừng lane Bug, ghi lý do vào `bug.md`, chuyển lane Change tại `writing-plans` với đầu vào `WORK/bug.md` (plan ghi ra `PLAN`, qua **STOP 2** như mọi plan big).

## Ghi đè mặc định của sub-skill (user > tệp này > sub-skill; không sửa tệp sub-skill)
| Sub-skill mặc định | Ở đây |
|---|---|
| brainstorming / writing-plans: lưu `docs/superpowers/…`, commit; hỏi "Subagent-Driven or Inline?" | `WORK/` (`spec.md`, `PLAN`); không commit; big/small tự quyết |
| brainstorming: trình thiết kế từng phần, hỏi duyệt từng phần | sau câu hỏi cuối viết thẳng `WORK/spec.md`; một lần duyệt = STOP 1 |
| mọi bước "commit" / "stage" (writing-plans Step 5, SDD implementer, finishing) | **không** commit, **không** stage trong task; chỉ B3 bước 6 stage sau khi gate xanh. **Không bao giờ** commit/push/PR — SE làm tay. SDD reviewer đọc `git diff -- <Files của task>` + file mới của task; review cuối đọc `git diff <nhánh tích hợp>` + `git ls-files --others --exclude-standard` |
| using-git-worktrees hỏi; "không bắt đầu trên main" | không worktree, không stash, không thư mục ngoài cwd; nhánh của bước 3 |
| SDD / executing-plans / systematic-debugging hỏi khi xung đột, BLOCKED, ≥ 3 lần sửa hỏng | plan quyết; vi phạm Envelope → `blocked`; một dòng `## Decisions taken unattended` trong `PLAN` (lane Bug: `bug.md`); tiếp task độc lập kế tiếp |
| SDD "luôn chỉ định model" | implementer: `model: haiku` chỉ khi task có code đầy đủ VÀ đụng ≤ 2 file; còn lại — kể cả mọi reviewer — **không** truyền `model` (kế thừa model phiên) |
| TDD "hỏi người" khi ngoại lệ | task chỉ có docs/prompt/config → không cần test hỏng trước; bằng chứng = dòng Expected của task |
| finishing-a-development-branch (chạy lại full suite, dừng khi đỏ; menu chọn) | không gọi: B3 bước 5 là bước kiểm duy nhất (so baseline); kết quả = giữ nguyên nhánh, staged khi gate xanh, chưa commit |

## Envelope (dán vào PLAN § Global Constraints, lane Bug: bug.md § Envelope; dòng riêng của plan thắng khối này)
Được tự quyết: tên · bố cục tệp trong các thư mục plan nêu · hình dạng test · refactor nhỏ trong tệp đã đụng · model mỗi lần dispatch (theo bảng ghi đè).
Cấm: `git commit` / `git push` / PR · worktree, `git stash` · đụng path *Risky* mà plan không nêu · xoá hay làm yếu test · chạy service đang chạy · sửa `docs/wiki/`, `docs/raw/`, `docs/review/rules/` của workspace · ghi auto-memory hay tệp ngoài `WORK/`, repo đích và `.superpowers/`.
Quy ước: theo CLAUDE.md của repo đích (và `.claude/rules/`). Mỗi quyết định không trông: một dòng (giờ · task · gì · vì sao · cách hoàn tác) trong `PLAN § Decisions taken unattended` (lane Bug: `bug.md`) — ledger SDD và auto-memory không thay được mục này.
Mọi điểm dừng của sub-skill: `blocked` + tiếp task độc lập kế tiếp. Không hỏi, không chờ.
