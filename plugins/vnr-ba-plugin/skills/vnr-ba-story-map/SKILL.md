---
name: vnr-ba-story-map
description: 'Bottom-up discovery: nhận US thô từ phỏng vấn/pain points, nhóm lại thành EPIC/FEAT skeleton. Trigger: "ba story map", "story mapping", "nhóm us thô"'
---

# Workflow: ba-story-map

## Mục tiêu

Hỗ trợ Bottom-up discovery — khi BA chưa biết scope rõ ràng, chỉ có notes từ phỏng vấn hoặc danh sách pain points. Agent nhóm lại thành cấu trúc EPIC/FEAT/US skeleton.

Theo phương pháp **User Story Mapping** (Jeff Patton): Activities → Tasks → User Stories.

---

## Đầu vào

Nhận một trong hai:
1. **Đường dẫn folder** chứa US draft: `Module/{MODULE}/_discovery/us_candidates/`
2. **Danh sách text** pain points / notes phỏng vấn (BA paste trực tiếp)

---

## Hành động 1: Đọc và phân tích input

Đọc tất cả US draft hoặc pain points. Trích xuất:
- Actor đề cập
- Activity (nhóm công việc lớn)
- Task (công việc cụ thể)
- Business value mỗi item

---

## Hành động 2: Tạo Story Map

Trình bày theo cột (horizontal = narrative flow, vertical = priority):

```
ACTIVITY →   [Tạo kế hoạch]    [Theo dõi tiến độ]   [Đánh giá]
              ────────────       ──────────────         ──────────
TASK     →   Nhập mục tiêu     Cập nhật % tiến độ    Chấm điểm
(Must)        Chọn mentor       Ghi nhận issue         Nhận xét
              ────────────       ──────────────         ──────────
TASK         Điều chỉnh mục    Hủy mục tiêu           Xem lịch sử
(Should)     tiêu              Gia hạn deadline
              ────────────       ──────────────         ──────────
TASK         Export báo cáo    Nhắc nhở tự động
(Could)
```

---

## Hành động 3: Đề xuất EPIC/FEAT grouping

Từ Story Map, đề xuất:

```markdown
## Gợi ý cấu trúc EPIC/FEAT

EPIC-001: "{Tên}" — Cover Activities: [A1, A2]
  FEAT-001: "{Tên}" — Tasks: [T1, T2, T3] — Priority: P1
  FEAT-002: "{Tên}" — Tasks: [T4, T5] — Priority: P2

EPIC-002: "{Tên}" — Cover Activity: [A3]
  FEAT-003: ...
```

Hỏi BA:
```
Story Map và grouping đề xuất có phản ánh đúng domain không?
Có Activity nào quan trọng mà tôi bỏ sót không?
```

---

## Hành động 4: Tạo file skeleton (nếu BA đồng ý)

Tạo:
- EPIC placeholder README.md cho mỗi EPIC đề xuất
- FEAT placeholder FEAT.md cho mỗi FEAT
- Di chuyển US draft vào đúng Stories/ folder
- Cập nhật `Module/{MODULE}/_index.md`

```
✅ Story Map hoàn thành!

Đã tạo skeleton:
   • {N} EPIC placeholders
   • {N} FEAT placeholders
   • {N} US draft được di chuyển

Bước tiếp theo:
   • /vnr-ba-epic để điền nội dung EPIC đầu tiên
   • /vnr-ba-researcher để research domain trước
```
