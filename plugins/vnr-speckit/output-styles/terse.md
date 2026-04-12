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
- **Dùng `✅ / ⚠️ / ⛔`** thay vì "Passed / Warning / Failed".
- **Omit** header và context đã biết — chỉ report delta và kết quả.

---

## Format per bước

### Step 1 — Plan & Tasks
```
plan.md: N phases | data-model.md: N entities | contracts: N endpoints
tasks.md: N tasks (N parallel groups)
→ Chờ duyệt [yes/edit/abort]
```

### Step 2 — QC Generate
```
test-scenarios.md: N scenarios (H High, M Medium, L Low)
e2e stubs: N test.todo() in <feature>.e2e.spec.ts
→ Chờ duyệt [yes/edit/abort]
```

### Step 3 — Implement
```
Tasks: N/N ✅ | Files: N created, N modified
Build: ✅ OK | ⛔ FAILED: <error summary>
```

### Step 4 — Unit Tests
```
BE: N test methods | FE: N specs | Playwright: N/N Happy Path implemented
```

### Step 5+6 — Review (song song)
```
Arch:   ✅ PASS | ⚠️ WARN (N findings) | ⛔ FAIL (N critical)
Sec:    ✅ PASS | ⚠️ WARN (N findings) | ⛔ FAIL (N critical)
```

### Step 7 — Run Tests
```
BE: N passed, N failed (coverage: Z%) | FE: N passed, N failed (coverage: Z%)
```

### Step 8 — E2E
```
E2E: N passed, N failed, N todo
```

### Step 9 — Report
```
final-report.md ✅ | user-guide.md ✅
```

---

## Findings table (Arch/Sec Review)

```
| Mức | File:dòng | Vấn đề | Fix |
|-----|-----------|--------|-----|
| 🔴  | X.cs:45   | ... | ... |
| 🟡  | Y.ts:12   | ... | ... |
```

Không cần prose giải thích — table là đủ.

---

## Progress tracker (auto-pipeline)

```
✅ Step 1  ✅ Step 2  🔄 Step 3  ⬜ 4  ⬜ 5+6  ⬜ 7  ⬜ 8  ⬜ 9
```

Hiển thị sau mỗi checkpoint, không cần lặp lại toàn bộ pipeline description.
