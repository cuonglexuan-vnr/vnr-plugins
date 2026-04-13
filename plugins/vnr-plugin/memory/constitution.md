---
name: VNR Project Constitution
version: "1.0"
description: >-
  Nguyên tắc cốt lõi và quy ước bắt buộc cho mọi feature trong VNR Solution.
  Tất cả agents phải tuân theo. Không có exception nếu không có lý do rõ ràng.
---

# VNR Project Constitution

## Principle I — Code Quality & Test Coverage

- **Coverage tối thiểu**: ≥ 80% branch coverage (Backend) và ≥ 80% statement coverage (Frontend).
- **Unit test bắt buộc** cho mỗi Handler và Validator mới.
- **Không merge** nếu có unit test failure.
- Playwright Happy Path scenarios phải có implementation (không để tất cả là `test.todo`).

---

## Principle II — Architecture Integrity

### Backend
- **Clean Architecture**: dependency flows inward — `API → Application → Domain`. Infrastructure không được tham chiếu bởi Application hoặc Domain.
- **Controller = thin**: chỉ gọi `HandleRequest()` — không business logic, không conditional, không repository call.
- **CQRS**: Commands (write) và Queries (read) tách biệt rõ ràng.
- **Repository pattern**: interface trong Domain, implement trong Infrastructure.
- **Exception handling**: dùng `NotFoundException`, `ConflictException`, `BusinessException` — không tự return HTTP status codes.

### Frontend
- **Micro-frontend**: mỗi remote app độc lập, không import trực tiếp từ app khác (dùng shared libs).
- **HTTP calls**: chỉ trong `api/<feature>.service.ts` — không call trực tiếp từ component.
- **URL**: tương đối `/api/v1/...` — không hardcode base URL.
- **Route**: lazy `loadComponent` + `canActivate: [authGuard]` cho mọi protected route.
- **Interceptor order**: base URL → auth → unauthorized — không thay đổi.

---

## Principle III — Security

- **Authentication**: JWT Bearer bắt buộc trên mọi endpoint (trừ public endpoint có document rõ ràng).
- **Authorization**: `[CheckAccess]` hoặc `[CheckAccessBaseCRUD]` trên mọi controller action.
- **Permission key**: format `HRM_<MODULE>_<FEATURE>` — không tự ý đặt key ngoài convention.
- **Input validation**: FluentValidation cho mọi Command — `NotEmpty`, `MaximumLength`, range check.
- **No mass assignment**: không expose EF Entity làm request body — luôn dùng Request DTO.
- **No hardcoded secrets**: signing keys, connection strings đọc từ config/secrets, không hardcode.
- **No sensitive logs**: không log password, token, PII.
- **DevAuth guard**: mọi dev/test bypass phải có `IsProduction` check.

---

## Principle IV — Naming Conventions

### Backend
| Item | Pattern | Ví dụ |
|------|---------|-------|
| Command | `Create<Feature>Command` | `CreateIdpCommand` |
| Handler | `Create<Feature>Handler` | `CreateIdpHandler` |
| Validator | `Create<Feature>Validator` | `CreateIdpValidator` |
| Query | `List<Feature>Query` | `ListIdpQuery` |
| Request DTO | `Create<Feature>Request` | `CreateIdpRequest` |
| Response DTO | `<Feature>Dto` | `IdpDto` |
| Permission key | `HRM_<MODULE>_<FEATURE>` | `HRM_SCC_IDP` |
| Route | `api/v{version:apiVersion}/[controller]` | `/api/v1/Idp` |

### Frontend
| Item | Pattern | Ví dụ |
|------|---------|-------|
| Component | `<feature>/<feature>.component.ts` | `idp/idp.component.ts` |
| Service | `api/<feature>.service.ts` | `api/idp.service.ts` |
| Model | `models/<feature>.model.ts` | `models/idp.model.ts` |
| Route path | `kebab-case` | `/idp-commitments` |
| Test file | `<name>.component.spec.ts` | `idp.component.spec.ts` |

---

## Principle V — Documentation & Artifacts

- **plan.md** phải được duyệt trước khi implement.
- **tasks.md** phải hoàn chỉnh (không để trống `Chi tiết`) trước khi implement.
- **API contracts** (`api-commitments.md`) phải được cập nhật khi thêm endpoint mới.
- **`docs/raw/api-http-contracts.md`** trong repo phải được cập nhật.
- **User guide** viết bằng tiếng Việt, hướng đến end-user không có kiến thức kỹ thuật.
- **Report** phải có sign-off checklist đầy đủ trước khi tạo PR.

---

## Principle VI — Git & PR Workflow

- **Dual-repo**: `src/backend/` và `src/frontend/` là 2 git repository riêng biệt.
- **Branch naming**: `feature/<feature-id>` (ví dụ: `feature/011-idp-commitments`) — tạo trong **cả 2 repo**.
- **Tạo branch**: `cd src/backend && git checkout -b feature/<id>` và `cd src/frontend && git checkout -b feature/<id>`.
- **Commit message**: `feat(<feature>): <mô tả ngắn>` (Conventional Commits) — commit riêng từng repo.
- **PR**: tạo PR riêng cho mỗi repo. Không merge nếu Arch Review FAIL hoặc Security Review FAIL.
- **PR**: không merge nếu có unit test failure.
- **Squash merge** preferred để history sạch.

---

## Gates (Điều kiện bắt buộc trước khi sang bước tiếp theo)

| Gate | Điều kiện |
|------|----------|
| Plan → Tasks | plan.md được user approve |
| Tasks → QC Generate + Testcase Writer | tasks.md được user approve |
| QC + Testcases → Implement | test-scenarios.md + testcases.md được user approve |
| Implement → Unit Tests | Build thành công (0 error) |
| Unit Tests → Review | Không bắt buộc, auto-continue |
| Review → Run Tests | Arch PASS + Security PASS (hoặc user override WARN) |
| Run Tests → E2E | Unit test 0 failures |
| E2E → Report | Không bắt buộc (WARN nếu có failures) |
| Report → PR | Sign-off checklist đầy đủ |
