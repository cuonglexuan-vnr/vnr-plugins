# Step 01 — Load Product Context

## Mục tiêu

Nạp toàn bộ product context từ `_product/` trước khi bắt đầu research. Đây là bước căn chỉnh: hiểu sản phẩm đang bán cho ai, theo nguyên tắc gì, để research đúng hướng.

---

## Hành động 1: Đọc Product Vision

Đọc `_product/product-vision.md`. Trích xuất và ghi nhớ:
- Phân khúc khách hàng mục tiêu (high-tech / sản xuất / dịch vụ / DNNN)
- Triết lý thiết kế sản phẩm ("VN-first", không phải bản dịch nước ngoài)
- Top pain points mà sản phẩm giải quyết

---

## Hành động 2: Đọc Product Principles

Đọc `_product/product-principles.md`. Ghi nhớ:
- Configurable vs Hardcode — sản phẩm chọn hướng nào?
- Audit trail policy
- Multi-tenant strategy
- Các quyết định kiến trúc đã chốt (không được propose trái lại)

---

## Hành động 3: Đọc VN Business Context

Đọc `_product/vn-business-context.md`. Ghi nhớ:
- Luật Lao động VN ảnh hưởng đến domain đang research
- Đặc điểm văn hóa từng nhóm DN liên quan
- Edge case library tổng quan

---

## Hành động 4: Xác định phân khúc ưu tiên

Từ input của BA (phân khúc khách hàng ưu tiên) + product vision, xác định:

```
Research lens chính: [High-tech / Sản xuất / Dịch vụ / Tất cả]
Luật VN liên quan: [liệt kê nếu có — BHXH, BLLD, Thông tư...]
Constraint sản phẩm liên quan: [từ product-principles]
```

---

## Kết quả Step 01

Thông báo cho BA:
```
✅ Product context đã load:
   - Phân khúc ưu tiên: {X}
   - Lens research: {Y}
   - Constraint cần nhớ: {Z}

→ Bắt đầu research domain: "{Tên domain}"
```

Sau đó đọc: `./steps/step-02-competitor-analysis.md`
