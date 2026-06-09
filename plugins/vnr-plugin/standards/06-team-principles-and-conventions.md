# Team Principles & Conventions

---

## 1. I18N — Backend (Legacy MVC)

**Áp dụng cho:** `HRM.Presentation.Main`, `HRM.Presentation.EmpPortal`, `HRM.Presentation.Hr.Service`, `HRM.Presentation.HrmSystem.Web`

### File ngôn ngữ

- **Vị trí**: `HRM.Presentation.Main/Settings/Lang_[country_code].xml`
- **Ngôn ngữ hỗ trợ**: `VN` (tiếng Việt), `EN` (tiếng Anh) — chỉ 2 ngôn ngữ
- **Override bởi admin**: `Lang_[country_code]_Spec.xml` — file `_Spec` có **độ ưu tiên cao hơn** file gốc. Admin có thể chỉnh sửa nội dung qua UI mà không cần deploy lại.

```
Settings/
├── Lang_VN.xml          # Tiếng Việt (mặc định)
├── Lang_EN.xml          # Tiếng Anh
├── Lang_VN_Spec.xml     # Override VN — ưu tiên cao hơn, do admin chỉnh
└── Lang_EN_Spec.xml     # Override EN — ưu tiên cao hơn
```

### Cách sử dụng

```csharp
// Dùng hàm Translate / TranslateString để lấy text đã dịch
string label = Translate(ConstantDisplay.Hre_Profile_Code);
string msg   = TranslateString(ConstantMessage.Common_SaveSuccess);
```

### Quy tắc thêm translation key

- **Key cho controls / tiêu đề màn hình** → thêm vào `HRM.Infrastructure.Utilities/ConstantDisplay.cs`
- **Key cho thông báo** (success, error, warning, confirm) → thêm vào `HRM.Infrastructure.Utilities/ConstantMessage.cs`
- Key phải được thêm vào **cả hai** file ngôn ngữ (`Lang_VN.xml` và `Lang_EN.xml`) cùng lúc.
- Không tạo file xml mới; chỉ thêm vào file hiện có.

---

## 2. I18N — Backend (Service Center)

**Áp dụng cho:** `HRM.SC.Service.Api` và các SC Modules

### File ngôn ngữ

- **Vị trí**: `HRM.SC.Service.Api/Resources/Settings/LANG_[country_code].XML`
- **Ngôn ngữ hỗ trợ**: `VN`, `EN`

```
Resources/Settings/
├── LANG_VN.XML
└── LANG_EN.XML
```

- Thêm key vào cả hai file khi thêm text mới.

---

## 3. I18N — Frontend Angular (Portal v2 & v3)

**Áp dụng cho:** Source `./Frontend/` — shell (`src/`) và micro-frontends (`projects/`)

### Hai tầng translation

| Tầng | File | Dùng cho |
|------|------|----------|
| **Global** | `src/assets/i18n/VN.json`, `EN.json` | Shell app, layout, common labels |
| **Module-specific** | `projects/shared-resources/[domain]/i18n/VN.ts`, `EN.ts` | Translation riêng của từng micro-frontend |

### Quy tắc

- **Luôn chỉnh sửa file TypeScript** (`VN.ts`, `EN.ts`) cho các key thuộc micro-frontend — không dùng global JSON cho feature-level text.
- Key được access dưới dạng `'[module].[key]'` — ví dụ: `'recruitment.someKey'`.
- Thêm key vào **cả VN.ts lẫn EN.ts** cùng lúc, không bỏ sót ngôn ngữ.
- **Ngôn ngữ hỗ trợ**: `VN` và `EN` — mặc dù có file `CN.ts` trong codebase, hệ thống hiện tại chỉ hỗ trợ tiếng Việt và tiếng Anh.
- Inject `TranslateService` cho dùng dynamic trong TypeScript; dùng pipe `| translate` trong template.

```typescript
// Module-level i18n (projects/shared-resources/recruitment/i18n/VN.ts)
export const VN = {
  recruitment: {
    someKey: 'Văn bản tiếng Việt',
  }
};
```

```html
<!-- Template -->
{{ 'recruitment.someKey' | translate }}
```

---

## 4. Enums & Constants — Backend

> Không tạo file enum hoặc constant mới. Chỉ thêm vào các file hiện có.

| File | Nội dung |
|------|----------|
| `HRM.Infrastructure.Utilities/Enum/EnumConstant.cs` | **Tất cả enum** dùng chung toàn hệ thống |
| `HRM.Infrastructure.Utilities/ConstantDisplay.cs` | Translation key cho **controls / tiêu đề màn hình** |
| `HRM.Infrastructure.Utilities/ConstantMessage.cs` | Translation key cho **thông báo** (success, error, warning) |

---

## 5. Database Migration — Quy Tắc SQL Thủ Công

> Hệ thống dùng **Database-First**. Tuyệt đối không dùng EF Code-First migrations. Mọi thay đổi schema phải là file `.sql` thủ công.

### Schema / DML (ALTER TABLE, INSERT, UPDATE, ...)

- **Thư mục**: `HRM.Presentation.Main/Updates/Scripts/SQL/`
- **Đặt tên**: `[YearMonthDay_No].sql`
  - `YearMonthDay` = ngày tạo (8 chữ số: YYYYMMDD)
  - `No` = số thứ tự trong ngày (01, 02, ...)
  - Ví dụ: `20240315_01.sql`, `20240315_02.sql`

### Stored Procedures

- **Thư mục**: `HRM.Presentation.Main/Updates/Stores/SQL2012/`
- **Đặt tên**: `[stored_proc_name].sql` — tên file phải khớp chính xác với tên stored procedure.

### Lưu ý

- Mỗi file migration chỉ nên chứa một thay đổi logic (một ALTER, một INSERT batch, ...).
- Stored proc được lưu đầy đủ (CREATE OR ALTER) — mỗi lần sửa proc thì cập nhật file `.sql` tương ứng.

---

## 6. Reflection — Lưu Ý Khi Thay Đổi Models

Hệ thống backend sử dụng **Reflection** rộng rãi tại:
- EF6 entity mapping (Database-First)
- Repository base classes (`HRM.Data.BaseRepository`)
- CalcEngine (tính toán công thức lương/phúc lợi qua tên property)
- Import/Export data

**Quy tắc:** Khi đổi tên property, field hoặc class — phải kiểm tra xem chúng có bị truy cập qua reflection không trước khi đổi. Tìm kiếm `GetProperty`, `GetValue`, `SetValue`, `typeof(...)` trong codebase trước khi rename.

---

## 7. UI Component — Thứ Tự Ưu Tiên (Frontend Angular)

1. **`vnr-module`** — design system nội bộ. Luôn dùng trước.
2. **NG-Zorro** (`ng-zorro-antd`) — fallback khi `vnr-module` chưa có component phù hợp.
3. **Kendo UI for Angular** — chỉ dùng cho các trường hợp đặc thù (grid cực lớn, scheduler, export nặng).

Import `vnr-module` vào feature module qua `VnrModuleModule` (re-exported từ `@shared-module`).

Xem màn hình tham chiếu chuẩn: `projects/recruitment/src/app/pages/rec-vacancies/rec-vacancies-list/`
