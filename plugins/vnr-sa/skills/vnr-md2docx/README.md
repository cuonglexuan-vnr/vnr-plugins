# vnr-md2docx — Xuất tài liệu Markdown sang DOCX chuẩn VNR

Công cụ chuyển tài liệu `.md` sang file `.docx` có đầy đủ format thương hiệu VNR: trang bìa,
lịch sử cập nhật/phê duyệt, mục lục tự động, heading đánh số tự động, bảng có caption,
header/footer.

Ai cũng chạy được — có **2 cách**: qua Claude Code (`/vnr-md2docx`) hoặc chạy thẳng bằng Python.

---

## Cài đặt 1 lần

1. **Có Python 3** (kiểm tra: `python --version`). Nếu chưa: https://www.python.org/downloads/
2. **Cài thư viện** (từ thư mục chứa skill):
   ```bash
   pip install -r requirements.txt
   ```

> Template mặc định: `templates/word/VNR-ARCH_Tai_Lieu_Dac_Ta_Kien_Truc_He_Thong.docx` trong
> repo Deliverables. Chạy từ **repo root** thì công cụ tự tìm; hoặc chỉ định `--template`.

---

## Cách 1 — Dùng Claude Code (khuyến nghị)

Mở repo Deliverables trong Claude Code và gõ:

```
/vnr-md2docx <đường-dẫn>\VNR-KH-001-solution-architecture-overview.md
```

Claude sẽ tự chọn đúng thư mục theo đối tượng đọc và export. Câu lệnh truyền `--template` tường
minh nên không phụ thuộc thư mục hiện hành.

---

## Cách 2 — Chạy thẳng (không cần Claude Code)

Từ **repo root** của Deliverables (để công cụ tự tìm `templates/word/`):

**Windows (PowerShell):**
```powershell
<đường-dẫn-skill>\export-docx.ps1 "<INPUT.md>" -o "customer\deployment"
```

**Git Bash / macOS / Linux:**
```bash
<đường-dẫn-skill>/export-docx.sh "<INPUT.md>" -o "customer/deployment"
```

**Hoặc gọi Python trực tiếp:**
```bash
python <đường-dẫn-skill>/md_to_docx.py <INPUT.md> -o <OUTPUT.docx-hoặc-thư-mục>
```

Wrapper `export-docx.ps1` / `export-docx.sh` sẽ tự cài `python-docx` nếu thiếu.

---

## Tham số

| Tham số | Ý nghĩa | Mặc định |
|---------|---------|----------|
| `-o, --output` | File `.docx` **hoặc** thư mục đích | cạnh file `.md` |
| `-t, --template` | Template DOCX để clone | template VNR-ARCH |
| `--code` | Mã tài liệu (vd `VNR-KH-001`) | lấy từ tên file → metadata |
| `--title` | Tiêu đề bìa | H1 đầu tiên |
| `--version` | Phiên bản (vd `v1.0`) | metadata `Phiên bản` → `v1.0` |
| `--project-code` | Mã dự án trên bìa | `<Mã dự án>` |
| `--date` | Ngày trên bìa (vd `"TPHCM, 05/2026"`) | tháng/năm hiện tại |
| `--author` | Người cập nhật trong bảng lịch sử | metadata `Author` → `SA Team` |
| `--no-cover` | Bỏ trang bìa + front matter | có bìa |
| `--quiet` | Ẩn dòng log | verbose |

Thứ tự ưu tiên metadata: **tham số CLI > metadata trong file > mặc định**.

---

## Sau khi export

1. Mở file `.docx` trong Word → nhấn `Ctrl+A` rồi `F9` để dựng **Mục lục**.
2. Đặt file đúng thư mục theo đối tượng đọc:
   `customer/` · `management/` · `onboarding/` · `training/` · `reviews/` · `architecture/`.
3. Giữ nguyên tiền tố mã: `VNR-KH-001-...docx`, `VNR-ARCH-001-...docx`.

---

## Quy tắc bắt buộc

- **Nguồn gốc là playbook `.md`.** KHÔNG sửa `.docx` trực tiếp — sửa `.md` rồi re-export.
- KHÔNG tạo deliverable khi playbook chưa có `.md` tương ứng.

---

## Xử lý sự cố

| Lỗi | Cách khắc phục |
|-----|----------------|
| `the 'python-docx' package is required` | `pip install python-docx` |
| `template not found` | Chạy từ repo root Deliverables, hoặc chỉ định `--template <đường-dẫn>` |
| `Python 3 not found` | Cài Python 3 và thêm vào PATH |
| Mục lục trống trong Word | Mở file → `Ctrl+A` → `F9` |
| Heading bị đánh số 2 lần | Bỏ số thủ công trong `.md` (vd `## 1. Tổng quan` → `## Tổng quan`); tool tự đánh số |

---

## Giới hạn đã biết

- List lồng nhau bị làm phẳng về 1 cấp bullet (giống các bản export tham chiếu).
- H4 hiển thị như Heading 3 (độ sâu tối đa của template).
- Ảnh trong Markdown không được nhúng (chỉ logo bìa). Sơ đồ Mermaid hiển thị dạng text code.
