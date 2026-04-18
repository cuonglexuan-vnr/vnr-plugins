# Step 07 — Generate Traceability Matrices

## Mục tiêu

Tạo các ma trận traceability để track mối quan hệ giữa AC ↔ BR, VM ↔ BR ↔ AC, và Dependencies với US/FEAT/EPIC khác. Giúp Dev/QA/BA dễ dàng trace nguồn gốc của từng requirement.

---

## Hành động 1: Tạo Ma trận AC ↔ BR

**Mục đích:** Mỗi AC test BR nào?

**Logic tự động:**
- Duyệt qua từng AC đã viết (Step 03)
- Với mỗi AC, tìm các BR được nhắc trong Given/When/Then
- Map AC → danh sách BR

**Format bảng:**

```markdown
### Ma trận AC ↔ BR

| AC | BR liên quan |
|---|---|
| AC-001 | - (Happy path, không liên quan BR cụ thể) |
| AC-002 | BR-U001, BR-U002, BR-U003 |
| AC-003 | BR-U001 |
```

**Kiểm tra:**
- Mỗi BR-U phải xuất hiện ít nhất 1 lần trong ma trận (coverage)
- Nếu có BR-U không được test → cảnh báo: "⚠️ BR-U00X chưa có AC cover"

---

## Hành động 2: Tạo Ma trận VM ↔ BR ↔ AC

**Mục đích:** Mỗi VM xuất phát từ BR nào, test AC nào?

**Logic tự động:**
- Lấy bảng VM đã có link BR + AC (từ Step 05c)
- Consolidate thành ma trận

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

**Lưu ý:** Ma trận này đã có sẵn trong Step 05c, chỉ cần copy vào phần Traceability.

---

## Hành động 3: Xác định Dependencies

**Mục đích:** US này phụ thuộc hoặc block US/FEAT/EPIC nào?

**Logic tự động:**

1. **Parent links (bắt buộc có):**
   - Feature: {FEAT-ID} từ Step 01
   - Epic: {EPIC-ID} từ Step 01

2. **Depends On (phụ thuộc):**
   - Tìm trong AC: có nhắc "đã có {entity}" hoặc "đã thiết lập {data}" không?
   - Tìm trong BR-F: có BR nào nhắc đến US khác không?
   - Nếu có → đó là dependency

3. **Blocks (chặn):**
   - US này có phải là prerequisite của US khác không?
   - **Logic detect Blocks:**
     1. Đọc tất cả US files trong thư mục `Features/{FEAT-ID}/Stories/`
     2. Parse phần **Dependencies** của từng US file
     3. Nếu US khác có `Depends On: {US-ID hiện tại}` 
        → US hiện tại Blocks US đó
     4. Consolidate danh sách Blocks
   - **Nếu không có US files khác hoặc không có dependency ngược:** Không ghi Blocks

**Format bảng:**

```markdown
### Dependencies

| Type | ID | Description |
|---|---|---|
| Feature | {MOD}-E{NN}-F{NN} | US này thuộc FEAT cha |
| Epic | {MOD}-E{NN} | Thuộc EPIC cha |
| Depends On | {MOD}-E{XX}-F{YY}-U{ZZ} | US này cần US khác hoàn thành trước |
| Blocks | {MOD}-E{XX}-F{YY}-U{ZZ} | US này block US khác |
```

**Nếu không có Depends On/Blocks:** Chỉ ghi Feature + Epic.

---

## Kết quả đầu ra Step 07

Hiển thị traceability đã tạo:

```
════════════════════════════════════════════════════════════
✓ HOÀN THÀNH STEP 07 — TRACEABILITY MATRICES

🔗 Ma trận AC ↔ BR: [N] mappings
   ✓ BR coverage: [M]/[M] BRs được test

🔗 Ma trận VM ↔ BR ↔ AC: [X] mappings
   ✓ Mọi Error/Warning đều có BR

📌 Dependencies:
   - Feature: {FEAT-ID}
   - Epic: {EPIC-ID}
   - Depends On: {N} dependencies
   - Blocks: {M} US khác
════════════════════════════════════════════════════════════
```

**Tự động chuyển sang Step 08** — đọc và thực thi: `./steps/step-08-finalize.md`
