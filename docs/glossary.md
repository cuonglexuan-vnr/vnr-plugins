# Bảng thuật ngữ

Thuật ngữ dùng thống nhất trong mọi tài liệu, comment và mô tả của marketplace `vnr-marketplace`.
Ghi chú "giữ nguyên" = không dịch, viết đúng như cột đầu. Định danh kỹ thuật (tên tệp, lệnh, khoá cấu hình,
tên skill/agent, thông báo log) luôn giữ tiếng Anh.

| Thuật ngữ gốc | Dùng trong tài liệu | Ghi chú |
|---|---|---|
| marketplace | marketplace | giữ nguyên |
| plugin | plugin | giữ nguyên |
| skill | skill | giữ nguyên; gọi bằng lệnh `/vnr-…` |
| agent | agent | giữ nguyên |
| pipeline | pipeline | giữ nguyên |
| User Story | User Story | giữ nguyên; tệp do BA giao |
| spec / specification | đặc tả | |
| plan | kế hoạch triển khai | tệp `plan.md` |
| task | task | giữ nguyên; tệp `tasks.md` |
| testcase | testcase | giữ nguyên |
| code review | review mã | |
| architecture review | review kiến trúc | |
| security review | review bảo mật | |
| gate | cổng kiểm soát | điều kiện bắt buộc trước khi đi tiếp |
| checkpoint (HITL) | điểm dừng chờ người duyệt | pipeline dừng, người quyết định |
| wiki | wiki dự án | `docs/wiki/` của dự án cài plugin |
| registry | registry | giữ nguyên; kho artifact của VNR |
| bootstrap | bootstrap | giữ nguyên; lệnh `vnr-bootstrap` |
| scope (project / user) | phạm vi cài đặt | `project` = theo dự án, `user` = theo máy người dùng |
| template | template | giữ nguyên |
| hook | hook | giữ nguyên |
| verdict PASS / WARN / FAIL | kết quả PASS / WARN / FAIL | mã kết quả giữ nguyên |
| work folder | thư mục làm việc | `work/<PBI-id>/` ở thư mục mở Claude (gốc workspace hoặc repo): spec BA, spec, plan, progress, review của `/vnr-dev`; không commit |
| lane (Change / Bug) | lane | giữ nguyên; nhánh xử lý của `/vnr-dev`: Change = làm mới/sửa, Bug = sửa lỗi theo systematic-debugging |
| superpowers | superpowers | giữ nguyên; plugin nền (`superpowers@claude-plugins-official`) mà `/vnr-dev` điều phối |
| integration branch | nhánh tích hợp | `develop` hoặc `projects/<customer>/dev`; nhánh `<type>/<id>` cắt từ đây |
