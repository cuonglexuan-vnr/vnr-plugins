# 06 — DI, Error Handling, Security & Logging

> Thuộc: [04-rules-and-team-conventions.md](../04-rules-and-team-conventions.md)

---

## Dependency Injection

### Convention-based Registration (tự động)

```csharp
// Services: Interface I{Name}Service → {Name}Service — tự động qua RegisterServices()
✅ IEmployeeService      → EmployeeService      (tự động)
✅ IGoalCalculatorService → GoalCalculatorService (tự động)

// Repositories — tự động qua RegisterGenericRepositoriesExtensions
services.AddScoped(typeof(IGenericRepository<,>), typeof(GenericRepository<,>));

// Validators — tự động qua RegisterValidationBehavior
services.AddValidatorsFromAssembly(typeof(CreateGoalValidator).Assembly);
```

### Manual Registration (khi cần)

```csharp
services.AddScoped<ISpecialService, SpecialService>();
services.AddSingleton<ICacheService, MemoryCacheService>();

❌ services.AddSingleton<IEmployeeService, EmployeeService>(); // Tránh Singleton cho stateful services
```

> **Tip**: Nếu service không inject được → kiểm tra naming convention trước.

---

## Error Handling & IApiResult<T>

### Response pattern (bắt buộc)

```csharp
// Success
return Result.Success(dto);

// Fail
return Result.Fail<GoalDto>("Goal not found");

// BaseApiController tự động convert thành HTTP response
```

### Exception mapping (tự động trong BaseApiController)

| Exception | ApiResultStatus | HTTP |
|-----------|----------------|------|
| `BusinessException` | `WARNING_BUSINESS_VALIDATOR` | 200 |
| `RequestArgumentsValidatorException` | `INVALID_REQUEST_VALIDATOR` | 200 |
| `ValidationException` (FluentValidation) | `BAD_REQUEST` | 400 |
| `ArgumentException` | `BAD_REQUEST` | 400 |
| `Exception` (catch-all) | `EXCEPTION` | 200 |

Handler chỉ cần throw — controller tự xử lý:
```csharp
throw new BusinessException("Cannot delete goal with active tasks");
```

---

## Security

### JWT Bearer — bắt buộc trên tất cả endpoints

```csharp
// IdentityServer tự validate token qua middleware
// Đảm bảo [Authorize] hoặc policy có trên controller/action
```

### Permission Attributes

```csharp
// ✅ Single action
[CheckAccess(PermissionKey = "HRM_GOAL_CREATE")]
public async Task<IActionResult> Create([FromBody] CreateGoalCommand command)
    => await HandleRequest(command);

// ✅ Toàn bộ CRUD controller
[CheckAccessBaseCRUD("HRM_GOAL")]
public class GoalController : BaseCrudApiController<...> { }

// ✅ OR logic (bất kỳ key nào)
[CheckMultiAccess(new[] { "HRM_GOAL", "HRM_GOAL_ADMIN" }, PrivilegeType.View)]
public async Task<IActionResult> ListData(...) => await HandleRequest(request);

// ✅ SuperAdmin only
[RequireSuperAdmin]
public async Task<IActionResult> AdminAction(...) => await HandleRequest(request);
```

---

## Logging & Audit

### Serilog (structured logging)

```csharp
_loggingService.LogInformation("Goal created", new { goalId, userId });
_loggingService.LogError("Goal creation failed", exception, new { request });
```

### Audit Logging

```csharp
// Dùng enums chuẩn
AuditAction.Create
AuditCategory.Goal
AuditSource.WebAPI
```
