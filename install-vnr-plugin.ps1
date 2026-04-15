param(
  [string]$ProjectDir = (Get-Location).Path,
  [ValidateSet("project","user")]
  [string]$Scope = "project",
  [switch]$Force,
  [switch]$NoScaffold,
  [switch]$RefreshMarketplace
)

$ErrorActionPreference = "Stop"

$Bootstrap = Join-Path $PSScriptRoot "bin\vnr-bootstrap.mjs"

if (-not (Test-Path $Bootstrap)) {
  throw "Cannot find bootstrap script: $Bootstrap"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is required. Your package requires Node >= 18.18.0." 
}

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  throw "Claude CLI is required and must be in PATH."
}

Push-Location $ProjectDir
try {
  $args = @(
    $Bootstrap
    "init"
    "vnr-plugin"
    "--scope"
    $Scope
  )

  if ($Force) { $args += "--force" }
  if ($NoScaffold) { $args += "--no-scaffold" }
  if ($RefreshMarketplace) { $args += "--refresh-marketplace" }

  node @args
}
finally {
  Pop-Location
}
