---
name: VNR Project Constitution
version: "3.0"
description: >-
  Nguyên tắc cốt lõi, quy ước bắt buộc và quy trình làm việc.
  Tất cả agents phải tuân theo. Tech-specific rules nằm trong docs/wiki/.
---

# Project Constitution

> **Tài liệu này là governance root cho tất cả agents.**
> Tech stack, architecture patterns, coding conventions → đọc từ `docs/wiki/`.

---

## 🎯 Core Principles

### 1. Documentation-First Development
- Mọi tính năng bắt đầu từ tài liệu — không code trước khi có spec đầy đủ.
- AI agents sử dụng tài liệu làm **single source of truth**.

### 2. Spec-Driven Development
- Mỗi feature = 1 thư mục trong `specs/` với chu trình: `spec → plan → tasks → code → test → result`.
- Không merge code nếu thiếu: test cases, API docs, implementation summary.

### 3. AI-Human Collaboration
- **AI làm execution, Human làm decision.**
- Tất cả quyết định quan trọng phải được review bởi humans.

### 4. Quality Over Speed
- Mỗi PR phải qua: linting, manual testcases, code review, arch review, security review.
- Không skip steps trong workflow.

### 5. Knowledge Preservation
- Mọi thay đổi phải được document.
- Wiki (`docs/wiki/`) tự động cập nhật từ `docs/raw/` sau mỗi implement.

### 5b. Wiki Loading Contract (deterministic context)
- Conventions, rules và UI-component catalogs được load **deterministic** qua resolver, KHÔNG dựa trí nhớ:
  `node "$PLUGIN_DIR/scripts/resolve-context.mjs" --phase <plan|implement|review> --paths "<files>"` → đọc ĐẦY ĐỦ mọi file trả về.
- Constraint card được PreToolUse hook inject ở write-time (kể cả sau compaction) là **bắt buộc tuân theo** — đặc biệt UI: dùng custom component đúng stack, KHÔNG dùng native HTML controls.
- Plugin agnostic: mọi dữ liệu routing/stack nằm trong `docs/wiki/manifest.json` của project; không có manifest → resolver no-op → chạy như cũ.

### 6. Monorepo Strategy
- BE, FE, Mobile là **3 git repositories riêng biệt** nằm trong thư mục `src/`.
- Tên thư mục thực tế của mỗi repo được khai báo trong `docs/wiki/index.md` (tagged `architecture`) — đây là **source of truth**, không hardcode trong agents hay skills.
- Mọi thao tác git phải `cd` vào đúng thư mục repo trước khi chạy.

---

## 📁 Project Structure

```
project-root/
├── docs/
│   ├── raw/          # Source documents — IMMUTABLE
│   └── wiki/         # AI-generated wiki — single source of tech truth
│       ├── index.md  # ALWAYS read first — includes repo root paths for BE/FE/Mobile
│       ├── domains/  # Entities, workflows
│       ├── patterns/ # Architecture, runtime flows
│       ├── guides/   # How-to recipes
│       ├── rules/    # Coding standards, constraints
│       └── decisions/# ADRs
├── specs/
│   └── <US-ID>/      # spec.md + plan.md + tasks.md + testcases.md + result/
├── src/
│   ├── <BE-repo>/    # Backend — GIT REPO RIÊNG (tên thực tế khai báo trong wiki)
│   ├── <FE-repo>/    # Frontend — GIT REPO RIÊNG (tên thực tế khai báo trong wiki)
│   └── <Mobile-repo>/# Mobile — GIT REPO RIÊNG (tên thực tế khai báo trong wiki)
└── (vnr-swe plugin — installed via Claude Code; agents/, skills/, hooks/,
     memory/, templates/ live at ${CLAUDE_PLUGIN_ROOT}, not inside the project)
```

---

## 🔄 Development Phases

### Phase 1: Planning
**Input:** `specs/<US-ID>/spec.md` (BA output)
**Output:** `plan.md`, `data-model.md`, `contracts/`, `research.md`
**Gate:** Plan approved by human

### Phase 2: Development
**Input:** `tasks.md`
**Output:** Code + Tests
**Gate:** Tests ≥ 80% + Build PASS + No security vulns

### Phase 3: QA
**Input:** Pull requests
**Output:** Test reports + `result/testcase-report.md`
**Gate:** All testcases executed + No critical bugs

### Phase 4: Documentation
**Input:** Completed specs
**Output:** Updated wiki + final-report.md + user-guide.md
**Gate:** All APIs documented + Wiki synced

---

## 🔐 Security (Non-Negotiable)

- Authentication bắt buộc trên mọi endpoint (trừ public có document rõ ràng).
- Authorization check trên mọi action nhạy cảm.
- Permission key format: khớp convention trong `docs/wiki/` — không tự ý đặt.
- Không hardcode secrets, connection strings, base URLs.
- Không log sensitive data (password, token, PII).
- DevAuth bypass phải có environment guard.

---

## 📊 Quality Gates

| Gate | Điều kiện |
|------|----------|
| Plan → Plan Review | Automatic |
| **Plan Review → Tasks** | 🛑 `plan.md` được user approve |
| Tasks → Testcase | Automatic |
| Implement → Review | Build PASS (0 errors) |
| Review → Merge | Arch PASS + Security PASS + Code review approved |
| Merge → Deploy | All gates passed + Wiki synced |

---

## 📏 Naming Conventions

### General (language-agnostic)

| Item | Pattern | Example |
|------|---------|---------|
| Command | `Create<Feature>Command` | `CreateIdpCommand` |
| Handler | `Create<Feature>Handler` | `CreateIdpHandler` |
| Validator | `Create<Feature>Validator` | `CreateIdpValidator` |
| Query | `List<Feature>Query` | `ListIdpQuery` |
| Request DTO | `Create<Feature>Request` | `CreateIdpRequest` |
| Response DTO | `<Feature>Dto` | `IdpDto` |

> Language-specific naming patterns → `docs/wiki/rules/` (discover via index.md).

---

## ⚠️ Critical Rules — Không Exception

1. ❌ Không code trước khi có spec được approve.
2. ❌ Không merge nếu tests fail hoặc coverage < 80%.
3. ❌ Không skip code review.
4. ❌ Không hardcode secrets, base URLs.
5. ❌ Không expose Entity trực tiếp — luôn dùng DTO.
6. ❌ Không business logic trong Controller — chỉ gọi service.
7. ❌ Không import trực tiếp giữa các micro-frontend apps.
8. ❌ Không log sensitive data (password, token, PII).

> Tech-stack-specific rules (framework components, widget libraries, patterns) → `docs/wiki/rules/`.

---

## 🤖 Agent-Specific Instructions

### For Planner Agent
1. Đọc `docs/wiki/index.md` → entities, concepts, workflows liên quan.
2. Research phase: giải quyết "NEEDS CLARIFICATION" → `research.md`.
3. Data model → `data-model.md`; API contracts → `contracts/`; Plan → `plan.md`.
4. Tham chiếu Constitution — đảm bảo tuân theo principles 1–6.
5. Dừng và chờ Plan Review sau khi xong.

### For Developer Agent
1. Đọc `docs/wiki/index.md` → discover tech patterns, how-to guides, rules.
2. Implement theo `tasks.md` — đúng thứ tự, đúng file path.
3. Tests ≥ 80% coverage. Build PASS trước khi bàn giao.
4. Wiki-discovery: `standard`/`convention`/`recipe` entries → project-specific patterns.

### For QA Agent
1. Đọc `testcases.md` + wiki business context.
2. Execute testcases; record actual results.
3. Gate check: no critical bugs, docs updated.

### For Documenter Agent
1. Đọc wiki để hiểu business context.
2. Sinh `final-report.md` + `user-guide.md`.
3. Sync wiki sau implement: `vnr-wiki-sync`.

---

## 🔀 Git & PR Workflow

- Branch naming: `feature/<feature-id>`
- Commit: `feat(<feature>): <mô tả>` (Conventional Commits)
- PR riêng cho mỗi repo (BE repo, FE repo, Mobile repo — tên thực tế từ wiki).
- Không merge nếu: Arch Review FAIL, Security Review FAIL, Unit test failure.

---

**Version:** 3.0 | **Updated:** 2026-06-10
