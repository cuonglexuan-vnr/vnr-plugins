# Step 04 — Business Rules & Feature Acceptance Criteria

## Section 4: Business Rules (BR-F)

BR-F specialise từ BR-E của EPIC cha. Mỗi BR-E hoặc được kế thừa nguyên trạng, hoặc được specialise thêm điều kiện cho FEAT này.

```markdown
## 4. Business Rules (BR-F)

- **BR-F001 ({Tên}):** {Mô tả rule}
  *(Specialise BR-E001 — thêm điều kiện: {mô tả sự khác biệt})*

- **BR-F002 ({Tên}):** {Mô tả rule}
  *(Kế thừa BR-E002)*

- **BR-F003 ({Tên — mới ở FEAT này}):** {Mô tả rule phát sinh từ scope FEAT}
  *(BR mới — không có tương ứng tại EPIC cha)*
```

**Quy tắc:**
- Bắt đầu từ danh sách BR-E đã load ở Step 01
- Mỗi BR-E phải được xử lý (kế thừa / specialise / không áp dụng)
- BR mới chỉ phát sinh khi scope FEAT có rule không có trong BR-E
- ba-us sẽ specialise tiếp BR-F → BR-U

---

## Section 5: Feature Acceptance Criteria (FAC)

FAC là điều kiện "Done" ở cấp FEAT — tổng quát hơn AC của US. US AC sẽ trace về FAC.

```markdown
## 5. Feature Acceptance Criteria (FAC)

- **FAC-001 ({Tên}):** {Điều kiện tổng quát — khi nào FEAT được coi là done}
  - *US sẽ trace về FAC này: US-001, US-002*

- **FAC-002 ({Tên}):** {Điều kiện khác}
  - *US sẽ trace về FAC này: US-003*

- **FAC-003 (Edge Cases):** Tất cả edge cases đã liệt kê trong Actor-Task Matrix phải có US tương ứng đạt AC.
  - *US sẽ trace về FAC này: Tất cả US edge case*
```

**Hỏi BA:**
```
BR-F và FAC đề xuất có đúng không?
Có rule nào từ thực tế khách hàng mà tôi bỏ sót không?
```

Sau khi BA approve, đọc: `./steps/step-05-finalize.md`
