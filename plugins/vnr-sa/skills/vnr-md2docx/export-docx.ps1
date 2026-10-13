<#
.SYNOPSIS
    Xuất tệp Markdown playbook của VNR sang DOCX theo nhận diện thương hiệu — dành cho đồng đội
    chạy trực tiếp (không qua Claude Code).

.DESCRIPTION
    Wrapper mỏng bọc md_to_docx.py: đảm bảo đã có Python + python-docx,
    rồi chuyển toàn bộ tham số cho bộ xuất. Chạy từ thư mục gốc của repo
    Deliverables để engine tự tìm thấy templates/word/,
    hoặc truyền --template tường minh.

.EXAMPLE
    # Từ thư mục gốc của repo Deliverables:
    <path-to-skill>\export-docx.ps1 "<INPUT.md>" -o "customer\deployment"

.EXAMPLE
    <path-to-skill>\export-docx.ps1 "<INPUT.md>" -o "<OUTPUT.docx-or-dir>" --code VNR-KH-001 --title "..." --version v1.0
#>
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $scriptDir 'md_to_docx.py'

# Tìm trình chạy Python (tương thích PowerShell 5.1 — không dùng toán tử ??).
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) {
    Write-Error "Python 3 not found on PATH. Install Python 3 first: https://www.python.org/downloads/"
    exit 1
}

# Đảm bảo python-docx đã được cài (chỉ cần một lần).
& $py.Source -c "import docx" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "python-docx not found - installing..." -ForegroundColor Yellow
    & $py.Source -m pip install --quiet python-docx
}

# Chuyển toàn bộ tham số cho bộ xuất.
& $py.Source $tool @args
exit $LASTEXITCODE
