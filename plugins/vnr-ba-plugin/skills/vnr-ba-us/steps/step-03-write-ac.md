# Step 03 — Viết Acceptance Criteria (AC)

## Mục tiêu

Viết toàn bộ Acceptance Criteria theo format Given/When/Then. Mỗi AC phải trace về FAC của FEAT cha. Phải cover happy path, sad path, và tất cả edge cases liên quan đã phát hiện ở Step 01.

---

## Nguyên tắc bắt buộc

1. **Format bắt buộc:** Every AC phải theo cấu trúc Given/When/Then — không có ngoại lệ.
2. **Trace bắt buộc:** Mỗi AC phải có dòng `Trace: FAC-00X` chỉ rõ AC này xuất phát từ FAC nào của FEAT cha.
3. **Số lượng tối thiểu:** Tối thiểu 3 AC scenarios — thực tế thường cần 5-8 scenarios để cover đủ.
4. **Không kỹ thuật:** Không có từ nào về API, HTTP, database, response code, component, v.v.
5. **Ngôn ngữ cụ thể:** "Hệ thống hiển thị..." / "Người dùng thấy..." / "Hệ thống không cho phép..." — tránh ngôn ngữ mơ hồ.

---

## Hành động 1: Rà soát Edge Cases trước khi viết

Lấy danh sách EC đã detect ở Step 01. Với từng EC, hỏi BA một câu:

```
[EC-001]: Nhân viên điều chuyển giữa kỳ (mid-period transfer)
→ EC này có ảnh hưởng đến US "[tên US]" không?
  (a) Có — tôi sẽ thêm AC cho trường hợp này
  (b) Không — bỏ qua
  (c) Có nhưng Out of Scope — ghi chú vào phần Out of Scope

[EC-002]: Ngày lễ rơi vào cuối kỳ công
→ EC này có ảnh hưởng đến US "[tên US]" không?
...
```

**Hỏi lần lượt từng EC** — không hỏi tất cả cùng lúc. Chờ BA trả lời trước khi hỏi EC tiếp theo.

Ghi nhận EC nào được chọn "Có" để đưa vào AC.

**Nếu không có Edge Case Library:** Chủ động đề xuất các edge cases phổ biến dựa trên domain:
- Nếu FEAT liên quan đến thời gian: ngày lễ, kỳ công lệch, làm thêm giờ
- Nếu FEAT liên quan đến nhân sự: điều chuyển, thay đổi hợp đồng, nghỉ thai sản
- Nếu FEAT liên quan đến phê duyệt: người duyệt vắng mặt, đa cấp phê duyệt
- Nếu FEAT liên quan đến tính toán: số âm, giá trị 0, số rất lớn, đơn vị tiền tệ

---

## Hành động 2: Lập danh sách AC cần viết

Trước khi viết, phác thảo danh sách scenarios sẽ viết:

```
Danh sách AC sẽ viết cho US "[Tên US]":

Happy Path (bắt buộc có ít nhất 1):
  AC-001: [Mô tả ngắn — ví dụ: Tạo thành công với đầy đủ thông tin]
  AC-002: [Mô tả ngắn — ví dụ: Tạo nhanh 12 kỳ trong 1 năm]

Sad Path / Validation (bắt buộc có ít nhất 1):
  AC-003: [Ví dụ: Không cho phép khoảng thời gian trùng lặp]
  AC-004: [Ví dụ: Bắt buộc điền đủ thông tin trước khi lưu]

Edge Cases (từ danh sách EC đã chọn):
  AC-005: [EC-001: Kỳ công lệch không bắt đầu từ đầu tháng]
  AC-006: [EC-003: Áp dụng khác nhau cho từng phòng ban]

BA có muốn thêm/bỏ scenario nào không?
```

Chờ BA duyệt danh sách trước khi viết chi tiết.

---

## Hành động 3: Viết từng AC theo format bắt buộc

### Template AC:

```markdown
### AC-[số thứ tự]: [Tên ngắn gọn của scenario]
**Trace:** FAC-[số] ([tên FAC])

**Given** (Điều kiện ban đầu):
- [Mô tả trạng thái hệ thống/người dùng ở điều kiện ban đầu]
- [Mô tả điều kiện tiên quyết nếu có]

**When** (Hành động người dùng):
- [Mô tả cụ thể hành động mà người dùng thực hiện]
- [Thêm bước nếu cần — nên ngắn gọn]

**Then** (Kết quả mong đợi):
- [Hệ thống phản hồi như thế nào — cụ thể, quan sát được]
- [Dữ liệu được lưu/hiển thị như thế nào]
- [Thông báo nào hiển thị nếu có]
```

### Quy tắc viết Given/When/Then:

**Given phải:**
- Mô tả điều kiện tiên quyết (pre-conditions) rõ ràng
- Bao gồm: ai đang đăng nhập, dữ liệu nào đã có, màn hình nào đang mở
- Ngôn ngữ: "Người dùng đang ở màn hình..." / "Dữ liệu [X] đã được thiết lập..."
- Không được mô tả hành động trong Given

**When phải:**
- Mô tả đúng MỘT hành động chính của người dùng
- Bắt đầu bằng: "Người dùng [động từ]..." / "[Tên actor] [động từ]..."
- Cụ thể: "điền thông tin 'Tên kỳ' là 'Kỳ tháng 06/2025'" tốt hơn "điền form"

**Then phải:**
- Mô tả kết quả quan sát được từ góc nhìn người dùng
- Cụ thể: "Hệ thống hiển thị thông báo 'Tạo kỳ công thành công'" tốt hơn "lưu thành công"
- Bao gồm cả: thông báo, trạng thái mới, dữ liệu xuất hiện/thay đổi
- Không được nhắc đến database, API response, v.v.

---

## Hành động 4: Kiểm tra đặc thù Segment (nếu có)

Nếu ở Step 02 xác định có nhiều segments với đặc thù khác nhau, thêm note vào AC liên quan:

```markdown
**Lưu ý theo Segment:**
- Công nhân sản xuất: kỳ công có thể lệch (26 tháng trước → 25 tháng này)
- Nhân viên văn phòng: kỳ công từ ngày 1 → cuối tháng
```

---

## Hành động 5: Review tổng thể AC

Sau khi viết xong tất cả AC, tự kiểm tra:

**Checklist tự review:**
- [ ] Mỗi AC có dòng `Trace: FAC-00X`
- [ ] Có ít nhất 1 happy path AC
- [ ] Có ít nhất 1 sad path AC (validation, không cho phép)
- [ ] Có AC cho từng EC đã chọn "Có" ở Hành động 1
- [ ] Không có từ kỹ thuật nào trong toàn bộ AC
- [ ] Tổng số AC >= 3
- [ ] Mỗi AC độc lập (Given không phụ thuộc vào kết quả AC khác)

**Nếu fail checklist:** Tự sửa trước khi trình BA.

---

## Kết quả đầu ra Step 03

Trình toàn bộ AC cho BA review. Format hiển thị:

```
--- ACCEPTANCE CRITERIA (Draft) ---

[Toàn bộ AC đã viết]

Tổng: [N] AC scenarios
- Happy path: [X] scenarios
- Sad path: [Y] scenarios  
- Edge cases: [Z] scenarios

BA có muốn chỉnh sửa AC nào không?
Hoặc thêm scenario chưa được cover?
```

Điều chỉnh theo góp ý BA cho đến khi BA approve toàn bộ AC.

---

## Chuyển sang Step tiếp theo

Sau khi BA approve AC, đọc và thực thi: `./steps/step-04-draw-activity-diagram.md`
