---
id: {MOD}-E{NN}-F{NN}-U{NN}
parent_feat: {MOD}-E{NN}-F{NN}
parent_epic: {MOD}-E{NN}
module: {MOD}
actor: {ACTOR}
priority: {P1 | P2 | P3}
status: Draft
created: {YYYY-MM-DD}
last_updated: {YYYY-MM-DD}

# BA điền
ui_screens:
  - "{Tên màn hình nghiệp vụ}"

# Agent điền sau khi ba-pbi-compose chạy
pbi_id:
screen_codes: []
---

# {MOD}-E{NN}-F{NN}-U{NN} — {Tên User Story}

**Module:** {MOD} | **EPIC:** [{MOD}-E{NN}](../../../README.md) | **FEAT:** [{MOD}-E{NN}-F{NN}](../FEAT.md) | **Actor:** {ACTOR}

---

## 1. User Story Statement

> **Là** {Actor},  
> **Tôi muốn** {Hành động cụ thể},  
> **Để** {Giá trị nghiệp vụ mang lại}.

**Phạm vi KHÔNG bao gồm (Out of Scope):**
- {Item 1}
- {Item 2}

---

## 2. Acceptance Criteria

- **AC-01 (Happy Path — {Tên ngắn}):**
  - **Given** {Trạng thái ban đầu}
  - **When** {Hành động người dùng}
  - **Then** {Kết quả mong đợi}

- **AC-02 (Edge Case — {Tên ngắn}):**
  - **Given** {Trạng thái}
  - **When** {Hành động}
  - **Then** {Kết quả}

---

## 3. Activity Diagram

```mermaid
flowchart TD
  classDef default font-size:11px,line-height:1.2

  A([Bắt đầu]) --> B[{Bước 1}]
  B --> C{Điều kiện?}
  C -->|Không hợp lệ| D[/Hiển thị lỗi/]
  D --> B
  C -->|Hợp lệ| E[{Bước 2}]
  E --> F([Kết thúc])
```

---

## 4. Data Dictionary

| Tên trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc / Ghi chú |
|---|---|:---:|---|
| {Tên trường 1} | {Kiểu nghiệp vụ} | Có | {Ràng buộc} |
| {Tên trường 2} | {Kiểu nghiệp vụ} | Không | {Ghi chú} |

---

## 5. Business Rules

- **BR-U01 ({Tên ngắn}):** {Mô tả quy tắc nghiệp vụ đầy đủ}  
  *(Kế thừa BR-F01)*

- **BR-U02 ({Tên ngắn}):** {Mô tả quy tắc}  
  *(Specialise BR-F02 — thêm điều kiện: {mô tả})*

- **Gợi ý phát triển tương lai:** {Tính năng có thể bổ sung trong tương lai}

---

## 6. UI/UX Mô tả

**Màn hình liên quan:** {Tên màn hình nghiệp vụ}  
**Figma:** {Link nếu có}

### {Tên màn hình}

- {Mô tả layout, cách hiển thị}
- {Hành vi khi tương tác}
- {Thông báo, cảnh báo}

**Luồng điều hướng:**
```
{Màn hình trước} → {Màn hình này} → {Màn hình tiếp theo}
```

---

## 7. Tracking & Analytics

| Event | Trigger | Mục đích |
|---|---|---|
| {Tên event nghiệp vụ} | {Khi nào xảy ra} | {Dùng để đo lường gì} |
