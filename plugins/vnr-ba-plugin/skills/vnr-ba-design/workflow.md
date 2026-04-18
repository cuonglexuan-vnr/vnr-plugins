## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

---

## Pre-Execution: BA Context Detection

```bash
feature_dir=$(pwd | grep -oP 'specs/[^/]+$' || echo "")

if [ -n "$feature_dir" ]; then
    ba_context_path="$feature_dir/ba-context.md"
    
    if [ -f "$ba_context_path" ]; then
        echo "ℹ️  BA context detected: $ba_context_path"
        echo "   Mode: BA-Enhanced (wireframe-driven design)"
        BA_MODE=true
        ba_context=$(cat "$ba_context_path")
    else
        echo "ℹ️  No BA context"
        echo "   Mode: Standard (infer UI from spec)"
        BA_MODE=false
    fi
else
    BA_MODE=false
fi
```

If BA_MODE = true, extract:
- `wireframe_references` — Figma, images, descriptions từ US
- `design_system_rules` — Component usage rules, style guide
- `actor_task_matrix` — For permission-aware UI
- `ui_ux_context` — Layout structure, responsive behavior

---

## Standard Workflow (from speckit.design)

**Follow `speckit.design.md` workflow exactly**, với enhancements:

---

### Enhancement Point 1: Before Step 1 — Load Wireframe

**If BA_MODE = true AND ba_context.wireframe_references exists**:

```python
wireframes = []

for wf_ref in ba_context.wireframe_references:
    print(f"📐 Loading wireframe: {wf_ref.type} — {wf_ref.screen_code}")
    
    if wf_ref.type == "figma":
        # Load Figma URL
        wireframe = {
            "type": "figma",
            "url": wf_ref.url,
            "screen_code": wf_ref.screen_code,
            "notes": wf_ref.notes
        }
        print(f"   → Figma: {wf_ref.url}")
        print(f"   → Use this as source of truth for UI structure")
    
    elif wf_ref.type == "image":
        # Read image file
        image_path = wf_ref.path
        if exists(image_path):
            wireframe = {
                "type": "image",
                "path": image_path,
                "screen_code": wf_ref.screen_code
            }
            print(f"   → Image: {image_path}")
            print(f"   → Analyze this image for UI layout")
        else:
            WARN(f"   → Image not found: {image_path}")
    
    elif wf_ref.type == "description":
        # Read text description
        desc_content = read_file(wf_ref.path)
        wireframe = {
            "type": "description",
            "content": desc_content,
            "screen_code": wf_ref.screen_code
        }
        print(f"   → Text description loaded")
    
    wireframes.append(wireframe)

WIREFRAME_MODE = True
print(f"""
✅ Wireframe loaded: {len(wireframes)} screen(s)
   Design will be DRIVEN by wireframe, not inferred from spec.
""")
```

**If no wireframe**:
```
ℹ️  No wireframe in ba-context
   Design will be INFERRED from spec (standard speckit.design behavior)

WIREFRAME_MODE = False
```

---

### Enhancement Point 2: Step 2 — Screen Identification

**Original**: Infer screens từ spec (user stories, requirements)

**Enhanced** (if WIREFRAME_MODE = true):

**Extract screens FROM WIREFRAME**:

```python
screens = []

for wireframe in wireframes:
    if wireframe.type == "figma":
        # Parse Figma URL hoặc prompt user to describe
        print(f"""
📐 Figma wireframe: {wireframe.screen_code}

Please describe the UI structure from Figma:
1. Screen name
2. Main sections (header, body, footer, sidebar, etc.)
3. Components in each section
4. Interactions (buttons, forms, etc.)

(Or provide screenshots of the Figma frames)
""")
        
        figma_description = await_user_input()
        screen = parse_screen_from_description(figma_description)
    
    elif wireframe.type == "image":
        # Analyze image (if Claude can see images)
        image = read_image(wireframe.path)
        screen = extract_screen_from_image_analysis(image)
    
    elif wireframe.type == "description":
        screen = parse_screen_from_description(wireframe.content)
    
    screen.source = f"Wireframe: {wireframe.screen_code}"
    screens.append(screen)

print(f"✅ Identified {len(screens)} screen(s) from wireframe")
```

**Cross-check với scope boundaries**:

```python
if BA_MODE:
    for screen in screens:
        # Check if screen is in scope excludes
        if screen.name in ba_context.scope.excludes:
            WARN(f"""
⚠️  Screen '{screen.name}' found in wireframe but EXCLUDED from this PBI scope.

Excluded by: {ba_context.scope.excludes[screen.name].reason}
Owner PBI: {ba_context.scope.excludes[screen.name].owner_pbi}

This screen will be REMOVED from design.
""")
            screens.remove(screen)
```

---

### Enhancement Point 3: Step 3 — UI Detail Generation

**Original**: Generate UI detail for each screen (bố cục, components, interaction, states, validation)

**Enhanced** (if BA_MODE = true):

**For each screen**:

#### 3a. Layout & Components (WIREFRAME-DRIVEN)

```markdown
### Screen: {screen.name}

**Source**: {screen.source} (Wireframe from BA)

**Layout Structure** (as shown in wireframe):

{describe_layout_from_wireframe(screen)}

**Components** (mapped to design system):

{for component in screen.components:
- **{component.name}**: {component.type}
  - Design System: {map_to_design_system(component, ba_context.design_system)}
  - Position: {component.position}
  - Visibility: {component.visibility_condition}
  {if component.requires_permission:
  - Permission: {component.requires_permission} (from Actor-Task Matrix)
  }
}
```

#### 3b. Design System Compliance (NEW)

**If ba_context.design_system_rules exists**:

```markdown
**Design System**: {ba_context.design_system.name}

**Component Mapping**:

| UI Component | Design System Component | Rules Applied |
|--------------|-------------------------|---------------|
{for ui_comp in screen.components:
| {ui_comp.name} | {map_to_ds(ui_comp)} | {get_ds_rules(ui_comp)} |
}

**Style Rules**:
{for rule in ba_context.design_system_rules:
- {rule.component}: {rule.rule}
  Example: {rule.example}
}
```

#### 3c. Interaction (PERMISSION-AWARE)

**Original**: User action → System response table

**Enhanced**:

```markdown
**Interaction Table**:

| User Action | System Response | Permission Required | Visible To | Notes |
|-------------|-----------------|---------------------|------------|-------|
{for interaction in screen.interactions:
| {interaction.action} | {interaction.response} | {get_required_permission(interaction, ba_context.actor_task_matrix)} | {get_visible_actors(interaction, ba_context.actor_task_matrix)} | {interaction.notes} |
}

**Permission Matrix for this Screen**:

{for actor in ba_context.actor_task_matrix:
### {actor}

**Can see**:
{for action in screen.interactions if actor_can_see(actor, action):
- {action.button/link/control}
}

**Cannot see** (hidden):
{for action in screen.interactions if not actor_can_see(actor, action):
- {action.button/link/control}
}
}
```

**Example**:

```
### Employee

**Can see**:
- "View Details" button (always visible)
- "Edit IDP" button (visible only if status=Draft)

**Cannot see**:
- "Approve" button (Manager only)
- "Reject" button (Manager only)

### Manager

**Can see**:
- "View Details" button
- "Approve" button (visible only if status=Pending)
- "Reject" button (visible only if status=Pending)

**Cannot see**:
- "Edit IDP" button (Employee only)
```

---

### Enhancement Point 4: Step 3d — UI States

**Original**: Describe UI states (loading, empty, error, success)

**Enhanced** (if BA_MODE = true):

**Validate 4 required states**:

```python
required_states = ["loading", "empty", "error", "success"]

for screen in screens:
    missing_states = []
    
    for state in required_states:
        if state not in screen.states:
            missing_states.append(state)
    
    if missing_states:
        WARN(f"""
⚠️  Screen '{screen.name}' missing UI states: {', '.join(missing_states)}

Required by BA Ground Rules GR-004:
"Mỗi màn hình phải mô tả đủ 4 trạng thái: loading, empty, error, success"

Adding default states...
""")
        
        # Add default states
        for state in missing_states:
            screen.states[state] = generate_default_state(state, screen, ba_context)
```

**Default states** (nếu BA chưa define):

```markdown
**Loading State**:
- Display: Skeleton loader or spinner
- Message: "Đang tải {screen.entity_name}..."
- Design System: {ba_context.design_system.loading_component}

**Empty State**:
- Display: Empty state illustration
- Message: "Chưa có {screen.entity_name} nào"
- Action: "{create_action} button" (if user has permission)
- Design System: {ba_context.design_system.empty_state_component}

**Error State**:
- Display: Error icon + message
- Message: "Không thể tải {screen.entity_name}. Vui lòng thử lại."
- Action: "Thử lại" button
- Design System: {ba_context.design_system.error_component}

**Success State**:
- Display: Normal screen content (see Layout above)
```

---

### Enhancement Point 5: Step 4 — Screen Flow

**Original**: Describe screen transitions

**Enhanced** (if BA_MODE = true AND ba_context.business_flow_context exists):

**Add business flow diagram**:

```markdown
## Screen Flow (Business Flow Context)

**Position in End-to-End Flow**:

```
{ba_context.business_flow_context.epic_flow_diagram}

This PBI: Step {position}
```

**Screen Transitions**:

| From Screen | Trigger | To Screen | State Change | Owner PBI |
|-------------|---------|-----------|--------------|-----------|
{for transition in flow_transitions:
| {transition.from} | {transition.trigger} | {transition.to} | {transition.state_change} | {transition.owner_pbi} |
}

**Navigation Rules**:
{for rule in navigation_rules:
- {rule.condition} → {rule.action}
}
```

---

### Enhancement Point 6: Step 6 — Finalize & Validate

**Original**: Save to `ui-detail.md`, report completion

**Enhanced** (if BA_MODE = true):

**Validation** (before save):

```python
design_warnings = []

# Validate: Design system compliance
if ba_context.design_system_rules:
    for screen in screens:
        for component in screen.components:
            ds_component = map_to_design_system(component)
            ds_rule = ba_context.design_system_rules.get(component.type)
            
            if ds_rule and not component_follows_rule(component, ds_rule):
                design_warnings.append(f"⚠️  {screen.name} > {component.name}: Violates design system rule '{ds_rule.name}'")

# Validate: Permission logic
for screen in screens:
    for interaction in screen.interactions:
        required_permission = interaction.requires_permission
        actor = interaction.actor
        
        if not ba_context.actor_has_permission(actor, required_permission):
            design_warnings.append(f"⚠️  {screen.name} > {interaction.name}: {actor} does not have permission '{required_permission}' per Actor-Task Matrix")

# Validate: UI states coverage
for screen in screens:
    for required_state in ["loading", "empty", "error", "success"]:
        if required_state not in screen.states:
            design_warnings.append(f"⚠️  {screen.name}: Missing UI state '{required_state}'")

if design_warnings:
    print(f"""
╔══ DESIGN VALIDATION WARNINGS ═════════════════════════╗
║
║ {len(design_warnings)} warnings detected:
║
{for w in design_warnings[:10]:
║ {w}
}
║
╚═══════════════════════════════════════════════════════╝

These warnings indicate potential design issues.
Review ui-detail.md and fix if needed.
""")
```

**Report** (enhanced):

```markdown
✅ UI design created {if BA_MODE: 'with BA wireframe'}

📄 File: {ui_detail_path}

📊 Design Summary:
   - Screens: {len(screens)}
   - Source: {if WIREFRAME_MODE: 'Wireframe from BA' else: 'Inferred from spec'}
   {if ba_context.design_system:
   - Design System: {ba_context.design_system.name}
   }
   - Components: {total_components}
   - Interactions: {total_interactions}
   - UI States: {total_states} (loading, empty, error, success)

{if BA_MODE:
📋 BA Context Applied:
   - Wireframe: {wireframe_count} screen(s) loaded
   - Design System Rules: {len(ba_context.design_system_rules)} enforced
   - Permission Logic: {len(ba_context.actor_task_matrix)} actors
   - Scope: {len(screens_in_scope)} screens in scope, {len(screens_excluded)} excluded
}

{if design_warnings:
⚠️  Design Warnings: {len(design_warnings)}
   (See details above. Review and fix ui-detail.md if needed.)
}

⏭  Next: /speckit.plan
```

---

## Enhancements Summary

| Enhancement | Where | What |
|-------------|-------|------|
| **1. Load wireframe** | Before Step 1 | Extract screens từ Figma/image/description |
| **2. Screen extraction** | Step 2 | FROM wireframe, NOT inference |
| **3. Design system mapping** | Step 3 | Map components → DS, enforce rules |
| **4. Permission-aware UI** | Step 3c | Show/hide based on Actor-Task Matrix |
| **5. UI states validation** | Step 3d | Ensure 4 states (GR-004) |
| **6. Business flow diagram** | Step 4 | Include EPIC flow position |
| **7. Design validation** | Step 6 | Check DS compliance, permissions, states |

**Total enhancements**: 7 injection points  
**Workflow changes**: 0 (100% preserved)

---

## Key Benefits

✅ **Wireframe-driven**: Không tự suy luận UI, dùng BA mockup  
✅ **Design system enforcement**: Component usage consistent  
✅ **Permission-aware**: UI chỉ show actions user được phép  
✅ **UI states coverage**: Đảm bảo 4 states (GR-004)  
✅ **Business flow context**: Biết vị trí screen trong journey  
✅ **100% backward compatible**: Nếu không có wireframe → infer như gốc
