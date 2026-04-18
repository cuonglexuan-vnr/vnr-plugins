# Step 02 — Viết User Story Statement

## Mục tiêu

Viết phần mở đầu của User Story gồm: Statement, phạm vi Out of Scope, và xác định segments áp dụng. Toàn bộ nội dung phải bằng ngôn ngữ nghiệp vụ thuần túy — không có bất kỳ từ kỹ thuật nào.

---

## Nhắc lại context từ Step 01

Sử dụng thông tin đã load:
- `SELECTED_ACTOR`: vai trò người dùng
- `SELECTED_TASK`: hành động cụ thể cần thực hiện
- `LINKED_FAC`: các FAC của FEAT cha liên quan
- Segments có thể áp dụng

---

## Hành động 1: Soạn thảo US Statement

### Format bắt buộc (KHÔNG được thay đổi cấu trúc này):

```
Là [role nghiệp vụ cụ thể],
tôi muốn [hành động cụ thể, rõ ràng — bắt đầu bằng động từ],
để [business value đo lường được hoặc mục đích nghiệp vụ rõ ràng].
```

### Quy tắc viết Statement:

**[role]** phải là:
- Tên vai trò nghiệp vụ cụ thể (HR Admin, Quản lý trực tiếp, Nhân viên, Kế toán trưởng, v.v.)
- KHÔNG dùng tên vai trò kỹ thuật (Admin, User, System, v.v.)
- Khớp với `SELECTED_ACTOR` từ Actor-Task Matrix

**[hành động]** phải:
- Bắt đầu bằng động từ hành động (thiết lập, xem, đăng ký, phê duyệt, tạo mới, chỉnh sửa, v.v.)
- Mô tả một hành động đơn, không gộp nhiều hành động
- Cụ thể đủ để phân biệt với các US khác trong cùng FEAT
- KHÔNG dùng: API, màn hình, nút bấm, component, v.v.

**[business value]** phải:
- Mô tả lợi ích nghiệp vụ đo lường được (giảm X%, đảm bảo Y, tránh Z)
- Trả lời câu hỏi "Tại sao hành động này quan trọng với tổ chức?"
- KHÔNG dùng: "để hệ thống lưu lại", "để database cập nhật", v.v.

### Ví dụ đúng:
```
Là Quản trị viên Nhân sự,
tôi muốn thiết lập kỳ công hàng năm với ngày bắt đầu linh hoạt (có thể lệch từ đầu tháng),
để toàn bộ quá trình tổng hợp công và tính lương phản ánh đúng lịch làm việc thực tế của doanh nghiệp.
```

### Ví dụ sai (có từ kỹ thuật):
```
❌ "Là User, tôi muốn POST request tạo kỳ công, để database lưu record mới."
❌ "Là Admin, tôi muốn bấm nút Submit trong component PayPeriodForm..."
```

---

## Hành động 2: Soạn và hiển thị Statement

Tự động soạn US Statement dựa trên context đã load. Hiển thị cho BA xem:

```
✓ US STATEMENT

Là [role],
tôi muốn [hành động],
để [business value].

Trace: FAC-001, FAC-002 (từ [FEAT-ID])
```

**Lưu ý:** Statement được tự động tạo. BA có thể yêu cầu chỉnh sửa bất kỳ lúc nào trong quá trình viết US.

---

## Hành động 3: Tự động xác định Out of Scope

Tự động gợi ý những gì KHÔNG nằm trong US này dựa trên context. Hiển thị cho BA xem:

```
✓ OUT OF SCOPE

Dựa trên Actor-Task Matrix và FAC, những nội dung sau KHÔNG thuộc US này:
- [Các task khác của cùng FEAT không thuộc row này]
- [Các ràng buộc thuộc US khác dựa trên BR-F]
- [Các tiêu chí thuộc FEAT khác dựa trên FAC]
```

**Logic gợi ý Out of Scope:**
- Các task khác trong Actor-Task Matrix của FEAT (row khác)
- Các hành động liên quan nhưng thuộc actor khác (ví dụ: phê duyệt là US riêng)
- Các tính năng "nice to have" thường bị gộp nhầm
- Các tính năng nằm ở FEAT khác hoặc EPIC khác

**Lưu ý:** BA có thể bổ sung hoặc chỉnh sửa Out of Scope sau khi xem toàn bộ US.

---

## Hành động 4: Tự động xác định Segments áp dụng

Dựa trên Segment Profiles đã đọc ở Step 01, tự động xác định segments áp dụng. Hiển thị:

```
✓ SEGMENTS ÁP DỤNG

US này áp dụng cho:
- [Tên Segment 1] — [Đặc điểm chính]
- [Tên Segment 2] — [Đặc điểm chính]

Hoặc: "Áp dụng cho tất cả segments"
```

**Logic xác định:**
- Nếu task/hành động chỉ liên quan đến segment cụ thể → ghi rõ segments đó
- Nếu task/hành động áp dụng cho toàn bộ nhân sự → ghi "Tất cả segments"
- Nếu US áp dụng khác nhau cho từng segment → ghi chú đặc thù trong AC (Step 03)

**Nếu không có Segment Profiles:** Ghi "Áp dụng toàn bộ nhân sự".

---

## Kết quả đầu ra Step 02

Hiển thị tóm tắt các thông tin đã tạo cho BA xem:

```
════════════════════════════════════════════════════════════
✓ HOÀN THÀNH STEP 02 — US STATEMENT

📝 Statement:
   Là [SELECTED_ACTOR],
   tôi muốn [hành động đã tạo],
   để [business value đã tạo].

🔗 Trace FAC: FAC-001, FAC-002
👥 Segments áp dụng: [danh sách segments]

🚫 Out of Scope:
   - [item 1]
   - [item 2]
════════════════════════════════════════════════════════════
```

**Tự động chuyển sang Step 02b** — đọc và thực thi: `./steps/step-02b-write-business-context.md`
