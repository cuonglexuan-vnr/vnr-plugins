# Backend Rules & Team Conventions — VNR.Solution

> Áp dụng: Tất cả code trong `src/back-end/VNR.*`
> Mục đích: Đảm bảo nhất quán, tuân thủ kiến trúc, dễ review/maintain.
> **Golden Rule**: Khi không chắc → xem code tương tự đã có trong repo.

---

## Nội dung chi tiết

| File | Nội dung |
|------|---------|
| [01-naming.md](04-rules-and-team-conventions/01-naming.md) | Quy ước đặt tên: interfaces, services, DTOs, commands, queries, controllers, permission keys |
| [02-controllers.md](04-rules-and-team-conventions/02-controllers.md) | Thin controllers, route conventions, `BaseCrudApiController` |
| [03-cqrs-handlers.md](04-rules-and-team-conventions/03-cqrs-handlers.md) | Commands vs Queries, CrudHandler, custom handlers, anti-patterns |
| [04-validation-mapping.md](04-rules-and-team-conventions/04-validation-mapping.md) | FluentValidation, AutoMapper profiles, sensitive field mapping |
| [05-repository-persistence.md](04-rules-and-team-conventions/05-repository-persistence.md) | IGenericRepository, soft-delete, permission filtering, UoW/transaction |
| [06-di-error-security-logging.md](04-rules-and-team-conventions/06-di-error-security-logging.md) | DI conventions, IApiResult, exception handling, JWT, `[CheckAccess]`, Serilog, audit logging |
| [07-testing.md](04-rules-and-team-conventions/07-testing.md) | Unit tests con Moq, validator tests, coverage target ≥80% |
| [08-style-commits-checklist.md](04-rules-and-team-conventions/08-style-commits-checklist.md) | Async/await, method length, migrations, branch naming, commit messages, ⚠️ điểm đặc biệt (GenericRepository risk, multi-provider), PR checklist |

---

## Cấu trúc dự án (bắt buộc)

Mỗi service phải có đúng 5 projects:

```
VNR.Service.<Name>/
├── VNR.Service.<Name>.Api/            # Controllers
├── VNR.Service.<Name>.Application/    # Commands, Queries, Handlers, Validators
├── VNR.Service.<Name>.Domain/         # Entities, Domain services
├── VNR.Service.<Name>.Infrastructure/ # Repository implementations (nếu custom)
└── VNR.Service.<Name>.Models/         # DTOs, Request/Response models
```

Cross-cutting code (shared logic): đặt trong `Src/Cores/VNR.Core.*` — **không duplicate logic đã có trong Cores**.

---

## Nguyên tắc cốt lõi

- **Thin controllers**: Controllers chỉ dispatch, không chứa business logic.
- **Convention over configuration**: Đặt tên đúng → tự động đăng ký DI.
- **Test-first mindset**: Unit tests bắt buộc cho Handlers + Validators (≥80% coverage).
- **Ưu tiên stack hiện có**: `BaseCrudApiController` + `CrudHandler` + `GenericRepository` trước khi tạo custom.
- **Multi-provider support**: SQL Server + PostgreSQL — queries phải tương thích cả hai.

---

## Tài liệu tham khảo

| File | Mô tả |
|------|-------|
| `Src/Cores/VNR.Core.Api/Base/BaseApiController.cs` | Base controller |
| `Src/Cores/VNR.Core.Api/Base/BaseCrudApiController.cs` | CRUD controller |
| `Src/Cores/VNR.Core.Application/CrudHandler.cs` | Auto-wired CRUD handler |
| `Src/Infrastructure/VNR.Infrastructure.BaseRepositories/Base/GenericRepository.cs` | Generic repository |
| `Docs/DatabaseMigration_Workflow_Guide.md` | Idempotent migration workflow |
| `vnr-plugin/standards/backend/01-tech-stack.md` | Tech stack |
| `vnr-plugin/standards/backend/02-architecture-and-structure.md` | Architecture |
| `vnr-plugin/standards/backend/03-permission.md` | Permission system |
