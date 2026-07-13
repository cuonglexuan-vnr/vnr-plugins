# Terse Output Style

## Mục đích

Định nghĩa quy tắc output **ngắn gọn, súc tích** cho tất cả agents trong VNR pipeline.
Áp dụng khi user kích hoạt mode terse hoặc khi pipeline cần minimise token output.

---

## Quy tắc chung

- **Không** giải thích lại yêu cầu.
- **Không** trả lời dài dòng — mỗi kết quả ≤ 1 dòng per item.
- **Không** thêm disclaimer, caveat, hoặc "lưu ý rằng...".
- **Dùng table** thay vì prose cho danh sách.
- **Dùng `✅ / ⚠️ / ⛔ / ⏭`** thay vì "Passed / Warning / Failed / Stub".
- **Omit** header và context đã biết — chỉ report delta và kết quả.

---

## Format per bước

### Step 1a — Plan
```
plan.md: N phases | data-model.md: N entities | contracts: N endpoints
→ Plan Review sẽ chạy tự động...
```

### Step 1b — Plan Review
```
Plan Review: ✅ PASS / ⚠️ WARN (N issues) / ⛔ FAIL (N critical)
→ Chờ duyệt [approve/modify/reject]
```

### Step 1c — Tasks
```
tasks.md: N tasks (N parallel groups)
→ Chờ duyệt [yes/edit/abort]
```

### Step 2 — Testcase Writer
```
testcases.md: N testcases (P0: N, P1: N, P2: N, P3: N)
→ Chờ duyệt [yes/edit/abort]
```

### Step 3 — Implement
```
Tasks: N/N ✅ | Files: N created, N modified
Build: ✅ OK | ⛔ FAILED: <error summary>
```

### Step 4+5 — Review (song song)
```
Arch:   ✅ PASS | ⚠️ WARN (N findings) | ⛔ FAIL (N critical)
Sec:    ✅ PASS | ⚠️ WARN (N findings) | ⛔ FAIL (N critical)
```

### Step 6 — E2E Stubs
```
⏭ E2E Stubs: src/frontend/e2e/<feature>.e2e.spec.ts ✅ exists / ✅ created (stub)
Status: Pending automation team implementation
```

### Step 7 — Report
```
final-report.md ✅ | user-guide.md ✅
```

---

## Findings table (Plan Review / Arch / Sec Review)

```
| Mức | Check | Vấn đề | Fix |
|-----|-------|--------|-----|
| 🔴  | P-01  | ... | ... |
| 🟡  | P-07  | ... | ... |
```

Không cần prose giải thích — table là đủ.

---

## Progress tracker (auto-pipeline)

```
✅ Step 1a+1b+1c  ✅ Step 2  🔄 Step 3  ⬜ 4+5  ⬜ 6  ⬜ 7
```

Hiển thị sau mỗi checkpoint, không cần lặp lại toàn bộ pipeline description.
