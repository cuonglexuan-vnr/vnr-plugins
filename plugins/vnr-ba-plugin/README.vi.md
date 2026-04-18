# vnr-ba-plugin

> **BA Plugin** — Công cụ viết User Story, quản lý EPIC/FEAT và bàn giao BA→Dev cho đội ngũ BA của VNR.

Plugin chạy trên harness Claude Code / agent, cung cấp cho Business Analyst một bộ công cụ có cấu trúc, từng bước — từ nghiên cứu nghiệp vụ đến User Story sẵn sàng chuyển giao cho Dev.

---

## Tính năng cung cấp

| Lĩnh vực | Nội dung |
|---|---|
| **Quản lý EPIC** | Workflow 6 bước tạo Ma trận Stakeholder-Capability và tài liệu EPIC |
| **Soạn thảo FEAT** | Tài liệu FEAT 7 phần kèm Ma trận Actor-Task |
| **Tạo User Story** | Workflow đơn lẻ và theo lô, tự động ~95%, chỉ 1 checkpoint BA (Acceptance Criteria) |
| **Research Brief** | Workflow nghiên cứu nghiệp vụ và xuất tài liệu Research Brief có cấu trúc |
| **Quy tắc BA** | BA Constitution được quản lý phiên bản, kèm Sync Impact Report mỗi lần cập nhật |
| **Review & Phân tích** | Skill chuyên dụng phân tích, review và cải thiện User Story hiện có |
| **Hướng dẫn & Hỗ trợ** | BA Help assistant hướng dẫn sử dụng toàn bộ toolkit |
| **Công cụ bổ trợ** | Wireframe assistant, retrospective, PBI composer, specify, clarify, design, v.v. |

---

## Skills (Lệnh sử dụng)

Mỗi skill được kích hoạt bằng câu lệnh hoặc cụm từ kích hoạt trong harness.

| Skill | Cụm từ kích hoạt | Mục đích |
|---|---|---|
| `vnr-ba-epic` | `ba epic` | Tạo hoặc cập nhật tài liệu EPIC |
| `vnr-ba-feat` | `ba feat` | Tạo hoặc cập nhật tài liệu FEAT và Ma trận Actor-Task |
| `vnr-ba-us` | `ba us` | Tạo một User Story từ một mục Actor-Task |
| `vnr-ba-write-us` | `write us`, `write us from analyze`, `write us from wireframe`, `update us` | Workflow tạo User Story tự động 15 bước |
| `vnr-ba-researcher` | `ba research`, `ba researcher` | Nghiên cứu nghiệp vụ và xuất Research Brief |
| `vnr-ba-constitution` | `ba constitution` | Xem hoặc cập nhật Quy tắc BA / BA Constitution |
| `vnr-ba-analyze-us` | `analyze us`, `ba analyze` | Phân tích User Story hiện có để tìm thiếu sót |
| `vnr-ba-review-us` | `review us`, `ba review` | Peer-review User Story theo chuẩn BA |
| `vnr-ba-wireframe` | `ba wireframe` | Tạo hoặc tinh chỉnh mô tả wireframe UI |
| `vnr-ba-pbi-compose` | `ba pbi`, `pbi compose` | Tổng hợp Product Backlog Item từ tài liệu có sẵn |
| `vnr-ba-specify` | `ba specify` | Viết đặc tả chi tiết cho một tính năng |
| `vnr-ba-clarify` | `ba clarify` | Làm rõ các yêu cầu còn mơ hồ |
| `vnr-ba-design` | `ba design` | Phác thảo ghi chú thiết kế cấp cao |
| `vnr-ba-retrospective` | `ba retro` | Tổ chức buổi BA retrospective |
| `vnr-ba-help` | `ba help`, `help me` | Hướng dẫn tương tác toàn bộ toolkit |

---

## Cấu trúc tài liệu User Story

Workflow `vnr-ba-write-us` (15 bước, 1 checkpoint BA) tạo ra tài liệu User Story hoàn chỉnh gồm:

- **Metadata** — ID, tiêu đề, liên kết FEAT, độ ưu tiên, ước tính effort
- **Business Context** — mục tiêu, actor, điều kiện tiên quyết / hậu quyết
- **Acceptance Criteria** — các kịch bản có cấu trúc, *BA phải duyệt trước khi tiếp tục* (checkpoint duy nhất)
- **Business Rules** — quy tắc nghiệp vụ đánh số, được tham chiếu từ AC
- **Data Dictionary** — định nghĩa trường, kiểu dữ liệu, ràng buộc
- **Validation Messages** — thông báo lỗi và thành công hiển thị cho người dùng
- **Activity Diagram** — sơ đồ Mermaid mô tả happy path và các luồng thay thế
- **UI/UX Description** — mô tả tương tác từng màn hình
- **Tracking & Events** — sự kiện analytics gắn với hành động người dùng
- **Traceability Matrix** — ánh xạ AC → Business Rules → Data fields

---

## Đường dẫn đầu ra

Tài liệu được ghi vào workspace theo quy ước:

| Tài liệu | Đường dẫn mặc định |
|---|---|
| User Stories | `spec-kit/specs/<feature>/` |
| FEAT documents | `specs/<feature>/spec.md` |
| EPIC documents | `specs/<epic>/` |
| Research Briefs | `specs/<feature>/research.md` |
| Data models | `specs/<feature>/data-model.md` |
| Plans & tasks | `specs/<feature>/plan.md`, `tasks.md` |

> Có thể điều chỉnh đường dẫn bằng cách sửa các file cấu hình trong thư mục `agents/`.

---

## Agents

Plugin đi kèm hai agent xác định vai trò, trách nhiệm và hợp đồng I/O trong harness.

### `vnr-ba-agent` — Business Analyst / Chủ sở hữu Spec-kit

> BA Agent — chủ sở hữu spec-kit. Viết và duy trì specs, định nghĩa business rules và acceptance criteria.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | Business Analyst |
| **Đầu vào** | `spec-kit/context/*`, `business-requirements/` |
| **Đầu ra** | `spec-kit/specs/*` |

**Trách nhiệm**
- Viết và duy trì toàn bộ tài liệu đặc tả nghiệp vụ.
- Định nghĩa business rules và acceptance criteria.

**Quy tắc bắt buộc**
- `spec-kit/` là **nguồn sự thật duy nhất** — mọi tài liệu BA phải lưu tại đây.
- Agent này **tuyệt đối không** được tạo code hay tài liệu thiết kế kỹ thuật.

---

### `vnr-ba-planner` — BA Planner / Senior Delivery Planner

> Lập kế hoạch giao hàng BA dựa trên specs hiện có. Quản lý thư mục tính năng dưới `/specs`.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | Senior Delivery Planner / Technical PM |
| **Đầu ra chính** | `/specs/<feature>/plan.md` |

**Trách nhiệm**
- Tạo kế hoạch giao hàng từ nội dung spec hiện có.
- Quản lý cấu trúc thư mục `/specs/<feature>/` cho từng tính năng.
- Phối hợp với Task Agent (Task Agent sở hữu `tasks.md`).

**Cấu trúc thư mục (bắt buộc phải nắm)**

```
/specs/
 └── <feature-folder>/
      ├── spec.md          # phạm vi nghiệp vụ — nguồn sự thật (Planner đọc)
      ├── research.md      # phân tích & background (tùy chọn)
      ├── data-model.md    # phụ thuộc — CHỈ ĐỌC, không được sửa
      ├── plan.md          # ← Đầu ra của Planner (kế hoạch giao hàng)
      ├── tasks.md         # do Task Agent viết, Planner không sở hữu
      ├── checklists/      # tham chiếu rủi ro
      └── contracts/       # tham chiếu interface
```

**Ràng buộc**
- `data-model.md` là **chỉ đọc** — Planner không được chỉnh sửa.
- Mỗi tính năng phải có đúng một thư mục con dưới `/specs/`.
- `tasks.md` thuộc quyền sở hữu của Task Agent; Planner chỉ đọc.

---

## MCP Servers

Plugin kết nối đến hai máy chủ MCP nội bộ kiểu SSE (Server-Sent Events), cấu hình trong `.mcp.json`.

| Server | Kiểu | URL | Mục đích |
|---|---|---|---|
| `tfs` | SSE | `http://172.21.55.10:8000/sse` | Tích hợp TFS (work items, changesets) |
| `amis-task` | SSE | `http://172.21.55.10:8001/sse` | Tích hợp quản lý task AMIS |

### Cấu hình

```json
{
  "mcpServers": {
    "tfs": {
      "type": "sse",
      "url": "http://172.21.55.10:8000/sse"
    },
    "amis-task": {
      "type": "sse",
      "url": "http://172.21.55.10:8001/sse",
      "env": {
        "AMIS_USER_ID": "your_user_id_here"
      }
    }
  }
}
```

**Các bước thiết lập:**
1. Đảm bảo máy có quyền truy cập mạng nội bộ đến `172.21.55.10`.
2. Thay `"your_user_id_here"` bằng AMIS User ID thực tế của bạn.
3. Nếu URL endpoint thay đổi, cập nhật lại trong `.mcp.json`.
4. MCP servers là **tùy chọn** — các BA skill cốt lõi hoạt động bình thường mà không cần kết nối, nhưng các tính năng đẩy dữ liệu lên TFS hoặc bảng task AMIS thì cần kết nối.

---

## Cài đặt

1. **Sao chép plugin** vào thư mục plugins của harness (hoặc đường dẫn harness quét để tìm plugin).

2. **Merge permissions** — `settings.json` ở thư mục gốc plugin khai báo bộ quyền cần thiết cho harness. Merge hoặc xem xét chúng vào cấu hình harness toàn cục.

3. **Cấu hình MCP endpoints** (tùy chọn) — cập nhật `.mcp.json` với URL và `AMIS_USER_ID` theo hướng dẫn ở trên.

4. **Khởi động lại harness** để harness nhận plugin từ `.claude-plugin/plugin.json`.

5. **Kiểm tra** bằng cách gõ `ba help` — help skill sẽ phản hồi với hướng dẫn toàn bộ toolkit.

---

## Các file cấu hình

| File | Mục đích |
|---|---|
| `.claude-plugin/plugin.json` | Metadata plugin (tên, phiên bản, mô tả, tác giả) |
| `settings.json` | Chính sách quyền harness cho plugin |
| `.mcp.json` | Định nghĩa MCP / SSE server endpoint |
| `agents/vnr-ba-agent.md` | Định nghĩa vai trò và hợp đồng I/O của BA agent |
| `agents/vnr-ba-planner.md` | Định nghĩa vai trò của Planner agent |
| `templates/us-template.md` | Template User Story chuẩn |

---

## Thông tin plugin

| Trường | Giá trị |
|---|---|
| Tên | `vnr-ba-plugin` |
| Phiên bản | `1.0.0` |
| Tác giả | VNR BA Team |
| Runtime | Claude Code / agent harness (chỉ nội dung, không có code biên dịch) |
| Ngôn ngữ | Tiếng Việt (chính), Tiếng Anh (ghi chú kỹ thuật) |

---

## Cách workflow hoạt động

Mỗi skill tuân theo mẫu sau, được harness thực thi:

```
SKILL.md  →  workflow.md  →  steps/step-01.md … step-N.md
```

- **Từng bước một**: harness load và thực thi từng file step riêng lẻ.
- **Checkpoint BA**: các quyết định quan trọng (ví dụ: duyệt AC trong `vnr-ba-write-us`) yêu cầu BA xác nhận trước khi workflow tiếp tục.
- **Templates**: tài liệu cuối cùng được render từ template Markdown (ví dụ: `templates/us-template.md`).

Thiết kế này đảm bảo BA kiểm soát các cổng chất lượng quan trọng trong khi tự động hóa phần công việc cơ học.

---

## Lưu ý

- Plugin này **chỉ là nội dung** — không có source code biên dịch hay thực thi.
- Toàn bộ workflow và template được viết bằng **Tiếng Việt** phù hợp với đội ngũ BA VNR.
- Trước khi triển khai trên harness dùng chung hoặc production, hãy review và thu hẹp danh sách quyền trong `settings.json` chỉ giữ lại những gì nhóm bạn thực sự cần.
