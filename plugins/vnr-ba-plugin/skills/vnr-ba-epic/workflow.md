# Workflow: ba-epic — Tạo EPIC Document

## Mục tiêu

Tạo một EPIC document hoàn chỉnh theo chuẩn 5 Phần / 15 Sections. Output chính là **Stakeholder-Capability Matrix** — đây là "seed" để `ba-feat` biết cần tạo bao nhiêu FEAT và cho ai.

`ba-epic` là **structured interviewer**: nó biết HOW TO BUILD an EPIC, BA biết WHAT the domain needs. Kết hợp mới ra EPIC chất lượng.

---

## Nguyên tắc

- **NEVER load nhiều step cùng lúc.** Đọc và thực thi xong từng step rồi mới đọc step tiếp theo.
- **Đọc Research Brief trước.** Nếu `ba-researcher` đã chạy, đọc brief đó trước khi hỏi BA bất cứ điều gì.
- **Đề xuất trước, hỏi sau.** Dựa trên research, đề xuất nội dung cụ thể rồi mới hỏi BA có đồng ý không — không hỏi trống.
- **Cascade rule.** BR-E là gốc — ba-feat sẽ specialise từ đây. Viết đủ để cascade xuống được.
- **Khi FEAT quá nhiều:** Trình bày top 5 FEAT ưu tiên cao để clarify trước, nhưng vẫn xuất tất cả FEAT candidates vào Stakeholder-Capability Matrix.
- **Child thay đổi → cập nhật EPIC.** Nếu ba-feat tách FEAT hoặc thêm FEAT mới, EPIC phải được cập nhật.

---

## Đầu vào yêu cầu

Kiểm tra BA đã cung cấp:
1. **Tên EPIC** (ví dụ: "Đánh giá 360°", "Quản lý ca làm việc")
2. **Module** (ATT, PER, APR, IDP...)
3. **Research Brief** (nếu có từ ba-researcher — path tới file)

Nếu chưa có Research Brief:
```
Bạn có muốn chạy /vnr-ba-researcher trước không?
Research Brief giúp tôi đề xuất chính xác hơn và không bỏ sót edge case.
Nếu không, tôi sẽ dùng kiến thức có sẵn để tiến hành.
```

---

## Cấu trúc 6 Steps

| Step | File | Nội dung |
|------|------|----------|
| 1 | `steps/step-01-load-context.md` | Load Research Brief + product context |
| 2 | `steps/step-02-foundation.md` | PHẦN I: Nền tảng (Sections 1–3) |
| 3 | `steps/step-03-strategy.md` | PHẦN II: Chiến lược — Pain Points, As-Is, To-Be (Sections 4–7) |
| 4 | `steps/step-04-scope-rules.md` | PHẦN III: Scope, Dependencies, BR-E (Sections 8–10) |
| 5 | `steps/step-05-stakeholder-matrix.md` | PHẦN IV: Stakeholder-Capability Matrix → FEAT candidates (Sections 11–13) |
| 6 | `steps/step-06-finalize.md` | PHẦN V: Finalize + Tạo file + Cập nhật Module _index (Sections 14–15) |

---

## Khởi động

**Bắt đầu bằng cách đọc `./steps/step-01-load-context.md`.**
