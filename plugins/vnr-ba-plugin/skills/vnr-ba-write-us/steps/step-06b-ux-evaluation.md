# Step 06b — UX Evaluation

## Mục tiêu

Đánh giá chất lượng UX của US theo 6 tiêu chí chuẩn. UX Evaluation phải PASS ✅ trước khi chuyển sang step tiếp theo. Nếu có điểm ⚠️, ghi chú để BA xử lý sau qua `/vnr-ba-us-refine`.

---

## Tự động chạy checklist 6 tiêu chí UX

### C1: Completeness — Đầy đủ màn hình

```
✅ / ⚠️  Mọi node hành động trong Activity Diagram có màn hình tương ứng không?
→ Kiểm tra: Đếm số nhánh có "Người dùng [làm gì]" trong diagram → so với số màn hình đã mô tả
```

**Ví dụ cách kiểm tra:**

```
Activity Diagram có 5 node hành động:
1. "Nhập thông tin kỳ công" → Cần màn hình: Form nhập thông tin ✅
2. "Kiểm tra validation" → Hiển thị trên màn hình Form (inline) ✅
3. "Xác nhận lưu" → Cần hộp thoại: Xác nhận lưu ✅
4. "Xem danh sách kỳ công" → Cần màn hình: Danh sách kỳ công ✅
5. "Xóa kỳ công" → Cần hộp thoại: Xác nhận xóa ✅

→ Kết quả: ✅ Đủ 5 màn hình/dialog
```

### C2: State Coverage — Đủ trạng thái

**C2a: Screen-level States (Trạng thái màn hình)**

```
✅ / ⚠️  Mỗi màn hình có đủ 4 trạng thái cơ bản không?
→ Loading: [✅/⚠️ thiếu ở màn hình {X}]
→ Empty State: [✅/⚠️ thiếu ở màn hình {Y}]
→ Error State: [✅/⚠️ thiếu ở màn hình {Z}]
→ Success State: [✅/⚠️ ...]
```

**C2b: Component-level States (Trạng thái component)**

```
✅ / ⚠️  Các trường/nút tương tác có đủ trạng thái không?
→ Disabled state (nút bị khóa khi chưa đủ điều kiện): [✅/⚠️ thiếu ở {nút X}]
→ Loading state (nút đang submit, hiển thị spinner): [✅/⚠️ thiếu ở {nút Y}]
→ Validation state (trường hiển thị lỗi inline): [✅/⚠️ thiếu ở {trường Z}]
→ Readonly state (trường chỉ xem, không chỉnh sửa): [✅/⚠️ ...]
```

### C3: Feedback Completeness — Phản hồi người dùng

```
✅ / ⚠️  Mỗi hành động của người dùng có thông báo / phản hồi rõ ràng không?
→ Kiểm tra từng AC "When" → có "Then" mô tả phản hồi UI cụ thể không?
→ Các AC thiếu phản hồi: [liệt kê hoặc "Không có"]
```

### C4: Error Prevention — Ngăn chặn lỗi trước

```
✅ / ⚠️  Có cơ chế ngăn người dùng nhập sai trước khi submit không?
→ Nút Lưu bị khóa khi chưa đủ thông tin: [✅/⚠️]
→ Validation inline (hiện lỗi ngay khi rời khỏi ô nhập): [✅/⚠️ — ghi rõ trường nào]
→ Cảnh báo trước khi thao tác phá hủy (xóa, reset): [✅/⚠️]
```

### C5: Consistency — Nhất quán

```
✅ / ⚠️  Tên màn hình, tên nút, nội dung thông báo có nhất quán không?
→ Cùng hành động dùng cùng tên nút (ví dụ: không vừa "Lưu" vừa "Ghi lại"): [✅/⚠️]
→ Cùng loại thông báo dùng cùng format: [✅/⚠️]
```

### C6: Wireframe Coverage (chỉ khi HAS_WIREFRAME = true)

```
✅ / ⚠️  Mọi màn hình trong wireframe đã được mô tả và có AC cover không?
→ Màn hình chưa mô tả: [liệt kê hoặc "Không có"]
→ Màn hình chưa có AC: [liệt kê hoặc "Không có"]
```

---

## Kết quả đầu ra Step 06b

**Báo cáo UX Evaluation:**

```
════════════════════════════════════════════════════════════
✓ HOÀN THÀNH STEP 06b — UX EVALUATION

UX EVALUATION — US [{US-ID}]
════════════════════════════════════
C1  Completeness      : [✅ Đủ / ⚠️ Thiếu màn hình: {X}]
C2a Screen States     : [✅ Đủ / ⚠️ Thiếu trạng thái: {X} ở màn hình {Y}]
C2b Component States  : [✅ Đủ / ⚠️ Thiếu trạng thái: {X} ở {nút/trường Y}]
C3  Feedback          : [✅ Đủ / ⚠️ AC-{X} thiếu phản hồi UI]
C4  Error Prevention  : [✅ Đủ / ⚠️ Trường {X} chưa có inline validation]
C5  Consistency       : [✅ Đủ / ⚠️ Tên nút không đồng nhất: {X} vs {Y}]
C6  Wireframe Cov     : [✅ / ⚠️ / N/A — không có wireframe]

Kết quả: [PASS ✅ (tất cả ✅)] hoặc [CẦN BỔ SUNG ⚠️ ({N} điểm)]
════════════════════════════════════
════════════════════════════════════════════════════════════
```

**Xử lý tự động nếu có điểm ⚠️:**
- Ghi chú "⚠️ Cần bổ sung" trong phần UI/UX
- Liệt kê rõ điểm nào thiếu để BA có thể xử lý sau qua `/vnr-ba-us-refine`

**Tự động chuyển sang Step 06c** — đọc và thực thi: `./steps/step-06c-tracking-analytics.md`
