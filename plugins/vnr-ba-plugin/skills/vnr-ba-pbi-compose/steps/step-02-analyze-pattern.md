# Step 02 — Phân tích Pattern Mapping

## Mục tiêu

Với mỗi US chưa mapped, xác định pattern phù hợp.

---

## 3 Pattern Mapping

### Pattern A — nhiều US → 1 PBI (nhóm lại)

**Khi nào dùng:**
- Các US cùng entity / cùng screen
- Mỗi US quá nhỏ để thành 1 PBI sprint riêng
- Tổng AC của nhóm ≤ 12 criteria

**Ví dụ:**
```
ATT-US-005 (Shift Definition) ┐
ATT-US-006 (Shift Rotation)   ├──→ PBI-shift-management
ATT-US-007 (Shift Scheduling) ┘
```

---

### Pattern B — 1 US → 1 PBI

**Khi nào dùng:**
- US có scope vừa phải (4-8 AC)
- Business value rõ ràng, độc lập

---

### Pattern C — 1 US → nhiều PBI (decompose theo layer)

**Khi nào dùng:**
- US có engine tính toán phức tạp
- US có aggregation (tháng → quý → năm)
- US cần nhiều sprint để complete

**Ví dụ:**
```
US: "Cập nhật tiến độ mục tiêu"
   ├──→ PBI-A: Progress Update UI
   ├──→ PBI-B: Aggregation Engine
   └──→ PBI-C: Parent Roll-up
```

---

## Hành động: Phân tích từng US

Với mỗi US, đọc:
- Số AC và complexity
- Actor liên quan
- Data Dictionary (số trường)
- Overlap với US khác trong danh sách

Phân loại từng US vào 1 trong 3 patterns.

Sau đó đọc: `./steps/step-03-propose-mapping.md`
