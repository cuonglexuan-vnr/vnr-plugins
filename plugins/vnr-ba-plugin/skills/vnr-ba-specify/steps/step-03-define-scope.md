# Step 03 — Define Scope Boundaries

## Mục tiêu

**Xác định rõ ràng scope của PBI này** để tránh:
- ❌ **Scope creep**: AI thêm features không thuộc PBI
- ❌ **Ambiguity**: Dev không rõ ranh giới với PBIs khác
- ❌ **Overlap**: Features bị implement trùng lặp giữa các PBIs

---

## Hành động 1: Load scope boundaries từ ba-context

**Từ ba-context.scope_boundaries:**

```python
scope = ba_context.scope_boundaries

scope_includes = scope.includes  # List: Features this PBI MUST implement
scope_excludes = scope.excludes  # List: Features this PBI MUST NOT implement
shared_concerns = scope.shared_concerns  # List: Components shared với related PBIs
```

---

## Hành động 2: Analyze scope includes (What THIS PBI must do)

```markdown
╔══ SCOPE INCLUDES (MUST IMPLEMENT) ════════════════════╗
║
{for item in scope_includes:
║ ✓ {item.feature}
║   Rationale: {item.rationale}
║   Acceptance: {item.acceptance_criteria_id}
}
║
╚════════════════════════════════════════════════════════╝

**AI Instruction**: The spec MUST include all features above.
If any is missing, the spec is INCOMPLETE.
```

**Example**:

```
✓ Tab navigation component (3 tabs: Overview, Plan, Commitments)
  Rationale: This is the shell for related PBIs (tab1/tab2/tab3)
  Acceptance: AC5 from US IDP-E1-F2-U5

✓ Tab 1 "Overview" content (IDP summary + progress + timeline)
  Rationale: This PBI owns Tab 1 content
  Acceptance: AC2, AC3, AC4 from US IDP-E1-F2-U5

✓ IDP data loading service (shared with tab2/tab3)
  Rationale: Single source of truth for IDP data
  Acceptance: AC1 from US IDP-E1-F2-U5
```

---

## Hành động 3: Analyze scope excludes (What THIS PBI must NOT do)

```markdown
╔══ SCOPE EXCLUDES (MUST NOT IMPLEMENT) ════════════════╗
║
{for item in scope_excludes:
║ ✗ {item.feature}
║   Owner: {item.owner_pbi}
║   Reason: {item.reason}
}
║
╚════════════════════════════════════════════════════════╝

**AI Instruction**: The spec MUST NOT include features above.
If any is present, the spec has SCOPE CREEP (reject).

**Warning system**: If user description mentions excluded features,
the AI must:
1. Recognize it as out-of-scope
2. Warn user
3. Remove from spec
4. Suggest correct PBI
```

**Example**:

```
✗ Tab 2 "Development Plan" content (goal list)
  Owner: PBI-IDP-E1-F2-U5-tab2
  Reason: Vertical split — each tab is separate PBI

✗ Tab 3 "Commitments" content (multi-section form)
  Owner: PBI-IDP-E1-F2-U5-tab3
  Reason: Vertical split

✗ Edit IDP functionality (edit button, save, validation)
  Owner: PBI-IDP-E1-F2-U6
  Reason: Separate US — this PBI is read-only view

✗ Manager approval workflow (approve button, status change)
  Owner: PBI-IDP-E1-F3-U2
  Reason: Different FEAT — this is viewing, not approving
```

---

## Hành động 4: Analyze shared concerns (Coordinate với related PBIs)

**Purpose**: Identify components mà nhiều PBIs cùng dùng → cần define contracts.

```markdown
╔══ SHARED CONCERNS (COORDINATE) ═══════════════════════╗
║
{for concern in shared_concerns:
║ 🔗 {concern.component}
║    Owner PBI: {concern.owner_pbi}
║    Consumer PBIs: {', '.join(concern.consumer_pbis)}
║    Strategy: {concern.strategy}
║    Interface: {concern.interface_contract}
}
║
╚════════════════════════════════════════════════════════╝

**AI Instruction**:
For each shared concern:
1. If THIS PBI is owner → spec must define the component + interface
2. If THIS PBI is consumer → spec must reference owner's interface
3. Include integration test scenario với owner/consumers
```

**Example**:

```
🔗 Tab Navigation Component
   Owner PBI: PBI-IDP-E1-F2-U5-tab1 (THIS PBI)
   Consumer PBIs: PBI-...-tab2, PBI-...-tab3
   Strategy: Owner implements, consumers import
   Interface:
     - Component: <idp-detail-tabs>
     - Props: activeTab, onTabChange
     - Emits: tab-changed(tabId)

🔗 IDP Data Service
   Owner PBI: PBI-IDP-E1-F2-U5-tab1 (THIS PBI)
   Consumer PBIs: PBI-...-tab2, PBI-...-tab3
   Strategy: Owner implements service, consumers inject
   Interface:
     - Service: IdpDataService
     - Methods: loadIDP(id), getIDP(), refreshIDP()
     - Observable: idp$ (BehaviorSubject)

🔗 Permission Service
   Owner PBI: PBI-IDP-E1-F1-U1 (Foundation)
   Consumer PBIs: THIS PBI + all IDP PBIs
   Strategy: All PBIs consume (foundation implemented first)
   Interface:
     - Service: IdpPermissionService
     - Methods: canEdit(idp), canApprove(idp), canView(idp)
```

**Action for spec**:

```markdown
For owner responsibilities:
- Spec must include:
  - Component/service definition
  - Interface contract (inputs, outputs, methods)
  - Usage example for consumers
  - Integration test with 1 consumer PBI

For consumer responsibilities:
- Spec must include:
  - Reference to owner PBI
  - Import/injection code
  - Usage of interface
  - Integration test with owner PBI
```

---

## Hành động 5: Check for scope violations in user description

**If user provided description** (e.g., "PBI-xxx: Create IDP detail with edit and approval"):

```python
user_description = get_user_description_from_args()

if user_description:
    # Parse features mentioned in description
    mentioned_features = extract_features_from_description(user_description)
    
    # Check against scope_excludes
    violations = []
    for feature in mentioned_features:
        if is_in_scope_excludes(feature, scope_excludes):
            excluded_item = find_exclude_item(feature, scope_excludes)
            violations.append({
                "feature": feature,
                "owner_pbi": excluded_item.owner_pbi,
                "reason": excluded_item.reason
            })
    
    if violations:
        WARN(f"""
⚠️  SCOPE VIOLATION DETECTED in user description

User description: "{user_description}"

The following features are OUT OF SCOPE for this PBI:
{for v in violations:
  - "{v.feature}"
    → This belongs to: {v.owner_pbi}
    → Reason: {v.reason}
}

**Action**:
1. These features will be REMOVED from the generated spec
2. User description will be FILTERED to match scope
3. Suggested correction: "{generate_corrected_description(user_description, violations)}"

Continue? (yes/edit description)
""")
        
        user_choice = await_user_input()
        
        if user_choice.lower() == "edit description":
            new_description = await_user_input("Enter corrected description:")
            update_user_description(new_description)
```

---

## Hành động 6: Map scope to US Acceptance Criteria

**Purpose**: Đảm bảo scope mapping chính xác với US AC.

```python
ac_this_pbi = ba_context.ac_mapping.this_pbi_covers
ac_other_pbis = ba_context.ac_mapping.other_pbi_covers

print("""
╔══ ACCEPTANCE CRITERIA MAPPING ════════════════════════╗
║
║ This PBI COVERS ({len(ac_this_pbi)} AC):
{for ac_id in ac_this_pbi:
  ac = load_ac(ac_id)
║   ✓ {ac_id}: {ac.description}
}
║
║ Other PBIs COVER ({len(ac_other_pbis)} AC):
{for ac_id, owner_pbi in ac_other_pbis.items():
  ac = load_ac(ac_id)
║   ✗ {ac_id}: {ac.description}
║      → Owned by: {owner_pbi}
}
║
╚════════════════════════════════════════════════════════╝

**AI Instruction**: The spec must include user stories/scenarios that cover
the {len(ac_this_pbi)} AC marked with ✓ above.

If spec covers any AC marked with ✗, that is SCOPE CREEP.
""")
```

---

## Hành động 7: Generate scope definition document

**Create internal "Scope Definition" để inject vào AI prompt:**

```markdown
# Scope Definition (Internal - for AI)

## MUST Implement (Features)

{for item in scope_includes:
### {item.feature}

**Description**: {item.description}

**Rationale**: {item.rationale}

**Acceptance**: Must satisfy {item.acceptance_criteria_id}

**Success metric**: {item.success_metric}
}

## MUST NOT Implement (Out of Scope)

{for item in scope_excludes:
### {item.feature}

**Reason**: {item.reason}

**Owner**: {item.owner_pbi}

**If mentioned**: Warn user, remove from spec, suggest {item.owner_pbi}
}

## Shared Concerns (Coordination)

{for concern in shared_concerns:
### {concern.component}

**Type**: {concern.type} (Owner/Consumer)

**If Owner** (this PBI implements):
- Define component: {concern.interface_contract}
- Provide usage docs for consumers: {concern.consumer_pbis}
- Include integration test

**If Consumer** (this PBI uses):
- Import from: {concern.owner_pbi}
- Follow interface: {concern.interface_contract}
- Include integration test

**Strategy**: {concern.strategy}
}

## Acceptance Criteria Coverage

**This PBI must cover**:
{for ac_id in ac_this_pbi:
- {ac_id}: {load_ac(ac_id).description}
}

**This PBI must NOT cover**:
{for ac_id in ac_other_pbis:
- {ac_id}: {load_ac(ac_id).description} (owned by {ac_other_pbis[ac_id]})
}

---

**Scope Validation Rules** (AI must enforce):

1. **Include Rule**: Every feature in "MUST Implement" → FR in spec
2. **Exclude Rule**: No feature in "MUST NOT Implement" → FR in spec
3. **AC Coverage Rule**: All AC in "must cover" → scenarios in spec
4. **AC Exclusion Rule**: No AC in "must NOT cover" → scenarios in spec
5. **Shared Concern Rule**: All shared concerns → documented in spec

If ANY rule violated → spec has SCOPE ERROR.
```

**Lưu vào memory** để dùng ở Step 04 (generate spec).

---

## Kết quả đầu ra Step 03

**Scope boundaries defined:**
- ✅ MUST implement features identified
- ✅ MUST NOT implement features identified
- ✅ Shared concerns analyzed (owner vs consumer)
- ✅ AC mapping validated
- ✅ User description checked for violations
- ✅ Scope definition document ready

**Scope Definition**: ready to inject vào AI prompt

**Chuyển sang**: `./steps/step-04-generate-spec.md`
