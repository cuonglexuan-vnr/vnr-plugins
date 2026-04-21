# 08 — Code Style, Migrations, Commits & PR Checklist

> Thuộc: [04-rules-and-team-conventions.md](../04-rules-and-team-conventions.md)

---

## Code Style

### Async/Await

```csharp
✅ public async Task<IApiResult<GoalDto>> Handle(...)
✅ await _goalRepo.GetByIdAsync(id);

❌ public Task<IApiResult<GoalDto>> Handle(...)     // Thiếu async
❌ _goalRepo.GetByIdAsync(id).Result               // Blocking — deadlock risk
```

### Method Length

```csharp
✅ Methods <= 150 lines
✅ Tách logic phức tạp ra private methods hoặc services

❌ Method 300+ lines
```

### No Magic Strings

```csharp
✅ _logger.LogError($"Goal not found: {nameof(goalId)}");

❌ _logger.LogError("Goal not found: goalId");
```

---

## Migrations

### Tạo migration

```bash
dotnet ef migrations add AddGoalTable \
    --project Src/Services/Evaluation/VNR.Service.Evaluation.Infrastructure
```

### Apply migration (dev only)

```bash
dotnet ef database update \
    --project Src/Services/Evaluation/VNR.Service.Evaluation.Infrastructure
```

### ❌ Không auto-apply trong code

```csharp
// ĐỪNG LÀM trong Program.cs
await context.Database.MigrateAsync(); // ❌ Production risk
```

### ✅ Follow migration workflow

Theo `Docs/DatabaseMigration_Workflow_Guide.md` — apply manual qua release process.

---

## Branch Naming

```
✅ feature/001-goal-crud
✅ feature/eva-goal-setting
✅ bugfix/goal-calculation-error

❌ feature/goal      (không descriptive)
❌ my-feature        (không follow convention)
```

## Commit Messages

```
✅ feat(goal): add CRUD endpoints for goal management
✅ fix(goal): correct score calculation logic
✅ test(goal): add unit tests for CreateGoalHandler

❌ update code
❌ wip
```

---

## ⚠️ Điểm đặc biệt — quan trọng

### GenericRepository chứa permission logic

- **File**: `Src/Infrastructure/VNR.Infrastructure.BaseRepositories/Base/GenericRepository.cs`
- **Method**: `ApplyPermissionFilterAsync()`
- **Risk**: Thay đổi repository → phải test access control kỹ lưỡng
- **Khi nào cần review**: Thay đổi queries, joins, where clauses trong repository

### Ưu tiên stack hiện có

```
BaseCrudApiController + CrudHandler + GenericRepository
```

Chỉ tạo custom handler khi thật sự cần logic đặc biệt không thể dùng CrudHandler.

### Multi-provider support

- Hỗ trợ song song: **SQL Server + PostgreSQL**
- Queries phải tương thích cả hai providers
- Nếu dùng raw SQL / stored procedures → **test trên cả hai**

### Convention-based DI

- Đặt tên đúng convention → tự động register — không cần manual registration
- Nếu service không inject được → **kiểm tra naming convention trước** (xem [01-naming.md](01-naming.md))

---

## PR Checklist

### Architecture
- [ ] Controllers mỏng (chỉ dispatch tới MediatR)
- [ ] Business logic trong Handlers
- [ ] Không bypass GenericRepository
- [ ] Permission filter applied đúng

### Code Quality
- [ ] Naming conventions tuân thủ
- [ ] Async/await đúng cách
- [ ] No magic strings (dùng `nameof()`)
- [ ] Methods ≤ 150 lines

### Tests
- [ ] Unit tests cho Handlers
- [ ] Unit tests cho Validators
- [ ] Coverage ≥ 80%
- [ ] Tests pass

### Security
- [ ] `[CheckAccess]` hoặc `[CheckAccessBaseCRUD]` trên endpoints
- [ ] Permission keys đúng format `HRM_MODULE_FEATURE`
- [ ] No secrets trong code
- [ ] JWT validation enabled

### Data
- [ ] Soft-delete convention (`IsDelete`)
- [ ] AutoMapper profiles đầy đủ (ignore sensitive fields)
- [ ] FluentValidation cho Commands
- [ ] Migration notes (nếu có schema change)

### Docs
- [ ] API contracts updated (nếu thay đổi response shape)
- [ ] Permission keys documented
- [ ] Arch review pass
- [ ] Security review pass
