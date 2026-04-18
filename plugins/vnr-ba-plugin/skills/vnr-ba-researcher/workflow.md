# Workflow: ba-researcher — Research Domain trước khi viết EPIC

## Mục tiêu

Research toàn diện một domain nghiệp vụ HRM trước khi BA bắt đầu viết EPIC. Output là một Research Brief chất lượng cao: competitor analysis, VN business context, enterprise patterns, edge cases phức tạp, và đánh giá risk — để `ba-epic` không cần research lại từ đầu.

---

## Nguyên tắc

- **Research trước, viết sau.** Không bắt đầu viết EPIC khi chưa có Research Brief.
- **Grounded in reality.** Mọi claim phải có nguồn (tên sản phẩm, tên công ty, tên tài liệu) — không phỏng đoán.
- **VN-first lens.** Đọc thị trường VN trước, rồi mới compare với quốc tế.
- **Edge case library.** Phải liệt kê ít nhất 5 edge case phức tạp thường bị bỏ sót.
- **Dừng và hỏi** nếu domain quá rộng để research trong 1 session — đề xuất phân tách.

---

## Đầu vào yêu cầu

Khi nhận trigger, kiểm tra xem BA đã cung cấp chưa:

1. **Tên domain** cần research (ví dụ: "Đánh giá 360°", "Quản lý ca làm việc", "IDP")
2. **Module** thuộc về (ATT, PER, APR, IDP...)
3. **Phân khúc khách hàng** ưu tiên (nếu có: high-tech, sản xuất, dịch vụ...)

Nếu chưa có:
```
Để research domain, tôi cần:
1. Domain cần nghiên cứu là gì? (ví dụ: "Đánh giá năng lực 360°")
2. Thuộc module nào? (ATT / PER / APR / IDP / PAY...)
3. Phân khúc khách hàng ưu tiên? (hoặc "tất cả")
```

---

## Cấu trúc 5 Steps

| Step | File | Nội dung |
|------|------|----------|
| 1 | `steps/step-01-load-product-context.md` | Đọc `_product/` để hiểu định vị sản phẩm |
| 2 | `steps/step-02-competitor-analysis.md` | Research competitor VN + quốc tế |
| 3 | `steps/step-03-vn-business-context.md` | VN labor law, enterprise culture, operational patterns |
| 4 | `steps/step-04-edge-case-discovery.md` | Liệt kê edge cases phức tạp thường bị bỏ sót |
| 5 | `steps/step-05-synthesize-brief.md` | Tổng hợp Research Brief + đánh giá risk, feed vào ba-epic |

---

## Khởi động

**Bắt đầu bằng cách đọc `./steps/step-01-load-product-context.md`.**
