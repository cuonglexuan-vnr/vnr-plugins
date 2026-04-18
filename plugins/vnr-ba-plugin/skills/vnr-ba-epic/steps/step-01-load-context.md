# Step 01 — Load Context

## Mục tiêu

Nạp toàn bộ context cần thiết trước khi bắt đầu viết EPIC. Tránh hỏi BA những thứ đã có trong research.

---

## Hành động 1: Tìm và đọc Research Brief

Tìm file research trong `Module/{MODULE}/_discovery/research-*.md`.

Nếu tìm thấy:
- Đọc toàn bộ Research Brief
- Ghi nhớ: Feature Matrix, VN Constraints, Edge Cases, FEAT Candidates đề xuất, Risk, Câu hỏi còn mở

Nếu không tìm thấy:
```
Không tìm thấy Research Brief cho module này.
Tôi sẽ tiến hành với kiến thức domain có sẵn.
Gợi ý: Sau khi xong EPIC, chạy /vnr-ba-researcher để bổ sung research cho lần sau.
```

---

## Hành động 2: Đọc Product Context & Ground Rules

Đọc nhanh:
- `_product/product-vision.md` → Định vị sản phẩm, phân khúc
- `_product/product-principles.md` → Các quyết định kiến trúc đã chốt
- `_product/ba-ground-rules.md` → **BẮT BUỘC** — các quy tắc BA phải tuân thủ khi viết EPIC này

Từ `ba-ground-rules.md`, ghi nhớ:
- Version hiện tại (để báo cáo)
- GR-001: Danh sách từ kỹ thuật cấm (Zero Kỹ thuật)
- GR-002: Quy tắc cascade (BR-E → BR-F → BR-U; EAC → FAC → AC)
- GR-010: Product Principles trace table yêu cầu
- GR-011: Audit Trail requirement
- GR-013: Segment Awareness
- Toàn bộ lessons ở Part III (nếu có) — đây là bài học từ EPIC trước

---

## Hành động 3: Đọc Module _index (nếu có)

Tìm `Module/{MODULE}/_index.md`. Nếu có, đọc để hiểu:
- Các EPIC đã có trong module
- Phạm vi tổng thể của module
- Tránh viết EPIC trùng lặp với EPIC đã có

---

## Hành động 4: Kiểm tra EPIC ID

Tìm các EPIC đã có trong thư mục `Module/{MODULE}/Epics/`. Xác định EPIC ID tiếp theo:

```
Format: {MODULE}-EPIC-{XXX}
Ví dụ: ATT-EPIC-003
```

---

## Kết quả Step 01

Báo cáo ngắn cho BA:
```
✅ Context đã load:
   - Research Brief:    {Có / Không có}
   - EPIC ID mới:       {MODULE}-EPIC-{XXX}
   - EPIC đã có:        {N}
   - Ground Rules:      v{X.X.X} ({N} GRs, {N} lessons)
   - Constraint cần nhớ: {Từ product-principles}

→ Bắt đầu viết EPIC: "{Tên EPIC}"
```

Sau đó đọc: `./steps/step-02-foundation.md`
