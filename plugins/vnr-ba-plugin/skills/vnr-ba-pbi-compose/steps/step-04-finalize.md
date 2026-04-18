# Step 04 — Finalize: Cập nhật Map + Frontmatter US

## Hành động 1: Cập nhật _product/us-pbi-map.md

Mở `_product/us-pbi-map.md`.

Thêm các entries mới vào section "Đã mapping":

```markdown
| {US-ID} | {Tên US} | PBI-{N}-{slug} | {Pattern A/B/C} | {Gộp với US khác / —} | pending-spec | — |
```

> **Lưu ý:** Khi 1 US được tách thành nhiều PBI (Pattern C), thêm **nhiều dòng** — mỗi PBI 1 dòng với cùng US ID.

Cập nhật frontmatter của map:
```yaml
last_updated: {YYYY-MM-DD}
total_us_ready: {N}
mapped: {M}           # tăng lên
pending_spec: {P}     # số PBI chưa có spec (= số PBI mới tạo lần này)
not_mapped: {R}       # giảm xuống
```

---

## Hành động 2: Cập nhật frontmatter từng US

Với mỗi US đã được mapped, mở file US và cập nhật:

```yaml
# Trước
pbi_id:
screen_codes: []

# Sau (Pattern B hoặc A)
pbi_id: PBI-{N}-{slug}
# screen_codes: [] ← để trống, dev điền sau khi có design

# Sau (Pattern C — 1 US → nhiều PBI)
pbi_id: PBI-{N1}-{slug1}, PBI-{N2}-{slug2}
# screen_codes: [] ← để trống
```

---

## Hành động 3: Sinh danh sách vnr-ba-specify cho Dev

Với mỗi PBI mới được tạo trong compose này, in ra lệnh `vnr-ba-specify` tương ứng. Dev sẽ chạy các lệnh này để tạo `specs/{pbi-id}/` folder.

> **Quy tắc đặt tên PBI:**
> - Format: `PBI-{NN}-{slug}` — số thứ tự 2 chữ số, slug kebab-case
> - Ví dụ: `PBI-05-create-idp-goal`, `PBI-10-progress-ui`
> - Slug nên ngắn gọn, mô tả chức năng chính

---

## Hành động 4: Thông báo kết quả

```
══════════════════════════════════════════════
✅ Compose hoàn thành!

📊 Kết quả:
   {N} US → {M} PBI mới

📋 Chi tiết:
   PBI-{N1}-{slug1}: {Tên} ← [{US-ID-1}, {US-ID-2}] (Pattern A)
   PBI-{N2}-{slug2}: {Tên} ← [{US-ID-3}] (Pattern B)
   PBI-{N3}-{slug3}: {Tên} ← [{US-ID-4}] (Pattern C, phần FE)
   PBI-{N4}-{slug4}: {Tên} ← [{US-ID-4}] (Pattern C, phần Engine)

🗺  Traceability map đã cập nhật:
   _product/us-pbi-map.md
   Mapped: {M} / {Total} US  |  pending-spec: {P}

✏️  Frontmatter đã cập nhật:
   {N} file US (thêm pbi_id)

⏭  Bước tiếp theo cho Dev — chạy vnr-ba-specify:

   /vnr-ba-specify PBI-{N1}: {Mô tả ngắn về PBI-{N1}}
   /vnr-ba-specify PBI-{N2}: {Mô tả ngắn về PBI-{N2}}
   /vnr-ba-specify PBI-{N3}: {Mô tả ngắn về PBI-{N3}}
   /vnr-ba-specify PBI-{N4}: {Mô tả ngắn về PBI-{N4}}

   Sau khi vnr-ba-specify chạy xong, cập nhật spec_path trong map:
   → _product/us-pbi-map.md  (đổi status: pending-spec → has-spec, điền spec_path)

   Sau đó chạy /vnr-ba-specify để lên kế hoạch implement.
══════════════════════════════════════════════
```

---

## Lưu ý phân tách trách nhiệm

| Tool | Sở hữu | Không làm |
|---|---|---|
| `ba-pbi-compose` | `_product/us-pbi-map.md` | Không tạo `specs/` folder |
| `vnr-ba-specify` | `specs/{pbi-id}/` folder | Không ghi vào `us-pbi-map.md` |
| Dev | Cầu nối — cập nhật `spec_path` trong map sau khi spec tạo xong | — |
