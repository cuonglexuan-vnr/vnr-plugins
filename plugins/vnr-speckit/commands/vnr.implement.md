---
description: Thực thi implementation plan bằng cách xử lý và triển khai toàn bộ các task được định nghĩa trong tasks.md
---

## User Input

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét input của người dùng trước khi tiếp tục (nếu không rỗng).

<framework_to_use>
**Required**: Read the file `.vnr-speckit/standards/05-internal-fe-framework-and-flow.md`. All controls/components **must** use vnr-module. For example: vnr-grid, vnr-grid-Edit-Incell, vnr-grid-Edit-Inline, vnr-toolbar. All controls/components **MUST** use the control set from vnr-module (e.g., vnr-button, vnr-select, vnr-input, etc.).
</framework_to_use>

## Pre-Execution Checks

**Kiểm tra extension hooks (trước khi implement)**:
- Kiểm tra xem `.vnr-speckit/extensions.yml` có tồn tại ở root của project hay không.
- Nếu có, đọc file này và tìm các entry trong `hooks.before_implement`
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

<framework_to_use>
**Required**: If doing frontend work, read the file `.vnr-speckit/standards/05-internal-fe-framework-and-flow.md`. All controls/components **must** use vnr-module. For example: vnr-grid, vnr-grid-Edit-Incell, vnr-grid-Edit-Inline, vnr-toolbar. All controls/components **MUST** use the control set from vnr-module (e.g., vnr-button, vnr-select, vnr-input, etc.).
</framework_to_use>

1. Chạy `.vnr-speckit/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` từ root của repo và parse `FEATURE_DIR` cùng danh sách `AVAILABLE_DOCS`. Tất cả path phải là absolute path. Với chuỗi có dấu nháy đơn như `"I'm Groot"`, dùng escape phù hợp: ví dụ `'I'\''m Groot'` (hoặc dùng double quote nếu có thể: `"I'm Groot"`).

2. **Kiểm tra trạng thái checklist** (nếu `FEATURE_DIR/checklists/` tồn tại):
   - Quét tất cả file checklist trong thư mục `checklists/`
   - Với mỗi checklist, đếm:
     - Tổng số item: tất cả dòng khớp với `- [ ]` hoặc `- [X]` hoặc `- [x]`
     - Số item đã hoàn thành: các dòng khớp với `- [X]` hoặc `- [x]`
     - Số item chưa hoàn thành: các dòng khớp với `- [ ]`
   - Tạo bảng trạng thái:

     ```text
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```

   - Tính trạng thái tổng thể:
     - **PASS**: tất cả checklist đều có 0 item chưa hoàn thành
     - **FAIL**: có ít nhất một checklist còn item chưa hoàn thành

   - **Nếu có checklist chưa hoàn tất**:
     - Hiển thị bảng với số item chưa hoàn thành
     - **DỪNG LẠI** và hỏi: `"Một số checklist vẫn chưa hoàn tất. Bạn có muốn tiếp tục implement không? (yes/no)"`
     - Chờ phản hồi của người dùng trước khi tiếp tục
     - Nếu người dùng trả lời `"no"` hoặc `"wait"` hoặc `"stop"`, dừng thực thi
     - Nếu người dùng trả lời `"yes"` hoặc `"proceed"` hoặc `"continue"`, tiếp tục sang bước 3

   - **Nếu tất cả checklist đều hoàn tất**:
     - Hiển thị bảng cho thấy tất cả checklist đều PASS
     - Tự động tiếp tục sang bước 3

3. Load và phân tích implementation context:
   - **REQUIRED**: Đọc `tasks.md` để lấy toàn bộ task list và execution plan
   - **REQUIRED**: Đọc `plan.md` để lấy tech stack, architecture và file structure
   - **IF EXISTS**: Đọc `data-model.md` để lấy entities và relationships
   - **IF EXISTS**: Đọc thư mục `contracts/` để lấy API specifications và test requirements
   - **IF EXISTS**: Đọc `research.md` để lấy các quyết định kỹ thuật và ràng buộc
   - **IF EXISTS**: Đọc `quickstart.md` để lấy các integration scenarios
   - **IF EXISTS**: Đọc `.vnr-speckit/memory/constitution.md` để đảm bảo implementation không vi phạm các nguyên tắc kỹ thuật, design system, các framework nội bộ và workflow rules đã được xác lập

4. **Project Setup Verification**:
   - **REQUIRED**: Tạo hoặc xác minh các file ignore dựa trên setup thực tế của project

   **Logic phát hiện & tạo file**:
   - Kiểm tra lệnh sau có chạy thành công hay không để xác định repository có phải git repo hay không (nếu đúng thì tạo/xác minh `.gitignore`):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

   - Kiểm tra có `Dockerfile*` hoặc có Docker trong `plan.md` → tạo/xác minh `.dockerignore`
   - Kiểm tra có `.eslintrc*` → tạo/xác minh `.eslintignore`
   - Kiểm tra có `eslint.config.*` → đảm bảo mục `ignores` trong config bao phủ các pattern cần thiết
   - Kiểm tra có `.prettierrc*` → tạo/xác minh `.prettierignore`
   - Kiểm tra có `.npmrc` hoặc `package.json` → tạo/xác minh `.npmignore` (nếu có publish package)
   - Kiểm tra có file terraform (`*.tf`) → tạo/xác minh `.terraformignore`
   - Kiểm tra có cần `.helmignore` hay không (nếu có helm charts) → tạo/xác minh `.helmignore`

   **Nếu file ignore đã tồn tại**: kiểm tra nó có đủ các pattern thiết yếu hay không, chỉ append các pattern quan trọng còn thiếu  
   **Nếu file ignore chưa tồn tại**: tạo mới với đầy đủ pattern phù hợp theo công nghệ được phát hiện

   **Common Patterns by Technology** (dựa trên tech stack trong `plan.md`):
   - **Node.js/JavaScript/TypeScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
   - **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
   - **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
   - **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
   - **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
   - **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
   - **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
   - **Rust**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
   - **Kotlin**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
   - **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
   - **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `*.dll`, `autom4te.cache/`, `config.status`, `config.log`, `.idea/`, `*.log`, `.env*`
   - **Swift**: `.build/`, `DerivedData/`, `*.swiftpm/`, `Packages/`
   - **R**: `.Rproj.user/`, `.Rhistory`, `.RData`, `.Ruserdata`, `*.Rproj`, `packrat/`, `renv/`
   - **Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

   **Tool-Specific Patterns**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`
   - **Kubernetes/k8s**: `*.secret.yaml`, `secrets/`, `.kube/`, `kubeconfig*`, `*.key`, `*.crt`

5. Parse cấu trúc `tasks.md` và trích xuất:
   - **Task phases**: Setup, Tests, Core, Integration, Polish
   - **Task dependencies**: quy tắc chạy tuần tự và song song
   - **Task details**: ID, mô tả, file paths, marker `[P]`
   - **Execution flow**: thứ tự và yêu cầu dependency

6. Thực thi implementation theo task plan:
   - **Thực thi theo từng phase**: hoàn tất phase hiện tại trước khi chuyển phase tiếp theo
   - **Tôn trọng dependencies**: task tuần tự phải chạy đúng thứ tự, các task song song `[P]` có thể chạy cùng nhau
   - **Tuân theo TDD nếu có yêu cầu**: thực hiện test tasks trước implementation tasks tương ứng
   - **Điều phối theo file**: các task tác động cùng một file phải chạy tuần tự
   - **Validation checkpoints**: xác minh hoàn tất từng phase trước khi tiếp tục

7. Quy tắc thực thi implementation:
   - **Setup trước**: khởi tạo project structure, dependencies, configuration
   - **Tests trước code**: nếu cần viết test cho contracts, entities và integration scenarios
   - **Core development**: implement models, services, CLI commands, endpoints
   - **Integration work**: database connections, middleware, logging, external services
   - **Polish và validation**: unit tests, performance optimization, documentation

8. Theo dõi tiến độ và xử lý lỗi:
   - Báo cáo tiến độ sau mỗi task hoàn tất
   - Dừng thực thi nếu bất kỳ task không-song-song nào thất bại
   - Với các task song song `[P]`, tiếp tục với các task thành công và báo cáo các task thất bại
   - Cung cấp thông báo lỗi rõ ràng kèm context để debug
   - Đề xuất bước tiếp theo nếu implementation không thể tiếp tục
   - **IMPORTANT**: với các task đã hoàn thành, phải đánh dấu task đó thành `[X]` trong file `tasks.md`

9. Kiểm tra hoàn tất:
   - Xác minh mọi task bắt buộc đã hoàn thành
   - Kiểm tra feature được implement có khớp với specification ban đầu hay không
   - Validate rằng test pass và coverage đáp ứng yêu cầu
   - Xác nhận implementation tuân theo technical plan
   - Xác nhận implementation không vi phạm các rule trong constitution nếu file này tồn tại
   - Báo cáo trạng thái cuối cùng cùng phần tóm tắt công việc đã hoàn tất

Lưu ý: Command này giả định rằng đã có một task breakdown đầy đủ trong `tasks.md`. Nếu task còn thiếu hoặc chưa hoàn chỉnh, hãy gợi ý chạy `/vnr.tasks` trước để regenerate task list.

10. **Kiểm tra extension hooks**: Sau khi completion validation xong, kiểm tra xem `.vnr-speckit/extensions.yml` có tồn tại ở root project hay không.
    - Nếu có, đọc file này và tìm `hooks.after_implement`
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