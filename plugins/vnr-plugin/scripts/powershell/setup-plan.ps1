#!/usr/bin/env pwsh
# Setup implementation plan for a Vnr feature

[CmdletBinding()]
param(
    [switch]$Json,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

# Show help if requested
if ($Help) {
    Write-Output "Usage: ./vnr-plugin/scripts/powershell/setup-plan.ps1 [-Json] [-Help]"
    Write-Output "  -Json     Output results in JSON format"
    Write-Output "  -Help     Show this help message"
    exit 0
}

# Load common functions
. "$PSScriptRoot/common.ps1"

# Get all paths and variables from common functions
$paths = Get-FeaturePathsEnv

# Check if we're on a proper feature branch (only for git repos)
if (-not (Test-FeatureBranch -Branch $paths.CURRENT_BRANCH -HasGit $paths.HAS_GIT)) {
    exit 1
}

# Ensure the feature directory exists
New-Item -ItemType Directory -Path $paths.FEATURE_DIR -Force | Out-Null

# Copy plan template if it exists, otherwise create empty file
$template = $null

try {
    $template = Resolve-Template -TemplateName 'plan-template' -RepoRoot $paths.REPO_ROOT
}
catch {
    $template = $null
}

# Fallback path for Vnr speckit template
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

# Output results
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
