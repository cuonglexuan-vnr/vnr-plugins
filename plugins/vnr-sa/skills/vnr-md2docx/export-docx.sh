#!/usr/bin/env bash
# Xuất tệp Markdown playbook của VNR sang DOCX theo nhận diện thương hiệu — dành cho đồng đội
# chạy trực tiếp (không qua Claude Code). Wrapper mỏng bọc md_to_docx.py:
# đảm bảo đã cài python-docx, rồi chuyển toàn bộ tham số.
#
# Cách dùng (từ thư mục gốc của repo Deliverables, để tự tìm thấy templates/word/):
#   <path-to-skill>/export-docx.sh <INPUT.md> -o <OUTPUT.docx-or-dir> [options]
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOL="$DIR/md_to_docx.py"

# Chọn trình thông dịch Python 3.
if command -v python >/dev/null 2>&1; then PY=python
elif command -v python3 >/dev/null 2>&1; then PY=python3
else
  echo "ERROR: Python 3 not found on PATH. Install it from https://www.python.org/downloads/" >&2
  exit 1
fi

# Đảm bảo python-docx đã được cài (chỉ cần một lần).
if ! "$PY" -c "import docx" >/dev/null 2>&1; then
  echo "python-docx not found - installing..."
  "$PY" -m pip install --quiet python-docx
fi

exec "$PY" "$TOOL" "$@"
