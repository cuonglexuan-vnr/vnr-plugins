---
description: Tạo file tasks.md có thể thực thi ngay, được sắp xếp theo dependency, dựa trên các design artifact hiện có của feature.
handoffs: 
  - label: Analyze For Consistency
    agent: vnr.analyze
    prompt: Phân tích project để kiểm tra tính nhất quán
    send: true
  - label: Implement Project
    agent: vnr.implement
    prompt: Bắt đầu triển khai theo từng phase
    send: true
---

## User Input

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét input của người dùng trước khi tiếp tục (nếu không rỗng).

<framework_to_use>
**Required**: If doing frontend work, read the file `.vnr-speckit/standards/05-internal-fe-framework-and-flow.md`. All controls/components **must** use vnr-module. For example: vnr-grid, vnr-grid-Edit-Incell, vnr-grid-Edit-Inline, vnr-toolbar. All controls/components **MUST** use the control set from vnr-module (e.g., vnr-button, vnr-select, vnr-input, etc.).
</framework_to_use>

## Pre-Execution Checks

**Kiểm tra extension hooks (trước khi tạo tasks)**:
- Kiểm tra xem `.vnr-speckit/extensions.yml` có tồn tại ở root của project hay không.
- Nếu có, đọc file này và tìm các entry trong `hooks.before_tasks`
- Nếu YAML không parse được hoặc không hợp lệ, bỏ qua bước hook một cách im lặng và tiếp tục bình thường
- Bỏ qua các hook có `enabled: false`. Những hook không có trường `enabled` được coi là bật mặc định.
- Với mỗi hook còn lại, **không** tự đánh giá hay diễn giải biểu thức `condition`:
  - Nếu hook không có `condition`, hoặc `condition` là null/rỗng, coi hook là có thể chạy
  - Nếu hook có `condition` không rỗng, bỏ qua hook đó và để việc đánh giá điều kiện cho HookExecutor xử lý
- Với mỗi hook có thể chạy, output theo `optional`:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    
    Wait for the result of the hook command before proceeding to the Outline.
    ```
- Nếu không có hook nào được đăng ký hoặc `.vnr-speckit/extensions.yml` không tồn tại, bỏ qua im lặng

## Outline

1. **Setup**: Chạy `.vnr-speckit/scripts/powershell/check-prerequisites.ps1 -Json` từ root của repo và parse `FEATURE_DIR` cùng danh sách `AVAILABLE_DOCS`. Tất cả path phải là absolute path. Với chuỗi có dấu nháy đơn như `"I'm Groot"`, dùng escape phù hợp: ví dụ `'I'\''m Groot'` (hoặc dùng double quote nếu có thể: `"I'm Groot"`).

2. **Load các tài liệu thiết kế**: Đọc từ `FEATURE_DIR`:
   - **Required**: `plan.md` (tech stack, thư viện, structure), `spec.md` (user stories với priority)
   - **Optional**: `data-model.md` (entities), `contracts/` (interface contracts), `research.md` (các quyết định), `quickstart.md` (test scenarios)
   - Lưu ý: không phải project nào cũng có đầy đủ tất cả các file. Hãy sinh tasks dựa trên những gì hiện có.

3. **Thực thi workflow sinh task**:
   - Đọc `plan.md` và trích xuất tech stack, libraries, project structure
   - Đọc `spec.md` và trích xuất user stories cùng mức độ ưu tiên (P1, P2, P3, ...)
   - Nếu có `data-model.md`: trích xuất entities và map vào user stories
   - Nếu có `contracts/`: map các interface contracts vào user stories
   - Nếu có `research.md`: trích xuất các quyết định để sinh setup tasks
   - Sinh tasks được tổ chức theo từng user story (xem Task Generation Rules bên dưới)
   - Sinh dependency graph thể hiện thứ tự hoàn thành giữa các user story
   - Tạo các ví dụ có thể chạy song song cho từng user story
   - Validate tính đầy đủ của task list (mỗi user story phải có đủ task cần thiết và có thể test độc lập)

4. **Sinh `tasks.md`**: Dùng `.vnr-speckit/templates/tasks-template.md` làm cấu trúc, điền vào:
   - Tên feature chính xác lấy từ `plan.md`
   - Phase 1: Setup tasks (khởi tạo project)
   - Phase 2: Foundational tasks (các phần blocking cho toàn bộ user stories)
   - Phase 3+: Mỗi user story là một phase riêng (theo thứ tự ưu tiên trong `spec.md`)
   - Mỗi phase bao gồm: story goal, independent test criteria, tests (nếu được yêu cầu), implementation tasks
   - Final Phase: Polish & cross-cutting concerns
   - Tất cả task **PHẢI** theo đúng checklist format (xem Task Generation Rules bên dưới)
   - Mỗi task phải có file path rõ ràng
   - Có section Dependencies thể hiện thứ tự hoàn thành giữa các story
   - Có phần Parallel execution examples cho từng story
   - Có section Implementation strategy (MVP first, incremental delivery)

5. **Report**: Output đường dẫn tới `tasks.md` vừa sinh và phần tóm tắt:
   - Tổng số task
   - Số task theo từng user story
   - Các cơ hội chạy song song đã xác định
   - Independent test criteria của từng story
   - Phạm vi MVP đề xuất (thường là chỉ User Story 1)
   - Kết quả validate format: xác nhận rằng **TẤT CẢ** task đều đúng checklist format (checkbox, ID, labels, file paths)

6. **Kiểm tra extension hooks**: Sau khi `tasks.md` được sinh xong, kiểm tra xem `.vnr-speckit/extensions.yml` có tồn tại ở root project hay không.
   - Nếu có, đọc file này và tìm `hooks.after_tasks`
   - Nếu YAML không hợp lệ, bỏ qua im lặng
   - Bỏ qua các hook có `enabled: false`, còn lại coi là enabled mặc định
   - Không tự đánh giá `condition`
   - Với mỗi hook có thể chạy, output theo `optional`:
     - **Optional hook** (`optional: true`):
       ```
       ## Extension Hooks

       **Optional Hook**: {extension}
       Command: `/{command}`
       Description: {description}

       Prompt: {prompt}
       To execute: `/{command}`
       ```
     - **Mandatory hook** (`optional: false`):
       ```
       ## Extension Hooks

       **Automatic Hook**: {extension}
       Executing: `/{command}`
       EXECUTE_COMMAND: {command}
       ```
   - Nếu không có hook hoặc không có file `.vnr-speckit/extensions.yml`, bỏ qua im lặng

Context for task generation: $ARGUMENTS

File `tasks.md` được tạo ra phải có thể đưa vào thực thi ngay - mỗi task phải đủ cụ thể để một AI agent hoặc LLM có thể hoàn thành mà không cần hỏi thêm ngữ cảnh.

## Task Generation Rules

**CRITICAL**: Tasks **PHẢI** được tổ chức theo user story để có thể triển khai và kiểm thử độc lập.

**Tests là OPTIONAL**: Chỉ tạo test tasks nếu feature specification yêu cầu rõ, hoặc người dùng yêu cầu áp dụng TDD.

### Checklist Format (REQUIRED)

Mỗi task **PHẢI** tuân thủ nghiêm ngặt format sau:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Các thành phần của format**:

1. **Checkbox**: Luôn bắt đầu bằng `- [ ]` (markdown checkbox)
2. **Task ID**: Số thứ tự tuần tự (T001, T002, T003...) theo execution order
3. **[P] marker**: Chỉ thêm nếu task có thể chạy song song (khác file, không phụ thuộc task chưa hoàn tất)
4. **[Story] label**: BẮT BUỘC đối với task nằm trong phase của user story
   - Format: `[US1]`, `[US2]`, `[US3]`, ... (map với user stories từ `spec.md`)
   - Setup phase: KHÔNG có story label
   - Foundational phase: KHÔNG có story label
   - User Story phases: BẮT BUỘC có story label
   - Polish phase: KHÔNG có story label
5. **Description**: Hành động rõ ràng kèm file path chính xác

**Ví dụ**:

- ✅ CORRECT: `- [ ] T001 Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] T014 [US1] Implement UserService in src/services/user_service.py`
- ❌ WRONG: `- [ ] Create User model` (thiếu ID và Story label)
- ❌ WRONG: `T001 [US1] Create model` (thiếu checkbox)
- ❌ WRONG: `- [ ] [US1] Create User model` (thiếu Task ID)
- ❌ WRONG: `- [ ] T001 [US1] Create model` (thiếu file path)

### Task Organization

1. **Từ User Stories (`spec.md`)** - PRIMARY ORGANIZATION:
   - Mỗi user story (P1, P2, P3...) là một phase riêng
   - Map toàn bộ thành phần liên quan vào đúng story:
     - Models cần cho story đó
     - Services cần cho story đó
     - Interfaces/UI cần cho story đó
     - Nếu có yêu cầu tests: tests riêng cho story đó
   - Ghi rõ dependencies giữa các story (đa số story nên độc lập nếu có thể)

2. **Từ Contracts**:
   - Map mỗi interface contract vào user story mà nó phục vụ
   - Nếu có yêu cầu tests: mỗi interface contract cần một contract test task `[P]` trước task implementation trong phase của story tương ứng

3. **Từ Data Model**:
   - Map mỗi entity vào user story hoặc các user story cần nó
   - Nếu entity phục vụ nhiều story: đặt vào story sớm nhất hoặc Setup phase
   - Relationships nên được map thành service layer tasks trong phase phù hợp

4. **Từ Setup/Infrastructure**:
   - Shared infrastructure → Setup phase (Phase 1)
   - Foundational/blocking tasks → Foundational phase (Phase 2)
   - Story-specific setup → đặt trong phase của story tương ứng

### Phase Structure

- **Phase 1**: Setup (khởi tạo project)
- **Phase 2**: Foundational (các phần blocking - PHẢI hoàn tất trước user stories)
- **Phase 3+**: User Stories theo thứ tự ưu tiên (P1, P2, P3...)
  - Bên trong mỗi story: Tests (nếu có yêu cầu) → Models → Services → Endpoints → Integration
  - Mỗi phase phải là một increment hoàn chỉnh và có thể test độc lập
- **Final Phase**: Polish & Cross-Cutting Concerns