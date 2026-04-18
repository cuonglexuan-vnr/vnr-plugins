---
name: vnr-ba-us-check
description: 'Validate US đạt chuẩn "Ready for PBI" — kiểm tra đủ AC, BR, Activity Diagram, Zero Kỹ thuật, trace về FAC. Trigger: "ba us check", "check us", "validate us [id]"'
---

# Workflow: ba-us-check

## Mục tiêu

Kiểm tra US đã đạt chuẩn "Ready" để chuyển sang `ba-pbi-compose`. Không sửa — chỉ báo cáo lỗi cụ thể và gợi ý fix.

---

## Đầu vào

Nhận US ID hoặc đường dẫn file US. Nếu chưa có, hỏi:
```
US nào cần check? (ID hoặc đường dẫn file)
```

---

## Checklist đầy đủ (13 tiêu chí)

Đọc file US, kiểm tra từng tiêu chí:

| # | Tiêu chí | Pass nếu | Fail nếu |
|---|---|---|---|
| 1 | US Statement | Có đủ "Là / Tôi muốn / Để" | Thiếu bất kỳ phần nào |
| 2 | Out of Scope | Có ít nhất 1 mục | Trống |
| 3 | Acceptance Criteria | Có ≥ 2 AC, mỗi AC có Given/When/Then | Thiếu AC hoặc thiếu format |
| 4 | Activity Diagram | Có Mermaid flowchart TD | Thiếu hoặc không render được |
| 5 | Data Dictionary | Có bảng với ≥ 2 trường | Thiếu hoặc chỉ có 1 trường |
| 6 | Business Rules | Có ≥ 1 BR-U với số thứ tự | Không có BR hoặc không có mã BR-U |
| 7 | Cascade trace | BR-U trace về BR-F, AC trace về FAC | Không có ghi chú kế thừa |
| 8 | Zero Kỹ thuật | 0 từ kỹ thuật trong toàn bộ file | Có từ: API, DB, column, component... |
| 9a | UI/UX — Screen Inventory | Có ≥ 1 màn hình được đặt tên nghiệp vụ và mô tả mục đích | Thiếu section hoặc chỉ có tên, không có mô tả |
| 9b | UI/UX — State Coverage | Mỗi màn hình có ≥ 2 trạng thái được mô tả (loading/empty/error/success) | Tất cả màn hình đều thiếu bảng trạng thái |
| 9c | UI/UX — Navigation Flow | Có mô tả luồng điều hướng giữa các màn hình (≥ 1 bước) | Không có phần luồng điều hướng |
| 9d | UI/UX — Wireframe Ref | Nếu `HAS_WIREFRAME = true`: có link/path tham chiếu trong từng màn hình | Wireframe được cung cấp nhưng không được tham chiếu |
| 10 | Status frontmatter | `status: Draft` hoặc `Ready` | Thiếu frontmatter |

> **9d chỉ áp dụng** khi frontmatter của US có `wireframe_input` hoặc `HAS_WIREFRAME = true`. Nếu không có wireframe, tiêu chí 9d = N/A (bỏ qua khi tính điểm).

---

## Output

```
══════════════════════════════════════════
US CHECK: {US-ID}
══════════════════════════════════════════

✅ PASS (10/12):  ← (9d tính là N/A nếu không có wireframe → tổng = 12 hoặc 13)
   [1]  US Statement       — OK
   [2]  Out of Scope       — OK
   [3]  AC (Given/When/Then) — OK (5 ACs)
   [4]  Activity Diagram   — OK
   [5]  Data Dictionary    — OK
   [6]  Business Rules     — OK
   [7]  Cascade trace      — OK
   [8]  Zero Kỹ thuật      — OK
   [9a] Screen Inventory   — OK (2 màn hình)
   [10] Status frontmatter — OK

❌ FAIL (2/12):
   [9b] State Coverage — Màn hình "Biểu mẫu" thiếu trạng thái Loading và Error
   [9c] Navigation Flow — Không có phần mô tả luồng điều hướng

⬜ N/A (1):
   [9d] Wireframe Ref — Không có wireframe

Kết quả: NOT READY ❌
Cần fix 2 vấn đề UX trước khi chạy /vnr-ba-pbi-compose

Gợi ý fix:
• [9b]: Thêm bảng "Trạng thái hiển thị" cho màn hình "Biểu mẫu" — ít nhất Loading + Error state
• [9c]: Thêm section "Luồng điều hướng" vào phần UI/UX — chạy /vnr-ba-us-refine --section=uiux
══════════════════════════════════════════
```

Nếu pass tất cả:
```
Kết quả: READY ✅
US [{US-ID}] đạt chuẩn (13/13 hoặc 12/12 nếu 9d = N/A). Có thể chạy /vnr-ba-pbi-compose.
```

---

## Ghi kết quả vào Quality Log

Sau khi check xong (PASS hoặc FAIL), **luôn** thêm 1 dòng vào `_product/us-quality-log.md`:

```
| {YYYY-MM-DD} | {US-ID} | {EPIC-ID} | {PASS ✅ / FAIL ❌} | {N}/{total} | {mã lỗi hoặc -} | |
```

**Quy tắc mã lỗi:**
- `1-statement` → thiếu phần "Là/Tôi muốn/Để"
- `2-out-of-scope` → thiếu Out of Scope
- `3-ac-format` → AC thiếu Given/When/Then
- `4-diagram` → thiếu Activity Diagram
- `5-data-dict` → thiếu Data Dictionary
- `6-br` → thiếu BR-U
- `7-cascade` → không trace về BR-F/FAC
- `8-zero-tech` → có từ kỹ thuật
- `9a-screen-inv` → thiếu Screen Inventory
- `9b-state-cov` → thiếu State Coverage
- `9c-nav-flow` → thiếu Navigation Flow
- `9d-wire-ref` → thiếu Wireframe Reference
- `10-status` → thiếu frontmatter status

Xác nhận sau khi ghi:
```
📝 Đã ghi vào us-quality-log.md: {US-ID} — {PASS/FAIL}
```
