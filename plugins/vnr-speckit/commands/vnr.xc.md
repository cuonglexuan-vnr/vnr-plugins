---
description: Thực hiện phân tích chéo không phá hủy giữa spec.md, plan.md và tasks.md sau khi sinh task.
handoffs:
  - label: xc
    agent: vnr.xc
    prompt: Proceed with implementation after analysis passes
---

## User Input

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét input của người dùng trước khi tiếp tục (nếu không rỗng).

## Goal

Xác định các điểm không nhất quán, trùng lặp, mơ hồ, thiếu đặc tả và sai lệch chuẩn giữa ba artifact chính (`spec.md`, `plan.md`, `tasks.md`) trước khi implement. Lệnh này chỉ được chạy sau khi `/vnr.tasks` đã tạo đầy đủ `tasks.md`.

## Operating Constraints

**STRICTLY READ-ONLY**: Tuyệt đối **không** chỉnh sửa bất kỳ file nào. Chỉ xuất ra báo cáo phân tích có cấu trúc. Có thể đề xuất hướng khắc phục, nhưng chỉ khi người dùng chủ động yêu cầu.

**Constitution Authority**: `constitution.md` là chuẩn **không thể thương lượng** trong phạm vi phân tích này. Mọi mâu thuẫn với nguyên tắc mức MUST đều là **CRITICAL** và phải sửa ở `spec.md`, `plan.md` hoặc `tasks.md` — không được tự diễn giải nhẹ đi, bỏ qua, hay hợp thức hóa.

**Vnr Stack Authority**: Mọi task hoặc kế hoạch vi phạm chuẩn công nghệ của Vnr đều phải bị đánh dấu. Đặc biệt:
- Backend phải phù hợp **.NET 4.6.2**
- Frontend phải phù hợp **Angular 18**
- Dữ liệu phải theo **DB-First**
- **Không chấp nhận** bất kỳ task nào theo hướng **Code-First DB modifications**

## Execution Steps

### 1. Initialize Analysis Context

Xác định feature hiện tại và kiểm tra sự tồn tại của các file bắt buộc:

- `spec.md`
- `plan.md`
- `tasks.md`
- `constitution.md`

Đồng thời nạp các standards của Vnr:

- `.vnr-speckit/standards/01-tech-stack.md`
- `.vnr-speckit/standards/02-architecture-and-structure.md`
- `.vnr-speckit/standards/03-data-and-auth.md`
- `.vnr-speckit/standards/04-internal-be-framework-and-flow.md`
- `.vnr-speckit/standards/05-internal-fe-framework-and-flow.md`
- `.vnr-speckit/standards/06-team-principles-and-conventions.md`

Nếu thiếu bất kỳ file bắt buộc nào, dừng ngay và yêu cầu người dùng chạy command còn thiếu trước đó.

### 2. Load Artifacts (Progressive Disclosure)

Chỉ nạp đúng phần cần thiết.

**From spec.md:**
- Overview / Context
- Functional Requirements
- Success Criteria
- User Stories
- Edge Cases (nếu có)

**From plan.md:**
- Architecture / stack choices
- Data model references
- Phases
- Technical constraints

**From tasks.md:**
- Task IDs
- Descriptions
- Phase grouping
- Parallel markers `[P]`
- Referenced file paths

**From constitution.md:**
- Các principle
- Các điều kiện MUST / SHOULD / MUST NOT

**From Vnr standards:**
- Tech stack chuẩn
- Architecture / source structure
- Data permission / auth conventions
- Vnr framework conventions

### 3. Build Semantic Models

Tạo representation nội bộ, không dump nguyên văn artifact ra output:

- **Requirements inventory**: mỗi FR / SC có key ổn định
- **User story inventory**: các hành động người dùng và acceptance tương ứng
- **Task coverage mapping**: ánh xạ task sang requirement / story / success criteria
- **Constitution + standards rule set**: tập hợp các nguyên tắc và ràng buộc chuẩn Vnr

Chỉ tính các Success Criteria cần công việc implement thực tế. Bỏ qua các business KPI hậu triển khai thuần túy.

### 4. Detection Passes (Token-Efficient Analysis)

Giới hạn tối đa **50 findings**. Phần dư thì gom vào overflow summary.

#### A. Duplication Detection
- Requirement gần trùng nhau
- Task làm cùng một việc
- Cách diễn đạt kém rõ cần gộp lại

#### B. Ambiguity Detection
- Từ mơ hồ như: nhanh, bảo mật, tối ưu, linh hoạt, scalable...
- Placeholder chưa xử lý: `TODO`, `TBD`, `TKTK`, `???`, `<placeholder>`

#### C. Underspecification
- Requirement có động từ nhưng thiếu kết quả mong đợi
- User story thiếu acceptance criteria
- Task nhắc tới file/module không thấy trong spec/plan

#### D. Constitution & Standards Alignment
- Bất kỳ điểm nào mâu thuẫn với MUST principle
- Thiếu quality gate bắt buộc
- Sai chuẩn architecture / source structure / auth / framework
- Vi phạm stack của Vnr:
  - sai **.NET 4.6.2**
  - sai **Angular 18**
  - sai quy trình **DB-First**
  - có dấu hiệu **Code-First DB modifications**

#### E. Coverage Gaps
- Requirement không có task nào
- Task không map được tới requirement/story
- Success Criteria dạng performance / security / availability không được phản ánh trong task

#### F. Inconsistency
- Cùng khái niệm nhưng dùng nhiều tên
- Entity có trong plan nhưng không có trong spec
- Task order mâu thuẫn logic triển khai
- Task đi lệch kiến trúc đã chọn

### 5. Severity Assignment

- **CRITICAL**: Vi phạm constitution MUST, vi phạm chuẩn Vnr stack/data cốt lõi, có task theo hướng Code-First DB, thiếu artifact bắt buộc, hoặc requirement nền tảng không có coverage
- **HIGH**: Requirement trùng/xung đột, security/performance mơ hồ, acceptance không test được
- **MEDIUM**: Terminology drift, thiếu coverage non-functional, edge case chưa rõ
- **LOW**: Cải thiện wording, dư thừa nhỏ, naming chưa đẹp

### 6. Produce Compact Analysis Report

Xuất Markdown report, không ghi file.

## Vnr Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | Duplication | HIGH | spec.md:L120-134 | Hai requirement gần trùng nhau | Gộp và giữ bản rõ nghĩa hơn |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|

**Constitution / Standards Alignment Issues:** (nếu có)

**Unmapped Tasks:** (nếu có)

**Metrics:**
- Total Requirements
- Total Tasks
- Coverage %
- Ambiguity Count
- Duplication Count
- Critical Issues Count
- Vnr Stack Violation Count

### 7. Provide Next Actions

Cuối báo cáo, luôn đưa ra khối Next Actions ngắn gọn:

- Nếu có **CRITICAL**: khuyến nghị không chạy `/vnr.implement`
- Nếu chỉ có LOW/MEDIUM: có thể tiếp tục, nhưng nên xử lý trước
- Đưa ra command gợi ý rõ ràng, ví dụ:
  - chạy lại `/vnr.specify`
  - chạy lại `/vnr.plan`
  - cập nhật `tasks.md` để bổ sung coverage
  - loại bỏ task vi phạm `.NET 4.6.2` / `Angular 18` / `DB-First`

### 8. Offer Remediation

Hỏi người dùng:

**"Bạn có muốn tôi đề xuất các chỉnh sửa cụ thể cho top N vấn đề quan trọng nhất không?"**

Không được tự động áp dụng chỉnh sửa.

## Operating Principles

### Context Efficiency
- Chỉ tập trung vào finding có giá trị cao
- Nạp artifact theo kiểu incremental
- Giới hạn output ở mức gọn, có thể hành động được
- Chạy lại không đổi dữ liệu thì kết quả nên ổn định

### Analysis Guidelines
- **KHÔNG BAO GIỜ chỉnh sửa file**
- **KHÔNG BAO GIỜ bịa phần thiếu**
- **Ưu tiên vi phạm constitution / standards**
- **Ưu tiên ví dụ cụ thể hơn là liệt kê lý thuyết**
- Nếu không có issue, vẫn phải xuất báo cáo thành công với coverage stats

## Context

$ARGUMENTS