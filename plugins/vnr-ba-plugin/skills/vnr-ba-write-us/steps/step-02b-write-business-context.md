# Step 02b — Write Business Context

## Mục tiêu

Viết phần "Mô Tả Nghiệp Vụ" để cung cấp context đầy đủ cho Dev/QA hiểu rõ nghiệp vụ của US này. Phần này bao gồm: Bối cảnh, Cấu trúc Master-Detail (nếu có), Ví dụ minh họa, và Thuật ngữ đặc thù.

---

## Nguyên tắc bắt buộc

1. **100% ngôn ngữ nghiệp vụ** — không có từ kỹ thuật
2. **Cụ thể, có ví dụ thực tế** — không viết chung chung
3. **Ngắn gọn** — khoảng 3-5 đoạn, mỗi đoạn 2-4 câu

---

## Hành động 1: Viết Bối cảnh nghiệp vụ

**Mục đích:** Giải thích TẠI SAO cần US này, vấn đề nghiệp vụ nào đang giải quyết.

**Nguồn thông tin:**
- Từ FEAT cha (mô tả chung của FEAT)
- Từ EPIC cha (mục tiêu Epic)
- Từ `SELECTED_TASK` + Business Value trong Statement (Step 02)

---

## Hành động 2: Mô tả Cấu trúc Master-Detail (nếu có)

**Chỉ viết nếu:** US liên quan đến cấu trúc dữ liệu Master-Detail (1-nhiều)

**Nếu không có Master-Detail:** Bỏ qua phần này.

---

## Hành động 3: Tạo Ví dụ minh họa (bảng)

**Mục đích:** Giúp Dev/QA hình dung cụ thể dữ liệu nghiệp vụ

Tạo bảng mẫu với 2-3 rows dữ liệu thực tế.

---

## Hành động 4: Liệt kê Thuật ngữ đặc thù

**Mục đích:** Định nghĩa các thuật ngữ nghiệp vụ đặc thù mà Dev/QA cần hiểu

**Nguồn thông tin:**
- Từ FEAT cha (thuật ngữ chung)
- Từ BR-F (các khái niệm trong Business Rules)
- Từ AC (các thuật ngữ được nhắc trong AC)

**Nếu không có thuật ngữ đặc thù:** Ghi "Không có thuật ngữ đặc thù"

---

## Kết quả đầu ra Step 02b

Hiển thị Business Context đã tạo:

```
════════════════════════════════════════════════════════════
✓ HOÀN THÀNH STEP 02b — MÔ TẢ NGHIỆP VỤ

📖 Bối cảnh: [X] đoạn văn
📊 Cấu trúc Master-Detail: [Có / Không]
📋 Ví dụ minh họa: [1] bảng
📚 Thuật ngữ: [N] thuật ngữ
════════════════════════════════════════════════════════════
```

**Tự động chuyển sang Step 03** — đọc và thực thi: `./steps/step-03-write-ac.md`
