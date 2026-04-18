# Workflow: ba-pbi-compose — Map US → PBI

## Mục tiêu

Cầu nối giữa BA Layer (US) và Dev Layer (PBI). Nhận danh sách US đã "Ready", quyết định pattern mapping (1→1 / nhiều→1 / 1→nhiều), tạo PBI entries, cập nhật traceability map.

---

## Nguyên tắc

- **Đọc `_product/us-pbi-map.md` trước tiên** — không được compose trùng US đã mapped.
- **3 pattern mapping:**
  - `nhiều→1`: Nhiều US nhỏ cùng entity → gộp vào 1 PBI
  - `1→1`: 1 US vừa phải → 1 PBI
  - `1→nhiều`: 1 US phức tạp → chia thành nhiều PBI theo layer (FE/BE/Engine)
- **Sau compose:** Cập nhật frontmatter của từng US với `pbi_id`; thêm entry vào map với `status: pending-spec`.
- **Không tạo PBI spec** — chỉ tạo entry trong map. Dev tự chạy `vnr-ba-specify` sau đó.
- **Phân tách trách nhiệm rõ ràng:**
  - `ba-pbi-compose` → sở hữu `_product/us-pbi-map.md`
  - `vnr-ba-specify` → sở hữu `specs/{pbi-id}/` folder
  - Không xung đột — hai tool chạy độc lập ở hai thời điểm khác nhau

---

## Đầu vào yêu cầu

Nhận một trong:
1. **Danh sách US ID** cần compose (ví dụ: `ATT-US-001, ATT-US-002, ATT-US-003`)
2. **FEAT ID** — compose tất cả US Ready trong FEAT đó
3. **Module** — compose tất cả US Ready trong module

---

## Cấu trúc 4 Steps

| Step | File | Nội dung |
|------|------|----------|
| 1 | `steps/step-01-load-map.md` | Đọc us-pbi-map.md, xác định US chưa mapped |
| 2 | `steps/step-02-analyze-pattern.md` | Phân tích pattern mapping cho từng US |
| 3 | `steps/step-03-propose-mapping.md` | Đề xuất mapping, hỏi BA confirm |
| 4 | `steps/step-04-finalize.md` | Cập nhật map + frontmatter US + thông báo |

---

## Khởi động

**Bắt đầu bằng cách đọc `./steps/step-01-load-map.md`.**
