---
name: vnr-ba-specify  
description: 'Enhanced version of speckit.specify with BA context injection. Giữ nguyên 100% workflow gốc, bổ sung business context từ FEAT/EPIC/US để tránh scope creep và thiếu dữ liệu nghiệp vụ. Trigger: "speckit ba specify PBI-xxx"'
---

# speckit.ba-specify — BA-Enhanced Specification

## Mục đích

Tạo `spec.md` cho PBI **với đầy đủ business context** từ BA layer, trong khi **giữ nguyên 100%** workflow của `speckit.specify`.

## Khác gì với speckit.specify gốc?

| Aspect | speckit.specify | speckit.ba-specify |
|--------|-----------------|-------------------|
| **Core workflow** | 8 steps | **8 steps giống hệt** |
| **Input** | User description | User description **+ ba-context.md** |
| **Step 2 (Extract concepts)** | Chỉ từ description | **+ Entities, BR, Permissions từ FEAT** |
| **Step 4 (Generate spec)** | AI tự suy luận | **AI dùng FEAT constraints** |
| **Step 6 (Validation)** | Quality checklist | **+ BA compliance checks** |
| **Output** | spec.md | spec.md **+ BA Traceability section** |
| **Backward compatible** | N/A | ✅ Nếu không có ba-context, chạy như gốc |

## Khi nào dùng?

- ✅ PBI đã được tạo bởi `/ba-pbi-compose` → có file `ba-context.md`
- ✅ Muốn đảm bảo spec tuân thủ FEAT (entities, business rules, permissions)
- ✅ Tránh scope creep (AI thêm features không thuộc PBI)

**Nếu không có ba-context** → Tự động fallback về `speckit.specify` behavior.

## Workflow

Follow speckit.specify workflow exactly, with these enhancements injected at strategic points. See detailed implementation in the command file.
