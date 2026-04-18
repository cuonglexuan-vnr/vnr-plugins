---
name: vnr-ba-us-refine
description: 'Làm sâu thêm US khi BA cảm thấy còn thiếu — thêm AC edge case, làm rõ BR, bổ sung Data Dictionary. Trigger: "ba us refine", "làm sâu us", "bổ sung us [id]"'
---

# Workflow: ba-us-refine

## Mục tiêu

Làm phong phú thêm US đã có mà không phá vỡ cấu trúc hiện tại. Dùng khi BA cảm thấy US còn nông hoặc khi ba-us-check báo thiếu.

---

## Đầu vào

Nhận US ID + lý do cần refine (nếu có). Hỏi nếu chưa rõ:
```
US nào cần refine? (ID hoặc đường dẫn)
Bạn muốn bổ sung phần nào: AC / BR / Data Dictionary / UI / Activity Diagram?
Hay để tôi đề xuất?
```

---

## Hành động: Phân tích và đề xuất

Đọc US hiện tại + FEAT cha. Phân tích 5 nhóm:

1. **AC gap:** Có AC nào cho edge case chưa cover không?
2. **BR gap:** Có ràng buộc nào trong AC nhưng chưa có BR-U không?
3. **Data gap:** Có trường dữ liệu nào được đề cập trong AC nhưng thiếu trong Data Dictionary không?
4. **Activity Diagram:** Có nhánh edge case nào chưa vẽ không?
5. **UI/UX gap:** Xem mục dưới.

### Phân tích UI/UX gap

Đọc Section "UI/UX Mô tả" của US. Kiểm tra:

**5a. Screen Inventory:**
- Có màn hình nào trong AC "Given" (người dùng đang ở màn hình X) nhưng chưa được mô tả?
- Có dialog/hộp thoại nào được nhắc đến nhưng chưa có trong danh sách màn hình?

**5b. State Coverage:**
- Mỗi màn hình đã có đủ trạng thái chưa? Kiểm tra từng màn hình:
  - Loading state: Khi dữ liệu đang tải
  - Empty state: Khi chưa có dữ liệu + thông điệp gợi ý hành động
  - Error state: Khi hệ thống lỗi + nút thử lại
  - Success state: Sau thao tác thành công

**5c. Thông báo / Phản hồi:**
- Mỗi AC "Then" có thông báo/phản hồi UI cụ thể chưa?
- Các thông báo lỗi có nội dung cụ thể (không phải chung chung "Đã xảy ra lỗi") chưa?

**5d. Navigation Flow:**
- Có phần "Luồng điều hướng" mô tả chuyển màn hình chưa?
- Mọi nút "Hủy" / "Quay lại" đều rõ điểm đến chưa?

**5e. Wireframe (nếu có):**
- Nếu wireframe được cung cấp: có màn hình/trạng thái nào trong wireframe chưa được mô tả?
- Các tham chiếu "Tham chiếu wireframe: [Frame #X]" đã điền đầy đủ chưa?

Trình BA:
```
Phân tích US [{US-ID}], tôi thấy có thể bổ sung:

1. AC còn thiếu:
   - [Ví dụ: AC edge case "NV điều chuyển giữa kỳ" — chưa có]

2. BR còn thiếu:
   - [Ví dụ: Không có BR về thứ tự phê duyệt khi nhiều cấp]

3. Data Dictionary:
   - [Ví dụ: Trường "Lý do hủy" nhắc ở AC-003 nhưng chưa trong bảng]

4. UI/UX:
   - [5b] Màn hình "Biểu mẫu" thiếu trạng thái Loading và Error
   - [5c] AC-004 (Then) chỉ nói "lưu thành công" — chưa có nội dung thông báo cụ thể
   - [5d] Chưa có phần "Luồng điều hướng" mô tả sau khi Hủy đi về đâu

Bạn muốn bổ sung những gì?
```

---

## Hành động: Bổ sung và cập nhật file

Sau khi BA xác nhận, cập nhật US file:
- Thêm AC mới vào Section 2
- Thêm BR-U mới vào Section 5
- Thêm trường vào Data Dictionary (Section 4)
- Cập nhật Activity Diagram nếu có nhánh mới
- **UI/UX:** Thêm trạng thái màn hình còn thiếu (loading/empty/error) vào Section 6
- **UI/UX:** Thêm phần "Luồng điều hướng" nếu chưa có
- **UI/UX:** Cập nhật nội dung thông báo thành cụ thể nếu đang còn chung chung
- **UI/UX:** Gắn tham chiếu wireframe nếu BA cung cấp link/path mới
- Cập nhật `last_updated` trong frontmatter

Thông báo:
```
✅ Đã refine US [{US-ID}]:
   + {N} AC mới
   + {N} BR-U mới
   + {N} trường Data Dictionary bổ sung
   + UI/UX: {Mô tả ngắn những gì đã bổ sung — ví dụ: "thêm 3 trạng thái màn hình, thêm luồng điều hướng"}

Gợi ý: Chạy /ba-us-check để verify lại.
```
