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

```
// Commands
✅ CreateGoalCommand
✅ UpdateGoalCommand
✅ DeleteGoalCommand

// Queries
✅ GetGoalByIdQuery
✅ QueryListGridGoal

// Handlers
✅ CreateGoalCommandHandler
✅ GetGoalByIdQueryHandler

❌ GoalCreateCommand    (sai thứ tự)
❌ CreateGoalHandler    (thiếu "Command")
```

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
