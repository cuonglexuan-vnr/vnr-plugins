# Step 06 — Finalize: Tạo file EPIC + Cập nhật Module _index

## Mục tiêu

Tổng hợp toàn bộ nội dung 5 phần, tạo file EPIC hoàn chỉnh, và cập nhật Module _index để phản ánh EPIC mới.

---

## Hành động 1: Tính EPIC ID

Trước khi tạo file, xác định EPIC ID mới:

```
Format: {MOD}-E{NN}
Ví dụ:  IDP-E01, ATT-E03
```

**Cách tính NN:**
1. Mở `Module/{MOD}/_index.md` (nếu chưa có → tạo mới)
2. Đếm số EPIC đang có trong bảng "Danh sách EPIC" → next NN
3. NN luôn 2 chữ số (01, 02, ..., 99)

> **Nguồn sự thật:** `Module/{MOD}/_index.md` — KHÔNG tự tăng số mà không đọc file này.
> Nếu đây là EPIC đầu tiên của module → NN = 01.

---

## Hành động 2: Tạo thư mục và file EPIC

**Đường dẫn:**
```
Module/{MOD}/Epics/{MOD}-E{NN}_{Epic-Name-Slug}/README.md
```

Ví dụ:
```
Module/IDP/Epics/IDP-E01_Ke_Hoach_Phat_Trien_Ca_Nhan/README.md
```

**Cách tạo:** Dùng `./templates/epic-template.md` làm base. Điền toàn bộ nội dung đã thống nhất qua Steps 2-5 vào các placeholder tương ứng trong template.

---

## Hành động 3: Tạo FEAT placeholder folders

Tạo cấu trúc thư mục cho tất cả FEAT candidates (chưa có nội dung — ba-feat sẽ điền):

```
Module/{MOD}/Epics/{MOD}-E{NN}_{Epic-Name}/
  README.md                           ← File EPIC vừa tạo
  Features/
    {MOD}-E{NN}-F01_{Feat-Name-Slug}/
      FEAT.md                         ← Placeholder
    {MOD}-E{NN}-F02_{Feat-Name-Slug}/
      FEAT.md
    ...
```

**FEAT.md placeholder** (dùng cho từng FEAT candidate):
```yaml
---
id: {MOD}-E{NN}-F{NN}
parent_epic: {MOD}-E{NN}
module: {MOD}
status: Not Started
us_count: 0
last_updated: {YYYY-MM-DD}
---

# {MOD}-E{NN}-F{NN} — {Tên FEAT}

*Chưa có nội dung. Chạy /vnr-ba-feat để viết FEAT này.*
```

---

## Hành động 4: Cập nhật Module _index.md

Mở `Module/{MOD}/_index.md`. Nếu chưa có, tạo mới. Thêm EPIC vào bảng:

```markdown
## Danh sách EPIC

*Bảng này là nguồn sự thật để sinh EPIC ID mới — đếm số dòng để lấy next E{NN}.*

| EPIC ID | Tên | Status | FEAT | Cập nhật |
|---|---|---|:---:|---|
| [{MOD}-E{NN}](Epics/{MOD}-E{NN}_{Name}/README.md) | {Tên EPIC} | Draft | {N} | {date} |
```

---

## Hành động 5: Thông báo kết quả

```
═══════════════════════════════════════════════
✅ EPIC hoàn thành!

📄 File tạo:
   Module/{MOD}/Epics/{MOD}-E{NN}_{Name}/README.md

📁 FEAT placeholders:
   {N} thư mục FEAT đã tạo:
   • {MOD}-E{NN}-F01 — {Tên} (P1)
   • {MOD}-E{NN}-F02 — {Tên} (P1)
   • {MOD}-E{NN}-F03 — {Tên} (P2)

📋 Tóm tắt EPIC:
   ID:          {MOD}-E{NN}
   Module:      {MOD}
   Status:      Draft
   FEAT count:  {N} ({N1} P1, {N2} P2, {N3} P3)
   Risk:        {High/Medium/Low}
   BR-E:        {N} rules

🔗 Đã cập nhật: Module/{MOD}/_index.md

⏭  Bước tiếp theo:
   • Chạy /vnr-ba-feat {MOD}-E{NN}-F01 để viết FEAT ưu tiên cao nhất
   • Bắt đầu với: {MOD}-E{NN}-F01 ({Tên — lý do ưu tiên})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Sau khi tất cả FEATs Done:
   Chạy /vnr-ba-retrospective {MOD}-E{NN} để:
   • Trích xuất lessons learned → cập nhật Ground Rules
   • Bổ sung EC mới vào library
   • Tạo retro report cho lần sau
═══════════════════════════════════════════════
```
