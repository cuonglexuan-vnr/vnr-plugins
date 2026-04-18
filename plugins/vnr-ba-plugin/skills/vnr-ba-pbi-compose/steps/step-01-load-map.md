# Step 01 — Load Traceability Map

## Hành động 1: Đọc us-pbi-map.md

Đọc `_product/us-pbi-map.md`.

Từ file này, xác định:
- Danh sách US **đã mapped** (`status: pending-spec` hoặc `has-spec`) — bỏ qua, không compose trùng
- Danh sách US **chưa mapped** (`not-mapped` hoặc chưa có entry)
- PBI ID số lớn nhất đang dùng trong section "Đã mapping" — để sinh PBI ID mới tiếp theo (PBI-{N+1})

---

## Hành động 2: Tìm US Ready

Từ input của BA (danh sách US ID / FEAT / Module), lọc ra các US:
- `status: Ready` hoặc `status: Draft` đã pass ba-us-check
- Chưa có `pbi_id` trong frontmatter

Liệt kê cho BA:
```
US sẵn sàng để compose:
• {US-ID-1} — {Tên US} [{FEAT-ID}]
• {US-ID-2} — {Tên US} [{FEAT-ID}]
• {US-ID-3} — {Tên US} [{FEAT-ID}]

US đã mapped (bỏ qua):
• {US-ID-X} → PBI-{N} (đã mapped)
```

Sau đó đọc: `./steps/step-02-analyze-pattern.md`
