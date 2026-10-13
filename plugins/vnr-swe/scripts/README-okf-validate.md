# okf-validate.mjs — Bộ kiểm tra tuân thủ OKF v0.1

Validator Node.js không phụ thuộc công nghệ và không có dependency, dùng cho một bundle LLM-wiki theo spec
**OKF (Open Knowledge Format) v0.1**. Đi kèm `vnr-swe`; không chứa token riêng của dự án hay stack.
Theo cùng phong cách với `resolve-context.mjs` (cùng cách tách frontmatter và so khớp glob).

## Cách dùng

```sh
node scripts/okf-validate.mjs --root <projectRoot> [--layer wiki|raw|both] [--json] [--strict]
node scripts/okf-validate.mjs --root <projectRoot> --path docs/wiki/domains/x.md   # chỉ một tệp
```

| Flag | Mặc định | Ý nghĩa |
|---|---|---|
| `--root` | cwd | thư mục gốc dự án (`docs/wiki` và `docs/raw` nằm dưới đó) |
| `--layer` | `wiki` | `wiki` (§9 nghiêm ngặt + profile) · `raw` (lớp soạn thảo) · `both` |
| `--json` | off | in mỗi finding một dòng JSON (`{severity,rule,file,line,R,message}`) |
| `--strict` | off | coi WARN là thất bại khi tính exit code |
| `--path` | — | chỉ kiểm một tệp (các kiểm tra theo từng tệp) |

**Exit:** `0` không có ERROR · `1` có ERROR (hoặc có WARN khi dùng `--strict`) · `2` script bị lỗi.

## Hai profile

Dự án dùng plugin khai báo profile tuân thủ OKF của mình; validator hỗ trợ hai profile:

- **wiki** — bundle OKF *đã xuất bản*. Nghiêm ngặt: đủ 8 trường frontmatter, link tương đối, cấu trúc index/log.
- **raw** — lớp *soạn thảo*. Chỉ yêu cầu frontmatter parse được và `type` không rỗng. Miễn trừ
  `_schema/**`, `_inbox/**`, `MIGRATION.md`, `README.md`.

## Các kiểm tra  (ERROR = OKF §9 / profile MUST · WARN = SHOULD / chất lượng nội bộ)

| Rule | Severity | Kiểm tra |
|---|---|---|
| `FM-PARSEABLE` | ERROR | mọi tệp `.md` không thuộc nhóm dành riêng đều có khối frontmatter YAML |
| `FM-REQUIRED-FIELDS` | ERROR | đủ 8 trường (trang `tier: card`: chỉ cần `id` + `type`) |
| `TIMESTAMP-FORMAT` | ERROR | `timestamp` theo ISO 8601 |
| `DESCRIPTION-LEN` | ERROR | `description` ≤ 120 ký tự |
| `ID-UNIQUE` | ERROR | không có `id` trùng trong toàn bundle |
| `INDEX-FM-ONLY-OKFVER` / `INDEX-OKFVER` | ERROR | frontmatter của `index.md` chỉ gồm đúng `okf_version` |
| `CATALOG-FORMAT` | ERROR | catalog theo thư mục trong `index.md` là danh sách bullet theo §6, không phải bảng GFM |
| `MANIFEST-PATHS` | ERROR | mọi path trong `manifest.json` đều tồn tại trên đĩa |
| `LOG-RESERVED` | ERROR / WARN | heading trong `log.md` là `## YYYY-MM-DD` trần; các mục ngày-trong-ngoặc từ trước khi migrate là WARN `frozen-log-entry` (chỉ ghi thêm → là điều dự kiến và tồn tại vĩnh viễn) |
| `LINK-NO-WIKILINK` | WARN | bundle đã xuất bản nên dùng link tương đối, không dùng `[[id]]` |
| `LINK-RESOLVES` | WARN | đích của link tương đối tồn tại — **chất lượng, KHÔNG thuộc §9** (OKF §5.3 yêu cầu bên tiêu thụ chấp nhận link hỏng) |
| `RELATED-RESOLVES` | WARN | giá trị `related: [folder/slug]` phân giải được — chất lượng |
| `RAW-FM-PARSEABLE` / `RAW-FM-TYPE` | ERROR | (lớp raw) frontmatter hợp lệ + `type` không rỗng |

## Tích hợp
- **`vnr-wiki-sync` Step 5** gọi validator này (`--layer wiki`); một lần sync phải đạt **0 ERROR**.
- Dùng độc lập như CLI để kiểm nhanh; CI có thể chặn theo exit code.

## WARN hợp lệ, không cần xử lý
- WARN `frozen-log-entry` — tồn tại vĩnh viễn (log chỉ ghi thêm; heading ngày-trong-ngoặc cũ được giữ nguyên).
- Một trang *mô tả chính định dạng* có thể tự chứa các đoạn minh hoạ `[[id]]` / `[text](path)` —
  chúng hiện ra dưới dạng finding LINK mức WARN, không phải lỗi tuân thủ.
