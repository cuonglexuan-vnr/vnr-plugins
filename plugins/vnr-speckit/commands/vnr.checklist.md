---
description: Tạo checklist tùy biến cho feature hiện tại để kiểm tra chất lượng requirement theo chuẩn Vnr.
handoffs: []
---

## Checklist Purpose: "Unit Tests cho Requirements"

**KHÁI NIỆM CỐT LÕI**: Checklist là **bộ unit test cho requirement được viết bằng ngôn ngữ tự nhiên** - dùng để kiểm tra chất lượng, độ rõ ràng, tính đầy đủ và mức sẵn sàng implement của requirement.

**KHÔNG dùng cho verification/testing implementation**:

- ❌ KHÔNG phải "Kiểm tra button click đúng"
- ❌ KHÔNG phải "Test API trả 200"
- ❌ KHÔNG phải "Xác nhận màn hình render đúng"
- ❌ KHÔNG phải đối chiếu code đã làm có đúng spec hay chưa

**DÙNG để kiểm tra chất lượng requirement**:

- ✅ "Yêu cầu phân quyền đã được mô tả cho tất cả vai trò liên quan chưa?" [Completeness]
- ✅ "Thuật ngữ 'nhanh' đã được lượng hóa bằng SLA/thời gian phản hồi cụ thể chưa?" [Clarity]
- ✅ "Yêu cầu auth có nhất quán giữa web, API và admin flow không?" [Consistency]
- ✅ "Các trường hợp thiếu quyền / session hết hạn đã có requirement riêng chưa?" [Coverage]
- ✅ "Spec có mô tả hành vi khi dữ liệu DB thiếu hoặc không hợp lệ không?" [Edge Case]

**Ẩn dụ**: Nếu spec là code viết bằng tiếng người, thì checklist chính là test suite cho chất lượng của phần "code tiếng người" đó.

## User Input

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét input của người dùng trước khi tiếp tục (nếu không rỗng).

## Execution Steps

1. **Khởi tạo ngữ cảnh**
   - Xác định `FEATURE_DIR` hiện tại và danh sách tài liệu đang có.
   - Bắt buộc kiểm tra các file sau nếu tồn tại:
     - `spec.md`
     - `plan.md`
     - `tasks.md`
     - `constitution.md`
   - Đồng thời nạp các standards của Vnr nếu có:
     - `.vnr-speckit/standards/01-tech-stack.md`
     - `.vnr-speckit/standards/02-architecture-and-structure.md`
     - `.vnr-speckit/standards/03-data-and-auth.md`
     - `.vnr-speckit/standards/04-vnr-framework.md`
     - `.vnr-speckit/standards/05-internal-fe-framework-and-flow.md`
     - `.vnr-speckit/standards/06-team-principles-and-conventions.md`
   - Nếu thiếu `spec.md`, dừng và yêu cầu người dùng chạy command trước đó.

2. **Làm rõ ý định (dynamic)**
   - Sinh tối đa **3 câu hỏi làm rõ ban đầu**, dựa trên:
     - nội dung `$ARGUMENTS`
     - tín hiệu đọc được từ `spec.md` / `plan.md` / `tasks.md`
     - standards / constitution của Vnr
   - Chỉ hỏi những gì làm thay đổi đáng kể checklist.
   - Bỏ qua câu hỏi nếu user đã nói rõ trong `$ARGUMENTS`.
   - Ưu tiên các trục làm rõ:
     - **Scope**: checklist tập trung vào auth, data, UI, API, integration, release gate...?
     - **Risk**: điểm nào phải gate chặt?
     - **Depth**: checklist nhẹ cho self-review hay checklist formal cho PR/review/release?
     - **Audience**: tác giả, reviewer, QA, tech lead?
     - **Boundary**: có loại trừ performance / rollback / migration / legacy MVC / micro-frontend không?
   - Nếu cần đưa lựa chọn, dùng bảng ngắn:
     - `Option | Candidate | Why It Matters`
   - Nếu vẫn còn mơ hồ sau khi user trả lời, có thể hỏi thêm tối đa **2 câu** nữa.
   - Không vượt quá **5 câu hỏi** tổng cộng.

   **Mặc định nếu không thể tương tác:**
   - Depth: Standard
   - Audience: Reviewer nếu là feature code-related, Author nếu không rõ
   - Focus: 2 nhóm rủi ro cao nhất

3. **Hiểu yêu cầu checklist**
   Kết hợp:
   - `$ARGUMENTS`
   - câu trả lời làm rõ
   - nội dung trong `spec.md`, `plan.md`, `tasks.md`
   - `constitution.md`
   - standards của Vnr

   Để suy ra:
   - checklist theme (auth, api, ux, release, security, data, review, migration...)
   - các mục bắt buộc user đã nêu
   - mức độ nghiêm ngặt
   - actor/timing sử dụng checklist

4. **Nạp feature context**
   Đọc từ `FEATURE_DIR`:

   - `spec.md`: requirement và scope
   - `plan.md` (nếu có): kiến trúc, dependency, technical constraint
   - `tasks.md` (nếu có): hướng triển khai
   - `constitution.md` (nếu có): nguyên tắc bắt buộc

   **Chiến lược nạp ngữ cảnh**:
   - Chỉ đọc phần liên quan tới focus area đang chọn
   - Không dump toàn bộ file
   - Tóm tắt các requirement/scenario thành bullet ngắn
   - Chỉ nạp thêm khi phát hiện khoảng trống cần kiểm tra

5. **Sinh checklist - "Unit Tests cho Requirements"**
   - Tạo thư mục `FEATURE_DIR/checklists/` nếu chưa có
   - Tạo tên file checklist ngắn gọn theo domain:
     - `auth.md`
     - `api.md`
     - `security.md`
     - `data.md`
     - `ux.md`
     - `review.md`
   - Format file: `[domain].md`

   **Quy tắc ghi file**:
   - Nếu file **chưa tồn tại**: tạo mới, đánh số từ `CHK001`
   - Nếu file **đã tồn tại**: append thêm item mới, tiếp tục số ID cuối cùng
   - Không được xóa hay ghi đè nội dung checklist cũ

   **NGUYÊN TẮC CỐT LÕI - kiểm tra requirement, không kiểm tra implementation**
   Mỗi checklist item phải đánh giá requirement theo một hoặc nhiều tiêu chí sau:
   - **Completeness**
   - **Clarity**
   - **Consistency**
   - **Measurability**
   - **Coverage**
   - **Traceability**
   - **Assumption / Dependency clarity**

   **Nhóm checklist nên có**
   - Requirement Completeness
   - Requirement Clarity
   - Requirement Consistency
   - Acceptance Criteria Quality
   - Scenario Coverage
   - Edge Case Coverage
   - Non-Functional Requirements
   - Dependencies & Assumptions
   - Ambiguities & Conflicts
   - Vnr Standards Alignment

   **Cách viết checklist item**
   Mỗi item nên:
   - ở dạng câu hỏi
   - tập trung vào requirement đã viết hoặc còn thiếu
   - có nhãn chất lượng trong `[]`
   - tham chiếu `[Spec §X.Y]` nếu kiểm tra requirement đã tồn tại
   - dùng `[Gap]`, `[Ambiguity]`, `[Conflict]`, `[Assumption]` nếu đang chỉ ra chỗ thiếu/vướng

   **Ví dụ đúng**
   - "Yêu cầu phân quyền đã được xác định cho tất cả vai trò sử dụng chức năng này chưa? [Coverage, Spec §FR-003]"
   - "Thuật ngữ 'dữ liệu realtime' đã được định nghĩa bằng tiêu chí cập nhật cụ thể chưa? [Clarity]"
   - "Các yêu cầu auth có nhất quán giữa spec nghiệp vụ và technical plan không? [Consistency]"
   - "Spec đã mô tả hành vi khi DB trả dữ liệu rỗng hoặc thiếu quan hệ chưa? [Edge Case, Gap]"
   - "Các yêu cầu liên quan DB đã tuân thủ hướng DB-First chưa? [Vnr Standards Alignment]"
   - "Yêu cầu frontend có mô tả rõ boundary giữa Angular 18 app và legacy MVC page không? [Completeness]"
   - "Acceptance criteria có đủ cụ thể để reviewer xác nhận mà không cần suy đoán thêm không? [Measurability]"

   **Scenario coverage**
   Kiểm tra requirement có bao phủ:
   - Primary flow
   - Alternate flow
   - Exception / Error flow
   - Recovery flow
   - Non-functional scenarios
   - Permission / access-denied scenarios
   - Legacy compatibility scenarios (nếu có)

   **Traceability**
   - Tối thiểu **80% item** phải có ít nhất một traceability marker:
     - `[Spec §X.Y]`
     - `[Gap]`
     - `[Ambiguity]`
     - `[Conflict]`
     - `[Assumption]`
   - Nếu chưa có ID scheme rõ ràng, thêm item:
     - "Đã có quy ước ID cho requirement và acceptance criteria để trace checklist chưa? [Traceability]"

   **Consolidation**
   - Nếu candidate items > 40, ưu tiên theo rủi ro/tác động
   - Gộp item gần trùng nhau
   - Nếu có quá nhiều edge case nhỏ, gộp thành 1 item bao quát

   **🚫 TUYỆT ĐỐI KHÔNG**
   - ❌ "Verify ..."
   - ❌ "Test ..."
   - ❌ "Confirm ..."
   - ❌ "Check button/API/UI có hoạt động không"
   - ❌ mô tả test case implementation
   - ❌ nói về click, render, execute, return 200, load đúng...
   - ❌ kiểm tra code chạy đúng spec

   **✅ MẪU CÂU NÊN DÙNG**
   - ✅ "Yêu cầu ... đã được định nghĩa/mô tả cho ... chưa?"
   - ✅ "Thuật ngữ ... đã được lượng hóa/làm rõ chưa?"
   - ✅ "Requirement giữa ... và ... có nhất quán không?"
   - ✅ "Acceptance criteria này có đo được/xác minh khách quan được không?"
   - ✅ "Spec đã bao phủ trường hợp ... chưa?"
   - ✅ "Tài liệu đã nêu rõ giả định/phụ thuộc ... chưa?"

6. **Format checklist**
   - Nếu có template chuẩn của Vnr thì dùng template đó
   - Nếu không có, dùng format mặc định:
     - `#` title
     - metadata purpose/created
     - mỗi section là `##`
     - mỗi item là:
       - `- [ ] CHK### ...`

7. **Report**
   Sau khi sinh checklist, output:
   - full path file checklist
   - số lượng item đã tạo/thêm
   - đây là file mới hay append vào file cũ
   - focus areas đã chọn
   - depth level
   - actor/timing
   - các must-have user đã yêu cầu và đã được đưa vào checklist

## Example Checklist Types

**Auth Requirements Quality:** `auth.md`
- "Yêu cầu xác thực đã được mô tả cho tất cả entry point cần bảo vệ chưa? [Coverage]"
- "Các rule phân quyền có được xác định rõ theo vai trò/phạm vi dữ liệu không? [Clarity]"
- "Yêu cầu xử lý access denied có nhất quán giữa UI, API và admin flow không? [Consistency]"
- "Spec có nêu rõ hành vi khi token/session hết hạn không? [Gap]"
- "Các giả định về identity source / SSO đã được ghi nhận rõ chưa? [Assumption]"

**Data Requirements Quality:** `data.md`
- "Yêu cầu dữ liệu đã xác định rõ nguồn dữ liệu, bảng/liên kết và ownership chưa? [Completeness]"
- "Các thay đổi dữ liệu có được mô tả theo hướng DB-First không? [Vnr Standards Alignment]"
- "Spec đã nêu trường hợp dữ liệu thiếu, null, trùng hoặc không hợp lệ chưa? [Edge Case]"
- "Các quy tắc mapping dữ liệu giữa domain và DB có rõ ràng, đo được không? [Clarity]"
- "Các giả định về quyền đọc/ghi dữ liệu đã được nêu rõ chưa? [Dependency]"

**UI / UX Requirements Quality:** `ux.md`
- "Boundary giữa Angular 18 feature và legacy MVC page đã được mô tả rõ chưa? [Completeness]"
- "Các yêu cầu trạng thái loading/empty/error đã được định nghĩa đầy đủ chưa? [Coverage]"
- "Thuật ngữ như 'thân thiện', 'dễ dùng', 'rõ ràng' đã được lượng hóa chưa? [Ambiguity]"
- "Các yêu cầu điều hướng có nhất quán giữa các màn hình liên quan không? [Consistency]"
- "Spec có bao phủ hành vi khi micro-frontend không tải được hoặc tải chậm không? [Gap]"

**Security / Compliance Requirements Quality:** `security.md`
- "Yêu cầu bảo vệ dữ liệu nhạy cảm đã được chỉ rõ cho từng loại dữ liệu chưa? [Completeness]"
- "Các yêu cầu audit/logging cho hành vi nhạy cảm đã được mô tả chưa? [Gap]"
- "Spec có xác định rõ actor nào được xem/sửa/xóa dữ liệu nào không? [Coverage]"
- "Yêu cầu bảo mật có nhất quán với auth flow trong plan không? [Consistency]"
- "Các tình huống lỗi bảo mật hoặc truy cập trái phép đã có requirement xử lý chưa? [Exception Flow]"

## Anti-Examples

**❌ Sai - đang test implementation**

```md
- [ ] CHK001 - Verify user không có quyền thì bị chặn ở API
- [ ] CHK002 - Test Angular app load độc lập
- [ ] CHK003 - Confirm admin MVC page vẫn chạy bình thường
- [ ] CHK004 - Check API trả 403 khi không đủ quyền
```

**✅ Đúng - đang test chất lượng requirement**

```md
- [ ] CHK001 - Yêu cầu phân quyền đã được mô tả cho mọi actor liên quan chưa? [Coverage, Spec §FR-002]
- [ ] CHK002 - Điều kiện để trả về access denied đã được định nghĩa rõ chưa? [Clarity, Spec §FR-004]
- [ ] CHK003 - Boundary giữa Angular 18 module và legacy MVC page đã được mô tả nhất quán chưa? [Consistency]
- [ ] CHK004 - Spec đã nêu rõ hành vi khi người dùng có session hợp lệ nhưng thiếu quyền dữ liệu chưa? [Gap]
- [ ] CHK005 - Các yêu cầu dữ liệu đã phản ánh đúng nguyên tắc DB-First chưa? [Vnr Standards Alignment]
```

**Khác biệt cốt lõi:**
- Sai: kiểm tra hệ thống có hoạt động đúng không
- Đúng: kiểm tra requirement có được viết đủ rõ và đủ tốt để implement không
- Sai: "Hệ thống có làm X không?"
- Đúng: "Requirement về X đã được mô tả rõ, đủ, nhất quán, đo được chưa?"