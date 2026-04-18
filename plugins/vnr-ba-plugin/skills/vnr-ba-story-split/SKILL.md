---
name: vnr-ba-story-split
description: 'Phát hiện US quá lớn và cắt thành nhiều US nhỏ hơn, cập nhật FEAT Actor-Task Matrix. Trigger: "ba story split", "tách us", "split us [id]"'
---

# Workflow: ba-story-split

## Mục tiêu

Phát hiện US "too big to implement in 1 sprint" và cắt thành các US nhỏ hơn, mỗi cái vẫn deliver 1 business value độc lập. Sau khi tách, cập nhật FEAT cha.

---

## Đầu vào

US ID cần tách. Hỏi nếu chưa rõ lý do muốn tách.

---

## Hành động 1: Phân tích tại sao US quá lớn

Đọc US hiện tại, kiểm tra 4 dấu hiệu:

1. **Nhiều actor khác nhau** trong cùng 1 US → mỗi actor nên là 1 US riêng
2. **Nhiều happy path** độc lập → mỗi path nên là 1 US
3. **AC > 8-10 criteria** → quá nhiều cho 1 US
4. **Nhiều luồng BPMN** trong Activity Diagram → nên tách

---

## Hành động 2: Đề xuất cách tách

Trình BA:
```
US [{US-ID}] có {N} AC và cover {N} actor/luồng — quá lớn.

Đề xuất tách thành {N} US:

US-A: "{Tên US mới A}" — Actor: {X}, AC: {1, 2, 3}
  Business value: {Mô tả}

US-B: "{Tên US mới B}" — Actor: {Y}, AC: {4, 5}
  Business value: {Mô tả}

US-C: "{Tên US mới C}" — Edge case: {AC-6, AC-7}
  Business value: {Mô tả}

BA đồng ý cách tách này không?
```

---

## Hành động 3: Tạo các US mới

Với mỗi US mới sau khi BA confirm:
- Tạo file US mới theo template chuẩn
- Phân chia AC, BR-U, Data Dictionary từ US cũ
- Mỗi US mới phải có Activity Diagram riêng

---

## Hành động 4: Cập nhật FEAT + xóa/archive US cũ

- Cập nhật Actor-Task Matrix của FEAT: thay 1 row cũ → N rows mới
- Cập nhật `us_count` trong FEAT frontmatter
- Đổi tên file US cũ thành `{US-ID}_SPLIT.md` (archive) hoặc xóa nếu BA đồng ý

---

## Thông báo kết quả

```
✅ Đã tách US [{US-ID}] thành {N} US:
   • [{US-ID-A}] {Tên A}
   • [{US-ID-B}] {Tên B}
   • [{US-ID-C}] {Tên C}

🔗 Đã cập nhật FEAT: {FEAT-ID} (us_count: {N-1} → {N+2})

Gợi ý: Chạy /ba-us-check cho từng US mới.
```
