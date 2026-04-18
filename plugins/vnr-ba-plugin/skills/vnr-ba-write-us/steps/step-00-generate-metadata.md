# Step 00 — Generate Metadata

## Mục tiêu

Tự động sinh metadata cho User Story bao gồm: US ID, Title, Version, Status, Created, Author, Epic, FEAT, Actor, Priority, Segments. Metadata này sẽ được dùng xuyên suốt quá trình viết US và tracking version.

---

## Hành động 1: Xác định US ID

**Format:** `{MOD}-E{NN}-F{NN}-U{NN}`

**Logic tự động:**
1. Lấy Module code từ FEAT cha (sẽ load ở Step 01)
2. Lấy Epic number từ FEAT cha
3. Lấy FEAT number từ FEAT cha
4. Tìm US số tiếp theo: đếm số US đã tồn tại trong FEAT + 1

**Ví dụ:**
- FEAT: `ATT-E01-F02` (Quản lý ca làm việc)
- US đã có: US-001, US-002
- US mới: `ATT-E01-F02-U003`

---

## Hành động 2: Sinh Title ngắn gọn

**Logic tự động:**
- Lấy từ `SELECTED_TASK` trong Actor-Task Matrix (sẽ có sau Step 01)
- Hoặc từ mô tả ngắn BA cung cấp
- Rút gọn thành 5-7 từ
- Format: {Actor} {Verb} {Object}: {Context}


---

## Hành động 3: Xác định các trường metadata khác

| Trường | Giá trị | Nguồn |
|---|---|---|
| **Version** | 1.0 | Mặc định cho US mới |
| **Status** | Draft | Mặc định khi bắt đầu viết |
| **Created** | {YYYY-MM-DD} | Ngày hiện tại (2026-04-16) |
| **Last Updated** | {YYYY-MM-DD} | Cùng với Created |
| **Author** | {BA Name} | Từ context session hoặc git config |
| **Epic** | {MOD}-E{NN} | Từ FEAT cha |
| **FEAT** | {MOD}-E{NN}-F{NN} | Từ input BA |
| **Actor** | {ACTOR} | Từ Actor-Task Matrix |
| **Priority** | P2 | Mặc định P2 (Medium) |
| **Segments** | All | Mặc định, sẽ cập nhật ở Step 02 |

---

## Kết quả đầu ra Step 00

Hiển thị metadata đã tạo:

```
════════════════════════════════════════════════════════════
✓ HOÀN THÀNH STEP 00 — METADATA

📌 US ID: {US-ID} (sẽ xác định sau Step 01)
📝 Title: {Title}
🔢 Version: 1.0
🏷️  Status: Draft
📅 Created: 2026-04-16
✍️  Author: {BA Name}
════════════════════════════════════════════════════════════
```

**Lưu ý:** US ID cuối cùng sẽ được xác định sau Step 01 khi đã đọc FEAT cha.

**Tự động chuyển sang Step 01** — đọc và thực thi: `./steps/step-01-load-context.md`
