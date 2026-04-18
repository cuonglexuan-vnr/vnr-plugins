# Step 05 — Viết Data Dictionary & Business Rules

## Mục tiêu

Viết Data Dictionary mô tả tất cả trường thông tin mà người dùng tương tác trong US này, và Business Rules cấp US (BR-U) kế thừa và chuyên biệt hóa từ BR-F của FEAT cha. Toàn bộ phải dùng kiểu dữ liệu và ngôn ngữ nghiệp vụ — tuyệt đối không có từ kỹ thuật.

---

## Phần A: Data Dictionary

### Hành động A1: Thu thập danh sách trường dữ liệu

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

### Hành động A2: Viết bảng Data Dictionary

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

### Kiểu dữ liệu nghiệp vụ được phép dùng:

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

### Từ kỹ thuật KHÔNG được dùng trong Data Dictionary:

```
❌ varchar, nvarchar, int, bigint, decimal, float, boolean, bit
❌ nullable, NOT NULL, DEFAULT, CONSTRAINT
❌ foreign key, primary key, index
❌ string, integer, object, array, enum
❌ JSON, XML, Base64, BLOB
```

---

### Hành động A3: Hỏi BA về trường còn thiếu

```
Data Dictionary đề xuất có [N] trường. BA xem lại:
1. Có trường nào còn thiếu không?
2. Có ràng buộc nào cần bổ sung không?
3. Trường nào cần thêm giá trị mặc định không?
```

---

## Phần B: Business Rules (BR-U)

### Hành động B1: Phân tích BR-F từ FEAT cha

Lấy danh sách BR-F đã đọc ở Step 01. Phân loại:

**Loại 1 — BR-F áp dụng nguyên trạng cho US này:** Kế thừa trực tiếp, đổi mã BR-F → BR-U và ghi chú "Kế thừa từ BR-F00X".

**Loại 2 — BR-F cần chuyên biệt hóa (specialise):** Kế thừa nhưng có thêm điều kiện cụ thể hơn cho US này. Ghi chú "Specialise BR-F00X" và mô tả sự khác biệt.

**Loại 3 — BR-F không áp dụng cho US này:** Bỏ qua — thuộc US khác.

**Loại 4 — BR mới chỉ có ở US này:** Phát sinh từ AC hoặc edge case, không có trong BR-F.

---

### Hành động B2: Viết từng BR-U

**Format bắt buộc:**

```markdown
- **BR-U001 ([Tên ngắn]):** [Mô tả quy tắc nghiệp vụ đầy đủ]  
  *(Specialise BR-F001 — thêm điều kiện: [mô tả sự khác biệt])*

- **BR-U002 ([Tên ngắn]):** [Mô tả quy tắc nghiệp vụ đầy đủ]  
  *(Kế thừa BR-F002)*

- **BR-U003 ([Tên mới]):** [Mô tả quy tắc nghiệp vụ phát sinh từ US này]  
  *(BR mới — không có tương ứng tại FEAT cha)*
```

### Quy tắc đánh số BR-U:

- Format: `BR-U[số thứ tự 3 chữ số]`
- Bắt đầu từ `BR-U001`
- Tăng dần: BR-U001, BR-U002, BR-U003...
- Không trùng với BR-F của FEAT cha (chúng là 2 namespace khác nhau)

### Hành động B3: Kiểm tra BR từ AC

Rà soát lại toàn bộ AC đã viết ở Step 03:
- Mỗi ràng buộc (validation) trong AC phải có BR-U tương ứng
- Mỗi điều kiện nghiệp vụ trong Given/Then phải được BR hóa

**Ví dụ:**
- AC-003 Then: "Hệ thống không cho phép lưu nếu khoảng thời gian trùng"
  → Phải có: `BR-U001 (No-Overlap): Hai kỳ công của cùng đối tượng áp dụng không được có khoảng thời gian chồng chéo.`

---

### Hành động B4: Thêm Gợi ý phát triển tương lai (bắt buộc)

**Bắt buộc** phải có ít nhất 1 mục "Gợi ý phát triển tương lai" ở cuối phần BR:

```markdown
- **Gợi ý phát triển tương lai:** [Mô tả tính năng hoặc quy tắc có thể bổ sung trong tương lai khi nghiệp vụ phát triển thêm]
```

Gợi ý phải:
- Liên quan đến nghiệp vụ của US này
- Không phải yêu cầu hiện tại (nằm ngoài scope US)
- Cụ thể và có giá trị nghiệp vụ rõ ràng
- Ví dụ: "Tự động tạo kỳ công năm tiếp theo dựa trên cấu hình năm hiện tại"

---

### Hành động B5: Tự validate — Kiểm tra "Zero Kỹ thuật"

Quét toàn bộ nội dung Data Dictionary và Business Rules vừa viết. Tìm các từ sau:

**Danh sách từ cấm:**
```
API, endpoint, HTTP, GET, POST, PUT, DELETE, PATCH,
database, DB, table, column, row, record, schema, index,
varchar, nvarchar, int, bigint, decimal, float, boolean, bit,
null, nullable, NOT NULL, DEFAULT, FOREIGN KEY, PRIMARY KEY,
component, interface, DTO, Command, Query, Handler, Repository,
Service, Controller, Model, Entity, Middleware,
async, await, Task<>, IEnumerable, List<>, Dictionary,
JSON, XML, YAML, CSV (chỉ cấm trong context kỹ thuật),
response, request, payload, body, header, token, JWT,
string, integer, object, array, enum (trong context lập trình)
```

**Nếu tìm thấy từ cấm:** Thay thế bằng từ nghiệp vụ tương đương:
- `varchar(100)` → `Văn bản (tối đa 100 ký tự)`
- `boolean` → `Checkbox (Có/Không)`
- `nullable` → `Không bắt buộc`
- `foreign key` → `Liên kết với [tên nghiệp vụ]`

---

## Kết quả đầu ra Step 05

Trình BA review:

```
--- DATA DICTIONARY + BUSINESS RULES (Draft) ---

### Data Dictionary ([N] trường)
[Bảng Data Dictionary]

### Business Rules
[Danh sách BR-U]
[Gợi ý phát triển tương lai]

Kiểm tra Zero Kỹ thuật: [PASSED / FAILED - liệt kê từ cần sửa]

BA có muốn chỉnh sửa không?
```

---

## Chuyển sang Step tiếp theo

Sau khi BA approve, đọc và thực thi: `./steps/step-06-write-uiux-tracking.md`
