# 02_business-solution.md

## I. Thông tin chung

| Mục                | Nội dung                                                     |
| ------------------ | ------------------------------------------------------------ |
| Tên yêu cầu        | Đăng ký nghỉ chế độ kinh nguyệt (SKN) — nghỉ sớm 30p/ngày |
| Loại yêu cầu       | Modify (enhance validation cho leave type SKN đã có)         |
| Mục tiêu nghiệp vụ | Tuân thủ Điều 137 BLLĐ 2019 + policy công ty                |
| Tài liệu đầu vào   | 01_requirement-review.md, 01_research.md                     |
| Người phân tích    | AI BA Assistant                                              |
| Ngày cập nhật      | 2026-06-09                                                   |

---

# II. Hiện trạng hệ thống

## 1. Màn hình liên quan

| Màn hình | Đường dẫn |
| -------- | --------- |
| DS Ngày nghỉ (Portal/App) | Portal → "DS Ngày nghỉ" → "Tạo mới" |
| DS Nghỉ phép (Web Main) | Web Main → "DS Nghỉ phép" (BPNS đăng ký hộ) |
| Duyệt ngày nghỉ (Portal/App) | Portal → "Duyệt ngày nghỉ" |

### File tham khảo

```text
modules/Attendance/LeaveManagement/00-Overview.md
modules/Attendance/LeaveManagement/01-DataModel.md
modules/Attendance/LeaveManagement/02-Rules.md
modules/Attendance/LeaveManagement/03-Processes.md
```

---

## 2. Luồng thao tác hiện tại

### Các bước thực hiện (ATT03.01 — NV tự đăng ký nghỉ phép)

1. NV Portal/App → "DS Ngày nghỉ" → "Tạo mới"
2. Chọn loại nghỉ (bao gồm SKN nếu NV nữ)
3. Chọn ngày bắt đầu — ngày kết thúc
4. System kiểm tra quy tắc đăng ký
5. Nếu vi phạm → popup "Dữ liệu không thỏa điều kiện"
6. NV "Lưu" (Lưu tạm) hoặc "Gửi yêu cầu" (Chờ duyệt)
7. Email CD → CD duyệt/từ chối

### Kết quả hiện tại

```text
Leave type SKN (STT 14) đã tồn tại trong Cat_LeaveDayType với:
- IsMenses = 1
- Ghi nhận: 0.5h/ngày, ≤3 ngày liên tục
- Tuy nhiên, validation "consecutive calendar days" và "1 block/tháng" 
  chưa rõ đã được enforce hay chưa.
```

---

## 3. Cấu hình liên quan

| Cấu hình (Cat_LeaveDayType) | Giá trị cần đảm bảo |
| -------- | ---------------- |
| Code | SKN |
| LeaveDayTypeName | Nghỉ chăm sóc SK (Nữ) |
| IsMenses | 1 (bit) |
| UnitHour | 0.5 |
| MaxPerMonth | 3 |
| MaxRequestPerMonth | 1 |
| MaxPerTimes | 3 |
| PaidRate | 1 (trả đủ lương) |
| IsWorkDay | 1 |
| NotSelectedInPortal | 0 (hiển thị trên Portal) |
| **IsConsecutiveRequired** | **1 (bit) — BẬT validate ngày liên tục** |

---

# III. Giải pháp đề xuất

## 1. Tóm tắt giải pháp

```text
Thêm field IsConsecutiveRequired (bit) vào Cat_LeaveDayType — flag cấu hình chung,
loại nghỉ nào bật thì system mới validate ngày liên tục.

Config SKN: MaxPerMonth=3, MaxRequestPerMonth=1, UnitHour=0.5, IsConsecutiveRequired=1
+ enhance validation:
  (1) Chỉ NV nữ được đăng ký
  (2) Ngày đăng ký phải liên tục (consecutive calendar days) — CHỈ khi IsConsecutiveRequired=1
  (3) Tối đa 3 ngày/tháng dương lịch
  (4) Chỉ 1 block/tháng dương lịch
+ Dùng approval flow hiện tại (đa cấp)
+ T&A tính đủ công cho ngày có SKN (NV nghỉ sớm 30p)
```

---

## 2. Phạm vi thay đổi

### Chức năng ảnh hưởng

| Chức năng | Loại thay đổi |
| --------- | ------------- |
| Cat_LeaveDayType (thêm field IsConsecutiveRequired) | Modify — thêm field config mới |
| Validation đăng ký nghỉ phép | Modify — check IsConsecutiveRequired trước khi validate liên tục |
| Config Cat_LeaveDayType (SKN record) | Modify — update giá trị config |
| Tính công (Attendance Processing) | Modify — đảm bảo tính đủ công khi NV nghỉ sớm 30p |
| Filter hiển thị leave type trên Portal | Modify — đảm bảo SKN chỉ hiển thị cho NV nữ |

### Màn hình ảnh hưởng

| Màn hình | Mức độ |
| -------- | ------ |
| Form Create/Edit Loại ngày nghỉ (Admin) | Trung bình — thêm field IsConsecutiveRequired |
| Form đăng ký nghỉ phép (Portal/App) | Thấp — thêm validation, không thay đổi layout |
| Popup thông báo lỗi | Thấp — thêm message validation mới |

---

## 3. Mô tả thay đổi chi tiết

### [BS-01] Config Leave Type SKN + Thêm field IsConsecutiveRequired

#### Màn hình

```text
Admin → Danh mục → Loại ngày nghỉ (Cat_LeaveDayType) — Form Create/Edit
```

#### Yêu cầu thay đổi

##### Thêm mới

* Thêm field `IsConsecutiveRequired` (bit, default = 0) vào Cat_LeaveDayType
  - = 1: Bật validation "ngày đăng ký phải liên tục (calendar days)"
  - = 0: Không check liên tục (behavior hiện tại)
* Field này là **cấu hình chung** — loại ngày nghỉ nào bật thì mới check, không hardcode cho riêng SKN
* Có thể reuse cho các loại nghỉ khác trong tương lai nếu cần

* **UI — Form Create/Edit Loại Ngày Nghỉ**: thêm control mới:
  - Label: `Yêu cầu ngày liên tục` (hoặc `Bắt buộc đăng ký ngày liên tục`)
  - Control type: Checkbox / Toggle (bit)
  - Default: Unchecked (= 0)
  - Vị trí: Nhóm "Quy tắc đăng ký" (cạnh MaxPerMonth, MaxPerTimes)

##### Sửa đổi

* Verify/update config SKN trong Cat_LeaveDayType:
  - MaxPerMonth = 3
  - MaxRequestPerMonth = 1
  - MaxPerTimes = 3
  - UnitHour = 0.5
  - PaidRate = 1
  - IsMenses = 1
  - **IsConsecutiveRequired = 1**

#### Validate

| Điều kiện | Thông báo |
| --------- | --------- |
| IsConsecutiveRequired = 1 nhưng MaxPerTimes < 2 | "Loại nghỉ yêu cầu ngày liên tục phải cho phép tối thiểu 2 ngày/lần." |

---

### [BS-02] Validation — Chỉ NV nữ

#### Màn hình

```text
Portal/App → DS Ngày nghỉ → Tạo mới
```

#### Yêu cầu thay đổi

##### Sửa đổi

* Khi NV mở form đăng ký nghỉ phép, dropdown "Loại ngày nghỉ" chỉ hiển thị SKN nếu NV có Giới tính = Nữ (từ Hre_Profile)
* Nếu bằng cách nào đó NV nam submit đơn SKN → system reject

#### Validate

| Điều kiện | Thông báo |
| --------- | --------- |
| Giới tính NV ≠ Nữ | "Loại nghỉ này chỉ áp dụng cho nhân viên nữ." |

---

### [BS-03] Validation — Ngày liên tục (Consecutive Calendar Days)

#### Màn hình

```text
Portal/App → DS Ngày nghỉ → Tạo mới → Chọn ngày
```

#### Yêu cầu thay đổi

##### Thêm mới / Sửa đổi

* Khi NV đăng ký nghỉ phép, system kiểm tra: leave type đó có `IsConsecutiveRequired = 1` không?
  - Nếu **KHÔNG** (= 0) → bỏ qua validation này (behavior hiện tại)
  - Nếu **CÓ** (= 1) → check ngày liên tục:
* Khi NV đăng ký leave type có IsConsecutiveRequired=1 với DateStart và DateEnd:
  - Tính số ngày = DateEnd - DateStart + 1 (calendar days)
  - Tất cả các ngày từ DateStart đến DateEnd phải liên tục (không gap)
  - **Calendar days**: kể cả T7/CN/ngày lễ đều tính là ngày liên tục
  - VD: Thứ 6 (20/6) → Thứ 7 (21/6) → CN (22/6) = hợp lệ (3 ngày liên tục)
  - VD: Thứ 6 (20/6) → Thứ 2 (23/6) = KHÔNG hợp lệ (gap 21, 22)

##### Lưu ý nghiệp vụ

* Vì đăng ký theo DateStart-DateEnd (range), validation chỉ cần kiểm tra: DateEnd - DateStart + 1 ≤ MaxPerTimes (3)
* Ngày trong range tự động liên tục (do là range, không phải multi-select từng ngày)

#### Validate

| Điều kiện | Thông báo |
| --------- | --------- |
| DateEnd - DateStart + 1 > 3 | "Số ngày đăng ký nghỉ kinh nguyệt không được vượt quá 3 ngày." |
| DateStart > DateEnd | "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc." |

---

### [BS-04] Validation — Tối đa 3 ngày/tháng dương lịch

#### Màn hình

```text
Portal/App → DS Ngày nghỉ → Tạo mới → Submit/Gửi
```

#### Yêu cầu thay đổi

##### Sửa đổi

* Khi NV submit đơn SKN, system đếm tổng số ngày SKN đã đăng ký (status ≠ Hủy, ≠ Từ chối) trong cùng tháng dương lịch
* Tổng (đã đăng ký + đang đăng ký) ≤ MaxPerMonth (3)
* Tháng dương lịch = tháng của DateStart

##### Cross-month handling

* Nếu DateStart và DateEnd vắt qua 2 tháng (VD: 30/5 → 1/6):
  - Ngày 30/5 + 31/5 tính vào tháng 5
  - Ngày 1/6 tính vào tháng 6
  - Mỗi tháng check riêng biệt theo MaxPerMonth

#### Validate

| Điều kiện | Thông báo |
| --------- | --------- |
| Tổng ngày SKN trong tháng DL > 3 | "Đã vượt số ngày nghỉ kinh nguyệt tối đa trong tháng (3 ngày)." |

---

### [BS-05] Validation — Chỉ 1 block/tháng dương lịch

#### Màn hình

```text
Portal/App → DS Ngày nghỉ → Tạo mới → Submit/Gửi
```

#### Yêu cầu thay đổi

##### Sửa đổi

* Khi NV submit đơn SKN, system kiểm tra: trong tháng dương lịch (của DateStart), đã có đơn SKN nào khác (status ≠ Hủy, ≠ Từ chối) chưa?
* Nếu đã có → reject (dù chưa đủ 3 ngày)
* MaxRequestPerMonth = 1 → chỉ cho phép 1 đơn/tháng

##### Lưu ý

* "1 block" = 1 đơn Att_LeaveDay trong tháng. NV không thể tách thành 2 đơn (VD: 2 ngày + 1 ngày riêng)
* Nếu NV cần thêm ngày → phải hủy đơn cũ rồi đăng ký lại đơn mới (theo quy trình hủy hiện tại)

#### Validate

| Điều kiện | Thông báo |
| --------- | --------- |
| Đã tồn tại đơn SKN (status ≠ Hủy/Từ chối) trong cùng tháng DL | "Bạn đã có đơn nghỉ kinh nguyệt trong tháng này. Mỗi tháng chỉ được đăng ký 1 lần." |

---

### [BS-06] Tính công (Attendance Processing)

#### Màn hình

```text
Attendance Processing (batch)
```

#### Yêu cầu thay đổi

##### Sửa đổi

* Ngày NV có đơn SKN được duyệt (status = E_APPROVED):
  - Tính ĐỦ CÔNG cho ngày đó
  - NV được nghỉ sớm 30 phút so với giờ kết thúc ca
  - T&A không đánh thiếu giờ/trừ công cho 30p cuối ca
  - Tương tự pattern ChildcareRegime (tính đủ công nếu NV có in/out đủ shift_hours - 0.5h)

##### Lưu ý

* Nếu NV out sớm hơn 30p → vẫn tính thiếu giờ phần vượt
* Nếu NV out đúng (shift_end - 30p) hoặc muộn hơn → tính đủ

---

### [BS-07] Approval Flow

#### Yêu cầu thay đổi

##### Giữ nguyên

* Đơn SKN follow approval flow hiện tại của LeaveManagement (ATT03.01):
  - NV submit → Chờ duyệt → CD Line 1 duyệt → (Line 2 nếu có) → Đã duyệt
  - Reject: CD từ chối + lý do
  - Email notification tại mỗi bước
* Không thay đổi approval config

---

# IV. Giao diện

## Có cần thiết kế UI/Prototype không?

* [x] Không — sử dụng form đăng ký nghỉ phép hiện tại, chỉ thêm validation messages

### Mockup mô tả

```text
Form đăng ký nghỉ phép hiện tại không thay đổi layout.
- Dropdown "Loại ngày nghỉ": SKN chỉ hiển thị cho NV nữ (đã có logic IsMenses)
- Fields: DateStart, DateEnd, Comment (giữ nguyên)
- Validation popup hiển thị khi vi phạm rule BS-02 → BS-05
```

---

# V. Vùng ảnh hưởng

## Chức năng liên quan

| Chức năng | Mức độ ảnh hưởng |
| --------- | --------------- |
| Đăng ký nghỉ phép (Portal/App) | Trung bình — thêm validation |
| Tính công (Attendance Processing) | Thấp — tương tự ChildcareRegime |
| Duyệt ngày nghỉ | Thấp — không thay đổi |
| Hủy nghỉ phép | Thấp — follow flow hiện tại |
| BPNS đăng ký hộ (Web Main) | Thấp — cùng validation |

---

## Dữ liệu liên quan

| Đối tượng dữ liệu | Tác động |
| ----------------- | -------- |
| Cat_LeaveDayType (structure) | Thêm field IsConsecutiveRequired (bit, default 0) |
| Cat_LeaveDayType (SKN record) | Update config values + IsConsecutiveRequired=1 |
| Att_LeaveDay | Không thay đổi structure — chỉ validate logic |
| Hre_Profile.Gender | Read-only — dùng để filter |

---

## Quy trình nghiệp vụ liên quan

* ATT03.01 — NV tự đăng ký nghỉ phép (main flow)
* ATT03.02 — BPNS đăng ký hộ (cùng validation)
* Attendance Processing — tính công ngày có SKN
* Hủy nghỉ phép — nếu NV muốn đổi ngày (hủy đơn cũ → đăng ký mới)

---

# VII. Câu hỏi mở

| STT | Nội dung |
| --- | -------- |
| 1 | Q-006 (defer): Nghỉ sớm 30p — NV tự arrange thời điểm nghỉ trong ngày hay bắt buộc cuối ca? → Suggestion: hệ thống chỉ ghi nhận 30p, NV tự arrange với QL. T&A chỉ cần check out ≥ shift_end - 30p là đủ. |
| 2 | Cross-month validation: khi đơn vắt 2 tháng, MaxRequestPerMonth check theo tháng DateStart hay cả 2 tháng? → Suggestion: check cả 2 tháng (mỗi tháng không được có đơn SKN trước đó). |

---

# VIII. Checklist hoàn thành

## Hiện trạng

* [x] Đã xác định màn hình hiện tại
* [x] Đã mô tả luồng thao tác hiện tại
* [x] Đã xác định cấu hình liên quan

## Giải pháp

* [x] Đã mô tả đầy đủ thay đổi nghiệp vụ
* [x] Đã xác định màn hình ảnh hưởng
* [x] Đã liệt kê validate

## Chất lượng

* [x] Đã đánh giá vùng ảnh hưởng
* [x] Đã có tiêu chí nghiệm thu
* [x] Không còn blocker nghiệp vụ
* [x] Sẵn sàng chuyển sang Phase 3

---

# Technical Considerations For Phase 3

> Ghi nhận kỹ thuật — KHÔNG phải thiết kế kỹ thuật.

- Verify SP validate hiện tại có check MaxPerMonth, MaxRequestPerMonth cho SKN chưa
- Verify logic consecutive days: nếu form dùng DateStart-DateEnd (range) thì tự liên tục — chỉ cần validate length ≤ 3
- Verify gender filter: đã dùng IsMenses flag hay cần thêm logic
- Verify T&A processing: ChildcareRegime pattern (tính đủ công khi thiếu 30p-1h)
- Cross-month: SP cần split range theo tháng để validate MaxPerMonth per month
