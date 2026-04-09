# Backend Tech Stack

## Runtime & Framework

| Item | Version |
|------|---------|
| Runtime | .NET 8 (`net8.0`) |
| Web framework | ASP.NET Core 8 |
| Language | C# (nullable annotations enabled per project) |
| API style | REST, URL-versioned (`/api/v1/...`) |
| Solution file | `VNR.Solution.sln` (126 projects) |

---

## Architecture

**Clean Architecture + CQRS + Domain-Driven Design (DDD)**

```
Presentation  →  Application  →  Domain
                     ↓
              Infrastructure
```

Each vertical-slice service follows:

```
VNR.Service.{Name}/
├── .Api/            ← Controllers (thin), Program.cs, Startup.cs
├── .Application/    ← Commands, Queries, Handlers (MediatR), Application Services
├── .Domain/         ← Entities, Value Objects, Domain Events, Repository Interfaces
├── .Infrastructure/ ← Repo implementations, Background Jobs, DI extensions
└── .Models/         ← DTOs / request-response models
```

---

## Solution Layout

```
Src/
├── Cores/           ← Shared kernel (used by all services)
│   ├── VNR.Core                  ← Base types, health checks, JWT, AutoMapper, SignalR
│   ├── VNR.Core.Api              ← BaseApiController, NSwag setup, FluentValidation, MediatR
│   ├── VNR.Core.Application      ← Logging (Serilog), Audit.NET, AutoMapper, CQRS base
│   ├── VNR.Core.Common           ← Shared utilities
│   ├── VNR.Core.Configurations   ← Typed configuration models
│   ├── VNR.Core.Domain           ← Domain base classes
│   ├── VNR.Core.Jobs             ← Background job abstractions (Cronos)
│   ├── VNR.Core.Models           ← Shared DTOs / Kendo grid models
│   └── VNR.Core.Security         ← JWT/OIDC security abstractions
│
├── Infrastructure/  ← Cross-cutting infrastructure implementations
│   ├── VNR.Infrastructure.BaseRepositories   ← Generic repository, Dapper, Redis, EFCore.BulkExtensions
│   ├── VNR.Infrastructure.EntityFramework.SqlServer   ← EF Core + SQL Server provider
│   ├── VNR.Infrastructure.EntityFramework.PostgreSQL  ← EF Core + Npgsql provider
│   ├── VNR.Infrastructure.Persistence        ← ASP.NET Identity, DataProtection, both DB providers, Polly
│   ├── VNR.Infrastructure.Jobs               ← Hangfire + Hangfire.PostgreSql
│   ├── VNR.Infrastructure.Logging            ← Serilog sinks (Seq, Elasticsearch, File, Async)
│   ├── VNR.Infrastructure.Notification       ← MailKit/MimeKit, Firebase, Microsoft Graph
│   ├── VNR.Infrastructure.Queue              ← Confluent.Kafka producer/consumer
│   ├── VNR.Infrastructure.Security           ← JWT Bearer, OIDC middleware
│   ├── VNR.Infrastructure.Translation        ← i18n / localization
│   ├── VNR.Infrastructure.Permission         ← Permission enforcement
│   └── VNR.Infrastructure.DataExchange       ← Data import/export
│
├── Services/        ← Business vertical slices
│   ├── HRE           ← Core HR operations
│   ├── Evaluation    ← Objective / performance evaluation
│   ├── Succession    ← Succession planning
│   ├── Training      ← Training management
│   ├── System        ← System administration
│   ├── Notification  ← Messaging & notifications
│   ├── Logging       ← Centralized audit log service
│   ├── Worker        ← Background job workers
│   ├── Gateway       ← Ocelot API gateway
│   ├── IdentityServer ← OAuth 2.0 / OpenID Connect (IdentityServer4)
│   └── Shared        ← Cross-service shared utilities
│
├── Hosting/
│   ├── VNR.Hosting.CompositionRoot  ← DI wiring, Serilog, Prometheus
│   └── VNR.Hosting.WorkerHost       ← Background job host
│
├── Monitoring/      ← HealthChecks.UI
└── Tools/
    ├── VNR.Tool.Security           ← Security tooling
    └── VNR.Tool.UpdateMigrateDb    ← Database migration CLI
```

---

## Core Libraries

### CQRS & Mediator
| Package | Version | Role |
|---------|---------|------|
| `MediatR` | 12.5.0 | Commands / Queries / Notifications dispatch |

All business operations go through `IRequest<T>` / `IRequestHandler<,>`. Controllers are thin wrappers calling `ISender.Send(command)`.

### API Layer
| Package | Version | Role |
|---------|---------|------|
| `NSwag.AspNetCore` | 14.3.0 | Swagger/OpenAPI documentation |
| `FluentValidation` | 10.3.4 | Request model validation (pipeline behaviour) |
| `AutoMapper` | 14.0.0 | Entity ↔ DTO mapping |
| `Newtonsoft.Json` | 13.0.3 | JSON serialization (primary) |
| `System.Text.Json` | 8.0.5 | JSON serialization (secondary) |
| `Microsoft.AspNetCore.Mvc.Versioning` | 5.1.0 | URL-based API versioning |
| `Kendo.Mvc` | (local DLL) | Kendo grid DataSource / request binding |
| `Hellang.Middleware.ProblemDetails` | 6.5.1 | RFC 7807 error responses |

### Data Access
| Package | Version | Role |
|---------|---------|------|
| `Microsoft.EntityFrameworkCore` | 8.0.11 | ORM (primary) |
| `Microsoft.EntityFrameworkCore.SqlServer` | 8.0.11 | SQL Server provider |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 8.0.11 | PostgreSQL provider |
| `Dapper` | 2.0.123 | Micro-ORM for raw SQL / stored procedures |
| `EFCore.BulkExtensions.Core` | 8.1.3 | Bulk insert/update/delete |
| `Microsoft.Data.SqlClient` | 6.0.2 | ADO.NET SQL Server driver |
| `Devart.Data.Oracle` | 10.4.193 | Oracle driver (optional) |

**Database strategy:** Dual-database (SQL Server + PostgreSQL). SQL scripts live in `/SQL/MSSQL/` and `/SQL/PostgreSQL/`. Migrations use `VNR.Tool.UpdateMigrateDb` (idempotent SQL-first workflow — see `Docs/DatabaseMigration_Workflow_Guide.md`).

### Caching
| Package | Version | Role |
|---------|---------|------|
| `StackExchange.Redis` | 2.8.31 | Distributed cache (Redis) |
| `Microsoft.Extensions.Caching.Memory` | 8.0.1 | In-process memory cache |
| `System.Runtime.Caching` | 8.0.1 | Legacy `MemoryCache` wrapper |

### Background Jobs
| Package | Version | Role |
|---------|---------|------|
| `Hangfire` | 1.8.20 | Job scheduling, dashboard, retry |
| `Hangfire.AspNetCore` | 1.8.20 | ASP.NET Core integration |
| `Hangfire.PostgreSql` | 1.20.12 | PostgreSQL job storage backend |
| `Cronos` | 0.8.1 | Cron expression parsing |

### Message Queue
| Package | Version | Role |
|---------|---------|------|
| `Confluent.Kafka` | 2.10.0 | Kafka producer / consumer |

### Authentication & Security
| Package | Version | Role |
|---------|---------|------|
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 8.0.11 | JWT Bearer middleware |
| `Microsoft.IdentityModel.JsonWebTokens` | 8.3.1 | JWT validation |
| `Microsoft.IdentityModel.Protocols.OpenIdConnect` | 8.3.1 | OIDC discovery |
| `Cnblogs.IdentityServer4` | 4.2.1 | IdentityServer4 (forked, net8 compat) |
| `IdentityServer4.AccessTokenValidation` | 3.0.1 | Token validation middleware |
| `Microsoft.AspNetCore.Identity.EntityFrameworkCore` | 8.0.11 | ASP.NET Core Identity with EF |
| `Microsoft.AspNetCore.DataProtection` | 8.0.11 | Data protection (key ring) |
| `Polly` | 8.5.2 | Retry / circuit-breaker resilience |

**Auth config keys in `appsettings.json`:**
- `OwinJwtBearerConfiguration` — JWT Bearer (custom issuer + OIDC discovery mode)
- `OwinJwtBearerServerConfiguration` — token server audiences
- `BasicAuthenticationConfiguration` — HTTP Basic (disabled by default)

### Logging & Observability
| Package | Version | Role |
|---------|---------|------|
| `Serilog.AspNetCore` | 8.0.3 | Request logging, structured logs |
| `Serilog.Sinks.Seq` | 8.0.0 | Seq sink |
| `Serilog.Sinks.Elasticsearch` | 10.0.0 | Elasticsearch sink |
| `Serilog.Sinks.File` | 6.0.0 | File sink |
| `Serilog.Sinks.Async` | 2.0.0 | Async wrapper sink |
| `Serilog.Enrichers.Environment` | 2.3.0 | Machine/env enrichment |
| `Serilog.Enrichers.Thread` | 3.1.0 | Thread ID enrichment |
| `Audit.NET` | 30.0.1 | Domain-level audit trails |
| `Audit.EntityFramework` | 30.0.1 | EF change tracking audit |
| `Audit.NET.SqlServer` / `.PostgreSql` | 30.0.1 / 27.0.0 | Audit storage backends |
| `prometheus-net.AspNetCore` | 8.2.1 | Prometheus metrics endpoint |

### Health Checks
| Package | Version | Role |
|---------|---------|------|
| `AspNetCore.HealthChecks.UI` | 8.0.1 | Health dashboard UI |
| `AspNetCore.HealthChecks.SqlServer` | 8.0.1 | SQL Server probe |
| `AspNetCore.HealthChecks.NpgSql` | 8.0.1 | PostgreSQL probe |
| `AspNetCore.HealthChecks.Redis` | 8.0.1 | Redis probe |
| `AspNetCore.HealthChecks.Kafka` | 8.0.1 | Kafka probe |
| `AspNetCore.HealthChecks.Hangfire` | 8.0.1 | Hangfire probe |
| `AspNetCore.HealthChecks.Elasticsearch` | 8.0.1 | Elasticsearch probe |

### Notifications
| Package | Version | Role |
|---------|---------|------|
| `MailKit` / `MimeKit` | 4.14.x | SMTP email (outgoing) |
| `FirebaseAdmin` | 3.3.0 | Firebase Cloud Messaging (push) |
| `Microsoft.Graph` | 5.98.0 | Microsoft 365 / Teams integration |
| `Microsoft.Identity.Client` | 4.79.2 | MSAL for Graph auth |
| `Sendgrid` | 9.25.2 | SendGrid email (IdentityServer) |

### API Gateway
| Package | Version | Role |
|---------|---------|------|
| `Ocelot` | 23.4.0 | API gateway routing |
| `Ocelot.Cache.CacheManager` | 23.4.0 | Response caching for gateway |

### Real-time
| Package | Version | Role |
|---------|---------|------|
| `Microsoft.AspNetCore.SignalR.Client` | 8.0.12 | SignalR hub client |

---

## Kendo Grid Integration

The backend ships a local `Kendo.Mvc.dll` (referenced from `SharedBinaries/`). Grid endpoints use:
- `BaseRequestGridModel` — request model for paged/filtered queries
- `BaseResponseGridModel<TDto>` — response wrapper
- Stored procedures named `sp_*` with config in `Resources/Settings/GridConfigStores`

---

## Response Contract

All service controllers return `IApiResult<T>` via `BaseApiController` / `BaseCrudApiController`. The standard shape:

```json
{ "Status": "SUCCESS" | "ERROR", "Data": ..., "Message": "..." }
```

---

## Testing

```
Tests/
├── VNR.Core.Tests
├── VNR.Infrastructure.Tests
├── VNR.Modules.ModuleA.Tests
└── VNR.Modules.ModuleB.Tests
```

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `appsettings.json` | Base configuration (JWT, logging levels) |
| `appsettings.Development.json` | Dev overrides |
| `appsettings.Production.json` | Prod overrides |
| `VNR.Solution.sln` | Solution entry point |
| `SQL/MSSQL/` | SQL Server migration scripts |
| `SQL/PostgreSQL/` | PostgreSQL migration scripts |
| `k8s/` | Kubernetes deployment manifests |
| `Docs/DatabaseMigration_Workflow_Guide.md` | Idempotent DB migration guide |
| `Docs/Service_Architecture_Guide.md` | Architecture deep-dive |
| `Docs/Technical_Decision_Records.md` | ADR / TDR log |
| `Docs/BaseCrudApiController_Usage_Guide.md` | CRUD controller usage |
| `Docs/QueryListGrid_API_Guide.md` | Kendo grid query API guide |
