# 03 — CQRS & MediatR / Handlers

> Thuộc: [04-rules-and-team-conventions.md](../04-rules-and-team-conventions.md)

---

## Commands vs Queries

### Command — thay đổi state

```csharp
// File: VNR.Service.Evaluation.Application/TalentTier/Commands/CreateTalentTierCommand.cs

public class CreateTalentTierCommand : IRequest<IApiResult<TalentTierDto>>
{
    // Property "Request" giữ model đầu vào — không đặt properties trực tiếp lên Command
    public CreateTalentTierCommandRequest Request { get; set; }
}
```

- `CreateTalentTierCommand` là class Command thực sự — implements `IRequest<>`.
- `CreateTalentTierCommandRequest` là model/DTO (đặt trong `.Models` project).

### Query — đọc dữ liệu

```csharp
// File: VNR.Service.Evaluation.Application/TalentTier/Queries/GetListTalentTierQuery.cs

public class GetListTalentTierQuery : IRequest<IApiResult<BaseResponseGridModel<TalentTierDto>>>
{
    public BaseRequestGridModel Request { get; set; }
}

// File: VNR.Service.Evaluation.Application/TalentTier/Queries/GetTalentTierByIdQuery.cs

public class GetTalentTierByIdQuery : IRequest<IApiResult<TalentTierDto>>
{
    public Guid Id { get; set; }
}
```

---

## Handlers

### CommandHandler

```csharp
// File: VNR.Service.Evaluation.Application/TalentTier/Commands/CreateTalentTierCommandHandler.cs

public class CreateTalentTierCommandHandler
    : IRequestHandler<CreateTalentTierCommand, IApiResult<TalentTierDto>>
{
    private readonly IGenericRepository<TalentTier, Guid> _repo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public async Task<IApiResult<TalentTierDto>> Handle(
        CreateTalentTierCommand request,
        CancellationToken cancellationToken)
    {
        var entity = _mapper.Map<TalentTier>(request.Request);
        await _repo.AddAsync(entity, cancellationToken: cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(_mapper.Map<TalentTierDto>(entity));
    }
}
```

### QueryHandler

```csharp
// File: VNR.Service.Evaluation.Application/TalentTier/Queries/GetListTalentTierQueryHandler.cs

public class GetListTalentTierQueryHandler
    : IRequestHandler<GetListTalentTierQuery, IApiResult<BaseResponseGridModel<TalentTierDto>>>
{
    public async Task<IApiResult<BaseResponseGridModel<TalentTierDto>>> Handle(
        GetListTalentTierQuery request,
        CancellationToken cancellationToken)
    {
        // dùng Dapper + stored procedure hoặc EF Core queryable
    }
}
```

> **Naming rule tóm tắt:**
>
> | Class | Suffix | Ví dụ |
> |-------|--------|-------|
> | Command | `Command` | `CreateTalentTierCommand` |
> | Command Handler | `CommandHandler` | `CreateTalentTierCommandHandler` |
> | Query | `Query` | `GetListTalentTierQuery` |
> | Query Handler | `QueryHandler` | `GetListTalentTierQueryHandler` |
> | Input model | `CommandRequest` / `QueryRequest` | `CreateTalentTierCommandRequest` |

---

## CrudHandler — ưu tiên dùng (cho CRUD cơ bản)

```csharp
// Không cần code handler riêng.
// Chỉ cần controller kế thừa BaseCrudApiController — CrudHandler tự xử lý 6 operations:
// QueryListGrid, Query (by ID), Create, Update, Delete, DeleteRange
```

---

## Application Service Interfaces & Implementations

Service interfaces được định nghĩa trong `.Application` layer:

```
VNR.Service.Evaluation.Application/
└── TalentTier/
    └── Services/
        └── ITalentTierService.cs   ← interface (Application layer)
```

Implementations thuộc `.Infrastructure` layer:

```
VNR.Service.Evaluation.Infrastructure/
└── Services/
    └── TalentTierService.cs        ← implementation (Infrastructure layer)
```

Đăng ký DI trong `VNR.Service.Evaluation.Infrastructure/Extensions/Add{Name}Services()`:

```csharp
services.AddScoped<ITalentTierService, TalentTierService>();
```

> **Quy tắc:** Interface luôn ở Application, không bao giờ đặt interface trong Infrastructure.

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
        var goal = await _goalRepo.GetByIdAsync(request.GoalId);
        if (goal == null) return Result.Fail<GoalScoreDto>("Goal not found");

        var score = await _calculator.CalculateScore(goal);
        goal.Score = score;
        await _goalRepo.UpdateAsync(goal);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(_mapper.Map<GoalScoreDto>(goal));
    }
}
```

---

## Anti-patterns

### ❌ Handler gọi Handler khác qua MediatR

```csharp
// ĐỪNG LÀM — shared logic → tách ra service
await _mediator.Send(new ValidateGoalCommand { ... }); // ❌
```

### ❌ Validation trong Handler

```csharp
if (string.IsNullOrEmpty(request.Request.Title))
    throw new ValidationException("..."); // ❌ — dùng FluentValidation
```

### ❌ Truy cập DbContext trực tiếp

```csharp
private readonly ApplicationDbContext _context; // ❌
var goals = await _context.Goals.ToListAsync(); // ❌ Bypass permission filter
```

### ❌ Đặt properties đầu vào trực tiếp lên Command

```csharp
// ❌ ĐỪNG LÀM — properties đầu vào phải gói trong Request
public class CreateTalentTierCommand : IRequest<IApiResult<TalentTierDto>>
{
    public string Name { get; set; }   // ❌
    public int Level { get; set; }     // ❌
}

// ✅ ĐÚNG
public class CreateTalentTierCommand : IRequest<IApiResult<TalentTierDto>>
{
    public CreateTalentTierCommandRequest Request { get; set; }
}
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
