# HRM Wiki

Khối này do DevHub ghi khi cài plugin `vnr-swe`; đừng sửa tay (DevHub ghi đè khi cập nhật).

Dự án HRM làm việc trong workspace `vnr.hrm.wiki`:

```
vnr.hrm.wiki/
├── docs/wiki/              ← kiến trúc, pattern, luật, recipe — đọc TRƯỚC khi plan/code (bắt đầu từ docs/wiki/index.md, bảng Quick Lookup)
├── docs/review/            ← bộ luật review của SA team (/vnr-review dùng)
├── src/vnr.hrm.web/        ← FE Angular/Nx (clone riêng, có CLAUDE.md riêng)
├── src/vnr.hrm.solution/   ← BE .NET (clone riêng, có CLAUDE.md riêng)
└── work/<PBI>/             ← artefact của /vnr-dev: spec BA, spec, plan, review (không commit)
```

Khi SE nói "làm PBI <id>", "tôi muốn …", "sửa bug …" → dùng skill `/vnr-dev`. Trước khi push → `/vnr-review`.
Khi plan hoặc viết code HRM ở bất kỳ thư mục nào trong workspace: mở `docs/wiki/index.md` của `vnr.hrm.wiki`, chọn trang theo việc đang làm, rồi mới đọc `src/`.
Không tự commit/push; SE xem diff và commit tay.
