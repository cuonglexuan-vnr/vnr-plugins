---
name: vnr-ba-analyze-us
---

# HRM360_Analyze - Phân Tích Nghiệp Vụ

## 📋 IMPORT CONTEXT - BẮT BUỘC
**Skill này yêu cầu đã nạp Context skill trước đó** (VD: `/HRM360-Context`).

Skill sẽ TỰ ĐỘNG sử dụng:
- ✅ **Danh sách vai trò** (icon + tên + trọng tâm)
- ✅ **Góc nhìn từng vai trò** (câu hỏi thường gặp, concerns)
- ✅ **Bối cảnh dự án** (module, dependencies, constraints)
- ✅ **Quy tắc chung** (ngôn ngữ, xử lý xung đột, tương thích ngược)

**Cách dùng:**
```
1. Nạp Context trước:     /HRM360-Context
2. Sau đó dùng Analyze:   /HRM360-Analyze [bài toán]
```

**Lưu ý:** Nếu chưa nạp Context, skill này sẽ **yêu cầu người dùng chỉ định vai trò thủ công**.

---

## 📐 LỆNH: `analyze [bài toán]`

### Mục đích
Khi nhận bài toán nghiệp vụ thô, các vai trò (từ Context skill) sẽ trao đổi, tranh luận để:
1. Hiểu rõ bài toán từ nhiều góc nhìn
2. Phát hiện mâu thuẫn, gap, rủi ro sớm
3. Đưa ra quyết định nghiệp vụ (decisions)
4. Chuẩn bị đủ thông tin để viết US

### FORMAT OUTPUT BẮT BUỘC

# 📋 PHÂN TÍCH NGHIỆP VỤ: [Tên bài toán]

## 1. 🎯 TÓM TẮT BÀI TOÁN
- Mô tả ngắn gọn
- Actor chính
- Mục tiêu nghiệp vụ

## 2. 👥 GÓC NHÌN TỪNG VAI TRÒ

**[Dùng danh sách vai trò từ Context skill đã nạp]**

Với mỗi vai trò (icon + tên), phân tích:
- **Hiểu bài toán:** Vai trò này nhìn bài toán như thế nào?
- **Yêu cầu / Mong muốn:** Vai trò này cần gì?
- **Câu hỏi cần làm rõ:** Vai trò này thắc mắc gì? (tham khảo "Câu hỏi thường gặp" từ Context)
- **Rủi ro / Concern:** Vai trò này lo ngại gì?

**Format output:**
```
### [Icon] [TÊN VAI TRÒ]
**Hiểu bài toán:** [...]
**Yêu cầu / Mong muốn:** [...]
**Câu hỏi cần làm rõ:** [...]
**Rủi ro / Concern:** [...]
```

## 3. ⚡ TRANH LUẬN & XUNG ĐỘT
| # | Vai trò A | Quan điểm A | Vai trò B | Quan điểm B | Trade-off | Khuyến nghị |
|---|-----------|-------------|-----------|-------------|-----------|-------------|

## 4. ✅ QUYẾT ĐỊNH NGHIỆP VỤ (Cần confirm)
| # | Quyết định | Lý do | Phương án bị loại | Ảnh hưởng | Status |
|---|-----------|-------|-------------------|-----------|--------|

## 5. 📝 CHUẨN BỊ CHO US
### US cần viết:
| # | US ID (đề xuất) | Title | Scope | Ưu tiên |
### Checklist thông tin:
- [ ] Actor đã xác định
- [ ] Flow chính đã chốt
- [ ] BR chính đã xác định
- [ ] Edge cases đã liệt kê
- [ ] Dependencies đã xác định
### Thông tin CẦN BỔ SUNG:
1. [...]

## ⚡ QUY TẮC ANALYZE

### 1. Xung đột lành mạnh
- Mỗi vai trò PHẢI đưa ra ít nhất 1 concern khác biệt
- Ưu tiên phát hiện trade-off phổ biến:
  | Trade-off | VD Vai trò A | VD Vai trò B |
  |---|---|---|
  | Linh hoạt vs Đơn giản | Admin/Config | End User |
  | Đầy đủ vs Effort | PO/BA | Dev |
  | Bảo mật vs Tiện lợi | Admin/Security | End User |
  | Tự động vs Thủ công | System | Manager/Operator |
  
  **Lưu ý:** Trade-offs cụ thể phụ thuộc vào vai trò đã được định nghĩa trong Context skill.

### 2. Quyết định phải có lý do
- **What**: Quyết định gì
- **Why**: Tại sao chọn
- **Alternatives**: Phương án bị loại
- **Impact**: Ảnh hưởng đến US/module nào

### 3. Phân biệt trạng thái
| Status | Icon | Nghĩa |
|---|---|---|
| Đã chốt | ✅ | Rõ ràng, không cần hỏi |
| Cần confirm | ⏳ | Cần anh Tiến quyết định |
| Cần thêm info | ❓ | Thiếu input, hỏi stakeholder |

### 4. Output phải actionable
- Danh sách US cần viết (ID + title + scope)
- Checklist đã đủ / chưa đủ
- Câu hỏi cần trả lời

## 📋 CÁC LỆNH HỖ TRỢ
| Lệnh | Mô tả |
|---|---|
| `analyze [bài toán]` | Phân tích đa vai trò + quyết định |
| `analyze deep [chủ đề]` | Phân tích sâu 1 khía cạnh |
| `decisions [bài toán]` | Liệt kê quyết định + trade-offs |
| `prepare us [bài toán]` | Checklist sẵn sàng viết US |
