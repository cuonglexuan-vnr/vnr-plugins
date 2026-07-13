---
name: "vnr-qc-assistant"
description: >-
  Agent đa năng cho QA/QC: xử lý feedback chỉnh sửa testcases (Mode Feedback)
  hoặc review cross-check testcases với spec/plan/tasks và đề xuất cải thiện (Mode Reviewer).
argument-hint: "<feature-name> [--mode=feedback|reviewer] [feedback text hoặc review instructions]"
compatibility: "Requires specs/<feature>/testcases.md"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

Parse `$ARGUMENTS`:
- `<feature>` (bắt buộc) — tên feature, dùng để locate `specs/<feature>/testcases.md`
- `--mode=feedback` hoặc `--mode=reviewer` (tùy chọn) — chọn mode rõ ràng
- Phần text còn lại sau feature và mode → **feedback content** (mode Feedback) hoặc **review instructions** (mode Reviewer)

Nếu `--mode` không được chỉ định → agent tự xác định dựa trên nội dung input (xem quy tắc trong agent prompt).

---

## Agent System Prompt

**Path Resolution**: `$PLUGIN_DIR` = `${CLAUDE_PLUGIN_ROOT}` (the installed plugin root).

<agent_to_use>Sử dụng vnr-qc-assistant agent — đọc `$PLUGIN_DIR/agents/vnr-qc-assistant.md` để hiểu vai trò đa năng (Feedback / Reviewer), quy trình xử lý từng mode và format testcase chuẩn trước khi thực hiện.</agent_to_use>

---

## Quy trình thực hiện

### Bước 1 — Locate và validate testcases file

Chạy script kiểm tra:

```bash
ls specs/<feature>/testcases.md
```

Nếu file **không tồn tại** → **DỪNG**: hiển thị thông báo:

```
⛔ Chưa có testcases.md cho feature "<feature>".
→ Chạy `/vnr-testcase-writer` để tạo testcases trước.
```

Nếu file **tồn tại** → đọc toàn bộ nội dung `specs/<feature>/testcases.md`.

### Bước 2 — Xác định Mode

**Ưu tiên 1**: Nếu user chỉ rõ `--mode=feedback` hoặc `--mode=reviewer` → dùng mode đó.

**Ưu tiên 2**: Nếu không có `--mode`, phân tích nội dung input:
- Chứa từ khóa chỉnh sửa cụ thể ("sửa", "xóa", "thêm", "bổ sung", "thay đổi step", "bỏ test case", "thiếu bước"...) → **Mode Feedback**
- Chứa từ khóa đánh giá ("review", "kiểm tra", "đánh giá", "check", "cover", "đủ chưa", "thiếu gì"...) → **Mode Reviewer**

**Ưu tiên 3**: Nếu vẫn không xác định được → hỏi user:

```
Bạn muốn:
  [1] 📝 Feedback — Chỉnh sửa testcases theo phản hồi của bạn
  [2] 🔍 Reviewer — Review và đề xuất cải thiện testcases
Chọn (1 hoặc 2):
```

Hiển thị mode đã chọn:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 QC ASSISTANT  [Feature: <feature>]
 Mode: <Feedback / Reviewer>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Bước 3A — Mode Feedback

> Chỉ thực hiện nếu mode = Feedback

1. **Phân tích feedback**: Xác định testcase(s) bị ảnh hưởng và loại thao tác (sửa/xóa/thêm).

2. **Nếu feedback không rõ ràng**: Hỏi lại QC để làm rõ trước khi sửa.
   ```
   ⚠️ Feedback chưa rõ ràng. Bạn có thể cung cấp thêm chi tiết?
   Ví dụ: "Sửa step 2 của QTC-003 thành: Nhấn nút Lưu và chờ toast hiển thị"
   ```

3. **Thực hiện chỉnh sửa** trên file `testcases.md`:
   - Tuân thủ đúng format QTC chuẩn (xem agent prompt)
   - Cập nhật bảng "Tóm tắt phân bổ" và "Execution Summary"
   - Re-number QTC-ID nếu xóa testcase

4. **Hiển thị bảng tóm tắt thay đổi**:
   ```
   ## Tóm tắt thay đổi

   | # | Thao tác | QTC-ID | Mô tả thay đổi |
   |---|----------|--------|-----------------|
   | 1 | Sửa      | QTC-003 | Cập nhật step 2: thêm kiểm tra màu sắc button |
   | 2 | Xóa      | QTC-005 | Xóa theo yêu cầu QC |

   ✅ Đã cập nhật file specs/<feature>/testcases.md
   ```

5. **Dừng và chờ** QC phản hồi tiếp hoặc xác nhận hoàn tất.

### Bước 3B — Mode Reviewer

> Chỉ thực hiện nếu mode = Reviewer

1. **Đọc thêm tài liệu đặc tả**:
   - `specs/<feature>/<US-ID>_*.md` (bắt buộc — User Story file, shape: `templates/userstory-template.md`)
     - Section 3 (Business Rules), Section 4 (Acceptance Criteria), Section 7 (Validation Messages), Section 10 (Traceability matrices) là nguồn chính cho review
   - `specs/<feature>/plan.md` (bắt buộc)
   - `specs/<feature>/tasks.md` (bắt buộc)
   - `specs/<feature>/contracts/api-commitments.md` (nếu có)
   - `specs/<feature>/<US-ID>_*_ui-detail.md` hoặc `specs/<feature>/ui-detail.md` (nếu có)
   - Wiki context (nếu cần hiểu business rules)

   Nếu thiếu file bắt buộc → cảnh báo nhưng vẫn tiếp tục review với dữ liệu có sẵn.

2. **Đối chiếu chéo (Cross-check)** — chạy 12 checks:
   - CHECK-01: Positive testcase cho mỗi AC trong US Section 4
   - CHECK-02: Negative testcase cho mỗi BR trong US Section 3 (dùng ma trận `AC ↔ BR` từ Section 10)
   - CHECK-03: Boundary testcase (min, max, empty, null) theo ràng buộc ở US Section 6
   - CHECK-04: Authorization testcase cho mỗi role pair
   - CHECK-05: Integration/E2E testcase cho luồng chính
   - CHECK-06: Security testcase (injection, XSS)
   - CHECK-07: Priority phân bổ hợp lý
   - CHECK-08: Test data cụ thể, không placeholder
   - CHECK-09: Expected result đo được — đối chiếu VM codes trong US Section 7 (message + vị trí + thời gian)
   - CHECK-10: Format testcase đúng chuẩn QTC
   - CHECK-11: Mỗi VM trong US Section 7 có ít nhất 1 testcase cover (dùng ma trận `VM ↔ BR ↔ AC`)
   - CHECK-12: Mỗi màn hình trong US Section 8 có testcase cho 4 trạng thái (Loading / Data / Empty / Error)

3. **Hiển thị kết quả review**:
   ```
   ## Kết quả Review

   | # | Check | Status | Ghi chú |
   |---|-------|--------|---------|
   | 1 | Positive testcases cho AC | ✅ Pass | Đủ 8/8 AC |
   | 2 | Negative testcases | ⚠️ Warn | Thiếu 2 negative cases cho field Email |
   | ... | ... | ... | ... |

   Điểm tổng: X/10 checks passed
   ```

4. **Hiển thị danh sách đề xuất cải thiện** (nếu có):
   ```
   ## Đề xuất cải thiện

   | # | Loại | Mô tả đề xuất | Lý do | Priority |
   |---|------|----------------|-------|----------|
   | 1 | Thêm mới | Thêm QTC cho XSS validation field Name | User Story Section 4 AC-003 yêu cầu validate, chưa có security test | P1 |
   | 2 | Sửa | QTC-005 cần expected result cụ thể hơn | "Thành công" không đo được — cần mô tả HTTP status + response | P2 |
   ```

   Nếu không có đề xuất:
   ```
   ✅ Testcases đã cover đầy đủ. Không có đề xuất cải thiện.
   ```

5. **Hỏi QC xác nhận** (chỉ khi có đề xuất):
   ```
   Bạn có muốn áp dụng các đề xuất chỉnh sửa này vào file testcases.md không?
     [1] Có — áp dụng tất cả
     [2] Chọn lọc — chỉ áp dụng một số đề xuất (nhập số: 1,3,5)
     [3] Không — giữ nguyên file
   ```

6. **Áp dụng nếu QC đồng ý**:
   - "Có" → áp dụng tất cả đề xuất vào `testcases.md`
   - "Chọn lọc" → áp dụng đúng những đề xuất được chọn
   - "Không" → giữ nguyên file, kết thúc

7. **Hiển thị tóm tắt sau khi áp dụng** (tương tự Bước 3A.4).

---

## Output

```
specs/<feature>/testcases.md    ← Cập nhật (nếu có thay đổi)
```
