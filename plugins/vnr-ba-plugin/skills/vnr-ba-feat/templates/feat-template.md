---
id: {MOD}-E{NN}-F{NN}
parent_epic: {MOD}-E{NN}
module: {MOD}
status: In Progress
us_count: 0
last_updated: {YYYY-MM-DD}
---

# {MOD}-E{NN}-F{NN} — {Tên FEAT}

**Module:** {MOD} | **EPIC:** [{MOD}-E{NN}](../../README.md) | **Actor chính:** {Actor}

---

## 1. Mô tả & Scope

**Mục đích:** {Business value của FEAT này — tại sao cần build}

**IN SCOPE:**
- {Capability cụ thể sẽ được build trong FEAT này}

**OUT OF SCOPE:**
- {Những gì không làm trong FEAT này — kể cả edge case defer}
- {Feature X — thuộc FEAT khác hoặc defer sang v2}

**Depends on:** {FEAT-ID khác nếu có — hoặc "Không có"}

---

## 2. BPMN Feature Flow

```mermaid
flowchart LR
  classDef default font-size:11px,line-height:1.2

  subgraph Actor1["{Actor 1}"]
    A([Bắt đầu]) --> B[{Bước}]
    B --> C{Điều kiện?}
    C -->|Không hợp lệ| D[/Hiển thị lỗi/]
    C -->|Hợp lệ| E[{Tiếp theo}]
  end

  subgraph Actor2["{Actor 2}"]
    F[Xem xét] --> G{Phê duyệt?}
    G -->|Có| H[Xác nhận]
    G -->|Không| I[Từ chối + Lý do]
  end

  subgraph HeThong["Hệ thống"]
    J[Tự động xử lý] --> K([Kết thúc])
  end

  E --> F
  H --> J
  I --> D
```

---

## 3. Actor-Task Matrix

*Đây là nguồn sự thật cho việc phát sinh US ID mới — đếm số US hiện có để lấy next U{NN}.*

| Actor | Task | Mô tả nghiệp vụ | Edge Cases | → US Dự kiến | Priority |
|---|---|---|---|---|:---:|
| {Actor 1} | {Task A} | {Làm gì, khi nào, kết quả gì} | {EC-01} | {MOD}-E{NN}-F{NN}-U01 | P1 |
| {Actor 1} | {Task B — Edge case} | {Tình huống bất thường} | {EC-03} | {MOD}-E{NN}-F{NN}-U02 | P2 |
| {Actor 2} | {Task C} | {Mô tả} | — | {MOD}-E{NN}-F{NN}-U03 | P1 |
| Hệ thống | {Task tự động D} | {Tự động xảy ra khi...} | — | {MOD}-E{NN}-F{NN}-U04 | P1 |

---

## 4. Business Rules (BR-F)

- **BR-F01 ({Tên ngắn}):** {Mô tả rule nghiệp vụ cấp FEAT}
  *(Specialise BR-E01 — thêm điều kiện: {mô tả sự khác biệt})*

- **BR-F02 ({Tên ngắn}):** {Mô tả}
  *(Kế thừa BR-E02)*

- **BR-F03 ({Tên mới}):** {Mô tả rule phát sinh từ scope FEAT này}
  *(BR mới — không có tương ứng tại EPIC cha)*

- **Gợi ý phát triển tương lai:** {Rule hoặc tính năng có thể bổ sung}

---

## 5. Feature Acceptance Criteria (FAC)

- **FAC-01 ({Tên}):** {Điều kiện tổng quát — khi nào FEAT được coi là done}
  - *US trace về FAC này: U01, U02*

- **FAC-02 ({Tên}):** {Điều kiện khác}
  - *US trace về FAC này: U03*

- **FAC-03 (Edge Cases covered):** Tất cả edge cases trong Actor-Task Matrix phải có US đạt AC tương ứng.
  - *US trace về FAC này: Tất cả US edge case*

---

## 6. Danh sách US

*Đây là nguồn sự thật cho việc phát sinh US ID mới — đếm số dòng để lấy next U{NN}.*

| US ID | Actor | Task | Status | Link |
|---|---|---|---|---|
| {MOD}-E{NN}-F{NN}-U01 | {Actor} | {Tên Task} | Not Started | — |
| {MOD}-E{NN}-F{NN}-U02 | {Actor} | {Tên Task} | Not Started | — |

---

## 7. Dependencies

**FEAT này phụ thuộc vào:**
| FEAT/Module | Cần gì | Status |
|---|---|---|
| {MOD}-E{NN}-F{NN} | {Dữ liệu/config cần} | Done / In Progress |

**FEAT khác phụ thuộc vào FEAT này:**
| FEAT | Cần gì |
|---|---|
| {MOD}-E{NN}-F{NN} | {Mô tả} |

---

## Changelog

| Ngày | Thay đổi | Lý do |
|---|---|---|
| {YYYY-MM-DD} | Tạo mới | — |
