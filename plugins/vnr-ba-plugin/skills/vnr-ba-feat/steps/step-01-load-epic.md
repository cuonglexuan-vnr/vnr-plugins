# Step 01 — Load EPIC cha

## Mục tiêu

Nạp toàn bộ thông tin từ EPIC cha để FEAT kế thừa đúng scope, BR-E, EAC.

---

## Hành động 0: Đọc BA Ground Rules — BẮT BUỘC

Trước khi làm bất cứ điều gì, đọc `_product/ba-ground-rules.md`.

Ghi nhớ và áp dụng ngay trong session này:
- **GR-001**: Từ kỹ thuật cấm (Zero Kỹ thuật) — không được xuất hiện trong FEAT
- **GR-002**: Cascade rule — BR-E từ EPIC → BR-F trong FEAT; EAC từ EPIC → FAC trong FEAT
- **GR-003**: Format AC chuẩn (Given/When/Then)
- **GR-004**: 4 trạng thái UI bắt buộc (loading/empty/error/normal)
- **GR-010 đến GR-013**: Rules HRM-specific
- **Part III** (Lessons): Đọc kỹ — đây là bài học từ EPIC trước, áp dụng ngay

> **Nếu `_product/ba-ground-rules.md` không tồn tại:** Cảnh báo BA và tiếp tục với rules mặc định.

---

## Hành động 0b: Kiểm tra Wireframe Input (tùy chọn)

Hỏi BA trước khi bắt đầu:

```
Bạn có wireframe / mockup / Figma cho FEAT này không?
(ảnh, link Figma, file Excel, PDF, hoặc sketch bất kỳ)

Nếu có → tôi sẽ phân tích wireframe song song để làm giàu BPMN và Actor-Task Matrix.
Nếu chưa có → tiếp tục bình thường, có thể bổ sung wireframe sau.
```

**Nếu BA cung cấp wireframe:**
- Ghi nhận đường dẫn / URL vào biến `WIREFRAME_INPUT`
- Đặt cờ `HAS_WIREFRAME = true`
- Chạy `/vnr-ba-wireframe` với scope = FEAT (hoặc thực hiện inline: xem ảnh, liệt kê màn hình thấy được)
- Lưu kết quả vào `SCREEN_INVENTORY_DRAFT` để dùng ở Step 02

**Nếu không có wireframe:**
- Đặt cờ `HAS_WIREFRAME = false`
- Tiếp tục bình thường — Section Screen Inventory trong FEAT sẽ được BA điền thủ công sau

---

---

## Hành động 1: Tìm FEAT trong EPIC

Từ FEAT ID được cung cấp, tìm EPIC cha:
- Đọc `Module/{MODULE}/Epics/` — tìm thư mục chứa FEAT ID này
- Đọc `README.md` của EPIC đó

Từ EPIC, trích xuất:
- EPIC ID + tên
- Row tương ứng trong **Stakeholder-Capability Matrix** của FEAT này
- Danh sách **BR-E** (để cascade thành BR-F)
- Danh sách **EAC** — Epic Acceptance Criteria (để cascade thành FAC)
- **Scope của EPIC** (để FEAT không vượt ra ngoài)
- **Edge Cases** được assign cho FEAT này

---

## Hành động 2: Xác nhận FEAT với BA

Trình BA:
```
Tìm thấy FEAT trong EPIC [{EPIC-ID}]:

FEAT: {FEAT-ID} — {Tên FEAT}
Actor chính: {Actor}
Capability: {Mô tả capability từ Stakeholder Matrix}
Edge cases liên quan: {Danh sách}
BR-E sẽ cascade: BR-E001, BR-E002, ...

Đây có đúng FEAT cần viết không?
```

---

## Hành động 3: Đánh giá scope FEAT

Dựa trên Edge Cases và Capability, đánh giá:

**Nếu scope quá lớn (> 8-10 US candidates dự kiến):**
```
FEAT [{FEAT-ID}] có vẻ quá lớn. Tôi đề xuất tách thành 2 FEAT:

FEAT-A: {Tên} — {Mô tả — phần cốt lõi}
FEAT-B: {Tên} — {Mô tả — phần mở rộng/edge cases}

Lý do: {Edge case X và Y đủ phức tạp để thành FEAT riêng}

BA muốn tách không? Nếu tách, tôi sẽ cập nhật EPIC.
```

**Nếu tách:** Cập nhật EPIC — thêm FEAT mới vào Stakeholder-Capability Matrix + tăng feat_count.

Sau đó đọc: `./steps/step-02-scope-bpmn.md`
