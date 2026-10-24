# Cài đặt plugin VNR cho Claude Code

Hướng dẫn cho người dùng: https://sa-hrm.vnrlocal.com/docs/marketplace/user

Marketplace `vnr-marketplace` phân phối hai plugin: `vnr-swe` (hai lệnh cho dev HRM: `/vnr-dev` làm PBI trên nền superpowers, `/vnr-review` review trước khi push) và `vnr-sa`
(bộ công cụ cho Solution Architect). Lệnh `vnr-bootstrap` đăng ký marketplace với Claude Code rồi cài plugin;
plugin chạy từ kho plugin của Claude, **không** chép tệp nào vào dự án của bạn.

## Yêu cầu

- Node.js `>= 18.18.0`
- `claude` CLI có trong `PATH`

## Cài đặt

Chạy trong thư mục dự án (phạm vi cài đặt mặc định là `project`):

```powershell
npx github:cuonglexuan-vnr/vnr-plugins init vnr-swe
```

`vnr-swe` 2.0 cần plugin `superpowers` (marketplace `claude-plugins-official`). Cài qua DevHub thì DevHub cài cả hai; cài tay thì
chạy `claude plugin install superpowers@claude-plugins-official` trước, hoặc để marketplace tự kéo nhờ `allowCrossMarketplaceDependenciesOn`.

Cài `vnr-sa` thay vì `vnr-swe`: thay tên plugin ở cuối lệnh.

Bản checkout của repo này có wrapper Windows thay cho `npx`. Chạy wrapper **từ thư mục dự án** và gọi theo đường dẫn tới
bản checkout: wrapper mặc định cài vào thư mục hiện tại, nên chạy ngay trong bản checkout sẽ cài nhầm vào đó. Lệnh PowerShell
dùng `-ExecutionPolicy Bypass` vì chính sách mặc định chặn chạy tệp `.ps1`.

| Shell | Lệnh | Tuỳ chọn |
|---|---|---|
| PowerShell | `powershell -ExecutionPolicy Bypass -File <thư-mục-checkout>\install-vnr-swe.ps1` | `-ProjectDir "C:\work\my-project"`, `-Scope user`, `-RefreshMarketplace` |
| CMD | `<thư-mục-checkout>\install-vnr-swe.cmd "C:\work\my-project"` | `--scope user` (đặt sau thư mục dự án) |

Wrapper chỉ cài `vnr-swe`; cài `vnr-sa` thì dùng `npx github:cuonglexuan-vnr/vnr-plugins init vnr-sa`.

## Tuỳ chọn của bootstrap

| Tuỳ chọn | Tác dụng |
|---|---|
| `--scope project` (mặc định) | Cài plugin cho dự án hiện tại |
| `--scope user` | Cài plugin cho người dùng hiện tại, dùng được ở mọi dự án |
| `--refresh-marketplace` | Xoá marketplace đã cache rồi đăng ký lại |
| `--help` | Hiện hướng dẫn |

## Nâng cấp từ marketplace `vnr-ai`

Marketplace trước đây tên `vnr-ai`.

- **Cài lại từng plugin.** Bootstrap gỡ marketplace `vnr-ai` ở mọi phạm vi cài đặt trước khi đăng ký `vnr-marketplace`;
  việc này cũng gỡ mọi plugin đã cài từ `vnr-ai`. Chạy lại lệnh cài cho từng plugin và phạm vi bạn từng dùng: thêm
  `--scope user` nếu trước đây cài theo người dùng; chạy `init vnr-sa` trong thư mục từng cài `vnr-sa` (thường là repo
  Deliverables).
- **Settings dự án đã commit.** Nếu `.claude/settings.json` của repo nhóm có khoá `vnr-swe@vnr-ai` (hoặc `vnr-sa@vnr-ai`)
  trong `enabledPlugins`, đổi thành `vnr-swe@vnr-marketplace` (hoặc `vnr-sa@vnr-marketplace`) rồi commit, để đồng nghiệp
  không gặp báo "enabled but not installed". Bootstrap không sửa tệp này.
- **Người dùng DevHub.** Sau lần **Sync** kế tiếp trong Settings › Marketplaces, chạy `claude plugin marketplace list`;
  nếu còn `vnr-ai`, chạy `claude plugin marketplace remove vnr-ai` rồi cài lại plugin từ `vnr-marketplace`
  (trong Claude: `/plugin`).

## Publish lên registry VNR

DevHub nhận marketplace dưới dạng một zip trên registry VNR, nên đồng nghiệp không có quyền vào repo TFS này vẫn cài được.
Publish sau khi merge thay đổi trong `plugins/` hoặc `.claude-plugin/marketplace.json`.

> **Lưu ý:** publish bản 1.1.0 đổi tên marketplace thành `vnr-marketplace` với mọi người dùng DevHub. Kiểm trước trên một
> máy DevHub (Sync, rồi `claude plugin marketplace list` và `/plugin`) rồi mới thông báo.

Yêu cầu: Node.js 18 trở lên và token registry có quyền `repository:write` trên kho `vnr-marketplace`
(trùng tên marketplace).

Lần đầu: cài [Task](https://taskfile.dev) (`winget install Task.Task` / `brew install go-task`), chạy `npm install`,
rồi chép `.env.example` thành `.env` và điền `AK_TOKEN` (`.env` đã nằm trong `.gitignore`). Từ đó mỗi lần publish:

```sh
task publish
```

`task publish` chạy `npm test` trước rồi mới `npm run publish:registry`, với biến môi trường nạp từ `.env`
(`Taskfile.yml`). Không dùng Task thì đặt `AK_TOKEN` trong môi trường (`$env:AK_TOKEN = '<registry token>'`) và gọi
thẳng `npm run publish:registry`.

Script chỉ nén `.claude-plugin/`, `plugins/` và `README.md` (phẳng, ở gốc zip) rồi tải lên:

```text
https://sa-hrm.vnrlocal.com:9091/api/v1/repositories/vnr-marketplace/download/marketplace.zip
```

DevHub nhận bản mới ở lần **Sync** kế tiếp trong Settings › Marketplaces. Biến môi trường tuỳ chọn:
`AK_REPO_BASE` (kho khác) và `AK_ARTIFACT` (tên tệp khác), đặt trong `.env` hay môi trường đều được. `task test` (hoặc `npm test`) kiểm tra bộ dựng zip.

## Tệp giới thiệu cho DevHub

Mỗi plugin có thể kèm tệp tuỳ chọn `plugins/<plugin>/devhub.catalog.json` mô tả cách plugin hiện trong trang Tiện ích của
DevHub: `icon` (emoji), `tags`, `examples` (câu hỏi mẫu), `defaultScope`, `providesTable` (bảng "Dùng cho") và
`changelog`. Control plane nexus đọc tệp này khi đồng bộ marketplace. Tệp sai không chặn plugin: plugin vẫn vào catalog,
tệp bị bỏ qua kèm cảnh báo. Thêm plugin mới không cần cấu hình gì ở nexus — nguồn `vnr-marketplace` đã được xác minh nên
mọi plugin từ đây đều có dấu xác minh và hiện dưới «Dành riêng cho VNR».
