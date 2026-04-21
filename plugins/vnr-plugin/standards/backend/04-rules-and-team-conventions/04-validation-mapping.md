# 04 — Validation & AutoMapper

> Thuộc: [04-rules-and-team-conventions.md](../04-rules-and-team-conventions.md)

---

## FluentValidation — bắt buộc cho Commands

### ✅ Validator riêng biệt

```csharp
public class CreateGoalValidator : AbstractValidator<CreateGoalCommand>
{
    public CreateGoalValidator()
    {
        RuleFor(x => x.Request.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.Request.StartDate)
            .LessThan(x => x.Request.EndDate)
            .WithMessage("Start date must be before end date");

        RuleFor(x => x.Request.TargetValue)
            .GreaterThan(0)
            .When(x => x.Request.TargetValue.HasValue);
    }
}
```

### Đăng ký Validators

```csharp
// Tự động qua RegisterValidationBehavior
services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
```

### ❌ Validation trong Handler

```csharp
// ĐỪNG LÀM — validation không thuộc handler
if (string.IsNullOrEmpty(request.Request.Title))
    throw new ValidationException("Title is required");
```

---

## AutoMapper — Profile trong Application layer

### ✅ Profile đúng cách

```csharp
public class GoalMappingProfile : Profile
{
    public GoalMappingProfile()
    {
        // Request → Entity
        CreateMap<CreateGoalRequest, Goal>()
            .ForMember(dest => dest.Id,          opt => opt.Ignore())
            .ForMember(dest => dest.IsDelete,    opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy,   opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.OwnerId,     opt => opt.Ignore()); // ✅ Không map sensitive fields

        // Entity → DTO
        CreateMap<Goal, GoalDto>();
    }
}
```

### ❌ Manual mapping trong Handler (trừ mapping phức tạp)

```csharp
// ĐỪNG LÀM với simple objects
var dto = new GoalDto
{
    Id = entity.Id,
    Title = entity.Title,
    // ... 20 fields nữa
};
```

### ⚠️ Luôn ignore các fields nhạy cảm

| Field | Lý do |
|-------|-------|
| `IsDelete` | Soft-delete flag — không được overwrite |
| `CreatedBy` | Set bởi hệ thống |
| `CreatedDate` | Set bởi hệ thống |
| `OwnerId` | Security-sensitive |
