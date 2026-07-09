#!/usr/bin/env bash
# Export a VNR playbook Markdown file to a branded DOCX — for team members who
# run it directly (without Claude Code). Thin wrapper around md_to_docx.py:
# ensures python-docx is installed, then forwards all arguments.
#
# Usage (from the Deliverables repo root, so templates/word/ is found automatically):
#   <path-to-skill>/export-docx.sh <INPUT.md> -o <OUTPUT.docx-or-dir> [options]
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOL="$DIR/md_to_docx.py"

# Pick a Python 3 interpreter.
if command -v python >/dev/null 2>&1; then PY=python
elif command -v python3 >/dev/null 2>&1; then PY=python3
else
  echo "ERROR: Python 3 not found on PATH. Install it from https://www.python.org/downloads/" >&2
  exit 1
fi

# Ensure python-docx is installed (one-time).
if ! "$PY" -c "import docx" >/dev/null 2>&1; then
  echo "python-docx not found - installing..."
  "$PY" -m pip install --quiet python-docx
fi

exec "$PY" "$TOOL" "$@"
