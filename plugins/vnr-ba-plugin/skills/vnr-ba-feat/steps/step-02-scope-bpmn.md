# Step 02 — Scope & BPMN Feature Flow

## Hành động 0: Tích hợp Wireframe (nếu có)

Nếu `HAS_WIREFRAME = true` (từ Step 01), và `SCREEN_INVENTORY_DRAFT` đã có:

**Đối chiếu Screen Inventory với Scope trước khi vẽ BPMN:**

```
Màn hình trong wireframe:
  #1 — [Tên màn hình]  →  thuộc scope FEAT này? (IN / OUT / UNCLEAR)
  #2 — [Tên màn hình]  →  ...
  ...

Luồng trong wireframe:
  [Bước A] → [Bước B]  →  cover bởi FAC nào? (FAC-001 / chưa có / out of scope)
```

Nếu wireframe chứa màn hình / luồng NGOÀI scope FEAT này → ghi vào Out of Scope và ghi chú "Thấy trong wireframe nhưng thuộc FEAT khác: [tên]".

Nếu wireframe thiếu màn hình so với scope đã khai báo → đánh dấu "Màn hình [X]: chưa có trong wireframe — BA cần bổ sung hoặc xác nhận".

---

## Section 1: Mô tả & Scope

```markdown
## 1. Mô tả & Scope

**Mục đích:** {Business value của FEAT này}

**IN SCOPE:**
- {Capability cụ thể sẽ được build}

**OUT OF SCOPE:**
- {Những gì không làm trong FEAT này — kể cả edge case defer}

**Depends on:** {FEAT/EPIC khác nếu có}
```

---

## Section 2: BPMN Feature Flow

Vẽ Mermaid swimlane cho FEAT này — multi-actor, flow tổng thể:

```mermaid
flowchart LR
  classDef default font-size:11px,line-height:1.2

  subgraph Actor1["{Actor 1}"]
    A([Bắt đầu]) --> B[{Bước}]
    B --> C{Điều kiện?}
    C -->|Không| D[/Lỗi/]
    C -->|Có| E[{Tiếp}]
  end

  subgraph Actor2["{Actor 2}"]
    F[Xem xét] --> G{Duyệt?}
  end

  subgraph HeThong["Hệ thống"]
    H[Tự động xử lý] --> I([Kết thúc])
  end

  E --> F
  G -->|Có| H
  G -->|Không| D
```

**Lưu ý:** Đây là BPMN ở cấp FEAT — không đi vào chi tiết từng step như Activity Diagram của US.

---

## Section 2b: Screen Inventory (Danh sách Màn hình)

Dù có hay không có wireframe, tạo bảng Screen Inventory cho FEAT này:

```markdown
| # | Tên màn hình (nghiệp vụ) | Loại | Actor chính | Trạng thái cần có | Nguồn |
|---|---|---|---|---|---|
| 1 | [Tên] | Trang / Dialog / Drawer | [Actor] | Có dữ liệu / Rỗng / Lỗi | Wireframe / Đề xuất |
| 2 | ... | | | | |
```

**Cột Loại:** Trang chính / Form trang mới / Dialog xác nhận / Drawer / Panel bên / Trạng thái

**Cột Trạng thái cần có:** Liệt kê các trạng thái UI cần thiết kế cho màn hình đó

**Cột Nguồn:**
- `Wireframe` = thấy rõ trong wireframe đã cung cấp
- `Đề xuất` = suy ra từ BPMN và BR-F, chưa có wireframe
- `Chưa rõ` = cần BA xác nhận có màn hình này không

---

Hỏi BA:
```
Scope, BPMN Flow và Screen Inventory trên có phản ánh đúng FEAT [{FEAT-ID}] không?
Có màn hình nào thiếu hoặc thừa không?
```

Sau khi BA approve, đọc: `./steps/step-03-actor-task-matrix.md`
