# Workflow: ba-feat — Tạo FEAT Document

## Mục tiêu

Tạo FEAT document hoàn chỉnh (7 sections) từ Stakeholder-Capability Matrix của EPIC cha. Output chính là **Actor-Task Matrix** — seed để `ba-us` biết cần tạo bao nhiêu US và cho ai.

Nếu khi phân tích FEAT quá lớn hoặc cần tách: đề xuất tách và **cập nhật ngược EPIC cha**.

---

## Nguyên tắc

- **NEVER load nhiều step cùng lúc.**
- **Đọc EPIC cha trước.** Kế thừa BR-E, EAC, scope từ EPIC.
- **Cascade.** BR-F specialise từ BR-E. FAC trace về EAC.
- **Đề xuất trước, hỏi sau.**
- **Nếu FEAT quá lớn:** Đề xuất tách → cập nhật EPIC Stakeholder-Capability Matrix + feat_count.

---

## Đầu vào yêu cầu

Kiểm tra BA đã cung cấp:
1. **FEAT ID** hoặc đường dẫn FEAT (ví dụ: `ATT-E02-F01` — format mới)
2. **EPIC cha** (nếu không tự tìm được từ FEAT ID)

---

## Cấu trúc 5 Steps

| Step | File | Nội dung |
|------|------|----------|
| 1 | `steps/step-01-load-epic.md` | Load EPIC cha + xác định FEAT row trong Stakeholder-Capability Matrix |
| 2 | `steps/step-02-scope-bpmn.md` | Section 1 (Scope) + Section 2 (BPMN Feature Flow) |
| 3 | `steps/step-03-actor-task-matrix.md` | Section 3 (Actor-Task Matrix) — seed cho ba-us |
| 4 | `steps/step-04-rules-ac.md` | Section 4 (BR-F cascade từ BR-E) + Section 5 (FAC cascade từ EAC) |
| 5 | `steps/step-05-finalize.md` | Section 6 (US List placeholder) + Section 7 (Dependencies) + Tạo file + Update EPIC |

---

## Khởi động

**Bắt đầu bằng cách đọc `./steps/step-01-load-epic.md`.**
