<#
.SYNOPSIS
    Export a VNR playbook Markdown file to a branded DOCX — for team members
    who run it directly (without Claude Code).

.DESCRIPTION
    Thin wrapper around md_to_docx.py: makes sure Python + python-docx are
    available, then forwards all arguments to the exporter. Run from the
    Deliverables repo root so the engine finds templates/word/ automatically,
    or pass --template explicitly.

.EXAMPLE
    # From the Deliverables repo root:
    <path-to-skill>\export-docx.ps1 "<INPUT.md>" -o "customer\deployment"

.EXAMPLE
    <path-to-skill>\export-docx.ps1 "<INPUT.md>" -o "<OUTPUT.docx-or-dir>" --code VNR-KH-001 --title "..." --version v1.0
#>
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$tool = Join-Path $scriptDir 'md_to_docx.py'

# Find a Python launcher (PowerShell 5.1 compatible — no ?? operator).
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) {
    Write-Error "Python 3 not found on PATH. Install Python 3 first: https://www.python.org/downloads/"
    exit 1
}

# Ensure python-docx is installed (one-time).
& $py.Source -c "import docx" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "python-docx not found - installing..." -ForegroundColor Yellow
    & $py.Source -m pip install --quiet python-docx
}

# Forward every argument to the exporter.
& $py.Source $tool @args
exit $LASTEXITCODE
