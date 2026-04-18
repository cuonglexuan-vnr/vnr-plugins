# Step 01 — Load BA Context

## Mục tiêu

Load và validate file `ba-context.md` để đảm bảo có đầy đủ business context trước khi generate spec.

---

## Hành động 1: Parse input arguments

**Input format**: `PBI-{ID}` hoặc `PBI-{ID}: {description}`

Ví dụ:
- `PBI-IDP-E1-F2-U1`
- `PBI-IDP-E1-F2-U1: Create IDP screen`

**Extract**:
- `pbi_id`: PBI-IDP-E1-F2-U1
- `user_description` (optional): Create IDP screen

---

## Hành động 2: Locate ba-context.md

```bash
ba_context_path = "specs/{pbi_id}/ba-context.md"
```

**Check file existence:**

```
if not exists(ba_context_path):
    ERROR: "❌ ba-context.md not found for {pbi_id}"
    
    SUGGEST:
    "This PBI has not been prepared by BA layer.
    
    Options:
    1. If this PBI was created by /vnr-ba-pbi-compose, check path: {ba_context_path}
    2. If BA hasn't run /vnr-ba-pbi-compose yet, ask BA to run it first
    3. If this is a greenfield project (no BA layer), use /speckit.specify instead
    
    Path checked: {ba_context_path}"
    
    STOP execution
```

---

## Hành động 3: Load và parse ba-context.md

**Read file:**

```python
ba_context_raw = read_file(ba_context_path)
ba_context = parse_markdown_with_yaml_frontmatter(ba_context_raw)
```

**Expected structure** (validate presence):

```yaml
# Frontmatter
pbi_id: PBI-xxx
created: YYYY-MM-DD
source_layer: BA
version: 1.0

# Required sections
- Source Traceability
  - Module, EPIC, FEAT, Source US
- Mapping Pattern
  - Pattern (A/B/C), Part info
- Inherited Context from FEAT/EPIC
  - Entities
  - Business Rules
  - Actor-Task Matrix
  - Validation Rules
- Scope Boundaries
  - Includes, Excludes, Shared Concerns
- Acceptance Criteria Mapping
- UI/UX Context (optional)
- Business Flow Context (optional)
- Compliance Requirements (optional)
- Open Questions (optional)
```

**Validation**:

```python
required_sections = [
    "Source Traceability",
    "Mapping Pattern",
    "Inherited Context",
    "Scope Boundaries",
    "Acceptance Criteria Mapping"
]

for section in required_sections:
    if section not in ba_context:
        ERROR(f"ba-context.md is incomplete: missing section '{section}'")
        SUGGEST("Ask BA to re-run /vnr-ba-pbi-compose to regenerate ba-context.md")
        STOP
```

---

## Hành động 4: Check FEAT freshness (detect stale context)

**Purpose**: Cảnh báo nếu FEAT đã thay đổi sau khi ba-context được tạo.

```python
feat_file_path = ba_context.feat_path
ba_context_created = ba_context.metadata.created

feat_last_modified = get_file_mtime(feat_file_path)

if feat_last_modified > ba_context_created:
    age_hours = (feat_last_modified - ba_context_created).total_hours()
    
    WARN(f"""
⚠️  FEAT has been modified {age_hours:.1f} hours after ba-context was generated.

FEAT: {feat_file_path}
  - Last modified: {feat_last_modified}

ba-context.md:
  - Generated: {ba_context_created}
  - Age: {age_hours:.1f} hours behind FEAT

**Risk**: ba-context may be outdated (stale entities, rules, permissions).

**Recommended action**:
1. Run /speckit.ba-sync --detect to check what changed
2. Run /speckit.ba-sync --update {ba_context.feat_id} to refresh

Do you want to proceed anyway? (yes/no)
""")
    
    user_choice = await_user_input()
    
    if user_choice.lower() not in ["yes", "y", "proceed", "continue"]:
        STOP("Stopped by user. Please sync ba-context first.")
```

---

## Hành động 5: Extract key context elements

**From ba-context.md, extract và ghi nhớ:**

```python
# Traceability
module_id = ba_context.module.id
epic_id = ba_context.epic.id
feat_id = ba_context.feat.id
source_us_ids = ba_context.source_us  # May be multiple (pattern A)

# Mapping
mapping_pattern = ba_context.mapping_pattern  # A / B / C
part_info = ba_context.part_info  # "1 of 3" or None
related_pbis = ba_context.related_pbis  # Other PBIs from same US

# Business context
entities = ba_context.entities  # Dict: {entity_name: schema}
business_rules = ba_context.business_rules  # List: [BR-F001, BR-F002, ...]
actor_task_matrix = ba_context.actor_task_matrix  # Dict: {actor: [tasks]}
validation_rules = ba_context.validation_rules  # Dict: {entity.field: rule}

# Scope
scope_includes = ba_context.scope.includes  # List of features this PBI MUST have
scope_excludes = ba_context.scope.excludes  # List of features this PBI MUST NOT have
shared_concerns = ba_context.scope.shared_concerns  # Components shared với related PBIs

# Acceptance Criteria
ac_this_pbi = ba_context.ac_mapping.this_pbi_covers  # AC IDs this PBI covers
ac_other_pbis = ba_context.ac_mapping.other_pbi_covers  # AC IDs owned by other PBIs

# Optional
ui_context = ba_context.ui_ux_context if exists else None
business_flow = ba_context.business_flow_context if exists else None
compliance = ba_context.compliance_requirements if exists else []
open_questions = ba_context.open_questions if exists else []
```

---

## Hành động 6: Display context summary (for user confirmation)

```
╔══ BA CONTEXT LOADED ═════════════════════════════════════╗
║ PBI ID      : {pbi_id}
║ Source US   : {', '.join(source_us_ids)}
║ FEAT        : {feat_id} — {feat_name}
║ EPIC        : {epic_id} — {epic_name}
║ Module      : {module_id}
║ Pattern     : {mapping_pattern}
{if part_info:
║ Part        : {part_info}
║ Related PBIs: {', '.join(related_pbis)}
}
║
║ Entities    : {len(entities)} (inherited from FEAT)
║   {list_entity_names(entities)}
║
║ Business Rules: {len(business_rules)}
║   {list_br_ids(business_rules)}
║
║ Actors      : {len(actor_task_matrix)}
║   {list_actors(actor_task_matrix)}
║
║ Scope Includes: {len(scope_includes)} features
║ Scope Excludes: {len(scope_excludes)} features
║ Shared Concerns: {len(shared_concerns)} components
║
║ AC Coverage : {len(ac_this_pbi)} AC from source US
║ Compliance  : {len(compliance)} requirements
║ Open Questions: {len(open_questions)}
║
║ ba-context version: {ba_context.version}
║ Generated: {ba_context.metadata.created}
╚═══════════════════════════════════════════════════════════╝

ℹ️  This context will be injected into spec generation to ensure:
   - Entities match FEAT (no redefinition)
   - Business rules reference FEAT (no new rules)
   - Permissions follow Actor-Task Matrix
   - Scope boundaries are enforced

Proceed to business analysis? (yes/continue)
```

**Wait for user confirmation.**

---

## Kết quả đầu ra Step 01

**Context loaded và validated:**
- ✅ ba-context.md exists và complete
- ✅ FEAT freshness checked (warned if stale)
- ✅ Key elements extracted
- ✅ User confirmed context

**Chuyển sang**: `./steps/step-02-understand-business.md`
