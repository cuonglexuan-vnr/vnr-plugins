---
description: Xác định các điểm còn thiếu rõ ràng trong feature spec hiện tại bằng cách hỏi tối đa 5 câu hỏi trọng tâm và ghi câu trả lời ngược lại vào spec.
handoffs:
  - label: Build Technical Plan
    agent: vnr.plan
    prompt: Tạo technical plan dựa trên spec đã được làm rõ. Tôi đang build với...
---

## User Input

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét input của người dùng trước khi tiếp tục (nếu không rỗng).

## Outline

Mục tiêu: Phát hiện và giảm mơ hồ hoặc các quyết định còn thiếu trong feature specification hiện tại, sau đó ghi trực tiếp các làm rõ đó vào file spec.

Lưu ý: Workflow làm rõ này được kỳ vọng chạy (và hoàn tất) TRƯỚC khi gọi `/vnr.plan`. Nếu người dùng nói rõ là muốn bỏ qua bước clarify (ví dụ exploratory spike), bạn có thể tiếp tục nhưng phải cảnh báo rằng rủi ro rework ở các bước sau sẽ tăng lên.

Execution steps:

1. Xác định feature hiện tại và kiểm tra các file đầu vào tối thiểu:
   - `spec.md`
   - `plan.md` (nếu có)
   - `tasks.md` (nếu có)
   - `constitution.md` (nếu có)
   - Nếu `spec.md` không tồn tại, dừng lại và yêu cầu người dùng chạy `/vnr.specify` trước.
   - Nếu repo có cơ chế pre-flight/prerequisite check thì chỉ chạy **một lần** để lấy đường dẫn file cần thiết.

2. Tải file spec hiện tại. Thực hiện quét có cấu trúc để phát hiện mơ hồ và thiếu coverage theo taxonomy sau. Với mỗi nhóm, đánh dấu trạng thái: `Clear / Partial / Missing`. Tạo coverage map nội bộ để ưu tiên câu hỏi (không xuất raw map trừ khi không cần hỏi gì).

   Functional Scope & Behavior:
   - Mục tiêu người dùng cốt lõi và success criteria
   - Phạm vi ngoài scope đã được nêu rõ chưa
   - Vai trò/người dùng khác nhau

   Domain & Data Model:
   - Entity, attribute, relationship
   - Quy tắc identity/uniqueness
   - State/lifecycle
   - Giả định về khối lượng dữ liệu

   Interaction & UX Flow:
   - Luồng người dùng quan trọng
   - Empty/error/loading states
   - Ghi chú accessibility/localization nếu có

   Non-Functional Quality Attributes:
   - Performance
   - Scalability
   - Reliability/availability
   - Observability
   - Security & privacy
   - Compliance/regulatory constraints nếu có

   Integration & External Dependencies:
   - External service/API và failure modes
   - Import/export format
   - Versioning/protocol assumptions

   Edge Cases & Failure Handling:
   - Negative scenarios
   - Rate limiting/throttling
   - Concurrent/conflict scenarios

   Constraints & Tradeoffs:
   - Technical constraints
   - Tradeoffs hoặc rejected alternatives

   Terminology & Consistency:
   - Canonical terms
   - Synonym/deprecated terms cần tránh

   Completion Signals:
   - Acceptance criteria có testable không
   - Definition-of-done style measurable outcomes

   Misc / Placeholders:
   - `TODO`, `TBD`, `TKTK`, `???`, placeholder chưa giải quyết
   - Tính từ mơ hồ như "nhanh", "ổn định", "thân thiện", "bảo mật"

   Vnr-Specific Clarification Triggers:
   - Stored Procedures cụ thể đã được xác định chưa
   - Có cần thêm bảng/quy tắc data permission mới không
   - UI này dùng NG-Zorro, Kendo, hay custom component theo chuẩn hiện có
   - Boundary giữa Angular 18 và phần legacy/web hiện có đã rõ chưa
   - Data flow có tuân thủ DB-First không
   - Auth/AuthZ flow có khớp với chuẩn nội bộ không

   Với mỗi nhóm có trạng thái `Partial` hoặc `Missing`, tạo candidate question trừ khi:
   - Việc làm rõ đó không ảnh hưởng đáng kể tới implement/validation
   - Hoặc phù hợp hơn để defer sang bước planning

3. Tạo hàng đợi nội bộ các câu hỏi làm rõ theo mức ưu tiên (tối đa 5). **Không** xuất toàn bộ một lúc. Áp dụng các ràng buộc:
   - Tối đa 5 câu cho toàn bộ session.
   - Mỗi câu phải trả lời được bằng:
     - Một lựa chọn multiple-choice ngắn (2-5 options loại trừ nhau), hoặc
     - Một câu trả lời ngắn `<=5 từ`.
   - Chỉ hỏi những câu mà câu trả lời ảnh hưởng thực sự đến:
     - architecture
     - data modeling
     - task decomposition
     - test design
     - UX behavior
     - operational readiness
     - compliance/security validation
   - Ưu tiên các câu giúp giảm rework downstream hoặc tránh acceptance test bị lệch.
   - Không hỏi lại điều đã có trong spec hoặc user input.
   - Tránh hỏi sở thích thuần style.
   - Nếu còn quá 5 điểm chưa rõ, chọn top 5 theo heuristic `(Impact * Uncertainty)`.

4. Vòng lặp hỏi tuần tự (interactive):
   - Chỉ hỏi **CHÍNH XÁC MỘT** câu tại một thời điểm.
   - Với câu hỏi multiple-choice:
     - Phân tích tất cả lựa chọn và xác định lựa chọn phù hợp nhất dựa trên:
       - best practices
       - pattern phổ biến cho loại bài toán đó
       - giảm rủi ro về security/performance/maintainability
       - phù hợp với ràng buộc hiện có trong spec và chuẩn Vnr
     - Đưa ra lựa chọn khuyến nghị nổi bật ở đầu:
       - `**Khuyến nghị:** Option [X] - <lý do ngắn>`
     - Sau đó render bảng:

       | Option | Description |
       |--------|-------------|
       | A | <Mô tả option A> |
       | B | <Mô tả option B> |
       | C | <Mô tả option C> |
       | Short | Trả lời ngắn khác (<=5 từ) |

     - Sau bảng, thêm:
       - `Bạn có thể trả lời bằng ký tự option (ví dụ "A"), chấp nhận khuyến nghị bằng "yes" / "recommended", hoặc đưa ra câu trả lời ngắn của riêng bạn.`

   - Với câu trả lời ngắn:
     - Đưa ra gợi ý:
       - `**Gợi ý:** <câu trả lời đề xuất> - <lý do ngắn>`
     - Sau đó output:
       - `Format: Câu trả lời ngắn (<=5 từ). Bạn có thể chấp nhận gợi ý bằng "yes" / "suggested", hoặc cung cấp câu trả lời của riêng bạn.`

   - Sau khi user trả lời:
     - Nếu user trả lời `"yes"`, `"recommended"` hoặc `"suggested"` thì dùng chính recommendation/suggestion đã nêu.
     - Nếu không, validate xem câu trả lời có map được về option hoặc có nằm trong giới hạn `<=5 từ` không.
     - Nếu mơ hồ, hỏi lại để disambiguate; vẫn tính là cùng một câu, không tăng quota.
     - Khi đã hợp lệ, ghi vào working memory và chuyển sang câu tiếp theo.

   - Dừng hỏi khi:
     - Tất cả ambiguity quan trọng đã được giải quyết sớm, hoặc
     - User nói `"done"`, `"good"`, `"no more"`, `"stop"`, `"proceed"`, hoặc
     - Đã đạt 5 câu.

   - Không được lộ trước các câu hỏi còn lại trong queue.
   - Nếu ngay từ đầu không có câu hỏi nào đủ giá trị, báo ngay là không có ambiguity quan trọng.

5. Tích hợp sau MỖI câu trả lời đã được chấp nhận:
   - Giữ một bản in-memory của spec và raw file content.
   - Với câu trả lời đầu tiên trong session:
     - Đảm bảo có section `## Clarifications`
     - Nếu chưa có, tạo `## Clarifications` ngay sau section context/overview cấp cao nhất phù hợp
     - Bên dưới tạo `### Session YYYY-MM-DD` cho ngày hiện tại nếu chưa có
   - Append một bullet:
     - `- Q: <question> → A: <final answer>`
   - Sau đó cập nhật ngay section phù hợp nhất:
     - Functional ambiguity → cập nhật Functional Requirements
     - Role/actor distinction → cập nhật User Stories / Actors
     - Data shape/entity/SP/permission table → cập nhật Data Model hoặc Technical Constraints
     - Non-functional clarification → cập nhật Success Criteria bằng tiêu chí đo được
     - Edge case/negative flow → cập nhật Edge Cases / Error Handling
     - Terminology conflict → chuẩn hóa thuật ngữ trong spec
     - UI library / Angular boundary → cập nhật Architecture Notes hoặc Frontend Constraints
     - DB-First / auth flow → cập nhật Constraints / Data & Auth notes
   - Nếu clarification làm vô hiệu nội dung cũ, thay nội dung cũ thay vì để song song mâu thuẫn.
   - Lưu lại file spec sau mỗi lần tích hợp.
   - Giữ format hiện có, không reorder các section không liên quan.
   - Nội dung chèn vào phải ngắn gọn, testable, không drift sang plan implementation.

6. Validation sau MỖI lần ghi và ở cuối:
   - Session clarifications có đúng một bullet cho mỗi câu đã chấp nhận.
   - Tổng số câu hỏi đã hỏi và chấp nhận `<= 5`.
   - Các điểm vừa làm rõ không còn placeholder/vagueness tương ứng.
   - Không còn statement cũ mâu thuẫn với câu trả lời mới.
   - Markdown hợp lệ; heading mới được phép thêm chỉ gồm:
     - `## Clarifications`
     - `### Session YYYY-MM-DD`
   - Thuật ngữ nhất quán trên toàn spec.

7. Ghi file spec đã cập nhật trở lại `spec.md`.

8. Báo cáo hoàn tất:
   - Số câu đã hỏi và được trả lời
   - Đường dẫn file spec đã cập nhật
   - Các section đã được chạm tới
   - Bảng coverage summary cho từng taxonomy category với trạng thái:
     - `Resolved`
     - `Deferred`
     - `Clear`
     - `Outstanding`
   - Nếu còn `Outstanding` hoặc `Deferred`, khuyến nghị nên tiếp tục `/vnr.plan` hay nên chạy `/vnr.clarify` lại sau.
   - Gợi ý command tiếp theo.

Behavior rules:

- Nếu không có ambiguity nào đủ quan trọng để hỏi, trả lời:
  - `Không phát hiện ambiguity quan trọng nào cần formal clarification.`
  - Sau đó gợi ý tiếp tục sang `/vnr.plan`.
- Nếu thiếu `spec.md`, yêu cầu user chạy `/vnr.specify` trước.
- Không bao giờ vượt quá 5 câu hỏi.
- Tránh hỏi các câu thuần tech-stack preference nếu không chặn functional clarity.
- Luôn tôn trọng tín hiệu dừng sớm từ user.
- Nếu không cần hỏi câu nào vì spec đã đủ rõ, xuất coverage summary ngắn gọn rồi đề nghị đi tiếp.
- Nếu đạt quota mà vẫn còn ambiguity impact cao, liệt kê chúng dưới `Deferred` kèm lý do.

Context for prioritization: $ARGUMENTS