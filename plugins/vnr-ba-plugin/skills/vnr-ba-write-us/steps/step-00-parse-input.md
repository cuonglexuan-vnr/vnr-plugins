# Step 00 — Parse Input & Detect Command Type

## Mục tiêu

Phân tích input từ BA để xác định loại lệnh và extract thông tin cần thiết. Skill hỗ trợ 4 loại lệnh linh hoạt, không bắt buộc phải có FEAT ID trước.

---

## 📐 4 Loại Lệnh

| Lệnh | Mô tả | Output cần extract |
|---|---|---|
| `write us [mô tả]` | Viết US mới từ mô tả nghiệp vụ tự do | Actor, Task, Context nghiệp vụ |
| `write us from analyze [ID]` | Viết US từ kết quả phân tích trước đó | Analyze ID, Actor-Task Matrix |
| `write us from wireframe [URL]` | Viết US từ wireframe/mockup | URL wireframe/image |
| `update us [US_ID] [thay đổi]` | Cập nhật US hiện có (tăng version) | US ID, Nội dung thay đổi |

---

## Hành động: Phân loại lệnh

### 🔍 Detection Logic

Đọc input từ BA và detect pattern:

1. **Nếu chứa `"update us"` hoặc `"cập nhật us"`:**
   - Loại lệnh: `UPDATE_US`
   - Extract: US_ID (format: `{MOD}-E{NN}-F{NN}-U{NN}`) và nội dung thay đổi
   - **Workflow riêng** - không chạy step 01-08, chỉ load US cũ → apply changes → tăng version → ghi lại

2. **Nếu chứa `"from wireframe"` hoặc URL/path ảnh:**
   - Loại lệnh: `FROM_WIREFRAME`
   - Extract: URL hoặc file path
   - **Gợi ý:** "Để viết US từ wireframe, tôi cần gọi skill `ba-wireframe` trước. Skill này sẽ phân tích UI và trích xuất Actor-Task. Bạn có muốn tôi gọi `ba-wireframe` ngay không?"
   - **Nếu BA đồng ý:** Gọi skill ba-wireframe → lấy kết quả → chuyển sang step 01

3. **Nếu chứa `"from analyze"` hoặc có Analyze ID:**
   - Loại lệnh: `FROM_ANALYZE`
   - Extract: Analyze ID
   - **Gợi ý:** "Bạn cung cấp đường dẫn hoặc ID của kết quả analyze để tôi load Actor-Task Matrix?"
   - **Load từ file:** Đọc kết quả analyze (thường lưu tại `Module/{MOD}/Analysis/{ID}.md` hoặc tương tự)
   - Extract: Actor, Task, Business Context từ analyze output
   - Chuyển sang step 01

4. **Nếu là mô tả nghiệp vụ tự do (không khớp pattern trên):**
   - Loại lệnh: `FROM_DESCRIPTION`
   - Extract: Toàn bộ mô tả nghiệp vụ
   - **Phân tích tự động:**
     - Nhận diện Actor (Ai thực hiện? Vai trò nào?)
     - Nhận diện Task (Làm gì? Hành động chính?)
     - Nhận diện Context (Tại sao? Mục đích?)
   - Chuyển sang step 01

---

## Output Step 00

### Case 1: UPDATE_US

```
════════════════════════════════════════════════════════════
✓ DETECTED: CẬP NHẬT US HIỆN CÓ

📌 US ID: {US_ID}
📝 Thay đổi: {mô tả thay đổi}

⚠️  Workflow riêng - không chạy step 01-08 đầy đủ
→ Load US cũ → Apply changes → Tăng version → Update Change Log
════════════════════════════════════════════════════════════
```

**Hành động tiếp theo:** 
1. Đọc file US hiện tại tại `Module/{MOD}/Epics/{EPIC}/Features/{FEAT}/UserStories/{US_ID}.md`
2. Parse version hiện tại (ví dụ: 1.2 → 1.3)
3. Apply thay đổi theo yêu cầu BA
4. Thêm entry vào Change Log (section 11)
5. Ghi lại file

---

### Case 2: FROM_WIREFRAME

```
════════════════════════════════════════════════════════════
✓ DETECTED: VIẾT US TỪ WIREFRAME

🖼️  Wireframe URL/Path: {url}

⚠️  Cần gọi skill `ba-wireframe` trước để phân tích UI
════════════════════════════════════════════════════════════

Tôi sẽ gọi skill `ba-wireframe` để:
1. Phân tích wireframe/mockup
2. Trích xuất Actor-Task từ UI elements
3. Nhận diện business context từ screen layout

Sau khi có kết quả, tôi sẽ chuyển sang Step 01 để viết US.
```

**Hành động tiếp theo:**
1. Hỏi BA xác nhận gọi `ba-wireframe`
2. Nếu đồng ý: invoke skill (syntax tùy thuộc vào cách implement ba-wireframe)
3. Nhận output từ ba-wireframe → extract Actor, Task, Context
4. Chuyển sang step 01 với context đã extract

---

### Case 3: FROM_ANALYZE

```
════════════════════════════════════════════════════════════
✓ DETECTED: VIẾT US TỪ KẾT QUẢ ANALYZE

🔍 Analyze ID: {ID}

⚠️  Tôi cần đường dẫn file kết quả analyze để load Actor-Task Matrix
════════════════════════════════════════════════════════════

Bạn cung cấp:
# Set {MOD} to your module code (e.g., ATT, HRM, PAY)
- Đường dẫn file analyze (ví dụ: `Module/{MOD}/Analysis/ANALYZE-001.md`)
- Hoặc ID analyze (tôi sẽ tìm theo naming convention)
```

**Hành động tiếp theo:**
1. Hỏi BA cung cấp đường dẫn hoặc ID
2. Đọc file kết quả analyze
3. Parse và extract:
   - Actor-Task Matrix (section chứa bảng Actor - Task)
   - Business Context (mô tả nghiệp vụ tổng quan)
   - Edge Cases (nếu có)
4. Lưu vào session context
5. Chuyển sang step 01 với context đã load

---

### Case 4: FROM_DESCRIPTION

```
════════════════════════════════════════════════════════════
✓ DETECTED: VIẾT US TỪ MÔ TẢ NGHIỆP VỤ

📝 Mô tả nhận được:
"{mô tả BA cung cấp}"

🤖 Phân tích tự động:
- Actor: {detected actor}
- Task: {detected task}
- Context: {detected purpose/goal}
════════════════════════════════════════════════════════════

Tôi sẽ sử dụng thông tin này để viết US. Nếu cần bổ sung, tôi sẽ hỏi thêm trong quá trình viết.
```

**Phân tích tự động:**
1. **Detect Actor:**
   - Tìm keyword: "HR Admin", "Nhân viên", "Quản lý", "User", v.v.
   - Nếu không rõ: giả định Actor = "Người dùng" (general)

2. **Detect Task:**
   - Tìm động từ chính: "Tạo", "Xem", "Sửa", "Xóa", "Gửi", "Duyệt", v.v.
   - Extract đối tượng: "ca làm việc", "nhân viên", "báo cáo", v.v.
   - Format: `[Động từ] + [Đối tượng]`

3. **Detect Context/Goal:**
   - Tìm cụm từ chỉ mục đích: "để", "nhằm", "giúp", v.v.
   - Nếu không có: phỏng đoán từ Task (ví dụ: "Tạo ca làm việc" → "Để quản lý lịch làm việc của nhân viên")

**Hành động tiếp theo:**
- Lưu Actor, Task, Context vào session
- Chuyển sang step 01 (không cần FEAT ID - sẽ tạo US standalone hoặc hỏi BA sau)

---

## Session Context Variables

Sau khi hoàn thành Step 00, lưu vào session:

```json
{
  "command_type": "FROM_DESCRIPTION | FROM_ANALYZE | FROM_WIREFRAME | UPDATE_US",
  "actor": "...",
  "task": "...",
  "context": "...",
  "feat_id": "... (optional)",
  "us_id": "... (nếu là UPDATE_US)",
  "change_description": "... (nếu là UPDATE_US)",
  "wireframe_url": "... (nếu là FROM_WIREFRAME)",
  "analyze_id": "... (nếu là FROM_ANALYZE)"
}
```

---

## Chuyển tiếp

- **FROM_DESCRIPTION, FROM_ANALYZE, FROM_WIREFRAME:** 
  - Chuyển sang `step-01-load-context.md` (hoặc `step-00a-generate-metadata.md` nếu rename step-00-generate-metadata)
  
- **UPDATE_US:**
  - Workflow riêng biệt - không theo 8 step chuẩn
  - Load US cũ → Apply changes → Save

---

## Ví dụ thực tế

### Ví dụ 1: Mô tả tự do
**BA input:** "Tôi muốn viết US cho HR Admin tạo ca làm việc mới"

**Output:**
```
✓ DETECTED: FROM_DESCRIPTION
- Actor: HR Admin
- Task: Tạo ca làm việc mới
- Context: Để quản lý lịch làm việc của nhân viên

→ Chuyển sang Step 01
```

---

### Ví dụ 2: From Analyze
**BA input:** "write us from analyze ANALYZE-ATT-001"

**Output:**
```
✓ DETECTED: FROM_ANALYZE
- Analyze ID: ANALYZE-ATT-001

Tôi cần đường dẫn file kết quả. Bạn có thể cho tôi biết file này lưu ở đâu?
(Hoặc tự động tìm theo convention: Module/{MOD}/Analysis/ANALYZE-{MOD}-001.md)
```

---

### Ví dụ 3: Update US
**BA input:** "update us ATT-E01-F02-U003 thêm validation cho trường Tên ca"

**Output:**
```
✓ DETECTED: UPDATE_US
- US ID: ATT-E01-F02-U003
- Thay đổi: Thêm validation cho trường Tên ca

→ Load US → Apply change → Version 1.0 → 1.1
```

---

## Xử lý lỗi và fallback

### Bảng xử lý lỗi parse

| Lỗi | Detection | Hành động |
|-----|-----------|-----------|
| **Thiếu mô tả** | `write us` (không có text sau) | Hỏi BA: "Bạn muốn viết US cho **ai** (Actor) làm **gì** (Task) **để** làm gì (Purpose)?<br>Ví dụ: `write us HR Admin tạo ca làm việc mới`" |
| **Analyze ID không hợp lệ** | `write us from analyze XYZ` (ID không tồn tại) | 1. Tự động tìm theo pattern `Module/*/Analysis/ANALYZE-*.md`<br>2. Nếu không tìm thấy → Hỏi BA: "Tôi không tìm thấy ANALYZE-{ID}. Bạn có thể cung cấp đường dẫn file hoặc kiểm tra lại ID?" |
| **Wireframe URL không truy cập** | `write us from wireframe <404>` | Hỏi BA: "URL wireframe không truy cập được hoặc file không tồn tại. Bạn kiểm tra lại?<br>- Nếu là file local: cung cấp đường dẫn tuyệt đối<br>- Nếu là URL: đảm bảo public hoặc có quyền truy cập" |
| **US_ID không tồn tại** | `update us ATT-E01-F02-U999 ...` | Tìm file theo pattern `Module/*/Epics/*/Features/*/Stories/{US_ID}.md`<br>Nếu không tìm thấy → Hỏi BA: "US này chưa tồn tại. Bạn có muốn:<br>(a) Tạo US mới thay vì update<br>(b) Kiểm tra lại US ID" |
| **US_ID format sai** | `update us INVALID-ID ...` | Hỏi BA: "US ID không đúng format. Format đúng: `{MOD}-E{NN}-F{NN}-U{NN}`<br>Ví dụ: `ATT-E01-F02-U003`" |
| **Mô tả thay đổi quá mơ hồ** | `update us ATT-E01-F02-U003 sửa lại` | Hỏi BA: "Bạn muốn sửa **phần nào** của US này?<br>- AC (Acceptance Criteria)<br>- BR (Business Rules)<br>- VM (Validation Messages)<br>- UI/UX<br>- Metadata<br>- Hoặc mô tả cụ thể hơn?" |
| **Parse không xác định được loại** | Input không khớp pattern nào | Hiển thị hướng dẫn:<br>"Tôi không hiểu lệnh này. Vui lòng dùng một trong các format sau:<br>1. `write us [mô tả]` - Viết US mới<br>2. `write us from analyze [ID]` - Từ kết quả analyze<br>3. `write us from wireframe [URL]` - Từ wireframe<br>4. `update us [US_ID] [thay đổi]` - Cập nhật US" |

---

## Tự động chuyển sang Step tiếp theo

Sau khi detect xong **VÀ xử lý xong lỗi** (nếu có), **KHÔNG** đợi BA confirm - tự động chuyển sang:
- Case 1-3 (FROM_DESCRIPTION, FROM_ANALYZE, FROM_WIREFRAME): Load `./steps/step-00-generate-metadata.md` (Step 00a) để tạo metadata trước
- Case 4 (UPDATE_US): Load `./workflows/update-us-workflow.md` để thực thi workflow update riêng (không chạy step 00a-08)
