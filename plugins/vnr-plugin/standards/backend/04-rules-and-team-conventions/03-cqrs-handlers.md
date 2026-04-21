# 03 — CQRS & MediatR / Handlers

> Thuộc: [04-rules-and-team-conventions.md](../04-rules-and-team-conventions.md)

---

## Commands vs Queries

**Command** (thay đổi state):
```csharp
public class CreateGoalCommand : IRequest<IApiResult<GoalDto>>
{
    public CreateGoalRequest Request { get; set; }
}
```

**Query** (đọc dữ liệu):
```csharp
public class GetGoalByIdQuery : IRequest<IApiResult<GoalDto>>
{
    public Guid Id { get; set; }
}
```

---

## CrudHandler — ưu tiên dùng (cho CRUD cơ bản)

```csharp
// Không cần code handler riêng.
// Chỉ cần controller kế thừa BaseCrudApiController — CrudHandler tự xử lý 6 operations:
// QueryListGrid, Query (by ID), Create, Update, Delete, DeleteRange
```

---

## Custom Handler — khi cần logic đặc biệt

```csharp
public class CalculateGoalScoreCommandHandler
    : IRequestHandler<CalculateGoalScoreCommand, IApiResult<GoalScoreDto>>
{
    private readonly IGenericRepository<Goal, Guid> _goalRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IGoalCalculatorService _calculator;

    public async Task<IApiResult<GoalScoreDto>> Handle(
        CalculateGoalScoreCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Lấy entity
        var goal = await _goalRepo.GetByIdAsync(request.GoalId);
        if (goal == null) return Result.Fail<GoalScoreDto>("Goal not found");

        // 2. Business logic
        var score = await _calculator.CalculateScore(goal);

        // 3. Update
        goal.Score = score;
        await _goalRepo.UpdateAsync(goal);
        _unitOfWork.SaveChanges();

        // 4. Map và return
        return Result.Success(_mapper.Map<GoalScoreDto>(goal));
    }
}
```

---

## Anti-patterns

### ❌ Handler gọi Handler khác qua MediatR

```csharp
// ĐỪNG LÀM — nếu cần shared logic → tách ra service
public async Task<IApiResult<GoalDto>> Handle(...)
{
    var validation = await _mediator.Send(new ValidateGoalCommand { ... }); // ❌
}
```

### ❌ Validation trong Handler

```csharp
public async Task<IApiResult<GoalDto>> Handle(...)
{
    if (string.IsNullOrEmpty(request.Request.Title))
        throw new ValidationException("..."); // ❌ — dùng FluentValidation
}
```

### ❌ Truy cập DbContext trực tiếp

```csharp
private readonly ApplicationDbContext _context; // ❌
var goals = await _context.Goals.ToListAsync(); // ❌ Bypass permission filter
```

---

## MediatR Pipeline (thứ tự)

```
Controller.HandleRequest(command)
  → ValidationBehavior   (FluentValidation)
  → CrudHandlerBehavior  (cross-cutting)
  → Handler.Handle()     (business logic)
  → IApiResult<T>
```
