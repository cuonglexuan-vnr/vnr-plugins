# 05 — Repository, Persistence & Transactions

> Thuộc: [04-rules-and-team-conventions.md](../04-rules-and-team-conventions.md)

---

## IGenericRepository — cách dùng đúng

```csharp
public class GoalHandler : IRequestHandler<...>
{
    private readonly IGenericRepository<Goal, Guid> _goalRepo;
    private readonly IUnitOfWork _unitOfWork;

    public async Task<IApiResult<GoalDto>> Handle(...)
    {
        var goal = new Goal { ... };

        // ✅ Async methods
        await _goalRepo.AddAsync(goal);
        _unitOfWork.SaveChanges(); // hoặc SaveChangesAsync()

        return Result.Success(...);
    }
}
```

## Soft-Delete Convention

Mọi entity phải có property `IsDelete`:

```csharp
public class Goal
{
    public Guid Id { get; set; }
    public bool IsDelete { get; set; }  // ✅ bắt buộc
    // ...
}

// Delete → GenericRepository tự động set IsDelete = true
await _goalRepo.DeleteAsync(goalId);
```

---

## ⚠️ Permission Filtering — quan trọng

```csharp
// ✅ GenericRepository tự apply permission filter
var goals = await _goalRepo.GetAllAsync("HRM_GOAL_VIEW");

// ✅ Custom query → phải gọi ApplyPermissionFilterAsync
var query = _unitOfWork.Context.Set<Goal>().Where(g => g.Status == Status.Active);
query = await _goalRepo.ApplyPermissionFilterAsync(query, "HRM_GOAL_VIEW", PrivilegeType.Read);
var results = await query.ToListAsync();

// ❌ Bypass permission filter
private readonly ApplicationDbContext _context;
var goals = await _context.Goals.ToListAsync(); // ĐỪNG LÀM
```

**⚠️ Risk**: Thay đổi `GenericRepository` → test access control kỹ.
File: `Src/Infrastructure/VNR.Infrastructure.BaseRepositories/Base/GenericRepository.cs`

---

## Transaction & Unit of Work

### ✅ SaveChanges một lần ở cuối Handler

```csharp
public async Task<IApiResult<GoalDto>> Handle(...)
{
    // 1. Tất cả thao tác
    await _goalRepo.AddAsync(goal);
    await _taskRepo.AddRangeAsync(tasks);

    // 2. Save một lần duy nhất
    _unitOfWork.SaveChanges();

    return Result.Success(...);
}
```

### ❌ Save nhiều lần không cần thiết

```csharp
await _goalRepo.AddAsync(goal);
_unitOfWork.SaveChanges(); // ❌

await _taskRepo.AddAsync(task);
_unitOfWork.SaveChanges(); // ❌ — không cần thiết
```

### Transaction cho thao tác phức tạp

```csharp
await _unitOfWork.ExecuteInTransactionAsync(async () =>
{
    await _goalRepo.AddAsync(goal);
    await _taskRepo.AddRangeAsync(tasks);
    // SaveChanges được gọi tự động trong transaction
});
```
