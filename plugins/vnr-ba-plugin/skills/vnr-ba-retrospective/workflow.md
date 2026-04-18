# Workflow: ba-retrospective

## Mục tiêu

Sau khi EPIC hoàn tất (tất cả FEAT Done hoặc BA khai báo EPIC xong), tổng kết bài học từ toàn bộ artifacts → tự động đề xuất cập nhật Ground Rules và EC Library để hệ thống ba- liên tục học và cải tiến.

Đây là cơ chế **self-learning** — giúp lần EPIC tiếp theo không lặp lại lỗi đã gặp.

---

## Đầu vào

Nhận EPIC ID hoặc đường dẫn thư mục EPIC. Nếu chưa có, hỏi:
```
EPIC nào cần retrospective? (ID hoặc đường dẫn, ví dụ: IDP-E01)
```

---

## Hành động 1: Load toàn bộ artifacts của EPIC

### 1a. Đọc EPIC README
Đọc `Module/{MOD}/Epics/{MOD}-E{NN}_{Name}/README.md`:
- EAC (Epic Acceptance Criteria)
- BR-E (Business Rules Epic)
- FEAT candidates ban đầu vs thực tế đã tạo
- Risk assessment (nếu có từ Research Brief)

### 1b. Đọc tất cả FEAT
Duyệt `Module/{MOD}/Epics/{MOD}-E{NN}_{Name}/Features/*/FEAT.md`:
- FAC, BR-F
- Status của từng FEAT
- Số US thực tế vs dự kiến

### 1c. Đọc tất cả US
Duyệt `Module/{MOD}/Epics/.../Features/.../Stories/*.md`:
- Đếm tổng số US
- Thu thập danh sách AC, BR-U
- Kiểm tra Section UI/UX (số màn hình, state coverage)
- Ghi nhận edge cases được xử lý trong AC

### 1d. Đọc us-quality-log.md (nếu có)
Đọc `_product/us-quality-log.md` — lọc các entry của EPIC này.
Tổng hợp: số US PASS/FAIL, lỗi thường gặp nhất.

### 1e. Đọc Ground Rules hiện tại
Đọc `_product/ba-ground-rules.md` (version hiện tại) để biết rules nào đang apply.

---

## Hành động 2: Phân tích chất lượng artifacts

Phân tích theo 5 chiều:

### Chiều 1 — Cascade Integrity
```
Câu hỏi: EAC → FAC → AC có nhất quán không?
Kiểm tra: Với mỗi EAC, có ít nhất 1 FAC phản ánh nó không?
         Với mỗi FAC, có ít nhất 1 AC trong US không?
         BR-E → BR-F → BR-U có chain đầy đủ không?
```

### Chiều 2 — Edge Case Coverage
```
Câu hỏi: Edge cases từ Research Brief có được xử lý trong US không?
Kiểm tra: Liệt kê EC được giao cho EPIC này → tìm AC/BR tương ứng trong US.
         EC nào chưa có AC/BR → flag là "Missed EC".
```

### Chiều 3 — UI/UX Completeness
```
Câu hỏi: UI/UX section có đủ chất lượng không?
Kiểm tra: Số US có State Coverage table vs tổng US.
         Màn hình nào thiếu Error state.
         Navigation flow được mô tả rõ không.
```

### Chiều 4 — Zero Kỹ thuật Compliance
```
Câu hỏi: US nào vi phạm Zero Kỹ thuật nhưng đã bị bỏ qua?
Kiểm tra: Đọc lại US, tìm từ kỹ thuật đã lọt qua ba-us-check.
         Nếu phát hiện: flag là "Leaked Technical Term".
```

### Chiều 5 — Scope Drift
```
Câu hỏi: FEAT/US có drift ra ngoài scope EPIC ban đầu không?
Kiểm tra: So sánh FEAT thực tế vs FEAT candidates trong EPIC.
         US nào có Out-of-Scope list trống hoặc không rõ.
```

---

## Hành động 3: Tổng hợp Findings

Sau khi phân tích 5 chiều, tổng hợp:

```
═══════════════════════════════════════════════
RETROSPECTIVE FINDINGS — {EPIC-ID}

📊 Stats:
   FEATs: {N thực tế} / {N dự kiến}
   USs:   {N} ({N PASS} / {N FAIL} từ us-quality-log)
   ACs:   {N tổng} ({N trung bình/US})
   BRs:   {N tổng} ({N BR-U / {N BR-F / {N BR-E})

🔴 Issues phát hiện:

   CASCADE:
   • {Danh sách EAC không có AC}
   • {Danh sách BR-E chưa cascade xuống BR-U}

   EDGE CASES MISSED:
   • {Danh sách EC được giao nhưng chưa có AC/BR}

   UI/UX GAPS:
   • {US nào thiếu State Coverage table}
   • {Màn hình nào thiếu Error state}

   ZERO KỸ THUẬT:
   • {Từ kỹ thuật nào lọt qua}

   SCOPE DRIFT:
   • {FEAT/US nào ra ngoài scope}

🟡 Warnings (chưa nghiêm trọng nhưng cần theo dõi):
   • {Danh sách}

🟢 Điểm tốt:
   • {Patterns làm việc hiệu quả}
   • {Rules nào được follow nhất quán}
═══════════════════════════════════════════════
```

Hỏi BA:
```
Findings trên có phản ánh đúng thực tế không?
Có issue nào tôi bỏ sót không?
(BA có thể thêm nhận xét chủ quan về quá trình làm việc)
```

---

## Hành động 4: Trích xuất Lessons Learned

Từ Findings + phản hồi của BA, phân loại lessons:

### Lessons → Ground Rules mới/cập nhật

Ví dụ:
```
PHÁT HIỆN: 3/5 FEATs trong EPIC này thiếu BR-F về trạng thái "đã khóa/đã duyệt"
→ LESSON: Mọi FEAT có flow phê duyệt phải có BR-F explicit về trạng thái sau duyệt
→ GROUND RULE ĐỀ XUẤT (MINOR): GR-014 "Approval State Rule"
```

```
PHÁT HIỆN: 4 US không có Error state trong State Coverage table
→ LESSON: Error state hay bị bỏ sót nhất — cần thêm reminder vào step-06
→ GROUND RULE ĐỀ XUẤT (PATCH): GR-004 bổ sung note về Error state ưu tiên cao
```

### Lessons → Edge Cases mới cho library

Ví dụ:
```
PHÁT HIỆN: EC về "NV vừa được thăng chức vừa được điều chuyển cùng ngày" chưa có
→ EC MỚI ĐỀ XUẤT: EC-GEN-032 "Thăng chức + Điều chuyển đồng thời"
```

### Lessons → Anti-patterns (để ghi vào Ground Rules Part III)

Ví dụ:
```
ANTI-PATTERN PHÁT HIỆN: Khi AC quá dài (>8 AC), thường có US cần tách
→ LESSON: "US với >8 AC thường là US đang làm 2 việc — nên tách"
```

---

## Hành động 5: Đề xuất cập nhật Ground Rules

Nếu có lessons → Ground Rules, hiển thị đề xuất:

```
GROUND RULES UPDATES ĐỀ XUẤT
══════════════════════════════════════════════
{Với mỗi ground rule cần thêm/sửa:}

[MINOR] GR-014 — Approval State Rule (mới)
   Nội dung: Mọi FEAT có flow phê duyệt phải có BR-F explicit về
             trạng thái artifact sau khi được duyệt (vd: "Đã phê duyệt",
             "Đang hiệu lực") và sau khi bị từ chối.
   Lý do: 3 FEATs trong {EPIC-ID} thiếu rule này → phải rework.

[PATCH] GR-004 — Bổ sung note về Error state
   Thay đổi: Thêm dòng "Error state thường bị bỏ sót nhất — viết trước"
   Lý do: Pattern quan sát từ {EPIC-ID}

[MINOR] Part III — Anti-pattern mới
   "US với >8 AC thường là US đang làm 2 việc — nên tách (EC: {EPIC-ID})"
══════════════════════════════════════════════

Bạn có muốn áp dụng các cập nhật Ground Rules này không?
(a) Áp dụng tất cả — tôi sẽ chạy /vnr-ba-constitution
(b) Chọn lọc — chỉ áp dụng [số thứ tự]
(c) Không áp dụng lần này — ghi nhận để xem xét sau
```

**Nếu BA chọn (a) hoặc (b):** Chạy `/vnr-ba-constitution` với từng thay đổi được chọn.

---

## Hành động 6: Đề xuất cập nhật EC Library

Nếu có EC mới phát hiện:

```
EC LIBRARY UPDATES ĐỀ XUẤT
══════════════════════════════════════════════
🆕 EC chưa có trong library:

   EC-GEN-032: Thăng chức + Điều chuyển đồng thời
   Mô tả: NV được thăng chức và điều chuyển phòng ban trong cùng ngày →
          rule nào apply trước? Lương mới hay vị trí cũ?
   Tần suất: Thấp | Mức độ: Cao | Xử lý: BR rõ ràng về thứ tự ưu tiên
   Phát hiện bởi: ba-retrospective — {EPIC-ID}

Bạn có muốn thêm vào _product/edge-cases/_index.md không?
(a) Thêm tất cả
(b) Chọn lọc
(c) Không thêm lần này
══════════════════════════════════════════════
```

**Nếu BA đồng ý:** Ghi trực tiếp vào `_product/edge-cases/_index.md`.

---

## Hành động 7: Tạo Retro Report

Tạo file `Module/{MOD}/_retrospectives/retro-{EPIC-ID}.md`:

```markdown
---
epic_id: {EPIC-ID}
retro_date: {YYYY-MM-DD}
conducted_by: ba-retrospective
ground_rules_updated: {yes/no} — v{old} → v{new}
ec_added: {N}
status: Done
---

# Retrospective — {EPIC-ID}: {Tên EPIC}

## TL;DR

{2-3 dòng: EPIC làm tốt gì, vấn đề chính là gì, bài học quan trọng nhất}

## Stats

| Chỉ số | Giá trị |
|---|---|
| FEATs hoàn thành | {N} / {N dự kiến} |
| USs viết được | {N} |
| ACs trung bình/US | {N} |
| US PASS check lần đầu | {N%} |
| EC được xử lý | {N} / {N được giao} |

## Issues & Lessons

### Cascade Issues
{Danh sách và lesson}

### Edge Case Coverage
{Danh sách và lesson}

### UI/UX Quality
{Danh sách và lesson}

### Zero Kỹ thuật
{Danh sách và lesson}

## Ground Rules Updates

{Danh sách rules đã cập nhật hoặc "Không có cập nhật"}

## EC Library Updates

{Danh sách EC đã thêm hoặc "Không có EC mới"}

## Điểm tốt cần duy trì

{Danh sách}

## Gợi ý cho EPIC tiếp theo

{3-5 gợi ý cụ thể}
```

---

## Hành động 8: Thông báo kết quả

```
═══════════════════════════════════════════════
✅ Retrospective hoàn thành!

📋 EPIC: {EPIC-ID} — {Tên}

📊 Summary:
   USs reviewed:     {N}
   Issues phát hiện: {N} ({N critical / N warning})
   Điểm tốt:         {N}

📚 Bài học được áp dụng:
   Ground Rules: {updated / không thay đổi}
     {Nếu updated: v{old} → v{new} — {N} rules thay đổi}
   EC Library:   {N} EC mới thêm

📄 Retro Report:
   Module/{MOD}/_retrospectives/retro-{EPIC-ID}.md

⏭  Bước tiếp theo:
   • Ground Rules mới sẽ apply ngay cho EPIC tiếp theo
   • Chạy /vnr-ba-researcher trước EPIC tiếp theo để benefit từ EC mới
   • Chia sẻ retro report với team nếu cần
═══════════════════════════════════════════════
```
