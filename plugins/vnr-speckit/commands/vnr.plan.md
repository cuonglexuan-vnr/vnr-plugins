---
description: Thực thi workflow lập kế hoạch implementation bằng plan template để sinh ra các design artifacts.
handoffs: 
  - label: Create Tasks
    agent: vnr.tasks
    prompt: Phân rã kế hoạch này thành các task
    send: true
  - label: Create Checklist
    agent: vnr.checklist
    prompt: Tạo checklist cho domain sau...
---

## User Input

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét input của người dùng trước khi tiếp tục (nếu không rỗng).

## Pre-Execution Checks

**Kiểm tra extension hooks (trước khi lập kế hoạch)**:
- Kiểm tra xem `.vnr-speckit/extensions.yml` có tồn tại ở root của project hay không.
- Nếu có, đọc file này và tìm các entry trong `hooks.before_plan`
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

1. **Setup**: Chạy `.vnr-speckit/scripts/powershell/setup-plan.ps1 -Json` từ root của repo và parse JSON để lấy `FEATURE_SPEC`, `IMPL_PLAN`, `SPECS_DIR`, `BRANCH`. Tất cả path phải là absolute path. Với chuỗi có dấu nháy đơn như `"I'm Groot"`, dùng escape phù hợp: ví dụ `'I'\''m Groot'` (hoặc dùng double quote nếu có thể: `"I'm Groot"`).

2. **Load context**: Đọc `FEATURE_SPEC` và `.vnr-speckit/memory/constitution.md`. Load `IMPL_PLAN` template (đã được copy sẵn).

3. **Thực thi workflow lập plan**: Làm theo đúng cấu trúc trong `IMPL_PLAN` template để:
   - Điền phần Technical Context (đánh dấu các chỗ chưa rõ là `"NEEDS CLARIFICATION"`)
   - Điền phần Constitution Check từ constitution
   - Đánh giá các gate (ERROR nếu có vi phạm mà không có lý do chính đáng)
   - Phase 0: Sinh `research.md` để resolve toàn bộ `NEEDS CLARIFICATION`
   - Phase 1: Sinh `data-model.md`, `contracts/`, `quickstart.md`
   - Phase 1: Cập nhật agent context bằng cách chạy script cập nhật agent
   - Re-evaluate Constitution Check sau khi hoàn tất phần design

4. **Dừng và báo cáo**: Command kết thúc sau Phase 2 planning. Báo cáo branch, đường dẫn `IMPL_PLAN`, và các artifact đã được sinh ra.

5. **Kiểm tra extension hooks**: Sau khi báo cáo xong, kiểm tra xem `.vnr-speckit/extensions.yml` có tồn tại ở root project hay không.
   - Nếu có, đọc và tìm `hooks.after_plan`
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

## Phases

### Phase 0: Outline & Research

1. **Trích xuất các điểm chưa rõ từ Technical Context** bên trên:
   - Với mỗi `NEEDS CLARIFICATION` → tạo research task
   - Với mỗi dependency → tạo task nghiên cứu best practices
   - Với mỗi integration → tạo task nghiên cứu pattern phù hợp

2. **Sinh và dispatch research agents**:

   ```text
   Với mỗi unknown trong Technical Context:
     Task: "Research {unknown} for {feature context}"
   Với mỗi lựa chọn công nghệ:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Tổng hợp kết quả** vào `research.md` theo format:
   - Decision: [đã chọn gì]
   - Rationale: [vì sao chọn]
   - Alternatives considered: [đã cân nhắc phương án nào khác]

**Output**: `research.md` với toàn bộ `NEEDS CLARIFICATION` đã được xử lý

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` đã hoàn tất

1. **Trích xuất entities từ feature spec** → `data-model.md`:
   - Tên entity, fields, relationships
   - Validation rules lấy từ requirements
   - State transitions nếu có

2. **Định nghĩa interface contracts** (nếu project có external interfaces) → `/contracts/`:
   - Xác định các interface mà project expose cho user hoặc hệ thống khác
   - Document contract theo format phù hợp với loại project
   - Ví dụ: public APIs cho library, command schemas cho CLI tool, endpoints cho web service, grammar cho parser, UI contracts cho application
   - Bỏ qua nếu project hoàn toàn internal (build scripts, one-off tools, v.v.)

3. **Cập nhật agent context**:
   - Chạy `.vnr-speckit/scripts/powershell/update-agent-context.ps1 -AgentType claude`
   - Các script này sẽ detect AI agent hiện đang dùng
   - Cập nhật đúng file context dành cho agent tương ứng
   - Chỉ thêm công nghệ mới từ plan hiện tại
   - Giữ nguyên các phần bổ sung thủ công nằm giữa các marker

**Output**: `data-model.md`, `/contracts/*`, `quickstart.md`, file context dành cho agent

## Key rules
- Luôn dùng absolute paths
- ERROR nếu fail gate hoặc còn clarification chưa được resolve