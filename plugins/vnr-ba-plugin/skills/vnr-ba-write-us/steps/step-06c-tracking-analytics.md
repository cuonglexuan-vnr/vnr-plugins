# Step 06c — Tracking & Analytics

## Mục tiêu

Định nghĩa các sự kiện cần log (Audit Trail + Analytics Events) để theo dõi hành vi người dùng và kiểm toán nghiệp vụ. Tracking phải được thiết kế ngay từ đầu trong US, không phải bổ sung sau.

---

## Phần D: Tracking & Analytics

### D1: Xác định sự kiện cần log

**Sự kiện Audit Trail (bắt buộc):**
- Tạo mới → Ai? Khi nào? Dữ liệu ban đầu?
- Chỉnh sửa → Ai? Trường nào đổi? Từ/sang giá trị gì?
- Xóa / Vô hiệu hóa → Ai? Khi nào?
- Phê duyệt / Từ chối → Ai duyệt? Lý do từ chối?

**Sự kiện Analytics (nếu cần):**
- Người dùng hủy bỏ giữa chừng → Hủy ở bước nào?
- Người dùng gặp lỗi validation → Lỗi nào phổ biến?

### D2: Bảng Tracking Events

```markdown
| Sự kiện | Khi nào xảy ra | Dữ liệu ghi lại | Loại |
|---|---|---|---|
| [Tên sự kiện] | [Trigger cụ thể] | [Dữ liệu cần lưu] | Audit / Analytics |
```

**Cột Loại:** `Audit` = kiểm toán bắt buộc | `Analytics` = hành vi người dùng

**Ví dụ cụ thể:**

| Sự kiện | Khi nào xảy ra | Dữ liệu ghi lại | Loại |
|---|---|---|---|
| PayPeriod.Created | Sau khi Admin nhấn "Lưu" thành công | UserId, PayPeriodId, StartDate, EndDate, CreatedAt | Audit |
| PayPeriod.Updated | Sau khi Admin chỉnh sửa và lưu | UserId, PayPeriodId, ChangedFields (JSON: {field: {old, new}}), UpdatedAt | Audit |
| PayPeriod.Deleted | Sau khi Admin xác nhận xóa | UserId, PayPeriodId, DeletedAt, Reason (nếu có) | Audit |
| PayPeriod.ValidationError | Khi validation thất bại | UserId, FieldName, ErrorMessage, AttemptedValue, OccurredAt | Analytics |
| PayPeriod.FormAbandoned | Khi người dùng thoát form chưa lưu | UserId, FieldsFilled (%), AbandonedAt, TimeSpent (seconds) | Analytics |

---

## Kết quả đầu ra Step 06c

Hiển thị bảng Tracking Events đã tạo:

```
════════════════════════════════════════════════════════════
✓ HOÀN THÀNH STEP 06c — TRACKING & ANALYTICS

📈 TRACKING EVENTS — US [{US-ID}]
════════════════════════════════════
Audit Trail Events    : [{N} sự kiện]
Analytics Events      : [{N} sự kiện]

Bảng Tracking Events:
[Hiển thị bảng đầy đủ với 4 cột]
════════════════════════════════════
════════════════════════════════════════════════════════════
```

**Tự động chuyển sang Step 07** — đọc và thực thi: `./steps/step-07-generate-traceability.md`
