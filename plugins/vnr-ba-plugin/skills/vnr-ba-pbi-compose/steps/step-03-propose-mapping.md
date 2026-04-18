# Step 03 — Đề xuất Mapping & Confirm

## Hành động: Trình bày đề xuất mapping

Trình BA toàn bộ mapping đề xuất:

```
══════════════════════════════════════════════
MAPPING ĐỀ XUẤT
══════════════════════════════════════════════

Pattern A (nhiều→1):
┌─────────────────────────────────────────┐
│ ATT-US-005 (Shift Definition)      ┐    │
│ ATT-US-006 (Shift Rotation)        ├──→ PBI-008 "shift-management"
│ ATT-US-007 (Shift Scheduling)      ┘    │
│ Lý do gộp: Cùng entity Shift, cùng screen  │
└─────────────────────────────────────────┘

Pattern B (1→1):
┌─────────────────────────────────────────┐
│ IDP-US-005 (QLTT tạo IDP) ──────────→ PBI-009 "create-idp"
│ Lý do: Đủ phức tạp, scope rõ ràng       │
└─────────────────────────────────────────┘

Pattern C (1→nhiều):
┌─────────────────────────────────────────┐
│ IDP-US-012 (Cập nhật tiến độ mục tiêu)  │
│   ├──→ PBI-010: Progress Update UI      │
│   ├──→ PBI-011: Aggregation Engine      │
│   └──→ PBI-012: Parent Roll-up          │
│ Lý do: 3 tầng tính toán độc lập         │
└─────────────────────────────────────────┘

Tổng: {N} US → {M} PBI
══════════════════════════════════════════════

BA đồng ý với mapping này không?
Có US nào muốn thay đổi pattern không?
```

---

## Hành động: Xử lý feedback

Nếu BA muốn thay đổi:
```
Được, tôi sẽ điều chỉnh:
• {US-ID}: đổi từ Pattern A → Pattern B
  → Sẽ thành PBI riêng: PBI-{N}
```

Khi BA confirm, đọc: `./steps/step-04-finalize.md`
