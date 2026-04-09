---
description: Tạo mới hoặc cập nhật feature specification từ mô tả tính năng bằng ngôn ngữ tự nhiên.
handoffs: 
  - label: Build Technical Plan
    agent: vnr.plan
    prompt: Tạo kế hoạch kỹ thuật cho đặc tả này. Tôi đang xây dựng với...
  - label: Clarify Spec Requirements
    agent: vnr.clarify
    prompt: Làm rõ các yêu cầu của đặc tả
    send: true
---

## User Input

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét input của người dùng trước khi tiếp tục (nếu không rỗng).

## Pre-Execution Checks

**Kiểm tra extension hooks (trước khi tạo đặc tả)**:
- Kiểm tra xem `.vnr-speckit/extensions.yml` có tồn tại ở root của project hay không.
- Nếu có, đọc file này và tìm các entry trong `hooks.before_specify`
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

Phần text mà người dùng nhập sau `/vnr.specify` **chính là** mô tả tính năng. Hãy giả định rằng bạn luôn có thể lấy được nội dung này trong cuộc hội thoại hiện tại, kể cả khi `$ARGUMENTS` xuất hiện nguyên văn bên dưới. Không hỏi người dùng nhập lại trừ khi command thực sự rỗng.

Dựa trên mô tả tính năng đó, thực hiện như sau:

1. **Sinh short name ngắn gọn** (2-4 từ) cho branch:
   - Phân tích mô tả tính năng và trích xuất các từ khóa có ý nghĩa nhất
   - Tạo short name dài 2-4 từ thể hiện đúng bản chất của tính năng
   - Ưu tiên format động từ + danh từ nếu phù hợp (ví dụ: `add-user-auth`, `fix-payment-bug`)
   - Giữ nguyên các technical term và acronym quan trọng (OAuth2, API, JWT, SSO, RBAC, v.v.)
   - Ngắn gọn nhưng vẫn đủ rõ nghĩa để nhìn branch là hiểu
   - Ví dụ:
     - "Tôi muốn thêm chức năng đăng nhập người dùng" → `user-auth`
     - "Tích hợp OAuth2 cho API" → `oauth2-api-integration`
     - "Tạo dashboard phân tích" → `analytics-dashboard`
     - "Sửa lỗi timeout khi xử lý thanh toán" → `fix-payment-timeout`

2. **Tạo feature branch** bằng script với `--short-name` (và `--json`). Ở sequential mode, **không** truyền `--number` — script sẽ tự tìm số tiếp theo. Ở timestamp mode, script sẽ tự tạo prefix `YYYYMMDD-HHMMSS`:

   **Branch numbering mode**: Trước khi chạy script, kiểm tra xem `.vnr-speckit/init-options.json` có tồn tại không và đọc giá trị `branch_numbering`.
   - Nếu là `"timestamp"`, thêm `--timestamp` (Bash) hoặc `-Timestamp` (PowerShell)
   - Nếu là `"sequential"` hoặc không có, không cần thêm flag nào (mặc định)

   - Bash example: `.vnr-speckit/scripts/powershell/create-new-feature.ps1 "$ARGUMENTS" --json --short-name "user-auth" "Add user authentication"`
   - Bash (timestamp): `.vnr-speckit/scripts/powershell/create-new-feature.ps1 "$ARGUMENTS" --json --timestamp --short-name "user-auth" "Add user authentication"`
   - PowerShell example: `.vnr-speckit/scripts/powershell/create-new-feature.ps1 "$ARGUMENTS" -Json -ShortName "user-auth" "Add user authentication"`
   - PowerShell (timestamp): `.vnr-speckit/scripts/powershell/create-new-feature.ps1 "$ARGUMENTS" -Json -Timestamp -ShortName "user-auth" "Add user authentication"`

   **IMPORTANT**:
   - Không truyền `--number` — script sẽ tự xác định số tiếp theo
   - Luôn bật JSON flag (`--json` với Bash, `-Json` với PowerShell) để parse output ổn định
   - Chỉ được chạy script này **một lần duy nhất cho mỗi feature**
   - JSON output sẽ được in ra terminal — luôn dùng nó để lấy `BRANCH_NAME`, `SPEC_FILE`, `FEATURE_DIR`
   - Với chuỗi có dấu nháy đơn như `I'm Groot`, dùng escape phù hợp: ví dụ `'I'\''m Groot'` hoặc dùng double quote nếu có thể

3. Load `.vnr-speckit/templates/spec-template.md` để hiểu các section bắt buộc.

4. Load `.vnr-speckit/memory/constitution.md` nếu file tồn tại để đảm bảo đặc tả không vi phạm các nguyên tắc kỹ thuật và delivery rules của Vnr.

5. Thực hiện theo luồng sau:

    1. Parse mô tả người dùng từ Input  
       Nếu rỗng: ERROR `"No feature description provided"`

    2. Trích xuất các khái niệm chính từ mô tả  
       Xác định: actor, action, data, constraint

    3. Với các điểm chưa rõ:
       - Đưa ra giả định hợp lý dựa trên context, domain hiện có và chuẩn thông thường
       - Chỉ đánh dấu `[NEEDS CLARIFICATION: câu hỏi cụ thể]` nếu:
         - Quyết định đó ảnh hưởng đáng kể đến scope hoặc trải nghiệm người dùng
         - Có nhiều cách hiểu hợp lý với các hệ quả khác nhau
         - Không có default đủ an toàn để suy ra
       - **GIỚI HẠN: tối đa 3 marker `[NEEDS CLARIFICATION]`**
       - Ưu tiên theo thứ tự: scope > security/privacy > user experience > technical details

    4. Điền section User Scenarios & Testing  
       Nếu không xác định được luồng người dùng rõ ràng: ERROR `"Cannot determine user scenarios"`

    5. Sinh Functional Requirements  
       Mỗi requirement phải test được  
       Dùng default hợp lý cho các chi tiết chưa nêu rõ và ghi lại trong section Assumptions

    6. Xác định Success Criteria  
       Tạo các kết quả đo lường được, không phụ thuộc công nghệ  
       Bao gồm cả chỉ số định lượng (thời gian, hiệu năng, số lượng, tỉ lệ) và định tính (mức hoàn thành tác vụ, mức hài lòng, v.v.)  
       Mỗi tiêu chí phải có thể kiểm chứng mà không cần biết cách implement

    7. Xác định Key Entities (nếu feature có dữ liệu liên quan)

    8. Kiểm tra sự phù hợp với constitution (nếu có):
       - Không đưa implementation detail trái với nguyên tắc constitution
       - Không mô tả yêu cầu đi ngược kiến trúc, auth/data rule, hoặc Vnr framework rule đã được xác lập
       - Nếu phát hiện mâu thuẫn nghiêm trọng với constitution, dừng và nêu rõ điểm xung đột

    9. Trả về: SUCCESS (spec sẵn sàng cho bước planning)

6. Ghi specification vào `SPEC_FILE` theo đúng cấu trúc của template, thay placeholder bằng nội dung cụ thể suy ra từ feature description, đồng thời giữ nguyên thứ tự section và heading.

7. **Specification Quality Validation**: Sau khi ghi spec ban đầu, validate spec theo các tiêu chí chất lượng:

   a. **Tạo Spec Quality Checklist**: Sinh file checklist tại `FEATURE_DIR/checklists/requirements.md` theo cấu trúc sau:

      ```markdown
      # Specification Quality Checklist: [FEATURE NAME]
      
      **Purpose**: Validate specification completeness and quality before proceeding to planning
      **Created**: [DATE]
      **Feature**: [Link to spec.md]
      
      ## Content Quality
      
      - [ ] No implementation details (languages, frameworks, APIs)
      - [ ] Focused on user value and business needs
      - [ ] Written for non-technical stakeholders
      - [ ] All mandatory sections completed
      
      ## Requirement Completeness
      
      - [ ] No [NEEDS CLARIFICATION] markers remain
      - [ ] Requirements are testable and unambiguous
      - [ ] Success criteria are measurable
      - [ ] Success criteria are technology-agnostic (no implementation details)
      - [ ] All acceptance scenarios are defined
      - [ ] Edge cases are identified
      - [ ] Scope is clearly bounded
      - [ ] Dependencies and assumptions identified
      
      ## Feature Readiness
      
      - [ ] All functional requirements have clear acceptance criteria
      - [ ] User scenarios cover primary flows
      - [ ] Feature meets measurable outcomes defined in Success Criteria
      - [ ] No implementation details leak into specification
      
      ## Notes
      
      - Items marked incomplete require spec updates before `/vnr.clarify` or `/vnr.plan`
      ```

   b. **Chạy validation**: Rà soát spec với từng item trong checklist:
      - Với mỗi item, xác định pass hoặc fail
      - Ghi lại issue cụ thể nếu có (trích đúng section liên quan trong spec)

   c. **Xử lý kết quả validation**:

      - **Nếu tất cả pass**: đánh dấu checklist hoàn tất và chuyển sang bước 8

      - **Nếu có item fail (trừ `[NEEDS CLARIFICATION]`)**:
        1. Liệt kê các item fail và issue cụ thể
        2. Cập nhật spec để xử lý từng issue
        3. Chạy lại validation cho đến khi pass hết (tối đa 3 vòng)
        4. Nếu sau 3 vòng vẫn fail, ghi lại issue còn lại trong phần Notes của checklist và cảnh báo người dùng

      - **Nếu vẫn còn marker `[NEEDS CLARIFICATION]`**:
        1. Trích xuất toàn bộ marker `[NEEDS CLARIFICATION: ...]` từ spec
        2. **LIMIT CHECK**: Nếu có hơn 3 marker, chỉ giữ lại 3 marker quan trọng nhất (theo scope/security/UX impact), phần còn lại phải tự suy luận bằng default hợp lý
        3. Với mỗi câu hỏi cần làm rõ (tối đa 3), trình bày theo format sau:

           ```markdown
           ## Question [N]: [Topic]
           
           **Context**: [Quote relevant spec section]
           
           **What we need to know**: [Specific question from NEEDS CLARIFICATION marker]
           
           **Suggested Answers**:
           
           | Option | Answer | Implications |
           |--------|--------|--------------|
           | A      | [First suggested answer] | [What this means for the feature] |
           | B      | [Second suggested answer] | [What this means for the feature] |
           | C      | [Third suggested answer] | [What this means for the feature] |
           | Custom | Provide your own answer | [Explain how to provide custom input] |
           
           **Your choice**: _[Wait for user response]_
           ```

        4. **CRITICAL - Table Formatting**:
           - Markdown table phải format đúng
           - Dùng spacing nhất quán với dấu `|`
           - Mỗi cell nên có khoảng trắng: `| Content |`
           - Hàng separator phải có ít nhất 3 dấu `-`
           - Đảm bảo render đúng trong markdown preview

        5. Đánh số câu hỏi tuần tự (Q1, Q2, Q3 - tối đa 3 câu)
        6. Trình bày tất cả câu hỏi cùng lúc trước khi chờ người dùng phản hồi
        7. Chờ người dùng trả lời cho tất cả câu hỏi (ví dụ: `"Q1: A, Q2: Custom - ..., Q3: B"`)
        8. Cập nhật spec bằng cách thay thế từng marker `[NEEDS CLARIFICATION]` bằng câu trả lời người dùng chọn/cung cấp
        9. Chạy lại validation sau khi tất cả clarification đã được xử lý

   d. **Cập nhật checklist**: Sau mỗi vòng validation, cập nhật lại file checklist với trạng thái pass/fail hiện tại

8. Báo cáo kết quả hoàn tất với:
   - branch name
   - spec file path
   - checklist results
   - mức độ sẵn sàng cho bước tiếp theo (`/vnr.clarify` hoặc `/vnr.plan`)

9. **Kiểm tra extension hooks** sau khi báo cáo xong:
   - Kiểm tra xem `.vnr-speckit/extensions.yml` có tồn tại ở root project hay không
   - Nếu có, đọc và tìm `hooks.after_specify`
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

**NOTE:** Script sẽ tạo branch mới, checkout branch đó và khởi tạo sẵn spec file trước khi ghi nội dung.

## Quick Guidelines

- Tập trung vào **WHAT** người dùng cần và **WHY** nó có giá trị.
- Tránh nói về **HOW** để implement (không nhắc tech stack, API cụ thể, code structure).
- Viết cho business stakeholder hoặc product owner, không phải chỉ cho developer.
- **KHÔNG** nhúng checklist trực tiếp vào spec. Checklist là file riêng.

### Section Requirements

- **Mandatory sections**: phải có ở mọi feature
- **Optional sections**: chỉ thêm khi thực sự liên quan
- Nếu một section không áp dụng, hãy bỏ hẳn section đó thay vì để `"N/A"`

### For AI Generation

Khi tạo spec từ user prompt:

1. **Đưa ra giả định hợp lý**: dùng context, domain knowledge và pattern phổ biến để lấp chỗ trống
2. **Ghi Assumptions**: lưu lại các default hợp lý trong section Assumptions
3. **Hạn chế clarification**: tối đa 3 marker `[NEEDS CLARIFICATION]`, chỉ dùng cho các quyết định thật sự quan trọng
4. **Ưu tiên clarification**: scope > security/privacy > user experience > technical details
5. **Suy nghĩ như tester**: requirement nào mơ hồ thì phải fail checklist “testable and unambiguous”
6. **Các vùng hay cần clarification** (chỉ hỏi khi không có default hợp lý):
   - Scope và boundary của feature
   - User type và permission
   - Security/compliance requirement
   - Các quy tắc đặc thù nghiệp vụ có nhiều cách hiểu

**Ví dụ về default hợp lý** (không cần hỏi thêm):

- Data retention: theo thông lệ chuẩn của domain
- Performance target: theo kỳ vọng chuẩn của web/mobile app nếu chưa có ràng buộc riêng
- Error handling: thông báo thân thiện với người dùng, có fallback phù hợp
- Authentication method: theo pattern chuẩn của hệ thống hiện có
- Integration pattern: theo pattern phù hợp với loại project đang làm

### Success Criteria Guidelines

Success criteria phải:

1. **Đo được**: có metric cụ thể (thời gian, %, số lượng, tỉ lệ)
2. **Không phụ thuộc công nghệ**: không nhắc framework, language, database, tool
3. **User-focused**: mô tả outcome từ góc nhìn user/business
4. **Có thể kiểm chứng**: validate được mà không cần biết cách implement

**Ví dụ tốt**:

- "Người dùng có thể hoàn thành quy trình tạo yêu cầu trong dưới 3 phút"
- "95% thao tác tìm kiếm trả kết quả trong dưới 2 giây"
- "Tỉ lệ hoàn thành tác vụ tăng ít nhất 30%"
- "Người quản lý có thể xác định trạng thái phê duyệt mà không cần thao tác bổ sung"

**Ví dụ không tốt**:

- "API response time dưới 200ms"
- "Database xử lý được 1000 TPS"
- "Angular component render hiệu quả"
- "Redis cache hit rate trên 80%"