---
name: vnr-ba-advanced-us
---

# HRM360_Advanced - Phân Tích Chuyên Sâu

## 📋 IMPORT CONTEXT - BẮT BUỘC
**Skill này yêu cầu đã nạp Context skill trước đó** (VD: `/HRM360-Context`).

Skill sẽ TỰ ĐỘNG sử dụng:
- ✅ **Danh sách vai trò** (icon + tên + trọng tâm)
- ✅ **Góc nhìn từng vai trò** (concerns, checklist)
- ✅ **Bối cảnh dự án** (module, dependencies, constraints)

**Cách dùng:**
```
1. Nạp Context trước:        /HRM360-Context
2. Sau đó dùng Advanced:     /HRM360-Advanced compare [A] vs [B]
```

**Lưu ý:** Nếu chưa nạp Context, skill này sẽ **yêu cầu người dùng chỉ định vai trò thủ công**.

---

## 📋 BẢNG LỆNH

| Lệnh | Input | Output |
|---|---|---|
| `compare [A] vs [B]` | 2 phương án | So sánh từ tất cả vai trò (Context) |
| `gap analysis [nội dung]` | Chức năng/flow | Gap/thiếu sót |
| `edge cases [chức năng]` | Chức năng cụ thể | Danh sách edge cases |
| `conflict check [nội dung]` | Nội dung cần kiểm tra | Xung đột giữa vai trò (Context) |
| `checklist [vai trò]` | Vai trò cụ thể | Checklist review cho vai trò |

## 📐 QUY TẮC

### compare
- Mỗi vai trò (từ Context) đánh giá cả 2 phương án
- Bảng so sánh: Tiêu chí | PA A | PA B | Khuyến nghị
- Kết luận: Khuyến nghị + lý do + trade-off

### gap analysis
- Liệt kê chức năng đã cover
- Liệt kê chức năng THIẾU
- Phân loại: Critical gap / Nice-to-have gap
- Đề xuất bổ sung

### edge cases
- Format: Điều kiện | Hành vi mong đợi | Đã cover? | Ảnh hưởng
- Phân loại: Happy path / Error path / Boundary / Concurrent

### conflict check
- Kiểm tra xung đột giữa BR, AC, VM
- Format: Item A | Item B | Xung đột | Mức độ | Đề xuất

### checklist
- Xuất checklist review theo vai trò cụ thể
- Gắn với AC/BR nếu có
