#!/usr/bin/env pwsh
# Chuẩn bị kế hoạch triển khai cho một feature Vnr

[CmdletBinding()]
param(
    [switch]$Json,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

# Hiển thị trợ giúp nếu được yêu cầu
if ($Help) {
    Write-Output "Usage: ./setup-plan.ps1 [-Json] [-Help]"
    Write-Output "  -Json     Output results in JSON format"
    Write-Output "  -Help     Show this help message"
    exit 0
}

# Nạp các hàm dùng chung
. "$PSScriptRoot/common.ps1"

# Lấy mọi đường dẫn và biến từ các hàm dùng chung
$paths = Get-FeaturePathsEnv

# Kiểm tra đang ở nhánh feature hợp lệ (chỉ với repo git)
if (-not (Test-FeatureBranch -Branch $paths.CURRENT_BRANCH -HasGit $paths.HAS_GIT)) {
    exit 1
}

# Đảm bảo thư mục feature tồn tại
New-Item -ItemType Directory -Path $paths.FEATURE_DIR -Force | Out-Null

# Sao chép template kế hoạch nếu có, không thì tạo tệp rỗng
$template = $null

try {
    $template = Resolve-Template -TemplateName 'plan-template' -PluginDir $paths.PLUGIN_DIR
}
catch {
    $template = $null
}

# Đường dẫn dự phòng cho template speckit của Vnr
if (-not $template) {
    $template = Join-Path $paths.PLUGIN_DIR 'templates/plan-template.md'
}

if ($template -and (Test-Path $template)) {
    Copy-Item $template $paths.IMPL_PLAN -Force
    Write-Output "Copied plan template to $($paths.IMPL_PLAN)"
}
else {
    Write-Warning "[vnr-plan] Plan template not found"
    New-Item -ItemType File -Path $paths.IMPL_PLAN -Force | Out-Null
}

# Xuất kết quả
if ($Json) {
    $result = [PSCustomObject]@{
        PLUGIN_DIR   = $paths.PLUGIN_DIR
        USER_STORY   = $paths.USER_STORY
        UI_DETAIL    = $paths.UI_DETAIL
        FEATURE_SPEC = $paths.FEATURE_SPEC
        IMPL_PLAN    = $paths.IMPL_PLAN
        SPECS_DIR    = $paths.FEATURE_DIR
        BRANCH       = $paths.CURRENT_BRANCH
        HAS_GIT      = $paths.HAS_GIT
    }
    $result | ConvertTo-Json -Compress
}
else {
    Write-Output "PLUGIN_DIR: $($paths.PLUGIN_DIR)"
    Write-Output "USER_STORY: $($paths.USER_STORY)"
    Write-Output "UI_DETAIL: $($paths.UI_DETAIL)"
    Write-Output "FEATURE_SPEC: $($paths.FEATURE_SPEC)"
    Write-Output "IMPL_PLAN: $($paths.IMPL_PLAN)"
    Write-Output "SPECS_DIR: $($paths.FEATURE_DIR)"
    Write-Output "BRANCH: $($paths.CURRENT_BRANCH)"
    Write-Output "HAS_GIT: $($paths.HAS_GIT)"
}
