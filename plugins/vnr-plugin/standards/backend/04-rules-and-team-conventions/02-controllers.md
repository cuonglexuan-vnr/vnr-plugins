# 02 — Controllers (Thin Controllers)

> Thuộc: [04-rules-and-team-conventions.md](../04-rules-and-team-conventions.md)

---

## Route Convention

```csharp
✅ [Route("api/v{version:apiVersion}/[controller]")]

❌ [Route("api/goals")]   // hardcode, không versioning
❌ [Route("/goals")]      // thiếu prefix api
```

## ✅ Controller mỏng — kế thừa BaseCrudApiController

```csharp
[ApiVersion("1")]
[Route("api/v{version:apiVersion}/[controller]")]
[CheckAccessBaseCRUD("HRM_GOAL")]
public class GoalController : BaseCrudApiController<
    GoalDto,              // TResult
    BaseRequestGridModel, // TRequestList
    BaseRequestGridModel, // TRequestGrid
    CreateGoalRequest,    // TRequestCreate
    UpdateGoalRequest,    // TRequestUpdate
    Guid>                 // TKey
{
    // Không cần code thêm — base đã xử lý CRUD

    // Chỉ override khi cần custom action
    [HttpPost("custom")]
    [CheckAccess(PermissionKey = "HRM_GOAL_CUSTOM")]
    public async Task<IActionResult> CustomAction([FromBody] CustomRequest request)
        => await HandleRequest(new CustomCommand { ... });
}
```

## ❌ Sai — Controller chứa business logic

```csharp
// ĐỪNG LÀM NHƯ NÀY
public class GoalController : ControllerBase
{
    private readonly IGoalRepository _goalRepo;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGoalRequest request)
    {
        // ❌ Validation trong controller
        if (string.IsNullOrEmpty(request.Title)) return BadRequest("...");

        // ❌ Business logic trong controller
        var goal = new Goal { Title = request.Title, ... };

        // ❌ Gọi trực tiếp repository từ controller
        await _goalRepo.AddAsync(goal);
        return Ok(goal);
    }
}
```

## BaseCrudApiController Variants

```csharp
// 1. Single request type (create = update)
BaseCrudApiController<TResult, TRequest, TKey>

// 2. Separate create/update
BaseCrudApiController<TResult, TQueryList, TCreateRequest, TUpdateRequest, TKey>

// 3. Separate create/update + lifecycle hooks
BaseCrudApiController<TResult, TQueryList, TQueryListGrid, TCreateRequest, TUpdateRequest, TKey>
```

## Security — bắt buộc trên mọi endpoint

```csharp
// ✅ Trên action
[CheckAccess(PermissionKey = "HRM_GOAL_CREATE")]
public async Task<IActionResult> Create(...) => await HandleRequest(command);

// ✅ Trên controller (CRUD tự động)
[CheckAccessBaseCRUD("HRM_GOAL")]
public class GoalController : BaseCrudApiController<...> { }

// ❌ Thiếu attribute
[HttpPost]
public async Task<IActionResult> Create(...) { } // ĐỪNG LÀM
```
