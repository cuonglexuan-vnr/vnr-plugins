# Changelog — vnr-marketplace

Theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Số phiên bản là `version` của `.claude-plugin/marketplace.json`
(phiên bản gửi lên registry); phiên bản từng plugin ghi trong ngoặc. Mục mới nhất ở trên.

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
