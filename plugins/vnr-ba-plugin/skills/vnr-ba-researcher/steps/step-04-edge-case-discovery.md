# Step 04 — Edge Case Discovery

## Mục tiêu

Liệt kê các tình huống phức tạp, bất thường, hoặc dễ bị bỏ sót trong domain đang research. Đây là bước quan trọng nhất để EPIC không bị "happy path only".

---

## Hành động 1: Đọc Edge Case Library từ _product/

Đọc `_product/edge-cases/_index.md` — tìm edge cases chung áp dụng cho domain này.

Đọc file edge case theo phân khúc nếu có liên quan:
- `_product/edge-cases/hightech.md`
- `_product/edge-cases/manufacturing.md`
- `_product/edge-cases/services.md`
- `_product/edge-cases/state-enterprise.md`

---

## Hành động 2: Phân tích edge cases theo 5 nhóm

### Nhóm 1 — Nhân sự lifecycle phức tạp
```
Câu hỏi cần trả lời:
- Điều gì xảy ra khi NV điều chuyển bộ phận GIỮA CHỪNG kỳ [domain]?
- Điều gì xảy ra khi NV nghỉ việc không hoàn thành kỳ [domain]?
- Điều gì xảy ra khi NV nghỉ thai sản / nghỉ ốm dài hạn?
- Điều gì xảy ra khi NV thăng chức TRONG kỳ [domain]?
- Điều gì xảy ra với NV mới vào giữa kỳ?
- Điều gì xảy ra với NV có 2 hợp đồng / vị trí kiêm nhiệm?
```

### Nhóm 2 — Quy trình & Phê duyệt
```
- Điều gì xảy ra khi người phê duyệt nghỉ phép / thay đổi?
- Điều gì xảy ra khi chuỗi phê duyệt bị gián đoạn?
- Ai có quyền can thiệp / override kết quả?
- Deadline bị trễ — hệ thống xử lý thế nào?
- Có thể rút lại phê duyệt đã cấp không?
```

### Nhóm 3 — Dữ liệu & Tính toán
```
- Công thức tính bị thay đổi TRONG kỳ thì kết quả cũ ảnh hưởng thế nào?
- Dữ liệu nguồn (từ module khác) bị sửa sau khi đã tính thì sao?
- Có trường hợp không tính được / kết quả vô nghĩa không?
- Dữ liệu lịch sử khi migrate từ hệ thống cũ — xử lý thế nào?
```

### Nhóm 4 — Đa đơn vị / Multi-entity
```
- NV thuộc nhiều phòng ban — áp dụng rule nào?
- Công ty có nhiều chi nhánh — rule có đồng nhất không?
- Khách hàng multi-company — data isolation thế nào?
```

### Nhóm 5 — Tình huống biên (Boundary conditions)
```
- Điều gì xảy ra ở ngày đầu / cuối kỳ?
- Điều gì xảy ra ở ngày đầu / cuối năm?
- Điều gì xảy ra khi giá trị = 0 / null / âm?
- Điều gì xảy ra khi có duplicate records?
```

---

## Hành động 3: Rating edge case

Với mỗi edge case tìm được, đánh giá:

```markdown
| Edge Case | Xác suất gặp | Mức độ phức tạp | Ảnh hưởng nghiệp vụ | Gợi ý xử lý |
|---|:---:|:---:|:---:|---|
| NV điều chuyển giữa kỳ | Cao | Cao | Cao | Cần US riêng |
| NV nghỉ thai sản | Trung bình | Cao | Cao | Cần AC trong US hiện tại |
| Phê duyệt hết hạn | Thấp | Thấp | Trung bình | BR trong US tương ứng |
```

**Phân loại xử lý:**
- **Cần US riêng**: Phức tạp đủ để là 1 story độc lập
- **Cần AC trong US hiện tại**: Thêm vào AC của US liên quan
- **Cần BR**: Định nghĩa rule nghiệp vụ trong US tương ứng
- **Out of scope v1**: Ghi nhận, defer sang phiên bản sau

---

## Hành động 4: Hỏi BA về missing edge cases

```
Tôi đã liệt kê {N} edge case. Theo kinh nghiệm của bạn với khách hàng:
1. Edge case nào hay gặp nhất mà tôi chưa liệt kê?
2. Edge case nào từng gây sự cố thực tế ở khách hàng?
3. Edge case nào nên để Out of scope v1?
```

---

## Hành động 5: Đối chiếu với EC Library — đề xuất cập nhật

Sau khi BA confirm danh sách edge case, đối chiếu với `_product/edge-cases/_index.md`:

```
ĐỐI CHIẾU VỚI EC LIBRARY
══════════════════════════════════════

✅ Đã có trong library (sử dụng lại):
   EC-GEN-001, EC-GEN-010, EC-ATT-001 ...

🆕 EC MỚI — chưa có trong library:
   [EC-{MOD}-???]: {Tên} — {Mô tả ngắn}
   → Đề xuất thêm vào library với ID: EC-{MOD}-{NNN}

Nếu không có EC mới: "Tất cả edge cases đã có trong library."
══════════════════════════════════════
```

Hỏi BA:
```
Có [N] EC mới phát hiện chưa có trong library.
Bạn muốn tôi thêm vào _product/edge-cases/_index.md không?
(a) Thêm tất cả
(b) Chọn lọc — tôi chỉ cần thêm [EC nào]
(c) Không thêm lần này
```

**Nếu BA đồng ý:** Thêm dòng vào bảng EC phù hợp (theo module) trong `_product/edge-cases/_index.md` với `Phát hiện bởi: ba-researcher — {domain-slug}`.

## Kết quả Step 04

Output: Danh sách edge case có rating + phân loại xử lý + danh sách EC mới đề xuất thêm vào library.

Sau khi BA confirm, đọc: `./steps/step-05-synthesize-brief.md`
