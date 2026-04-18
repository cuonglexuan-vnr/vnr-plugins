# Step 02 — Competitor Analysis

## Mục tiêu

Research cách các sản phẩm cạnh tranh giải quyết domain đang phân tích. VN market trước, quốc tế sau. Không copy — dùng để định vị và không bỏ sót tính năng quan trọng.

---

## Hành động 1: Research VN competitors

Dùng WebSearch để research các sản phẩm HRM VN theo domain cụ thể:

**Sản phẩm VN cần cover:**
- MISA HRM (misa.com.vn)
- Base.vn HRM
- CloudHRM (cloudhrm.vn)
- FPT IS HRM
- 1Office, Fastwork HRM

**Câu hỏi research cho mỗi sản phẩm:**
```
"{Tên sản phẩm} {domain} feature" hoặc
"{Tên sản phẩm} quản lý {domain} tính năng"
```

**Ghi nhận:**
- Có tính năng gì? (Chỉ public-facing info)
- Có gì nổi bật / differentiated?
- Có gap gì so với thực tế VN?

---

## Hành động 2: Research international benchmarks

**Sản phẩm quốc tế cần cover:**
- Workday HCM
- SAP SuccessFactors
- BambooHR
- Personio (Europe — gần với VN market size hơn Workday)

**Câu hỏi research:**
```
"{Tên sản phẩm} {domain} module features"
"{domain} best practices enterprise HRM"
```

**Chỉ lấy:** Pattern thiết kế tổng thể, không phải chi tiết UI vì culture khác.

---

## Hành động 3: Tổng hợp Feature Matrix

Sau khi research, tạo bảng so sánh:

```markdown
## Feature Matrix — {Tên Domain}

| Tính năng | MISA | Base | CloudHRM | Workday | SAP SF | Ghi chú |
|---|:---:|:---:|:---:|:---:|:---:|---|
| {Feature 1} | ✅ | ✅ | ❌ | ✅ | ✅ | Baseline |
| {Feature 2} | ❌ | ✅ | ❌ | ✅ | ✅ | Thị trường VN còn thiếu |
| {Feature 3} | ✅ | ❌ | ✅ | ✅ | ✅ | Common pattern |
| {Feature 4} | ❌ | ❌ | ❌ | ✅ | ✅ | Chỉ enterprise cần |
```

**Phân loại:**
- **Baseline** (tất cả có): PHẢI có
- **VN gap** (VN chưa có): cơ hội differentiate
- **Enterprise only** (chỉ Workday/SF có): cân nhắc theo phân khúc

---

## Hành động 4: Insight tổng hợp

Viết 3-5 insight ngắn:
```
💡 Insight 1: [Điều nổi bật phát hiện từ competitor research]
💡 Insight 2: ...
```

---

## Kết quả Step 02

Trình BA review Feature Matrix và Insights. Hỏi:
```
Feature Matrix trên phản ánh đúng domain không?
Có tính năng nào quan trọng tôi chưa liệt kê không?
```

Sau khi BA confirm, đọc: `./steps/step-03-vn-business-context.md`
