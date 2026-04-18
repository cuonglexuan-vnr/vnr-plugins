# Step 05 — PHẦN IV: Stakeholder-Capability Matrix

## Mục tiêu

Xây dựng **Stakeholder-Capability Matrix** — đây là output quan trọng nhất của EPIC. Mỗi row trong matrix = 1 FEAT candidate. ba-feat sẽ đọc matrix này để biết cần tạo bao nhiêu FEAT và cho ai.

---

## Hành động 1: Tạo Stakeholder-Capability Matrix

Dựa trên Sections 2 (Stakeholders) + 8 (Scope) + edge cases từ Research Brief:

```markdown
## 11. Stakeholder-Capability Matrix

| Stakeholder | Capability (Khả năng cần có) | Mô tả nghiệp vụ | Edge Cases liên quan | → FEAT Candidate |
|---|---|---|---|---|
| {Actor 1} | {Capability A} | {Mô tả ngắn — làm gì, khi nào} | {EC-01, EC-03} | {MODULE}-FEAT-001 |
| {Actor 1} | {Capability B} | {Mô tả ngắn} | {EC-05} | {MODULE}-FEAT-002 |
| {Actor 2} | {Capability C} | {Mô tả ngắn} | — | {MODULE}-FEAT-003 |
| Hệ thống | {Capability D — tự động} | {Mô tả} | {EC-02} | {MODULE}-FEAT-004 |
```

**Quy tắc:**
- Mỗi Capability = 1 business outcome có thể deliver độc lập
- Actor "Hệ thống" = tính năng tự động, không cần user trigger
- Không nhóm quá nhiều capabilities vào 1 FEAT nếu chúng có edge case riêng biệt
- Edge Cases từ Research Brief phải được assign vào ít nhất 1 FEAT

---

## Hành động 2: Đánh giá và đề xuất priority

Với mỗi FEAT candidate, đánh giá:

```markdown
## 12. FEAT Priority & Risk Assessment

| FEAT ID | Tên FEAT | Priority | Risk | Lý do |
|---|---|:---:|:---:|---|
| {MODULE}-FEAT-001 | {Tên} | P1 | High | Core flow, nhiều edge case |
| {MODULE}-FEAT-002 | {Tên} | P1 | Medium | — |
| {MODULE}-FEAT-003 | {Tên} | P2 | Low | — |
| {MODULE}-FEAT-004 | {Tên} | P3 | Low | Nice-to-have |
```

**Nếu có > 7 FEAT candidates:** Đề xuất rõ top 5 P1/P2 để clarify trước:
```
FEAT nhiều (N FEAT). Tôi đề xuất clarify 5 FEAT sau trước:
1. {FEAT-001} — lý do: {core flow}
2. {FEAT-002} — lý do: {nhiều edge case cần làm rõ}
...

BA muốn bắt đầu từ FEAT nào?
```

---

## Hành động 3: Viết Section 13 — FEAT List đầy đủ

```markdown
## 13. Danh sách FEAT (Tất cả)

| FEAT ID | Tên FEAT | Status | Actors | US Count | Link |
|---|---|---|---|:---:|---|
| {MODULE}-FEAT-001 | {Tên} | Not Started | {Actor 1} | 0 | — |
| {MODULE}-FEAT-002 | {Tên} | Not Started | {Actor 1, 2} | 0 | — |
```

*Section này sẽ được ba-feat cập nhật khi tạo từng FEAT.*

---

## Kết quả Step 05

Trình BA review toàn bộ PHẦN IV:
```
--- PHẦN IV: STAKEHOLDER-CAPABILITY MATRIX (Draft) ---

Tổng: {N} FEAT candidates
P1: {N1} FEAT | P2: {N2} FEAT | P3: {N3} FEAT

[Matrix + Priority + FEAT List]

BA đồng ý với danh sách FEAT này chưa?
Có Capability nào còn thiếu không?
```

Sau khi BA approve, đọc: `./steps/step-06-finalize.md`
