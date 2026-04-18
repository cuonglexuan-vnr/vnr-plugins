# Step 06 — UI/UX Mô tả & Tracking/Analytics

## Mục tiêu

Xây dựng phần UI/UX của US dựa trên wireframe (nếu có) **và/hoặc** AC + Activity Diagram đã viết. Đánh giá sự đầy đủ theo tiêu chí UX chuẩn trước khi kết thúc step. Xác định tracking events.

---

## Nguyên tắc bất biến — Ngôn ngữ Nghiệp vụ

**DÙNG:**
- "Màn hình Thiết lập Kỳ công"
- "Hộp thoại xác nhận xóa"
- "Biểu mẫu nhập thông tin"
- "Danh sách thả xuống chọn phòng ban"
- "Nút Lưu / Nút Hủy"
- "Thông báo thành công / thông báo lỗi"
- "Ô tìm kiếm", "Bộ lọc", "Dải phân trang"

**KHÔNG DÙNG:**
- ❌ Tên component: `PayPeriodFormComponent`, `nz-modal`, `nz-table`
- ❌ Tên route: `/api/pay-periods`
- ❌ Tên file: `.html`, `.ts`, `.scss`
- ❌ Từ kỹ thuật: `ReactiveForm`, `router.navigate`, `MatDialog`

---

## Phần A: Phân tích Wireframe (thực hiện NẾU có wireframe)

> **Bỏ qua Phần A nếu `HAS_WIREFRAME = false`** — chuyển thẳng sang Phần B.

### A1: Đọc Wireframe

Dùng `Read` tool để xem file ảnh / đọc file đã cung cấp tại `WIREFRAME_INPUT`.

Nếu là Figma URL → ghi nhận tên page/frame, yêu cầu BA mô tả cụ thể layout nếu không đọc trực tiếp được.

### A2: Liệt kê màn hình thấy trong wireframe

```
Màn hình phát hiện trong wireframe:
#  | Tên (đặt tên nghiệp vụ)             | Trạng thái thấy được
---|-------------------------------------|-------------------------
1  | [Tên màn hình 1]                    | Bình thường / Rỗng / Lỗi
2  | [Tên màn hình 2]                    | ...
```

### A3: Đối chiếu Wireframe vs AC

So sánh màn hình trong wireframe với AC đã approve ở Step 03:

```
ĐỐI CHIẾU WIREFRAME vs AC
══════════════════════════════════════════════════

✅ Wireframe có + AC cover:
   - Màn hình [X] → AC-001, AC-002

⚠️  Wireframe có nhưng CHƯA có AC cover:
   - [Màn hình / Trạng thái / Hành động] → Cần thêm AC hoặc ghi vào Out of Scope
   → Gợi ý: [Đề xuất AC bổ sung hoặc lý do Out of Scope]

⚠️  AC có nhưng wireframe CHƯA thể hiện:
   - AC-[X]: [Mô tả] → Chưa thấy màn hình / trạng thái tương ứng
   → Gợi ý: [Hỏi BA xem có màn hình bị bỏ sót hay không]

══════════════════════════════════════════════════
```

Trình BA và hỏi:
```
Wireframe vs AC đã đối chiếu. Có [N] điểm cần làm rõ:
[Liệt kê từng điểm]
BA muốn xử lý thế nào?
```

---

## Phần B: Mô tả UI/UX

### B1: Xác định danh sách màn hình

Nếu **có wireframe**: dùng danh sách từ A2 làm nền, điều chỉnh theo góp ý BA.

Nếu **không có wireframe**: suy ra từ Activity Diagram (Step 04) và AC (Step 03):

```
Màn hình suy ra từ luồng nghiệp vụ:
1. [Tên màn hình] — Actor cần màn hình này để: [hành động]
2. [Tên hộp thoại] — Xuất hiện khi: [điều kiện]
...
```

### B2: Mô tả chi tiết từng màn hình

**Format bắt buộc cho mỗi màn hình:**

```markdown
#### Màn hình: [Tên nghiệp vụ]

**Mục đích:** [Người dùng dùng màn hình này để làm gì]

**Nguồn:** [Wireframe frame #X] hoặc [Suy ra từ AC-00X]

**Các thành phần hiển thị:**
- [Thành phần 1 — mô tả nghiệp vụ, vị trí tương đối]
- [Thành phần 2]

**Trạng thái hiển thị (bắt buộc liệt kê đủ):**
| Trạng thái | Khi nào | Giao diện / Thông báo |
|---|---|---|
| Đang tải | Sau khi mở màn hình | Hiển thị chỉ báo đang tải |
| Có dữ liệu | Khi có bản ghi | Danh sách / form đã điền |
| Rỗng | Chưa có bản ghi | [Thông điệp gợi ý hành động — ví dụ: "Chưa có kỳ công. Nhấn 'Thêm mới' để bắt đầu."] |
| Lỗi hệ thống | Khi tải thất bại | [Thông điệp lỗi + nút thử lại] |

**Trạng thái của trường / nút:**
| Trường / Nút | Trạng thái ban đầu | Điều kiện thay đổi |
|---|---|---|
| Nút Lưu | Bị khóa | Khi điền đủ thông tin bắt buộc |
| Nút Xóa | Ẩn | Khi bản ghi có thể xóa được |

**Thông báo & phản hồi:**
- Thành công: "[Nội dung cụ thể — ví dụ: 'Kỳ công tháng 06/2025 đã được tạo thành công']"
- Lỗi validation: "[Ví dụ: 'Khoảng thời gian đã trùng với kỳ công Tháng 05/2025']"
- Cảnh báo: "[Ví dụ: 'Thay đổi ngày sẽ ảnh hưởng đến [N] bản ghi. Bạn có chắc không?']"

**Tham chiếu wireframe:** [Frame #X trong [tên file/URL]] hoặc [Chưa có wireframe]
```

### B3: Luồng điều hướng giữa các màn hình

```markdown
**Luồng điều hướng:**
1. [Màn hình A] → Nhấn "[Tên nút/link]" → [Màn hình B]
2. [Màn hình B] → Nhấn "Lưu" thành công → Quay về [Màn hình A]
3. [Màn hình B] → Nhấn "Hủy" → Quay về [Màn hình A] (không lưu)
```

### B4: Hỏi BA về chi tiết còn chưa rõ

```
UI/UX đề xuất đã phác thảo. BA xem lại:
1. Có màn hình nào còn thiếu không?
2. Trạng thái disabled/hidden/loading có đúng không?
3. Nội dung thông báo có phù hợp văn phong công ty không?
4. Có link Figma chính thức nào cần gắn vào không?
```

---

## Phần C: UX Evaluation — Kiểm tra Chất lượng UX

Sau khi B4 BA xác nhận, chạy checklist 6 tiêu chí UX trước khi kết thúc step:

### C1: Completeness — Đầy đủ màn hình

```
✅ / ⚠️  Mọi node hành động trong Activity Diagram có màn hình tương ứng không?
→ Kiểm tra: Đếm số nhánh có "Người dùng [làm gì]" trong diagram → so với số màn hình đã mô tả
```

### C2: State Coverage — Đủ trạng thái

```
✅ / ⚠️  Mỗi màn hình có đủ 4 trạng thái cơ bản không?
→ Loading: [✅/⚠️ thiếu ở màn hình X]
→ Empty State: [✅/⚠️ thiếu ở màn hình Y]
→ Error State: [✅/⚠️ thiếu ở màn hình Z]
→ Success State: [✅/⚠️ ...]
```

### C3: Feedback Completeness — Phản hồi người dùng

```
✅ / ⚠️  Mỗi hành động của người dùng có thông báo / phản hồi rõ ràng không?
→ Kiểm tra từng AC "When" → có "Then" mô tả phản hồi UI cụ thể không?
→ Các AC thiếu phản hồi: [liệt kê hoặc "Không có"]
```

### C4: Error Prevention — Ngăn chặn lỗi trước

```
✅ / ⚠️  Có cơ chế ngăn người dùng nhập sai trước khi submit không?
→ Nút Lưu bị khóa khi chưa đủ thông tin: [✅/⚠️]
→ Validation inline (hiện lỗi ngay khi rời khỏi ô nhập): [✅/⚠️ — ghi rõ trường nào]
→ Cảnh báo trước khi thao tác phá hủy (xóa, reset): [✅/⚠️]
```

### C5: Consistency — Nhất quán

```
✅ / ⚠️  Tên màn hình, tên nút, nội dung thông báo có nhất quán không?
→ Cùng hành động dùng cùng tên nút (ví dụ: không vừa "Lưu" vừa "Ghi lại"): [✅/⚠️]
→ Cùng loại thông báo dùng cùng format: [✅/⚠️]
```

### C6: Wireframe Coverage (chỉ khi HAS_WIREFRAME = true)

```
✅ / ⚠️  Mọi màn hình trong wireframe đã được mô tả và có AC cover không?
→ Màn hình chưa mô tả: [liệt kê hoặc "Không có"]
→ Màn hình chưa có AC: [liệt kê hoặc "Không có"]
```

**Báo cáo UX Evaluation:**

```
UX EVALUATION — US [{US-ID}]
════════════════════════════════════
C1 Completeness   : [✅ Đủ / ⚠️ Thiếu màn hình: X]
C2 State Coverage : [✅ Đủ / ⚠️ Thiếu trạng thái: X ở màn hình Y]
C3 Feedback       : [✅ Đủ / ⚠️ AC-X thiếu phản hồi UI]
C4 Error Prevent  : [✅ Đủ / ⚠️ Trường X chưa có inline validation]
C5 Consistency    : [✅ Đủ / ⚠️ Tên nút không đồng nhất: X vs Y]
C6 Wireframe Cov  : [✅ / ⚠️ / N/A — không có wireframe]

Kết quả: [PASS ✅ (tất cả ✅)] hoặc [CẦN BỔ SUNG ⚠️ (N điểm)]
════════════════════════════════════
```

**Nếu có điểm ⚠️:** Hỏi BA:
```
Phát hiện [N] điểm UX chưa đủ. Bạn muốn:
(a) Tôi bổ sung ngay (tôi đề xuất, BA duyệt)
(b) Ghi chú "Cần bổ sung" và xử lý sau qua /vnr-ba-us-refine
```

---

## Phần D: Tracking & Analytics

### D1: Xác định sự kiện cần log

**Sự kiện Audit Trail (bắt buộc):**
- Tạo mới → Ai? Khi nào? Dữ liệu ban đầu?
- Chỉnh sửa → Ai? Trường nào đổi? Từ/sang giá trị gì?
- Xóa / Vô hiệu hóa → Ai? Khi nào?
- Phê duyệt / Từ chối → Ai duyệt? Lý do từ chối?

**Sự kiện Analytics (nếu cần):**
- Người dùng hủy bỏ giữa chừng → Hủy ở bước nào?
- Người dùng gặp lỗi validation → Lỗi nào phổ biến?

### D2: Bảng Tracking Events

```markdown
| Sự kiện | Khi nào xảy ra | Dữ liệu ghi lại | Loại |
|---|---|---|---|
| [Tên sự kiện] | [Trigger cụ thể] | [Dữ liệu cần lưu] | Audit / Analytics |
```

**Cột Loại:** `Audit` = kiểm toán bắt buộc | `Analytics` = hành vi người dùng

### D3: Hỏi BA

```
Tracking events đề xuất:
[Bảng]

BA có sự kiện đặc biệt nào cần ghi lại không?
(tuân thủ pháp lý, KPI, sự kiện nghiệp vụ đặc thù)
```

---

## Kết quả đầu ra Step 06

```
--- UI/UX MÔ TẢ + UX EVALUATION + TRACKING (Draft) ---

### Phần A: Phân tích Wireframe [nếu có]
[Đối chiếu wireframe vs AC]

### Phần B: UI/UX Mô tả
[Mô tả từng màn hình]
[Luồng điều hướng]

### Phần C: UX Evaluation
[Báo cáo 6 tiêu chí]

### Phần D: Tracking & Analytics
[Bảng tracking events]

BA có muốn chỉnh sửa không?
```

---

## Chuyển sang Step tiếp theo

Sau khi BA approve (và UX Evaluation đạt PASS hoặc các ⚠️ đã xử lý xong), đọc và thực thi: `./steps/step-07-finalize.md`
