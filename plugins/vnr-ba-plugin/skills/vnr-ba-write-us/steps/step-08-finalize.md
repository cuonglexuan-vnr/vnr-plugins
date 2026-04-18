# Step 08 — Finalize: Tạo file US + Cập nhật FEAT

## Mục tiêu

Tổng hợp toàn bộ nội dung đã viết qua 10 steps (00, 00a, 01, 02, 02b, 03, 04, 05a, 05b, 05c, 06a, 06b, 06c, 07), tạo file US hoàn chỉnh theo template 11 phần, và cập nhật FEAT cha để phản ánh US mới được thêm vào.

---

## Phần A: Tổng hợp nội dung US

### Hành động A1: Sinh US ID

US ID đã được tạo ở Step 00. Lấy từ metadata đã có.

### Hành động A2: Xác định đường dẫn file

```
Module/{MOD}/Epics/{MOD}-E{NN}_{EPIC-Name-Slug}/Features/{MOD}-E{NN}-F{NN}_{FEAT-Name-Slug}/Stories/{MOD}-E{NN}-F{NN}-U{NN}_{US-Name-Slug}.md
```

Ví dụ:
```
Module/{MOD}/Epics/{MOD}-E{NN}_{EPIC-Name-Slug}/Features/{MOD}-E{NN}-F{NN}_{FEAT-Name-Slug}/Stories/{MOD}-E{NN}-F{NN}-U{NN}_{US-Name-Slug}.md
```

Quy tắc đặt tên file:
- Dùng dấu gạch dưới `_` thay khoảng trắng
- Không dấu tiếng Việt trong tên file (dùng không dấu)
- Slug phản ánh ngắn gọn User Story (3-5 từ)

---

## Phần B: Render file US hoàn chỉnh theo template 11 phần

### ⚠️ QUY ĐỊNH BẮT BUỘC: Đọc template ĐỘNG tại runtime

**NEVER hard-code thứ tự section.** ALWAYS đọc từ `./templates/us-template.md` tại thời điểm thực thi Step 08.

### B1. Đọc template và extract thứ tự section

**Hành động bắt buộc:**
1. READ file `./templates/us-template.md`
2. EXTRACT tất cả headers matching pattern: `^## (\d+)\. (.+)$`
3. BUILD danh sách: `section_order = [(0, "Metadata"), (1, "User Story Statement"), ...]`

**Output mẫu:**
```
Template sections detected:
  0. 📌 Metadata
  1. 📝 User Story Statement
  2. 📖 Mô Tả Nghiệp Vụ
  3. ✅ Acceptance Criteria
  4. 📊 Activity Diagram
  5. 🗂️ Data Dictionary
  6. ⚙️ Business Rules
  7. 📝 Validation Messages
  8. 📱 UI/UX Mô tả
  9. 📈 Tracking & Analytics
  10. 🔗 Traceability
  11. 📌 Change Log
```

### B2. Map content từ Steps → Template Sections

Sau khi có `section_order` từ template, map content đã viết ở các steps trước:

```python
content_map = {
    0: metadata_from_step_00a,
    1: statement_from_step_02,
    2: business_context_from_step_02b,
    3: ac_from_step_03,
    4: activity_diagram_from_step_04,
    5: data_dict_from_step_05a,
    6: br_from_step_05b,
    7: vm_from_step_05c,
    8: uiux_from_step_06a_06b,
    9: tracking_from_step_06c,
    10: traceability_from_step_07,
    11: changelog_from_step_00a
}
```

### B3. Assemble file theo thứ tự template

```python
final_content = []
for (section_num, section_title) in section_order:
    final_content.append(f"## {section_num}. {section_title}")
    final_content.append(content_map[section_num])
```

**Lưu ý:**
- Nếu template thêm/bớt section trong tương lai, logic tự động adapt
- Không cần sửa step-08-finalize.md khi template thay đổi

> **Sử dụng template:** `./templates/us-template.md`

---

## Phần C: Kiểm tra cuối — Zero Kỹ thuật

Trước khi tạo file, quét toàn bộ nội dung US một lần cuối. Tìm các từ kỹ thuật cấm:

```
API, endpoint, HTTP, GET, POST, PUT, DELETE,
database, DB, table, column, schema,
component, interface, DTO, Command, Query, Handler,
Service, Controller, Repository, Entity,
async, await, token, JWT, payload,
string, integer, boolean, null, array, enum (trong context lập trình),
varchar, int, bigint, decimal, float
```

**Nếu tìm thấy:** Sửa ngay trước khi ghi file. Không được ghi file khi còn từ cấm.

**Kết quả kiểm tra:** Báo cáo cho BA:
```
Zero Kỹ thuật check: PASSED ✅ (0 từ kỹ thuật phát hiện)
```
hoặc:
```
Zero Kỹ thuật check: FAILED ❌ — Đã tự sửa các từ: [liệt kê]
```

---

## Phần D: Tạo file US

Tạo file US tại đường dẫn đã xác định ở Hành động A2.

Xác nhận với BA:
```
✅ Đã tạo file: Module/{MODULE}/.../{US-ID}_{US-Name}.md
```

---

## Phần E: Cập nhật FEAT cha

Mở file FEAT cha và cập nhật 3 nơi:

### E1: Cập nhật `us_count` trong frontmatter

```yaml
# Trước
us_count: 3

# Sau
us_count: 4
```

### E2: Thêm US mới vào bảng "Danh sách US" (hoặc Actor-Task Matrix)

Tìm section "Danh sách US" hoặc "Actor-Task Matrix" trong FEAT, thêm dòng:

```markdown
| {ACTOR} | {Tên Task} | {Mô tả ngắn} | [{US-ID}]({relative-path-to-US-file}) |
```

### E3: Cập nhật `last_updated` trong frontmatter FEAT

```yaml
last_updated: {YYYY-MM-DD ngày hôm nay}
```

Xác nhận với BA:
```
✅ Đã cập nhật FEAT: {FEAT-ID} (us_count: {N-1} → {N})
```

---

## Phần F: Kiểm tra Edge Case mới — Đề xuất bổ sung EC Library

Sau khi tạo file US, đối chiếu các edge cases đã xử lý trong US này với `_product/edge-cases/_index.md`:

**Tìm EC mới:** Xem trong AC và BR-U của US vừa viết — có tình huống phức tạp nào chưa có trong library không?

```
ĐỐI CHIẾU EC LIBRARY
══════════════════════════════════════
✅ EC đã có trong library (sử dụng trong US này):
   [Danh sách EC-ID tham chiếu]

🆕 EC mới phát hiện (nếu có):
   → {Mô tả tình huống phức tạp trong AC/BR chưa có trong library}
   → Đề xuất ID: EC-{MOD}-{NNN}

Nếu không có EC mới: "Không phát hiện EC mới trong US này."
══════════════════════════════════════
```

**Nếu có EC mới:** Hỏi BA:
```
Phát hiện {N} edge case mới trong US này chưa có trong EC Library.
Bạn muốn thêm vào _product/edge-cases/_index.md không?
(a) Thêm — tôi sẽ ghi ngay
(b) Để sau — tôi sẽ nhắc lại khi chạy ba-retrospective
(c) Không cần thiết
```

**Nếu BA đồng ý (a):** Ghi vào bảng phù hợp trong `_product/edge-cases/_index.md`.

---

## Phần G: Thông báo kết quả cuối

```
═══════════════════════════════════════════════
✅ User Story hoàn thành!

📄 File tạo mới:
   {đường dẫn đầy đủ}

📋 Tóm tắt:
   ID:     {US-ID}
   Actor:  {ACTOR}
   Status: Draft
   ACs:    {N} criteria
   BRs:    {N} rules

🔗 Đã cập nhật FEAT cha:
   {FEAT-ID} — us_count: {N}

📚 EC Library:
   {N} EC mới thêm hoặc "Không có EC mới"

⏭  Bước tiếp theo gợi ý:
   • Chạy /vnr-ba-us-check để validate US này
   • Chạy /vnr-ba-us để viết US tiếp theo trong FEAT
   • Khi đủ US: chạy /vnr-ba-pbi-compose để map sang PBI
═══════════════════════════════════════════════
```
