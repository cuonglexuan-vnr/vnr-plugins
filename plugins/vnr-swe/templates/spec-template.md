# spec.md

## I. Thông tin chung

| Mục                | Nội dung                   |
| ------------------ | -------------------------- |
| Tên yêu cầu        | Viết lại yêu cầu gốc       |
| Loại yêu cầu       | New Feature / Modify / Bug |
| Mục tiêu nghiệp vụ |                            |
| Tài liệu đầu vào   | requirement-review.md      |
| Người phân tích    |                            |
| Ngày cập nhật      |                            |

---

# II. Hiện trạng hệ thống

> Bắt buộc đối với yêu cầu Modify/Bug. Bỏ qua nếu là New Feature thuần túy.

## 1. Màn hình liên quan

| Màn hình | Đường dẫn |
| -------- | --------- |
|          |           |

### File tham khảo

```text
link/file.md
```

---

## 2. Luồng thao tác hiện tại

### Các bước thực hiện

1.
2.
3.

### Kết quả hiện tại

```text
Mô tả kết quả thực tế của hệ thống.
Ghi rõ điểm còn thiếu / chưa đúng / chưa enforce nếu có.
```

---

## 3. Cấu hình liên quan (nếu có)

| Cấu hình | Giá trị hiện tại |
| -------- | ---------------- |
|          |                  |

---

# III. Giải pháp đề xuất

## 1. Tóm tắt giải pháp

```text
Mô tả ngắn gọn giải pháp đề xuất.
```

---

## 2. Phạm vi thay đổi

### Chức năng ảnh hưởng

| Chức năng | Loại thay đổi         |
| --------- | --------------------- |
|           | New / Modify / Remove |

### Màn hình ảnh hưởng

| Màn hình | Mức độ                  |
| -------- | ----------------------- |
|          | Cao / Trung bình / Thấp |

---

## 3. Mô tả thay đổi chi tiết

### [BS-01] <Tên thay đổi>

**Loại:** New / Modify / Remove

#### Màn hình

```text
Tên màn hình và đường dẫn
```

#### Schema thay đổi (nếu có)

| Field | Bảng | Kiểu | Mặc định | Ghi chú |
| ----- | ---- | ---- | -------- | ------- |
|       |      |      |          |         |

#### Yêu cầu thay đổi

##### Thêm mới

* ...

##### Sửa đổi

* ...

##### Giữ nguyên

* ...

##### Loại bỏ

* ...

#### Lưu ý nghiệp vụ (nếu có)

* ...

#### Validate

| Điều kiện | Thông báo |
| --------- | --------- |
|           |           |

---

### [BS-02] <Tên thay đổi>

**Loại:** New / Modify / Remove

#### Màn hình

```text
Tên màn hình và đường dẫn
```

#### Schema thay đổi (nếu có)

| Field | Bảng | Kiểu | Mặc định | Ghi chú |
| ----- | ---- | ---- | -------- | ------- |
|       |      |      |          |         |

#### Yêu cầu thay đổi

##### Thêm mới

* ...

##### Sửa đổi

* ...

##### Giữ nguyên

* ...

##### Loại bỏ

* ...

#### Lưu ý nghiệp vụ (nếu có)

* ...

#### Validate

| Điều kiện | Thông báo |
| --------- | --------- |
|           |           |

---

# IV. Giao diện

## Có cần thiết kế UI/Prototype không?

* [ ] Không
* [ ] Có

### Nếu có

| Màn hình | Link thiết kế |
| -------- | ------------- |
|          |               |

### Mockup mô tả

```text
Mô tả giao diện hoặc đính kèm hình ảnh.
```

---

# V. Vùng ảnh hưởng

## Chức năng liên quan

| Chức năng | Mức độ ảnh hưởng        |
| --------- | ----------------------- |
|           | Cao / Trung bình / Thấp |

---

## Dữ liệu liên quan

| Đối tượng dữ liệu | Tác động |
| ----------------- | -------- |
|                   |          |

---

## Quy trình nghiệp vụ liên quan

* ...
* ...

---

# VIII. Checklist hoàn thành

## Hiện trạng

* [ ] Đã xác định màn hình hiện tại
* [ ] Đã mô tả luồng thao tác hiện tại
* [ ] Đã xác định cấu hình liên quan

## Giải pháp

* [ ] Đã mô tả đầy đủ thay đổi nghiệp vụ
* [ ] Đã xác định màn hình ảnh hưởng
* [ ] Đã liệt kê validate
* [ ] Đã điền schema thay đổi cho mọi [BS-xx] có thay đổi DB

## Chất lượng

* [ ] Đã đánh giá vùng ảnh hưởng
* [ ] Đã có tiêu chí nghiệm thu
* [ ] Không còn blocker nghiệp vụ
* [ ] Sẵn sàng chuyển sang Phase 3

---

# Technical Considerations For Phase 3

> Ghi nhận kỹ thuật — KHÔNG phải thiết kế kỹ thuật.
> Mục đích: BA ghi nhận những gì cần verify/tham khảo khi implement — SP hiện tại, pattern tương tự, edge case đặc biệt.

* ...
* ...
