---
name: "vnr-run-e2e"
description: >-
  Chạy Playwright E2E tests độc lập cho QC/QA — không cần thông qua auto-pipeline.
  Health check, run tests, collect screenshots, báo cáo kết quả.
argument-hint: "<feature-name> [--headed] [--grep=pattern] [--update-snapshots]"
compatibility: "Requires src/frontend/e2e/<feature>.e2e.spec.ts"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

Parse `$ARGUMENTS` → lấy:
- `<feature>` (bắt buộc) — tên feature, tương ứng với file `src/frontend/e2e/<feature>.e2e.spec.ts`
- `--headed` (tuỳ chọn) — chạy browser có UI (mặc định: headless)
- `--grep=<pattern>` (tuỳ chọn) — chỉ chạy test matching pattern (ví dụ: `--grep="TC-01"`)
- `--update-snapshots` (tuỳ chọn) — cập nhật snapshot baseline

---

## Cấu trúc source code

```
src/
├── backend/        # ASP.NET Core — GIT REPO RIÊNG (cần running cho E2E)
└── frontend/       # Angular 19 — GIT REPO RIÊNG
    ├── e2e/
    │   ├── <feature>.e2e.spec.ts    ← Test file
    │   ├── .auth/                    ← Storage state files
    │   └── screenshots/              ← Custom screenshots (nếu có)
    ├── playwright.config.ts
    ├── test-results/                 ← Playwright output (screenshots on failure)
    └── playwright-report/            ← HTML report
```

---

## Quy trình thực hiện

### Bước 1 — Validate prerequisites

```bash
# Kiểm tra e2e test file tồn tại
ls src/frontend/e2e/<feature>.e2e.spec.ts
```

Nếu file không tồn tại → **dừng**: "Chưa có e2e spec. Chạy `/vnr-qc-generator` trước để tạo stubs."

```bash
# Kiểm tra Playwright đã cài đặt
cd src/frontend && npx playwright --version
```

Nếu chưa cài → gợi ý: `cd src/frontend && npx playwright install`

### Bước 2 — Health check

```bash
# Kiểm tra Backend API
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health 2>/dev/null || echo "000")
echo "Backend API: HTTP $HTTP_CODE"

# Kiểm tra Frontend dev server
FE_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 2>/dev/null || echo "000")
echo "Frontend: HTTP $FE_CODE"
```

Hiển thị kết quả health check:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VNR E2E TEST RUNNER  [Feature: <feature>]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pre-flight checks:
  E2E spec:     ✅ src/frontend/e2e/<feature>.e2e.spec.ts
  Backend API:  ✅ http://localhost:5001 (200) / ⛔ DOWN
  Frontend:     ✅ http://localhost:4200 (200) / ⛔ DOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Nếu Backend hoặc Frontend DOWN**:

```
⚠️ Services chưa sẵn sàng.

Để start:
  Backend:  cd src/backend && dotnet run --project <ApiProject>
  Frontend: cd src/frontend && npm start

Bạn muốn:
  [1] Chạy test anyway (có thể fail do API/UI unavailable)
  [2] Đợi (user tự start services, rồi gõ 'ready')
  [3] Hủy
```

### Bước 3 — Chạy Playwright tests

```bash
cd src/frontend

# Xây dựng lệnh chạy
PLAYWRIGHT_CMD="npx playwright test e2e/<feature>.e2e.spec.ts"

# Thêm options
if [ "--headed" ]; then
  PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --headed"
fi

if [ "--grep=<pattern>" ]; then
  PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --grep '<pattern>'"
fi

if [ "--update-snapshots" ]; then
  PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --update-snapshots"
fi

# Luôn thêm reporter
PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --reporter=list,html"

# Chạy
rtk $PLAYWRIGHT_CMD
```

### Bước 4 — Thu thập kết quả

Parse output từ Playwright → đếm:
- **Passed**: số test passed
- **Failed**: số test failed
- **Skipped**: số test skipped (bao gồm test.todo)
- **Duration**: thời gian chạy

Tìm screenshots:
```bash
# Screenshots từ failed tests
ls src/frontend/test-results/ 2>/dev/null

# HTML report
ls src/frontend/playwright-report/index.html 2>/dev/null

# Custom screenshots (nếu test code có chụp)
ls src/frontend/e2e/screenshots/ 2>/dev/null
```

### Bước 5 — Báo cáo kết quả

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 E2E RESULTS  [Feature: <feature>]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| TC-ID | Scenario | Status | Duration |
|-------|----------|--------|----------|
| TC-01 | Tạo mới thành công | ✅ Passed | 2.3s |
| TC-02 | Validation tên trống | ✅ Passed | 1.1s |
| TC-03 | Unauthorized access | ⛔ Failed | 0.8s |
| TC-04 | Edge case date | ⏭ Todo | — |

Summary: X passed, Y failed, Z todo | Duration: Ns
Pass Rate: X% (Pass / (Pass + Fail))

Screenshots (nếu có):
  src/frontend/test-results/TC-03-..../test-failed-1.png

HTML Report:
  src/frontend/playwright-report/index.html
  → Mở: cd src/frontend && npx playwright show-report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Bước 6 — Actions sau khi chạy

```
Bạn muốn:
  [1] Chạy lại tất cả
  [2] Chạy lại chỉ failed tests
  [3] Chạy 1 test cụ thể (nhập TC-ID)
  [4] Mở HTML report
  [5] Cập nhật testcases.md với kết quả e2e
  [6] Thoát
```

#### Option 2 — Chạy lại failed

```bash
cd src/frontend && rtk npx playwright test e2e/<feature>.e2e.spec.ts --last-failed --reporter=list,html
```

#### Option 4 — Mở HTML report

```bash
cd src/frontend && npx playwright show-report
```

#### Option 5 — Sync kết quả vào testcases.md

Nếu `specs/<feature>/testcases.md` tồn tại:
- Map TC-ID (từ e2e) → QTC-ID (từ testcases.md) thông qua trường **Mapping**
- Cập nhật status: ✅ Pass / ⛔ Fail
- Cập nhật Execution Summary

---

## Retry & Debug

Nếu test failed, cung cấp debug info:

```
⛔ TC-03 FAILED: Unauthorized access

  Error: expect(locator).toBeVisible()
  Expected: visible
  Received: hidden
  
  File: src/frontend/e2e/<feature>.e2e.spec.ts:45
  Screenshot: src/frontend/test-results/TC-03-.../test-failed-1.png
  Trace: src/frontend/test-results/TC-03-.../trace.zip
  
  → Debug: cd src/frontend && npx playwright test --debug --grep "TC-03"
  → Trace: cd src/frontend && npx playwright show-trace src/frontend/test-results/TC-03-.../trace.zip
```

---

## Output

```
src/frontend/test-results/           ← Playwright test artifacts (screenshots, traces)
src/frontend/playwright-report/      ← HTML report
specs/<feature>/testcases.md         ← Cập nhật status (nếu user chọn sync)
```
