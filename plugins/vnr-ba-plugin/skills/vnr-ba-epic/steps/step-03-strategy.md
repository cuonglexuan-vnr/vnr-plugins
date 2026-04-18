# Step 03 — PHẦN II: Chiến lược

## Mục tiêu

Viết 4 sections về chiến lược: pain points, BPMN flow, To-Be vision, và success metrics. Đây là phần "WHY" của EPIC — giải thích tại sao cần build và kết quả mong đợi là gì.

---

## Section 4: Pain Points theo Stakeholder

Dựa trên Research Brief (edge cases + VN context) và Sections 2-3 vừa viết, đề xuất pain points cụ thể:

```markdown
## 4. Pain Points theo Stakeholder

| Stakeholder | Pain Point | Tần suất | Mức độ ảnh hưởng |
|---|---|:---:|:---:|
| {Actor 1} | {Vấn đề cụ thể, không chung chung} | Hàng ngày/tuần/tháng | Cao/Trung/Thấp |
| {Actor 2} | ... | ... | ... |
```

**Ví dụ pain point cụ thể (tốt):**
> "HR Admin mất 2-3 ngày cuối tháng để tổng hợp bảng chấm công từ 5 file Excel khác nhau"

**Ví dụ pain point chung chung (không tốt):**
> "Quy trình phức tạp"

Hỏi BA:
```
Pain points đề xuất có đúng với khách hàng thực tế không?
Pain point nào quan trọng nhất / hay được hỏi nhất?
```

---

## Section 5: BPMN Feature Flow (As-Is)

Vẽ Mermaid swimlane mô tả quy trình HIỆN TẠI (As-Is) — cách DN đang làm trước khi có hệ thống:

```mermaid
flowchart LR
  classDef default font-size:11px,line-height:1.2

  subgraph Actor1["{Actor 1}"]
    A([Bắt đầu]) --> B[{Bước 1}]
    B --> C{Phê duyệt?}
  end

  subgraph Actor2["{Actor 2}"]
    D[Xem xét] --> E{Đồng ý?}
    E -->|Có| F[Thông báo]
    E -->|Không| G[Trả về]
  end

  C -->|Gửi| D
  F --> H([Kết thúc])
  G --> B
```

Hỏi BA:
```
Flow As-Is này có phản ánh đúng cách khách hàng đang làm không?
```

---

## Section 6: BPMN Feature Flow (To-Be)

Vẽ Mermaid swimlane mô tả quy trình SAU KHI có hệ thống. Highlight sự khác biệt so với As-Is:

```markdown
**Cải thiện so với As-Is:**
- {Bước X bị loại bỏ → tiết kiệm N ngày}
- {Bước Y được tự động hóa → không cần thủ công}
- {Actor Z không cần chờ Actor W nữa}
```

---

## Section 7: Success Metrics

Đề xuất metrics đo lường sự thành công của EPIC sau khi triển khai:

```markdown
## 7. Success Metrics

| Metric | Hiện tại (As-Is) | Mục tiêu (To-Be) | Đo bằng cách nào |
|---|---|---|---|
| Thời gian hoàn thành quy trình | {N ngày} | {M ngày} | Tracking timestamp |
| Tỷ lệ lỗi thủ công | {X%} | {Y%} | Error log |
| Mức độ hài lòng | Không đo | > 80% | Survey sau 3 tháng |
```

---

## Kết quả Step 03

Trình BA review PHẦN II:
```
--- PHẦN II: CHIẾN LƯỢC (Draft) ---
[Section 4, 5, 6, 7 đầy đủ]

BA có muốn chỉnh sửa không?
```

Sau khi BA approve, đọc: `./steps/step-04-scope-rules.md`
