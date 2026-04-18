# Step 07 — Finalize: Tạo file US + Cập nhật FEAT

## Mục tiêu

Tổng hợp toàn bộ nội dung đã viết qua 6 steps, tạo file US hoàn chỉnh theo đúng đường dẫn chuẩn, và cập nhật FEAT cha để phản ánh US mới được thêm vào.

---

## Phần A: Tổng hợp nội dung US

### Hành động A1: Sinh US ID

Xác định ID mới cho US dựa trên số US hiện có trong FEAT cha (Section 6 "Danh sách US"):

```
Format: {MOD}-E{NN}-F{NN}-U{NN}
Ví dụ:  IDP-E01-F02-U03
        ATT-E02-F01-U07
```

**Quy tắc đánh số:**
- `{MOD}` = module code của FEAT cha (đọc từ frontmatter `module:`)
- `E{NN}` = EPIC number trong FEAT cha ID (đọc từ `parent_epic:`)
- `F{NN}` = FEAT number (đọc từ frontmatter `id:` của FEAT cha)
- `U{NN}` = đếm số dòng đang có trong Section 6 "Danh sách US" của FEAT cha → +1
- Nếu FEAT chưa có US nào: `U01`
- NN luôn 2 chữ số (01, 02, ..., 99)

**Ví dụ:** FEAT cha có id `IDP-E01-F02`, Section 6 đang có 3 US → US mới = `IDP-E01-F02-U04`

> **Nguồn sự thật:** FEAT.md Section 6 "Danh sách US" — KHÔNG tự tăng số mà không đọc từ file này.

### Hành động A2: Xác định đường dẫn file

```
Module/{MOD}/Epics/{MOD}-E{NN}_{EPIC-Name-Slug}/Features/{MOD}-E{NN}-F{NN}_{FEAT-Name-Slug}/Stories/{MOD}-E{NN}-F{NN}-U{NN}_{US-Name-Slug}.md
```

Ví dụ:
```
Module/ATT/Epics/ATT-E02_Dieu_Phoi_Ca/Features/ATT-E02-F01_Lap_Lich_Ca/Stories/ATT-E02-F01-U03_Tao_Ca_Lam_Viec.md
```

Quy tắc đặt tên file:
- Dùng dấu gạch dưới `_` thay khoảng trắng
- Không dấu tiếng Việt trong tên file (dùng không dấu)
- Slug phản ánh ngắn gọn User Story (3-5 từ)

---

## Phần B: Render file US hoàn chỉnh

Tổng hợp từ tất cả steps đã qua, render file US theo template sau:

```markdown
---
id: {US-ID}
parent_feat: {FEAT-ID}
module: {MODULE}
actor: {ACTOR}
priority: {P1 | P2 | P3}
status: Draft
created: {YYYY-MM-DD}
last_updated: {YYYY-MM-DD}

# BA điền
ui_screens:
  - "{Tên màn hình nghiệp vụ}"

# Agent điền sau khi ba-pbi-compose chạy
pbi_id:
screen_codes: []
---

# {US-ID} — {Tên User Story}

**Module:** {MODULE} | **FEAT:** {FEAT-ID} | **Actor:** {ACTOR}

---

## 1. User Story Statement

> **Là** {Actor},  
> **Tôi muốn** {Hành động cụ thể},  
> **Để** {Giá trị nghiệp vụ mang lại}.

**Phạm vi KHÔNG bao gồm (Out of Scope):**
- {Item 1}
- {Item 2}

---

## 2. Acceptance Criteria

{Danh sách AC theo format Given/When/Then}

---

## 3. Activity Diagram

```mermaid
{Mermaid flowchart TD}
```

---

## 4. Data Dictionary

| Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Ghi chú |
|---|---|:---:|---|
{Các dòng data}

---

## 5. Business Rules

{Danh sách BR-U}

---

## 6. UI/UX Mô tả

**Màn hình liên quan:** {Tên màn hình nghiệp vụ}

{Mô tả UI/UX từng màn hình}

---

## 7. Tracking & Analytics

| Event | Trigger | Mục đích |
|---|---|---|
{Bảng tracking}
```

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
