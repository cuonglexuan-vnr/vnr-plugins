# Step 05b — Viết Business Rules (BR-U)

## Mục tiêu

Viết Business Rules cấp US (BR-U) kế thừa và chuyên biệt hóa từ BR-F của FEAT cha. Toàn bộ phải dùng ngôn ngữ nghiệp vụ — tuyệt đối không có từ kỹ thuật.

---

## Hành động B1: Naming Convention & Module Code

**Format bắt buộc:** `BR_{Module}_{US}_{Number}` — {Short Description}

**Quy tắc đánh số:**
- `{Module}`: Mã module viết tắt (lấy từ EPIC/FEAT) — VD: `GNE`, `IDP`, `ATT`
- `{US}`: Mã User Story — VD: `U01`, `U06`, `U12`
- `{Number}`: Số thứ tự 2 chữ số — VD: `01`, `02`, `15`

**🔍 Cách lấy Module Code:**

1. **Ưu tiên 1:** Tìm trong FEAT document → Section "Metadata" hoặc "Feature Code"
2. **Ưu tiên 2:** Lấy từ EPIC document → Section "EPIC Code" hoặc "Module Code"
3. **Ưu tiên 3:** Nếu không có → tự đặt theo quy tắc:
   - Lấy chữ cái đầu của tên module (2-4 ký tự, viết HOA)
   - Ví dụ: "Đánh Giá Năng Lực" → `GNE` (General Evaluation)
   - Ví dụ: "Kế Hoạch Phát Triển Cá Nhân" → `IDP` (Individual Development Plan)
   - Ví dụ: "Quản Lý Chấm Công" → `ATT` (Attendance)

**Kiểm tra trùng Module Code:** Trước khi dùng, tìm kiếm `BR_{Module}_` trong toàn bộ US đã viết để đảm bảo không trùng.

**Ví dụ:**
- `BR_GNE_U06_01` — 8 Fields cố định, 3 bắt buộc
- `BR_IDP_U03_05` — Validation: File chỉ chấp nhận PDF
- `BR_ATT_U12_08` — Toggle "Hiển thị OT" → Ẩn cột Overtime

---

## Hành động B2: Phân loại BR (5 loại)

Mỗi BR phải thuộc **1 trong 5 loại** sau. Nếu 1 BR có nhiều tính chất, chọn loại **chính** nhất.

### 🧭 Decision Tree: Chọn loại BR

```
BẮT ĐẦU
│
├─ BR mô tả công thức tính toán / workflow / If-Then logic?
│  └─ YES → Business Logic Rules (3️⃣)
│
├─ BR mô tả ràng buộc input (file type, size, range, format)?
│  └─ YES → Validation Rules (2️⃣)
│
├─ BR mô tả Toggle/Checkbox ảnh hưởng hiển thị vùng khác?
│  └─ YES → UI State Rules (5️⃣)
│
├─ BR mô tả trường load từ US/API khác hoặc phụ thuộc feature chưa có?
│  └─ YES → Dependency Rules (4️⃣)
│
└─ BR mô tả tham số cố định / enum / giới hạn số lượng / giá trị mặc định?
   └─ YES → Configuration Rules (1️⃣)
```

**Trường hợp khó phân loại:**

| Trường hợp | Ví dụ | Chọn loại | Lý do |
|------------|-------|-----------|-------|
| BR vừa là Config vừa là Validation | "Email bắt buộc, max 100 ký tự" | **Validation (2️⃣)** | Ưu tiên validation hơn config |
| BR vừa là Toggle vừa là Validation | "Nếu Toggle X = ON thì Y bắt buộc" | **UI State (5️⃣)** | Ưu tiên UI State vì có điều kiện toggle |
| BR vừa là Logic vừa là Validation | "Ngày A < Ngày B (dùng trong công thức)" | **Validation (2️⃣)** | Nếu là ràng buộc input → Validation; nếu là phần của công thức → Logic |
| BR vừa là Dependency vừa là Config | "Dropdown có 3 giá trị cố định từ enum" | **Config (1️⃣)** | Không phụ thuộc US/API khác → Config |

---

### 1️⃣ Configuration Rules (Quy tắc cấu hình)

**Dùng khi:** Mô tả tham số cố định, giới hạn số lượng, danh sách enum, giá trị mặc định...

**Template:**
```markdown
### BR_{Module}_{US}_{Number} — {Config name}
- {Config 1}: {Value/Constraint}
- {Config 2}: {Value/Constraint}
- {Config N}: {Value/Constraint}

*(Trace: [Kế thừa BR-F{ID} | Specialise BR-F{ID} | BR mới])*
```

**Ví dụ:**
```markdown
### BR_GNE_U06_01 — 8 Fields cố định, 3 bắt buộc
- Section 6 chỉ có **8 fields cố định**: Họ tên, Mã NV, Phòng ban, Chức danh, Email, SĐT, Ngày vào, Người quản lý
- **3 fields bắt buộc** luôn được chọn và không cho phép bỏ chọn: Họ tên, Mã NV, Phòng ban
- **5 fields tùy chọn** cho phép bật/tắt: Chức danh, Email, SĐT, Ngày vào, Người quản lý

*(Trace: BR mới — không có tương ứng tại FEAT cha)*
```

---

### 2️⃣ Validation Rules (Quy tắc kiểm tra)

**Dùng khi:** Mô tả ràng buộc input (file type, max size, range, format, regex...)

**Template:**
```markdown
### BR_{Module}_{US}_{Number} — Validation: {Rule}
- {Field/Condition}: {Constraint}
- {Field/Condition}: {Constraint}

*(Trace: [Kế thừa BR-F{ID} | Specialise BR-F{ID} | BR mới])*
```

**Ví dụ:**
```markdown
### BR_GNE_U06_03 — Logo file validation
- Accept: .png, .jpg, .jpeg
- Max size: 2MB
- Preview: Thumbnail 100x100px

*(Trace: Kế thừa BR-F012)*
```

```markdown
### BR_IDP_U03_02 — Validation: Ngày bắt đầu < Ngày kết thúc
- Trường "Ngày bắt đầu" phải nhỏ hơn "Ngày kết thúc"
- Nếu vi phạm: Hiển thị lỗi "Ngày bắt đầu phải trước Ngày kết thúc"

*(Trace: Kế thừa BR-F005)*
```

---

### 3️⃣ Business Logic Rules (Logic nghiệp vụ)

**Dùng khi:** Mô tả công thức tính toán, điều kiện If-Then, workflow, status transition...

**Template:**
```markdown
### BR_{Module}_{US}_{Number} — {Logic name}
- **Formula**: {Math expression}
- **Condition**: {If-Then logic}
- **Workflow**: {Step 1 → Step 2 → Step 3}

*(Trace: [Kế thừa BR-F{ID} | Specialise BR-F{ID} | BR mới])*
```

**Ví dụ:**
```markdown
### BR_GNE_U06_15 — Công thức tính điểm
- **TB** = (TB_QuanLy × 50%) + (TB_DongNghiep × 30%) + (TB_CapDuoi × 20%) + (CaNhan × 0%)
- **Tỉ lệ đạt** = (TB / Cấp độ YC) × 100%
- **Điểm tiêu chí** = Tỉ lệ đạt × Trọng số TC × 100
- **Điểm nhóm** = Σ(Điểm TC trong nhóm) × Trọng số nhóm
- **Điểm tổng** = Σ(Điểm nhóm)

*(Trace: Kế thừa BR-F020 — công thức gốc từ FEAT cha)*

**Note:** BR_GNE_U06_15 chỉ mô tả công thức, không thuộc phạm vi cấu hình UI của U06.
```

---

### 4️⃣ Dependency Rules (Phụ thuộc US/API)

**Dùng khi:** Trường dữ liệu load từ US khác, API khác, hoặc phụ thuộc feature chưa có

**Template:**
```markdown
### BR_{Module}_{US}_{Number} — {Dependency name}
- {Field} load từ **{US}** ({US ID})
- Nguồn dữ liệu: [US ID | API endpoint - Dev sẽ bổ sung]
- Nếu {US} chưa có dữ liệu → {Empty state behavior}

*(Trace: [Kế thừa BR-F{ID} | Specialise BR-F{ID} | BR mới])*
```

**Lưu ý:** BA chỉ cần ghi "Nguồn dữ liệu: US ID" hoặc "Nguồn dữ liệu: Hệ thống bên ngoài". Dev sẽ bổ sung API endpoint sau.

**Ví dụ:**
```markdown
### BR_GNE_U06_04 — Nhóm cấp độ dependency
- Dropdown "Nhóm cấp độ" (Section 8) load từ **U10** (GNE-E01-F01-U10)
- Nguồn dữ liệu: U10 - Dev bổ sung API endpoint
- Nếu U10 chưa có dữ liệu → Empty state + link tạo mới

*(Trace: BR mới — phụ thuộc US khác trong cùng FEAT)*
```

---

### 5️⃣ UI State Rules (Quy tắc trạng thái UI)

**Dùng khi:** Toggle/Checkbox ảnh hưởng đến hiển thị/disable các vùng khác, hoặc conditional rendering

**Template:**
```markdown
### BR_{Module}_{US}_{Number} — Toggle/Checkbox {Field} → {Effect}
- Nếu Toggle/Checkbox "{Name}" = {State}
  → **{Region/Field}** bị {ẩn/không cho phép sửa/hiển thị}

*(Trace: [Kế thừa BR-F{ID} | Specialise BR-F{ID} | BR mới])*
```

**Ví dụ:**
```markdown
### BR_GNE_U06_09 — Toggle Section 8 → Ẩn Region 5
- Nếu Toggle "Hiển thị Kết quả tổng hợp" (Section 8) = OFF
  → **Region 5** (Kết quả tổng hợp) bị ẩn trong U08 (Tab Kết quả)

*(Trace: Specialise BR-F018 — thêm điều kiện: chỉ áp dụng cho role Manager)*
```

```markdown
### BR_ATT_U12_05 — Toggle "Cho phép OT" → Disable trường Giờ OT
- Nếu Toggle "Cho phép OT" = OFF
  → Trường "Giờ OT" bị không cho phép nhập (màu xám, bị khóa)

*(Trace: BR mới)*
```

---

## Hành động B3: Trace về BR-F (FEAT cha)

**Mỗi BR-U phải có ghi chú trace:**

| Trace type | Ý nghĩa | Format ghi chú |
|---|---|---|
| **Kế thừa BR-F{ID}** | Áp dụng nguyên trạng BR-F | `*(Trace: Kế thừa BR-F{ID})*` |
| **Specialise BR-F{ID}** | Kế thừa + thêm điều kiện cụ thể | `*(Trace: Specialise BR-F{ID} — {mô tả sự khác biệt})*` |
| **BR mới** | Không có tương ứng tại FEAT cha | `*(Trace: BR mới — {lý do phát sinh})*` |

---

## Hành động B4: Phân biệt BR vs AC — Khi nào dùng gì?

| **BR (Business Rule)** | **AC (Acceptance Criteria)** |
|------------------------|------------------------------|
| Mô tả **WHAT** (quy tắc là gì) | Mô tả **HOW** (UI/UX implement như thế nào) |
| Không có Given-When-Then | Có Given-When-Then |
| Dùng cho: Công thức, Constraint, Logic, Dependency | Dùng cho: User interaction, UI behavior, Flow |
| Ví dụ: "TB = 50% Quản lý + 30% Đồng nghiệp" | Ví dụ: "When Admin click [Lưu], Then hiển thị toast 'Lưu thành công'" |
| **Ngôn ngữ nghiệp vụ thuần túy** | **Ngôn ngữ UI/UX (button, form, toast...)** |

**💡 Best Practice:**
1. **BR trước, AC sau** — BR định nghĩa rule → AC verify rule
2. **Mỗi BR phải được ít nhất 1 AC cover** — đảm bảo rule được test
3. **BR có thể reuse** cho nhiều US (VD: Công thức tính điểm dùng chung)
4. **Nếu không chắc viết BR hay AC:**
   - Có công thức/constraint/logic → viết BR
   - Có Given-When-Then → viết AC
   - Mô tả user interaction → viết AC
   - Mô tả rule không phụ thuộc UI → viết BR

---

## Hành động B5: Kiểm tra Coverage (BR ↔ AC)

**Sau khi viết xong BR, rà soát AC đã viết ở Step 03:**

1. **Chiều 1 — BR → AC:** Mỗi BR phải được ít nhất 1 AC cover
2. **Chiều 2 — AC → BR:** Mỗi constraint/validation trong AC phải có BR tương ứng

**Checklist (2 chiều):**

```markdown
### Coverage Check: BR → AC

| BR ID | Mô tả BR | AC cover | Ghi chú |
|---|---|---|---|
| BR_IDP_U03_01 | 8 Fields cố định | AC-001, AC-002 | ✅ Đủ |
| BR_IDP_U03_02 | Ngày bắt đầu < Ngày kết thúc | AC-005 | ✅ Đủ |
| BR_IDP_U03_03 | Logo file validation | — | ❌ Thiếu AC → Cần bổ sung AC |

### Coverage Check: AC → BR

| AC ID | Mô tả AC (chỉ phần có rule) | BR tương ứng | Ghi chú |
|---|---|---|---|
| AC-001 | "Phải điền đầy đủ 3 fields bắt buộc" | BR_IDP_U03_01 | ✅ Đủ |
| AC-005 | "Ngày bắt đầu phải < Ngày kết thúc" | BR_IDP_U03_02 | ✅ Đủ |
| AC-010 | "Email phải có @" | — | ❌ Thiếu BR → Cần bổ sung BR |
```

**Nếu phát hiện thiếu:** 
- Thiếu AC → Bổ sung AC tương ứng ở Step 03
- Thiếu BR → Bổ sung BR tương ứng ngay tại Step 05b

---

## Hành động B6: Validate trùng ID BR

**Trước khi hoàn thành Step 05b, kiểm tra trùng ID:**

1. Tìm kiếm `BR_{Module}_{US}_` trong toàn bộ US đã viết
2. Nếu phát hiện trùng → đổi `{Number}` (VD: `01` → `02`)
3. Ghi chú vào file: `<!-- BR ID checked: No conflict -->`

---

## Hành động B7: Gợi ý phát triển tương lai (bắt buộc)

**Bắt buộc** phải có **ít nhất 2 mục**, khuyến nghị 2-3 mục "Gợi ý phát triển tương lai":

```markdown
## Gợi ý phát triển tương lai

- **Gợi ý 1:** [Mô tả tính năng hoặc quy tắc có thể bổ sung trong tương lai]
- **Gợi ý 2:** [Mô tả tính năng hoặc quy tắc có thể bổ sung trong tương lai]
- **Gợi ý 3 (optional):** [Mô tả tính năng hoặc quy tắc có thể bổ sung]
```

**Gợi ý phải:**
- Liên quan đến nghiệp vụ của US này
- Không phải yêu cầu hiện tại (nằm ngoài scope US)
- Cụ thể và có giá trị nghiệp vụ rõ ràng
- **Tối thiểu 2 mục, tối đa 5 mục**

---

## Tự validate — Kiểm tra "Zero Kỹ thuật"

Quét toàn bộ nội dung Business Rules vừa viết. Tìm các từ kỹ thuật cấm:

**Danh sách từ cấm:**
```
API, endpoint, HTTP, GET, POST, PUT, DELETE,
database, DB, table, column, schema,
component, interface, DTO, Command, Query, Handler,
Service, Controller, Repository,
async, await, token, JWT,
string, integer, boolean, null, array, enum (trong context lập trình),
checked, unchecked, enabled, visible, hidden (trong context lập trình)
```

**⚠️ Ngoại lệ đặc biệt cho UI State Rules:**

Trong **UI State Rules (5️⃣)** được phép dùng:
- ✅ **Toggle, Checkbox, Dropdown** — "Nếu Toggle X = ON/OFF"
- ✅ **ẩn / hiển thị / không cho phép sửa / bị khóa** — "Vùng Y bị ẩn"

**❌ Vẫn cấm:**
- `disabled`, `enabled`, `checked`, `unchecked`, `hidden`, `visible` → Dùng từ nghiệp vụ
- `component`, `state`, `render`, `props` → Tuyệt đối không dùng

---

## Kết quả đầu ra Step 05b

Hiển thị tóm tắt Business Rules đã tạo:

```
════════════════════════════════════════════════════════════
✓ HOÀN THÀNH STEP 05b — BUSINESS RULES

📏 BUSINESS RULES — US [{US-ID}]
════════════════════════════════════
Tổng số BR-U: [{N} rules]

Phân theo loại:
├─ Configuration Rules: [{M}]
├─ Validation Rules: [{P}]
├─ Business Logic Rules: [{Q}]
├─ Dependency Rules: [{R}]
└─ UI State Rules: [{S}]

Danh sách BR-U:
[Hiển thị danh sách với trace về BR-F]

💡 Gợi ý phát triển tương lai: [{N} gợi ý]
[Gợi ý phát triển]

✓ Kiểm tra Zero Kỹ thuật: PASSED
✓ Coverage check: [{N} BR được cover bởi {M} AC | {P} AC được cover bởi {Q} BR]
✓ Validate trùng ID: No conflict
════════════════════════════════════
════════════════════════════════════════════════════════════
```

**Tự động chuyển sang Step 05c** — đọc và thực thi: `./steps/step-05c-write-validation-messages.md`
