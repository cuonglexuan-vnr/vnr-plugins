# Backend Architecture & Structure

## 1. Architecture Overview

VNR.Solution follows **Clean Architecture** combined with **CQRS (Command Query Responsibility Segregation)** and **Domain-Driven Design (DDD)**.

The dependency rule flows strictly inward:

```
HTTP Request
    ↓
┌─────────────────────────────────────────────────────┐
│  API Layer  (Controllers)                           │
│    ↓ dispatches IRequest via MediatR                │
├─────────────────────────────────────────────────────┤
│  Application Layer  (Commands / Queries / Handlers) │
│    ↓ calls Application Service interfaces           │
├─────────────────────────────────────────────────────┤
│  Domain Layer  (Entities, Value Objects, Repos)     │
│    ↑ implemented by                                 │
├─────────────────────────────────────────────────────┤
│  Infrastructure Layer  (EF Core, Dapper, Jobs, …)   │
└─────────────────────────────────────────────────────┘
```

**Key rules:**
- Domain has **no dependencies** on any other layer.
- Application depends only on Domain.
- Infrastructure implements the interfaces defined in Domain/Application.
- Controllers are **thin** — they only call `HandleRequest(command/query)` and never contain business logic.

---

## 2. Solution Layout

```
VNR.Solution/
├── Src/
│   ├── Cores/           ← shared kernel, used by all services
│   ├── Infrastructure/  ← cross-cutting infrastructure implementations
│   ├── Services/        ← business vertical slices (one slice = one bounded context)
│   ├── Hosting/         ← DI wiring + worker host
│   ├── Monitoring/      ← HealthChecks.UI
│   └── Tools/           ← CLI tooling (migration, security)
├── Tests/
├── SQL/                 ← MSSQL / PostgreSQL scripts
├── Docs/                ← Architecture guides, TDRs, coding guides
├── k8s/                 ← Kubernetes manifests
└── appsettings*.json    ← Configuration files
```

---

## 3. Cores Layer (`Src/Cores/`)

Shared kernel projects referenced by every service. **Never add service-specific logic here.**

| Project | Role |
|---------|------|
| `VNR.Core` | Base types, health checks, JWT, AutoMapper setup, SignalR, `IApiResult<T>`, `ApiResultStatus` enum, all exception types |
| `VNR.Core.Api` | `BaseApiController`, `BaseCrudApiController`, `IApiContext`, NSwag config, FluentValidation pipeline |
| `VNR.Core.Application` | CQRS base: commands, queries, handlers, `CrudHandler<>`, `ValidationBehavior`, `CrudHandlerBehavior` |
| `VNR.Core.Domain` | Domain base: `EntityBase<TId>`, `IAuditableEntity`, `ISoftDelete`, `IGenericRepository<,>`, `IUnitOfWork`, `DomainException` |
| `VNR.Core.Common` | Shared utilities, helpers |
| `VNR.Core.Configurations` | Typed configuration models |
| `VNR.Core.Jobs` | Background job abstractions (Cronos) |
| `VNR.Core.Models` | Shared DTOs, `BaseDto`, `BaseRequestGridModel`, `BaseResponseGridModel<T>` |
| `VNR.Core.Security` | JWT / OIDC security abstractions |

---

## 4. Infrastructure Layer (`Src/Infrastructure/`)

| Project | Role |
|---------|------|
| `VNR.Infrastructure.BaseRepositories` | `GenericRepository<,>`, `DapperRepository`, `UnitOfWork`, Redis, EFCore.BulkExtensions |
| `VNR.Infrastructure.EntityFramework.SqlServer` | EF Core + SQL Server provider |
| `VNR.Infrastructure.EntityFramework.PostgreSQL` | EF Core + Npgsql provider |
| `VNR.Infrastructure.Persistence` | ASP.NET Identity, DataProtection, EF migrations, Polly |
| `VNR.Infrastructure.Jobs` | Hangfire + Hangfire.PostgreSql |
| `VNR.Infrastructure.Logging` | Serilog (Seq, Elasticsearch, File, Async sinks) |
| `VNR.Infrastructure.Notification` | MailKit (SMTP), Firebase (push), Microsoft Graph |
| `VNR.Infrastructure.Queue` | Confluent.Kafka producer/consumer |
| `VNR.Infrastructure.Security` | JWT Bearer, OIDC middleware |
| `VNR.Infrastructure.Translation` | i18n / localization |
| `VNR.Infrastructure.Permission` | Server-side permission filter enforcement |
| `VNR.Infrastructure.DataExchange` | Import / export |

---

## 5. Service Slice Layout

Each service is a self-contained **vertical slice**. All 5 projects follow the same pattern:

```
Src/Services/{Name}/
├── VNR.Service.{Name}.Api/            ← Web API host
│   ├── Controllers/                   ← HTTP endpoints (thin, one-liner)
│   ├── Program.cs                     ← Entry point via BaseProgram
│   ├── Startup.cs                     ← DI wiring via StartupServices()
│   └── Extensions/                    ← service-specific DI registrations
│
├── VNR.Service.{Name}.Application/   ← business use cases
│   ├── {Feature}/Commands/            ← write-side: CreateXxxCommand, UpdateXxxCommand, …
│   ├── {Feature}/Queries/             ← read-side: ListXxxQuery, GetXxxByIdQuery, …
│   ├── {Feature}/Services/            ← application service interfaces
│   └── {Feature}/Events/              ← domain event handlers
│
├── VNR.Service.{Name}.Domain/        ← business model
│   ├── Entities/                      ← domain entity classes
│   ├── ValueObjects/                  ← value object classes
│   ├── Events/                        ← domain events
│   └── Repository/                    ← repository interfaces (no implementation)
│
├── VNR.Service.{Name}.Infrastructure/ ← data access & external integrations
│   ├── Services/                      ← application service implementations
│   ├── Jobs/                          ← background jobs
│   └── Extensions/                    ← Add{Name}Services() DI extension
│
└── VNR.Service.{Name}.Models/        ← DTOs
    ├── RequestDtos/
    └── ResponseDtos/
```

**Active services:**

| Service | Bounded context |
|---------|----------------|
| `HRE` | Core HR (profiles, contracts, org) |
| `Evaluation` | Objectives / performance evaluation |
| `Succession` | Succession planning |
| `Training` | Training management |
| `System` | System administration |
| `Notification` | Messaging & push notifications |
| `Logging` | Centralized audit log |
| `Worker` | Background job workers |
| `Gateway` (Ocelot) | API gateway routing |
| `IdentityServer` | OAuth 2.0 / OIDC auth server |
| `Shared` | Cross-service shared utilities |

---

## 6. Domain Layer Conventions

### EntityBase

All domain entities extend `EntityBase<TId>`:

```csharp
public abstract class EntityBase<TId> : IAuditableEntity, ISoftDelete
{
    public TId Id { get; set; }
    public string UserCreate { get; set; }
    public string UserUpdate { get; set; }
    public DateTimeOffset? DateCreate { get; set; }
    public DateTimeOffset? DateUpdate { get; set; }
    public bool IsDelete { get; set; } = false;  // soft-delete flag
}
```

### Interfaces on entities

| Interface | Fields |
|-----------|--------|
| `IAuditableEntity` | `UserCreate`, `UserUpdate`, `DateCreate`, `DateUpdate` |
| `ISoftDelete` | `IsDelete` (global query filter excludes `IsDelete = true`) |
| `IActiveStatus` | `IsActive` |
| `IAggregateRoot` | Marker interface for aggregate roots |
| `IHasCacheKey` | `GetCacheKey()` for cache invalidation |

### Repository Interface

`IGenericRepository<TEntity, TKey>` (defined in Domain, implemented in Infrastructure):

```
GetAllAsync()            GetAllIgnoreFilters()
GetByIdAsync()           GetByIdIgnoreFiltersAsync()
FindAsync()              FindIgnoreFilters()
FirstOrDefaultAsync()    ExistsAsync()  AnyAsync()  CountAsync()
AddAsync()               UpdateAsync()  DeleteAsync()
AddRangeAsync()          UpdateRangeAsync()  DeleteRangeAsync()
GetPagedAsync()          GetDbSet()     AsQueryable()
```

All mutating methods accept an optional `permissionKey` to enforce row-level security.

### IUnitOfWork

```csharp
DbContext Context { get; }
int SaveChanges();
Task<int> SaveChangesAsync();
Task ExecuteInTransactionAsync(Func<Task> action);
Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> action);
```

---

## 7. CQRS / MediatR Pattern

### Flow

```
Controller.HandleRequest(command/query)
  → BaseApiController catches exceptions, calls _mediator.Send(request)
    → MediatR pipeline:
        1. ValidationBehavior  (FluentValidation — throws ValidationException on failure)
        2. CrudHandlerBehavior (optional cross-cutting concerns)
        3. Handler.Handle()    (business logic)
    → returns IApiResult<T>
  → Controller returns Ok(result)
```

### Commands (write-side)

All commands implement `ICommand<TResult>` (which is `IRequest<IApiResult<TResult>>`).

| Generic command | HTTP mapping | Description |
|-----------------|-------------|-------------|
| `CreateCommand<TRequest, TResult>` | `POST /` | Create entity |
| `UpdateCommand<TKey, TRequest, TResult>` | `PUT /{id}` | Update by ID |
| `DeleteCommand<TKey, TResult>` | `DELETE /{id}` | Soft-delete by ID |
| `DeleteRangeCommand<TKey, TResult>` | `DELETE /batch` | Soft-delete many |
| `DeleteManyCommand<TRequest, TResult>` | `DELETE` (custom body) | Batch delete with complex criteria |
| `UpdateManyCommand<TRequest, TResult>` | `PUT` (custom body) | Batch update |

Custom commands extend these or `BaseCommand<TResult>` directly.

**Handler base class:**

```csharp
public abstract class CommandHandler<TRequest, TResult> : BaseResponse, ICommandHandler<TRequest, TResult>
{
    public abstract Task<IApiResult<TResult>> Handle(TRequest request, CancellationToken cancellationToken);
}
```

### Queries (read-side)

| Generic query | Description |
|---------------|-------------|
| `Query<TKey, TResult>` | Get single entity by ID |
| `QueryList<TResult>` | Get unfiltered list |
| `QueryListGrid<TResult>` | Kendo grid paged/sorted/filtered list |
| `QueryListGrid<TRequest, TResult>` | Same with typed request model |

**Handler base class for grid queries:**

```csharp
public class QueryListGridHandler<TQuery, TResult>
    : IQueryListGridHandler<TQuery, TResult>
    where TQuery : IQueryListGrid<TResult>
    where TResult : BaseDto
{
    public abstract Task<IApiResult<BaseResponseGridModel<TResult>>> Handle(TQuery request, CancellationToken cancellationToken);
}
```

### CrudHandler (auto-wired CRUD)

For simple entities with no custom business logic, `CrudHandler<TResult, TRequest, TEntity, TKey>` wires all 6 standard operations automatically via AutoMapper + GenericRepository:

```csharp
CrudHandler<TResult, TRequest, TEntity, TKey>
  implements:
    IRequestHandler<QueryListGrid<TResult>, ...>
    IRequestHandler<Query<TKey, TResult>, ...>
    IRequestHandler<CreateCommand<TRequest, TResult>, ...>
    IRequestHandler<UpdateCommand<TKey, TRequest, TResult>, ...>
    IRequestHandler<DeleteCommand<TKey, TResult>, ...>
    IRequestHandler<DeleteRangeCommand<TKey, TResult>, ...>
```

Supports optional `ICrudLifecycle<TEntity, TResult>` hooks: `BeforeCreate`, `AfterCreate`, `BeforeUpdate`, `AfterUpdate`, `BeforeDelete`, `AfterDelete`, `AfterDeleteRange`.

---

## 8. API Layer Conventions

### Controller pattern

```csharp
[OpenApiTag("[{Domain}][{Feature}]", Description = "...")]
[ApiVersion("1")]
[Route("api/v{version:apiVersion}/[controller]")]
public class FeatureController : BaseApiController
{
    public FeatureController(IApiContext apiContext) : base(apiContext) { }

    [HttpPost("list-data")]
    public async Task<IActionResult> ListData(ListFeatureQuery request)
        => await HandleRequest(request);

    [HttpGet("{ID:guid}")]
    public async Task<IActionResult> GetById(GetFeatureByIdQuery query)
        => await HandleRequest(query);

    [HttpPost]
    public async Task<IActionResult> Create(CreateFeatureCommand command)
        => await HandleRequest(command);

    [HttpPut("{ID:guid}")]
    public async Task<IActionResult> Update(UpdateFeatureCommand command)
        => await HandleRequest(command);

    [HttpDelete("{ID:guid}")]
    public async Task<IActionResult> Delete(DeleteFeatureCommand request)
        => await HandleRequest(request);
}
```

`HandleRequest()` (in `BaseApiController`) dispatches via MediatR and maps all exceptions to the appropriate `ApiResult`.

### BaseCrudApiController

For pure CRUD with no custom logic, inherit one of three overloads:

```csharp
// Single request type (create = update)
BaseCrudApiController<TResult, TRequest, TKey>

// Separate create/update types
BaseCrudApiController<TResult, TQueryList, TCreateRequest, TUpdateRequest, TKey>

// Separate create/update + lifecycle hooks (OnAfterCreate, OnAfterUpdate, etc.)
BaseCrudApiController<TResult, TQueryList, TQueryListGrid, TCreateRequest, TUpdateRequest, TKey>
```

---

## 9. Response Contract

All responses use `IApiResult<T>` / `ApiResult<T>`:

```json
{
  "Status": "SUCCESS",
  "Data": { ... },
  "Message": "Success",
  "Code": "Success",
  "LogId": null
}
```

**`ApiResultStatus` values:**

| Status | Meaning |
|--------|---------|
| `SUCCESS` | Normal success |
| `WARNING_BUSINESS_VALIDATOR` | Business rule soft-warning (HTTP 200) |
| `INVALID_REQUEST_VALIDATOR` | Request argument validation failed |
| `INVALID_BUSINESS_VALIDATOR` | Business argument validation failed |
| `BAD_REQUEST` | FluentValidation / ArgumentException (HTTP 400) |
| `EXCEPTION` | Unhandled server error (HTTP 200 with error detail) |

**Exception → status mapping (in `HandleRequest`):**

| Exception type | `ApiResultStatus` | HTTP code |
|---------------|------------------|-----------|
| `BusinessException` | `WARNING_BUSINESS_VALIDATOR` | 200 |
| `RequestArgumentsValidatorException` | `INVALID_REQUEST_VALIDATOR` | 200 |
| `BusinessArgumentsValidatorException` | `INVALID_BUSINESS_VALIDATOR` | 200 |
| `ValidationException` (FluentValidation) | `BAD_REQUEST` | 400 |
| `ArgumentException` | `BAD_REQUEST` | 400 |
| `UnauthorizedAccessException` | `BAD_REQUEST` | 400 |
| `FileNotFoundException` | `WARNING_BUSINESS_VALIDATOR` | 200 |
| `Exception` (catch-all) | `EXCEPTION` | 200 |

---

## 10. Kendo Grid Query Pattern

List endpoints serve Kendo Grid clients using `BaseRequestGridModel` / `BaseResponseGridModel<T>`.

```
POST /api/v1/FeatureController/list-data
Body: BaseRequestGridModel  { Page, PageSize, Sort[], Filter, Group, ... }

Response:
{
  "Status": "SUCCESS",
  "Data": {
    "Data": [ ... ],
    "Total": 150
  }
}
```

Stored procedures for grid queries are named `sp_*` and configured in `Resources/Settings/GridConfigStores`.

---

## 11. MediatR Pipeline Behaviors

Registered globally in `StartupServices()`:

| Behavior | Purpose |
|----------|---------|
| `ValidationBehavior<TRequest, TResponse>` | Runs all `IValidator<TRequest>` validators (FluentValidation) before the handler. Throws `ValidationException` on failure. |
| `CrudHandlerBehavior<TRequest, TResponse>` | Optional cross-cutting logic for generic CRUD handlers. |

---

## 12. Startup Wiring

All services use a shared `StartupServices()` extension (from `VNR.Hosting.CompositionRoot`):

```csharp
// Startup.cs
public void ConfigureServices(IServiceCollection services)
{
    services.StartupServices(_configuration, _assemblyModel);
    services.Add{ServiceName}Services();   // service-specific DI
}

public void Configure(IApplicationBuilder app)
    => app.StartupConfigure(_environment, _configuration, _assemblyModel);
```

`StartupServices()` registers: MediatR, AutoMapper, FluentValidation, NSwag, Serilog, Health Checks, Redis, EF Core, JWT/OIDC auth, Hangfire, Prometheus, CORS, and all pipeline behaviors.

Service-specific DI goes into `Add{ServiceName}Services()` in `.Infrastructure/Extensions/`.

---

## 13. Hosting

| Project | Role |
|---------|------|
| `VNR.Hosting.CompositionRoot` | Shared `StartupServices()` / `StartupConfigure()`, `BaseProgram`, Serilog bootstrap, Prometheus |
| `VNR.Hosting.WorkerHost` | Background job host (Hangfire worker process) |

All service `Program.cs` use `BaseProgram.CreateDefaultBuilder<Startup>(args)`.

---

## 14. Key Docs

| File | Content |
|------|---------|
| `Docs/Business_Flow_Coding_Guide.md` | End-to-end coding flow with templates |
| `Docs/Service_Architecture_Guide.md` | Architecture deep-dive + new service scaffold |
| `Docs/BaseCrudApiController_Usage_Guide.md` | CRUD controller usage guide |
| `Docs/QueryListGrid_API_Guide.md` | Kendo grid query/handler guide |
| `Docs/Technical_Decision_Records.md` | Architecture decisions (ADR/TDR) |
| `Docs/DatabaseMigration_Workflow_Guide.md` | Idempotent SQL-first migration workflow |
