# Workflow: ba-us — Tạo User Story theo chuẩn BA

## Mục tiêu

Tạo một User Story (US) hoàn chỉnh theo chuẩn nghiệp vụ từ Actor-Task Matrix của FEAT cha. US phải đạt tiêu chuẩn **100% nghiệp vụ, ZERO kỹ thuật**: không chứa bất kỳ từ ngữ kỹ thuật nào (API, endpoint, database, table, column, component, interface, DTO, command, query, handler, v.v.).

---

## Nguyên tắc kiến trúc Step-File

- **NEVER load nhiều step cùng lúc.** Đọc và thực thi xong từng step rồi mới đọc step tiếp theo.
- **ALWAYS đọc toàn bộ nội dung step file** trước khi bắt đầu thực thi step đó.
- **Không được skip bất kỳ step nào.** Thứ tự step là bắt buộc.
- **Dừng và hỏi BA** nếu thiếu thông tin cốt lõi tại bất kỳ step nào trước khi tiếp tục.
- **Output của mỗi step** phải được BA xác nhận (hoặc chỉnh sửa) trước khi qua step tiếp theo.

---

## Đầu vào yêu cầu

Khi nhận trigger "ba us", "tạo user story" hoặc "viết us [tên]", kiểm tra xem BA đã cung cấp chưa:

1. **FEAT ID** hoặc đường dẫn FEAT cha (ví dụ: `ATT-E02-F01` hoặc `Module/ATT/Epics/ATT-E02_.../Features/ATT-E02-F01_.../FEAT.md`)
2. **Actor-Task cụ thể** muốn viết US (ví dụ: "HR Admin — Tạo ca làm việc")

Nếu chưa có, hỏi BA:
```
Để tạo User Story, tôi cần biết:
1. FEAT ID (ví dụ: ATT-E02-F01) hoặc đường dẫn đến file FEAT cha?
2. Actor và Task cụ thể muốn viết US trong Actor-Task Matrix?
```

---

## Cấu trúc 7 Steps

| Step | File | Nội dung |
|------|------|----------|
| 1 | `steps/step-01-load-context.md` | Load & validate toàn bộ context từ FEAT + EPIC + _product/ |
| 2 | `steps/step-02-write-statement.md` | Viết US Statement (Là / Tôi muốn / Để) + Out of Scope |
| 3 | `steps/step-03-write-ac.md` | Viết Acceptance Criteria (Given/When/Then) |
| 4 | `steps/step-04-draw-activity-diagram.md` | Vẽ Activity Diagram (Mermaid flowchart TD) |
| 5 | `steps/step-05-write-data-business-rules.md` | Data Dictionary + Business Rules (BR-U) |
| 6 | `steps/step-06-write-uiux-tracking.md` | UI/UX Mô tả + Tracking & Analytics |
| 7 | `steps/step-07-finalize.md` | Tạo file US + cập nhật FEAT.md |

---

## Khởi động

```
LOAD steps/step-01-load-context.md
EXECUTE step 1 đầy đủ
AWAIT BA confirmation
→ LOAD steps/step-02-write-statement.md
...
```

**Bắt đầu bằng cách đọc `./steps/step-01-load-context.md`.**
