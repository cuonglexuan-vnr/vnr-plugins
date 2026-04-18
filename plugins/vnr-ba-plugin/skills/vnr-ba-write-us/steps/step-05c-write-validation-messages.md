# Step 05c — Write Validation Messages (VM)

## Mục tiêu

Viết toàn bộ Validation Messages (VM) phân loại theo 4 loại: Error, Warning, Success, Info. Mỗi VM phải link rõ về BR và AC. Cuối step tạo ma trận VM ↔ BR ↔ AC và quy ước hiển thị cho Dev/UX.

---

## Nguyên tắc bắt buộc

1. **Mỗi VM phải có mã định danh:** VM-E01 (Error), VM-W01 (Warning), VM-S01 (Success), VM-I01 (Info)
2. **Mỗi VM phải link BR và AC:** Rõ ràng VM này xuất phát từ BR nào, test AC nào
3. **Nội dung message cụ thể:** Không viết chung chung, phải nêu rõ trường/giá trị/điều kiện
4. **Quy ước hiển thị đầy đủ:** Vị trí UI, thời gian hiển thị, màu sắc

---

## Hành động 1: Trích xuất validation từ BR-U và AC

Dựa trên BR-U (Step 05) và AC (Step 03), liệt kê tất cả điểm cần validation:

**Nguồn Error:**
- Từ BR-U: mỗi ràng buộc bắt buộc → 1 Error message
- Từ AC sad path: mỗi "Then không cho phép" → 1 Error message

**Nguồn Warning:**
- Từ BR-U: các ràng buộc "nên" (không bắt buộc) → Warning
- Từ AC: các "Then cảnh báo người dùng" → Warning

**Nguồn Success:**
- Từ AC happy path: mỗi "Then thành công" → 1 Success message

**Nguồn Info:**
- Từ AC: các trạng thái Empty, Loading, Error (message dạng thông tin)
- Từ Data Dictionary: các trường có mặc định hoặc auto-fill
- Từ UI states (4 trạng thái ở Step 06): Empty State, Loading State, Tooltip, Hint text, Placeholder
- Từ BR: các gợi ý nghiệp vụ cho người dùng

---

## Hành động 2: Viết bảng VM cho từng loại

### Quy ước đặt tên tham số trong message

**Trước khi viết VM, ghi nhớ quy ước tham số:**

| Tham số | Dùng cho | Ví dụ |
|---|---|---|
| `{fieldName}` | Tên trường | {Ngày bắt đầu}, {Tên kỳ công} |
| `{entityName}` | Tên entity | {Kỳ công}, {Nhân viên}, {Phòng ban} |
| `{value}` | Giá trị cụ thể | {Tháng 06/2025}, {15}, {Phòng IT} |
| `{count}` | Số lượng | {5} bản ghi, {3} nhân viên |
| `{condition}` | Điều kiện | {trùng lặp}, {quá hạn}, {chưa phê duyệt} |
| `{minValue}` / `{maxValue}` | Giá trị min/max | {0}, {100}, {31/12/2025} |
| `{relatedEntity}` | Entity liên quan | {Kỳ công Tháng 05/2025}, {Nhân viên X} |

**Ví dụ message chuẩn:**
- `"{fieldName} không được để trống"`
- `"{fieldName} phải nhỏ hơn {fieldName}"`
- `"{entityName} {value} đã được tạo thành công"`
- `"Thay đổi {entityName} sẽ ảnh hưởng đến {count} bản ghi. Bạn có chắc không?"`

---

### A. 🔴 Errors (Lỗi)

**Format bảng:**

```markdown
| Mã VM | Nội dung message | Khi nào hiển thị | BR | AC | Vị trí | Thời gian |
|---|---|---|---|---|---|---|
| VM-E01 | "{fieldName} không được để trống" | Khi submit mà trường bắt buộc trống | BR-U002 | AC-002 | Field error | Đến khi sửa |
| VM-E02 | "{fieldName} phải nhỏ hơn {fieldName}" | Khi giá trị vi phạm ràng buộc | BR-U00X | AC-00X | Field error | Đến khi sửa |
```

**Quy tắc viết Error message:**
- Bắt đầu bằng tên trường (dùng `{fieldName}`) hoặc mô tả lỗi
- Nêu rõ điều kiện vi phạm
- Gợi ý cách sửa (nếu không tự nhiên)
- Dùng tham số theo quy ước phía trên
- Ví dụ TỐT: "{fieldName} phải nhỏ hơn {fieldName}" → "Ngày bắt đầu phải nhỏ hơn Ngày kết thúc"
- Ví dụ XẤU: "Dữ liệu không hợp lệ"

---

### B. 🟡 Warnings (Cảnh báo)

**Format bảng:**

```markdown
| Mã VM | Nội dung message | Khi nào hiển thị | BR | AC | Vị trí | Thời gian |
|---|---|---|---|---|---|---|
| VM-W01 | "Thay đổi {X} sẽ ảnh hưởng đến [N] bản ghi. Bạn có chắc không?" | {Điều kiện} | BR-U00X | AC-00X | Confirm dialog | Đến khi chọn |
```

**Quy tắc viết Warning:**
- Nêu rõ hành động và hậu quả
- Có câu hỏi xác nhận (nếu cần user action)
- Ví dụ: "Hành động này không thể hoàn tác. Bạn có chắc không?"

---

### C. 🟢 Success (Thành công)

**Format bảng:**

```markdown
| Mã VM | Nội dung message | Khi nào hiển thị | BR | AC | Vị trí | Thời gian |
|---|---|---|---|---|---|---|
| VM-S01 | "{Entity} {Tên} đã được tạo thành công" | Sau khi lưu thành công | - | AC-001 | Toast success | 3-5 giây |
```

**Quy tắc viết Success:**
- Nêu rõ hành động đã thành công và đối tượng cụ thể
- Tích cực, rõ ràng
- Ví dụ: "Kỳ công Tháng 06/2025 đã được tạo thành công"

---

### D. ℹ️ Info (Thông tin)

**Format bảng:**

```markdown
| Mã VM | Nội dung message | Khi nào hiển thị | BR | AC | Vị trí | Thời gian |
|---|---|---|---|---|---|---|
| VM-I01 | "Chưa có {entity} nào. Nhấn 'Thêm mới' để bắt đầu." | Khi danh sách rỗng | - | AC-00X | Empty state | Đến khi có data |
| VM-I02 | "{Trường X} sẽ tự động điền theo {logic}" | Hiển thị dưới trường | - | AC-001 | Info inline | Theo điều kiện |
```

---

## Hành động 3: Viết Quy ước hiển thị

**Bảng chuẩn cho Dev/UX:**

```markdown
### Quy ước hiển thị Validation Messages

| Loại | Vị trí | Thời gian | Màu |
|---|---|---|---|
| **Field error** | Dưới trường lỗi | Đến khi sửa | 🔴 Đỏ |
| **Form error** | Đầu/cuối form | Đến khi sửa | 🔴 Đỏ |
| **Confirm dialog** | Modal center | Đến khi chọn | 🟡 Vàng |
| **Toast success** | Góc trên phải | 3-5 giây | 🟢 Xanh lá |
| **Toast error** | Góc trên phải | 5-7 giây | 🔴 Đỏ |
| **Empty state** | Giữa vùng danh sách | Đến khi có data | ⚪ Xám |
| **Info inline** | Dưới field/section | Theo điều kiện | 🔵 Xanh dương |
| **Banner info** | Đầu màn hình | Luôn hiển thị | 🔵 Xanh dương nhạt |
```

---

## Hành động 4: Tạo Ma trận VM ↔ BR ↔ AC

**Mục đích:** Trace rõ ràng mỗi VM xuất phát từ BR nào, test AC nào.

**Format bảng:**

```markdown
### Ma trận VM ↔ BR ↔ AC

| VM | BR | AC |
|---|---|---|
| VM-E01 | BR-U002 | AC-002 |
| VM-E02 | BR-U001 | AC-002 |
| VM-E03 | BR-U003 | AC-002 |
| VM-W01 | BR-U00X | AC-003 |
| VM-S01 | - | AC-001 |
| VM-S02 | - | AC-003 |
| VM-I01 | - | AC-00X |
| VM-I02 | - | AC-001 |
```

**Lưu ý:**
- Success/Info thường không link BR (vì không phải validation logic)
- Mỗi Error/Warning PHẢI link BR rõ ràng

---

## Kết quả đầu ra Step 05c

Hiển thị tóm tắt VM đã tạo:

```
════════════════════════════════════════════════════════════
✓ HOÀN THÀNH STEP 05c — VALIDATION MESSAGES

📝 Validation Messages:
   🔴 Errors: [N] messages
   🟡 Warnings: [M] messages
   🟢 Success: [X] messages
   ℹ️  Info: [Y] messages

✓ Quy ước hiển thị: Đã định nghĩa đầy đủ
✓ Ma trận VM ↔ BR ↔ AC: Đã tạo
════════════════════════════════════════════════════════════
```

**Tự động chuyển sang Step 06a** — đọc và thực thi: `./steps/step-06a-write-uiux-description.md`
