#!/usr/bin/env pwsh

# Script kiểm tra điều kiện tiên quyết hợp nhất (PowerShell)
#
# Script này kiểm tra điều kiện tiên quyết thống nhất cho quy trình Vnr SDLC.
#
# Cách dùng: ./check-prerequisites.ps1 [OPTIONS]
#
# OPTIONS:
#   -Json               Xuất kết quả dạng JSON
#   -RequireTasks       Bắt buộc phải có tasks.md (cho phase triển khai)
#   -IncludeTasks       Đưa tasks.md vào danh sách AVAILABLE_DOCS
#   -PathsOnly          Chỉ xuất các biến đường dẫn (không kiểm tra)
#   -Help, -h           Hiển thị trợ giúp

[CmdletBinding()]
param(
    [switch]$Json,
    [switch]$RequireTasks,
    [switch]$IncludeTasks,
    [switch]$PathsOnly,
    [Alias('h')]
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

# Hiển thị trợ giúp nếu được yêu cầu
if ($Help) {
    Write-Output @"
Usage: check-prerequisites.ps1 [OPTIONS]

Consolidated prerequisite checking for Vnr SDLC workflow.

OPTIONS:
  -Json               Output in JSON format
  -RequireTasks       Require tasks.md to exist (for implementation phase)
  -IncludeTasks       Include tasks.md in AVAILABLE_DOCS list
  -PathsOnly          Only output path variables (no prerequisite validation)
  -Help, -h           Show this help message

EXAMPLES:
  # Check task prerequisites (plan.md required)
  .\check-prerequisites.ps1 -Json
  
  # Check implementation prerequisites (plan.md + tasks.md required)
  .\check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks
  
  # Get feature paths only (no validation)
  .\check-prerequisites.ps1 -PathsOnly

"@
    exit 0
}

# Nạp các hàm dùng chung
. "$PSScriptRoot/common.ps1"

# Lấy đường dẫn của feature và kiểm tra tên nhánh
$paths = Get-FeaturePathsEnv

if (-not (Test-FeatureBranch -Branch $paths.CURRENT_BRANCH -HasGit:$paths.HAS_GIT)) {
    exit 1
}

# Ở chế độ chỉ lấy đường dẫn: xuất đường dẫn rồi thoát
if ($PathsOnly) {
    if ($Json) {
        [PSCustomObject]@{
            REPO_ROOT    = $paths.REPO_ROOT
            PLUGIN_DIR   = $paths.PLUGIN_DIR
            BRANCH       = $paths.CURRENT_BRANCH
            FEATURE_DIR  = $paths.FEATURE_DIR
            USER_STORY   = $paths.USER_STORY
            UI_DETAIL    = $paths.UI_DETAIL
            FEATURE_SPEC = $paths.FEATURE_SPEC
            IMPL_PLAN    = $paths.IMPL_PLAN
            TASKS        = $paths.TASKS
        } | ConvertTo-Json -Compress
    }
    else {
        Write-Output "REPO_ROOT: $($paths.REPO_ROOT)"
        Write-Output "PLUGIN_DIR: $($paths.PLUGIN_DIR)"
        Write-Output "BRANCH: $($paths.CURRENT_BRANCH)"
        Write-Output "FEATURE_DIR: $($paths.FEATURE_DIR)"
        Write-Output "USER_STORY: $($paths.USER_STORY)"
        Write-Output "UI_DETAIL: $($paths.UI_DETAIL)"
        Write-Output "FEATURE_SPEC: $($paths.FEATURE_SPEC)"
        Write-Output "IMPL_PLAN: $($paths.IMPL_PLAN)"
        Write-Output "TASKS: $($paths.TASKS)"
    }
    exit 0
}

# Kiểm tra các thư mục và tệp bắt buộc
if (-not (Test-Path $paths.FEATURE_DIR -PathType Container)) {
    Write-Output "ERROR: Feature directory not found: $($paths.FEATURE_DIR)"
    Write-Output "Create it and copy the BA User Story file(s) in, e.g.:"
    Write-Output "  mkdir specs/<US-ID>"
    Write-Output "  cp <BA-delivery>/<US-ID>_*.md specs/<US-ID>/"
    Write-Output "Or run /vnr-specify as a fallback to stub a User Story locally."
    exit 1
}

if (-not (Test-Path $paths.USER_STORY -PathType Leaf)) {
    Write-Output "ERROR: User Story file not found in $($paths.FEATURE_DIR)"
    Write-Output "Expected a file matching '<US-ID>_*.md' (shape: templates/userstory-template.md)."
    Write-Output "Copy the BA-delivered User Story file into this folder, or run /vnr-specify as a fallback."
    exit 1
}

if (-not (Test-Path $paths.IMPL_PLAN -PathType Leaf)) {
    Write-Output "ERROR: plan.md not found in $($paths.FEATURE_DIR)"
    Write-Output "Run /vnr-plan first to create the implementation plan."
    exit 1
}

# Kiểm tra tasks.md nếu được yêu cầu
if ($RequireTasks -and -not (Test-Path $paths.TASKS -PathType Leaf)) {
    Write-Output "ERROR: tasks.md not found in $($paths.FEATURE_DIR)"
    Write-Output "Run /vnr-tasks first to create the task list."
    exit 1
}

# Dựng danh sách các tài liệu có sẵn
$docs = @()

# Luôn kiểm tra các tài liệu tuỳ chọn này
if (Test-Path $paths.RESEARCH) { $docs += 'research.md' }
if (Test-Path $paths.DATA_MODEL) { $docs += 'data-model.md' }

# Kiểm tra thư mục contracts (chỉ khi tồn tại và có tệp)
if ((Test-Path $paths.CONTRACTS_DIR) -and (Get-ChildItem -Path $paths.CONTRACTS_DIR -ErrorAction SilentlyContinue | Select-Object -First 1)) {
    $docs += 'contracts/'
}

if (Test-Path $paths.QUICKSTART) { $docs += 'quickstart.md' }

# Thêm tasks.md nếu được yêu cầu và tệp tồn tại
if ($IncludeTasks -and (Test-Path $paths.TASKS)) {
    $docs += 'tasks.md'
}

# Xuất kết quả
if ($Json) {
    [PSCustomObject]@{
        PLUGIN_DIR     = $paths.PLUGIN_DIR
        FEATURE_DIR    = $paths.FEATURE_DIR
        USER_STORY     = $paths.USER_STORY
        UI_DETAIL      = $paths.UI_DETAIL
        AVAILABLE_DOCS = $docs
    } | ConvertTo-Json -Compress
}
else {
    Write-Output "FEATURE_DIR:$($paths.FEATURE_DIR)"
    Write-Output "USER_STORY:$($paths.USER_STORY)"
    Write-Output "UI_DETAIL:$($paths.UI_DETAIL)"
    Write-Output "AVAILABLE_DOCS:"

    Test-FileExists -Path $paths.RESEARCH -Description 'research.md' | Out-Null
    Test-FileExists -Path $paths.DATA_MODEL -Description 'data-model.md' | Out-Null
    Test-DirHasFiles -Path $paths.CONTRACTS_DIR -Description 'contracts/' | Out-Null
    Test-FileExists -Path $paths.QUICKSTART -Description 'quickstart.md' | Out-Null

    if ($IncludeTasks) {
        Test-FileExists -Path $paths.TASKS -Description 'tasks.md' | Out-Null
    }
}
