---
name: VNR/HRM-Core Project Constitution
version: "2.0"
description: >-
  Hiến pháp dự án - Nguyên tắc cốt lõi, quy ước bắt buộc và quy trình làm việc.
  Tất cả agents phải tuân theo. Không có exception nếu không có lý do rõ ràng.
reference: >-
  Chi tiết đầy đủ: /CONSTITUTION.md (project root)
---

# HRM-Core Project Constitution

> **Tài liệu này là version tóm tắt cho agents.**
> **Xem đầy đủ:** `/CONSTITUTION.md` tại project root.

---

## 🎯 Nguyên tắc cốt lõi (Core Principles)

### 1. Documentation-First Development

- **Mọi tính năng bắt đầu từ tài liệu** - Không code trước khi có spec đầy đủ
- Tài liệu phải rõ ràng, đầy đủ, có thể kiểm chứng
- AI agents sử dụng tài liệu làm **single source of truth**

### 2. Spec-Driven Development

- **Mỗi feature = 1 thư mục trong `specs/`** với format `NNN-feature-name`
- Chu trình đầy đủ: `spec → plan → tasks → code → test → result`
- Không merge code nếu thiếu: test cases, API docs, implementation summary

### 3. AI-Human Collaboration

- **AI làm execution, Human làm decision**
- Agents tự động hóa tasks, humans focus on architecture decisions & approval
- Tất cả quyết định quan trọng phải được review bởi humans

### 4. Quality Over Speed

- **Code quality > Delivery speed**
- Mỗi PR phải qua: linting, unit tests (≥80%), integration tests, code review
- Không skip steps trong workflow

### 5. Knowledge Preservation

- **Mọi thay đổi phải được document**
- Wiki tự động cập nhật từ specs
- Architecture Decision Records (ADR) cho mọi quyết định kiến trúc

### 6. Monorepo Strategy

- Một repo chứa tất cả services (backend, frontend, mobile)
- Shared code trong `vnr-plugin/`
- Cross-service contracts được enforce

---

## 📁 Cấu trúc dự án

```
hrm-core/
├── docs/
│   ├── raw/              # Tài liệu gốc (architecture, API, UI, domain)
│   ├── wiki/             # AI-generated wiki (concepts, entities, flows)
│   ├── schema/           # Agent configs (AGENTS.md, workflows.yaml)
│   └── tools/            # Doc tools (sync-wiki.sh, validate-spec.sh)
├── specs/
│   └── NNN-feature/      # Feature specs (00-spec.md → 99-result.md)
├── src/
│   ├── backend/          # Backend services
│   ├── frontend/         # Web app
│   └── app-mobile/              # Flutter mobile app
└── vnr-plugin/
    ├── agents/           # Agent definitions
    ├── skills/           # Workflow orchestration
    ├── standards/        # Technical standards
    └── templates/        # Reusable templates
```

---

## 🔄 Quy trình phát triển (4 Phases)

### Phase 1: Planning (Planner Agent)

**Input:** User requirements  
**Output:** `00-spec.md`, `01-plan.md`, `02-tasks.md`  
**Gate:** Spec rõ ràng + Tasks actionable + Approved by PO

### Phase 2: Development (Developer Agent)

**Input:** Tasks from `02-tasks.md`  
**Output:** Code + Tests + API docs  
**Gate:** Tests pass (≥80%) + No linting errors + No security vulns

### Phase 3: QA (QA Agent)

**Input:** Pull requests  
**Output:** Test reports + `99-result.md`  
**Gate:** All test cases executed + No critical bugs + Docs updated

### Phase 4: Documentation (Documenter Agent)

**Input:** Completed specs  
**Output:** Updated wiki + API docs + Diagrams  
**Gate:** All APIs documented + No broken links + Examples tested

---

## 🛠 Architecture & Code Quality Standards

### Backend (ASP.NET Core / Node.js / Python / Go)

**Clean Architecture:**

- Dependency flows inward: `API → Application → Domain`
- Controller = thin: chỉ gọi `HandleRequest()` - không business logic
- CQRS: Commands (write) và Queries (read) tách biệt
- Repository pattern: interface trong Domain, implement trong Infrastructure
- Exception handling: `NotFoundException`, `ConflictException`, `BusinessException`

**API Design:**

- Route convention: `api/v{version:apiVersion}/[controller]`
- Response wrapper: `IApiResult<T>` / `BaseResponseGridModel<T>`
- Permission key format: `HRM_<MODULE>_<FEATURE>`
- Authentication: JWT Bearer bắt buộc
- Authorization: `[CheckAccess]` trên mọi controller action

**Testing:**

- Unit test coverage ≥ 80%
- Integration tests cho critical flows
- E2E tests cho user journeys

📖 **Chi tiết:** `vnr-plugin/standards/backend.md`

---

### Frontend (Angular 19 / React / Vue)

**Micro-frontend:**

- Mỗi remote app độc lập
- Không import trực tiếp từ app khác (dùng shared libs)
- HTTP calls chỉ trong service files
- URL tương đối `/api/v1/...` - không hardcode base URL

**Component Guidelines:**

- Lazy load: `loadComponent` + `canActivate: [authGuard]`
- Props validation (TypeScript)
- Accessibility first (semantic HTML, ARIA)
- Responsive design (mobile-first)

**Performance:**

- Code splitting
- Lazy loading
- Bundle size monitoring
- Lighthouse score ≥ 90

📖 **Chi tiết:** `vnr-plugin/standards/frontend.md`

---

### Mobile (Flutter/Dart)

**Architecture:** Clean Architecture (`data → domain → presentation`) + GetX (State, Route, DI)

📖 **Chi tiết đầy đủ:**

| Standard | Nội dung |
| -------- | -------- |
| `vnr-plugin/standards/mobile/01-vnr-app-ui-standards.md` | VnR widgets, theme, spacing, modal — banned patterns |
| `vnr-plugin/standards/mobile/02-architecture-and-structure.md` | Clean Arch layers, GetX patterns, Bindings, Controller+State |
| `vnr-plugin/standards/mobile/03-naming-conventions.md` | File/class/folder naming, usecase verbs, index barrel exports |

---

## 🔐 Security (Principle III)

- **Authentication**: JWT Bearer bắt buộc (trừ public endpoints có document)
- **Authorization**: `[CheckAccess]` hoặc `[CheckAccessBaseCRUD]` trên mọi action
- **Permission key**: `HRM_<MODULE>_<FEATURE>` - không tự ý đặt key
- **Input validation**: FluentValidation cho mọi Command
- **No mass assignment**: không expose Entity làm request body - dùng DTO
- **No hardcoded secrets**: keys, connection strings từ config/secrets
- **No sensitive logs**: không log password, token, PII
- **DevAuth guard**: dev/test bypass phải có `IsProduction` check

---

## 📏 Naming Conventions (Principle IV)

### Backend

| Item           | Pattern                                  | Ví dụ                |
| -------------- | ---------------------------------------- | -------------------- |
| Command        | `Create<Feature>Command`                 | `CreateIdpCommand`   |
| Handler        | `Create<Feature>Handler`                 | `CreateIdpHandler`   |
| Validator      | `Create<Feature>Validator`               | `CreateIdpValidator` |
| Query          | `List<Feature>Query`                     | `ListIdpQuery`       |
| Request DTO    | `Create<Feature>Request`                 | `CreateIdpRequest`   |
| Response DTO   | `<Feature>Dto`                           | `IdpDto`             |
| Permission key | `HRM_<MODULE>_<FEATURE>`                 | `HRM_SCC_IDP`        |
| Route          | `api/v{version:apiVersion}/[controller]` | `/api/v1/Idp`        |

### Frontend

| Item       | Pattern                            | Ví dụ                   |
| ---------- | ---------------------------------- | ----------------------- |
| Component  | `<feature>/<feature>.component.ts` | `idp/idp.component.ts`  |
| Service    | `api/<feature>.service.ts`         | `api/idp.service.ts`    |
| Model      | `models/<feature>.model.ts`        | `models/idp.model.ts`   |
| Route path | `kebab-case`                       | `/idp-commitments`      |
| Test file  | `<name>.component.spec.ts`         | `idp.component.spec.ts` |

---

## 📊 Quality Gates (Điều kiện bắt buộc)

| Gate                  | Điều kiện                                        |
| --------------------- | ------------------------------------------------ |
| **Plan → Tasks**      | `plan.md` được user approve                      |
| **Tasks → Implement** | `tasks.md` + test scenarios được user approve    |
| **Implement → Tests** | Build thành công (0 errors)                      |
| **Tests → Review**    | Unit tests 0 failures                            |
| **Review → Merge**    | Arch PASS + Security PASS + Code review approved |
| **Merge → Deploy**    | All tests pass + Documentation updated           |

---

## 📝 Documentation Requirements (Principle V)

- **plan.md** phải được duyệt trước khi implement
- **tasks.md** phải hoàn chỉnh (không để trống `Chi tiết`)
- **API contracts** (`api-commitments.md`) phải cập nhật khi thêm endpoint
- **`docs/raw/api-http-contracts.md`** phải được cập nhật
- **User guide** viết bằng tiếng Việt, hướng end-user không có kiến thức kỹ thuật
- **Report** phải có sign-off checklist đầy đủ trước khi tạo PR

---

## 🔀 Git & PR Workflow (Principle VI)

### Dual-Repo Structure

- `src/backend/` và `src/frontend/` là **2 git repositories riêng biệt**
- Branch naming: `feature/<feature-id>` (ví dụ: `feature/011-idp-commitments`)
- Tạo branch trong **cả 2 repo**:
  ```bash
  cd src/backend && git checkout -b feature/<id>
  cd ../frontend && git checkout -b feature/<id>
  ```

### Commit & PR

- Commit message: `feat(<feature>): <mô tả>` (Conventional Commits)
- PR riêng cho mỗi repo
- Không merge nếu:
  - Arch Review FAIL
  - Security Review FAIL
  - Unit test failures
  - Code review not approved
- Squash merge preferred

---

## 📊 Metrics & KPIs

### Code Quality

- Test coverage ≥ 80%
- Zero critical security vulnerabilities
- Code review approval required
- Linting pass rate = 100%

### Process Efficiency

- Spec → Code ≤ 3 days (small features)
- PR review time ≤ 24 hours
- Wiki sync delay ≤ 1 hour
- Build time ≤ 5 minutes

### Documentation

- All public APIs documented
- Wiki coverage ≥ 90%
- Zero broken documentation links
- Examples tested automatically

---

## 🤖 Agent-Specific Instructions

### For Planner Agent

1. **Đọc trước**: `docs/wiki/`, `specs/<feature>/spec.md`, `vnr-plugin/standards/`
2. **Research phase**: giải quyết "NEEDS CLARIFICATION" → `research.md`
3. **Data model**: Entity definitions → `data-model.md`
4. **API contracts**: Endpoints + DTOs → `contracts/api-commitments.md`
5. **Plan**: Phases breakdown → `plan.md`
6. **Tham chiếu Constitution**: đảm bảo tuân theo principles I-VI

### For Developer Agent

1. **Đọc**: `02-tasks.md`, technical standards, code templates
2. **Implement**: theo Clean Architecture / Micro-frontend patterns
3. **Tests**: ≥80% coverage
4. **Documentation**: inline comments, API docs
5. **Tuân theo**: naming conventions, security requirements

### For QA Agent

1. **Đọc**: `05-test-cases.md`, quality standards
2. **Execute**: all test cases, performance benchmarks
3. **Validate**: against spec requirements
4. **Report**: `99-result.md` với pass/fail status
5. **Gate check**: no critical bugs, docs updated

### For Documenter Agent

1. **Extract**: knowledge từ completed specs
2. **Update**: `docs/wiki/` (concepts, entities, flows)
3. **Generate**: API docs, architecture diagrams
4. **Sync**: changelog, ADRs
5. **Validate**: no broken links, examples tested

---

## ⚠️ Critical Rules - Không Exception

### General

1. ❌ **KHÔNG code trước khi có spec được approve**
2. ❌ **KHÔNG merge nếu tests fail hoặc coverage < 80%**
3. ❌ **KHÔNG skip code review**
4. ❌ **KHÔNG hardcode secrets, base URLs, permission keys ngoài convention**
5. ❌ **KHÔNG expose Entity trực tiếp - luôn dùng DTO**
6. ❌ **KHÔNG business logic trong Controller**
7. ❌ **KHÔNG import trực tiếp giữa các micro-frontend apps**
8. ❌ **KHÔNG log sensitive data (password, token, PII)**

### Mobile-Specific (Flutter/Dart)

9. ❌ **KHÔNG hardcode màu sắc, typography, spacing** — dùng `context.*` và `AppSpacing.*` / `AppRadius.*`
10. ❌ **KHÔNG tự tạo button/input/dropdown từ Material** — dùng `VnRButton`, `VnRInputText`, `VnRDropdown`
11. ❌ **KHÔNG dùng `withOpacity()`** — dùng `withValues(alpha: ...)`

📖 **Xem đầy đủ:** `vnr-plugin/standards/mobile/01-vnr-app-ui-standards.md`

---

## 📞 Reference Documents

**Đầy đủ:** [`/CONSTITUTION.md`](../../CONSTITUTION.md)  
**Standards:** `vnr-plugin/standards/[platform].md`  
**Templates:** `vnr-plugin/templates/`  
**Wiki:** `docs/wiki/`  
**Architecture:** `docs/raw/architecture/`

---

**Version:** 2.0  
**Last Updated:** 2026-04-14  
**Merged from:** `CONSTITUTION.md` (root) + `vnr-plugin/memory/constitution.md` (legacy)

---

> **Remember:** Documentation-first, Quality over speed, AI executes but Human decides.
