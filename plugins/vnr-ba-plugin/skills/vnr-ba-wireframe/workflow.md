# Workflow: ba-wireframe — Phân tích Wireframe / Mockup / Figma

## Mục tiêu

Đọc và phân tích wireframe (dù ở dạng nào: ảnh, Figma URL, file Excel, mockup PDF, sketch) để tạo ra **Screen Inventory** có cấu trúc. Output này làm đầu vào cho `ba-feat` (Screen Inventory cấp FEAT) hoặc `ba-us` (UI/UX Mô tả cấp US).

Đây là skill **đề xuất & phân tích** — không phán xét thiết kế, không thay thế designer. Mục tiêu là giúp BA "đọc" wireframe bằng ngôn ngữ nghiệp vụ để dùng trong tài liệu BA.

---

## Nguyên tắc

- **Ngôn ngữ nghiệp vụ tuyệt đối.** Đọc wireframe → dịch ra từ ngữ BA, không mô tả kỹ thuật.
- **Đặt câu hỏi khi không rõ.** Nếu wireframe mơ hồ → liệt kê câu hỏi, không tự suy diễn.
- **Không phán xét UX.** Không nói "thiết kế xấu" hay "nên làm khác" — chỉ mô tả những gì thấy và đặt câu hỏi làm rõ.
- **Luôn hỏi scope.** Wireframe này cho FEAT nào? US nào? → Output sẽ khác nhau tùy scope.

---

## Đầu vào

Nhận một trong các dạng sau:

| Dạng | Ví dụ |
|---|---|
| Đường dẫn ảnh cục bộ | `assets/mockup/idp-screen.png` |
| Figma URL | `https://figma.com/file/...` |
| File PDF | `docs/wireframe/feature-x.pdf` |
| File Excel/Word | `docs/mockup/screen-layout.xlsx` |
| Ảnh paste trực tiếp | (ảnh đính kèm trong chat) |
| Mô tả text từ BA | BA mô tả layout bằng lời |

Nếu chưa có input, hỏi:
```
Bạn muốn tôi phân tích wireframe nào?
Có thể cung cấp:
- Đường dẫn file ảnh/PDF/Excel
- Link Figma
- Ảnh paste trực tiếp vào chat
- Hoặc mô tả layout bằng lời — tôi sẽ tổng hợp thành Screen Inventory
```

---

## Xác định Scope

Trước khi phân tích, hỏi BA để biết wireframe này phục vụ cho cấp nào:

```
Wireframe này dùng cho:
(a) FEAT — tôi sẽ tạo Screen Inventory cấp FEAT (danh sách màn hình + flow tổng)
(b) US cụ thể — tôi sẽ tạo UI/UX Mô tả chi tiết cho US đó
(c) Chưa rõ — tôi sẽ phân tích và đề xuất

FEAT ID / US ID (nếu đã có): ___
```

---

## Hành động 1: Đọc Wireframe

### Nếu là ảnh / PDF:
Dùng tool `Read` để xem file ảnh. Quan sát:
- Có bao nhiêu màn hình / frame trong ảnh?
- Mỗi frame đang ở trạng thái gì (list view, form, empty state, error state...)?
- Có mũi tên / số thứ tự / annotation không?

### Nếu là Figma URL:
Đọc URL. Ghi nhận:
- Tên các page/frame trong Figma (nếu URL chứa node ID)
- Yêu cầu BA export ảnh nếu không đọc được trực tiếp

### Nếu là Excel/Word:
Dùng tool `Read` để đọc nội dung text.

### Nếu là mô tả text:
Ghi nhận từng màn hình BA liệt kê, tái cấu trúc thành Screen Inventory.

---

## Hành động 2: Trích xuất Screen List

Từ wireframe, liệt kê tất cả màn hình / dialog / panel thấy được:

```
Danh sách màn hình phát hiện trong wireframe:
────────────────────────────────────────────
#  | Tên (đặt tên nghiệp vụ)          | Loại         | Ghi chú
---|-----------------------------------|--------------|------------------
1  | Danh sách Kỳ công                 | Trang chính  | Có bộ lọc trên đầu
2  | Biểu mẫu Thiết lập Kỳ công       | Form trang mới | Có nút Lưu / Hủy
3  | Hộp thoại Xác nhận Xóa           | Dialog       | Overlay, 2 nút
4  | Trạng thái Rỗng (Empty State)     | Trạng thái   | Khi chưa có kỳ công
5  | Trạng thái Lỗi                    | Trạng thái   | Khi API lỗi / timeout
────────────────────────────────────────────
Loại: Trang chính / Form trang mới / Dialog / Drawer / Sidebar panel / Trạng thái
```

---

## Hành động 3: Mô tả từng màn hình

Với mỗi màn hình trong danh sách, mô tả:

```markdown
### Màn hình [#]: [Tên nghiệp vụ]

**Mục đích:** [Người dùng dùng màn hình này để làm gì]

**Các thành phần nhìn thấy trong wireframe:**
- [Thành phần 1 — mô tả theo ngôn ngữ nghiệp vụ]
- [Thành phần 2]
- ...

**Trạng thái thấy trong wireframe:**
- [ ] Trạng thái bình thường (có dữ liệu)
- [ ] Trạng thái rỗng (chưa có dữ liệu)
- [ ] Trạng thái đang tải
- [ ] Trạng thái lỗi
- [ ] Trạng thái disabled / read-only

**Hành động người dùng thấy được:**
- [Nút / Link / Action nào có trong màn hình]

**Chưa rõ / Cần hỏi BA:**
- [Câu hỏi về thành phần không rõ ràng]
- [Câu hỏi về hành vi khi click / hover / submit]
```

---

## Hành động 4: Xác định Luồng Điều hướng

Từ các mũi tên, số thứ tự, annotation trong wireframe (hoặc từ ngữ cảnh), vẽ luồng:

```
Luồng điều hướng phát hiện:
1. [Màn hình 1] → Nhấn "Thêm mới" → [Màn hình 2]
2. [Màn hình 2] → Nhấn "Lưu" thành công → Quay về [Màn hình 1]
3. [Màn hình 1] → Nhấn "Xóa" → [Màn hình 3 — Dialog xác nhận]
4. [Màn hình 3] → Xác nhận → [Màn hình 1] (cập nhật danh sách)

Chưa rõ luồng:
- ? Sau khi lỗi validation, người dùng ở lại màn hình 2 hay quay về 1?
- ? Màn hình rỗng có link dẫn thẳng đến màn hình 2 không?
```

---

## Hành động 5: Gap Analysis — Wireframe vs Nghiệp vụ

Nếu đã có FEAT hoặc US context (được cung cấp hoặc BA chỉ định), so sánh:

```
GAP ANALYSIS — Wireframe vs Nghiệp vụ
══════════════════════════════════════

✅ Wireframe có, nghiệp vụ cover:
   - Màn hình "Danh sách Kỳ công" → FAC-001 ✓
   - Form "Thiết lập Kỳ công" → FAC-002 ✓

⚠️  Wireframe có nhưng CHƯA có AC/BR cover:
   - Màn hình #4 "Trạng thái Rỗng" → Chưa có AC nào mô tả empty state
   - Nút "Xuất Excel" ở màn hình #1 → Chưa có BR về export
   → Gợi ý: Thêm AC cho empty state và US cho tính năng xuất Excel

⚠️  Nghiệp vụ có nhưng wireframe CHƯA thể hiện:
   - AC-003: Kiểm tra trùng khoảng thời gian → Chưa thấy thông báo lỗi trùng trong wireframe
   - BR-F002: Không cho phép xóa kỳ có dữ liệu → Nút "Xóa" trong wireframe không thấy disabled state
   → Gợi ý: Hỏi designer bổ sung trạng thái này

❓ Chưa rõ — cần hỏi BA:
   - [Câu hỏi cụ thể]
══════════════════════════════════════
```

---

## Hành động 6: Câu hỏi làm rõ cho BA

Tổng hợp tất cả điểm chưa rõ thành danh sách câu hỏi:

```
Sau khi đọc wireframe, tôi cần làm rõ [N] điểm:

1. [Màn hình X] — [Câu hỏi cụ thể về hành vi]
   Ví dụ: "Khi danh sách có >50 kỳ công, có phân trang không hay scroll vô hạn?"

2. [Màn hình Y] — [Câu hỏi về trạng thái]
   Ví dụ: "Nút 'Sửa' có hiện với mọi kỳ công hay chỉ kỳ chưa có dữ liệu?"

3. [Luồng Z] — [Câu hỏi về navigation]
   Ví dụ: "Sau khi Hủy ở biểu mẫu, quay về trang Danh sách hay lịch sử trình duyệt?"

BA trả lời từng câu, tôi sẽ cập nhật Screen Inventory.
```

---

## Output: Screen Inventory

Sau khi BA xác nhận, tạo file `wireframe-analysis.md` tại đường dẫn phù hợp:

- Nếu cho FEAT: `Module/{MOD}/Epics/{EPIC}/Features/{FEAT}/wireframe-analysis.md`
- Nếu cho US: `Module/{MOD}/Epics/{EPIC}/Features/{FEAT}/Stories/wireframe-{US-ID}.md`

**Format file output:**

```markdown
---
source: [Đường dẫn file / Figma URL / "Mô tả BA"]
scope: [FEAT-ID hoặc US-ID]
analyzed_date: {YYYY-MM-DD}
status: Draft
---

# Screen Inventory — [Tên FEAT hoặc US]

## Danh sách Màn hình

[Bảng #3 — danh sách screens]

## Mô tả từng Màn hình

[Mô tả chi tiết từng screen]

## Luồng Điều hướng

[Luồng navigation]

## Gap Analysis

[Bảng gap nếu có FEAT/US context]

## Câu hỏi chưa rõ

[Danh sách câu hỏi còn mở — sẽ xóa sau khi BA trả lời]
```

---

## Tích hợp với Workflow khác

| Sau ba-wireframe | Bước tiếp theo |
|---|---|
| Scope = FEAT | Chạy `/vnr-ba-feat` — paste Screen Inventory vào Step 02 (BPMN) để làm giàu thêm |
| Scope = US | Chạy `/vnr-ba-us` — Screen Inventory tự động được dùng ở Step 06 (UI/UX) |
| Scope chưa rõ | Đọc Screen Inventory → quyết định viết FEAT hay US trước |

Thông báo kết thúc:
```
✅ Screen Inventory đã tạo: [đường dẫn file]

Bước tiếp theo:
• Nếu cần viết FEAT: /vnr-ba-feat {FEAT-ID} — Screen Inventory đã sẵn sàng
• Nếu cần viết US: /vnr-ba-us {FEAT-ID} — tôi sẽ dùng file này ở Step 06
• Nếu còn câu hỏi chưa rõ: trả lời các câu hỏi ở trên trước
```
