# /vnr-qc-assistant — Hướng dẫn sử dụng

> Agent đa năng cho đội QA/QC: xử lý feedback chỉnh sửa testcases (**Mode Feedback**) hoặc review cross-check testcases với spec/plan/tasks và đề xuất cải thiện (**Mode Reviewer**).

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Điều kiện tiên quyết](#2-điều-kiện-tiên-quyết)
3. [Cú pháp](#3-cú-pháp)
4. [Xác định Mode](#4-xác-định-mode)
5. [Mode Feedback — Xử lý phản hồi](#5-mode-feedback--xử-lý-phản-hồi)
   - 5.1 Workflow
   - 5.2 Các thao tác hỗ trợ
   - 5.3 Ví dụ sử dụng
6. [Mode Reviewer — Đánh giá & Đề xuất](#6-mode-reviewer--đánh-giá--đề-xuất)
   - 6.1 Workflow
   - 6.2 Bộ 10 checks
   - 6.3 Ví dụ sử dụng
7. [Tài liệu tham chiếu](#7-tài-liệu-tham-chiếu)
8. [Quy tắc format testcase](#8-quy-tắc-format-testcase)
9. [Mối quan hệ với các skill khác](#9-mối-quan-hệ-với-các-skill-khác)
10. [FAQ](#10-faq)

---

## 1. Tổng quan

`/vnr-qc-assistant` là skill hỗ trợ đội QA/QC làm việc với file `testcases.md` — artifact do `/vnr-testcase-writer` sinh ra. Skill hoạt động theo **2 chế độ (mode)**:

| Mode | Khi nào dùng | Hành vi |
|------|-------------|---------|
| **Feedback** | QC đã review và muốn chỉnh sửa testcases | Tuân thủ tuyệt đối feedback, không tự ý sáng tạo thêm |
| **Reviewer** | QC muốn kiểm tra chất lượng testcases trước khi chạy test | Chủ động tư duy phản biện, nhạy bén với edge cases |

**Điểm khác biệt chính:**
- **Feedback** = QC ra lệnh, agent thực thi. Không đề xuất, không hỏi ý kiến.
- **Reviewer** = Agent chủ động phân tích, đề xuất. QC duyệt trước khi áp dụng.

---

## 2. Điều kiện tiên quyết

| Yêu cầu | Chi tiết |
|----------|---------|
| File `testcases.md` | Phải tồn tại tại `specs/<feature>/testcases.md`. Tạo bằng `/vnr-testcase-writer` nếu chưa có. |
| Tài liệu đặc tả (mode Reviewer) | `spec.md`, `plan.md`, `tasks.md` — agent cần để cross-check. Không bắt buộc nhưng thiếu sẽ giảm chất lượng review. |

Nếu `testcases.md` không tồn tại, skill sẽ dừng và hiển thị:

```
⛔ Chưa có testcases.md cho feature "employee-management".
→ Chạy `/vnr-testcase-writer` để tạo testcases trước.
```

---

## 3. Cú pháp

```
/vnr-qc-assistant <feature-name> [--mode=feedback|reviewer] [nội dung feedback hoặc chỉ dẫn review]
```

| Tham số | Bắt buộc | Mô tả |
|---------|----------|-------|
| `<feature-name>` | Có | Tên feature — dùng để locate `specs/<feature>/testcases.md` |
| `--mode=feedback` | Không | Chỉ rõ chạy ở mode Feedback |
| `--mode=reviewer` | Không | Chỉ rõ chạy ở mode Reviewer |
| Nội dung text | Không | Feedback cụ thể (mode Feedback) hoặc chỉ dẫn review (mode Reviewer) |

**Ví dụ lệnh:**

```bash
# Mode Feedback — chỉ rõ bằng flag
/vnr-qc-assistant employee-management --mode=feedback Sửa step 2 của QTC-003, bỏ QTC-005

# Mode Reviewer — chỉ rõ bằng flag
/vnr-qc-assistant employee-management --mode=reviewer

# Auto-detect mode — agent tự xác định dựa trên nội dung
/vnr-qc-assistant employee-management Xóa test case số 5 và sửa lại step 3 của QTC-002
/vnr-qc-assistant employee-management Review xem đã cover hết edge cases chưa

# Không có nội dung — agent sẽ hỏi chọn mode
/vnr-qc-assistant employee-management
```

---

## 4. Xác định Mode

Agent xác định mode theo **3 cấp ưu tiên**:

```
Ưu tiên 1: Flag --mode=feedback hoặc --mode=reviewer
     ↓ (nếu không có flag)
Ưu tiên 2: Phân tích ngữ cảnh nội dung input
     ↓ (nếu vẫn không rõ)
Ưu tiên 3: Hỏi user chọn mode
```

### Auto-detect dựa trên ngữ cảnh

| Từ khóa trong input | Mode |
|---------------------|------|
| sửa, xóa, thêm, bổ sung, thay đổi step, bỏ test case, thiếu bước | **Feedback** |
| review, kiểm tra, đánh giá, check, cover, đủ chưa, thiếu gì | **Reviewer** |

### Interactive prompt (khi không xác định được)

```
Bạn muốn:
  [1] Feedback — Chỉnh sửa testcases theo phản hồi của bạn
  [2] Reviewer — Review và đề xuất cải thiện testcases
Chọn (1 hoặc 2):
```

Sau khi xác định, agent hiển thị banner xác nhận:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 QC ASSISTANT  [Feature: employee-management]
 Mode: Feedback
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 5. Mode Feedback — Xử lý phản hồi

### 5.1 Workflow

```
┌─────────────────────────────────┐
│ 1. Đọc testcases.md hiện tại   │
│    Parse QTC-XXX, modules       │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│ 2. Phân tích feedback từ QC    │
│    Xác định: sửa / xóa / thêm │
│    Xác định QTC-ID bị ảnh hưởng│
└──────────────┬──────────────────┘
               ↓
         Feedback rõ ràng?
        /              \
      Có               Không
       ↓                 ↓
┌──────────────┐  ┌──────────────────┐
│ 3. Chỉnh sửa│  │ Hỏi lại QC để   │
│    file      │  │ làm rõ feedback  │
└──────┬───────┘  └──────────────────┘
       ↓
┌─────────────────────────────────┐
│ 4. Hiển thị bảng thay đổi      │
│    Ghi file testcases.md        │
│    Chờ QC phản hồi tiếp        │
└─────────────────────────────────┘
```

### 5.2 Các thao tác hỗ trợ

| Thao tác | Mô tả | Ví dụ feedback |
|----------|-------|----------------|
| **Sửa** | Cập nhật nội dung testcase (steps, expected result, test data...) | "Sửa step 2 của QTC-003 thành: Nhấn nút Lưu và chờ toast" |
| **Xóa** | Xóa testcase và re-number QTC-ID | "Bỏ test case số 5" |
| **Thêm** | Thêm testcase mới với QTC-ID tiếp theo | "Thêm 1 test case kiểm tra khi nhập email trùng" |
| **Di chuyển** | Chuyển testcase sang module khác | "Chuyển QTC-010 sang module Authorization" |
| **Tách** | Tách 1 testcase thành nhiều testcase nhỏ | "QTC-007 đang test 2 điều kiện, tách ra" |
| **Gộp** | Gộp nhiều testcase thành 1 | "Gộp QTC-008 và QTC-009" |

### 5.3 Ví dụ sử dụng

**Ví dụ 1: Sửa steps và xóa testcase**

```
/vnr-qc-assistant employee-management --mode=feedback
  Sửa lại step 2 của QTC-003: thêm kiểm tra màu sắc button phải là #007bff.
  Bỏ QTC-005 vì trùng với QTC-002.
```

Output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 QC ASSISTANT  [Feature: employee-management]
 Mode: Feedback
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Tóm tắt thay đổi

| # | Thao tác | QTC-ID  | Mô tả thay đổi                                    |
|---|----------|---------|----------------------------------------------------|
| 1 | Sửa      | QTC-003 | Step 2: thêm kiểm tra màu sắc button = #007bff    |
| 2 | Xóa      | QTC-005 | Xóa (trùng QTC-002). Re-number QTC-006+ → QTC-005+|

✅ Đã cập nhật file specs/employee-management/testcases.md
```

**Ví dụ 2: Thêm testcase mới**

```
/vnr-qc-assistant employee-management
  Test case số 3 thiếu bước kiểm tra màu sắc của button.
  Thêm 1 case negative cho trường hợp nhập tên quá 255 ký tự.
```

Agent auto-detect → **Mode Feedback** (chứa "thiếu bước", "thêm").

---

## 6. Mode Reviewer — Đánh giá & Đề xuất

### 6.1 Workflow

```
┌────────────────────────────────────────┐
│ 1. Đọc testcases.md                   │
│    + spec.md + plan.md + tasks.md      │
│    + contracts, ui-detail (nếu có)     │
│    + wiki context (nếu cần)            │
└──────────────┬─────────────────────────┘
               ↓
┌────────────────────────────────────────┐
│ 2. Đối chiếu chéo (Cross-check)       │
│    Chạy 10 checks                      │
└──────────────┬─────────────────────────┘
               ↓
┌────────────────────────────────────────┐
│ 3. Hiển thị kết quả review            │
│    Bảng checks + Điểm tổng            │
└──────────────┬─────────────────────────┘
               ↓
┌────────────────────────────────────────┐
│ 4. Hiển thị đề xuất cải thiện         │
│    (nếu có)                            │
└──────────────┬─────────────────────────┘
               ↓
         Có đề xuất?
        /           \
      Có            Không
       ↓              ↓
┌──────────────┐  ┌──────────────────┐
│ 5. Hỏi QC:  │  │ "Testcases đã    │
│ Áp dụng?    │  │  cover đầy đủ."  │
│ Có/Chọn/Không│  │  → Kết thúc.     │
└──────┬───────┘  └──────────────────┘
       ↓
┌────────────────────────────────────────┐
│ 6. Áp dụng đề xuất vào testcases.md   │
│    (nếu QC đồng ý)                    │
└────────────────────────────────────────┘
```

### 6.2 Bộ 10 checks

Agent thực hiện 10 kiểm tra chất lượng sau:

| # | Check | Mô tả | Status |
|---|-------|-------|--------|
| CHECK-01 | Positive cho AC | Mỗi Acceptance Criteria có ít nhất 1 testcase positive | Pass / Warn / Fail |
| CHECK-02 | Negative cho field/rule | Mỗi field required + business rule có negative testcase | Pass / Warn / Fail |
| CHECK-03 | Boundary values | Có testcase cho min, max, empty, null | Pass / Warn / Fail |
| CHECK-04 | Authorization | Mỗi role pair quan trọng có testcase phân quyền | Pass / Warn / Fail |
| CHECK-05 | Integration/E2E | Luồng chính có testcase end-to-end | Pass / Warn / Fail |
| CHECK-06 | Security | Có testcase cho injection, XSS (nếu applicable) | Pass / Warn / Fail |
| CHECK-07 | Priority hợp lý | P0 cho critical paths, phân bổ không lệch | Pass / Warn / Fail |
| CHECK-08 | Test data cụ thể | Không dùng placeholder, data sát thực tế | Pass / Warn / Fail |
| CHECK-09 | Expected result đo được | Kết quả mong đợi cụ thể (HTTP status, message...) | Pass / Warn / Fail |
| CHECK-10 | Format chuẩn QTC | Đúng cấu trúc: ID, Priority, Type, Steps, Expected... | Pass / Warn / Fail |

**Status giải thích:**
- **Pass** — Đạt yêu cầu
- **Warn** — Đạt một phần, có thể cải thiện
- **Fail** — Thiếu nghiêm trọng, cần bổ sung

### 6.3 Ví dụ sử dụng

**Ví dụ 1: Review cơ bản**

```
/vnr-qc-assistant employee-management --mode=reviewer
```

Output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 QC ASSISTANT  [Feature: employee-management]
 Mode: Reviewer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Kết quả Review

| # | Check                     | Status  | Ghi chú                                   |
|---|---------------------------|---------|--------------------------------------------|
| 1 | Positive testcases cho AC | ✅ Pass | Đủ 8/8 AC                                  |
| 2 | Negative testcases        | ⚠️ Warn | Thiếu 2 negative cases cho field Email     |
| 3 | Boundary values           | ✅ Pass | Có min/max/empty cho tất cả fields         |
| 4 | Authorization             | ✅ Pass | 4 role pairs đã cover                      |
| 5 | Integration/E2E           | ✅ Pass | 2 luồng chính có testcase                  |
| 6 | Security                  | ⛔ Fail | Chưa có testcase XSS cho field Name, Email |
| 7 | Priority phân bổ          | ✅ Pass | P0: 5, P1: 8, P2: 6, P3: 3                |
| 8 | Test data cụ thể          | ✅ Pass | Không có placeholder                        |
| 9 | Expected result đo được   | ⚠️ Warn | QTC-012 expected result mơ hồ              |
| 10| Format chuẩn QTC          | ✅ Pass | Đúng chuẩn                                  |

Điểm tổng: 7/10 checks passed (2 Warn, 1 Fail)

---

## Đề xuất cải thiện

| # | Loại     | Mô tả đề xuất                              | Lý do                                       | Priority |
|---|----------|---------------------------------------------|----------------------------------------------|----------|
| 1 | Thêm mới | Thêm testcase XSS cho field Name            | spec.md AC-3 yêu cầu validate, chưa có test | P1       |
| 2 | Thêm mới | Thêm testcase XSS cho field Email           | Tương tự đề xuất 1                           | P1       |
| 3 | Thêm mới | Thêm negative case: Email không có @        | Thiếu negative cho format Email              | P2       |
| 4 | Thêm mới | Thêm negative case: Email domain không hợp lệ | Thiếu negative cho format Email           | P2       |
| 5 | Sửa      | QTC-012 cần expected result cụ thể hơn      | "Thành công" → cần HTTP status + response    | P2       |

---

Bạn có muốn áp dụng các đề xuất chỉnh sửa này vào file testcases.md không?
  [1] Có — áp dụng tất cả
  [2] Chọn lọc — chỉ áp dụng một số đề xuất (nhập số: 1,3,5)
  [3] Không — giữ nguyên file
```

**Ví dụ 2: QC chọn lọc đề xuất**

```
> 2
> Áp dụng đề xuất 1, 2, 5
```

Output:

```
## Tóm tắt thay đổi

| # | Thao tác  | QTC-ID  | Mô tả thay đổi                           |
|---|-----------|---------|-------------------------------------------|
| 1 | Thêm mới  | QTC-023 | Testcase XSS cho field Name               |
| 2 | Thêm mới  | QTC-024 | Testcase XSS cho field Email              |
| 3 | Sửa       | QTC-012 | Expected result: HTTP 200 + response body |

✅ Đã cập nhật file specs/employee-management/testcases.md
```

---

## 7. Tài liệu tham chiếu

Agent đọc các tài liệu sau tùy theo mode:

| Tài liệu | Mode Feedback | Mode Reviewer |
|-----------|:---:|:---:|
| `specs/<feature>/testcases.md` | Luôn đọc | Luôn đọc |
| `specs/<feature>/spec.md` | — | Đọc (bắt buộc) |
| `specs/<feature>/plan.md` | — | Đọc (bắt buộc) |
| `specs/<feature>/tasks.md` | — | Đọc (bắt buộc) |
| `specs/<feature>/contracts/api-commitments.md` | — | Đọc (nếu có) |
| `specs/<feature>/ui-detail.md` | — | Đọc (nếu có) |
| `docs/wiki/` | — | Đọc (nếu cần business context) |

> **Mode Feedback** chỉ cần `testcases.md` + feedback text. Không cần đọc spec/plan vì QC đã biết mình muốn sửa gì.
>
> **Mode Reviewer** cần đối chiếu chéo nên phải đọc tất cả tài liệu đặc tả.

---

## 8. Quy tắc format testcase

Khi thêm mới hoặc sửa testcase, agent tuân thủ format QTC chuẩn:

```markdown
### QTC-XXX: <Tên testcase>
- **Priority**: P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)
- **Type**: Positive / Negative / Boundary / Security / Integration
- **Mapping**: TC-XX (nếu map với test-scenarios.md)
- **Pre-condition**:
  - <Điều kiện tiên quyết>
- **Test Data**:
  | Field | Value | Ghi chú |
  |-------|-------|---------|
  | ... | ... | ... |
- **Steps**:
  1. <Bước thực hiện>
- **Expected Result**:
  - <Kết quả mong đợi cụ thể, đo được>
- **Actual Result**: _(QC điền khi chạy test)_
- **Status**: ⬜ Not Run
```

**Quy tắc bắt buộc:**

| Quy tắc | Mô tả |
|---------|-------|
| QTC-ID liên tục | `QTC-001`, `QTC-002`... Không bỏ số. Re-number khi xóa. |
| 1 testcase = 1 điều kiện | Không gộp nhiều điều kiện test vào 1 testcase |
| Test data cụ thể | Dùng giá trị thực (VD: "Nguyễn Văn A"), không dùng placeholder |
| Expected result đo được | Phải ghi rõ HTTP status, message, trạng thái UI cụ thể |

---

## 9. Mối quan hệ với các skill khác

```
/vnr-testcase-writer ──→ testcases.md ──→ /vnr-qc-assistant
                                              │
                                     ┌────────┴────────┐
                                     │                  │
                              Mode Feedback      Mode Reviewer
                              (Sửa theo QC)    (Cross-check với
                                     │          spec/plan/tasks)
                                     │                  │
                                     └────────┬────────┘
                                              │
                                     testcases.md (updated)
                                              │
                                     /vnr-run-testcases
                                     (QC chạy manual test)
```

| Skill | Quan hệ |
|-------|---------|
| `/vnr-testcase-writer` | Tạo `testcases.md` ban đầu — chạy **trước** `/vnr-qc-assistant` |
| `/vnr-qc-assistant` | Chỉnh sửa hoặc review `testcases.md` |
| `/vnr-run-testcases` | QC chạy manual test và tracking status — chạy **sau** khi testcases đã ổn |
| `/vnr-qc-generator` | Tạo `test-scenarios.md` (Gherkin) + Playwright stubs — artifact khác, không trùng |

**Quy trình QA/QC đề xuất:**

```
1. /vnr-testcase-writer  → Tạo testcases.md
2. /vnr-qc-assistant     → Review (mode Reviewer) → Đề xuất cải thiện
3. /vnr-qc-assistant     → Feedback (mode Feedback) → QC chỉnh sửa thủ công
4. /vnr-run-testcases    → QC chạy test, tracking Pass/Fail
```

---

## 10. FAQ

### Q: Khác gì giữa `/vnr-qc-assistant` và `/vnr-testcase-writer`?

| | `/vnr-testcase-writer` | `/vnr-qc-assistant` |
|---|---|---|
| **Mục đích** | Tạo mới `testcases.md` từ đầu | Chỉnh sửa / review `testcases.md` đã có |
| **Khi nào dùng** | Chưa có testcases | Đã có testcases, cần chỉnh sửa hoặc kiểm tra chất lượng |
| **Input** | spec.md, plan.md, tasks.md | testcases.md + feedback hoặc spec/plan/tasks |
| **Output** | `testcases.md` mới | `testcases.md` cập nhật |

### Q: Tôi có thể chạy mode Feedback nhiều lần liên tiếp không?

**Có.** Sau mỗi lần chỉnh sửa, agent sẽ dừng và chờ bạn phản hồi tiếp. Bạn có thể tiếp tục gửi feedback cho đến khi hài lòng.

### Q: Mode Reviewer có tự động sửa file không?

**Không.** Mode Reviewer chỉ hiển thị đề xuất và **hỏi xác nhận** trước khi sửa. Bạn có 3 lựa chọn:
- Áp dụng tất cả
- Chọn lọc một số đề xuất
- Không áp dụng (giữ nguyên file)

### Q: Nếu thiếu spec.md hoặc plan.md thì mode Reviewer có chạy được không?

**Có**, nhưng chất lượng review sẽ giảm. Agent sẽ cảnh báo thiếu tài liệu và tiếp tục review với dữ liệu có sẵn. Các checks liên quan đến AC coverage (CHECK-01) hoặc API coverage sẽ bị bỏ qua.

### Q: Agent có re-number QTC-ID khi xóa testcase không?

**Có.** Khi xóa testcase, agent tự động re-number để giữ QTC-ID liên tục (không bỏ số). Ví dụ: xóa QTC-003 → QTC-004 trở thành QTC-003, QTC-005 trở thành QTC-004, v.v. Bảng phân bổ và Execution Summary cũng được cập nhật tương ứng.

### Q: Tôi muốn agent chỉ review mà không đề xuất sửa được không?

**Được.** Khi chạy mode Reviewer, nếu bạn chọn `[3] Không` ở bước xác nhận, file sẽ được giữ nguyên. Bạn vẫn nhận được bảng kết quả review và danh sách đề xuất để tham khảo.

### Q: Có thể kết hợp cả 2 modes trong 1 phiên không?

**Có.** Một cách phổ biến là:
1. Chạy mode **Reviewer** trước để xem tổng quan chất lượng
2. Sau đó chạy mode **Feedback** để chỉnh sửa thủ công những phần cụ thể mà bạn muốn điều chỉnh khác với đề xuất của Reviewer
