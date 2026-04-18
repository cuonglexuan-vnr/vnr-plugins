## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

---

## Pre-Execution: BA Context Detection

**BEFORE running standard workflow**, check for BA context:

```bash
# Get current feature directory
feature_dir=$(pwd | grep -oP 'specs/[^/]+$' || echo "")

if [ -n "$feature_dir" ]; then
    ba_context_path="$feature_dir/ba-context.md"
    
    if [ -f "$ba_context_path" ]; then
        echo "ℹ️  BA context detected: $ba_context_path"
        echo "   Mode: BA-Enhanced (will skip answered questions)"
        BA_MODE=true
        ba_context=$(cat "$ba_context_path")
    else
        echo "ℹ️  No BA context found"
        echo "   Mode: Standard clarification"
        BA_MODE=false
    fi
else
    echo "ℹ️  Not in a feature directory"
    echo "   Mode: Standard clarification"
    BA_MODE=false
fi
```

If BA_MODE = true, extract:
- `open_questions` — Questions from BA that need clarification
- `answered_questions` — Questions already answered in FEAT/US
- `business_rules` — To avoid re-asking about existing rules
- `entities` — To avoid re-asking about entity structure
- `validation_rules` — To avoid re-asking about validation

---

## Standard Workflow (from speckit.clarify)

**Follow `speckit.clarify.md` workflow exactly**, với enhancements:

---

### Enhancement Point 1: Step 1 — Load Context

**Original**: Load spec.md, run prerequisites script

**Enhanced** (if BA_MODE = true):

**+ Load ba-context.md**:
```python
ba_context = parse_yaml(read_file(ba_context_path))

answered_in_ba = []
open_by_ba = []

# Extract answered questions from BA layer
for category in CATEGORIES:
    ba_answer = ba_context.get_answer_for_category(category)
    if ba_answer:
        answered_in_ba.append({
            "category": category,
            "answer": ba_answer,
            "source": ba_context.source (FEAT/EPIC/US)
        })

# Extract open questions flagged by BA
if ba_context.open_questions:
    for q in ba_context.open_questions:
        open_by_ba.append({
            "id": q.id,
            "question": q.question,
            "category": q.category,
            "suggested_answer": q.suggested_answer,
            "reasoning": q.reasoning,
            "priority": "HIGH (from BA)"
        })

print(f"""
ℹ️  BA Context Loaded:
   - Answered questions: {len(answered_in_ba)} (will SKIP these)
   - Open questions: {len(open_by_ba)} (will PRIORITIZE these)
""")
```

---

### Enhancement Point 2: Step 2 — Ambiguity Scan

**Original**: Scan spec for ambiguities across taxonomy categories

**Enhanced** (if BA_MODE = true):

**Filter out answered questions**:

```python
candidate_questions = []

for category in TAXONOMY_CATEGORIES:
    spec_coverage = assess_coverage(spec, category)
    
    if spec_coverage in ["Partial", "Missing"]:
        # CHECK: BA đã trả lời chưa?
        if category in answered_in_ba:
            # BA đã trả lời → SKIP
            print(f"   ✓ {category}: Answered in {answered_in_ba[category].source} — skipping")
            continue
        
        # BA chưa trả lời → add to queue
        candidate_questions.append({
            "category": category,
            "question": generate_question(spec, category),
            "priority": "NORMAL"
        })
```

**Result**: Không hỏi lại những gì BA đã define trong FEAT/EPIC.

---

### Enhancement Point 3: Step 3 — Question Prioritization

**Original**: Prioritize by impact * uncertainty

**Enhanced** (if BA_MODE = true):

**Prioritize BA open_questions FIRST**:

```python
final_queue = []

# Priority 1: BA's open questions (highest priority)
for ba_q in open_by_ba:
    final_queue.append({
        "question": ba_q.question,
        "category": ba_q.category,
        "priority": "HIGH (from BA)",
        "suggested_answer": ba_q.suggested_answer,
        "reasoning": ba_q.reasoning,
        "source": "BA Context"
    })

# Priority 2: New candidate questions
for cand_q in candidate_questions:
    final_queue.append({
        "question": cand_q.question,
        "category": cand_q.category,
        "priority": cand_q.priority,
        "source": "Spec Analysis"
    })

# Limit to 5 total
final_queue = final_queue[:5]

print(f"""
📋 Question Queue ({len(final_queue)}/5):
   - From BA: {len([q for q in final_queue if q.source == 'BA Context'])}
   - New: {len([q for q in final_queue if q.source == 'Spec Analysis'])}
   - Skipped: {len(answered_in_ba)} (already answered in BA layer)
""")
```

---

### Enhancement Point 4: Step 4 — Sequential Questioning

**Original**: Present question with options table

**Enhanced** (if BA_MODE = true AND question source = "BA Context"):

**Present with BA's suggested answer FIRST**:

```markdown
## Question {N}: {category}

**Source**: BA Context (identified during PBI composition)

**Context**: {quote_spec_section}

**What we need to know**: {ba_q.question}

**BA's Analysis**: {ba_q.reasoning}

**BA's Suggested Answer**: {ba_q.suggested_answer}

---

**Your options**:

| Option | Answer | Implications |
|--------|--------|--------------|
| **A (Recommended)** | **{ba_q.suggested_answer}** | {ba_q.implications} ← BA recommendation |
| B | {alternative_answer_1} | {implications_1} |
| C | {alternative_answer_2} | {implications_2} |
| Custom | Provide your own answer | Type your answer below |

**Quick accept**: Type "yes", "recommended", or "A" to accept BA's suggestion.

**Your choice**: _
```

**For NEW questions** (source = "Spec Analysis"):
- Present như `speckit.clarify` gốc (no BA suggestion)

---

### Enhancement Point 5: Step 5 — Integration

**Original**: Update spec, append to clarifications session

**Enhanced** (if BA_MODE = true):

**+ Update ba-context.md** sau khi answer:

```python
# For questions from BA open_questions
if question.source == "BA Context":
    # Update ba-context.md: mark question as resolved
    ba_context.open_questions[question.id].status = "resolved"
    ba_context.open_questions[question.id].final_answer = user_answer
    ba_context.open_questions[question.id].resolved_at = now()
    ba_context.open_questions[question.id].resolved_by = "speckit.ba-clarify"
    ba_context.open_questions[question.id].ba_suggestion_accepted = (user_answer == ba_suggestion)
    
    # Write back to ba-context.md
    write_file(ba_context_path, ba_context)

# Update spec (same as speckit.clarify)
append_to_clarifications_session(spec, question, answer)
```

**Result**: Bi-directional update — spec.md + ba-context.md đều được update.

---

### Enhancement Point 6: Step 8 — Report

**Original**: Report questions asked, sections touched, coverage

**Enhanced** (if BA_MODE = true):

```markdown
✅ Clarification complete with BA context awareness

📊 Summary:
   - Total questions asked: {asked_count} / 5
   - From BA: {ba_questions_count}
   - New: {new_questions_count}
   - Skipped (answered in BA): {len(answered_in_ba)}

📋 BA Question Acceptance:
   - BA suggestions accepted: {ba_accepted_count} / {ba_questions_count}
   - BA suggestions modified: {ba_modified_count} / {ba_questions_count}
   - Acceptance rate: {ba_acceptance_rate:.0%}

📄 Updated Files:
   - {spec_path}
   - {ba_context_path} (open questions marked resolved)

📋 Coverage Summary:
   {coverage_table}

{if outstanding_count > 0:
⚠️  Outstanding: {outstanding_count} categories still Partial/Missing
   → Run /speckit.clarify again or defer to planning phase
}

⏭  Next: /speckit.plan
```

---

## Enhancements Summary

| Enhancement | Where | What |
|-------------|-------|------|
| **1. Pre-load BA context** | Before Step 1 | Load answered_questions + open_questions từ ba-context |
| **2. Filter answered** | Step 2 (scan) | Skip categories đã answered in FEAT/EPIC/US |
| **3. Prioritize BA questions** | Step 3 (queue) | BA open_questions → top of queue |
| **4. Present BA suggestions** | Step 4 (questioning) | Show BA's suggested answer as option A |
| **5. Bi-directional update** | Step 5 (integration) | Update spec.md + ba-context.md |
| **6. Track acceptance** | Step 8 (report) | Report how many BA suggestions accepted |

**Total enhancements**: 6 injection points  
**Workflow changes**: 0 (100% preserved)

---

## Key Benefits

✅ **Efficiency**: Skip answered questions → faster clarification (5 → 2-3 questions)  
✅ **BA-Dev alignment**: Dev sees BA's reasoning → better decisions  
✅ **Track acceptance**: Metric để improve BA suggestions over time  
✅ **Bi-directional**: ba-context.md được update → future PBIs benefit  
✅ **100% backward compatible**: Nếu không có ba-context → chạy như gốc
