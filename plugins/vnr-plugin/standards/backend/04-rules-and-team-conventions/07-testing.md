# 07 — Testing

> Thuộc: [04-rules-and-team-conventions.md](../04-rules-and-team-conventions.md)
> Coverage target: **≥ 80% branch coverage** — bắt buộc cho Handlers và Validators.

---

## Handler Test với Moq

```csharp
public class CreateGoalHandlerTests
{
    private readonly Mock<IGenericRepository<Goal, Guid>> _mockRepo;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly CreateGoalCommandHandler _handler;

    public CreateGoalHandlerTests()
    {
        _mockRepo       = new Mock<IGenericRepository<Goal, Guid>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper     = new Mock<IMapper>();
        _handler = new CreateGoalCommandHandler(
            _mockRepo.Object, _mockUnitOfWork.Object, _mockMapper.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_ShouldCreateGoal()
    {
        // Arrange
        var command = new CreateGoalCommand { Request = new CreateGoalRequest { Title = "Q1 Goal" } };
        var entity  = new Goal { Id = Guid.NewGuid(), Title = "Q1 Goal" };
        var dto     = new GoalDto { Id = entity.Id, Title = entity.Title };

        _mockMapper.Setup(x => x.Map<Goal>(It.IsAny<CreateGoalRequest>())).Returns(entity);
        _mockMapper.Setup(x => x.Map<GoalDto>(It.IsAny<Goal>())).Returns(dto);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("Q1 Goal", result.Data.Title);
        _mockRepo.Verify(x => x.AddAsync(It.IsAny<Goal>(), null), Times.Once);
        _mockUnitOfWork.Verify(x => x.SaveChanges(), Times.Once);
    }

    [Fact]
    public async Task Handle_DuplicateTitle_ShouldThrow()
    {
        _mockRepo.Setup(x => x.AddAsync(It.IsAny<Goal>(), null))
            .ThrowsAsync(new DbUpdateException("Duplicate key"));

        await Assert.ThrowsAsync<DbUpdateException>(() => _handler.Handle(...));
    }
}
```

---

## Validator Test

```csharp
public class CreateGoalValidatorTests
{
    private readonly CreateGoalValidator _validator = new CreateGoalValidator();

    [Fact]
    public void Validate_EmptyTitle_ShouldHaveError()
    {
        var command = new CreateGoalCommand
        {
            Request = new CreateGoalRequest { Title = "" }
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Request.Title");
    }

    [Fact]
    public void Validate_StartDateAfterEndDate_ShouldHaveError()
    {
        var command = new CreateGoalCommand
        {
            Request = new CreateGoalRequest
            {
                Title     = "Goal",
                StartDate = DateTime.Now.AddDays(10),
                EndDate   = DateTime.Now
            }
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Request.StartDate");
    }
}
```

---

## Coverage Requirements

| Loại | Bắt buộc | Optional |
|------|---------|---------|
| Handlers | ✅ | — |
| Validators | ✅ | — |
| Application Services | — | ✅ |
| Extensions | — | ✅ |

**Target**: ≥ 80% branch coverage cho code mới/thay đổi.
