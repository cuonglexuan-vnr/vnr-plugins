---
description: Use this skill to retrieve the correct VNR codebase context before analyzing, planning, or implementing changes.
---

## MCP Servers
Prefer these MCP servers based on the task scope:

1. **Frontend**  
   Use for Angular micro-frontends, shared Angular libraries, Module Federation shell/remotes, NG-Zorro UI, Kendo UI grid integration, NgRx, routing, auth, and frontend resources under `./Frontend/`

2. **HRM9**  
   Use for the full backend source tree under `./HRM9/Main/Source/`, including Business, Data, Infrastructure, Presentation, Projects, Tests, and UnitTest

3. **Business**  
   Use for business/domain logic in `HRM9/Main/Source/Business/`, including `HRM.Business.<Module>.Domain` and `HRM.Business.<Module>.Models` projects

4. **Projects**  
   Use for the newer backend area under `HRM9/Main/Source/Projects/`, including Service Center modules, .NET 7 services, API gateway, identity service, and SC.NetCore base framework

5. **Infrastructure**  
   Use for cross-cutting backend concerns in `HRM9/Main/Source/Infrastructure/`, such as logging, security, middleware, storage, utilities, and calculation engine

**Repository hints:**
- Backend / EF / SPs: prefer `./HRM9/Main/Source/`
- Frontend: prefer `./Frontend/`

## Selection Rules
- If the task is **Angular UI / micro-frontend / shared frontend component**, use **Frontend** first
- If the task spans multiple backend layers or the exact backend location is unclear, use **HRM9** first
- If the task is **domain service / feature logic / DTO model**, use **Business**
- If the task is **new backend / Service Center / .NET 7 service / gateway / identity**, use **Projects**
- If the task is **auth, logging, middleware, storage, utilities, or shared backend technical concerns**, use **Infrastructure**

## Important Context
- Backend is primarily ASP.NET .NET Framework 4.6.2 with EF6 database-first; do not assume code-first migrations
- Frontend is separated from Admin MVC and implemented as Angular micro-frontends; keep frontend and legacy MVC concerns isolated
- New work should follow: **Specify → Plan → Tasks → Implement**
