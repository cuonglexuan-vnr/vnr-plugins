---
# ============================================================================
# FRONTMATTER METADATA
# Phần này được generate tự động từ Step 00a (Generate Metadata)
# ============================================================================
id: {MOD}-E{NN}-F{NN}-U{NN}
title: {Tên User Story}
version: 1.0
status: Draft
created: {YYYY-MM-DD}
last_updated: {YYYY-MM-DD}
author: {Tên BA}

# Liên kết
parent_feat: {MOD}-E{NN}-F{NN}
parent_epic: {MOD}-E{NN}
module: {MOD}

# Phân loại
actor: {ACTOR}
priority: {P1 | P2 | P3}
segments: {All | Specific segments}

# BA điền thủ công
ui_screens:
  - "{Tên màn hình nghiệp vụ}"

# Agent điền sau khi ba-pbi-compose chạy
pbi_id:
screen_codes: []
---

# {MOD}-E{NN}-F{NN}-U{NN} — {Tên User Story}

**Module:** {MOD} | **EPIC:** [{MOD}-E{NN}](../../../README.md) | **FEAT:** [{MOD}-E{NN}-F{NN}](../FEAT.md) | **Actor:** {ACTOR} | **Version:** {1.0}

---

## 0. 📌 Metadata

<!-- Generate tự động từ frontmatter, không cần điền thủ công -->

| Mục | Giá trị |
|---|---|
| **US ID** | {MOD}-E{NN}-F{NN}-U{NN} |
| **Title** | {Tên ngắn gọn User Story} |
| **Version** | 1.0 |
| **Status** | Draft / Ready / In Progress / Done |
| **Created** | {YYYY-MM-DD} |
| **Author** | {Tên BA} |
| **Epic** | [{MOD}-E{NN}](../../../README.md) |
| **FEAT** | [{MOD}-E{NN}-F{NN}](../FEAT.md) |
| **Actor** | {ACTOR} |
| **Priority** | P1 / P2 / P3 |
| **Segments** | All / {Specific segments} |

---

## 1. 📝 User Story Statement

<!-- Viết theo format bắt buộc: Là / Tôi muốn / Để -->
<!-- Phải trace về FAC của FEAT cha -->

> **Là** {Actor},  
> **Tôi muốn** {Hành động cụ thể},  
> **Để** {Giá trị nghiệp vụ mang lại}.

**Trace FAC:** FAC-001, FAC-002

**Segments áp dụng:**
- {Segment 1} — {Đặc điểm}
- {Segment 2} — {Đặc điểm}
- Hoặc: Áp dụng cho tất cả segments

**Phạm vi KHÔNG bao gồm (Out of Scope):**
- {Item 1 — thuộc US khác hoặc FEAT khác}
- {Item 2 — tính năng nice-to-have nằm ngoài scope}

---

## 2. 📖 Mô Tả Nghiệp Vụ

<!-- Viết từ Step 02b - Business Context -->
<!-- Bao gồm: Bối cảnh, Master-Detail, Ví dụ, Thuật ngữ -->

### Bối cảnh nghiệp vụ
{Mô tả ngắn gọn bối cảnh, lý do cần US này}

### Cấu trúc dữ liệu (nếu có Master-Detail)
{Mô tả quan hệ Master-Detail, ví dụ: 1 Kỳ công có nhiều Chi tiết phân bổ theo phòng ban}

### Ví dụ minh họa
{Bảng ví dụ cụ thể về nghiệp vụ}

| {Cột 1} | {Cột 2} | {Cột 3} |
|---|---|---|
| {Giá trị mẫu} | {Giá trị mẫu} | {Giá trị mẫu} |

### Thuật ngữ đặc thù
- **{Thuật ngữ 1}**: {Định nghĩa}
- **{Thuật ngữ 2}**: {Định nghĩa}

---

## 3. ⚙️ Business Rules

<!-- Generate từ Step 05b - Write Business Rules -->
<!-- Phân loại 5 loại: Specialise, Inherit, New, Relax, Override -->
<!-- Mỗi BR-U phải trace về BR-F hoặc ghi "BR mới" -->

### BR-U001 ({Tên ngắn — Ví dụ: No-Overlap})
{Mô tả quy tắc nghiệp vụ đầy đủ — ví dụ: Hai kỳ công của cùng đối tượng áp dụng không được có khoảng thời gian chồng chéo.}

*(Specialise BR-F001 — thêm điều kiện: {mô tả sự khác biệt so với BR-F})*

---

### BR-U002 ({Tên ngắn — Ví dụ: Required-Fields})
{Mô tả quy tắc — ví dụ: Các trường Tháng, Tên kỳ, Ngày bắt đầu, Ngày kết thúc là bắt buộc trước khi lưu.}

*(Kế thừa BR-F002)*

---

### BR-U003 ({Tên ngắn — Ví dụ: Date-Range-Valid})
{Mô tả quy tắc mới — ví dụ: Ngày bắt đầu phải nhỏ hơn Ngày kết thúc ít nhất 1 ngày.}

*(BR mới — không có tương ứng tại FEAT cha)*

---

**Gợi ý phát triển tương lai:**
- {Tính năng có thể bổ sung — ví dụ: Tự động tạo kỳ công năm tiếp theo dựa trên cấu hình năm hiện tại}

---

## 4. ✅ Acceptance Criteria

<!-- Viết từ Step 03 - Write AC -->
<!-- Phân loại theo 5 nhóm: Happy Path, Validation, Toggle/Conditional, Save/Submit, Unsaved Changes -->
<!-- Mỗi AC phải có: Trace FAC, Given/When/Then, Business Rules -->

### AC-001: {Tên scenario — Happy Path}
**Trace:** FAC-001 ({Tên FAC})

**Given** (Điều kiện ban đầu):
- {Mô tả trạng thái hệ thống/người dùng ở điều kiện ban đầu}
- {Mô tả điều kiện tiên quyết nếu có}

**When** (Hành động người dùng):
- {Mô tả cụ thể hành động mà người dùng thực hiện}

**Then** (Kết quả mong đợi):
- {Hệ thống phản hồi như thế nào — cụ thể, quan sát được}
- {Dữ liệu được lưu/hiển thị như thế nào}
- {Thông báo nào hiển thị nếu có}

---

### AC-002: {Tên scenario — Sad Path / Validation}
**Trace:** FAC-001 ({Tên FAC})

**Given** {Trạng thái}  
**When** {Hành động}  
**Then** {Kết quả — lỗi, cảnh báo, không cho phép}

---

### AC-003: {Tên scenario — Edge Case}
**Trace:** FAC-002 ({Tên FAC})

**Given** {Trạng thái đặc biệt}  
**When** {Hành động}  
**Then** {Kết quả xử lý edge case}

---

{... Thêm AC khác nếu cần ...}

---

## 5. 📊 Activity Diagram

<!-- Generate từ Step 04 - Draw Activity Diagram -->
<!-- Dùng Mermaid flowchart TD, phải cover tất cả AC -->

```mermaid
flowchart TD
    classDef default font-size:11px,line-height:1.2

    A([Bắt đầu]) --> B[Người dùng mở màn hình\n{Tên màn hình}]
    B --> C[Điền thông tin:\n{Field 1}, {Field 2}]
    C --> D{Đã điền đủ\nthông tin bắt buộc?}
    D -->|Chưa đủ| E[/Thông báo: Vui lòng\nđiền đầy đủ thông tin/]
    E --> C
    D -->|Đủ rồi| F[[Hệ thống kiểm tra\nràng buộc nghiệp vụ]]
    F --> G{Có vi phạm\nràng buộc không?}
    G -->|Có vi phạm| H[/Thông báo lỗi:\n{Nội dung lỗi cụ thể}/]
    H --> C
    G -->|Không vi phạm| I[Người dùng nhấn Lưu]
    I --> J[[Hệ thống ghi nhận\ndữ liệu mới]]
    J --> K[/Thông báo thành công:\n{Nội dung cụ thể}/]
    K --> L[{Màn hình tiếp theo}\ncập nhật hiển thị]
    L --> Z([Kết thúc])
```

**Coverage:**
- AC-001: Happy path → A → B → C → D → F → G → I → J → K → L → Z
- AC-002: Validation → A → B → C → D → E → C
- AC-003: Edge case → A → B → C → D → F → G → H → C

---

## 6. 🗂️ Data Dictionary

<!-- Generate từ Step 05a - Write Data Dictionary -->
<!-- Liệt kê TẤT CẢ trường dữ liệu, dùng kiểu nghiệp vụ (KHÔNG dùng kiểu kỹ thuật) -->

| Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Ghi chú |
|---|---|:---:|---|
| {Tên trường 1} | Văn bản | Có | Tối đa 100 ký tự. Mặc định: "{Giá trị mặc định}" |
| {Tên trường 2} | Ngày | Có | Phải nhỏ hơn {Trường 3} |
| {Tên trường 3} | Ngày | Có | Phải lớn hơn {Trường 2} |
| {Tên trường 4} | Danh sách đơn chọn | Không | Nguồn: {Tên danh mục} |
| {Tên trường 5} | Checkbox | Không | Mặc định: Có |

**Kiểu dữ liệu nghiệp vụ:**
- Văn bản, Số, Ngày, Ngày (MM/YYYY), Khoảng ngày
- Danh sách đơn chọn, Danh sách đa chọn, Checkbox
- Tệp đính kèm, Hình ảnh, Văn bản nhiều dòng

---

## 7. 📝 Validation Messages (VM)

<!-- Generate từ Step 05c - Write Validation Messages -->
<!-- Phân loại 4 loại: Error, Warning, Success, Info -->
<!-- Mỗi VM phải trace về BR và AC -->

<!-- Generate từ Step 05c - Write Validation Messages -->
<!-- Phân loại 4 loại: Error, Warning, Success, Info -->
<!-- Mỗi VM phải trace về BR và AC -->

### A. 🔴 Errors (Lỗi)

| Mã VM | Nội dung message | Khi nào hiển thị | BR | AC | Vị trí | Thời gian |
|---|---|---|---|---|---|---|
| VM-E01 | "{Trường X} không được để trống" | Khi submit mà trường bắt buộc trống | BR-U002 | AC-002 | Field error | Đến khi sửa |
| VM-E02 | "Khoảng thời gian đã trùng với kỳ công {Tên kỳ}" | Khi vi phạm BR-U001 | BR-U001 | AC-002 | Form error | Đến khi sửa |
| VM-E03 | "Ngày bắt đầu phải nhỏ hơn Ngày kết thúc" | Khi vi phạm BR-U003 | BR-U003 | AC-002 | Field error | Đến khi sửa |

---

### B. 🟡 Warnings (Cảnh báo)

| Mã VM | Nội dung message | Khi nào hiển thị | BR | AC | Vị trí | Thời gian |
|---|---|---|---|---|---|---|
| VM-W01 | "Thay đổi ngày sẽ ảnh hưởng đến [N] bản ghi. Bạn có chắc không?" | Khi sửa kỳ công đã có dữ liệu liên quan | BR-U00X | AC-003 | Confirm dialog | Đến khi chọn |

---

### C. 🟢 Success (Thành công)

| Mã VM | Nội dung message | Khi nào hiển thị | BR | AC | Vị trí | Thời gian |
|---|---|---|---|---|---|---|
| VM-S01 | "Kỳ công {Tên kỳ} đã được tạo thành công" | Sau khi lưu thành công | - | AC-001 | Toast success | 3-5 giây |
| VM-S02 | "Kỳ công {Tên kỳ} đã được cập nhật" | Sau khi sửa thành công | - | AC-003 | Toast success | 3-5 giây |

---

### D. ℹ️ Info (Thông tin)

| Mã VM | Nội dung message | Khi nào hiển thị | BR | AC | Vị trí | Thời gian |
|---|---|---|---|---|---|---|
| VM-I01 | "Chưa có kỳ công nào. Nhấn 'Thêm mới' để bắt đầu." | Khi danh sách rỗng | - | AC-00X | Empty state | Đến khi có data |
| VM-I02 | "{Trường X} sẽ tự động điền theo format {Format}" | Hiển thị dưới trường X | - | AC-001 | Info inline | Theo điều kiện |

---

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

---

## 8. 📱 UI/UX Mô tả

<!-- Generate từ Step 06a, 06b - UI/UX Description + UX Evaluation -->
<!-- Bao gồm: Màn hình, Trạng thái, Luồng điều hướng, UX Evaluation -->

**Màn hình liên quan:** {Tên màn hình nghiệp vụ}  
**Figma:** {Link nếu có}

---

### Màn hình 1: {Tên màn hình — ví dụ: Danh sách Kỳ công}

**Mục đích:** {Người dùng dùng màn hình này để xem danh sách, tìm kiếm, và quản lý kỳ công}

**Nguồn:** [Wireframe frame #X] hoặc [Suy ra từ AC-001]

**Các thành phần hiển thị:**
- {Thanh tìm kiếm — góc trên bên trái}
- {Nút "Thêm mới" — góc trên bên phải}
- {Bảng danh sách — giữa màn hình, có phân trang}
- {Cột hành động: Sửa, Xóa — cột cuối bảng}

**Trạng thái hiển thị:**
| Trạng thái | Khi nào | Giao diện / Thông báo |
|---|---|---|
| Đang tải | Sau khi mở màn hình | Hiển thị spinner "Đang tải..." |
| Có dữ liệu | Khi có bản ghi | Bảng danh sách hiển thị đầy đủ |
| Rỗng | Chưa có bản ghi | VM-I01: "Chưa có kỳ công nào. Nhấn 'Thêm mới' để bắt đầu." |
| Lỗi hệ thống | Khi tải thất bại | "Không thể tải dữ liệu. Vui lòng thử lại." + nút "Thử lại" |

**Trạng thái của nút:**
| Nút | Trạng thái ban đầu | Điều kiện thay đổi |
|---|---|---|
| Nút "Lưu" | Bị khóa | Khi điền đủ thông tin bắt buộc |
| Nút "Xóa" | Ẩn | Khi bản ghi có thể xóa được (chưa sử dụng) |

**Thông báo & phản hồi:**
- Thành công: VM-S01, VM-S02
- Lỗi validation: VM-E01, VM-E02, VM-E03
- Cảnh báo: VM-W01

**Tham chiếu wireframe:** [Frame #X trong {Figma URL}] hoặc [Chưa có wireframe]

---

### Màn hình 2: {Tên màn hình — ví dụ: Form Tạo/Sửa Kỳ công}

{Mô tả tương tự Màn hình 1}

---

**Luồng điều hướng:**
1. Màn hình Danh sách → Nhấn "Thêm mới" → Màn hình Form Tạo mới
2. Màn hình Form → Nhấn "Lưu" thành công → Quay về Màn hình Danh sách
3. Màn hình Form → Nhấn "Hủy" → Quay về Màn hình Danh sách (không lưu)
4. Màn hình Danh sách → Nhấn "Sửa" → Màn hình Form Chỉnh sửa

---

### UX Evaluation

**Kết quả đánh giá 6 tiêu chí:**

| Tiêu chí | Kết quả | Ghi chú |
|---|---|---|
| C1: Completeness | ✅ Đủ | Mọi AC đều có màn hình tương ứng |
| C2: State Coverage | ✅ Đủ | 4 trạng thái: Loading, Data, Empty, Error |
| C3: Feedback | ✅ Đủ | Mọi hành động đều có VM phản hồi |
| C4: Error Prevention | ✅ Đủ | Validation inline + Nút Lưu khóa khi chưa đủ |
| C5: Consistency | ✅ Đủ | Tên nút, message nhất quán |
| C6: Wireframe Coverage | ✅ / N/A | {Nếu có wireframe: đã cover đủ} |

**Kết luận:** PASS ✅

---

## 9. 📈 Tracking & Analytics

<!-- Generate từ Step 06c - Tracking Analytics -->
<!-- Phân loại: Audit (bắt buộc) vs Analytics (cải thiện UX) -->

| Sự kiện | Khi nào xảy ra | Dữ liệu ghi lại | Loại |
|---|---|---|---|
| {Event nghiệp vụ — VD: PayPeriodCreated} | Khi tạo kỳ công thành công | UserID, Tháng, Tên kỳ, Ngày bắt đầu/kết thúc | Audit |
| {Event — VD: PayPeriodUpdated} | Khi sửa kỳ công thành công | UserID, PayPeriodID, Các trường đổi (old → new) | Audit |
| {Event — VD: PayPeriodDeleted} | Khi xóa kỳ công | UserID, PayPeriodID, Tên kỳ | Audit |
| {Event — VD: FormAbandoned} | Người dùng hủy giữa chừng | UserID, Screen, Số trường đã điền | Analytics |
| {Event — VD: ValidationError} | Gặp lỗi validation | UserID, ErrorCode, FieldName | Analytics |

**Cột Loại:**
- **Audit** = Kiểm toán bắt buộc (tuân thủ pháp lý)
- **Analytics** = Hành vi người dùng (cải thiện UX)

---

## 10. 🔗 Traceability

<!-- Generate từ Step 07 - Generate Traceability -->
<!-- Bao gồm: AC↔BR, VM↔BR↔AC, Dependencies -->

### Ma trận AC ↔ BR

| AC | BR liên quan |
|---|---|
| AC-001 | - (Happy path, không liên quan BR cụ thể) |
| AC-002 | BR-U001, BR-U002, BR-U003 |
| AC-003 | BR-U001 |

---

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

---

### Dependencies

| Type | ID | Description |
|---|---|---|
| Feature | {MOD}-E{NN}-F{NN} | US này thuộc FEAT cha |
| Epic | {MOD}-E{NN} | Thuộc EPIC cha |
| Depends On | {MOD}-E{XX}-F{YY}-U{ZZ} | US này cần US khác hoàn thành trước |
| Blocks | {MOD}-E{XX}-F{YY}-U{ZZ} | US này block US khác |

---

## 11. 📌 Change Log

<!-- Tự động update từ Step 08 hoặc UPDATE_US workflow -->
<!-- Mỗi lần update: tăng version + ghi lại thay đổi -->

| Version | Date | Changed By | Description | Task ID |
|---|---|---|---|---|
| 1.0 | {YYYY-MM-DD} | {BA Name} | Initial version — tạo US từ FEAT {FEAT-ID} | - |
| 1.1 | {YYYY-MM-DD} | {BA Name} | 🆕 Thêm AC-004 cho edge case mới | {TASK-XXX} |
| 1.2 | {YYYY-MM-DD} | {BA Name} | ✏️ Cập nhật BR-U002: thêm điều kiện X | {TASK-YYY} |

