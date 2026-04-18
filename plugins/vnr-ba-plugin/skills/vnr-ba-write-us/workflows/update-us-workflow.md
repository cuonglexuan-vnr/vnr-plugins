# Workflow: UPDATE_US — Cập nhật User Story (Smart Patch)

## Mục tiêu

Cập nhật US hiện có theo yêu cầu thay đổi của BA, sử dụng **Smart Patch approach**:
- Tự động detect side effects (thêm AC → cần thêm VM, sửa BR → cần update AC)
- Đề xuất thay đổi bổ sung cho BA approve
- Maintain traceability (AC↔BR↔VM)
- Version bump strategy: Minor (1.0 → 1.1) cho small, Major (1.0 → 2.0) cho big

---

## Nguyên tắc

1. **KHÔNG chạy lại 15 steps đầy đủ** — chỉ update phần cần thiết
2. **Tự động detect side effects** — phân tích ảnh hưởng của thay đổi
3. **BA approve** các thay đổi bổ sung trước khi apply
4. **Maintain consistency** — đảm bảo traceability matrices vẫn đúng sau update

---

## Workflow (7 bước)

### Step U1: Load US hiện tại

```
US_file_path = Module/{MOD}/Epics/{EPIC}/Features/{FEAT}/Stories/{US_ID}_{slug}.md

IF NOT file_exists(US_file_path):
   → ERROR: "US không tồn tại. Bạn có muốn tạo US mới thay vì update?"
   → STOP workflow

ELSE:
   → Read file
   → Parse frontmatter metadata:
      - current_version (ví dụ: 1.2)
      - status, author, created, last_updated
   → Parse toàn bộ 11 sections
   → Lưu vào session context
```

**Output:**
```
✓ Loaded US: {US_ID} v{version}
Status: {status}
Last updated: {last_updated}
```

---

### Step U2: Phân tích yêu cầu thay đổi

Parse mô tả thay đổi từ BA và xác định:

**1. Section nào bị ảnh hưởng trực tiếp?**

| Từ khóa trong yêu cầu | Section bị ảnh hưởng |
|---|---|
| "sửa typo", "đổi tên", "sửa message" | Section cụ thể (BR/AC/VM/UI) |
| "thêm BR", "thêm business rule" | Section 3 (BR) |
| "thêm AC", "thêm acceptance criteria" | Section 4 (AC) |
| "cập nhật activity diagram" | Section 5 (Activity Diagram) |
| "thêm trường", "sửa data dictionary" | Section 6 (Data Dictionary) |
| "thêm VM", "sửa validation message" | Section 7 (VM) |
| "thêm màn hình", "sửa UI" | Section 8 (UI/UX) |
| "thêm tracking event" | Section 9 (Tracking & Analytics) |
| "cập nhật priority", "thay đổi segment" | Section 0 (Metadata) |

**2. Xác định impact level:**

```
Impact Level Logic:

IF "sửa typo" OR "đổi tên" OR "cập nhật metadata" OR (thay đổi 1 VM đơn lẻ):
   → IMPACT_LEVEL = LOW
   → Ước tính thay đổi: 1 section, không có side effects
   
ELSE IF "thêm/sửa AC" (1-2 AC) OR "thêm/sửa BR" OR "thêm VM với logic mới" OR "sửa UI":
   → IMPACT_LEVEL = MEDIUM
   → Ước tính thay đổi: 2-4 sections, có side effects
   
ELSE IF "thêm 5+ AC" OR "refactor BR" OR "thay đổi actor/segment" OR "thêm nhiều màn hình":
   → IMPACT_LEVEL = HIGH
   → Ước tính thay đổi: 5+ sections, major scope change
   → Khuyến nghị: Chạy lại workflow đầy đủ (Step 00-08)
```

**Output Step U2:**

```
════════════════════════════════════════════════════════
📊 PHÂN TÍCH YÊU CẦU THAY ĐỔI

Yêu cầu BA: "{mô tả thay đổi}"

Section bị ảnh hưởng trực tiếp:
- {Section X}: {lý do}

Impact Level: {LOW / MEDIUM / HIGH}

Ước tính thay đổi:
- Sections cần update: {danh sách}
- Side effects: {có / không}
════════════════════════════════════════════════════════
```

---

### Step U3: Detect side effects (chỉ với MEDIUM/HIGH impact)

**Nếu IMPACT_LEVEL = LOW:**
- Skip step này → chuyển thẳng sang Step U4

**Nếu IMPACT_LEVEL = MEDIUM hoặc HIGH:**

Phân tích side effects dựa trên dependency graph:

#### Dependency Graph:

```
BR (Section 3) — quy tắc nghiệp vụ
  ↓ được test bởi
AC (Section 4) — nếu thêm/sửa BR → kiểm tra có cần thêm/sửa AC không
  ↓ phụ thuộc vào
Activity Diagram (Section 5) — nếu thêm AC mới → kiểm tra diagram có cover không
  ↓ liên quan đến
Data Dictionary (Section 6) — nếu BR/AC liên quan trường → cần update Data Dictionary
  ↓ khi vi phạm thì có
VM (Section 7) — nếu thêm/sửa BR → kiểm tra có cần thêm/sửa VM không
  ↓ liên quan đến
UI (Section 8) — nếu thêm/sửa VM → kiểm tra UI có hiển thị VM này không
  ↓ trace lại
Traceability (Section 10) — mọi thay đổi BR/AC/VM đều phải update matrices
```

#### Logic detect side effects:

**Case 1: Thêm/sửa BR**
```
IF thêm/sửa BR:
   → Check AC nào enforce BR này?
      - Nếu chưa có AC → đề xuất thêm AC mới
      - Nếu đã có AC → đề xuất update AC
   → Check BR mới cần VM không?
      - Nếu BR là validation rule → cần thêm VM-E0X
   → Check Data Dictionary có trường liên quan không?
      - Nếu BR ràng buộc trường → update Data Dictionary
   → Check Activity Diagram có cover BR mới không?
      - Nếu BR là luồng mới → cần update diagram
   → Update Traceability matrices
```

**Case 2: Thêm/sửa AC**
```
IF thêm/sửa AC:
   → Check AC mới có liên quan BR nào không?
      - Nếu AC có validation logic → kiểm tra đã có BR-U chưa
      - Nếu AC có điều kiện mới → kiểm tra đã có BR-U chưa
   → Check AC mới có cần VM không?
      - Nếu AC là validation scenario → cần thêm VM-E0X (Error)
      - Nếu AC là happy path → cần thêm VM-S0X (Success)
   → Check Activity Diagram có cover AC mới không?
      - Nếu AC mới có luồng khác → cần update diagram
   → Update Traceability matrices (AC↔BR, VM↔BR↔AC)
```

**Case 3: Thêm/sửa Activity Diagram**
```
IF thêm/sửa Activity Diagram:
   → Check diagram có cover đủ tất cả AC không?
      - Nếu thiếu → cảnh báo
   → Check diagram có cover các BR validation không?
      - Nếu thiếu bước kiểm tra → cảnh báo
```

**Case 4: Thêm/sửa trường (Data Dictionary)**
```
IF thêm/sửa trường:
   → Check có BR nào liên quan không?
      - Nếu trường có ràng buộc → cần thêm BR-U00X
   → Check có AC nào test trường này không?
      - Nếu chưa → đề xuất thêm AC validation
   → Check Activity Diagram có nhắc trường này không?
      - Nếu trường bắt buộc → update diagram (check đã điền đủ?)
```

**Case 5: Thêm/sửa VM**
```
IF thêm/sửa VM:
   → Check VM này trace về BR nào?
      - Nếu chưa có BR → đề xuất thêm BR-U00X
   → Check VM này hiển thị ở đâu trong UI?
      - Update Section 8 (UI/UX Mô tả) — thêm VM vào bảng Thông báo & phản hồi
   → Update Traceability matrices
```

**Case 6: Thêm/sửa UI**
```
IF thêm/sửa UI:
   → Check AC có cover màn hình/trạng thái mới không?
      - Nếu chưa → đề xuất thêm AC
   → Check VM có đủ cho tất cả feedback của UI không?
      - Nếu thiếu → đề xuất thêm VM
   → Run UX Evaluation (6 tiêu chí) lại
```

**Output Step U3:**

```
════════════════════════════════════════════════════════
🔍 PHÁT HIỆN SIDE EFFECTS

Thay đổi trực tiếp:
✏️ {Section X}: {mô tả thay đổi}

Thay đổi bổ sung cần thiết:
🔗 {Section Y}: {lý do} — ảnh hưởng từ Section X
🔗 {Section Z}: {lý do} — ảnh hưởng từ Section Y

Tổng: {N} sections cần update (1 trực tiếp + {N-1} side effects)
════════════════════════════════════════════════════════
```

---

### Step U4: Đề xuất thay đổi và xin BA approve

**Nếu IMPACT_LEVEL = LOW (không có side effects):**
- Hiển thị thay đổi trực tiếp
- Không cần hỏi approve → apply luôn
- Chuyển sang Step U5

**Nếu IMPACT_LEVEL = MEDIUM (có side effects):**

```
════════════════════════════════════════════════════════
📋 ĐỀ XUẤT THAY ĐỔI (BA Approve Required)

Yêu cầu ban đầu:
"{mô tả thay đổi}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Thay đổi trực tiếp:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Section {X} ({Tên section}):
   {Mô tả chi tiết thay đổi — ví dụ: Thêm AC-004}
   
   [Preview nội dung mới]
   ```
   {Nội dung chi tiết}
   ```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Thay đổi bổ sung (Side effects):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. Section {Y} ({Tên section}):
   {Lý do cần thay đổi}
   
   [Preview nội dung mới]
   ```
   {Nội dung chi tiết}
   ```

3. Section {Z} ({Tên section}):
   {Lý do cần thay đổi}
   
   [Preview nội dung mới]
   ```
   {Nội dung chi tiết}
   ```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tổng kết:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Sections cần update: {N}
- Version bump: {current} → {new} (minor bump)

Bạn có approve toàn bộ thay đổi trên không?
(a) Approve tất cả — Apply ngay
(b) Approve một phần — Chọn sections cần apply
(c) Reject — Không apply, giữ nguyên US
(d) Revise — Tôi sẽ chỉnh sửa đề xuất theo góp ý của bạn
════════════════════════════════════════════════════════
```

**Xử lý lựa chọn:**

- **(a) Approve tất cả:** Chuyển sang Step U5 với tất cả thay đổi
- **(b) Approve một phần:** Hỏi BA chọn sections → chỉ apply các sections được chọn → Step U5
- **(c) Reject:** STOP workflow, không ghi file
- **(d) Revise:** Lắng nghe góp ý BA → adjust đề xuất → hiển thị lại Step U4

**Nếu IMPACT_LEVEL = HIGH:**
```
⚠️  HIGH IMPACT DETECTED
════════════════════════════════════════════════════════

Yêu cầu thay đổi của bạn sẽ ảnh hưởng đến {N} sections (>5).

Khuyến nghị: Chạy lại workflow đầy đủ (Step 00-08) để đảm bảo 
consistency 100% thay vì update từng phần.

Bạn muốn:
(a) Chạy lại workflow đầy đủ (RECOMMENDED)
(b) Vẫn update từng phần (rủi ro mất consistency)
(c) Hủy update
════════════════════════════════════════════════════════
```

---

### Step U5: Apply thay đổi

Apply tất cả thay đổi đã được approve vào US:

```
FOR each section in approved_changes:
   → Parse section hiện tại trong US
   → Apply thay đổi (thêm/sửa/xóa content)
   → Validate format (markdown, bảng, list)
   → Update section trong session context
```

**Đặc biệt với Traceability matrices:**

Nếu có thay đổi AC/BR/VM, tự động re-generate matrices:

```
IF thay đổi AC OR BR OR VM:
   → Re-generate ma trận AC↔BR
   → Re-generate ma trận VM↔BR↔AC
   → Update Section 10 (Traceability)
```

---

### Step U6: Version bump và Change Log

**Version bump strategy:**

```
current_version = parse_version(US_frontmatter)  # ví dụ: 1.2

IF IMPACT_LEVEL == LOW:
   → Minor bump: 1.2 → 1.3
   → Change icon: ✏️ (edit)
   
ELSE IF IMPACT_LEVEL == MEDIUM:
   IF approved_changes.count <= 3:
      → Minor bump: 1.2 → 1.3
      → Change icon: 🆕 (new) hoặc ✏️ (edit)
   ELSE:
      → Minor bump: 1.2 → 1.3
      → Change icon: 🔄 (refactor)
      
ELSE IF IMPACT_LEVEL == HIGH:
   → Major bump: 1.2 → 2.0
   → Change icon: 🔄 (refactor) hoặc 🚀 (major update)
```

**Change Log entry:**

```
| {new_version} | {today} | {BA_name} | {change_icon} {summary} | {task_id if any} |
```

**Summary format:**

```
IF IMPACT_LEVEL == LOW:
   → "✏️ {Mô tả ngắn gọn — ví dụ: Sửa VM-E01 message}"
   
ELSE IF IMPACT_LEVEL == MEDIUM:
   → "🆕 Thêm {X} — ảnh hưởng: {Y}, {Z}"
   → Ví dụ: "🆕 Thêm AC-004 validation — ảnh hưởng: BR-U005, VM-E04, Data Dictionary"
   
ELSE IF IMPACT_LEVEL == HIGH:
   → "🔄 Refactor: {mô tả tổng quan}"
   → Ví dụ: "🔄 Refactor: Thêm 5 AC cho edge cases, cập nhật BR, VM, UI tương ứng"
```

**Update frontmatter:**

```yaml
version: {new_version}
last_updated: {YYYY-MM-DD today}
```

---

### Step U7: Ghi lại file và thông báo

**Kiểm tra cuối — Zero Kỹ thuật:**

Quét lại toàn bộ nội dung US đã update để đảm bảo không có từ kỹ thuật:

```
forbidden_terms = [
   "API", "endpoint", "HTTP", "GET", "POST", "PUT", "DELETE",
   "database", "DB", "table", "column", "schema",
   "component", "interface", "DTO", "Command", "Query", "Handler",
   "Service", "Controller", "Repository", "Entity",
   ...
]

IF any forbidden_term in updated_US_content:
   → Cảnh báo: "⚠️ Phát hiện {N} từ kỹ thuật trong nội dung mới: {danh sách}"
   → Hỏi BA: "Tôi có tự sửa các từ này không?"
   → Nếu BA approve → Tự sửa → Ghi file
   → Nếu BA reject → Không ghi file, báo lỗi
ELSE:
   → Ghi file
```

**Ghi file:**

```
Ghi lại US_file_path với nội dung đã update (11 sections + frontmatter mới)
```

**Thông báo kết quả:**

```
═══════════════════════════════════════════════════════════════
✅ USER STORY ĐÃ CẬP NHẬT THÀNH CÔNG!

📄 File: {US_file_path}

📊 Thống kê update:
   Version:         {old_version} → {new_version}
   Impact Level:    {LOW / MEDIUM / HIGH}
   Sections updated: {N} sections
   
📝 Tóm tắt thay đổi:
   {change_summary}

📋 Change Log mới nhất:
   | {version} | {date} | {author} | {icon} {summary} |

⏭  Bước tiếp theo gợi ý:
   • Chạy /vnr-ba-us-check để validate US sau update
   • Review lại Traceability matrices (Section 10)
   • Nếu đã sẵn sàng → map sang PBI với /vnr-ba-pbi-compose
═══════════════════════════════════════════════════════════════
```

---

## Ví dụ thực tế

### Ví dụ 1: LOW Impact — Sửa VM message

**BA input:**
```
update us ATT-E01-F02-U003 sửa VM-E01 thành "Tên ca không được để trống"
```

**Workflow:**

```
Step U1: Load US ATT-E01-F02-U003 v1.2 ✓
Step U2: Phân tích
   - Section: 7 (VM)
   - Impact: LOW (chỉ sửa 1 VM, không có side effects)
Step U3: SKIP (LOW impact)
Step U4: SKIP (không cần approve)
Step U5: Apply
   - Update VM-E01 trong Section 7
Step U6: Version bump
   - 1.2 → 1.3 (minor)
   - Change Log: "✏️ Sửa VM-E01: cập nhật message"
Step U7: Ghi file ✓

Thời gian: 10-15 giây
```

---

### Ví dụ 2: MEDIUM Impact — Thêm validation

**BA input:**
```
update us ATT-E01-F02-U003 thêm validation: Tên ca tối đa 100 ký tự
```

**Workflow:**

```
Step U1: Load US ATT-E01-F02-U003 v1.2 ✓
Step U2: Phân tích
   - Section: 6 (BR) — thêm BR mới
   - Impact: MEDIUM (có side effects)
Step U3: Detect side effects
   - Cần thêm BR-U005: "Tên ca tối đa 100 ký tự"
   - Cần thêm VM-E04: "Tên ca không được vượt quá 100 ký tự"
   - Cần update AC-002: thêm scenario validation length
   - Cần update Data Dictionary: thêm ràng buộc "Tối đa 100 ký tự"
   - Cần update Traceability matrices
Step U4: Đề xuất thay đổi
   [Hiển thị đề xuất với preview 5 sections]
   BA approve: (a) Approve tất cả ✓
Step U5: Apply
   - Thêm BR-U005 vào Section 6
   - Thêm VM-E04 vào Section 7
   - Update AC-002 trong Section 3
   - Update Data Dictionary trong Section 5
   - Re-generate Traceability trong Section 10
Step U6: Version bump
   - 1.2 → 1.3 (minor)
   - Change Log: "🆕 Thêm validation Tên ca max 100 ký tự (BR-U005, VM-E04, AC-002)"
Step U7: Ghi file ✓

Thời gian: 1-2 phút
```

---

### Ví dụ 3: HIGH Impact — Thêm nhiều AC

**BA input:**
```
update us ATT-E01-F02-U003 thêm 5 AC cho edge cases: kỳ công lệch, nhân viên điều chuyển, ngày lễ, kỳ bắt đầu giữa tuần, kỳ kéo dài qua năm mới
```

**Workflow:**

```
Step U1: Load US ATT-E01-F02-U003 v1.2 ✓
Step U2: Phân tích
   - Section: 3 (AC) — thêm 5 AC mới
   - Impact: HIGH (>5 sections ảnh hưởng)
Step U3: SKIP
Step U4: Cảnh báo HIGH impact
   "⚠️ Thêm 5 AC mới sẽ ảnh hưởng lớn. Khuyến nghị chạy lại workflow đầy đủ."
   BA chọn: (a) Chạy lại workflow đầy đủ ✓
   
→ STOP UPDATE_US workflow
→ REDIRECT sang workflow chính (Step 00-08):
   - Load US hiện tại làm base
   - Skip Step 00-02 (giữ nguyên Statement, Business Context)
   - Re-run Step 03 (Write AC) — BA approve AC mới
   - Re-run Step 04-08 (Activity Diagram, Data Dictionary, BR, VM, UI, Traceability)
   - Version bump: 1.2 → 2.0 (major)
   - Change Log: "🔄 Refactor: Thêm 5 AC cho edge cases, cập nhật toàn bộ sections liên quan"

Thời gian: 3-5 phút
```

---

## Kết luận

UPDATE_US workflow với **Smart Patch approach** cung cấp:

✅ **Cân bằng tốc độ và quality** — không quá nhanh (mất consistency) không quá chậm (re-run toàn bộ)  
✅ **Tự động detect side effects** — BA không cần lo thiếu sót  
✅ **BA approve trước khi apply** — kiểm soát thay đổi  
✅ **Maintain traceability** — ma trận AC↔BR↔VM luôn đúng  
✅ **Version bump thông minh** — minor cho small, major cho big  

**Lựa chọn phù hợp:**
- **LOW impact:** 10-15 giây (không cần approve)
- **MEDIUM impact:** 1-2 phút (có approve)
- **HIGH impact:** Khuyến nghị re-run full workflow (3-5 phút)
