# Workflow: ba-constitution — Cập nhật BA Ground Rules

## Mục tiêu

Cập nhật file `_product/ba-ground-rules.md` theo đúng quy trình: version bump, Sync Impact Report, và kiểm tra xem step files nào cần nhắc BA review lại.

Đây là điểm duy nhất để thay đổi ground rules — không tự ý edit file trực tiếp.

---

## Nguyên tắc

- **Versioned.** Mỗi lần cập nhật phải bump version theo semver.
- **Không phá vỡ backward compatibility ngầm.** Nếu rule mới khiến US cũ có thể fail → đánh dấu MAJOR và cảnh báo BA.
- **Đề xuất trước, BA duyệt sau.** Không ghi file khi chưa được BA xác nhận.
- **Sync Impact Report** được ghi vào đầu file dưới dạng comment ẩn.

---

## Đầu vào

BA mô tả thay đổi cần làm. Ví dụ:
- "Thêm rule: AC cho US liên quan tới phê duyệt phải có ít nhất 2 sad path"
- "Sửa GR-004: empty state không cần mô tả nút nếu user không có quyền tạo"
- "Thêm lesson: Đừng viết BR về timeout — dev sẽ tự xử lý"
- "Thêm anti-pattern từ retro: AC quá dài (>10 AC) thường báo US cần tách"

---

## Hành động 1: Đọc file hiện tại

Đọc toàn bộ `_product/ba-ground-rules.md`. Xác định:
- Version hiện tại
- Section nào sẽ bị ảnh hưởng bởi thay đổi BA muốn
- Có rule nào conflict với thay đổi mới không

---

## Hành động 2: Phân loại thay đổi & đề xuất version bump

```
Phân tích thay đổi:
────────────────────────────────────────────
Loại thay đổi: [MAJOR / MINOR / PATCH]

Lý do:
• MAJOR nếu: rule mới có thể khiến US đã viết trước fail ba-us-check
• MINOR nếu: thêm rule mới, thêm lesson, thêm pattern/anti-pattern
• PATCH nếu: làm rõ ý, thêm ví dụ, sửa lỗi chính tả

Version đề xuất: {current} → {new}

Section bị ảnh hưởng:
• [Section tên] — [mô tả thay đổi]

US/FEAT nào có thể cần review lại:
• [Nếu MAJOR: liệt kê artifact có thể bị ảnh hưởng]
• [Nếu MINOR/PATCH: "Không ảnh hưởng artifact cũ"]
────────────────────────────────────────────

BA có đồng ý version bump từ {old} → {new} không?
```

---

## Hành động 3: Soạn nội dung mới

Draft phần thay đổi cụ thể (rule mới, lesson mới, anti-pattern mới...) theo format chuẩn của file:

```
--- NỘI DUNG MỚI ĐỀ XUẤT ---

[Nội dung mới viết theo format hiện tại của ba-ground-rules.md]

BA có muốn chỉnh sửa không?
```

---

## Hành động 4: Viết Sync Impact Report

Sau khi BA approve nội dung, soạn Sync Impact Report:

```markdown
<!--
## Sync Impact Report — v{old} → v{new}
Date: {YYYY-MM-DD}
Changed by: BA Team

### Version bump: {old} → {new}
Lý do: {giải thích ngắn}

### Rules thay đổi:
- [GR-00X] {tên}: {mô tả thay đổi — old → new}

### Rules thêm mới:
- [GR-0XX] {tên}: {mô tả ngắn}

### Lessons/Patterns thêm:
- {Mô tả}

### Artifact có thể cần review:
- [MAJOR] {Danh sách EPIC/FEAT/US nếu có} — lý do
- [MINOR/PATCH] Không ảnh hưởng artifact cũ

### Step files cần nhắc BA:
- ba-us/steps/step-01 ✅ (tự đọc ground-rules)
- ba-feat/steps/step-01 ✅ (tự đọc ground-rules)
- ba-epic/steps/step-01 ✅ (tự đọc ground-rules)
-->
```

---

## Hành động 5: Cập nhật file

1. Cập nhật `version` và `last_amended_date` trong frontmatter
2. Prepend Sync Impact Report (HTML comment) vào đầu file
3. Áp dụng thay đổi nội dung vào đúng section

---

## Hành động 6: Thông báo kết quả

```
═══════════════════════════════════════════════
✅ BA Ground Rules đã cập nhật!

📄 File: _product/ba-ground-rules.md
   Version: {old} → {new} ({MAJOR/MINOR/PATCH})
   Loại thay đổi: {mô tả}

📋 Tóm tắt:
   Rules thêm/sửa: {N}
   Lessons/Patterns: {N}

{Nếu MAJOR:}
⚠️  BREAKING CHANGE: Các artifact sau có thể cần review:
   • {Danh sách}

⏭  Bước tiếp theo:
   • Ground Rules mới sẽ được áp dụng ngay cho ba-epic/vnr-ba-feat/vnr-ba-us tiếp theo
   • Chạy /vnr-ba-us-check để verify US cũ nếu có MAJOR change
═══════════════════════════════════════════════
```
