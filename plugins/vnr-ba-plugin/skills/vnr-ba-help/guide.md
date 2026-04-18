# BA Agent Toolkit — Hướng dẫn toàn diện

> Phiên bản: 2.0 | Cập nhật: 2026-04-13

---

## PHẦN 1 — BẢN ĐỒ AGENT

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         BA AGENT TOOLKIT — HRM Successor                    ║
╠══════════════╦══════════════════╦════════════════╦════════════╦═════════════╣
║  KHÁM PHÁ   ║    CẤU TRÚC     ║    VIẾT US     ║  CHẤT LƯỢNG ║  CHUYỂN GIAO ║
╠══════════════╬══════════════════╬════════════════╬════════════╬═════════════╣
║              ║                  ║                ║            ║             ║
║ ba-researcher║   ba-story-map   ║                ║ ba-us-check║             ║
║              ║                  ║    ba-us       ║            ║ba-pbi-compose║
║              ║   ba-epic        ║                ║ ba-us-refine║            ║
║              ║                  ║                ║            ║             ║
║              ║   ba-feat        ║                ║ba-story-split            ║
║              ║                  ║                ║            ║             ║
╚══════════════╩══════════════════╩════════════════╩════════════╩═════════════╝
```

### Mối quan hệ giữa các agent

```
                    ┌─────────────┐
                    │ba-researcher│  (độc lập, chạy trước)
                    └──────┬──────┘
                           │ tạo research-brief → feed vào
                           ▼
              ┌────────────────────────┐
              │       ba-epic          │  (đọc research-brief)
              │  [6 steps nội bộ]      │
              └──────────┬─────────────┘
                         │ tạo EPIC + FEAT placeholders → trigger
                         ▼
              ┌────────────────────────┐
              │       ba-feat          │  (đọc EPIC)
              │  [5 steps nội bộ]      │──────────────────────┐
              └──────────┬─────────────┘                      │
                         │ tạo FEAT + Actor-Task Matrix       │ (nếu quá lớn)
                         │ → trigger                          ▼
                         ▼                         (tự đề xuất tách,
              ┌────────────────────────┐            cập nhật EPIC cha)
              │        ba-us           │
              │  [7 steps nội bộ]      │
              └──────────┬─────────────┘
                         │ tạo US file
                         ▼
         ┌───────────────┴──────────────┐
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌──────────────────┐
│  ba-us-check    │──PASS──► │  ba-pbi-compose  │
│  (validate)     │          │  (map sang PBI)  │
└────────┬────────┘          └──────────────────┘
         │ FAIL
         ▼
┌─────────────────┐
│  ba-us-refine   │  (bổ sung AC/BR/Data)
│  ba-story-split │  (tách US quá lớn)
└─────────────────┘
```

> **Chạy ngầm (nội bộ):** Mỗi agent chỉ gọi các *step files* của chính nó theo thứ tự — không gọi agent khác. Sự phối hợp giữa agents là do **BA điều phối**, không tự động.

---

## PHẦN 2 — NHÓM AGENT CHI TIẾT

---

### NHÓM 1: KHÁM PHÁ

---

#### 🔍 ba-researcher

**Một câu:** Research toàn bộ domain trước khi viết EPIC — để EPIC không thiếu edge case.

**Khi nào dùng:**
- Bắt đầu domain hoàn toàn mới (ví dụ: chưa ai làm module Chấm công)
- Muốn biết VN competitors xử lý vấn đề này thế nào
- Cần danh sách edge case thực tế từ thị trường

**Khi KHÔNG cần dùng:**
- BA đã có kinh nghiệm sâu trong domain đó
- Đang bổ sung FEAT nhỏ vào EPIC đã có

**Input:**
```
Domain: "Quản lý ca làm việc"
Module: ATT
Phân khúc: manufacturing + high-tech
```

**5 steps nội bộ:**
```
step-01: Đọc _product/ → hiểu định vị sản phẩm, phân khúc KH
step-02: WebSearch → VN competitors (MISA, Base.vn, CloudHRM, FPT IS)
         + International (Workday, SAP SF, BambooHR)
step-03: VN labor law, enterprise culture, operational patterns
step-04: Phát hiện 5+ edge cases phức tạp thường bị bỏ sót
step-05: Tổng hợp Research Brief → file output
```

**Output:**
```
Module/ATT/_discovery/research-quan-ly-ca-lam-viec.md
```
Chứa: Feature comparison matrix, VN context, 5+ edge cases, risk rating.

**Gọi agent khác:** Không — hoàn toàn độc lập.

**Ví dụ output (trích):**
```markdown
## Edge Cases thường bị bỏ sót
| Edge Case | Tần suất | Cách xử lý đề xuất |
|---|---|---|
| NV làm ca đêm vắt qua 2 ngày | Cao | US riêng cho tính giờ cross-midnight |
| Ca gãy (split shift: sáng + chiều) | Trung bình | BR riêng: tổng giờ nghỉ giữa ca |
| Đổi ca trong ngày hôm đó | Cao | Cần phê duyệt khẩn cấp → US riêng |
```

---

#### 🗺️ ba-story-map

**Một câu:** Từ notes phỏng vấn / pain points thô → tạo skeleton EPIC/FEAT có cấu trúc.

**Khi nào dùng:**
- BA vừa phỏng vấn stakeholder, có notes rời rạc chưa có cấu trúc
- Không biết scope sẽ ra bao nhiêu EPIC/FEAT
- Muốn visualize user journey trước khi đi vào chi tiết

**Khi KHÔNG cần dùng:**
- Đã có EPIC/FEAT rõ ràng → dùng ba-epic/vnr-ba-feat thẳng

**Input (1 trong 2):**
```
Option A: "Module/IDP/_discovery/us_candidates/" (folder chứa notes)
Option B: Paste text pain points trực tiếp vào chat
```

**Hành động nội bộ:**
```
1. Đọc input → trích xuất: Actor, Activity, Task, Value
2. Nhóm theo phương pháp Jeff Patton (Activities → Tasks → Stories)
3. Sắp xếp theo priority: Must / Should / Could
4. Đề xuất EPIC/FEAT grouping
5. Tạo skeleton files nếu BA đồng ý
```

**Output:**
```
Story Map grid (in chat để BA review)
+ Nếu confirm: EPIC/FEAT placeholder files
```

**Gọi agent khác:** Không. Sau khi chạy xong → BA chạy `/vnr-ba-epic` để điền nội dung.

**Ví dụ output:**
```
ACTIVITY     [Lập kế hoạch]        [Theo dõi]           [Đánh giá]
─────────────────────────────────────────────────────────────────────
Must         Tạo IDP mới           Cập nhật % tiến độ   Chấm điểm năm
             Chọn mục tiêu         Ghi nhận vướng mắc   Nhận xét QLTT

Should       Điều chỉnh mục tiêu   Hủy mục tiêu         Xem lịch sử

Could        Clone IDP năm trước   Nhắc nhở tự động     Export PDF

→ Đề xuất: IDP-E01 (3 FEAT), IDP-E02 (2 FEAT)
```

---

### NHÓM 2: CẤU TRÚC

---

#### 📋 ba-epic

**Một câu:** Tạo EPIC document đầy đủ — từ "domain là gì" đến "cần build những FEAT nào".

**Khi nào dùng:**
- Bắt đầu một business area mới cần định nghĩa scope toàn diện
- Cần tài liệu để align với stakeholder trước khi đi vào dev

**Input:**
```
Tên EPIC: "Kế hoạch phát triển cá nhân"
Module: IDP
Research brief: Module/IDP/_discovery/research-idp.md (nếu có)
```

**6 steps nội bộ:**
```
step-01: Đọc _product/ + research brief → load context
step-02: Phần I — Foundation (Định nghĩa, Stakeholders, As-Is)
step-03: Phần II — Strategy (Pain points, BPMN As-Is + To-Be, Metrics)
step-04: Phần III — Scope, Dependencies, Business Rules (BR-E)
step-05: Phần IV — Stakeholder-Capability Matrix → FEAT candidates
step-06: Phần V — Finalize: tạo file + FEAT placeholders + cập nhật _index
```

**Output:**
```
Module/IDP/Epics/IDP-E01_Ke_Hoach_Phat_Trien/
  README.md                         ← EPIC document đầy đủ (15 sections)
  Features/
    IDP-E01-F01_Tao_IDP/FEAT.md    ← placeholder (chưa nội dung)
    IDP-E01-F02_Phe_Duyet/FEAT.md  ← placeholder
    IDP-E01-F03_Tien_Do/FEAT.md    ← placeholder
Module/IDP/_index.md               ← cập nhật danh sách EPIC
```

**Core output — Stakeholder-Capability Matrix:**
```
| Stakeholder | Capability          | Edge Cases            | → FEAT        |
|-------------|---------------------|-----------------------|---------------|
| QLTT        | Tạo IDP cho NV      | NV đang nghỉ phép     | IDP-E01-F01   |
| QLTT        | Phê duyệt mục tiêu  | Phê duyệt nhiều cấp   | IDP-E01-F02   |
| Nhân viên   | Cập nhật tiến độ    | Điều chuyển giữa kỳ   | IDP-E01-F03   |
| Hệ thống    | Nhắc nhở deadline   | NV nghỉ phép dài hạn  | IDP-E01-F04   |
```

**Gọi agent khác:** Không. BA chạy xong → chạy `/vnr-ba-feat [FEAT-ID]` cho từng FEAT.

---

#### 🎯 ba-feat

**Một câu:** Đào sâu 1 FEAT từ EPIC — tạo Actor-Task Matrix làm seed cho ba-us.

**Khi nào dùng:**
- Có EPIC với FEAT placeholders, muốn điền nội dung cho từng FEAT

**Input:**
```
/vnr-ba-feat IDP-E01-F01
(agent tự tìm EPIC cha từ FEAT ID)
```

**5 steps nội bộ:**
```
step-01: Đọc EPIC cha → kế thừa BR-E, EAC, scope, edge cases của FEAT này
step-02: Mô tả Scope (IN/OUT) + vẽ BPMN Feature Flow (swimlane Mermaid)
step-03: Actor-Task Matrix (đây là output quan trọng nhất)
step-04: BR-F (specialise từ BR-E) + FAC (cascade từ EAC)
step-05: Finalize: tính FEAT ID, tạo file, cập nhật EPIC Section 13
```

**Output:**
```
Module/IDP/.../Features/IDP-E01-F01_Tao_IDP/FEAT.md
```

**Core output — Actor-Task Matrix:**
```
| Actor    | Task                      | Edge Cases            | → US ID          | Priority |
|----------|---------------------------|-----------------------|------------------|:--------:|
| QLTT     | Tạo IDP mới cho NV        | NV đang thử việc      | IDP-E01-F01-U01  | P1       |
| QLTT     | Chọn mục tiêu từ thư viện | Mục tiêu bị vô hiệu   | IDP-E01-F01-U02  | P1       |
| QLTT     | Thêm mentor tùy chỉnh     | Mentor ngoài hệ thống | IDP-E01-F01-U03  | P2       |
| Hệ thống | Gửi IDP cho NV ký xác nhận| NV không nhận thông báo| IDP-E01-F01-U04 | P1       |
```

**Tính năng đặc biệt — tự đề xuất tách:**
```
Nếu FEAT > 8-10 US candidates → agent cảnh báo:
"FEAT IDP-E01-F01 có vẻ quá lớn (~12 US). Đề xuất tách:
 • IDP-E01-F01: Tạo và khởi tạo IDP (6 US)
 • IDP-E01-F05: Mentor và phê duyệt (6 US) ← FEAT mới"
→ Nếu BA đồng ý: tự cập nhật EPIC Section 13 + feat_count
```

**Gọi agent khác:** Không trực tiếp. Sau khi xong → BA chạy `/vnr-ba-us` cho từng row Actor-Task.

---

### NHÓM 3: VIẾT US

---

#### 📝 ba-us

**Một câu:** Tạo 1 User Story hoàn chỉnh từ 1 row trong Actor-Task Matrix — 7 sections, zero kỹ thuật.

**Khi nào dùng:**
- Có FEAT với Actor-Task Matrix, muốn viết US cho từng actor-task

**Input:**
```
/vnr-ba-us
→ FEAT ID: IDP-E01-F01
→ Actor-Task: "QLTT — Tạo IDP mới cho NV"
```

**7 steps nội bộ:**
```
step-01: Load FEAT + EPIC + _product/ → nắm context đầy đủ
step-02: Viết US Statement (Là / Tôi muốn / Để + Out of Scope)
step-03: Viết Acceptance Criteria (Given/When/Then, ≥2 AC)
step-04: Vẽ Activity Diagram (Mermaid flowchart TD — không swimlane)
step-05: Data Dictionary + Business Rules BR-U (cascade từ BR-F)
step-06: UI/UX Mô tả (tên màn hình nghiệp vụ) + Tracking & Analytics
step-07: Zero Kỹ thuật check → tạo file → cập nhật FEAT (us_count + link)
```

**Output:**
```
Module/IDP/.../IDP-E01-F01_Tao_IDP/Stories/
  IDP-E01-F01-U01_Tao_IDP_Moi.md
```

**Cấu trúc US output:**
```markdown
# IDP-E01-F01-U01 — Tạo IDP mới cho nhân viên

## 1. User Story Statement
> Là Quản lý trực tiếp,
> Tôi muốn tạo kế hoạch phát triển cá nhân mới cho nhân viên,
> Để định hướng rõ lộ trình phát triển trong 12 tháng tới.

Out of Scope: Chỉnh sửa IDP đã gửi cho NV / Tạo IDP tập thể

## 2. Acceptance Criteria
- AC-01 (Tạo thành công):
  Given QLTT đang xem thông tin NV Nguyễn Văn A
  When QLTT chọn "Tạo IDP mới" và điền đủ: Chu kỳ, Loại IDP, ≥1 mục tiêu
  Then IDP lưu ở trạng thái "Nháp", NV nhận thông báo chờ ký xác nhận

- AC-02 (Thiếu mục tiêu):
  Given QLTT chưa thêm mục tiêu nào
  When QLTT chọn "Lưu"
  Then hệ thống hiển thị: "IDP phải có ít nhất 1 mục tiêu phát triển"

## 3. Activity Diagram    (Mermaid flowchart TD)
## 4. Data Dictionary     (bảng trường dữ liệu nghiệp vụ)
## 5. Business Rules      (BR-U01 kế thừa BR-F01, ...)
## 6. UI/UX Mô tả         (tên màn hình, layout, luồng điều hướng)
## 7. Tracking & Analytics (events nghiệp vụ)
```

**Gọi agent khác:** Không. Sau khi xong → BA chạy `/vnr-ba-us-check`.

---

### NHÓM 4: CHẤT LƯỢNG

---

#### ✅ ba-us-check

**Một câu:** Validate US theo 10 tiêu chí — chỉ báo cáo, không sửa. Gate trước khi compose PBI.

**Input:** `/vnr-ba-us-check IDP-E01-F01-U01`

**10 tiêu chí (không bỏ qua cái nào):**

| # | Tiêu chí | Yêu cầu tối thiểu |
|---|---|---|
| 1 | US Statement | Đủ 3 phần: Là / Tôi muốn / Để |
| 2 | Out of Scope | ≥ 1 mục |
| 3 | Acceptance Criteria | ≥ 2 AC, đúng Given/When/Then |
| 4 | Activity Diagram | Có Mermaid flowchart TD |
| 5 | Data Dictionary | ≥ 2 trường |
| 6 | Business Rules | ≥ 1 BR-U với mã số (BR-U01...) |
| 7 | Cascade trace | BR-U ghi "(Kế thừa BR-F0X)" |
| 8 | Zero Kỹ thuật | 0 từ cấm (API, DB, component...) |
| 9 | UI/UX Mô tả | Có tên màn hình nghiệp vụ |
| 10 | Frontmatter | status: Draft hoặc Ready |

**Output mẫu FAIL:**
```
══════════════════════════════════════════
US CHECK: IDP-E01-F01-U01
══════════════════════════════════════════
✅ PASS (8/10):
   [1] US Statement — OK
   [2] Out of Scope — OK
   [3] AC format — OK (3 criteria)
   [4] Activity Diagram — OK
   [5] Data Dictionary — OK (4 trường)
   [6] Business Rules — OK (BR-U01, BR-U02)
   [9] UI/UX Mô tả — OK
   [10] Frontmatter — OK

❌ FAIL (2/10):
   [7] Cascade trace — BR-U01 không có ghi chú kế thừa
       Fix: Thêm "(Kế thừa BR-F01)" vào BR-U01
   [8] Zero Kỹ thuật — Tìm thấy từ cấm:
       "endpoint" tại dòng 45 (Section 6)
       Fix: Thay bằng "địa chỉ truy cập"

Kết quả: NOT READY ❌
Chạy /vnr-ba-us-refine IDP-E01-F01-U01 để sửa.
══════════════════════════════════════════
```

**Gọi agent khác:** Không. Nếu FAIL → BA chạy `/vnr-ba-us-refine`.

---

#### ✏️ ba-us-refine

**Một câu:** Bổ sung thêm AC/BR/Data/Diagram vào US đã có — không phá cấu trúc cũ.

**Input:** `/vnr-ba-us-refine IDP-E01-F01-U01`

**Phân tích 4 gap:**
```
1. AC gap:   Edge case nào trong Actor-Task Matrix chưa có AC cover?
2. BR gap:   Ràng buộc nào được nhắc trong AC nhưng chưa có BR-U số?
3. Data gap: Trường nào xuất hiện trong AC/BR nhưng thiếu trong Data Dictionary?
4. Diagram:  Nhánh nào trong AC (edge case) chưa vẽ trong Activity Diagram?
```

**Ví dụ output đề xuất:**
```
Phân tích IDP-E01-F01-U01, tôi đề xuất bổ sung:

AC còn thiếu:
→ AC-04: NV điều chuyển phòng ban trong kỳ IDP
  Given IDP đang ở trạng thái "Đang thực hiện"
  When NV được điều chuyển sang phòng khác
  Then IDP vẫn gắn với QLTT cũ cho đến hết kỳ, không tự chuyển

BR còn thiếu:
→ BR-U03: Khi NV có >1 IDP active → hệ thống cảnh báo QLTT
  (BR mới — không có trong BR-F)

Data Dictionary thiếu:
→ Trường "Phòng ban tại thời điểm tạo" — xuất hiện ở AC-04 nhưng chưa trong bảng

Bạn muốn bổ sung gì?
```

**Gọi agent khác:** Không. Sau khi xong → chạy lại `/vnr-ba-us-check`.

---

#### ✂️ ba-story-split

**Một câu:** Tách US quá lớn thành nhiều US nhỏ — mỗi US phải deliver business value độc lập.

**Input:** `/vnr-ba-story-split IDP-E01-F01-U01`

**4 dấu hiệu cần tách:**
```
1. Nhiều actor khác nhau trong cùng 1 US
2. Nhiều happy path độc lập nhau
3. Số AC > 8-10
4. Nhiều luồng riêng biệt trong Activity Diagram
```

**Ví dụ:**
```
US cũ: IDP-E01-F01-U01 "Quản lý toàn bộ IDP" — 14 AC, 3 actors

Đề xuất tách thành 4 US:
• IDP-E01-F01-U01: "QLTT tạo IDP mới" — AC-01, AC-02, AC-03 (4 AC) — P1
• IDP-E01-F01-U02: "QLTT chỉnh sửa IDP nháp" — AC-04, AC-05 (3 AC) — P1
• IDP-E01-F01-U03: "NV xem và ký xác nhận IDP" — AC-06, AC-07 (3 AC) — P2
• IDP-E01-F01-U04: "QLTT hủy IDP chưa gửi" — AC-08 (2 AC) — P3

Tự động sau khi BA confirm:
→ Cập nhật Actor-Task Matrix trong FEAT (4 rows mới)
→ FEAT us_count: 1 → 4
→ Archive file US cũ thành IDP-E01-F01-U01_SPLIT.md
```

**Gọi agent khác:** Không. Sau khi tách → BA chạy `/vnr-ba-us-check` cho từng US mới.

---

### NHÓM 5: CHUYỂN GIAO

---

#### 🔗 ba-pbi-compose

**Một câu:** Cầu nối BA → Dev: nhóm US thành PBI, cập nhật map, sinh lệnh cho dev.

**Input:**
```
/vnr-ba-pbi-compose
→ Danh sách US hoặc FEAT ID: "IDP-E01-F01" (lấy tất cả US Ready)
```

**4 steps nội bộ:**
```
step-01: Đọc _product/us-pbi-map.md → xác định US chưa mapped, PBI ID tiếp theo
step-02: Phân tích pattern cho từng US (A / B / C)
step-03: Đề xuất mapping → hỏi BA confirm
step-04: Cập nhật map + frontmatter US + sinh lệnh vnr-ba-specify
```

**3 patterns mapping:**

```
Pattern A — Nhiều US → 1 PBI (gộp)
  Khi: Các US cùng entity, cùng screen, mỗi US quá nhỏ
  Ví dụ:
    IDP-E01-F01-U01 ┐
    IDP-E01-F01-U02 ├──→ PBI-07-idp-create   (Pattern A)
    IDP-E01-F01-U03 ┘

Pattern B — 1 US → 1 PBI
  Khi: US có scope vừa, business value rõ, độc lập
  Ví dụ:
    IDP-E01-F02-U01 ──→ PBI-08-idp-approval  (Pattern B)

Pattern C — 1 US → nhiều PBI (tách theo layer)
  Khi: US có engine tính toán phức tạp, cần nhiều sprint
  Ví dụ:
    IDP-E01-F03-U01 ──→ PBI-09-progress-ui      (Pattern C — FE)
                   └──→ PBI-10-progress-engine  (Pattern C — Engine)
```

**Output:**
```
_product/us-pbi-map.md (cập nhật, status: pending-spec)

Lệnh cho Dev:
══════════════════════════════════════════
Chạy các lệnh sau để tạo spec:

/vnr-ba-specify PBI-07: Tạo và khởi tạo IDP
/vnr-ba-specify PBI-08: Phê duyệt mục tiêu IDP
/vnr-ba-specify PBI-09: Cập nhật tiến độ mục tiêu (FE)
/vnr-ba-specify PBI-10: Engine tính toán tiến độ tổng hợp

Sau khi vnr-ba-specify chạy xong:
→ Cập nhật spec_path trong _product/us-pbi-map.md
══════════════════════════════════════════
```

**Gọi agent khác:** Không — chỉ sinh lệnh text. Dev tự chạy `vnr-ba-specify`.

**Ranh giới rõ ràng:**
```
ba-pbi-compose  → sở hữu _product/us-pbi-map.md
vnr-ba-specify  → sở hữu specs/PBI-{NN}-{slug}/
Không xung đột — chạy độc lập, khác thời điểm.
```

---

## PHẦN 3 — LUỒNG HOÀN CHỈNH (THỰC TẾ)

### Bối cảnh: BA Lan bắt đầu module IDP từ đầu

---

**NGÀY 1 — Research & Discovery**

```
BA Lan:  /vnr-ba-researcher
Agent:   Tôi muốn research domain gì?
BA Lan:  "Kế hoạch phát triển cá nhân"
         Module: IDP | Phân khúc: high-tech

[Agent chạy 5 steps nội bộ — khoảng 10-15 phút]

Output: Module/IDP/_discovery/research-idp.md
──────────────────────────────────────────────
Highlights từ research:
• VN competitors: MISA HRM, Base.vn dùng OKR framework
• Edge case hay bị bỏ: NV điều chuyển giữa kỳ IDP, IDP khi nghỉ thai sản
• Risk: Tính năng "cascade mục tiêu từ công ty xuống cá nhân" phức tạp cao
```

---

**NGÀY 1 (tiếp) — Tạo EPIC**

```
BA Lan:  /vnr-ba-epic
Agent:   Tên EPIC? Module? Research brief?
BA Lan:  "Kế hoạch phát triển cá nhân" | IDP | Module/IDP/_discovery/research-idp.md

[6 steps — agent đề xuất, BA review từng phần]

Step 2: "As-Is: HR đang dùng Excel template, gửi email qua lại"
BA Lan:  Đúng, thêm: phần lớn không ai điền vì không ai nhắc

Step 5: Stakeholder-Capability Matrix
Agent đề xuất:
┌─────────────────────────────────────────────────────────────┐
│ IDP-E01-F01: QLTT tạo IDP cho NV         (P1, Risk: High)  │
│ IDP-E01-F02: Phê duyệt mục tiêu          (P1, Risk: Medium)│
│ IDP-E01-F03: NV cập nhật tiến độ         (P1, Risk: High)  │
│ IDP-E01-F04: Hệ thống nhắc nhở deadline  (P2, Risk: Low)   │
│ IDP-E01-F05: QLTT đánh giá cuối kỳ       (P2, Risk: Medium)│
└─────────────────────────────────────────────────────────────┘
BA Lan: OK, thêm F06: HR xem báo cáo tổng hợp (P3)

Output:
  Module/IDP/Epics/IDP-E01_Ke_Hoach_Phat_Trien_Ca_Nhan/README.md
  Features/IDP-E01-F01_Tao_IDP/FEAT.md  (placeholder × 6)
  Module/IDP/_index.md (cập nhật)
```

---

**NGÀY 2 — FEAT đầu tiên**

```
BA Lan:  /vnr-ba-feat IDP-E01-F01
Agent:   Tìm thấy trong IDP-E01. Xác nhận:
         FEAT: IDP-E01-F01 — Tạo IDP cho NV
         Actor chính: QLTT
         Edge cases từ EPIC: NV thử việc, NV đang nghỉ phép

[5 steps — BA review từng phần]

Step 1 (tự động): Đánh giá scope
Agent: "Tôi thấy FEAT này có thể ra 11-12 US. Đề xuất tách:
        F01: Tạo và khởi tạo IDP (6 US)
        F07: Mentor assignment và thông báo (5 US)"
BA Lan: OK tách. (Agent tự cập nhật EPIC: feat_count 6→7, thêm F07)

Step 3: Actor-Task Matrix (sau khi tách)
┌──────────┬──────────────────────────┬───────────────────────┬────────────────────┐
│ Actor    │ Task                     │ Edge Cases            │ → US               │
├──────────┼──────────────────────────┼───────────────────────┼────────────────────┤
│ QLTT     │ Tạo IDP mới cho NV       │ NV đang thử việc      │ IDP-E01-F01-U01 P1 │
│ QLTT     │ Chọn mục tiêu            │ Mục tiêu hết hạn      │ IDP-E01-F01-U02 P1 │
│ QLTT     │ Đặt deadline mục tiêu    │ Deadline > cuối kỳ    │ IDP-E01-F01-U03 P1 │
│ QLTT     │ Lưu nháp và hoàn chỉnh  │ Thoát không lưu       │ IDP-E01-F01-U04 P2 │
│ NV       │ Xem IDP được giao        │ Chưa có IDP nào       │ IDP-E01-F01-U05 P1 │
│ Hệ thống │ Khóa IDP sau khi NV ký   │ NV không ký sau 7 ngày│ IDP-E01-F01-U06 P2 │
└──────────┴──────────────────────────┴───────────────────────┴────────────────────┘

Output: IDP-E01-F01_Tao_IDP/FEAT.md (đầy đủ 7 sections)
```

---

**NGÀY 2 (tiếp) — Viết US ưu tiên P1**

```
BA Lan:  /vnr-ba-us
Agent:   FEAT ID? Actor-Task?
BA Lan:  IDP-E01-F01 | "QLTT — Tạo IDP mới cho NV"

[7 steps — BA review từng section]

Step 2: US Statement
Agent đề xuất:
  "Là Quản lý trực tiếp,
   Tôi muốn tạo kế hoạch phát triển cá nhân mới cho nhân viên,
   Để định hướng rõ lộ trình phát triển trong 12 tháng tới."
BA Lan: Thêm Out of Scope: "Không bao gồm chỉnh sửa IDP đã gửi cho NV"

Step 3: AC — agent đề xuất 3 AC (happy path + 2 edge cases)
BA Lan: Thêm AC cho edge case "NV đang thử việc" → AC-04

Step 7: Zero Kỹ thuật check
Agent: PASS ✅ — 0 từ kỹ thuật

Output: Stories/IDP-E01-F01-U01_Tao_IDP_Moi.md
        FEAT us_count: 0 → 1 (tự cập nhật)
```

---

**NGÀY 3 — Quality check & fix**

```
BA Lan:  /vnr-ba-us-check IDP-E01-F01-U01

══════════════════════════════════════════
US CHECK: IDP-E01-F01-U01
══════════════════════════════════════════
✅ PASS (9/10)
❌ FAIL (1/10):
   [7] BR-U02 không có ghi chú kế thừa BR-F
       Fix: Thêm "(Kế thừa BR-F02)"

Kết quả: NOT READY ❌
══════════════════════════════════════════

BA Lan:  /vnr-ba-us-refine IDP-E01-F01-U01
Agent:   Đã thêm "(Kế thừa BR-F02)" vào BR-U02
         Cập nhật last_updated

BA Lan:  /vnr-ba-us-check IDP-E01-F01-U01
══════════════════════════════════════════
PASS (10/10) ✅  |  Kết quả: READY ✅
══════════════════════════════════════════

→ Cập nhật frontmatter: status: Ready
```

---

**NGÀY 5 — Đủ US Ready, compose sang PBI**

```
(BA Lan đã viết và pass check 6 US trong IDP-E01-F01)

BA Lan:  /vnr-ba-pbi-compose
Agent:   Đọc _product/us-pbi-map.md... PBI tiếp theo: PBI-07
         US sẵn sàng: 6 US từ IDP-E01-F01

Đề xuất mapping:
┌─────────────────────────────────────────────────────────────┐
│ Pattern A: U01 + U02 + U03 → PBI-07-idp-create            │
│   Lý do: Cùng màn hình "Tạo IDP", cùng entity IDP         │
│                                                             │
│ Pattern B: U04 → PBI-08-idp-draft-autosave                 │
│   Lý do: Cơ chế lưu nháp độc lập, cần xử lý riêng        │
│                                                             │
│ Pattern B: U05 → PBI-09-idp-nv-view                        │
│   Lý do: Actor khác (NV), màn hình khác hoàn toàn         │
│                                                             │
│ Pattern C: U06 → PBI-10-idp-lock-ui                        │
│              ├── PBI-11-idp-lock-reminder-engine            │
│   Lý do: Khóa IDP có engine nhắc nhở auto — cần tách BE/FE│
└─────────────────────────────────────────────────────────────┘

BA Lan: OK với tất cả

Output:
  _product/us-pbi-map.md (5 entries mới, status: pending-spec)
  US frontmatter: pbi_id cập nhật cho 6 US

Lệnh cho Dev:
  /vnr-ba-specify PBI-07: Tạo và khởi tạo IDP (QLTT)
  /vnr-ba-specify PBI-08: Lưu nháp IDP tự động
  /vnr-ba-specify PBI-09: Nhân viên xem IDP được giao
  /vnr-ba-specify PBI-10: Khóa IDP sau khi ký xác nhận
  /vnr-ba-specify PBI-11: Engine nhắc ký IDP tự động
```

---

**NGÀY 5 — Dev tiếp nhận**

```
Dev Minh: /vnr-ba-specify PBI-07: Tạo và khởi tạo IDP (QLTT)
→ Tạo specs/PBI-07-idp-create/ với spec.md đầy đủ

Dev Minh: (cập nhật _product/us-pbi-map.md)
→ PBI-07: status: pending-spec → has-spec
→ spec_path: specs/PBI-07-idp-create/

Dev Minh: /speckit.plan  (trong branch PBI-07-idp-create)
→ Tạo plan.md + tasks.md

Dev Minh: /speckit.implement
→ Bắt đầu code
```

---

## PHẦN 4 — QUICK REFERENCE

### Commands

```bash
# KHÁM PHÁ
/vnr-ba-researcher                      # Research domain mới
/vnr-ba-story-map                       # Từ notes thô → skeleton

# CẤU TRÚC
/vnr-ba-epic                            # Tạo EPIC
/vnr-ba-feat IDP-E01-F01               # Tạo FEAT (cần EPIC cha)
/vnr-ba-us                              # Tạo US (cần FEAT cha)

# CHẤT LƯỢNG
/vnr-ba-us-check IDP-E01-F01-U01       # Validate US
/vnr-ba-us-refine IDP-E01-F01-U01      # Bổ sung US
/vnr-ba-story-split IDP-E01-F01-U01    # Tách US quá lớn

# CHUYỂN GIAO
/vnr-ba-pbi-compose                     # Map US → PBI

# HRM WRITE/ANALYZE/REVIEW/ADVANCED
/vnr-ba-write-us                        # Tạo US hoàn chỉnh
/vnr-ba-analyze-us                      # Phân tích nghiệp vụ
/vnr-ba-review-us                       # Review User Story
/vnr-ba-advanced-us                     # Phân tích chuyên sâu

# SPECKIT BA
/vnr-ba-specify                         # BA-enhanced specify
/vnr-ba-clarify                         # BA-enhanced clarify
/vnr-ba-design                          # BA-enhanced design

# RETROSPECTIVE & CONSTITUTION
/vnr-ba-retrospective                   # Post-EPIC review
/vnr-ba-constitution                    # Cập nhật Ground Rules

# HELP
/vnr-ba-help                            # Xem guide này
```

### ID Convention

```
MODULE  IDP-E01              = IDP, Epic 1
FEAT    IDP-E01-F02          = IDP, Epic 1, Feature 2
US      IDP-E01-F02-U03      = IDP, Epic 1, Feature 2, Story 3
PBI     PBI-07-idp-create    = PBI số 7 (global)
```

### Nguồn sự thật số thứ tự

| Tạo mới | Đọc file nào để lấy next number |
|---|---|
| EPIC | `Module/IDP/_index.md` → đếm EPICs |
| FEAT | EPIC `README.md` Section 13 → đếm FEATs |
| US | FEAT `FEAT.md` Section 6 → đếm USs |
| PBI | `_product/us-pbi-map.md` → tìm max số |

### Zero Kỹ thuật — từ cấm nhanh

```
❌ API, endpoint, DB, table, column, component, DTO,
   handler, service, token, JWT, string, integer,
   boolean, null, array, enum, varchar, async, await
```

Cách nhớ: **Nếu bà HR 50 tuổi không hiểu → viết lại.**

---

## PHẦN 5 — FAQ

**Q: Tôi không biết bắt đầu từ đâu?**
A: Hỏi mình: "Tôi có notes/pain points chưa?" → Có → `/vnr-ba-story-map`. Không → `/vnr-ba-researcher` rồi `/vnr-ba-epic`.

**Q: ba-epic và ba-feat khác nhau thế nào?**
A: EPIC = "business area lớn, nhiều capability" (ví dụ: Toàn bộ IDP). FEAT = "1 capability cụ thể của 1 actor" (ví dụ: QLTT tạo IDP). EPIC có BPMN As-Is/To-Be, pain points, metrics. FEAT có Actor-Task Matrix chi tiết từng task.

**Q: Khi nào US đủ nhỏ, không cần split?**
A: ≤ 8 AC + 1 actor chính + 1 happy path rõ ràng + dev làm xong trong 1 sprint.

**Q: Nhiều BA cùng làm có bị trùng ID không?**
A: Không, nếu làm đúng quy tắc: mỗi BA claim 1 FEAT riêng (IDP-E01-F01 / F02 / F03). USs trong FEAT là namespace riêng không va chạm với nhau.

**Q: ba-pbi-compose có tạo thư mục code không?**
A: Không. Chỉ cập nhật `_product/us-pbi-map.md`. Dev chạy `/vnr-ba-specify` mới tạo `specs/`.

**Q: US ở status nào thì được compose?**
A: `status: Ready` hoặc Draft đã pass `/vnr-ba-us-check` 10/10.
