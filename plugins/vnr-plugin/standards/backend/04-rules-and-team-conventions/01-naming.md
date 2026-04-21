# 01 — Quy ước đặt tên (Naming Conventions)

> Thuộc: [04-rules-and-team-conventions.md](../04-rules-and-team-conventions.md)

---

## Interfaces

```
✅ IApiContext
✅ IGenericRepository<TEntity, TKey>
✅ IEmployeeService

❌ ApiContext           (thiếu prefix I)
❌ EmployeeServiceInterface
```

## Services

```
✅ IEmployeeService        → EmployeeService
✅ IGoalCalculatorService  → GoalCalculatorService

❌ IEmployeeService → EmployeeServiceImpl  (không dùng Impl suffix)
```

## Repositories

```
✅ IGoalRepository → GoalRepository
// Thường dùng IGenericRepository<Goal, Guid> thay vì tạo interface riêng
```

## DTOs & Requests

```
✅ GoalDto
✅ Cat_CompetencyDto      (với prefix domain)
✅ CreateGoalRequest
✅ UpdateGoalRequest

❌ Goal                   (DTO không được trùng tên Entity)
❌ GoalCreateRequest      (sai thứ tự — verb trước)
```

## Commands / Queries / Handlers

Pattern chung: `{Verb}{Entity}{Type}` — verb trước, entity ở giữa, type suffix cuối.

```
// ── Commands (write-side) ──────────────────────────────────
✅ CreateTalentTierCommand          // command class (IRequest)
✅ CreateTalentTierCommandHandler   // handler class
✅ UpdateTalentTierCommand
✅ UpdateTalentTierCommandHandler
✅ DeleteTalentTierCommand
✅ DeleteTalentTierCommandHandler

// ── Queries (read-side) ────────────────────────────────────
✅ GetListTalentTierQuery           // list / grid query
✅ GetListTalentTierQueryHandler
✅ GetTalentTierByIdQuery           // single-entity query
✅ GetTalentTierByIdQueryHandler

// ── Request models (DTOs, NOT commands/queries) ────────────
✅ CreateTalentTierCommandRequest   // model in .Models project
✅ UpdateTalentTierCommandRequest

❌ TalentTierCreateCommand          (verb phải đứng đầu)
❌ CreateTalentTierHandler          (thiếu "Command" trước Handler)
❌ CreateTalentTierRequest          (nhầm lẫn với CommandRequest — phải rõ ngữ cảnh)
❌ ListTalentTierQuery              (thiếu "Get" prefix)
❌ QueryListGridTalentTier          (pattern cũ, không dùng nữa)
```

> **Lưu ý quan trọng:**
> - `CreateTalentTierCommand` = class Command thực sự (trong `.Application`), **không phải** DTO.
> - `CreateTalentTierCommandRequest` = DTO / model (trong `.Models`), chỉ chứa dữ liệu input.
> - Command giữ một property `Request` kiểu `CreateTalentTierCommandRequest`.
> - Handler luôn có suffix `CommandHandler` hoặc `QueryHandler` — không rút gọn.

## Controllers

```
✅ GoalController
✅ Cat_CompetencyController
✅ Eva_GoalSettingController

❌ GoalsController      (tránh số nhiều)
❌ Goal                 (thiếu suffix Controller)
```

## Permission Keys

```
✅ HRM_GOAL_CREATE
✅ HRM_GOAL_UPDATE
✅ HRM_EVALUATION_VIEW

❌ GOAL_CREATE          (thiếu HRM prefix)
❌ hrm_goal_create      (phải UPPERCASE)
```

Pattern: `HRM_<MODULE>_<FEATURE>`
