# repo.md — cách `/vnr-toi-muon` nhận ra repo, nhánh tích hợp, gate (không cần dev cấu hình)

Đọc ở B0. Thứ tự ưu tiên: `--base` của dev > `work/vnr-toi-muon.md` (tệp ghi đè, nếu có) > CLAUDE.md/AGENTS.md của repo > quy tắc dưới đây.

## 1. Repo
`ROOT` = `git rev-parse --show-toplevel` (mở Claude ở thư mục con vẫn ra gốc). Không phải repo git → hỏi một câu, dừng. Mọi lệnh git/gate chạy từ `ROOT`.
Monorepo nhiều package: `stack` ghi theo bằng chứng ở gốc; gate chạy cho package/project chứa file sẽ sửa.

## 2. Nhánh tích hợp
1. `--base <nhánh>` nếu dev đưa; không tồn tại (`git rev-parse --verify`, rồi `origin/<nhánh>`) → hỏi một câu, không tự thay.
2. Nhánh hiện tại dạng `projects/<x>/…` và `projects/<x>/dev` tồn tại → dùng nó.
3. `develop` → `main` → `master`, cái đầu tiên tồn tại (local, rồi `origin/`).
4. Không có cái nào → hỏi dev một câu (gộp với câu hỏi gate nếu cũng thiếu), ghi `work/vnr-toi-muon.md`.

## 3. Gate (chạy riêng từng lệnh từ `ROOT`; đọc output thật; CLAUDE.md/AGENTS.md của repo thắng bảng này)
| Bằng chứng ở `ROOT` | stack | Lệnh gate (theo thứ tự) | Xanh khi |
|---|---|---|---|
| `nx.json` | nx | `npx nx run-many -t build,lint,test -p <project chứa file sửa>` (baseline chạy trước khi sửa nên **không** dùng `affected`) | exit 0 |
| `package.json` có scripts | node | `npm run build` · `npm run lint` · `npm test` (chỉ script có thật; dùng `pnpm`/`yarn` nếu có lockfile tương ứng). Script chỉ `echo` → gate xanh nhưng báo cáo ghi "repo không có test thật" | exit 0 |
| `Makefile` / `Taskfile.yml` / `justfile` | make/task/just | target `build`, `lint`, `test` có thật (`make -n <t>` / `task --list` / `just --list`) | exit 0 |
| `*.sln` / `*.csproj` | dotnet | `dotnet build <sln>` · `dotnet test <csproj test bị đụng>` (có `Tests/*ArchTests*` → chạy luôn) | `0 Error(s)` · `Failed: 0` |
| `pyproject.toml` / `requirements*.txt` | python | `ruff check .` (nếu có ruff) · `pytest -q` | exit 0 |
| `go.mod` | go | `go build ./...` · `go vet ./...` · `go test ./...` | exit 0 |
| `Cargo.toml` | rust | `cargo build` · `cargo test` | exit 0 |
| không có gì ở trên | unknown | hỏi dev một câu (lệnh build/test là gì?), ghi `work/vnr-toi-muon.md` | theo dev |
Nhiều bằng chứng cùng lúc (vd `nx.json` + `package.json`): dùng dòng đầu tiên khớp; các dòng sau chỉ khi CLAUDE.md nói thêm.

**Đỏ sẵn trên nhánh tích hợp:** ngay sau khi tạo nhánh, trước khi sửa gì, chạy gate một lần → `WORK/baseline-gates.md` (lệnh · kết quả · tên từng test đỏ).
Gate **xanh** = exit 0 **hoặc** các test đỏ trùng đúng danh sách đỏ sẵn (không test đỏ mới; lỗi build/compile thì không bao giờ xanh). Gate không có trong
baseline: mọi test đỏ là đỏ mới. Đỏ sẵn được nêu trong ledger và báo cáo cuối. Không worktree, không `git stash` để so.

## 4. Risky (đụng tới = plan big, STOP 2; Envelope cấm đụng khi plan không nêu)
- Migration DB (`**/migrations/**`, `**/Migrations/**`), schema/ORM snapshot
- Lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `*.lock`, `go.sum`) và tệp khai dependency (`package.json` deps, `*.csproj`, `pyproject.toml`, `go.mod`, `Cargo.toml`)
- CI/CD và hạ tầng: `.github/**`, `azure-pipelines*.yml`, `.gitlab-ci.yml`, `Dockerfile*`, `docker-compose*.yml`, `*.tf`
- Cấu hình gốc: `nx.json`, `tsconfig.base.json`, `Directory.Build.props`, `appsettings*.json`, `.env*`
- Xoá > 200 dòng; đổi tên/xoá API public; đụng `**/platform/**`, `**/core/**`, `**/shared/**`

## 5. Tệp ghi đè `work/vnr-toi-muon.md` (tuỳ chọn; dev tạo hoặc skill ghi sau câu hỏi; mỗi dòng một sự thật)
```
## repo
- base: <nhánh tích hợp>
## gates
- <lệnh> — <điều kiện xanh>
## risky
- <glob hoặc mô tả>
```
Dòng trong tệp này thay dòng cùng mục ở trên; mục không có → dùng mặc định.
