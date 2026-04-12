---
name: "vnr-run-testcases"
description: >-
  Hỗ trợ QC/QA chạy và tracking testcases từ testcases.md.
  Hiển thị danh sách testcase, cập nhật status (Pass/Fail/Skip), tính pass rate.
argument-hint: "<feature-name> [--filter=P0|P1|module] [--report]"
compatibility: "Requires specs/<feature>/testcases.md"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

Parse `$ARGUMENTS` → lấy `<feature>` (bắt buộc), `--filter` (tuỳ chọn), `--report` (tuỳ chọn).

---

## Mục đích

Skill này dành cho **team QC/QA** để:
1. Xem danh sách testcases cần chạy (có filter theo priority/module).
2. Cập nhật status từng testcase sau khi chạy thủ công.
3. Tạo báo cáo tổng hợp kết quả testing.

> Skill này **không chạy code test** — nó hỗ trợ tracking manual testing dựa trên `testcases.md`.

---

## Quy trình thực hiện

### Bước 1 — Load testcases

```bash
ls specs/<feature>/testcases.md
```

Nếu file không tồn tại → **dừng**: "Chưa có testcases.md. Chạy `/vnr-testcase-writer` hoặc pipeline Step 2b trước."

Đọc `specs/<feature>/testcases.md` → parse tất cả testcases (QTC-XXX).

### Bước 2 — Hiển thị dashboard

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 QC TESTCASE TRACKER  [Feature: <feature>]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| QTC-ID  | Module | Priority | Type     | Tên testcase              | Status    |
|---------|--------|----------|----------|---------------------------|-----------|
| QTC-001 | API    | P0       | Positive | Tạo mới thành công        | ⬜ Not Run |
| QTC-002 | API    | P1       | Negative | Tạo với tên trống         | ⬜ Not Run |
| QTC-003 | UI     | P0       | Positive | Submit form thành công    | ⬜ Not Run |
| ...     | ...    | ...      | ...      | ...                       | ...       |

Summary: N total | ⬜ N Not Run | ✅ 0 Pass | ⛔ 0 Fail | ⏭ 0 Skip
Pass Rate: 0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Nếu có `--filter`**: chỉ hiển thị testcases khớp filter.
- `--filter=P0` → chỉ priority P0
- `--filter=API` → chỉ module API
- `--filter=P0,P1` → P0 và P1

### Bước 3 — Cập nhật status (interactive)

Hỏi user:

```
Bạn muốn:
  [1] Cập nhật status testcase(s)
  [2] Xem chi tiết 1 testcase
  [3] Tạo báo cáo
  [4] Thoát
```

#### Option 1 — Cập nhật status

```
Nhập QTC-ID và status (cách nhau bằng dấu phẩy cho nhiều testcase):
Ví dụ: QTC-001=Pass, QTC-002=Fail, QTC-003=Skip

Hoặc cập nhật theo nhóm:
  all-P0=Pass          ← tất cả P0 → Pass
  API=Pass             ← tất cả module API → Pass
```

Khi user nhập → cập nhật `testcases.md`:
- Thay `⬜ Not Run` → `✅ Pass` / `⛔ Fail` / `⏭ Skip`
- Nếu Fail: hỏi user nhập **Actual Result** (mô tả bug ngắn gọn)
- Cập nhật **Execution Summary** cuối file
- Hiển thị dashboard cập nhật

#### Option 2 — Xem chi tiết

```
Nhập QTC-ID: QTC-003
```

Hiển thị toàn bộ nội dung testcase (pre-condition, steps, test data, expected result).

#### Option 3 — Tạo báo cáo

Tạo `specs/<feature>/result/testcase-report.md`:

```markdown
# Testcase Execution Report — <Feature>

**Ngày chạy**: <ngày hiện tại>
**Feature**: `<feature-id>`
**Người thực hiện**: QC Team

---

## Tổng hợp

| Status | Count | % |
|--------|-------|---|
| ✅ Pass | X | X% |
| ⛔ Fail | Y | Y% |
| ⏭ Skip | Z | Z% |
| ⬜ Not Run | W | W% |
| **Tổng** | **N** | **100%** |

**Pass Rate**: X% (chỉ tính Pass / (Pass + Fail))

---

## Testcases Failed

| QTC-ID | Module | Priority | Tên | Actual Result |
|--------|--------|----------|-----|---------------|
| QTC-002 | API | P1 | Tạo với tên trống | Không hiển thị error message |

---

## Coverage by Priority

| Priority | Total | Pass | Fail | Skip | Not Run |
|----------|-------|------|------|------|---------|
| P0 | X | X | 0 | 0 | 0 |
| P1 | X | X | X | 0 | 0 |
| P2 | X | X | X | X | X |
| P3 | X | X | X | X | X |

---

## Kết luận

- [ ] Tất cả P0 testcases đã Pass
- [ ] Tất cả P1 testcases đã Pass
- [ ] Pass Rate ≥ 80%
- [ ] Không có bug Critical chưa fix

**Ready for Release**: YES / NO (lý do nếu NO)
```

### Bước 4 — Lặp lại

Sau mỗi action, quay lại Bước 3 cho đến khi user chọn Thoát.

---

## Output

```
specs/<feature>/testcases.md              ← Cập nhật status
specs/<feature>/result/testcase-report.md  ← Báo cáo (khi user yêu cầu)
```
