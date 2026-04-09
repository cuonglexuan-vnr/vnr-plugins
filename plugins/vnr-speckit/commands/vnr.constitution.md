---
description: Tạo mới hoặc cập nhật Vnr constitution từ các tiêu chuẩn Vnr và giữ đồng bộ với các command phụ thuộc.
handoffs:
  - label: Build Specification
    agent: vnr.specify
    prompt: Tạo đặc tả tính năng dựa trên Vnr constitution đã được cập nhật. Tôi muốn xây dựng...
---

## User Input

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét input của người dùng trước khi tiếp tục (nếu không rỗng).

## Outline

Bạn đang cập nhật project constitution tại `.vnr-speckit/memory/constitution.md`.

File này là nguồn sự thật trung tâm cho các quy tắc kỹ thuật của Vnr và sẽ được các command phía sau sử dụng.
Nhiệm vụ của bạn là:
1. đọc các tài liệu standards của Vnr,
2. tạo mới hoặc cập nhật constitution,
3. tăng version đúng quy tắc,
4. và kiểm tra tính đồng bộ của các command phía sau.

Thực hiện theo luồng sau:

1. Tải constitution hiện tại tại `.vnr-speckit/memory/constitution.md`.
   - Nếu chưa tồn tại, tạo mới từ đầu.

2. Tải và sử dụng các standards sau làm nguồn đầu vào chính:
   - `.vnr-speckit/standards/01-tech-stack.md`
   - `.vnr-speckit/standards/02-architecture-and-structure.md`
   - `.vnr-speckit/standards/03-data-and-auth.md`
   - `.vnr-speckit/standards/04-internal-be-framework-and-flow.md`
   - `.vnr-speckit/standards/05-internal-fe-framework-and-flow.md`
   - `.vnr-speckit/standards/06-team-principles-and-conventions.md`

3. Thu thập / suy ra nội dung constitution:
   - Nếu người dùng có cung cấp input rõ ràng, ưu tiên dùng input đó.
   - Nếu không, suy ra từ các file standards.
   - Giữ lại nội dung constitution cũ nếu vẫn còn phù hợp.
   - Nếu thiếu, không đọc được, hoặc file standards rỗng, dừng lại và báo đúng tên file.

4. Soạn hoặc cập nhật `.vnr-speckit/memory/constitution.md`:
   - Quy tắc phải ngắn gọn, rõ ràng, có thể kiểm chứng.
   - Dùng **MUST** cho các quy định bắt buộc.
   - Chỉ dùng **SHOULD** khi có thể chấp nhận ngoại lệ.
   - Tối thiểu phải có:
     - tiêu đề
     - metadata
     - core principles
     - workflow rules
     - governance

5. Quy tắc version:
   - `CONSTITUTION_VERSION` phải theo semantic versioning:
     - **MAJOR**: thay đổi phá vỡ quy tắc cũ hoặc thay đổi lớn về governance / principles
     - **MINOR**: thêm principle mới hoặc mở rộng đáng kể quy định hiện có
     - **PATCH**: chỉnh câu chữ, làm rõ nội dung, sửa định dạng, thay đổi không ảnh hưởng nghĩa
   - `RATIFIED_DATE` là ngày thông qua ban đầu
   - `LAST_AMENDED_DATE` là ngày hôm nay nếu có thay đổi, nếu không thì giữ nguyên
   - Nếu không biết ngày thông qua ban đầu, ghi:
     - `TODO(RATIFIED_DATE): chưa xác định ngày thông qua ban đầu`

6. Rà soát các file downstream để đảm bảo đồng bộ:
   - `.vnr-speckit/commands/vnr.specify.md`
   - `.vnr-speckit/commands/vnr.plan.md`
   - `.vnr-speckit/commands/vnr.tasks.md`
   - `.vnr-speckit/commands/vnr.implement.md`
   - `.vnr-speckit/commands/vnr.clarify.md`
   - `.vnr-speckit/commands/vnr.analyze.md`
   - `.vnr-speckit/commands/vnr.checklist.md`
   - `.vnr-speckit/skills/vnr-context-retrieval.md`
   - `.vnr-speckit/hooks/pre-flight-check.md`

7. Thêm một Sync Impact Report ngắn dưới dạng HTML comment ở đầu file constitution:

   ```md
   <!--
   Sync Impact Report
   - Version change: OLD -> NEW
   - Modified sections:
     - ...
   - Added sections:
     - ...
   - Removed sections:
     - ...
   - Downstream files reviewed:
     - [status] .vnr-speckit/commands/vnr.specify.md
     - [status] .vnr-speckit/commands/vnr.plan.md
     - [status] .vnr-speckit/commands/vnr.tasks.md
     - [status] .vnr-speckit/commands/vnr.implement.md
     - [status] .vnr-speckit/commands/vnr.clarify.md
     - [status] .vnr-speckit/commands/vnr.analyze.md
     - [status] .vnr-speckit/commands/vnr.checklist.md
     - [status] .vnr-speckit/skills/vnr-context-retrieval.md
     - [status] .vnr-speckit/hooks/pre-flight-check.md
   - Follow-up TODOs:
     - ...
   -->
   ```

   Dùng các trạng thái sau:
   - `✅ updated`
   - `✅ reviewed-no-change`
   - `⚠ pending-manual-update`
   - `❌ conflict-found`

8. Kiểm tra trước khi ghi file cuối cùng:
   - không còn placeholder chưa được thay
   - version khớp với sync report
   - ngày theo định dạng `YYYY-MM-DD`
   - các principle phải rõ ràng và kiểm chứng được
   - không thêm nội dung chung chung không có trong standards của Vnr

9. Ghi đè kết quả vào:
   - `.vnr-speckit/memory/constitution.md`

10. Sau khi hoàn tất, trả lời người dùng với phần tóm tắt:
   - version mới và lý do tăng version
   - các section đã thay đổi
   - file nào cần cập nhật thủ công
   - command gợi ý tiếp theo: `/vnr.specify`
   - commit message gợi ý

## Formatting & Style Requirements

- Giữ constitution ngắn gọn, rõ nghĩa, có thể thực thi.
- Dùng Markdown heading nhất quán.
- Tránh câu chữ mơ hồ.
- Không tự bịa policy nếu không có trong standards hoặc user input.
- Nếu thiếu thông tin, dùng `TODO(...)` thay vì đoán.

## Important Failure Conditions

Dừng lại và hỏi lại nếu:
- thiếu hoặc không đọc được file standards bắt buộc
- các file standards mâu thuẫn đáng kể với nhau
- user input mâu thuẫn với standards nhưng không nói rõ là đang sửa standards
- lịch sử governance quá thiếu và không thể suy ra an toàn