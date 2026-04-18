---
id: {MOD}-E{NN}
module: {MOD}
status: Draft
feat_count: 0
last_updated: {YYYY-MM-DD}
risk_overall: High | Medium | Low
research_brief: {đường dẫn tới research brief — để trống nếu chưa có}
---

# {MOD}-E{NN} — {Tên EPIC}

**Module:** [{MOD}](../../_index.md)

---

## PHẦN I — NỀN TẢNG

### 1. Định nghĩa & Bản chất

**Khái niệm:** {Mô tả domain là gì theo ngôn ngữ nghiệp vụ VN}

**Phân loại:**
- {Loại 1}: {Mô tả}
- {Loại 2}: {Mô tả}

**Vòng đời & Trạng thái:**
```
{Trạng thái 1} → {Trạng thái 2} → {Trạng thái 3} → {Trạng thái cuối}
```

| Trạng thái | Ý nghĩa | Ai có thể chuyển |
|---|---|---|
| {Trạng thái 1} | {Mô tả} | {Actor} |
| {Trạng thái 2} | {Mô tả} | {Actor} |

---

### 2. Stakeholders & Roles

| Actor | Vai trò | Quyền hạn trong EPIC này |
|---|---|---|
| {Actor 1} | {Mô tả vai trò} | {Những gì actor có thể làm} |
| {Actor 2} | {Mô tả vai trò} | {Quyền hạn} |
| Hệ thống | Xử lý tự động | {Các tác vụ tự động} |

---

### 3. Operational Context (Hiện trạng As-Is)

**Cách DN VN đang làm hiện tại:**
- {Mô tả quy trình thủ công / hệ thống cũ}
- {Tool đang dùng: Excel / Google Sheet / phần mềm cũ}
- {Pain point chính trong hiện trạng}

**Workaround phổ biến:** {Những gì HR đang làm để xử lý khi hệ thống không đủ}

---

## PHẦN II — CHIẾN LƯỢC

### 4. Pain Points theo Stakeholder

| Stakeholder | Pain Point cụ thể | Tần suất | Mức độ ảnh hưởng |
|---|---|:---:|:---:|
| {Actor 1} | {Vấn đề cụ thể, có thể đo lường} | Hàng ngày | Cao |
| {Actor 2} | {Vấn đề} | Hàng tuần | Trung bình |

---

### 5. BPMN Feature Flow (As-Is)

```mermaid
flowchart LR
  classDef default font-size:11px,line-height:1.2

  subgraph Actor1["{Actor 1}"]
    A([Bắt đầu]) --> B[{Bước thủ công}]
    B --> C{Điều kiện?}
  end

  subgraph Actor2["{Actor 2}"]
    D[{Xử lý thủ công}] --> E[{Kết quả}]
  end

  C -->|Có| D
  E --> F([Kết thúc])
```

---

### 6. BPMN Feature Flow (To-Be)

```mermaid
flowchart LR
  classDef default font-size:11px,line-height:1.2

  subgraph Actor1["{Actor 1}"]
    A([Bắt đầu]) --> B[{Bước với hệ thống}]
    B --> C{Validate?}
  end

  subgraph HeThong["Hệ thống"]
    D[Tự động xử lý] --> E([Kết thúc])
  end

  C -->|Hợp lệ| D
  C -->|Lỗi| F[/Hiển thị lỗi/] --> B
```

**Cải thiện so với As-Is:**
- {Bước X bị loại bỏ → tiết kiệm N ngày/tuần}
- {Bước Y được tự động hóa}

---

### 7. Success Metrics

| Metric | As-Is | To-Be | Cách đo |
|---|---|---|---|
| {Tên metric} | {Giá trị hiện tại} | {Mục tiêu} | {Phương pháp đo} |

---

## PHẦN III — SCOPE & RULES

### 8. Scope

**IN SCOPE:**
- {Feature/capability sẽ được build}

**OUT OF SCOPE:**
- {Tính năng X — defer sang EPIC khác hoặc v2}
- {Integration Y — thuộc module Z}

**Ranh giới với module khác:**
| Module | Nhận từ | Cung cấp cho |
|---|---|---|
| {Module A} | {Dữ liệu gì} | — |
| {Module B} | — | {Dữ liệu gì} |

---

### 9. Dependencies

**Phụ thuộc vào (cần có trước):**
| EPIC/Module | Lý do | Trạng thái |
|---|---|---|
| {MOD}-E{NN} | {Cần gì} | Not Started / In Progress / Done |

**Được phụ thuộc bởi:**
| EPIC/Module | Cần gì từ EPIC này |
|---|---|
| {MOD}-E{NN} | {Mô tả} |

---

### 10. Business Rules (BR-E)

- **BR-E01 ({Tên ngắn}):** {Mô tả rule nghiệp vụ cấp EPIC — áp dụng toàn bộ FEAT bên dưới}

- **BR-E02 ({Tên ngắn}):** {Mô tả}

- **BR-E03 ({Tên — từ edge cases}):** {Rule phát sinh từ edge cases thực tế}

- **Gợi ý phát triển tương lai:** {Rule hoặc tính năng có thể bổ sung trong v2}

---

## PHẦN IV — STAKEHOLDER-CAPABILITY MATRIX

### 11. Stakeholder-Capability Matrix

| Stakeholder | Capability | Mô tả nghiệp vụ | Edge Cases | → FEAT Candidate |
|---|---|---|---|---|
| {Actor 1} | {Capability A} | {Làm gì, khi nào, kết quả gì} | {EC-01} | {MOD}-E{NN}-F01 |
| {Actor 1} | {Capability B} | {Mô tả} | {EC-02} | {MOD}-E{NN}-F02 |
| {Actor 2} | {Capability C} | {Mô tả} | — | {MOD}-E{NN}-F03 |
| Hệ thống | {Tự động D} | {Trigger và kết quả} | — | {MOD}-E{NN}-F04 |

---

### 12. FEAT Priority & Risk

| FEAT ID | Tên FEAT | Priority | Risk | Lý do |
|---|---|:---:|:---:|---|
| {MOD}-E{NN}-F01 | {Tên} | P1 | High | Core flow, nhiều edge case |
| {MOD}-E{NN}-F02 | {Tên} | P1 | Medium | — |
| {MOD}-E{NN}-F03 | {Tên} | P2 | Low | — |

---

### 13. Danh sách FEAT

*Đây là nguồn sự thật cho việc phát sinh FEAT ID mới — đếm số FEAT hiện có để lấy next F{NN}.*

| FEAT ID | Tên | Status | Actors | US Count | Link |
|---|---|---|---|:---:|---|
| [{MOD}-E{NN}-F01](Features/{MOD}-E{NN}-F01_{Name}/FEAT.md) | {Tên} | Not Started | {Actor} | 0 | — |
| [{MOD}-E{NN}-F02](Features/{MOD}-E{NN}-F02_{Name}/FEAT.md) | {Tên} | Not Started | {Actor} | 0 | — |

---

## PHẦN V — TRACKING

### 14. Epic Acceptance Criteria (EAC)

- **EAC-01 ({Tên}):** {Điều kiện tổng quát — khi nào EPIC được coi là done}

- **EAC-02 ({Tên}):** {Điều kiện khác}

- **EAC-03 (Edge Cases):** Tất cả edge cases trong Stakeholder-Capability Matrix phải có FEAT và US tương ứng đạt AC.

---

### 15. Changelog

| Ngày | Thay đổi | Lý do |
|---|---|---|
| {YYYY-MM-DD} | Tạo mới | — |
