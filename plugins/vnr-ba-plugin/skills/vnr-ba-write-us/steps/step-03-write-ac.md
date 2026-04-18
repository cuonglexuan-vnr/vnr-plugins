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

## Hành động 1: Tự động phân tích Edge Cases

Lấy danh sách EC đã detect ở Step 01. Tự động phân tích từng EC để xác định mức độ liên quan đến US hiện tại:

**Logic phân tích tự động:**
1. **Khớp domain**: EC thuộc cùng module/nghiệp vụ với US → liên quan cao
2. **Khớp actor**: EC liên quan đến cùng actor → liên quan trung bình
3. **Khớp hành động**: EC liên quan đến cùng task/hành động → liên quan cao
4. **Khớp FAC**: EC được nhắc trong FAC cha → liên quan cao

**Kết quả:**
- EC có liên quan cao/trung bình → đưa vào AC
- EC không liên quan hoặc Out of Scope → bỏ qua
- Ghi nhận danh sách EC đã chọn để viết AC

```
[INTERNAL LOG] Edge Cases phân tích:
✓ EC-001: Nhân viên điều chuyển giữa kỳ → LIÊN QUAN → Sẽ có AC
✓ EC-005: Kỳ công lệch không bắt đầu từ đầu tháng → LIÊN QUAN → Sẽ có AC
✗ EC-003: Ngày lễ rơi vào cuối kỳ → OUT OF SCOPE
✗ EC-007: Thay đổi hợp đồng → KHÔNG LIÊN QUAN
```

**Nếu không có Edge Case Library:** Chủ động tạo edge cases phổ biến dựa trên domain:
- Nếu FEAT liên quan đến thời gian: ngày lễ, kỳ công lệch, làm thêm giờ
- Nếu FEAT liên quan đến nhân sự: điều chuyển, thay đổi hợp đồng, nghỉ thai sản
- Nếu FEAT liên quan đến phê duyệt: người duyệt vắng mặt, đa cấp phê duyệt
- Nếu FEAT liên quan đến tính toán: số âm, giá trị 0, số rất lớn, đơn vị tiền tệ

---

## Hành động 2: Tự động lập danh sách AC và viết chi tiết

Dựa trên FAC, Edge Cases đã chọn, và Ground Rules, tự động lập danh sách AC scenarios rồi viết chi tiết ngay.

**Nguyên tắc lập danh sách:**

Lập danh sách AC theo **5 nhóm use case** (xem chi tiết bên dưới):

```
[INTERNAL LOG] Danh sách AC sẽ viết:

1. Happy Path AC:
  AC-001: [Tạo kỳ công thành công với đầy đủ thông tin] ← từ FAC-001
  AC-002: [Xem danh sách kỳ công] ← từ FAC-002
  AC-003: [Sửa kỳ công chưa sử dụng] ← từ FAC-003

2. Validation AC:
  AC-004: [Không cho phép khoảng thời gian trùng lặp] ← từ BR-F001
  AC-005: [Bắt buộc điền đủ thông tin trước khi lưu] ← từ FAC-001 validation

3. Toggle/Conditional AC:
  AC-006: [Ẩn nút Xóa nếu kỳ công đã sử dụng] ← từ BR-F002
  (bao gồm cả Edge Cases từ Hành động 1 nếu liên quan đến điều kiện)

4. Save/Submit AC:
  AC-007: [Lưu nháp kỳ công mà không validate] ← từ FAC-004

5. Unsaved Changes AC:
  AC-008: [Cảnh báo khi đóng form chưa lưu] ← từ UX guideline
```

**Sau khi lập danh sách → viết luôn chi tiết từng AC theo template bắt buộc** (xem Hành động 3).

**AC tối thiểu cần có:**

Đối với feature quản lý master data (CRUD), đảm bảo cover đủ:
- Xem danh sách
- Tạo mới
- Cấu hình Detail
- Sửa (chưa sử dụng / đã sử dụng)
- Xóa (chưa sử dụng / đã sử dụng)
- Validate khi lưu
- Bật/tắt trạng thái (nếu có)
- Clone (nếu có)
- Lọc/Tìm kiếm (nếu có)

> **Lưu ý:** Checklist trên áp dụng cho feature CRUD điển hình. Với feature khác (báo cáo, dashboard, workflow), điều chỉnh cho phù hợp.

**📊 Số lượng AC theo loại (U06 example):**

| Loại AC | Số lượng | % |
|---------|----------|---|
| Happy Path (Section detail) | 8 | 44% |
| Toggle/Conditional | 4 | 22% |
| Validation | 2 | 11% |
| Save/Submit | 2 | 11% |
| Unsaved Changes Warning | 2 | 11% |
| **Total** | **18** | **100%** |

> **Lưu ý:** Tỷ lệ này chỉ mang tính tham khảo. Feature phức tạp có thể có nhiều Validation AC hơn, feature đơn giản có thể không cần Save/Submit AC.

**Phân loại AC theo Use Case:**

Khi viết AC, phân loại và sắp xếp theo **5 nhóm use case** theo thứ tự sau:

**1. Happy Path AC (Luồng chính)**
- AC mô tả luồng chính thành công (tạo, sửa, xóa, xem thành công)
- Đây là các AC quan trọng nhất, phải viết đầu tiên
- **Ví dụ:** "AC-001: Tạo kỳ công thành công với đầy đủ thông tin", "AC-002: Xem danh sách kỳ công"

**2. Validation AC (Kiểm tra dữ liệu)**
- AC kiểm tra validation rule (bắt buộc, format, business rule)
- Mô tả hệ thống **không cho phép** hoặc **hiển thị lỗi** khi dữ liệu không hợp lệ
- **Ví dụ:** "AC-003: Không cho phép tạo kỳ công với khoảng thời gian trùng lặp", "AC-004: Bắt buộc nhập đủ thông tin trước khi lưu"

**3. Toggle/Conditional AC (Trạng thái phụ thuộc)**
- AC liên quan đến bật/tắt trạng thái, điều kiện hiển thị, permission-based behavior
- Mô tả hành vi khác nhau dựa trên điều kiện (role, trạng thái, segment)
- **Ví dụ:** "AC-005: Ẩn nút Xóa nếu kỳ công đã được sử dụng", "AC-006: Hiển thị form khác nhau cho công nhân sản xuất vs văn phòng"

**4. Save/Submit AC (Lưu dữ liệu)**
- AC mô tả hành vi khi lưu: lưu nháp, lưu tạm, submit, lưu và đóng
- Khác với Happy Path (focus vào kết quả cuối cùng), Save AC focus vào **hành vi lưu trữ**
- **Ví dụ:** "AC-007: Lưu nháp kỳ công mà không validate", "AC-008: Submit kỳ công và chuyển trạng thái sang Đang sử dụng"

**5. Unsaved Changes AC (Cảnh báo thay đổi)**
- AC cảnh báo người dùng khi rời màn hình mà chưa lưu thay đổi
- AC liên quan đến UX: confirm dialog, auto-save, khôi phục draft
- **Ví dụ:** "AC-009: Hiển thị cảnh báo khi đóng form mà chưa lưu", "AC-010: Tự động lưu nháp sau mỗi 30 giây"

**Quy tắc đánh số và sắp xếp:**
- AC được đánh số liên tục theo thứ tự: AC-001 (Happy Path) → AC-002 (Happy Path) → AC-003 (Validation) → ...
- Trong cùng một nhóm, sắp xếp theo độ ưu tiên: CRUD chính (Create → Read → Update → Delete) → các luồng phụ
- Nếu có sub-case, dùng AC-004a, AC-004b (cùng nhóm use case)

---

### Decision Tree khi AC mơ hồ hoặc nằm giữa 2 nhóm

Một số AC có thể nằm ở ranh giới giữa 2 nhóm. Dùng decision tree sau để phân loại:

```
IF AC có từ "thành công" VÀ mô tả kết quả cuối cùng (data được lưu, hiển thị):
   → **Happy Path AC**
   
ELSE IF AC có từ "không cho phép" HOẶC "hiển thị lỗi" HOẶC "bắt buộc":
   → **Validation AC**
   
ELSE IF AC mô tả điều kiện (IF role X / IF trạng thái Y / IF segment Z):
   → **Toggle/Conditional AC**
   
ELSE IF AC focus vào hành vi lưu (lưu nháp / lưu tạm / submit):
   → **Save/Submit AC**
   
ELSE IF AC liên quan đến rời màn hình / đóng form / chưa lưu:
   → **Unsaved Changes AC**
   
ELSE:
   → Mặc định: **Happy Path AC** (nếu là luồng chính)
```

**Ví dụ decision tree:**

| AC | Phân tích | Kết quả |
|---|---|---|
| "Lưu kỳ công thành công" | Có "thành công" + mô tả kết quả | **Happy Path** |
| "Lưu nháp kỳ công mà không validate" | Focus vào hành vi lưu (nháp) | **Save/Submit** |
| "Không cho phép khoảng thời gian trùng lặp" | Có "không cho phép" | **Validation** |
| "Ẩn nút Xóa nếu kỳ công đã sử dụng" | Có điều kiện "nếu" | **Toggle/Conditional** |
| "Hiển thị cảnh báo khi đóng form chưa lưu" | Liên quan "đóng form" + "chưa lưu" | **Unsaved Changes** |

---

**Ví dụ kết quả phân loại:**

```
[INTERNAL LOG] Danh sách AC đã phân loại:

1. Happy Path AC:
  AC-001: Tạo kỳ công thành công với đầy đủ thông tin ← từ FAC-001
  AC-002: Xem danh sách kỳ công với phân trang ← từ FAC-002
  AC-003: Sửa kỳ công chưa sử dụng thành công ← từ FAC-003

2. Validation AC:
  AC-004: Không cho phép khoảng thời gian trùng lặp ← từ BR-F001
  AC-005: Bắt buộc điền đủ thông tin trước khi lưu ← từ FAC-001 validation

3. Toggle/Conditional AC:
  AC-006: Ẩn nút Xóa nếu kỳ công đã được sử dụng ← từ FAC-003

4. Save/Submit AC:
  AC-007: Lưu nháp kỳ công mà không validate ← từ FAC-004

5. Unsaved Changes AC:
  AC-008: Hiển thị cảnh báo khi đóng form mà chưa lưu ← từ UX guideline

... (tiếp tục cho các AC khác)
```

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

**Business Rules:** BR-[số], BR-[số] (nếu có)
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

### Quy tắc bổ sung khi viết AC:

1. **Tên AC phải rõ ràng:** 
   - ✅ "AC-001: Tạo kỳ công thành công với đầy đủ thông tin bắt buộc"
   - ❌ "AC-001: Tạo kỳ công"

2. **Ghi BR liên quan:**
   - Cuối mỗi AC, thêm dòng `**Business Rules:** BR-001, BR-003` nếu AC đó thực thi hoặc validate theo BR nào
   - Giúp trace từ AC → BR → logic nghiệp vụ

3. **Tách sub-case khi cần:**
   - Nếu một AC có nhiều trường hợp con (ví dụ: "Sửa kỳ công" có 2 case: chưa sử dụng / đã sử dụng)
   - Tách thành **AC-004a** (chưa sử dụng) và **AC-004b** (đã sử dụng)
   - Mỗi sub-case có Given/When/Then riêng

4. **Coverage checklist:**
   - CRUD đầy đủ (Create, Read, Update, Delete)
   - Validation (bắt buộc, format, business rules)
   - Edge cases (đã phân tích ở Hành động 1)
   - Trạng thái (Active/Inactive, Bật/Tắt nếu có)

### Kỹ thuật viết AC đặc biệt

Một số case đặc biệt cần lưu ý khi viết AC:

**1. Dependency Note (Phụ thuộc US khác):**

Khi AC phụ thuộc vào feature từ US khác chưa deploy, thêm note cho Dev:

```markdown
**Dependency Note (cho Dev):**
- **CRITICAL:** Dropdown "Nhóm cấp độ" phụ thuộc vào U10 (Quản lý nhóm cấp độ).
- Nếu U10 chưa deploy → Dropdown tạm thời hiển thị "Đang cập nhật..." (disabled)
- Sau khi U10 deploy → Cập nhật AC này để load danh sách từ U10
```

**2. Empty State (Chưa có dữ liệu):**

Viết AC riêng cho trường hợp chưa có dữ liệu:

```markdown
### AC-00X: Hiển thị empty state khi chưa có nhóm cấp độ
**Trace:** FAC-002

**Given:**
- Admin đang ở màn hình "Tạo cấu hình đánh giá"
- Hệ thống đã tích hợp với U10
- U10 chưa có dữ liệu nhóm cấp độ nào

**When:** Admin click vào dropdown "Chọn nhóm cấp độ"

**Then:**
- Dropdown hiển thị empty state: "Chưa có nhóm cấp độ nào. Vui lòng tạo trong Danh mục → Nhóm cấp độ"
- Hiển thị link [Tạo nhóm cấp độ mới]
- Click vào link → Navigate đến màn hình U10

**Data Source Note (cho Dev):**
- Dropdown load từ danh sách "Nhóm cấp độ" đã tạo trong U10
```

**3. File Upload Validation:**

Viết riêng AC cho từng rule validation (kích thước, định dạng):

```markdown
### AC-00X: Không cho phép upload file vượt quá 2MB
**Trace:** FAC-003
**Business Rules:** BR-005

**Given:**
- Admin đang ở màn hình "Cấu hình hệ thống"
- Trường upload logo đang trống

**When:** Admin upload file logo kích thước 3MB

**Then:**
- Hiển thị lỗi dưới trường upload: "Kích thước file vượt quá 2MB"
- File không được upload
- Trường upload được bôi đỏ
- Nút "Lưu" bị disabled

---

### AC-00Y: Không cho phép upload file không đúng định dạng
**Trace:** FAC-003
**Business Rules:** BR-006

**Given:**
- Admin đang ở màn hình "Cấu hình hệ thống"
- Trường upload logo đang trống

**When:** Admin upload file định dạng .pdf

**Then:**
- Hiển thị lỗi dưới trường upload: "Định dạng file không hợp lệ. Chỉ chấp nhận: .png, .jpg, .jpeg"
- File không được upload
- Trường upload được bôi đỏ
```

**Lưu ý quan trọng:**
- **KHÔNG viết API endpoint, HTTP method, response code** trong AC
- Nếu cần spec kỹ thuật → Viết ở phần `Technical Notes` riêng (ngoài AC)
- Mỗi rule validation → 1 AC riêng (dễ test, dễ trace)

---

## Hành động 4: Kiểm tra đặc thù Segment (nếu có)

Nếu ở Step 02 xác định có nhiều segments với đặc thù khác nhau, tự động phát hiện AC liên quan và thêm note.

**Logic tự động xác định AC liên quan đến Segment:**

Duyệt qua từng AC đã viết, kiểm tra các từ khóa:
- AC có nhắc "thời gian", "kỳ công", "ca làm việc", "lịch" → liên quan segment
- AC có nhắc "tính lương", "thưởng", "phụ cấp", "hoa hồng" → liên quan segment
- AC có nhắc "công thức", "quy trình", "phê duyệt" → kiểm tra xem có khác nhau giữa segments không
- AC có Given/Then mô tả hành vi khác nhau cho từng nhóm nhân sự → cần segment note

**Nếu phát hiện AC liên quan:** Thêm note vào cuối AC đó:

```markdown
**Lưu ý theo Segment:**
- Công nhân sản xuất: kỳ công có thể lệch (26 tháng trước → 25 tháng này)
- Nhân viên văn phòng: kỳ công từ ngày 1 → cuối tháng
```

**Nếu không có đặc thù:** Bỏ qua hành động này.

---

## Hành động 5: Review tổng thể AC

Sau khi viết xong tất cả AC, tự kiểm tra:

**Checklist tự review:**
- [ ] Mỗi AC có dòng `Trace: FAC-00X`
- [ ] Mỗi AC có dòng `Business Rules:` (nếu có BR liên quan)
- [ ] AC đã được phân loại đúng 5 nhóm use case (Happy Path, Validation, Toggle/Conditional, Save/Submit, Unsaved Changes)
- [ ] Có ít nhất 1 happy path AC
- [ ] Có ít nhất 1 validation AC (sad path, không cho phép)
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

Phân loại theo Use Case:
1. Happy Path AC: [X] scenarios
2. Validation AC: [Y] scenarios
3. Toggle/Conditional AC: [Z] scenarios
4. Save/Submit AC: [T] scenarios
5. Unsaved Changes AC: [U] scenarios

BA có muốn chỉnh sửa AC nào không?
Hoặc thêm scenario chưa được cover?
```

Điều chỉnh theo góp ý BA cho đến khi BA approve toàn bộ AC.

---

## Chuyển sang Step tiếp theo

Sau khi BA approve AC, đọc và thực thi: `./steps/step-04-draw-activity-diagram.md`
