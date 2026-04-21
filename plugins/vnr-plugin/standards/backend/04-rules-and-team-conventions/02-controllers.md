# 02 — Controllers (Thin Controllers)

> Thuộc: [04-rules-and-team-conventions.md](../04-rules-and-team-conventions.md)

---

## Route Convention — RESTful Standard

```csharp
// ✅ Template chuẩn (tên controller = tên resource, số ít)
[Route("api/v{version:apiVersion}/[controller]")]
// → api/v1/TalentTier

// ❌ Sai
[Route("api/goals")]          // hardcode, không versioning
[Route("/goals")]             // thiếu prefix api
[Route("api/v1/TalentTiers")] // hardcode version + số nhiều
```

### RESTful HTTP verb mapping

| Action | HTTP Verb | Route | Ví dụ |
|--------|-----------|-------|-------|
| Lấy danh sách (grid) | `POST` | `/list-data` | `POST api/v1/TalentTier/list-data` |
| Lấy theo ID | `GET` | `/{id}` | `GET api/v1/TalentTier/{id}` |
| Tạo mới | `POST` | `/` | `POST api/v1/TalentTier` |
| Cập nhật | `PUT` | `/{id}` | `PUT api/v1/TalentTier/{id}` |
| Xóa một | `DELETE` | `/{id}` | `DELETE api/v1/TalentTier/{id}` |
| Xóa nhiều | `DELETE` | `/batch` | `DELETE api/v1/TalentTier/batch` |

> **Quy tắc:** Tên route = tên controller (số ít, PascalCase từ `[controller]` token). Không hardcode, không thêm `/s`.
> **Golden Rule**: Route names must follow the standard RESTful convention (use hyphens).
---

## ✅ Controller mỏng — kế thừa BaseCrudApiController

```csharp
[ApiVersion("1")]
[Route("api/v{version:apiVersion}/[controller]")]
[CheckAccessBaseCRUD("HRM_TALENT_TIER")]
public class TalentTierController : BaseCrudApiController<
    TalentTierDto,              // TResult
    BaseRequestGridModel,       // TRequestList
    BaseRequestGridModel,       // TRequestGrid
    CreateTalentTierCommandRequest,  // TRequestCreate
    UpdateTalentTierCommandRequest,  // TRequestUpdate
    Guid>                            // TKey
{
    // Không cần code thêm — base đã xử lý CRUD

    // Chỉ override khi cần custom action
    [HttpPost("recalculate")]
    [CheckAccess(PermissionKey = "HRM_TALENT_TIER_RECALCULATE")]
    public async Task<IActionResult> Recalculate([FromBody] RecalculateTalentTierCommand command)
        => await HandleRequest(command);
}
```

---

## ❌ Sai — Controller chứa business logic

```csharp
public class TalentTierController : ControllerBase
{
    private readonly IGenericRepository<TalentTier, Guid> _repo;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTalentTierCommandRequest request)
    {
        if (string.IsNullOrEmpty(request.Name)) return BadRequest("...");  // ❌ Validation trong controller
        var entity = new TalentTier { Name = request.Name };               // ❌ Business logic
        await _repo.AddAsync(entity);                                      // ❌ Direct repository
        return Ok(entity);
    }
}
```

---

## BaseCrudApiController Variants

```csharp
// 1. Single request type (create = update)
BaseCrudApiController<TResult, TRequest, TKey>

// 2. Separate create/update
BaseCrudApiController<TResult, TQueryList, TCreateRequest, TUpdateRequest, TKey>

// 3. Separate create/update + lifecycle hooks
BaseCrudApiController<TResult, TQueryList, TQueryListGrid, TCreateRequest, TUpdateRequest, TKey>
```

---

## Security — bắt buộc trên mọi endpoint

```csharp
// ✅ Trên action
[CheckAccess(PermissionKey = "HRM_TALENT_TIER_CREATE")]
public async Task<IActionResult> Create(...) => await HandleRequest(command);

// ✅ Trên controller (CRUD tự động)
[CheckAccessBaseCRUD("HRM_TALENT_TIER")]
public class TalentTierController : BaseCrudApiController<...> { }

// ❌ Thiếu attribute
[HttpPost]
public async Task<IActionResult> Create(...) { } // ĐỪNG LÀM
```
