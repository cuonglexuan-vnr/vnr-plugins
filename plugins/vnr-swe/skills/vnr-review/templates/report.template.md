Khuôn đầu ra của `CLI report` (markdown). Orchestrator dán stdout NGUYÊN VĂN vào câu trả lời cho SE, KHÔNG bọc trong code fence
(để tiêu đề, bảng, thẻ hiện đúng markdown); không chuyển bảng sang bullet, không gộp/đổi dòng, không dịch hay đổi từ, không thêm bảng hay lời bình.
Bảng chỉ có tên file; mỗi dòng bảng có một thẻ cùng số (`**#<n> · <FAIL|WARN> · <mã>**`) mang đường dẫn đầy đủ, Vấn đề, Sửa.
Dòng `VERDICT:<PASS|WARN|FAIL>` luôn là dòng cuối báo cáo (có hay không `--ci`) và được dán cùng; `--ci` có thêm `COVERAGE=` và `RULES=` sau nó.
Không `--ci`: được thêm đúng một dòng sau báo cáo (sau `VERDICT:`), cách một dòng trống:
Gõ "sửa theo báo cáo" để tôi sửa các mục FAIL (không commit).
`--ci`: không thêm gì. Mỗi ví dụ dưới đây (sau dòng `---` và nhãn in đậm) là đúng hình dạng phải hiện cho SE.

---
**Ví dụ FAIL, một repo (exit 1) — đầu ra thật, dán nguyên văn:**
## vnr-review — FAIL (1 FAIL · 2 WARN) · vnr.hrm.solution @ feat/job-relation-chart (adbec63) · 58 file (2 chưa git add) · 1m54s

| # | Kết quả | Luật | Vị trí |
|---|---|---|---|
| 1 | FAIL | DATA-20 | script_seed_p071_job_relation_chart.sql:1 |
| 2 | WARN | SLOP-11 | JobRelationChartBuilder.cs:7 (+1) |
| 3 | WARN | NAME-08 | JobRelationChartController.cs:12 |

**#1 · FAIL · DATA-20**
- Vị trí: `SQL/PostgreSQL/Migration/script_seed_p071_job_relation_chart.sql:1`
- Vấn đề: Script seed INSERT thẳng, không kiểm tra bản ghi đã có: chạy lại migration sẽ nhân đôi dữ liệu cấu hình
- Sửa: bọc mỗi INSERT bằng `WHERE NOT EXISTS` theo khoá nghiệp vụ

**#2 · WARN · SLOP-11**
- Vị trí: `Src/Modules/Hre/Vnr.Hrm.Hre.Application/JobRelationChart/JobRelationChartBuilder.cs:7` (+1)
- Vấn đề: Comment lặp lại đúng tên hàm, không nói thêm điều gì
- Sửa: xoá comment, hoặc ghi lý do thay vì mô tả

**#3 · WARN · NAME-08**
- Vị trí: `Src/Modules/Hre/Vnr.Hrm.Hre.Api/Controllers/JobRelationChartController.cs:12`
- Vấn đề: Tên action &lt;GetData> không nói dữ liệu gì
- Sửa: đổi thành `GetJobRelationChart`

**FAIL**: phải sửa trước khi push · **WARN**: nên xem; cố ý giữ thì ghi chú bỏ qua (xem user-guide)

Đã kiểm 55 luật, đủ 6/6 nhóm · 0 chỗ bỏ qua theo ghi chú · 7 file quá lớn chưa đọc hết · vnr-review 2.0.0

VERDICT:FAIL

---
**Ví dụ PASS (exit 0) — đầu ra thật, dán nguyên văn:**
## vnr-review — PASS · vnr.hrm.web @ feat/verdi-post-approve (a1b2c3d) · 12 file · 2m40s

Đã kiểm 4 luật, đủ 3/3 nhóm · 0 chỗ bỏ qua theo ghi chú · vnr-review 2.0.0

VERDICT:PASS

---
**Ví dụ chưa kiểm hết, `--ci` (verdict tối đa WARN; exit 4, stderr `Chưa kiểm hết …`) — đầu ra thật, dán nguyên văn:**
## vnr-review — WARN · vnr.hrm.api @ feat/payroll (b2c3d4e) · 5 file

⚠ Chưa kiểm hết: nhóm "Kiến trúc BE" còn 2 luật chưa xem. Gõ /vnr-review be để chạy lại.

Đã kiểm 2 luật, đủ 0/1 nhóm · 0 chỗ bỏ qua theo ghi chú · vnr-review 2.0.0

VERDICT:WARN
COVERAGE=2/4
RULES=arch-be v1

---
**Ví dụ nhiều repo (repo PASS chỉ một dòng) — đầu ra thật, dán nguyên văn:**
## vnr-review — FAIL · vnr.hrm.web FAIL (2 FAIL · 1 WARN) · vnr.hrm.api PASS · 17 file · 2m40s

### vnr.hrm.web (a1b2c3d)

| # | Kết quả | Luật | Vị trí |
|---|---|---|---|
| 1 | FAIL | NAME-20 | EN.json:6270 (+5) |
| 2 | FAIL | FW-FE-33 | property-panel.component.ts:15 |
| 3 | WARN | UIUX-28 | supertool-verdi-host-actions.ts:90 |

**#1 · FAIL · NAME-20**
- Vị trí: `apps/supertool/public/assets/i18n/EN.json:6270` (+5)
- Vấn đề: Khoá i18n đặt sai quy ước (6 khoá)
- Sửa: đổi sang dạng `verdi.widget.postApprove.hint`

**#2 · FAIL · FW-FE-33**
- Vị trí: `libs/ui-framework/src/property-panel/property-panel.component.ts:15`
- Vấn đề: Lib dùng chung import thẳng ng-zorro
- Sửa: khai ng-zorro là peer dependency của lib

**#3 · WARN · UIUX-28**
- Vị trí: `apps/supertool/src/app/core/verdi-widget/supertool-verdi-host-actions.ts:90`
- Vấn đề: Chọn nhiều trang rồi bấm hàng loạt chỉ xử lý trang đang xem
- Sửa: gửi danh sách khoá đã chọn

**FAIL**: phải sửa trước khi push · **WARN**: nên xem; cố ý giữ thì ghi chú bỏ qua (xem user-guide)

Đã kiểm 4 luật, đủ 3/3 nhóm · 1 chỗ bỏ qua theo ghi chú · vnr-review 2.0.0

### vnr.hrm.api — PASS · đã kiểm 4 luật

VERDICT:FAIL
