---
name: vnr-ba-review-us
---

# HRM360_Review - Review User Story

## 📋 IMPORT CONTEXT - BẮT BUỘC
**Skill này yêu cầu đã nạp Context skill trước đó** (VD: `/HRM360-Context`).

Skill sẽ TỰ ĐỘNG sử dụng:
- ✅ **Danh sách vai trò** (icon + tên + trọng tâm)
- ✅ **Góc nhìn từng vai trò** (concerns, checklist)
- ✅ **Bối cảnh dự án** (module, dependencies, constraints)
- ✅ **Quy tắc chung** (ngôn ngữ, xử lý xung đột)

**Cách dùng:**
```
1. Nạp Context trước:     /HRM360-Context
2. Sau đó dùng Review:    /HRM360-Review [US]
```

**Lưu ý:** Nếu chưa nạp Context, skill này sẽ **yêu cầu người dùng chỉ định vai trò thủ công**.

---

## 📐 LỆNH
| Lệnh | Mô tả |
|---|---|
| `review [US]` | Review US từ tất cả vai trò (từ Context) |
| `review as [vai trò] [US]` | Review từ 1 vai trò cụ thể |

## 📊 FORMAT OUTPUT BẮT BUỘC

### Phần 1: Tổng quan
- **Nội dung review**: [Tóm tắt]
- **Đánh giá tổng thể**: [X]/10
- **Số vấn đề**: 🔴 [n] Cao | 🟡 [n] TB | 🟢 [n] Thấp

### Phần 2: Review theo từng vai trò

**[Dùng danh sách vai trò từ Context skill đã nạp]**

Với mỗi vai trò (icon + tên), phân tích:

```
## [Icon] [TÊN VAI TRÒ]
### ✅ Điểm tốt (ít nhất 2-3 điểm)
| # | Nội dung | Lý do tốt | Vai trò hưởng lợi |

### ⚠️ Vấn đề phát hiện
| # | Vấn đề | Mức độ | Confidence | Ảnh hưởng | Đề xuất |

### ❓ Câu hỏi cần làm rõ
```

### Phần 3: Cross-Role
| Xung đột | Vai trò A | Vai trò B | Trade-off | Khuyến nghị |

### Phần 4: Action Items
#### 🔴 P1 - Fix NGAY
| # | Action | Vai trò phát hiện | US ảnh hưởng | Effort | Người thực hiện |
#### 🟠 P2 - Fix trước sprint planning
[Tương tự]
#### 🟡 P3 - Fix khi có thời gian
[Tương tự]
#### ℹ️ Backlog
[Tương tự]

## 🧠 CHAIN OF THOUGHT - BẮT BUỘC

Mỗi finding PHẢI có 4 bước:
| Bước | Hành động |
|---|---|
| 1. Trích dẫn | Quote chính xác từ US |
| 2. Reasoning | Giải thích TẠI SAO là vấn đề |
| 3. Đề xuất | Giải pháp cụ thể, actionable |
| 4. Đánh giá | Mức độ + confidence |

❌ SAI: "BR có vấn đề" (thiếu trích dẫn)
❌ SAI: "Nên sửa lại" (thiếu đề xuất cụ thể)
❌ SAI: "Có thể có lỗi" (thiếu reasoning)

## ⚖️ CÂN BẰNG POSITIVE FEEDBACK
| Phần | Tỉ lệ |
|---|---|
| ✅ Điểm mạnh | ~30% |
| ⚠️ Cần cải thiện | ~60% |
| 💡 Gợi ý nâng cao | ~10% |

## 📊 PHÂN LOẠI MỨC ĐỘ

| Mức độ | Icon | Định nghĩa | Hành động |
|---|---|---|---|
| Critical | 🔴 | Lỗi logic, mất data, block dev | Fix NGAY |
| Major | 🟠 | Hiểu sai, thiếu validate | Fix trước sprint planning |
| Minor | 🟡 | Cải thiện chất lượng | Fix khi có thời gian |
| Info | ℹ️ | Gợi ý, best practice | Backlog |

| Confidence | Icon | Định nghĩa |
|---|---|---|
| High | 🟢 | Chắc chắn, có bằng chứng rõ |
| Medium | 🟡 | Có thể, cần confirm |
| Low | 🔵 | Gợi ý best practice |

## 🔄 CROSS-US CONSISTENCY CHECK
Khi review nhiều US, PHẢI kiểm tra:
1. Mã BR không trùng giữa các US
2. Thuật ngữ nhất quán
3. Dependencies đúng chiều
4. Data model tương thích
5. VM message nhất quán

## 📐 PHẠM VI REVIEW
✅ TRONG SCOPE: Nội dung US, nhất quán BR↔AC↔VM, đầy đủ template, 
edge cases, cross-US, UX flow, quyền hạn
❌ NGOÀI SCOPE: Code, DB schema, API, performance, security audit, 
infrastructure, cost

## 🚦 XỬ LÝ FINDINGS
| Mức độ | Hành động | Tiếp theo |
|---|---|---|
| 🔴 P1 | Fix ngay, tăng version | Quay lại Review |
| 🟠 P2 | Fix trước sprint planning | Có thể dev |
| 🟡 P3 | Fix khi có thời gian | ✅ Ready For Dev |
| ℹ️ Info | Ghi nhận | ✅ Ready For Dev |
