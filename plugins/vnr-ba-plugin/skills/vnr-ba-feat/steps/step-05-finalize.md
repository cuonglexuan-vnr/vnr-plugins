# Step 05 — Finalize: Tạo file FEAT + Cập nhật EPIC

## Section 6: US List (placeholder)

```markdown
## 6. Danh sách US

| US ID | Actor | Task | Status | Link |
|---|---|---|---|---|
| {FEAT-ID}-US-001 | {Actor} | {Task} | Not Started | — |
| {FEAT-ID}-US-002 | {Actor} | {Task} | Not Started | — |
```

*Section này sẽ được ba-us cập nhật khi tạo từng US.*

---

## Section 7: Dependencies

```markdown
## 7. Dependencies

**FEAT này phụ thuộc vào:**
| FEAT/Module | Cần gì | Status |
|---|---|---|
| {FEAT-ID khác} | {Mô tả} | Done/In Progress |

**FEAT khác phụ thuộc vào FEAT này:**
| FEAT | Cần gì |
|---|---|
| {FEAT-ID} | {Mô tả} |
```

---

## Hành động 1: Tính FEAT ID

Trước khi tạo file, xác định FEAT ID:

```
Format: {MOD}-E{NN}-F{NN}
Ví dụ:  IDP-E01-F03, ATT-E02-F01
```

**Cách tính F{NN}:**
1. Đọc EPIC cha `README.md` → Section 13 "Danh sách FEAT"
2. Đếm số FEAT đang có (kể cả placeholder) → next F{NN}
3. F{NN} luôn 2 chữ số (01, 02, ..., 99)
4. Nếu đây là FEAT đầu tiên của EPIC → F01

> **Nguồn sự thật:** EPIC README.md Section 13 — KHÔNG tự tăng số mà không đọc file này.

---

## Hành động 2: Tạo file FEAT

**Đường dẫn:**
```
Module/{MOD}/Epics/{MOD}-E{NN}_{Epic-Name-Slug}/Features/{MOD}-E{NN}-F{NN}_{FEAT-Name-Slug}/FEAT.md
```

Ví dụ:
```
Module/IDP/Epics/IDP-E01_Ke_Hoach_Phat_Trien/Features/IDP-E01-F02_Tao_Muc_Tieu/FEAT.md
```

**Cách tạo:** Dùng `./templates/feat-template.md` làm base. Điền toàn bộ nội dung đã thống nhất qua Steps 2-4 vào các placeholder tương ứng trong template.

---

## Hành động 3: Cập nhật EPIC cha

Mở EPIC README.md, cập nhật:
1. `feat_count` nếu có FEAT mới (do tách)
2. `last_updated`
3. Section 13 (Danh sách FEAT) — đổi status từ `Not Started` → `In Progress`, thêm link

---

## Thông báo kết quả

```
═══════════════════════════════════════════════
✅ FEAT hoàn thành!

📄 File tạo:
   Module/{MOD}/Epics/{MOD}-E{NN}_.../Features/{MOD}-E{NN}-F{NN}_{Name}/FEAT.md

📋 Tóm tắt:
   ID:         {MOD}-E{NN}-F{NN}
   EPIC cha:   {MOD}-E{NN}
   Actor:      {Actor chính}
   BR-F:       {N} rules (kế thừa từ {N} BR-E)
   FAC:        {N} criteria
   US dự kiến: {N} stories

🔗 Đã cập nhật EPIC: {MOD}-E{NN}

⏭  Bước tiếp theo:
   • Chạy /vnr-ba-us để viết US đầu tiên cho FEAT này
   • Bắt đầu với: {Actor} — {Task} ({MOD}-E{NN}-F{NN}-U01, Priority P1)
═══════════════════════════════════════════════
```
