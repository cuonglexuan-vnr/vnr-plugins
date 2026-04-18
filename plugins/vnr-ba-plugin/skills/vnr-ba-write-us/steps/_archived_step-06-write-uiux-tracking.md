# Step 06 — UI/UX Mô tả & Tracking/Analytics

## Mục tiêu

Xây dựng phần UI/UX của US dựa trên:
- **Wireframe** (nếu có) — phân tích wireframe và đối chiếu với AC
- **Toàn bộ US đã viết** (nếu KHÔNG có wireframe) — đọc AC (Step 03) + Activity Diagram (Step 04) + Business Rules & Data Model (Step 05) để suy luận màn hình, luồng tương tác, validation, và thông báo

Đánh giá sự đầy đủ theo tiêu chí UX chuẩn trước khi kết thúc step. Xác định tracking events.

---

## Nguyên tắc bất biến — Ngôn ngữ Nghiệp vụ

> **Quan trọng:** BA viết US bằng **ngôn ngữ nghiệp vụ**. Phần **Component Library Mapping** (B) là **phụ lục kỹ thuật tùy chọn** dành cho Dev — không bắt buộc phải có trong mọi US.

**DÙNG (ngôn ngữ nghiệp vụ):**
- "Màn hình Thiết lập Kỳ công"
- "Hộp thoại xác nhận xóa"
- "Biểu mẫu nhập thông tin"
- "Danh sách thả xuống chọn phòng ban"
- "Nút Lưu / Nút Hủy"
- "Thông báo thành công / thông báo lỗi"
- "Ô tìm kiếm", "Bộ lọc", "Dải phân trang"

**KHÔNG DÙNG (thuật ngữ kỹ thuật):**
- ❌ Tên component: `PayPeriodFormComponent`, `nz-modal`, `nz-table`
- ❌ Tên route: `/api/pay-periods`
- ❌ Tên file: `.html`, `.ts`, `.scss`
- ❌ Từ kỹ thuật: `ReactiveForm`, `router.navigate`, `MatDialog`

**Ngoại lệ:** Phần B (Component Library Mapping) được phép dùng tên kỹ thuật `nz-*` vì đây là **phụ lục cho Dev**, không phải nội dung chính của US.

---

## 📌 TL;DR — Những điểm BA cần nhớ

1. **CÓ wireframe:** Phân tích wireframe → Đối chiếu AC → Mô tả màn hình
2. **KHÔNG có wireframe:** Đọc Step 03+04+05 → Suy luận màn hình (B1) → Suy luận layout/validation/actions (C) → Mô tả chi tiết
3. **Mỗi màn hình phải có đủ:** A (Tree Structure), C (Layout Detail), D (4 screen states), E (Component states), F (Messages với AC reference)
4. **Mỗi thành phần phải có AC/BR reference** — đảm bảo truy vết được nguồn
5. **UX Evaluation phải PASS ✅** (7 tiêu chí: C1, C2a, C2b, C3, C4, C5, C6) trước khi chuyển Step 07
6. **Tracking Events:** Audit Trail (bắt buộc) + Analytics (tùy chọn)

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

### A3: Tự động đối chiếu Wireframe vs AC

So sánh màn hình trong wireframe với AC đã approve ở Step 03. Ghi nhận các điểm:

```
[INTERNAL LOG] Đối chiếu Wireframe vs AC:

✅ Wireframe có + AC cover:
   - Màn hình [X] → AC-001, AC-002

⚠️  Wireframe có nhưng CHƯA có AC cover:
   - [Màn hình / Trạng thái / Hành động] → Ghi vào Out of Scope hoặc note để refine sau

⚠️  AC có nhưng wireframe CHƯA thể hiện:
   - AC-[X]: [Mô tả] → Note: cần màn hình bổ sung
```

**Xử lý tự động:**
- Wireframe thiếu AC → Ghi chú "Cần AC bổ sung" trong phần UI/UX
- AC thiếu wireframe → Mô tả màn hình dựa trên AC

---

## Phần B: Mô tả UI/UX

### B1: Xác định danh sách màn hình

#### Khi **có wireframe**:

Dùng danh sách từ A2 làm nền, điều chỉnh theo góp ý BA.

#### Khi **KHÔNG có wireframe**:

**Đọc toàn bộ US đã viết ở các Step trước để phân tích và suy ra màn hình:**

1. **Đọc Step 03 (AC - Acceptance Criteria):**
   - Mỗi AC "When...Then..." thường tương ứng 1 màn hình hoặc 1 luồng tương tác
   - Xác định Actor nào thực hiện hành động gì → Cần màn hình nào
   - Ví dụ: AC-001 "When Admin tạo mới kỳ công" → Màn hình "Tạo mới kỳ công"

2. **Đọc Step 04 (Activity Diagram):**
   - Mỗi node hành động của Actor → 1 màn hình
   - Mỗi nhánh quyết định (Diamond) → có thể cần màn hình xác nhận
   - Ví dụ: Node "Nhập thông tin kỳ công" → Màn hình "Form nhập thông tin"

3. **Đọc Step 05 (Business Rules & Data Model):**
   - Business Rules cho biết **validation** gì → Màn hình cần hiển thị lỗi validation đó
   - Data Model cho biết **trường dữ liệu** nào → Màn hình cần input/output trường đó
   - Ví dụ: BR-001 "Khoảng thời gian không được trùng" → Màn hình cần hiển thị lỗi khi trùng

4. **Tổng hợp và liệt kê:**

```
[INTERNAL LOG] Phân tích từ AC + Activity Diagram + Business Rules:

Màn hình suy ra từ luồng nghiệp vụ:
#  | Tên màn hình                  | Nguồn phân tích                           | Mục đích
---|-------------------------------|-------------------------------------------|---------------------------
1  | [Tên màn hình]                | AC-00X, Activity node [Y]                 | Actor cần để: [hành động]
2  | [Tên hộp thoại xác nhận]      | Activity diamond [Z], BR-00X              | Xuất hiện khi: [điều kiện]
3  | [Tên màn hình danh sách]      | AC-00Y (liệt kê), Data Model: [Entity]    | Hiển thị danh sách [đối tượng]
...
```

💡 **Nguyên tắc phân tích:**
- 1 AC "Create/Update/Delete" → Thường cần 1 form màn hình
- 1 AC "View/List" → Thường cần 1 màn hình danh sách/chi tiết
- 1 Business Rule validation → Cần hiển thị lỗi trên màn hình tương ứng
- 1 Data Entity → Thường cần ít nhất 1 màn hình CRUD

### B2: Mô tả chi tiết từng màn hình

**Format bắt buộc cho mỗi màn hình:**

#### Màn hình: [Tên nghiệp vụ]

**Mục đích:** [Người dùng dùng màn hình này để làm gì]

**Nguồn:** [Wireframe frame #X] hoặc [Suy ra từ AC-00X]

---

##### A. Layout Specification (Tree Structure)

**Mục đích:** Cho Dev/UX thấy information architecture (cấu trúc phân cấp màn hình)

**Format:**

```
{Screen/Tab Name}
├── {Section/Group 1}
│   ├── {Component 1.1}
│   └── {Component 1.2}
├── {Section/Group 2}
│   └── {Component 2.1}
```

**Ký hiệu:**
- ⭐ (NEW) — Component mới (thuộc US này)
- ({US-ID} - đã có) — Component đã có (thuộc US khác, ghi rõ US-ID)
- [REMOVED] — Component bị xóa/thay thế

💡 **Best Practice:** 
- Tree structure giúp visualize cấu trúc trước khi code
- Ghi rõ US ownership (component thuộc US nào)
- **Khi không có wireframe:** Vẫn cố gắng vẽ tree structure dựa trên Data Model (entity/fields) và AC (sections/groups logic)

---

##### B. Component Library Mapping (Phụ lục kỹ thuật — tùy chọn)

> **Lưu ý:** Phần này là **phụ lục cho Dev**, không bắt buộc có trong mọi US. Chỉ thêm khi cần làm rõ component nào dùng cho feature phức tạp.

**Mục đích:** Cho Dev biết ng-zorro component nào dùng cho feature gì

**Format:**

| Component | ng-zorro tag | Use case |
|---|---|---|
| {UI element nghiệp vụ} | `nz-{component}` | {Vị trí cụ thể trong màn hình} |

💡 **Best Practice:** 
- Map 1 UI element → 1 ng-zorro component (không dùng generic "input")
- Ghi rõ "where it's used" (Dev biết tìm ở đâu)
- Dùng placeholder `{Section name}` thay vì hardcode "Section 6"

---

##### C. Section Layout Detail (ASCII/Text Mockup)

**Mục đích:** Show visual layout của từng section (không cần Figma)

#### **Khi CÓ wireframe/layout rõ ràng:**

Dùng ASCII mockup với Unicode emoji để mô tả visual:

```
☑ {Trường 1} 🔒
☑ {Trường 2} 🔒
☐ {Trường 3}
☐ {Trường 4}
```

```
[Toggle] {Tên toggle}: [ 🟢 ON ]

[Dropdown] {Tên dropdown}: [{Giá trị mặc định} ▼] ℹ️

📌 Note: {Ghi chú quan trọng về layout/behavior}
```

---

#### **Khi KHÔNG có wireframe:**

**Đọc toàn bộ US (AC + Activity Diagram + Business Rules + Data Model) để suy luận giao diện:**

**Bước 1: Xác định INPUT fields (trường nhập liệu)**

Từ **Data Model (Step 05)** → Liệt kê các trường cần nhập:

```
INPUT fields từ Data Model [{Entity}]:
- {Field 1} (kiểu: {type}, bắt buộc: {Y/N}) → UI: [Text input / Dropdown / Checkbox / ...]
- {Field 2} (kiểu: {type}, bắt buộc: {Y/N}) → UI: [...]
...
```

**Bước 2: Xác định VALIDATION rules**

Từ **Business Rules (Step 05)** → Liệt kê validation nào cần hiển thị:

```
VALIDATION cần hiển thị từ Business Rules:
- BR-001: {Quy tắc} → Hiển thị lỗi: "{Thông báo lỗi}" ở trường [{Field}]
- BR-002: {Quy tắc} → Disable nút [Lưu] khi {điều kiện}
...
```

**Bước 3: Xác định ACTIONS (hành động người dùng)**

Từ **AC & Activity Diagram (Step 03, 04)** → Liệt kê các nút/hành động:

```
ACTIONS từ AC & Activity Diagram:
- AC-001: "Admin tạo mới" → Nút [Tạo mới]
- AC-002: "Admin hủy bỏ" → Nút [Hủy]
- Activity node: "Xác nhận xóa" → Hộp thoại xác nhận với [Đồng ý] / [Hủy]
...
```

**Bước 4: Tổng hợp thành mô tả luồng tương tác**

```
📋 Luồng tương tác màn hình [{Tên màn hình}]:

1. Màn hình mở → Hiển thị form với {N} trường:
   - {Field 1} (bắt buộc, kiểu {type})
   - {Field 2} (tùy chọn, kiểu {type})
   ...

2. Người dùng điền {Field 1}:
   - Nếu vi phạm BR-001 → Hiển thị lỗi: "{Thông báo}" dưới trường
   - Nếu hợp lệ → Bỏ lỗi (nếu có)

3. Người dùng chọn {Field 2} từ dropdown:
   - Giá trị mặc định: [{Giá trị}]
   - Danh sách options: [{Option 1}, {Option 2}, ...]

4. Người dùng nhấn [Lưu]:
   - Kiểm tra: Tất cả trường bắt buộc đã điền? (BR-00X)
   - Nếu thiếu → Hiển thị lỗi tổng hợp: "Vui lòng điền đầy đủ thông tin bắt buộc"
   - Nếu đủ → Submit → Hiển thị thông báo thành công (AC-00Y)

5. Người dùng nhấn [Hủy]:
   - Nếu có thay đổi → Hiển thị hộp thoại xác nhận: "Bạn có thay đổi chưa lưu. Bạn có muốn lưu trước khi thoát không?"
   - Nếu không có thay đổi → Đóng màn hình ngay
```

💡 **Best Practice khi không có wireframe:**
- Dùng Unicode emoji (✅, 🔒, ℹ️, 📌) để mô tả visual state
- Ghi rõ **nguồn tham chiếu** (AC-00X, BR-00Y, Data Model Entity) cho mỗi thành phần
- Mô tả **luồng tương tác đầy đủ** từ mở màn hình → nhập liệu → submit → phản hồi
- Liệt kê **tất cả trạng thái có thể** (disabled, loading, error, success)

---

##### D. Trạng thái hiển thị (Screen-level States)

**Bắt buộc liệt kê đủ 4 trạng thái cơ bản của màn hình:**

| Trạng thái | Khi nào | Giao diện / Thông báo | Tham chiếu AC |
|---|---|---|---|
| Đang tải | Sau khi mở màn hình | Hiển thị chỉ báo đang tải | {AC-ID} |
| Có dữ liệu | Khi có bản ghi | Danh sách / form đã điền | {AC-ID} |
| Rỗng | Chưa có bản ghi | [Thông điệp gợi ý hành động — ví dụ: "Chưa có {đối tượng}. Nhấn 'Thêm mới' để bắt đầu."] | {AC-ID} |
| Lỗi hệ thống | Khi tải thất bại | [Thông điệp lỗi + nút thử lại] | {AC-ID} |

💡 **Khi KHÔNG có wireframe — suy luận từ AC:**
- **Đang tải:** Mỗi AC có "When...Then..." → Cần thời gian xử lý → Cần state "Đang tải"
- **Có dữ liệu:** AC "Then" mô tả kết quả thành công → State "Có dữ liệu"
- **Rỗng:** AC "View/List" khi chưa có bản ghi → State "Rỗng"
- **Lỗi hệ thống:** AC "Then" mô tả trường hợp thất bại (network, server error) → State "Lỗi hệ thống"

---

##### E. Trạng thái của trường / nút (Component-level States)

**Liệt kê trạng thái của các trường/nút tương tác:**

| Trường / Nút | Trạng thái ban đầu | Điều kiện thay đổi | Tham chiếu AC |
|---|---|---|---|
| Nút Lưu | Bị khóa (disabled) | Khi điền đủ thông tin bắt buộc | {AC-ID} |
| Nút Xóa | Ẩn | Khi bản ghi có thể xóa được | {AC-ID} |
| {Trường nhập} | Enabled | Disabled khi {điều kiện} | {AC-ID} |
| Nút Submit | Enabled | Đang submit (loading) khi nhấn | {AC-ID} |

💡 **Bao gồm các trạng thái:**
- **Enabled/Disabled** — Nút/trường có thể tương tác hay không
- **Loading** — Đang xử lý (spinner trên nút)
- **Validating** — Đang kiểm tra validation inline
- **Error** — Hiển thị lỗi validation

💡 **Khi KHÔNG có wireframe — suy luận từ BR & AC:**
- **Disabled state:** BR có điều kiện bắt buộc (required) → Nút Lưu disabled khi chưa đủ
- **Loading state:** AC "When nhấn {nút}" → "Then xử lý" → Nút cần state loading
- **Validation state:** BR có quy tắc validation → Trường cần hiển thị lỗi inline
- **Error state:** BR có thông báo lỗi → Trường/nút cần hiển thị lỗi

---

##### F. Thông báo & phản hồi

**Liệt kê tất cả thông báo/phản hồi UI cho mỗi hành động:**

| Loại | Nội dung cụ thể | Khi nào hiển thị | Tham chiếu AC |
|---|---|---|---|
| Thành công | "{Đối tượng} đã được {hành động} thành công" | Sau khi {hành động} thành công | {AC-ID} |
| Lỗi validation | "{Trường} {vi phạm quy tắc gì}" | Khi {điều kiện lỗi} | {AC-ID} |
| Cảnh báo | "Thay đổi {X} sẽ ảnh hưởng đến {N} {đối tượng}. Bạn có chắc không?" | Trước khi {hành động phá hủy} | {AC-ID} |
| Thông tin | "{Thông tin hữu ích cho người dùng}" | Khi {điều kiện} | {AC-ID} |

💡 **Best Practice:**
- Dùng placeholder `{Đối tượng}`, `{hành động}` thay vì hardcode "Kỳ công", "tạo"
- Mỗi thông báo phải có **AC tham chiếu** rõ ràng

💡 **Khi KHÔNG có wireframe — suy luận từ AC & BR:**
- **Thành công:** Từ AC "Then" mô tả kết quả thành công → Nội dung thông báo
- **Lỗi validation:** Từ BR error messages → Nội dung thông báo lỗi
- **Cảnh báo:** Từ AC có hành động phá hủy (delete, reset) → Cảnh báo xác nhận
- **Thông tin:** Từ AC/BR có ghi chú bổ sung → Tooltip/info message

---

**Tham chiếu wireframe:** [Frame #X trong {tên file/URL}] hoặc [Chưa có wireframe]

### B3: Luồng điều hướng giữa các màn hình

```markdown
**Luồng điều hướng:**
1. [Màn hình A] → Nhấn "[Tên nút/link]" → [Màn hình B]
2. [Màn hình B] → Nhấn "Lưu" thành công → Quay về [Màn hình A]
3. [Màn hình B] → Nhấn "Hủy" → Quay về [Màn hình A] (không lưu)
```

---

### B4: Ví dụ hoàn chỉnh (minh họa B2)

<details>
<summary>📖 Click để xem ví dụ đầy đủ của một màn hình</summary>

#### Màn hình: Thiết lập Hiển thị Báo cáo

**Mục đích:** Người dùng dùng màn hình này để tùy chỉnh các thông tin hiển thị trong báo cáo đánh giá

**Nguồn:** Suy ra từ AC-006, AC-007

---

##### A. Layout Specification (Tree Structure)

```
Màn hình Thiết lập Hiển thị Báo cáo
├── Section: Thông tin Nhân viên
│   ├── Checkbox: Họ và tên ⭐ (NEW)
│   ├── Checkbox: Mã nhân viên ⭐ (NEW)
│   ├── Checkbox: Phòng ban ⭐ (NEW)
│   └── Checkbox: Chức danh ⭐ (NEW)
├── Section: Tùy chỉnh Template
│   ├── Toggle: Ẩn thông tin cá nhân ⭐ (NEW)
│   ├── Upload: Logo công ty (US-002 - đã có)
│   └── Dropdown: Chọn template (US-002 - đã có)
└── Section: Kết quả Tổng hợp
    ├── Toggle: Hiển thị kết quả tổng hợp ⭐ (NEW)
    └── Dropdown: Nhóm cấp độ ⭐ (NEW)
```

---

##### B. Component Library Mapping (Phụ lục kỹ thuật — tùy chọn)

| Component | ng-zorro tag | Use case |
|---|---|---|
| Checkbox | `nz-checkbox` | Section Thông tin Nhân viên: 4 checkboxes |
| Toggle | `nz-switch` | Section Tùy chỉnh Template: Ẩn info; Section Kết quả: Hiển thị toggle |
| Upload | `nz-upload` | Section Tùy chỉnh Template: Logo upload |
| Dropdown | `nz-select` | Section Tùy chỉnh Template: Chọn template; Section Kết quả: Nhóm cấp độ |
| Tooltip | `nz-tooltip` | Info icons (ℹ️) bên cạnh labels |
| Toast | `nz-message` | Success/Error notifications sau khi Lưu |
| Modal | `nz-modal` | Confirm dialog khi có thay đổi chưa lưu |

---

##### C. Section Layout Detail (ASCII/Text Mockup)

**Section: Thông tin Nhân viên (Checkbox Layout Vertical):**

```
☑ Họ và tên 🔒
☑ Mã nhân viên 🔒
☑ Phòng ban 🔒
☐ Chức danh

📌 Note: 3 trường đầu luôn bắt buộc (locked), không thể bỏ chọn
```

**Section: Kết quả Tổng hợp:**

```
[Toggle] Hiển thị Kết quả tổng hợp: [ 🟢 ON ]

[Dropdown] Nhóm cấp độ: [Nhóm Chuẩn HRM ▼] ℹ️

📌 Note: Kết quả tổng hợp luôn hiển thị Mức 3 (13 tiêu chí) với 7 cột:
   Tiêu chí, Yêu cầu, Trung bình, Tỉ lệ đạt (%), Trọng số (%), Điểm, Icon
```

---

##### D. Trạng thái hiển thị (Screen-level States)

| Trạng thái | Khi nào | Giao diện / Thông báo | Tham chiếu AC |
|---|---|---|---|
| Đang tải | Sau khi mở màn hình | Hiển thị chỉ báo đang tải | AC-006 |
| Có dữ liệu | Khi đã có cấu hình lưu trước đó | Checkboxes/toggles/dropdowns hiển thị giá trị đã lưu | AC-006 |
| Mặc định (lần đầu) | Khi chưa có cấu hình | 3 checkbox bắt buộc đã tích, các trường khác chưa tích | AC-007 |
| Lỗi hệ thống | Khi tải thất bại | "Không thể tải cấu hình. Vui lòng thử lại." + nút "Thử lại" | AC-006 |

---

##### E. Trạng thái của trường / nút (Component-level States)

| Trường / Nút | Trạng thái ban đầu | Điều kiện thay đổi | Tham chiếu AC |
|---|---|---|---|
| Nút Lưu | Enabled | Disabled khi không có thay đổi nào | AC-007 |
| Nút Lưu | Enabled | Loading (spinner) khi đang submit | AC-007 |
| 3 Checkbox bắt buộc | Enabled + Checked | Luôn locked (không thể bỏ tích) | AC-006 |
| Toggle "Hiển thị kết quả" | ON | OFF khi người dùng toggle | AC-007 |
| Dropdown "Nhóm cấp độ" | Enabled | Disabled khi Toggle "Hiển thị kết quả" = OFF | AC-007 |

---

##### F. Thông báo & phản hồi

| Loại | Nội dung cụ thể | Khi nào hiển thị | Tham chiếu AC |
|---|---|---|---|
| Thành công | "Cấu hình hiển thị báo cáo đã được lưu thành công" | Sau khi nhấn "Lưu" thành công | AC-007 |
| Cảnh báo | "Bạn có thay đổi chưa lưu. Bạn có muốn lưu trước khi thoát không?" | Khi nhấn "Hủy" hoặc đóng màn hình khi có thay đổi | AC-007 |
| Lỗi hệ thống | "Không thể lưu cấu hình. Vui lòng thử lại." | Khi submit bị lỗi server | AC-007 |
| Thông tin | "Ít nhất 3 trường thông tin nhân viên phải được chọn" | Tooltip (ℹ️) bên cạnh Section Thông tin Nhân viên | AC-006 |

---

**Tham chiếu wireframe:** Chưa có wireframe

</details>

---

## Phần C: UX Evaluation — Kiểm tra Chất lượng UX

Tự động chạy checklist 6 tiêu chí UX trước khi kết thúc step:

### C1: Completeness — Đầy đủ màn hình

```
✅ / ⚠️  Mọi node hành động trong Activity Diagram có màn hình tương ứng không?
→ Kiểm tra: Đếm số nhánh có "Người dùng [làm gì]" trong diagram → so với số màn hình đã mô tả
```

**Ví dụ cách kiểm tra:**

```
Activity Diagram có 5 node hành động:
1. "Nhập thông tin kỳ công" → Cần màn hình: Form nhập thông tin ✅
2. "Kiểm tra validation" → Hiển thị trên màn hình Form (inline) ✅
3. "Xác nhận lưu" → Cần hộp thoại: Xác nhận lưu ✅
4. "Xem danh sách kỳ công" → Cần màn hình: Danh sách kỳ công ✅
5. "Xóa kỳ công" → Cần hộp thoại: Xác nhận xóa ✅

→ Kết quả: ✅ Đủ 5 màn hình/dialog
```

### C2: State Coverage — Đủ trạng thái

**C2a: Screen-level States (Trạng thái màn hình)**

```
✅ / ⚠️  Mỗi màn hình có đủ 4 trạng thái cơ bản không?
→ Loading: [✅/⚠️ thiếu ở màn hình {X}]
→ Empty State: [✅/⚠️ thiếu ở màn hình {Y}]
→ Error State: [✅/⚠️ thiếu ở màn hình {Z}]
→ Success State: [✅/⚠️ ...]
```

**C2b: Component-level States (Trạng thái component)**

```
✅ / ⚠️  Các trường/nút tương tác có đủ trạng thái không?
→ Disabled state (nút bị khóa khi chưa đủ điều kiện): [✅/⚠️ thiếu ở {nút X}]
→ Loading state (nút đang submit, hiển thị spinner): [✅/⚠️ thiếu ở {nút Y}]
→ Validation state (trường hiển thị lỗi inline): [✅/⚠️ thiếu ở {trường Z}]
→ Readonly state (trường chỉ xem, không chỉnh sửa): [✅/⚠️ ...]
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
C1  Completeness      : [✅ Đủ / ⚠️ Thiếu màn hình: {X}]
C2a Screen States     : [✅ Đủ / ⚠️ Thiếu trạng thái: {X} ở màn hình {Y}]
C2b Component States  : [✅ Đủ / ⚠️ Thiếu trạng thái: {X} ở {nút/trường Y}]
C3  Feedback          : [✅ Đủ / ⚠️ AC-{X} thiếu phản hồi UI]
C4  Error Prevention  : [✅ Đủ / ⚠️ Trường {X} chưa có inline validation]
C5  Consistency       : [✅ Đủ / ⚠️ Tên nút không đồng nhất: {X} vs {Y}]
C6  Wireframe Cov     : [✅ / ⚠️ / N/A — không có wireframe]

Kết quả: [PASS ✅ (tất cả ✅)] hoặc [CẦN BỔ SUNG ⚠️ ({N} điểm)]
════════════════════════════════════
```

**Xử lý tự động nếu có điểm ⚠️:**
- Ghi chú "⚠️ Cần bổ sung" trong phần UI/UX
- Liệt kê rõ điểm nào thiếu để BA có thể xử lý sau qua `/vnr-ba-us-refine`

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

**Ví dụ cụ thể:**

| Sự kiện | Khi nào xảy ra | Dữ liệu ghi lại | Loại |
|---|---|---|---|
| PayPeriod.Created | Sau khi Admin nhấn "Lưu" thành công | UserId, PayPeriodId, StartDate, EndDate, CreatedAt | Audit |
| PayPeriod.Updated | Sau khi Admin chỉnh sửa và lưu | UserId, PayPeriodId, ChangedFields (JSON: {field: {old, new}}), UpdatedAt | Audit |
| PayPeriod.Deleted | Sau khi Admin xác nhận xóa | UserId, PayPeriodId, DeletedAt, Reason (nếu có) | Audit |
| PayPeriod.ValidationError | Khi validation thất bại | UserId, FieldName, ErrorMessage, AttemptedValue, OccurredAt | Analytics |
| PayPeriod.FormAbandoned | Khi người dùng thoát form chưa lưu | UserId, FieldsFilled (%), AbandonedAt, TimeSpent (seconds) | Analytics |

---

## Kết quả đầu ra Step 06

Hiển thị tóm tắt UI/UX, UX Evaluation và Tracking đã tạo:

```
════════════════════════════════════════════════════════════
✓ HOÀN THÀNH STEP 06 — UI/UX & TRACKING

📱 UI/UX Mô tả: [N] màn hình
   [Danh sách màn hình đã mô tả]
   [Luồng điều hướng]

📊 UX Evaluation: [PASS ✅ / CẦN BỔ SUNG ⚠️]
   [Kết quả 6 tiêu chí]

📈 Tracking Events: [N] sự kiện
   [Bảng tracking events]
════════════════════════════════════════════════════════════
```

**Lưu ý:** BA có thể yêu cầu chỉnh sửa bất kỳ phần UI/UX hoặc Tracking nào sau khi xem toàn bộ US.

**Tự động chuyển sang Step 07** — đọc và thực thi: `./steps/step-07-generate-traceability.md`
