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

## Hành động 2: Trình bày Statement cho BA review

Hiển thị bản nháp Statement và hỏi BA:

```
--- NHÁP US STATEMENT ---

Là [role],
tôi muốn [hành động],
để [business value].

Trace: FAC-001, FAC-002 (từ [FEAT-ID])

BA có muốn chỉnh sửa không? (yes/no)
Nếu yes: BA sửa phần nào?
```

Điều chỉnh theo góp ý của BA cho đến khi BA approve.

---

## Hành động 3: Xác định Out of Scope

Sau khi Statement được approve, hỏi BA về những gì KHÔNG nằm trong US này:

```
Để tránh scope creep, tôi cần biết những gì KHÔNG thuộc US này:

Gợi ý Out of Scope dựa trên context (BA xác nhận hoặc bổ sung):
- [Dựa trên Actor-Task Matrix, các task khác của cùng FEAT không thuộc row này]
- [Dựa trên BR-F, các ràng buộc thuộc US khác]
- [Dựa trên FAC, các tiêu chí thuộc FEAT khác]

BA bổ sung Out of Scope nào thêm không?
```

Gợi ý Out of Scope thông minh dựa trên:
- Các task khác trong Actor-Task Matrix của FEAT (row khác)
- Các hành động liên quan nhưng thuộc actor khác (ví dụ: phê duyệt là US riêng)
- Các tính năng "nice to have" thường bị gộp nhầm
- Các tính năng nằm ở FEAT khác hoặc EPIC khác

---

## Hành động 4: Xác định Segments áp dụng

Dựa trên Segment Profiles đã đọc ở Step 01, hỏi BA:

```
US này áp dụng cho những segment nhân sự nào?

Segments có trong dự án:
[ ] [Tên Segment 1] — [Đặc điểm chính]
[ ] [Tên Segment 2] — [Đặc điểm chính]
[ ] Tất cả segments

Lưu ý: Nếu US áp dụng khác nhau cho từng segment, tôi sẽ ghi chú đặc thù trong AC.
```

**Nếu không có Segment Profiles:** Bỏ qua bước này, ghi "Áp dụng toàn bộ nhân sự".

---

## Kết quả đầu ra Step 02

Sau khi BA xác nhận tất cả, tổng hợp:

```
╔══ STATEMENT ĐÃ DUYỆT ════════════════════════════════╗
║
║ Là [SELECTED_ACTOR],
║ tôi muốn [hành động đã duyệt],
║ để [business value đã duyệt].
║
║ Trace FAC: FAC-001, FAC-002
║ Segments áp dụng: [danh sách segments]
║
║ Out of Scope:
║ - [item 1]
║ - [item 2]
╚═══════════════════════════════════════════════════════╝
```

---

## Chuyển sang Step tiếp theo

Đọc và thực thi: `./steps/step-03-write-ac.md`
