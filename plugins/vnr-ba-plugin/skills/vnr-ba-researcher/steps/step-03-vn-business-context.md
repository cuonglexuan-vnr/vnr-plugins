# Step 03 — VN Business Context

## Mục tiêu

Xác định các yếu tố pháp lý, văn hóa, và vận hành đặc thù Việt Nam ảnh hưởng trực tiếp đến domain đang research. Đây là lớp context mà các sản phẩm nước ngoài thường bỏ sót.

---

## Hành động 1: Đọc VN context từ _product/

Đọc `_product/vn-business-context.md` — tìm các section liên quan đến domain hiện tại.

Nếu file không đủ chi tiết cho domain này, bổ sung bằng Step 2.

---

## Hành động 2: Research VN-specific constraints

Dựa trên domain, research các điểm sau (chỉ research những điểm thực sự liên quan):

### Pháp lý & Luật lao động
```
Query gợi ý:
- "Bộ luật lao động 2019 [domain]"
- "Thông tư [số] [domain] nhân sự"
- "BHXH [domain] quy định"
```

Ghi nhận:
- Điều khoản pháp lý ràng buộc hệ thống phải tuân thủ
- Deadline báo cáo, kỳ hạn nộp
- Trường hợp ngoại lệ theo luật (thai sản, nghỉ ốm, tai nạn lao động...)

### Văn hóa vận hành doanh nghiệp VN

Đọc `_product/segments/` để hiểu đặc điểm từng nhóm. Highlight những điểm ảnh hưởng trực tiếp đến domain:

**High-tech / Startup:**
- Ưu tiên tự động hóa, minh bạch, audit trail
- Ngại quy trình phức tạp

**Sản xuất / Manufacturing:**
- Cần can thiệp thủ công, có thể override kết quả
- Quy trình nhiều bước, nhiều người phê duyệt
- Dữ liệu ca làm việc phức tạp

**Dịch vụ / Service:**
- Nhân sự part-time, thời vụ nhiều
- Hoa hồng, KPI theo thị trường

**DNNN:**
- Thang bảng lương cứng, phụ cấp theo quy chế
- Phê duyệt nhiều tầng, chữ ký số

---

## Hành động 3: Tổng hợp VN Context Table

```markdown
## VN Business Context — {Tên Domain}

### Ràng buộc pháp lý
| Luật/Thông tư | Điều khoản liên quan | Ảnh hưởng đến hệ thống |
|---|---|---|
| BLLĐ 2019, Điều X | [Nội dung] | [Hệ thống phải làm gì] |

### Đặc điểm theo nhóm khách hàng
| Nhóm DN | Đặc điểm vận hành | Yêu cầu khác biệt |
|---|---|---|
| High-tech | [Đặc điểm] | [Yêu cầu] |
| Sản xuất | [Đặc điểm] | [Yêu cầu] |
| Dịch vụ | [Đặc điểm] | [Yêu cầu] |

### Tình huống phức tạp thường gặp tại VN
- [Tình huống 1]: [Mô tả — tại sao phức tạp]
- [Tình huống 2]: ...
```

---

## Kết quả Step 03

Trình BA review VN Context Table. Hỏi:
```
Có điểm nào về luật hoặc văn hóa DN tôi bỏ sót không?
Khách hàng của bạn thường thuộc nhóm nào nhất?
```

Sau khi BA confirm, đọc: `./steps/step-04-edge-case-discovery.md`
