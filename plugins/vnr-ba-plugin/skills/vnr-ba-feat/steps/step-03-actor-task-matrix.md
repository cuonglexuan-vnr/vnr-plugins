# Step 03 — Actor-Task Matrix

## Mục tiêu

Xây dựng **Actor-Task Matrix** — đây là output quan trọng nhất của FEAT. Mỗi row = 1 US candidate. `ba-us` sẽ đọc matrix này để biết cần viết US gì cho ai.

---

## Hành động 1: Phân tích actors và tasks

Từ BPMN vừa vẽ (Step 02) + Edge Cases của FEAT này, liệt kê tất cả actor-task combinations:

**Câu hỏi cần trả lời:**
- Actor nào cần làm gì trong FEAT này?
- Có task nào chỉ xảy ra trong edge case không?
- Hệ thống có task tự động nào không?

---

## Hành động 2: Tạo Actor-Task Matrix

```markdown
## 3. Actor-Task Matrix

| Actor | Task | Mô tả nghiệp vụ | Edge Cases liên quan | → US Dự kiến | Priority |
|---|---|---|---|---|:---:|
| {Actor 1} | {Task A} | {BA làm gì, khi nào, kết quả gì} | {EC-01} | {FEAT-ID}-US-001 | P1 |
| {Actor 1} | {Task B — Edge case} | {Tình huống bất thường} | {EC-03} | {FEAT-ID}-US-002 | P2 |
| {Actor 2} | {Task C} | {Mô tả} | — | {FEAT-ID}-US-003 | P1 |
| Hệ thống | {Task tự động D} | {Tự động xảy ra khi...} | — | {FEAT-ID}-US-004 | P1 |
```

**Quy tắc:**
- Mỗi row = 1 US candidate (1 story độc lập)
- Task "Hệ thống" = tính năng tự động không cần user action
- Edge case phức tạp → US riêng (không nhét vào AC của US khác)
- Actor + Task phải đủ cụ thể để ba-us viết được AC

---

## Hành động 3: Hỏi BA

```
Actor-Task Matrix đề xuất {N} US:
[Trình bày matrix]

Có task nào còn thiếu không?
Có task nào nên gộp lại vì quá nhỏ không?
```

Sau khi BA confirm, đọc: `./steps/step-04-rules-ac.md`
