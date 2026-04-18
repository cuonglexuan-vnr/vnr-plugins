# Step 04 — PHẦN III: Scope, Dependencies & Business Rules

## Mục tiêu

Định nghĩa rõ IN/OUT scope, dependencies với module khác, và Business Rules cấp EPIC (BR-E). BR-E là gốc cascade — ba-feat sẽ specialise từ đây.

---

## Section 8: Scope

**Quan trọng:** OUT OF SCOPE quan trọng ngang IN SCOPE — không có nó, BA và dev sẽ hiểu lệch.

```markdown
## 8. Scope

### IN SCOPE
- {Feature/capability 1 sẽ được build trong EPIC này}
- {Feature/capability 2}

### OUT OF SCOPE (rõ ràng)
- {Feature X — defer sang EPIC khác hoặc v2}
- {Integration Y — nằm ở module Z}
- {Edge case W — quyết định out of scope v1}

### Ranh giới với module khác
| Module | Nhận dữ liệu từ | Cung cấp dữ liệu cho |
|---|---|---|
| {Module A} | {Dữ liệu gì} | — |
| {Module B} | — | {Dữ liệu gì} |
```

Hỏi BA:
```
OUT OF SCOPE có ổn không? Có gì đang trong kế hoạch nhưng nên đưa ra ngoài không?
```

---

## Section 9: Dependencies

```markdown
## 9. Dependencies

### Phụ thuộc vào (phải có trước)
| EPIC/Module | Lý do phụ thuộc | Trạng thái |
|---|---|---|
| {EPIC-ID} | {Cần dữ liệu/config gì từ đây} | Done/In Progress/Not Started |

### Được phụ thuộc bởi (phải hoàn thành trước khi thằng kia làm)
| EPIC/Module | Lý do | Ghi chú |
|---|---|---|
| {EPIC-ID} | {Thằng kia cần gì từ EPIC này} | — |
```

---

## Section 10: Business Rules cấp EPIC (BR-E)

BR-E là rules ở cấp EPIC — ảnh hưởng toàn bộ FEAT bên dưới. ba-feat sẽ specialise thành BR-F, ba-us sẽ specialise tiếp thành BR-U.

**Format bắt buộc:**

```markdown
## 10. Business Rules (BR-E)

- **BR-E001 ({Tên ngắn}):** {Mô tả rule nghiệp vụ cấp EPIC, áp dụng cho toàn bộ module}

- **BR-E002 ({Tên ngắn}):** {Mô tả}

- **BR-E003 (Edge Cases từ Research):** {Rules phát sinh từ edge cases đã phát hiện}
```

**Quy tắc viết BR-E:**
- Mỗi BR-E phải mô tả 1 ràng buộc nghiệp vụ rõ ràng
- Không được là yêu cầu kỹ thuật (không dùng API, DB, cache...)
- Phải đủ general để ba-feat specialise xuống
- Ít nhất 1 BR-E phải đến từ edge cases trong Research Brief

**Gợi ý checklist BR-E theo domain:**
- BR về phân quyền / ai được làm gì
- BR về vòng đời (lifecycle) — điều kiện chuyển trạng thái
- BR về tính toán / công thức tổng quát
- BR về thời hạn / deadline
- BR về audit / lịch sử

---

## Kết quả Step 04

```
--- PHẦN III: SCOPE & RULES (Draft) ---
[Section 8, 9, 10 đầy đủ]

BA có muốn chỉnh sửa không?
```

Sau khi BA approve, đọc: `./steps/step-05-stakeholder-matrix.md`
