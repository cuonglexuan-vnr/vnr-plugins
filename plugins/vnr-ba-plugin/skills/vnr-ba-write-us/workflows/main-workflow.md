# Workflow: ba-us — Tạo User Story theo chuẩn BA

## Mục tiêu

Tạo một User Story (US) hoàn chỉnh theo chuẩn nghiệp vụ từ Actor-Task Matrix của FEAT cha. US phải đạt tiêu chuẩn **100% nghiệp vụ, ZERO kỹ thuật**: không chứa bất kỳ từ ngữ kỹ thuật nào (API, endpoint, database, table, column, component, interface, DTO, command, query, handler, v.v.).

---

## Nguyên tắc kiến trúc Step-File

- **NEVER load nhiều step cùng lúc.** Đọc và thực thi xong từng step rồi mới đọc step tiếp theo.
- **ALWAYS đọc toàn bộ nội dung step file** trước khi bắt đầu thực thi step đó.
- **Không được skip bất kỳ step nào.** Thứ tự step là bắt buộc.
- **Dừng và hỏi BA** nếu thiếu thông tin cốt lõi tại bất kỳ step nào trước khi tiếp tục.
- **Output của mỗi step** phải được BA xác nhận (hoặc chỉnh sửa) trước khi qua step tiếp theo.

---

## 📐 Các Lệnh Hỗ Trợ

Skill hỗ trợ 4 loại lệnh linh hoạt - KHÔNG bắt buộc phải có FEAT ID trước:

| Lệnh | Mô tả | Ví dụ |
|---|---|---|
| `write us [mô tả]` | Viết US mới từ mô tả nghiệp vụ tự do | `write us HR Admin tạo ca làm việc mới` |
| `write us from analyze [ID]` | Viết US từ kết quả analyze đã có | `write us from analyze ANALYZE-ATT-001` |
| `write us from wireframe [URL]` | Viết US từ wireframe/mockup 🆕 | `write us from wireframe https://figma.com/...` |
| `update us [US_ID] [thay đổi]` | Cập nhật US (tăng version, ghi Change Log) | `update us ATT-E01-F02-U003 thêm validation` |

**Trigger keywords:** `ba us`, `tạo user story`, `viết us`, `write us`, `update us`

**Lưu ý:** 
- Lệnh `update us` có workflow riêng (không chạy 15 steps đầy đủ - xem `workflows/update-us-workflow.md`)
- Lệnh `write us from wireframe` sẽ gọi skill `ba-wireframe` để phân tích UI trước
- Các lệnh khác sẽ chạy qua 15 steps chuẩn (00 → 00a → 01 → 02 → 02b → 03 → 04 → 05a/b/c → 06a/b/c → 07 → 08)

---

## Cấu trúc 15 Steps (đã tối ưu - tự động hóa 95%)

| Step | File | Nội dung | Chuyển tiếp | User Confirm? |
|------|------|----------|-------------|---------------|
| 00 | `step-00-parse-input.md` | **Parse Input** - Phân loại 4 loại lệnh + extract thông tin | → 00a | ❌ Tự động |
| 00a | `step-00-generate-metadata.md` | Generate Metadata (US ID, Version, Status, Author) | → 01 | ❌ Tự động |
| 01 | `step-01-load-context.md` | Load context (FEAT + EPIC + Ground Rules + Edge Cases) | → 02 | ❌ Tự động |
| 02 | `step-02-write-statement.md` | Write Statement (Là/Tôi muốn/Để) + Out of Scope + Segments | → 02b | ❌ Tự động |
| 02b | `step-02b-write-business-context.md` | Write Mô tả nghiệp vụ (Bối cảnh, Master-Detail, Ví dụ, Thuật ngữ) | → 03 | ❌ Tự động |
| 03 | `step-03-write-ac.md` | Write Acceptance Criteria (Given/When/Then) | → 04 | ✅ **BA approve AC** |
| 04 | `step-04-draw-activity-diagram.md` | Draw Activity Diagram (Mermaid flowchart TD) | → 05a | ❌ Tự động |
| 05a | `step-05a-write-data-dictionary.md` | Write Data Dictionary (Trường, Kiểu nghiệp vụ, Bắt buộc, Ràng buộc) | → 05b | ❌ Tự động |
| 05b | `step-05b-write-business-rules.md` | Write Business Rules (BR-U trace về BR-F, 5 loại, Gợi ý tương lai) | → 05c | ❌ Tự động |
| 05c | `step-05c-write-validation-messages.md` | Write Validation Messages + Ma trận VM↔BR↔AC | → 06a | ❌ Tự động |
| 06a | `step-06a-write-uiux-description.md` | Write UI/UX Mô tả (Màn hình, Trạng thái, Luồng điều hướng) | → 06b | ❌ Tự động |
| 06b | `step-06b-ux-evaluation.md` | UX Evaluation (6 tiêu chí: Completeness, States, Feedback, Error Prevention, Consistency, Wireframe Coverage) | → 06c | ❌ Tự động |
| 06c | `step-06c-tracking-analytics.md` | Tracking & Analytics (Audit Trail + Analytics Events) | → 07 | ❌ Tự động |
| 07 | `step-07-generate-traceability.md` | Generate Traceability Matrices (AC↔BR, VM↔BR↔AC, Dependencies) | → 08 | ❌ Tự động |
| 08 | `step-08-finalize.md` | Tạo file US (11 phần) + cập nhật FEAT.md | END | ❌ Tự động |

**Tổng checkpoints:** CHỈ 1 lần (approve AC ở Step 03)

**Tự động hóa:** 95% - BA chỉ cần approve Acceptance Criteria (phần quan trọng nhất)

**Lưu ý:** 
- Step 00 (Parse Input) phân loại lệnh trước khi vào workflow chính
- Lệnh `update us` có workflow riêng - không chạy qua 10 steps này

---

## Khởi động

```
LOAD steps/step-00-parse-input.md
EXECUTE step 00 → phân loại lệnh + extract thông tin

IF command_type == "UPDATE_US":
   → Workflow riêng: Load US cũ → Apply changes → Tăng version → Ghi lại
   → STOP (không chạy step 00a-08)
ELSE:
   → LOAD steps/step-00-generate-metadata.md
   EXECUTE step 00a → tạo US ID, metadata
   
   → LOAD steps/step-01-load-context.md
   EXECUTE step 01 → load context
   
   → LOAD steps/step-02-write-statement.md
   EXECUTE step 02 → write statement
   
   → LOAD steps/step-02b-write-business-context.md
   EXECUTE step 02b → write business context
   
   → LOAD steps/step-03-write-ac.md
   EXECUTE step 03 → write AC
   AWAIT BA APPROVE AC ✅ (checkpoint duy nhất)
   
   → LOAD steps/step-04-draw-activity-diagram.md
   EXECUTE step 04 → draw diagram
   
   → LOAD steps/step-05a-write-data-dictionary.md
   EXECUTE step 05a → write data dictionary
   
   → LOAD steps/step-05b-write-business-rules.md
   EXECUTE step 05b → write BR-U
   
   → LOAD steps/step-05c-write-validation-messages.md
   EXECUTE step 05c → write VM + ma trận
   
   → LOAD steps/step-06a-write-uiux-description.md
   EXECUTE step 06a → write UI/UX mô tả
   
   → LOAD steps/step-06b-ux-evaluation.md
   EXECUTE step 06b → UX evaluation
   
   → LOAD steps/step-06c-tracking-analytics.md
   EXECUTE step 06c → tracking & analytics
   
   → LOAD steps/step-07-generate-traceability.md
   EXECUTE step 07 → generate traceability
   
   → LOAD steps/step-08-finalize.md
   EXECUTE step 08 → tạo file US + cập nhật FEAT
```

**Bắt đầu bằng cách đọc `./steps/step-00-parse-input.md`.**

---

## Template Output (11 phần)

File US cuối cùng sẽ có cấu trúc:

0. 📌 **Metadata** (US ID, Version, Status, Author, Epic, FEAT, Actor, Priority, Segments)
1. 📝 **User Story Statement** (Là/Tôi muốn/Để + Trace FAC + Out of Scope)
2. 📖 **Mô Tả Nghiệp Vụ** (Bối cảnh, Master-Detail, Ví dụ, Thuật ngữ)
3. ⚙️ **Business Rules** (BR-U trace về BR-F, Gợi ý tương lai)
4. ✅ **Acceptance Criteria** (Given/When/Then + Trace FAC)
5. 📊 **Activity Diagram** (Mermaid flowchart TD)
6. 🗂️ **Data Dictionary** (Trường, Kiểu nghiệp vụ, Bắt buộc, Ràng buộc)
7. 📝 **Validation Messages** (Error/Warning/Success/Info + Quy ước hiển thị + Ma trận VM↔BR↔AC)
8. 📱 **UI/UX Mô tả** (Màn hình, 4 trạng thái, Luồng điều hướng, UX Evaluation)
9. 📈 **Tracking & Analytics** (Audit Trail + Analytics Events)
10. 🔗 **Traceability** (Ma trận AC↔BR, VM↔BR↔AC, Dependencies)
11. 📌 **Change Log** (Version history)

---

## Template Output (11 phần)

File US cuối cùng sẽ có cấu trúc đầy đủ:

**0. 📌 Metadata** (US ID, Version, Status, Author, Epic, FEAT, Actor, Priority, Segments)  
**1. 📝 User Story Statement** (Là/Tôi muốn/Để + Trace FAC + Out of Scope)  
**2. 📖 Mô Tả Nghiệp Vụ** (Bối cảnh, Master-Detail, Ví dụ, Thuật ngữ)  
**3. ⚙️ Business Rules** (BR-U trace về BR-F, Gợi ý tương lai)  
**4. ✅ Acceptance Criteria** (Given/When/Then + Trace FAC)  
**5. 📊 Activity Diagram** (Mermaid flowchart TD)  
**6. 🗂️ Data Dictionary** (Trường, Kiểu nghiệp vụ, Bắt buộc, Ràng buộc)  
**7. 📝 Validation Messages** (Error/Warning/Success/Info + Quy ước hiển thị + Ma trận VM↔BR↔AC)  
**8. 📱 UI/UX Mô tả** (Màn hình, 4 trạng thái, Luồng điều hướng, UX Evaluation)  
**9. 📈 Tracking & Analytics** (Audit Trail + Analytics Events)  
**10. 🔗 Traceability** (Ma trận AC↔BR, VM↔BR↔AC, Dependencies)  
**11. 📌 Change Log** (Version history)

---

## Điểm khác biệt so với HRM360-WriteUS

Skill `hrm-write-us` được nâng cấp từ HRM360-WriteUS với các cải tiến:

✅ **4 loại lệnh linh hoạt** - không bắt buộc FEAT ID:
   - `write us [mô tả]` - từ mô tả nghiệp vụ tự do
   - `write us from analyze [ID]` - từ kết quả analyze
   - `write us from wireframe [URL]` - từ wireframe/mockup 🆕
   - `update us [US_ID] [thay đổi]` - cập nhật US hiện có

✅ **Tự động hóa 95%** - chỉ 1 checkpoint (approve AC)  
✅ **Step-based workflow** - có thể pause/resume tại mỗi step  
✅ **Validation Messages** - phân loại 4 loại với quy ước hiển thị UX chuẩn  
✅ **Traceability Matrices** - ma trận AC↔BR, VM↔BR↔AC đầy đủ  
✅ **Edge Case detection** - tự động phân tích EC Library  
✅ **Zero Kỹ thuật enforced** - tự validate và sửa từ kỹ thuật trước khi ghi file  

Template output: **11 phần** thay vì 9 phần (thêm Metadata và Mô tả Nghiệp vụ)
