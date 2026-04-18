# Step 02 — Understand Business Context

## Mục tiêu

**Phân tích sâu business context** để hiểu rõ:
- PBI này giải quyết vấn đề gì cho user?
- PBI này nằm ở đâu trong business flow?
- Actors nào tương tác với PBI này?
- Business rules nào constrains PBI này?

**Mục đích**: Đảm bảo AI hiểu **NGHIỆP VỤ** trước khi generate spec, tránh tự suy luận sai.

---

## Hành động 1: Load source US (User Story)

**Từ ba-context, đã biết**: `source_us_ids` (1 hoặc nhiều US)

**Đọc từng US file:**

```python
for us_id in source_us_ids:
    us_file_path = ba_context.get_us_path(us_id)
    us_content = read_file(us_file_path)
    us = parse_markdown(us_content)
    
    # Extract key info
    us_statement = us.frontmatter.statement  # "As {actor}, I want {action}, so that {benefit}"
    us_acceptance_criteria = us.sections["Acceptance Criteria"]
    us_scenarios = us.sections["Scenarios"] if exists else None
    us_edge_cases = us.sections["Edge Cases"] if exists else None
```

---

## Hành động 2: Analyze business problem

**Từ US statement, extract:**

```python
# Parse statement format: "As {actor}, I want {action}, so that {benefit}"
actor = extract_actor_from_statement(us_statement)
action = extract_action_from_statement(us_statement)
benefit = extract_benefit_from_statement(us_statement)

# Example:
# Statement: "As an Employee, I want to view my IDP details, so that I can review my development goals"
# → actor = "Employee"
# → action = "view my IDP details"
# → benefit = "review my development goals"
```

**Identify business problem:**

```markdown
### Business Problem Analysis

**Actor**: {actor}

**What they need**: {action}

**Why they need it**: {benefit}

**Business value**: {infer_business_value_from_benefit}

Example:
- Actor: Employee
- What: View IDP details
- Why: Review development goals
- Value: Employee engagement, career development, retention
```

---

## Hành động 3: Understand business flow position

**Từ ba-context.business_flow_context:**

```python
if ba_context.business_flow_context:
    flow = ba_context.business_flow_context
    
    # Extract position
    epic_flow = flow.epic_flow  # Full end-to-end flow
    this_pbi_position = flow.this_pbi_position  # "Step 5 of 8"
    previous_step = flow.previous_step  # What happens before this PBI
    next_step = flow.next_step  # What happens after this PBI
    
    print(f"""
╔══ BUSINESS FLOW CONTEXT ═══════════════════════════════╗
║
║ Full EPIC Flow ({len(epic_flow)} steps):
║   {format_flow_steps(epic_flow, highlight=this_pbi_position)}
║
║ This PBI is: {this_pbi_position}
║
║ ← Previous: {previous_step.description}
║              (Output: {previous_step.output})
║              (Handled by: {previous_step.pbi_id or 'N/A'})
║
║ → Next:     {next_step.description}
║              (Expects: {next_step.required_input})
║              (Handled by: {next_step.pbi_id or 'N/A'})
║
║ State Transitions:
║   Input state:  {flow.input_state}
║   Output state: {flow.output_state}
║
╚════════════════════════════════════════════════════════╝
""")
else:
    WARN("No business flow context in ba-context. This PBI may be standalone.")
```

**Purpose**: Hiểu PBI này KHÔNG phải là isolated — nó là 1 bước trong journey.

---

## Hành động 4: Analyze actors and their goals

**Từ ba-context.actor_task_matrix:**

```python
actors = ba_context.actor_task_matrix.keys()

for actor in actors:
    allowed_tasks = ba_context.actor_task_matrix[actor]
    
    # For this PBI, which tasks apply?
    relevant_tasks = filter_tasks_for_pbi(allowed_tasks, pbi_id)
    
    print(f"""
### Actor: {actor}

**Allowed tasks** (from FEAT Actor-Task Matrix):
{for task in allowed_tasks:
  - {task.action}: {task.permission} {task.notes}
}

**Relevant to this PBI**:
{for task in relevant_tasks:
  ✓ {task.action}
}

**Business goal for {actor}**:
{infer_actor_goal(actor, relevant_tasks)}
""")
```

**Example output:**

```markdown
### Actor: Employee

**Allowed tasks**:
- View own IDP: ✓ (all statuses)
- View others' IDP: ✗ (privacy)
- Edit own IDP: ✓ (only when status=Draft)
- Delete IDP: ✗

**Relevant to this PBI**:
✓ View own IDP

**Business goal for Employee**:
Employee wants to review their development plan to:
- Track progress on goals
- Understand manager's feedback
- Plan next career steps
```

---

## Hành động 5: Identify business rules constraints

**Từ ba-context.business_rules:**

```python
business_rules = ba_context.business_rules

# Categorize rules
entity_rules = [br for br in business_rules if br.category == "entity"]
permission_rules = [br for br in business_rules if br.category == "permission"]
validation_rules = [br for br in business_rules if br.category == "validation"]
state_transition_rules = [br for br in business_rules if br.category == "state"]
business_logic_rules = [br for br in business_rules if br.category == "logic"]

print("""
╔══ BUSINESS RULES CONSTRAINTS ══════════════════════════╗
║
║ Entity Rules ({len(entity_rules)}):
{for br in entity_rules:
║   [{br.id}] {br.description}
}
║
║ Permission Rules ({len(permission_rules)}):
{for br in permission_rules:
║   [{br.id}] {br.description}
}
║
║ Validation Rules ({len(validation_rules)}):
{for br in validation_rules:
║   [{br.id}] {br.description}
}
║
║ State Transition Rules ({len(state_transition_rules)}):
{for br in state_transition_rules:
║   [{br.id}] {br.description}
}
║
║ Business Logic Rules ({len(business_logic_rules)}):
{for br in business_rules:
║   [{br.id}] {br.description}
}
║
╚════════════════════════════════════════════════════════╝

⚠️  CRITICAL: These rules are MANDATORY constraints from FEAT.
    The spec MUST NOT violate any of these rules.
    The spec MUST reference these rule IDs, not create new rules.
""")
```

---

## Hành động 6: Synthesize business understanding

**Tạo "Business Context Summary" để inject vào AI prompt sau này:**

```markdown
# Business Context Summary (Internal - for AI)

## Problem Statement

**User**: {actor}
**Needs**: {action}
**Because**: {benefit}
**Business value**: {business_value}

## Position in Business Flow

This PBI is **step {position}** in the {epic_name} journey:

{epic_flow_diagram}

**Input from previous step**: {previous_step_output}
**Output for next step**: {this_step_output}

**State transition**: {input_state} → {output_state}

## Actors and Permissions

{for actor in actors:
### {actor}

**Can do**:
{for task in actor_allowed_tasks:
- {task}
}

**Cannot do**:
{for task in actor_forbidden_tasks:
- {task}
}

**Goal**: {actor_goal}
}

## Business Constraints (MANDATORY)

{for br in business_rules:
- [{br.id}] {br.description}
}

## Success Criteria (from US)

{for ac in us_acceptance_criteria:
- {ac.id}: {ac.description}
}

---

**AI Instructions**:

When generating the spec, you MUST:
1. Solve the problem: "{actor} needs {action} because {benefit}"
2. Respect flow position: accept input from step {position-1}, produce output for step {position+1}
3. Apply actor permissions: {actor} can {allowed}, cannot {forbidden}
4. Enforce business rules: all {len(business_rules)} rules from FEAT
5. Cover acceptance criteria: {len(us_acceptance_criteria)} AC from US
6. Do NOT add features outside this problem scope
```

**Lưu vào memory** để dùng ở Step 04 (generate spec).

---

## Hành động 7: Check for business complexity flags

**Identify red flags** cần extra attention:

```python
complexity_flags = []

# Flag 1: Multiple actors với conflicting permissions
if len(actors) > 1:
    conflicts = detect_permission_conflicts(actor_task_matrix)
    if conflicts:
        complexity_flags.append({
            "type": "PERMISSION_CONFLICT",
            "severity": "HIGH",
            "message": f"Multiple actors ({', '.join(actors)}) with different permissions",
            "detail": conflicts,
            "action": "Spec must clearly separate UI/features by actor role"
        })

# Flag 2: Complex state transitions
if state_transition_rules:
    if len(state_transition_rules) > 3:
        complexity_flags.append({
            "type": "COMPLEX_STATE_MACHINE",
            "severity": "MEDIUM",
            "message": f"{len(state_transition_rules)} state transition rules",
            "action": "Include state diagram in spec, validate all transitions"
        })

# Flag 3: Cross-PBI dependencies
if related_pbis:
    complexity_flags.append({
        "type": "CROSS_PBI_DEPENDENCY",
        "severity": "HIGH",
        "message": f"Depends on {len(related_pbis)} other PBIs",
        "detail": related_pbis,
        "action": "Define integration contracts with related PBIs"
    })

# Flag 4: Compliance requirements
if compliance:
    complexity_flags.append({
        "type": "COMPLIANCE",
        "severity": "CRITICAL",
        "message": f"{len(compliance)} compliance requirements (GDPR, audit, etc.)",
        "action": "Must include compliance checks in spec"
    })

# Flag 5: Nhiều entities với relationships
entity_count = len(entities)
if entity_count > 3:
    complexity_flags.append({
        "type": "COMPLEX_DATA_MODEL",
        "severity": "MEDIUM",
        "message": f"{entity_count} entities involved",
        "action": "Include entity relationship diagram"
    })

if complexity_flags:
    print(f"""
⚠️  COMPLEXITY FLAGS ({len(complexity_flags)}):

{for flag in complexity_flags:
[{flag.severity}] {flag.type}: {flag.message}
    → Action: {flag.action}
{if flag.detail:
    → Detail: {flag.detail}
}
}

These flags indicate high-risk areas. The spec generation (Step 04) will pay extra attention to these.
""")
```

---

## Kết quả đầu ra Step 02

**Business context understood:**
- ✅ Problem statement analyzed
- ✅ Business flow position understood
- ✅ Actors and their goals identified
- ✅ Business rules constraints loaded
- ✅ Complexity flags detected

**Business Context Summary**: ready to inject vào AI prompt

**Chuyển sang**: `./steps/step-03-define-scope.md`
