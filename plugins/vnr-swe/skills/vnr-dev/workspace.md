# workspace.md — cách `/vnr-dev` nhận diện repo, nhánh, gate (không cần SE cấu hình)

Đọc tệp này ở B0. Thứ tự ưu tiên: `--base` của SE > `work/vnr-dev.md` (tệp ghi đè, nếu có) > quy tắc dưới đây.

## 1. Chế độ
| Nhìn thấy ở cwd | Chế độ | Repo đích |
|---|---|---|
| `src/vnr.hrm.web/` hoặc `src/vnr.hrm.solution/` | `workspace` (gốc `vnr.hrm.wiki`) | repo mà thay đổi đụng tới (FE, BE hoặc cả hai); mỗi repo là một clone git riêng — mọi lệnh git chạy **trong** `src/<repo>/` |
| `nx.json` hoặc `angular.json` | `single-repo` FE | cwd |
| `*.sln` | `single-repo` BE | cwd |
| không có gì ở trên | `unknown` | hỏi SE **hai** câu một lần (repo đích? nhánh tích hợp?), ghi `work/vnr-dev.md` (mục 5) |
Thay đổi đụng cả FE và BE trong chế độ `workspace`: làm BE trước, FE sau, hai nhánh cùng tên, hai lượt gate, một lượt `/vnr-review` (không đối số = cả hai).

## 2. Nhánh tích hợp
1. `--base <nhánh>` nếu SE đưa.
2. Nhánh hiện tại của repo đích có dạng `projects/<customer>/…` → `projects/<customer>/dev`.
3. Còn lại → `develop`.
Kiểm tra nhánh tồn tại (`git rev-parse --verify <nhánh>`); không có → thử `origin/<nhánh>`; vẫn không → hỏi SE một câu.

## 3. Gate (chạy riêng từng lệnh, từ gốc repo đích; đọc output thật)
| Repo | Lệnh | Khi nào | Xanh khi |
|---|---|---|---|
| FE (`vnr.hrm.web`) | `npx nx build <project>` | mọi thay đổi; `<project>` = project Nx chứa file đã sửa (`npx nx show projects --affected`) | exit 0 |
| FE | `npx nx lint <project>` | mọi thay đổi | exit 0 |
| FE | `npx nx test <project>` | có file `*.spec.ts` bị đụng hoặc thêm | exit 0 |
| BE (`vnr.hrm.solution`) | `dotnet build VNR.Solution.sln` | mọi thay đổi | `0 Error(s)` |
| BE | `dotnet test Tests/VNR.ArchTests/VNR.ArchTests.csproj` | mọi thay đổi | `Failed: 0` |
| BE | `dotnet test <csproj của test bị đụng>` | có test bị đụng/thêm | `Failed: 0` |
Lệnh thật của repo có thể khác: **CLAUDE.md của repo đích thắng** bảng này (đọc mục Build & Test / Common Commands ở đó).

**Đỏ sẵn trên nhánh tích hợp** (vd ArchTests của `develop` có test đỏ từ trước): `/vnr-dev` chạy gate một lần ngay sau khi tạo nhánh, trước khi sửa gì, ghi `WORK/baseline-gates.md` (lệnh · kết quả · tên từng test đỏ).
Gate được coi là **xanh** khi exit 0, **hoặc** các test đỏ trùng đúng danh sách đỏ sẵn (không thêm test đỏ mới; lỗi build thì không bao giờ xanh). Gate không có trong baseline: mọi test đỏ là đỏ mới.
Đỏ sẵn được nêu trong ledger (`built (<nhánh>; đỏ sẵn: <test>)`) và báo cáo cuối. Không dùng worktree hay `git stash` để so.

## 4. Risky (đụng tới = plan big, STOP 2; Envelope cấm đụng khi plan không nêu)
- BE: migration EF (`**/Migrations/**`), `**/Contracts/**`, `*.csproj`, `Directory.Build.props`, `appsettings*.json`
- FE: `module-federation.manifest.json`, `nx.json`, `package.json`, `**/libs/platform/**`, `**/libs/core/**`
- Cả hai: file xoá nhiều hơn 200 dòng, đổi tên/xoá API public

## 5. Tệp ghi đè `work/vnr-dev.md` (tuỳ chọn, SE/SA tạo; mỗi dòng một sự thật)
```
## repo
- target: <đường dẫn repo đích>        # chỉ khi chế độ unknown
- base: <nhánh tích hợp>
## gates
- <lệnh> — <điều kiện xanh>
## risky
- <glob hoặc mô tả>
```
Dòng trong tệp này thay dòng cùng mục ở trên; mục không có → dùng mặc định.
