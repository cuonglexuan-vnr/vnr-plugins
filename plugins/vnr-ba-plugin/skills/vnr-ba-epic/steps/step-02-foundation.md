# Step 02 — PHẦN I: Nền tảng

## Mục tiêu

Viết 3 sections nền tảng của EPIC: định nghĩa domain, stakeholders, và hiện trạng vận hành. Đây là phần BA biết rõ nhất — agent đề xuất, BA xác nhận.

---

## Section 1: Định nghĩa & Bản chất

Đề xuất nội dung dựa trên Research Brief (nếu có) hoặc domain knowledge:

```markdown
## 1. Định nghĩa & Bản chất

**Khái niệm:** {Mô tả domain là gì, theo ngôn ngữ nghiệp vụ VN}

**Phân loại:** {Các loại hình/biến thể của domain này}

**Vòng đời:** {Các trạng thái — từ khởi tạo đến kết thúc}
```

Ví dụ với EPIC "IDP":
```
Vòng đời: Tạo mới → Phê duyệt → Đang thực hiện → Đánh giá → Hoàn thành / Hủy
```

Hỏi BA:
```
Section 1 đề xuất trên có phản ánh đúng domain [{Tên EPIC}] không?
Có phân loại nào hoặc trạng thái nào còn thiếu không?
```

---

## Section 2: Stakeholders & Roles

Đề xuất danh sách actor dựa trên domain:

```markdown
## 2. Stakeholders & Roles

| Actor | Vai trò | Quyền hạn liên quan |
|---|---|---|
| {Actor 1} | {Mô tả vai trò} | {Quyền có thể làm trong domain này} |
| {Actor 2} | ... | ... |
```

Hỏi BA:
```
Danh sách actor trên đầy đủ chưa?
Có actor nào đặc thù của doanh nghiệp khách hàng mà tôi chưa liệt kê không?
```

---

## Section 3: Operational Context (As-Is)

**Quan trọng:** Đây là hiện trạng thực tế — không phải tầm nhìn, không phải To-Be.

Đề xuất dựa trên VN market research:

```markdown
## 3. Operational Context (Hiện trạng)

**Cách phổ biến hiện tại tại DN VN:**
- {Mô tả cách làm thủ công / hệ thống cũ}
- {Pain point chính}
- {Workaround phổ biến}

**Công cụ đang dùng:** Excel / Google Sheet / phần mềm khác
```

Hỏi BA:
```
Hiện trạng mô tả trên có khớp với khách hàng bạn hay không?
Có pain point nào đặc biệt nổi bật mà khách hàng hay phàn nàn không?
```

---

## Kết quả Step 02

Tổng hợp và trình BA review toàn bộ PHẦN I:

```
--- PHẦN I: NỀN TẢNG (Draft) ---
[Section 1, 2, 3 đầy đủ]

BA có muốn chỉnh sửa phần nào trước khi sang PHẦN II không?
```

Sau khi BA approve, đọc: `./steps/step-03-strategy.md`
