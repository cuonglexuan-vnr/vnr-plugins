# vnr-plugin

> **VNR Plugin** — Plugin hỗ trợ quy trình phát triển phần mềm của VNR.

Plugin chạy trên harness Claude Code / agent, cung cấp một pipeline phát triển đầy đủ — từ đặc tả tính năng đến triển khai, kiểm thử, review và xuất báo cáo cuối cùng. Plugin điều phối một đội agent chuyên biệt qua các workflow có cấu trúc, từng bước.

---

## Tính năng cung cấp

| Lĩnh vực | Nội dung |
|---|---|
| **Đặc tả** | Tạo và kiểm tra chất lượng đặc tả tính năng kèm checklist |
| **Lập kế hoạch** | Kế hoạch triển khai theo kiến trúc, data model và API contracts |
| **Phân rã task** | Danh sách task có thứ tự, phân tách phụ thuộc, tổ chức theo user story và phase |
| **Triển khai** | Thực thi code từng phase dựa trên tasks.md |
| **QC & Kiểm thử** | Sinh test scenarios, viết testcase, chạy E2E và review QC |
| **Code Review** | Review kiến trúc và bảo mật với kết quả PASS / PASS+WARN / FAIL |
| **Tài liệu** | Báo cáo cuối pipeline và hướng dẫn người dùng từ kết quả thực tế |
| **Cơ sở tri thức** | Đọc wiki/docs và đồng bộ LLM-wiki |
| **Tự động hóa** | Pipeline đầy đủ: spec → plan → tasks → implement → test → review → report |
| **Tùy chỉnh** | Ghi đè skill và agent ở phạm vi project |

---

## Skills (Lệnh sử dụng)

| Skill | Lệnh | Mục đích |
|---|---|---|
| `vnr-specify` | `/vnr-specify` | **Fallback** — tạo stub User Story (`<US-ID>_*.md`) từ mô tả ngôn ngữ tự nhiên khi BA chưa giao file. Quy trình chuẩn: BA tạo User Story file và dev copy vào `specs/<US-ID>/`. |
| `vnr-clarify` | `/vnr-clarify` | Đặt tối đa 5 câu hỏi làm rõ các vùng chưa xác định trong spec |
| `vnr-analyze` | `/vnr-analyze` | Phân tích chéo các artifact (spec, plan, tasks) để tìm thiếu sót và mâu thuẫn |
| `vnr-checklist` | `/vnr-checklist` | Sinh checklist kiểm tra chất lượng đặc tả ("unit test cho spec") |
| `vnr-plan` | `/vnr-plan` | Tạo `plan.md`, `data-model.md` và `contracts/` từ đặc tả tính năng |
| `vnr-tasks` | `/vnr-tasks` | Phân rã kế hoạch thành `tasks.md` có thứ tự và phụ thuộc rõ ràng |
| `vnr-implement` | `/vnr-implement` | Thực thi kế hoạch triển khai từng phase theo `tasks.md` |
| `vnr-run-testcases` | `/vnr-run-testcases` | Hiển thị, theo dõi và cập nhật trạng thái testcase trong `testcases.md` |
| `vnr-run-e2e` | `/vnr-run-e2e` | Chạy Playwright E2E tests, thu thập screenshots và xuất HTML report |
| `vnr-qc-assistant` | `/vnr-qc-assistant` | QA assistant hai chế độ: áp dụng phản hồi QC hoặc audit testcase |
| `vnr-wiki` | `/vnr-wiki` | Đọc và điều hướng `docs/wiki/` để lấy context nghiệp vụ / domain |
| `vnr-wiki-sync` | `/vnr-wiki-sync` | Đồng bộ LLM wiki đã biên dịch với tài liệu nguồn mới nhất |
| `vnr-constitution` | `/vnr-constitution` | Tạo hoặc cập nhật constitution dự án và đồng bộ template phụ thuộc |
| `vnr-auto-pipeline` | `/vnr-auto-pipeline` | Chạy pipeline tự động đầy đủ: spec → plan → plan review → tasks → testcases → implement → arch+sec review → e2e stubs → report |
| `vnr-customize` | `/vnr-customize` | Tạo hoặc ghi đè skill/agent ở phạm vi project để tùy chỉnh plugin |

---

## Pipeline Tự Động (`vnr-auto-pipeline`)

Skill chủ đạo chạy toàn bộ pipeline phát triển theo trình tự có checkpoint:

```
BA User Story file (<US-ID>_*.md) → plan.md → plan review (HITL) → tasks.md → testcases.md → implement → arch review + sec review → e2e stubs → final report
```

Mỗi giai đoạn uỷ quyền cho agent chuyên biệt tương ứng. Pipeline có checkpoint — có thể tiếp tục từ giai đoạn bị lỗi mà không cần chạy lại từ đầu.

---

## Agents

Plugin đi kèm một đội agent chuyên biệt. Mỗi agent có vai trò, hợp đồng I/O và ràng buộc riêng.

### `vnr-planner` — Software Architect / Tech Lead

> Tạo kế hoạch triển khai từ đặc tả tính năng, tuân theo quy ước dự án và constitution.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | Software Architect / Tech Lead |
| **Đầu vào** | BA User Story file (`<US-ID>_*.md`, shape: `templates/userstory-template.md`), optional BA `<US-ID>_*_ui-detail.md`, `memory/constitution.md`, wiki context, templates |
| **Đầu ra** | `plan.md`, `data-model.md`, `contracts/api-commitments.md`, `research.md` |

**Ràng buộc:** Chỉ đọc so với triển khai (không viết code). Báo lỗi khi có điểm chưa giải quyết. Phải tuân theo templates và kiểm tra constitution.

---

### `vnr-plan-reviewer` — Người Review Kế Hoạch ✦ MỚI

> Review `plan.md` đối chiếu User Story để kiểm tra spec coverage, alignment kiến trúc và tính khả thi. Chạy tự động sau `vnr-planner`; cung cấp PASS/WARN/FAIL kèm bảng findings để Human đưa ra quyết định approve/reject đúng đắn.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | Plan Quality Reviewer |
| **Đầu vào** | `plan.md`, `data-model.md`, `contracts/api-commitments.md`, BA User Story file, architecture standards, constitution |
| **Đầu ra** | Verdict review (PASS/WARN/FAIL) + bảng findings (18 checks: spec coverage, API contracts, architecture alignment, feasibility) |

**Ràng buộc:** Chỉ đọc — không sửa plan. Chỉ report. Human quyết định approve/reject/modify.

---

### `vnr-task-breaker` — Tech Lead (Phân rã Task)

> Phân rã kế hoạch giao hàng thành task chi tiết, đặc định file-path, có phụ thuộc rõ ràng.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | Tech Lead |
| **Đầu vào** | `plan.md` (bắt buộc), `data-model.md`, `contracts/`, standards |
| **Đầu ra** | `specs/<feature>/tasks.md` — tổ chức theo phase và user story, có T-ID, phụ thuộc và marker song song |

**Ràng buộc:** Task phải đủ nhỏ và đặc định file-path. Không được gộp các layer không liên quan vào một task.

---

### `vnr-backend-developer` — Backend Developer

> Triển khai code ASP.NET Core từng phase theo tasks.md. Chỉ xử lý các task `src/backend/`.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | Backend Developer |
| **Đầu vào** | `tasks.md` (bắt buộc), `plan.md`, `data-model.md`, `contracts/api-commitments.md`, wiki context |
| **Đầu ra** | Code trong `src/backend/`; đánh dấu BE task `[x]` khi hoàn thành; báo cáo build status |

**Ràng buộc:** Không thêm tính năng ngoài tasks. Tuân theo Clean Architecture / CQRS. Không đụng vào `src/frontend/` hay `src/app-mobile/`.

---

### `vnr-frontend-developer` — Frontend Developer

> Triển khai code Angular 19 từng phase theo tasks.md. Chỉ xử lý các task `src/frontend/`.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | Frontend Developer |
| **Đầu vào** | `tasks.md` (bắt buộc), `plan.md`, `contracts/api-commitments.md` (đọc đầu tiên để lấy API shape), wiki context |
| **Đầu ra** | Code trong `src/frontend/`; đánh dấu FE task `[x]` khi hoàn thành; báo cáo build status |

**Ràng buộc:** Không thêm tính năng ngoài tasks. Tuân theo Angular 19 Micro-frontend conventions. Không đụng vào `src/backend/` hay `src/app-mobile/`.

---

### `vnr-qc-generator` — QC Engineer (Shift-Left)

> Sinh test scenarios và Playwright stubs trước khi triển khai.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | QC Engineer |
| **Đầu vào** | Wiki (index/concepts/entities), BA User Story file (`<US-ID>_*.md`) §3/§4/§7, `plan.md`, standards |
| **Đầu ra** | `specs/<feature>/test-scenarios.md` (dạng Gherkin), `src/frontend/e2e/<feature>.e2e.spec.ts` (stubs với `test.todo`) |

**Ràng buộc:** Chỉ tạo stub (`test.todo`) — không cài đặt thân test.

---

### `vnr-test-engineer` — Test Engineer

> Viết unit test và cài đặt Playwright E2E từ stub.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | Test Engineer |
| **Đầu vào** | `test-scenarios.md`, `plan.md`, `contracts/api-commitments.md`, git diff |
| **Đầu ra** | File unit test (xUnit/Moq cho backend, Jasmine cho frontend), Playwright thay thế `test.todo` thành test đầy đủ |

**Ràng buộc:** **Không** sửa application source code — chỉ viết test. Mục tiêu độ phủ ≥ 80%.

---

### `vnr-qc-assistant` — QA/QC Assistant (Hai Chế Độ)

> Áp dụng phản hồi QC vào testcase hoặc audit testcase để cải thiện chất lượng.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | QA/QC Assistant |
| **Đầu vào** | `specs/<US-ID>/testcases.md` (bắt buộc); chế độ Reviewer thêm User Story file (`<US-ID>_*.md`), `plan.md`, `tasks.md`, wiki |
| **Đầu ra** | **Chế độ Feedback:** `testcases.md` đã cập nhật + tóm tắt chỉnh sửa. **Chế độ Reviewer:** bảng review 10 tiêu chí + danh sách gợi ý cải thiện |

**Ràng buộc:** Chế độ Feedback chỉ áp dụng đúng phản hồi QC. Chế độ Reviewer không sửa file trừ khi QC cho phép. Hỏi người dùng khi chế độ chưa rõ.

---

### `vnr-testcase-writer` — QA Test Analyst

> Viết testcase manual chi tiết từ spec và plan.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | QA Test Analyst |
| **Đầu vào** | User Story file (`<US-ID>_*.md`), `plan.md`, `tasks.md`, wiki |
| **Đầu ra** | `specs/<feature>/testcases.md` — testcase manual với điều kiện tiên quyết, dữ liệu test, các bước, kết quả mong đợi |

**Ràng buộc:** Tạo testcase có thể đọc và thực thi bởi con người. Map với automation TC ID khi có thể. Không viết test code.

---

### `vnr-arch-reviewer` — Software Architect Reviewer

> Review thay đổi code về mức độ tuân thủ kiến trúc.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | Software Architect Reviewer |
| **Đầu vào** | Phạm vi git diff, standards kiến trúc (backend/frontend), specs/contracts, file đã thay đổi |
| **Đầu ra** | Markdown review kiến trúc với kết quả **PASS** / **PASS+WARN** / **FAIL** và bảng phát hiện (file:dòng, vi phạm, gợi ý sửa) |

**Ràng buộc:** Chỉ đọc — không sửa code. Phát hiện nghiêm trọng dẫn đến kết quả FAIL.

---

### `vnr-sec-reviewer` — Security Reviewer

> Review thay đổi code về lỗ hổng bảo mật.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | Security Reviewer |
| **Đầu vào** | Phạm vi git diff, standards bảo mật, scan patterns từ `security-hooks.json`, file đã thay đổi |
| **Đầu ra** | Markdown review bảo mật với kết quả **PASS** / **PASS+WARN** / **FAIL**, phát hiện ánh xạ theo danh mục OWASP |

**Ràng buộc:** Chỉ đọc. Kết quả FAIL nên dừng pipeline. Tuân theo scan patterns từ hooks.

---

### `vnr-tech-writer` — Technical Writer

> Xuất báo cáo cuối pipeline và hướng dẫn người dùng từ kết quả thực tế.

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò** | Technical Writer |
| **Đầu vào** | Kết quả review kiến trúc + bảo mật, kết quả unit & E2E test, screenshots, spec/plan, wiki context |
| **Đầu ra** | `specs/<feature>/result/final-report.md`, `specs/<feature>/result/user-guide.md` |

**Ràng buộc:** Chỉ dựa trên kết quả thực tế (không suy đoán). Ưu tiên Tiếng Việt cho tài liệu người dùng. Chỉ tham chiếu các file/screenshot đã tồn tại.

---

## Cấu Trúc Đầu Ra

Mỗi tính năng tạo ra artifact theo cây thư mục nhất quán:

```
specs/
 └── <US-ID>/                           # mỗi folder = một User Story (vd SCC-E01-F01-U02)
      ├── <US-ID>_<slug>.md             # BA User Story file — nguồn sự thật (SWE chỉ đọc)
      ├── <US-ID>_<slug>_ui-detail.md   # BA UI detail (tuỳ chọn; ui-detail.md là SWE fallback)
      ├── research.md                   # phân tích & background (tùy chọn)
      ├── data-model.md                 # phụ thuộc dữ liệu (chỉ đọc với hầu hết agent)
      ├── plan.md                       # kế hoạch triển khai (đầu ra vnr-planner)
      ├── tasks.md                      # phân rã task (đầu ra vnr-task-breaker)
      ├── test-scenarios.md             # QC scenarios (đầu ra vnr-qc-generator)
      ├── testcases.md                  # testcase manual (đầu ra vnr-testcase-writer)
      ├── checklists/                   # checklist chất lượng yêu cầu
      ├── contracts/
      │    └── api-commitments.md
      └── result/
           ├── final-report.md          # tóm tắt pipeline (đầu ra vnr-tech-writer)
           └── user-guide.md            # tài liệu người dùng cuối

src/
 ├── backend/                   # code backend (đầu ra vnr-backend-developer)
 └── frontend/
      └── e2e/
           └── <feature>.e2e.spec.ts   # E2E tests (đầu ra vnr-test-engineer)
```

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
4. MCP servers là **tùy chọn** — các skill cốt lõi hoạt động bình thường mà không cần kết nối, nhưng các tính năng đẩy dữ liệu lên TFS hoặc AMIS task boards thì cần.

---

## Cài đặt

1. **Sao chép plugin** vào thư mục plugins của harness (hoặc đường dẫn harness quét để tìm plugin).

2. **Xem xét quyền** — `settings.json` đặt `defaultPermissionMode: "acceptEdits"`. Điều chỉnh theo chính sách của nhóm bạn.

3. **Cấu hình MCP endpoints** (tùy chọn) — cập nhật `.mcp.json` với URL đúng và đặt `AMIS_USER_ID`.

4. **Khởi động lại harness** để harness nhận plugin từ `.claude-plugin/plugin.json`.

5. **Kiểm tra** bằng cách chạy `/vnr-wiki` — skill sẽ điều hướng `docs/wiki/` và trả về context.

---

## Templates

Thư mục `templates/` cung cấp các template chuẩn được dùng bởi agents và skills:

| Template | Mục đích |
|---|---|
| `spec-template.md` | Cấu trúc đặc tả tính năng |
| `plan-template.md` | Cấu trúc kế hoạch triển khai |
| `tasks-template.md` | Định dạng phân rã task |
| `checklist-template.md` | Checklist chất lượng đặc tả |
| `constitution-template.md` | Constitution / quản trị dự án |
| `agent-file-template.md` | Template định nghĩa agent |

---

## Các File Cấu Hình

| File | Mục đích |
|---|---|
| `.claude-plugin/plugin.json` | Metadata plugin (tên, phiên bản, mô tả, tác giả) |
| `settings.json` | Chế độ quyền mặc định của harness |
| `.mcp.json` | Định nghĩa MCP / SSE server endpoint |
| `extensions.yml` | Định nghĩa extension của plugin |
| `integration.json` | Cấu hình tích hợp bên ngoài |
| `init-options.json` | Tùy chọn khởi tạo plugin |
| `hooks/security-hooks.json` | Scan patterns bảo mật cho `vnr-sec-reviewer` |

---

## Thông Tin Plugin

| Trường | Giá trị |
|---|---|
| Tên | `vnr-plugin` |
| Phiên bản | `1.0.0` |
| Tác giả | VNR Team |
| Runtime | Claude Code / agent harness (content-driven) |

---

## Cách Workflow Hoạt Động

Mỗi skill tuân theo mẫu sau, được harness thực thi:

```
SKILL.md  →  workflow.md  →  steps/step-01.md … step-N.md
```

- **Từng bước một**: harness load và thực thi từng file step riêng lẻ.
- **Agent chuyên biệt**: mỗi bước uỷ quyền cho một agent được đặt tên (ví dụ: `vnr-planner`, `vnr-backend-developer`, `vnr-frontend-developer`) có hợp đồng I/O xác định.
- **Checkpoint BA**: pipeline tự động dừng tại các gate xác định để con người review trước khi tiếp tục.
- **Templates**: mọi artifact đầu ra đều được render từ các template chuẩn trong `templates/`.
