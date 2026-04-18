## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

---

## Pre-Execution: BA Context Detection

**BEFORE running the standard workflow**, check for BA context:

```bash
# Extract PBI ID from arguments (pattern: "PBI-xxx" or "PBI-xxx: description")
pbi_id=$(echo "$ARGUMENTS" | grep -oP 'PBI-[A-Z0-9-]+' | head -1)

if [ -n "$pbi_id" ]; then
    ba_context_path="specs/$pbi_id/ba-context.md"
    
    if [ -f "$ba_context_path" ]; then
        echo "ℹ️  BA context detected: $ba_context_path"
        echo "   Mode: BA-Enhanced (will inject FEAT constraints)"
        BA_MODE=true
        # Load ba-context for later use
        ba_context=$(cat "$ba_context_path")
    else
        echo "ℹ️  No BA context at: $ba_context_path"
        echo "   Mode: Greenfield (standard speckit.specify)"
        BA_MODE=false
    fi
else
    echo "ℹ️  No PBI ID detected in arguments"
    echo "   Mode: Greenfield (standard speckit.specify)"
    BA_MODE=false
fi
```

**If BA_MODE = true**, extract từ ba-context.md:
- `entities` — Entity schemas từ FEAT
- `business_rules` — BR-F rules từ FEAT
- `actor_task_matrix` — Permissions từ FEAT
- `validation_rules` — Field validation rules
- `scope_boundaries` — Includes/excludes
- `compliance_requirements` — GDPR, audit, etc.

**If BA_MODE = false**, proceed với standard workflow (no enhancements).

---

## Standard Workflow (from speckit.specify)

**Follow `speckit.specify.md` workflow exactly**, với các enhancements sau (ONLY if BA_MODE = true):

---

### Enhancement Point 1: Step 2 (Extract key concepts)

**Original**:
```
2. Extract key concepts from description
   Identify: actors, actions, data, constraints
```

**Enhanced** (if BA_MODE = true):

```
2. Extract key concepts from description + BA context

From user description:
- Identify: actors, actions, data, constraints

FROM BA CONTEXT (mandatory constraints):

Entities (from FEAT):
{for entity_name, schema in ba_context.entities:
  - {entity_name}: {list(schema.keys())}
}
→ USE THESE EXACT SCHEMAS in spec, DO NOT redefine

Business Rules (from FEAT):
{for br_id in ba_context.business_rules:
  - {br_id}: {br.description}
}
→ REFERENCE these IDs in spec, DO NOT create new rules

Actors & Permissions (from FEAT Actor-Task Matrix):
{for actor in ba_context.actor_task_matrix:
  - {actor}: Can {allowed_tasks} | Cannot {forbidden_tasks}
}
→ ENFORCE this matrix, DO NOT grant unauthorized permissions

Scope Boundaries:
- MUST include: {ba_context.scope.includes}
- MUST NOT include: {ba_context.scope.excludes}
→ If description mentions excluded features, REMOVE them

Validation Rules (from FEAT):
{for entity.field, rule in ba_context.validation_rules:
  - {entity}.{field}: {rule}
}
→ APPLY these exact rules, DO NOT invent new ones

{if ba_context.compliance_requirements:
Compliance Requirements:
{for item in ba_context.compliance_requirements:
  - {item.id}: {item.requirement}
}
→ MUST address in spec
}
```

---

### Enhancement Point 2: Step 4 Sub-step 2 (Extract key concepts — AI prompt injection)

**Original AI prompt construction**:
```
Generate spec from: {$ARGUMENTS}
Template: {spec_template}
```

**Enhanced AI prompt** (if BA_MODE = true):

**PREPEND to AI prompt**:

```markdown
═══════════════════════════════════════════════════════════
BUSINESS CONSTRAINTS (MANDATORY - FROM FEAT/EPIC)
═══════════════════════════════════════════════════════════

You are generating a spec for **PBI {pbi_id}**, part of a BA-managed project.

The following constraints are MANDATORY from FEAT {ba_context.feat_id}:

## 1. Entity Schemas (DO NOT REDEFINE)

```yaml
{yaml_dump(ba_context.entities)}
```

**Rules**:
- Use format in spec: "**{EntityName}** [Inherited from FEAT {feat_id}]"
- List fields exactly as above
- DO NOT add new fields → mark [NEEDS CLARIFICATION: Field X not in FEAT]
- DO NOT change types

## 2. Business Rules (REFERENCE ONLY)

{for br_id, br in ba_context.business_rules:
- **{br_id}**: {br.description}
}

**Rules**:
- Format: "BR-U001: {description} [Specializes {BR-F-ID}]"
- DO NOT create new BR without FEAT reference
- Only add PBI-specific specializations

## 3. Actor Permissions (STRICT ENFORCEMENT)

| Actor | Allowed Tasks | Forbidden Tasks |
|-------|---------------|-----------------|
{for actor in ba_context.actor_task_matrix:
| {actor} | {allowed} | {forbidden} |
}

**Rules**:
- ONLY grant permissions in "Allowed Tasks"
- DO NOT create new actors
- If need new permission → mark [NEEDS CLARIFICATION: Permission not in FEAT]

## 4. Validation Rules (EXACT APPLICATION)

{for entity, field, rule in ba_context.validation_rules:
- **{entity}.{field}**: {rule}
}

**Rules**:
- Apply to Functional Requirements
- DO NOT create conflicting rules
- If need different rule → mark [NEEDS CLARIFICATION: Validation conflict]

## 5. Scope Boundaries (NO VIOLATIONS)

**MUST include**:
{for item in ba_context.scope.includes:
- {item.feature} (Rationale: {item.rationale})
}

**MUST NOT include**:
{for item in ba_context.scope.excludes:
- {item.feature} → Belongs to: {item.owner_pbi}
}

**Rules**:
- If user description mentions excluded feature → REMOVE from spec
- Add note: "Feature {X} out of scope (see {owner_pbi})"
- All "MUST include" features → Functional Requirements

{if ba_context.compliance_requirements:
## 6. Compliance (CRITICAL)

{for item in ba_context.compliance_requirements:
- **{item.id}**: {item.requirement}
  Verification: {item.verification}
}

**Rules**:
- Include compliance section in spec
- Each requirement → specific implementation note
}

═══════════════════════════════════════════════════════════
END BUSINESS CONSTRAINTS
═══════════════════════════════════════════════════════════

Now generate the spec using the standard template, but **STRICTLY ADHERE** to constraints above.

User description: {$ARGUMENTS}
```

**Result**: AI receives FEAT constraints BEFORE user description → spec respects BA context.

---

### Enhancement Point 3: Step 6 (Validation) — Add BA Compliance Checks

**Original**: Generate `checklists/requirements.md` with quality checks

**Enhanced** (if BA_MODE = true):

**Add section to checklist**:

```markdown
## BA Compliance

- [ ] All entities match FEAT schemas (no added/removed fields, no type changes)
- [ ] All business rules reference FEAT (format: "Specializes BR-F-XXX")
- [ ] Actor permissions follow Actor-Task Matrix exactly
- [ ] Validation rules match FEAT (no conflicts)
- [ ] Scope includes all required features
- [ ] Scope excludes no forbidden features
- [ ] Compliance requirements addressed (if applicable)
- [ ] No [NEEDS CLARIFICATION] for questions already answered in ba-context
```

**Inline validation** (print warnings, không block):

```python
if BA_MODE:
    warnings = []
    
    # Validate entity schemas
    spec_entities = extract_entities_from_spec(spec)
    for entity_name, spec_schema in spec_entities.items():
        feat_schema = ba_context.entities.get(entity_name)
        if not feat_schema:
            warnings.append(f"⚠️  Entity '{entity_name}' not defined in FEAT")
        else:
            for field_name in spec_schema.keys():
                if field_name not in feat_schema:
                    warnings.append(f"⚠️  Field '{entity_name}.{field_name}' not in FEAT schema")
    
    # Validate business rules
    spec_brs = extract_business_rules_from_spec(spec)
    for br_id, br_text in spec_brs.items():
        if not re.search(r'\[Specializes BR-F-\d+\]', br_text):
            warnings.append(f"⚠️  Business rule {br_id} does not reference FEAT")
    
    # Validate scope
    spec_features = extract_features_from_spec(spec)
    for excluded in ba_context.scope.excludes:
        if excluded.feature in spec_features:
            warnings.append(f"⚠️  SCOPE VIOLATION: '{excluded.feature}' should not be in spec (belongs to {excluded.owner_pbi})")
    
    # Print warnings
    if warnings:
        print(f"""
╔══ BA COMPLIANCE WARNINGS ══════════════════════════════════╗
║
║ {len(warnings)} warnings detected:
║
{for w in warnings[:10]:
║ {w}
}
{if len(warnings) > 10:
║ ... and {len(warnings) - 10} more
}
║
╚════════════════════════════════════════════════════════════╝

These are WARNINGS, not blocking errors.
The spec was generated, but may need review.

Run /speckit.ba-validate for full compliance report (17 validation rules).
""")
```

---

### Enhancement Point 4: Post-Step 5 — Inject BA Traceability Section

**After writing spec to SPEC_FILE**:

If BA_MODE = true, inject section sau frontmatter:

```markdown
## BA Traceability

This PBI inherits business context from:

- **Source US**: [{ba_context.source_us_id}]({ba_context.source_us_path}) — {ba_context.source_us_name}
- **FEAT**: [{ba_context.feat_id}]({ba_context.feat_path}) — {ba_context.feat_name}
- **EPIC**: [{ba_context.epic_id}]({ba_context.epic_path}) — {ba_context.epic_name}
- **Module**: {ba_context.module_id} — {ba_context.module_name}
- **Mapping Pattern**: {ba_context.mapping_pattern} ({ba_context.mapping_pattern_description})
{if ba_context.part_info:
- **Part**: {ba_context.part_info}
- **Related PBIs**: {join(ba_context.related_pbis, ', ')}
}
- **BA Context**: v{ba_context.version}, generated {ba_context.metadata.created}

**Constraints Applied**:
- ✅ {len(ba_context.entities)} entities inherited from FEAT
- ✅ {len(ba_context.business_rules)} business rules referenced
- ✅ {len(ba_context.actor_task_matrix)} actors with enforced permissions
- ✅ {len(ba_context.validation_rules)} validation rules applied
- ✅ Scope: {len(ba_context.scope.includes)} required features, {len(ba_context.scope.excludes)} excluded features
{if ba_context.compliance_requirements:
- ✅ {len(ba_context.compliance_requirements)} compliance requirements
}

> ⚠️  **Note**: This spec is constrained by FEAT definitions.  
> Changes to entities, business rules, or permissions require BA approval via FEAT update.

---
```

**Inject location**: After frontmatter, before "## User Scenarios & Testing"

---

### Enhancement Point 5: Step 7 (Report) — Enhanced Output

**Original report**:
```
✅ Spec created
Branch: {branch_name}
Spec: {spec_path}
Checklist: {checklist_path}
Next: /speckit.clarify or /speckit.plan
```

**Enhanced report** (if BA_MODE = true):

```
✅ Spec created with BA context

📄 Files:
   - Spec: {spec_path}
   - BA Context: {ba_context_path}
   - Checklist: {checklist_path}

📊 BA Context Applied:
   - Module: {ba_context.module_id}
   - FEAT: {ba_context.feat_id} ({ba_context.feat_name})
   - Source US: {ba_context.source_us_id}
   - Entities: {len(ba_context.entities)} inherited
   - Business Rules: {len(ba_context.business_rules)} referenced
   - Actors: {len(ba_context.actor_task_matrix)} with permissions
   - Validation Rules: {len(ba_context.validation_rules)}
   {if ba_context.compliance_requirements:
   - Compliance: {len(ba_context.compliance_requirements)} requirements
   }

{if warnings:
⚠️  BA Compliance Warnings: {len(warnings)}
   (See details above. Recommend running /speckit.ba-validate for full report.)
}

✅ Quality Checklist: {checklist_result}

⏭  Next Steps:
   1. Review spec.md for accuracy
   {if warnings:
   2. (Optional) Run /speckit.ba-validate for full BA compliance check
   }
   {if needs_clarification_count > 0:
   3. Run /speckit.clarify to resolve {needs_clarification_count} [NEEDS CLARIFICATION] markers
   }
   4. Proceed to /speckit.plan
```

---

## Full Workflow Summary

| Step | Standard speckit.specify | BA Enhancement (if BA_MODE = true) |
|------|--------------------------|-------------------------------------|
| Pre | Check hooks | **+ Load ba-context.md, set BA_MODE** |
| 1 | Generate short name | (no change) |
| 2 | **Extract key concepts** | **+ Load entities, BR, permissions, scope từ FEAT** |
| 3 | Load template | (no change) |
| 4 | **Generate spec** | **+ Prepend BA constraints to AI prompt** |
| 5 | Write to SPEC_FILE | **+ Inject BA Traceability section** |
| 6 | **Validation + checklist** | **+ BA compliance checklist items + inline warnings** |
| 7 | **Report completion** | **+ Report BA context stats, warnings** |
| 8 | Check hooks | (no change) |

**Total enhancements**: 5 injection points  
**Workflow changes**: 0 (100% preserved)

---

## Backward Compatibility

✅ **Auto-fallback**: Nếu không detect được ba-context.md → chạy như `speckit.specify` gốc  
✅ **No breaking changes**: Tất cả output files, scripts, hooks đều giống nhau  
✅ **Additive only**: Chỉ THÊM sections/checks, không XÓA hoặc SỬA logic gốc

---

## Usage Examples

```bash
# BA-managed PBI (has ba-context.md)
/speckit.ba-specify PBI-IDP-E1-F2-U1: Create IDP detail screen
→ Detects specs/PBI-IDP-E1-F2-U1/ba-context.md
→ Mode: BA-Enhanced
→ Injects FEAT constraints

# Greenfield project (no ba-context)
/speckit.ba-specify: Add user authentication
→ No ba-context.md found
→ Mode: Greenfield
→ Behaves exactly like speckit.specify
```

**Auto-detection**: Command tự động detect và switch mode.
