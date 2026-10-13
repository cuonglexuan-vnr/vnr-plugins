# vnr-sa — Bộ công cụ cho Solution Architect

Plugin Claude Code cho vai trò Solution Architect, phân phối qua marketplace `vnr-marketplace`.

## Skills

| Skill | Mục đích |
|---|---|
| `/vnr-md2docx` | Xuất tài liệu Markdown (playbook VNR) ra Word `.docx` theo template thương hiệu: trang bìa, lịch sử cập nhật/phê duyệt, mục lục, đánh số heading, bảng có caption, header/footer. |
| `/vnr-tfs` | Tạo / xem / đồng bộ PBI và Task trên TFS từ mô tả ngắn, theo `config.yml` và template HTML. Luôn xem trước nội dung rồi mới ghi. |

## Cài đặt

Trong repo Deliverables (phạm vi cài đặt `project`):

```bash
npx github:cuonglexuan-vnr/vnr-plugins init vnr-sa
```

Hoặc từ một bản checkout của marketplace:

```bash
claude plugin marketplace add <đường-dẫn-repo-marketplace>
claude plugin install vnr-sa
```

## Yêu cầu

- Python 3 và `python-docx` (`pip install python-docx`; wrapper của `/vnr-md2docx` tự cài nếu thiếu).
- Chạy trong repo Deliverables — `/vnr-md2docx` dùng template Word trong `templates/word/` của repo đó.
- `/vnr-tfs` cần MCP `tfs` đã cấu hình (PAT, organization, project).
