# Step 05 — Synthesize Research Brief

## Mục tiêu

Tổng hợp toàn bộ kết quả research thành 1 Research Brief súc tích, có thể đọc trong 5 phút. Output này sẽ được `ba-epic` đọc ngay khi bắt đầu — không cần research lại.

---

## Hành động 1: Tổng hợp Research Brief

Tạo file `Module/{MODULE}/_discovery/research-{domain-slug}.md` với nội dung:

```markdown
---
domain: {Tên domain}
module: {MODULE}
researched_by: ba-researcher
date: {YYYY-MM-DD}
confidence: High | Medium | Low
status: Ready for ba-epic
---

# Research Brief — {Tên Domain}

## 1. TL;DR (Đọc trong 60 giây)

{3-5 dòng mô tả ngắn gọn: domain là gì, tại sao quan trọng, điểm phức tạp nhất}

## 2. Feature Baseline (Competitor Matrix)

{Bảng Feature Matrix từ Step 02}

## 3. VN-Specific Constraints

### Pháp lý
{Table từ Step 03}

### Văn hóa DN
{Highlight 3-5 điểm quan trọng nhất từ Step 03}

## 4. Edge Cases Cần Cover

### Phải cover ngay (US riêng hoặc AC)
{Danh sách edge cases rating Cao từ Step 04}

### Ghi nhận để không bỏ sót
{Danh sách edge cases rating Trung bình}

### Defer sang v2
{Danh sách edge cases đã quyết định Out of scope}

## 5. FEAT Candidates (Đề xuất sơ bộ)

Dựa trên research, EPIC này có thể cần các FEAT sau:

| FEAT | Mô tả | Priority | Edge cases liên quan |
|---|---|:---:|---|
| {FEAT 1} | {Mô tả ngắn} | P1 | {Edge cases} |
| {FEAT 2} | {Mô tả ngắn} | P1 | {Edge cases} |
| {FEAT 3} | {Mô tả ngắn} | P2 | {Edge cases} |

*Đây là đề xuất sơ bộ — ba-epic sẽ xác nhận và điều chỉnh với BA.*

## 6. Risk Assessment

| Risk | Mức độ | Lý do |
|---|:---:|---|
| Scope creep | High/Med/Low | {Lý do} |
| Pháp lý VN phức tạp | High/Med/Low | {Lý do} |
| Edge case chưa rõ | High/Med/Low | {Lý do} |
| Phụ thuộc module khác | High/Med/Low | {Lý do} |

**Confidence overall: {High/Medium/Low}**  
*{1-2 câu giải thích confidence level}*

## 7. Câu hỏi còn mở (Cần BA clarify)

1. {Câu hỏi 1 — chưa rõ từ research}
2. {Câu hỏi 2}
3. {Câu hỏi 3}
```

---

## Hành động 2: Thông báo kết quả

```
═══════════════════════════════════════════════
✅ Research Brief hoàn thành!

📄 File tạo:
   Module/{MODULE}/_discovery/research-{domain-slug}.md

📊 Tóm tắt:
   Features tìm thấy: {N}
   Edge cases phát hiện: {N} ({N} phải cover ngay)
   Risk overall: {High/Medium/Low}
   Confidence: {High/Medium/Low}

❓ Câu hỏi còn mở: {N} câu — cần BA clarify

⏭ Bước tiếp theo:
   • Trả lời {N} câu hỏi còn mở
   • Sau đó chạy /vnr-ba-epic để bắt đầu viết EPIC
     (ba-epic sẽ tự đọc Research Brief này)
═══════════════════════════════════════════════
```

---

## Hành động 3: Hỏi các câu hỏi còn mở

Sau khi BA đọc brief, hỏi từng câu hỏi còn mở (từ Section 7). Cập nhật brief nếu BA cung cấp thêm thông tin.

Khi tất cả câu hỏi được trả lời, cập nhật `status: Ready for ba-epic` và đóng session.

## Hành động 4: Cập nhật EC Library lần cuối

Nếu trong quá trình trả lời câu hỏi còn mở (Hành động 3), BA tiết lộ thêm edge case mới → đề xuất thêm vào library.

Kiểm tra: tất cả EC trong Research Brief Section 4 đã được phản ánh đúng trong `_product/edge-cases/_index.md` chưa?

```
EC Library Update:
✅ [N] EC đã có trong library
✅ [N] EC mới đã được thêm vào library trong session này
📌 EC chưa thêm (BA chọn không thêm lần này): [N]
```
