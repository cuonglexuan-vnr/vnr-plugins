---
name: "vnr-mobile-implement"
description: "Implement Flutter mobile tasks từ tasks.md — token-optimized: lazy standards, batch commit, terse output"
argument-hint: "Tên feature hoặc để trống (tự detect từ tasks.md)"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

Nếu user input không rỗng, đây là tên feature hoặc task ID bắt đầu. Ghi nhớ để dùng ở Step 2.

## Agent System Prompt

<agent_to_use>Sử dụng vnr-mobile-developer agent — đọc `${CLAUDE_PLUGIN_ROOT}/agents/vnr-mobile-developer.md` để hiểu vai trò, quy tắc Flutter/GetX/VnR widget và convention bắt buộc trước khi implement.</agent_to_use>

**Workflow rules (ngoài những gì agent đã định nghĩa):**
- **No source scan**: KHÔNG explore codebase để "hiểu context". Chỉ đọc source file khi task ghi rõ cần tham khảo, hoặc cần biết import path, hoặc task là "thêm vào file X".
- **Terse output**: Sau mỗi task chỉ in 1 dòng `✅ T00X — path (created/modified)`. Không giải thích, không tóm tắt.
- **Batch commit**: Sau mỗi batch hoàn thành mới commit, không commit từng file lẻ.
- **Không đọc** wiki, plan.md, data-model.md, contracts/ trừ khi task description ghi rõ cần.

## Outline

### Step 1 — Load tasks.md

Chạy lệnh sau từ repo root để lấy FEATURE_DIR:

```powershell
${CLAUDE_PLUGIN_ROOT}/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks
```

Parse JSON output → lấy `FEATURE_DIR` và đường dẫn `tasks.md`.

Đọc `FEATURE_DIR/tasks.md` → extract:
- Tên feature (từ heading hoặc metadata)
- Danh sách tasks: ID, description, status (`[ ]` / `[x]` / `[X]`), phase, marker `[P]`
- Số phases

**Không đọc** plan.md, data-model.md, contracts/ trừ khi task description ghi rõ cần.

---

### Step 2 — Hiển thị summary và hỏi điểm bắt đầu

In summary:

```
📋 Feature: <tên feature>
📦 Tổng tasks: N | Phases: M
🔲 Chưa làm: X | ✅ Đã xong: Y
```

Nếu user input có tên feature hoặc task ID → ưu tiên bắt đầu từ đó.
Nếu không → hỏi: **"Bắt đầu từ task nào? [Enter = task đầu tiên chưa làm, hoặc gõ ID như T003]"**

---

### Step 3 — Lập batch plan và xác nhận

Gom tasks chưa làm thành batches theo nguyên tắc:
- 1 batch = 1 phase, hoặc tối đa 5 tasks (tùy cái nào nhỏ hơn)
- Tasks có marker `[P]` trong cùng batch → implement song song (cùng lượt tool call)
- Bắt đầu từ task user chỉ định (hoặc task đầu tiên chưa làm)

Hiển thị batch đầu tiên để xác nhận:

```
📦 Batch 1 (Phase 1 — <phase name>):
  T001  create lib/modules/xxx/domain/model/xxx.dart
  T002  [P] create lib/modules/xxx/domain/repositories/xxx_repository.dart
  T003  [P] create lib/modules/xxx/domain/usecases/get_xxx.dart

Tiếp tục? [y/n]
```

Chờ user xác nhận trước khi implement.

---

### Step 4 — Implement tasks trong batch

**Quy tắc bắt buộc:**
- Implement đúng file path được ghi trong task description
- Tasks `[P]` trong cùng batch → gọi Write/Edit tool song song trong cùng lượt
- Không tự thêm feature ngoài yêu cầu trong task
- Không explore source code hiện có trừ khi:
  - Task ghi rõ: `"xem file X"`, `"tham khảo X"`, `"extend X"`
  - Task là `"thêm route vào Y"`, `"thêm export vào index"`
  - Cần biết import path chính xác cho file đang tạo
- Sau khi viết/sửa xong file → đánh dấu `[x]` trong tasks.md ngay lập tức

**Output sau mỗi task (terse):**

```
✅ T001 — lib/modules/xxx/domain/model/xxx.dart (created)
✅ T002 — lib/modules/xxx/domain/repositories/xxx_repository.dart (created)
✅ T003 — lib/modules/xxx/domain/usecases/get_xxx.dart (created)
```

Không giải thích design decision, không tóm tắt nội dung file.

---

### Step 5 — Commit sau mỗi batch

Sau khi tất cả tasks trong batch đã xong và tasks.md đã được đánh dấu:

```bash
cd src/app-mobile
rtk git add <danh-sách-files-trong-batch>
rtk git commit -m "feat(mobile/<feature>): <phase-name> — T001..T00N"
```

Commit message format: `feat(mobile/<feature>): <phase> — T<first>..T<last>`

---

### Step 6 — Hỏi tiếp batch tiếp theo

```
✅ Batch 1 hoàn thành (3/10 tasks)

📦 Batch 2 sẵn sàng (Phase 2 — <phase name>):
  T004  create lib/...
  T005  [P] create lib/...
  T006  [P] create lib/...

Tiếp tục? [y / n / stop]
```

- `y` hoặc Enter → chạy batch tiếp (quay về Step 3 để lập batch plan)
- `n` → user tự chọn batch/task khác, hỏi lại "Bắt đầu từ task nào?"
- `stop` → dừng, hiện completion summary (Step 7)

---

### Step 7 — Completion summary (khi tất cả tasks xong hoặc user gõ `stop`)

```
🎉 Session kết thúc
📊 Tasks: X/N hoàn thành trong session này
📁 Files tạo mới: A | Files sửa: B
🌿 Branch: <branch> | Commits: C
⏭️  Tasks còn lại: N-X (chạy lại /vnr-mobile-implement để tiếp tục)
```

Nếu tất cả N tasks đã xong:

```
🎉 Feature hoàn thành: N/N tasks
📁 Files tạo mới: A | Files sửa: B
🌿 Branch: <branch> | Commits: C
```
