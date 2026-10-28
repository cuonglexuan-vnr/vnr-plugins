# Changelog — vnr-marketplace

Theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Số phiên bản là `version` của `.claude-plugin/marketplace.json`
(phiên bản gửi lên registry); phiên bản từng plugin ghi trong ngoặc. Mục mới nhất ở trên.

## [2.0.0] — 2026-10-16 (PBI #8089)

### Thêm (git conventions, 2026-10-22)
- **Skill `vnr-commit`** (`skills/vnr-commit/`): nói "commit" là AI stage mọi thay đổi (trừ danh sách never-commit), viết message theo
  quy ước team — Conventional Commits, tiêu đề tiếng Anh ≤ 72, thân tiếng Việt khi cần, footer `VNR W<tuần> #<id>` — và commit ngay;
  không hỏi, không push. Lớp quy ước mặc định ở `skills/vnr-commit/convention.md`; `vnr.hrm.wiki/docs/review/git-conventions.md`
  (SA team) ghi đè theo mục khi chạy trong workspace hoặc trong `src/<repo>`.
  - Ở gốc `vnr.hrm.wiki` với cả `src/vnr.hrm.solution` lẫn `src/vnr.hrm.web` bẩn: một lượt ra hai commit (BE trước, FE sau, hai nhánh cùng tên,
    mỗi repo một message), không hỏi "FE hay BE?" nữa (2026-10-26). Đối số `FE` / `BE` giới hạn một repo; đứng trong `src/<repo>` thì chỉ repo đó.
    Amend sau hai commit: "sửa lại FE: …" / "sửa lại BE: …".
- **Skill `vnr-pr`** (`skills/vnr-pr/`): nói "tạo PR" là AI push nhánh, viết tiêu đề tiếng Anh + mô tả tiếng Việt bốn mục
  (Vì sao · Thay đổi · Kiểm tra · Work item), tạo PR qua MCP `tfs`; không MCP thì in text và link tạo PR để dán.
  - Trong workspace `vnr.hrm.wiki`, `## Kiểm tra` tự đính kèm `work/vnr-review/<repo>.md`; nội dung đã review (dòng
    `<!-- vnr-review tree=… -->`, trừ file never-commit) khác `HEAD^{tree}` sau khi commit → thêm dòng nhắc chạy lại `/vnr-review`
    (review phần chưa commit rồi "tạo PR" không còn bị báo lệch); báo cáo còn FAIL vẫn tạo PR (chỉ báo SE một dòng).
- Khối CLAUDE.md mới `git-conventions` (`claude-md/git-conventions.md`, scope user, khối thứ hai trong `devhub.claude-md.json`): điều hướng
  "commit" → `/vnr-commit`, "push / tạo PR" → `/vnr-pr` ở mọi repo + tóm tắt quy ước. Khối `hrm-wiki-rules` giữ nguyên.

### Đổi (git conventions, 2026-10-22)
- `/vnr-dev`, `/vnr-toi-muon`: nhánh `<type>/<id>-<slug>` (trước: `<type>/<id-or-slug>`), khớp luật NAME-28 v2 của `docs/review/rules/name.md`.
- Câu "AI không bao giờ commit/push/PR" trong README thành "không khi bạn chưa bảo".

### Gỡ (breaking)
- **vnr-swe 2.0.0**: gỡ toàn bộ quy trình spec-kit — 20 skill (`vnr-specify`, `vnr-clarify`, `vnr-plan`, `vnr-tasks`, `vnr-implement`,
  `vnr-analyze`, `vnr-checklist`, `vnr-constitution`, `vnr-customize`, `vnr-auto-pipeline`, `vnr-arch-review`, `vnr-qc-assistant`,
  `vnr-run-e2e`, `vnr-run-testcases`, `vnr-mobile-implement`, `vnr-mobile-auto-test`, `vnr-wiki`, `vnr-wiki-add`, `vnr-wiki-init`,
  `vnr-wiki-sync`), 14 agent, `templates/`, `memory/constitution.md`, `scripts/` (`resolve-context.mjs`, `okf-validate.mjs`, PowerShell),
  hook `PreToolUse` nạp wiki, `extensions.yml`, `output-styles/`, `settings.json`, `.lsp.json`, `init-options.json`.
- Lệnh `/vnr-auto-pipeline` không còn: gõ `/vnr-dev` (mô tả của skill nêu tên cũ để Claude tự điều hướng).
- Không hỗ trợ Mobile (Flutter) trong 2.0. Cơ chế bảo trì wiki (raw → wiki) sẽ thiết kế lại ở PBI riêng.

### Thêm
- **Skill `vnr-dev`** (`skills/vnr-dev/`): một lệnh làm PBI từ đầu đến cuối trên nền `superpowers` — intake (PBI id qua MCP `tfs`,
  file spec BA, câu mô tả, `resume`), brainstorm → `work/<id>/spec.md` (SE duyệt), `writing-plans` → `<id>-plan.md` (SE duyệt khi ≥ 4 task
  hoặc đụng path risky), build không trông (SDD / executing-plans + TDD), gate build/test, giữ nhánh + staged, rồi tự chạy
  `/vnr-review` một lần. Không commit/push. `workspace.md` nhận diện `vnr.hrm.wiki` hay repo đơn, nhánh `develop` / `projects/<customer>/dev`.
- `devhub.claude-md.json` + `claude-md/hrm-wiki-rules.md`: hợp đồng để DevHub ghi khối `<!-- BEGIN:hrm-wiki-rules -->` vào CLAUDE.md
  user-level của máy SE ở bước "Ngữ cảnh cho Claude" của Trang chủ (đọc từ bản marketplace đã đồng bộ, không cần cài plugin; thay trọn
  khối khi nội dung đổi; gỡ plugin không gỡ khối).
- **Skill `vnr-toi-muon`** (`skills/vnr-toi-muon/`): bản độc lập của `/vnr-dev` cho **repo bất kỳ** — cùng lane Change/Bug, STOP 1/STOP 2, build không trông
  trên superpowers (TDD, gate so với test đỏ sẵn, stage theo Files, không commit), artefact ở `work/<id>/` tại gốc repo. `repo.md` nhận diện stack
  (nx, node, make/task/just, dotnet, python, go, rust) và nhánh gốc (`--base` > `projects/<x>/dev` > `develop` > `main` > `master`); không gọi `/vnr-review`.
- `marketplace.json`: `allowCrossMarketplaceDependenciesOn: ["claude-plugins-official"]`; entry `vnr-swe` khai dependency
  `superpowers@claude-plugins-official` (cài plugin tự kéo superpowers; cần cài superpowers trước nếu allowlist không áp dụng).

### Thay đổi
- **`/vnr-review` v2 (PBI #7916)**: báo cáo là một bảng PASS / WARN / FAIL (`# · Kết quả · Luật · Vị trí · Vấn đề → Sửa`, mỗi mã một dòng,
  không code fence) dán thẳng vào mô tả PR; bỏ các mục Nghi ngờ / Cần ngữ cảnh / Chưa kiểm, dòng độ phủ `Đã kiểm <m> luật, đủ <n>/<n> nhóm`.
  Mọi luật trong phạm vi đều qua AI theo nhóm luật (agent `sonnet`, sổ theo dõi `ledger` giao lại lượt thiếu kết quả); bỏ regex-gate,
  `--full`, `--no-verify`; luật có `Trạng thái: đề xuất` bị bỏ qua. Cách chấm đổi: kết quả có thể khác nhẹ giữa hai lần chạy.
  `--ci` chưa kiểm hết → exit 4.
  - Số đo 2026-10-22 trên nhánh thật: BE 55 file 2m20s · FE 23 file ~7m30s (chạy song song với một lượt khác) · FE+BE 78 file 7m04s (15 lượt review, `parallel` 8); mục tiêu 2–10 phút.
  - Báo cáo riêng của mỗi repo luôn được lưu ở `work/vnr-review/<repo>.md` (`cli.mjs report --save <dir>`, stdout giữ nguyên) để `/vnr-pr` đính kèm.
- `agents/AGENTS.md` của plugin bị gỡ (validator coi mọi `.md` trong `agents/` là một agent).
- `README.md`, `AGENTS.md`, `devhub.catalog.json` của `vnr-swe` viết lại cho hai lệnh; `docs/glossary.md` thêm `work folder`, `lane`.

### Ghi chú
- Máy SE cần `superpowers` (DevHub cài kèm) và Node ≥ 22.5 (script review).
- Repo `vnr.hrm.wiki` (nhánh `feat/wiki-claude-md`): `CLAUDE.md` viết lại tiếng Việt, `.claude/rules/{fe,be}-wiki.md` thay hook, `work/` gitignored.

## [1.2.0] — chưa phát hành (nhánh `feat/review-skill`)

### Thêm
- **vnr-swe 1.1.0 — skill `vnr-review`**: review phần code chưa push (BE + FE) của workspace `vnr.hrm.wiki` theo bộ luật
  `docs/review/rules/*.md`; báo cáo tiếng Việt FAIL / WARN / PASS với dòng `VERDICT:` cho hook/CI.
  - Lớp máy `skills/vnr-review/scripts/` (diff · parse luật · cổng path/regex · phân tầng FAIL-first · báo cáo · `check`), có test (`npm test`).
  - Agent `vnr-rule-checker` (một luật × một file mỗi lượt) và `vnr-rule-verifier` (xác minh finding FAIL); mặc định `model: haiku`.
  - Chế độ `/vnr-review check`: kiểm 6 mốc máy đọc của file luật, sinh `docs/review/INDEX.md` và digest `.claude/rules/review-{fe,be}.md`.
  - `templates/report.template.md`: khuôn báo cáo để orchestrator dán nguyên văn — bảng tóm tắt theo mã luật dưới `KẾT LUẬN`,
    mục FAIL/WARN nhóm theo luật (Vì/→ in một lần, mỗi vị trí một dòng), dòng `Tổng:` khi review nhiều repo.
- `CHANGELOG.md` (tệp này) và bản đồ `AGENTS.md` cho `plugins/vnr-swe/`, `agents/`, `skills/vnr-review/`, `skills/vnr-review/scripts/`.

### Thay đổi
- `npm test` phủ thêm `plugins/vnr-swe/skills/vnr-review/scripts/*.test.mjs`.
- `Taskfile.yml`: `task publish` (= `npm test` + `npm run publish:registry`) nạp `AK_TOKEN` / `AK_REPO_BASE` / `AK_ARTIFACT`
  từ `.env` ở gốc repo (mẫu: `.env.example`).
- Registry mặc định chuyển sang `https://sa-hrm.vnrlocal.com:9091/api/v1/repositories/vnr-marketplace`, kho đổi `vnr-ai` → `vnr-marketplace` (`publish-to-registry.mjs`, `README.md`).
- `plugins/vnr-swe/README.md`: hàng skill `vnr-review`, hai agent mới; `devhub.catalog.json`: changelog 1.1.0.

### Ghi chú
- Yêu cầu Node ≥ 22.5 cho các script review (`path.matchesGlob`); CLI báo exit 3 nếu thiếu.
- Luật review là dữ liệu của `vnr.hrm.wiki` (nhánh `feat/review-rules`), không nằm trong plugin.

## [1.1.0] — 2026-10-13

### Thêm
- `devhub.catalog.json` cho `vnr-swe` và `vnr-sa` (giới thiệu trong Tiện ích của DevHub).
- `AGENTS.md` gốc; `docs/glossary.md`.

### Thay đổi
- Đổi tên marketplace `vnr-ai` → `vnr-marketplace` (tên kho registry giữ `vnr-ai`); tài liệu chuyển sang tiếng Việt.
- Ngừng theo dõi `.self/` trong git.

## [1.0.0] — 2026-07-06 … 2026-10-07

### Thêm
- Phát hành lên registry VNR (Artifact Keeper): `scripts/build-marketplace-zip.mjs`, `scripts/publish-to-registry.mjs`, `npm run publish:registry` (2026-10-07).
- `vnr-sa` 1.0.0: skill `vnr-tfs` (tạo PBI + tách task trên TFS, 2026-08-19); skill `vnr-md2docx` (Markdown → DOCX theo mẫu VNR, 2026-07-10).
- `vnr-swe` 1.0.0: pipeline Spec-Driven Development (plan → review → tasks → implement → arch/sec review → report), 14 agent, wiki skills.

### Thay đổi
- Đổi tên plugin `vnr-plugin` → `vnr-swe`, marketplace `vnr-plugins` → `vnr-ai` (2026-07-06).

> Các mục trước 1.1.0 được suy ra từ `git log`; số phiên bản thời đó không được ghi nhất quán.
