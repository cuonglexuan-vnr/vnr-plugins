# Step 01 — Load & Validate Context

## Mục tiêu

Nạp toàn bộ thông tin cần thiết từ FEAT cha, EPIC cha, và thư viện context của dự án. Cuối step này, BA sẽ chọn chính xác một row trong Actor-Task Matrix để viết US.

---

## Hành động 0: Đọc BA Ground Rules — BẮT BUỘC

Trước khi làm bất cứ điều gì, đọc `_product/ba-ground-rules.md`.

Ghi nhớ và áp dụng ngay trong session viết US này:
- **GR-001**: Từ kỹ thuật cấm — quét trước khi ghi file US
- **GR-002**: Cascade — BR-U PHẢI trace về BR-F; AC PHẢI trace về FAC
- **GR-003**: Mỗi AC phải có đủ Given/When/Then, bao gồm cả sad path
- **GR-004**: Mỗi màn hình trong US phải mô tả đủ 4 trạng thái
- **GR-005**: Error message phải nêu cụ thể, không viết chung chung
- **GR-011**: Nếu US có thao tác ghi/sửa → phải có audit trail trong AC
- **Part III** (Lessons/Anti-patterns): Đây là bài học từ EPIC trước — áp dụng để không lặp lại

> **Nếu `_product/ba-ground-rules.md` không tồn tại:** Cảnh báo BA và tiếp tục với rules mặc định.

---

## Hành động 0b: Kiểm tra Wireframe Input (tùy chọn)

Hỏi BA trước khi bắt đầu:

```
Bạn có wireframe / mockup / Figma cho US này hoặc cho FEAT cha không?
(ảnh, link Figma, file Excel, PDF, mô tả layout bằng lời, ...)

Nếu có → tôi sẽ dùng wireframe làm nền cho Step 06 (UI/UX Mô tả).
Nếu chưa → Step 06 sẽ đề xuất từ nghiệp vụ, BA bổ sung wireframe sau nếu cần.
```

**Nếu BA cung cấp wireframe:**
- Ghi nhận vào `WIREFRAME_INPUT` (đường dẫn, URL, hoặc "đã đính kèm ảnh")
- Đặt cờ `HAS_WIREFRAME = true`
- **KHÔNG phân tích ngay** — chỉ ghi nhận. Phân tích sẽ diễn ra tại Step 06.
- Nếu muốn phân tích trước: đề xuất BA chạy `/vnr-ba-wireframe` trước khi tiếp tục.

**Nếu không có wireframe:**
- Đặt cờ `HAS_WIREFRAME = false`
- Step 06 sẽ đề xuất UI/UX từ AC + Activity Diagram, BA tự điền Figma link sau.

---

## Hành động 1: Đọc FEAT cha

**Đọc toàn bộ file FEAT** (đường dẫn đã cung cấp hoặc tìm theo FEAT ID).

Từ FEAT, trích xuất và ghi nhớ các thông tin sau:

| Trường cần lấy | Vị trí thường gặp trong FEAT |
|---|---|
| FEAT ID & Tên | Tiêu đề (heading H1) |
| Module & EPIC cha | Breadcrumb hoặc metadata đầu file |
| `status` (frontmatter hoặc label) | `Draft` / `In Progress` / `Done` |
| `us_count` (số US hiện có) | Frontmatter hoặc Section "Danh sách US" |
| Actor-Task Matrix | Section "Actor-Task Matrix" hoặc tương đương |
| Feature Acceptance Criteria (FAC) | Section "Acceptance Criteria" (FAC-001, FAC-002...) |
| Business Rules Feature (BR-F) | Section "Business Rules" (BR-F001, BR-F002...) |
| Danh sách US đã tồn tại | Section "Danh sách US" / bảng Stories |

**Nếu FEAT không có Actor-Task Matrix:** Thông báo cho BA và hỏi:
```
FEAT [ID] không có Actor-Task Matrix. BA có muốn:
1. Tôi tạo Actor-Task Matrix đề xuất dựa trên nội dung FEAT không?
2. BA cung cấp thủ công Actor và Task cần viết US?
```

---

## Hành động 2: Validate trạng thái FEAT

Kiểm tra `status` của FEAT:
- `Draft` → Cho phép tiếp tục, cảnh báo: _"FEAT đang Draft, AC có thể chưa ổn định."_
- `In Progress` → Cho phép tiếp tục bình thường.
- `Done` / `Closed` → **DỪNG.** Thông báo: _"FEAT đã Done. Không tạo thêm US mới. Nếu cần, hãy đổi status FEAT về In Progress trước."_
- Không có status → Cảnh báo và hỏi BA xác nhận.

---

## Hành động 3: Đọc EPIC cha (README.md)

Tìm file README.md của EPIC cha (thường nằm tại `../README.md` hoặc `Epics/[EPIC_ID]/README.md`).

Trích xuất:
- **BR-E (Business Rules Epic):** Danh sách BR cấp Epic (BR-EP-xxx hoặc tương đương)
- **EAC (Epic Acceptance Criteria):** Danh sách tiêu chí nghiệm thu cấp Epic
- **Mục tiêu Epic:** Mô tả ngắn mục tiêu nghiệp vụ của Epic
- **Các Feature trong Epic:** Để hiểu bức tranh tổng thể

---

## Hành động 4: Đọc thư viện _product/

Kiểm tra sự tồn tại của thư mục `_product/` tại root project:

### 4a. Đọc `_product/segments/` (nếu tồn tại)
Đọc tất cả file trong thư mục này. Mỗi file mô tả một segment nhân sự (ví dụ: Nhân viên văn phòng, Công nhân sản xuất, Nhân viên kinh doanh). Ghi nhớ:
- Tên segment và đặc điểm
- Các đặc thù nghiệp vụ của từng segment (ví dụ: công nhân có ca đêm, nhân viên kinh doanh có thưởng hoa hồng)

**Nếu `_product/segments/` không tồn tại:** Bỏ qua, ghi chú "Chưa có Segment Profile".

### 4b. Đọc `_product/edge-cases/_index.md` (nếu tồn tại)
Đây là thư viện các tình huống đặc biệt đã được định nghĩa trước cho dự án. Đọc toàn bộ để lấy danh sách Edge Case ID, tên và mô tả ngắn.

**Nếu không tồn tại:** Tìm bất kỳ file edge-case nào trong `_product/`:
```
find _product/ -name "*.md" -iname "*edge*"
```

**Nếu `_product/` hoàn toàn không tồn tại:** Ghi chú "Không có Edge Case Library" và tiếp tục.

---

## Hành động 5: Detect Edge Cases liên quan đến FEAT này

Dựa trên nội dung FEAT và Edge Case Library đã đọc, lọc ra các EC có khả năng liên quan:

**Tiêu chí lọc (áp dụng rule OR):**
- EC liên quan đến cùng Module (ATT, SAL, TRA, v.v.)
- EC liên quan đến cùng Actor được đề cập trong FEAT
- EC liên quan đến nghiệp vụ của FEAT (ví dụ: FEAT về nghỉ phép → tìm EC về điều chuyển, thay đổi hợp đồng)
- EC thuộc loại "employee-lifecycle" nếu FEAT liên quan đến nhân sự
- EC thuộc loại "performance-complexity" nếu FEAT liên quan đến tính toán

Lưu danh sách **EC có khả năng liên quan** để dùng ở Step 03.

---

## Hành động 6: Hiển thị Actor-Task Matrix và yêu cầu BA chọn

Hiển thị Actor-Task Matrix theo dạng bảng có đánh số thứ tự:

```
Actor-Task Matrix — [FEAT ID]: [Tên FEAT]
═══════════════════════════════════════════════════

STT | Actor              | Task/Hành động            | FAC liên quan | US đã có?
----|--------------------|-----------------------------|---------------|----------
  1 | HR Admin           | Tạo ca làm việc mới         | FAC-001       | Chưa có
  2 | HR Admin           | Chỉnh sửa ca làm việc       | FAC-002       | Chưa có
  3 | Line Manager       | Xem lịch phân ca nhân viên  | FAC-003       | US-XXX ✓
  4 | Nhân viên          | Đổi ca với đồng nghiệp      | FAC-004       | Chưa có

Nhập số thứ tự row muốn viết US (hoặc "all" để xem tất cả): _
```

**Nếu FEAT không có cột FAC rõ ràng:** Map dựa trên nội dung Acceptance Criteria của FEAT.

**Sau khi BA chọn row:**
- Lưu: `SELECTED_ACTOR`, `SELECTED_TASK`, `LINKED_FAC`
- Kiểm tra: nếu US đã tồn tại cho row này → cảnh báo và hỏi BA có muốn tạo US mới không.

---

## Kết quả đầu ra Step 01

Hiển thị tóm tắt context đã load cho BA xác nhận:

```
╔══ CONTEXT ĐÃ LOAD ═══════════════════════════════════╗
║ Ground Rules: v[X.X.X] — [N] GRs, [N] lessons
║ FEAT cha    : [FEAT-ID] — [Tên FEAT]
║ EPIC cha    : [EPIC-ID] — [Tên EPIC]
║ Status      : [Draft / In Progress]
║ Actor       : [SELECTED_ACTOR]
║ Task        : [SELECTED_TASK]
║ FAC trace   : [FAC-001, FAC-002...]
║ BR-F        : [BR-F001, BR-F002...] (sẽ specialise thành BR-U)
║ BR-E        : [BR-EP-001...] (kế thừa từ Epic)
║ Segments    : [Danh sách segments áp dụng hoặc "Chưa có"]
║ Wireframe   : [Có — đường dẫn/URL] hoặc [Chưa có]
║ Edge Cases liên quan:
║   - EC-xxx: [Tên EC]
║   - EC-yyy: [Tên EC]
╚═══════════════════════════════════════════════════════╝

BA có xác nhận context trên chính xác không? (yes/sửa)
```

Chỉ chuyển sang Step 02 khi BA xác nhận.

---

## Chuyển sang Step tiếp theo

Sau khi BA xác nhận, đọc và thực thi: `./steps/step-02-write-statement.md`
