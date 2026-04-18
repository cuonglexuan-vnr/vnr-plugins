# Step 05a — Viết Data Dictionary

## Mục tiêu

Viết Data Dictionary mô tả tất cả trường thông tin mà người dùng tương tác trong US này. Toàn bộ phải dùng kiểu dữ liệu và ngôn ngữ nghiệp vụ — tuyệt đối không có từ kỹ thuật.

---

## Hành động A1: Thu thập danh sách trường dữ liệu

Dựa trên AC đã viết ở Step 03, liệt kê TẤT CẢ các trường thông tin được đề cập:
- Trường người dùng nhập liệu (input)
- Trường hệ thống hiển thị để người dùng xem (output)
- Trường người dùng chọn từ danh sách (dropdown, radio, checkbox)
- Trường tệp đính kèm (upload)
- Trường ngày tháng

**Ví dụ trích xuất từ AC:**
> "Người dùng điền Tháng, Tên kỳ, Ngày bắt đầu, Ngày kết thúc"
> → Có 4 trường: Tháng, Tên kỳ, Ngày bắt đầu, Ngày kết thúc

---

## Hành động A2: Viết bảng Data Dictionary

**Format bảng bắt buộc:**

```markdown
| Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Ghi chú |
|---|---|:---:|---|
| Tháng | Ngày (MM/YYYY) | Có | Chỉ chọn được tháng trong tương lai hoặc hiện tại |
| Tên kỳ | Văn bản | Có | Tối đa 100 ký tự. Mặc định tự điền theo "Tháng MM/YYYY" |
| Ngày bắt đầu | Ngày | Có | Phải nhỏ hơn Ngày kết thúc |
| Ngày kết thúc | Ngày | Có | Phải lớn hơn Ngày bắt đầu |
| Phòng ban áp dụng | Danh sách đa chọn | Không | Nếu không chọn: áp dụng toàn công ty |
| Đang sử dụng | Checkbox | Không | Mặc định: Có |
```

---

## Kiểu dữ liệu nghiệp vụ được phép dùng

| Kiểu nghiệp vụ | Dùng cho |
|---|---|
| Văn bản | Tên, mã, mô tả, ghi chú tự do |
| Số | Số lượng, số tiền, số ngày, tỷ lệ % |
| Ngày | Ngày đơn lẻ (DD/MM/YYYY) |
| Ngày (MM/YYYY) | Tháng/năm — không cần ngày cụ thể |
| Khoảng ngày | Từ ngày — đến ngày |
| Danh sách đơn chọn | Dropdown, radio button (chọn 1 trong nhiều) |
| Danh sách đa chọn | Multi-select, checkbox list (chọn nhiều) |
| Checkbox | Bật/tắt, có/không |
| Tệp đính kèm | Upload file |
| Hình ảnh | Upload ảnh |
| Văn bản nhiều dòng | Nội dung dài, mô tả chi tiết |

---

## Từ kỹ thuật KHÔNG được dùng trong Data Dictionary

```
❌ varchar, nvarchar, int, bigint, decimal, float, boolean, bit
❌ nullable, NOT NULL, DEFAULT, CONSTRAINT
❌ foreign key, primary key, index
❌ string, integer, object, array, enum
❌ JSON, XML, Base64, BLOB
```

**Thay bằng từ nghiệp vụ:**
- `varchar(100)` → `Văn bản (tối đa 100 ký tự)`
- `boolean` → `Checkbox (Có/Không)`
- `nullable` → `Không bắt buộc`
- `foreign key` → `Liên kết với [tên nghiệp vụ]`

---

## Tự validate — Kiểm tra "Zero Kỹ thuật"

Quét toàn bộ nội dung Data Dictionary vừa viết. Tìm các từ kỹ thuật cấm:

**Danh sách từ cấm:**
```
API, endpoint, HTTP, GET, POST, PUT, DELETE,
database, DB, table, column, schema,
varchar, int, bigint, decimal, float, boolean,
null, nullable, NOT NULL, DEFAULT,
component, interface, DTO, Service, Controller,
JSON, XML, YAML,
string, integer, object, array, enum (trong context lập trình)
```

**Nếu tìm thấy từ cấm:** Thay thế bằng từ nghiệp vụ tương đương.

---

## Kết quả đầu ra Step 05a

Hiển thị tóm tắt Data Dictionary đã tạo:

```
════════════════════════════════════════════════════════════
✓ HOÀN THÀNH STEP 05a — DATA DICTIONARY

📋 DATA DICTIONARY — US [{US-ID}]
════════════════════════════════════
Tổng số trường: [{N} trường]
Bắt buộc: [{M} trường]
Tùy chọn: [{P} trường]

Bảng Data Dictionary:
[Hiển thị bảng đầy đủ]

✓ Kiểm tra Zero Kỹ thuật: PASSED
════════════════════════════════════
════════════════════════════════════════════════════════════
```

**Tự động chuyển sang Step 05b** — đọc và thực thi: `./steps/step-05b-write-business-rules.md`
