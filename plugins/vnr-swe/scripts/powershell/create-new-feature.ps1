#!/usr/bin/env pwsh
# Create a new Vnr feature
[CmdletBinding()]
param(
    [switch]$Json,
    [switch]$AllowExistingBranch,
    [string]$ShortName,
    [Parameter()]
    [long]$Number = 0,
    [switch]$Timestamp,
    [switch]$Help,
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$FeatureDescription
)

$ErrorActionPreference = 'Stop'

# Show help if requested
if ($Help) {
    Write-Host "Usage: ./create-new-feature.ps1 [-Json] [-AllowExistingBranch] [-ShortName <name>] [-Number N] [-Timestamp] <feature description>"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Json                 Output in JSON format"
    Write-Host "  -AllowExistingBranch  Switch to branch if it already exists instead of failing"
    Write-Host "  -ShortName <name>     Provide a custom short name (2-4 words) for the branch"
    Write-Host "  -Number N             Specify branch number manually (overrides auto-detection)"
    Write-Host "  -Timestamp            Use timestamp prefix (YYYYMMDD-HHMMSS) instead of sequential numbering"
    Write-Host "  -Help                 Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  ./create-new-feature.ps1 'Add user authentication system' -ShortName 'user-auth'"
    Write-Host "  ./create-new-feature.ps1 'Implement OAuth2 integration for API'"
    Write-Host "  ./create-new-feature.ps1 -Timestamp -ShortName 'user-auth' 'Add user authentication'"
    exit 0
}

# Check if feature description provided
if (-not $FeatureDescription -or $FeatureDescription.Count -eq 0) {
    Write-Error "Usage: ./create-new-feature.ps1 [-Json] [-AllowExistingBranch] [-ShortName <name>] [-Number N] [-Timestamp] <feature description>"
    exit 1
}

$featureDesc = ($FeatureDescription -join ' ').Trim()

# Validate description is not empty after trimming
if ([string]::IsNullOrWhiteSpace($featureDesc)) {
    Write-Error "Error: Feature description cannot be empty or contain only whitespace"
    exit 1
}

function Get-HighestNumberFromSpecs {
    param([string]$SpecsDir)

    [long]$highest = 0
    if (Test-Path $SpecsDir) {
        Get-ChildItem -Path $SpecsDir -Directory | ForEach-Object {
            # Match sequential prefixes (>=3 digits), but skip timestamp dirs
            if ($_.Name -match '^(\d{3,})-' -and $_.Name -notmatch '^\d{8}-\d{6}-') {
                [long]$num = 0
                if ([long]::TryParse($matches[1], [ref]$num) -and $num -gt $highest) {
                    $highest = $num
                }
            }
        }
    }
    return $highest
}

function Get-HighestNumberFromBranches {
    param()

    [long]$highest = 0
    try {
        $branches = git branch -a 2>$null
        if ($LASTEXITCODE -eq 0) {
            foreach ($branch in $branches) {
                # Clean branch name: remove leading markers and remote prefixes
                $cleanBranch = $branch.Trim() -replace '^\*?\s+', '' -replace '^remotes/[^/]+/', ''

                # Extract sequential feature number (>=3 digits), skip timestamp branches
                if ($cleanBranch -match '^(\d{3,})-' -and $cleanBranch -notmatch '^\d{8}-\d{6}-') {
                    [long]$num = 0
                    if ([long]::TryParse($matches[1], [ref]$num) -and $num -gt $highest) {
                        $highest = $num
                    }
                }
            }
        }
    }
    catch {
        Write-Verbose "Could not check Git branches: $_"
    }

    return $highest
}

function Get-NextBranchNumber {
    param(
        [string]$SpecsDir
    )

    # Fetch all remotes to get latest branch info (suppress errors if no remotes)
    try {
        git fetch --all --prune 2>$null | Out-Null
    }
    catch {
        # Ignore fetch errors
    }

    $highestBranch = Get-HighestNumberFromBranches
    $highestSpec = Get-HighestNumberFromSpecs -SpecsDir $SpecsDir

    $maxNum = [Math]::Max($highestBranch, $highestSpec)
    return $maxNum + 1
}

function ConvertTo-CleanBranchName {
    param([string]$Name)

    return $Name.ToLower() `
        -replace '[^a-z0-9]', '-' `
        -replace '-{2,}', '-' `
        -replace '^-', '' `
        -replace '-$', ''
}

function Get-BranchName {
    param([string]$Description)

    $stopWords = @(
        'i', 'a', 'an', 'the', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'from',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall',
        'this', 'that', 'these', 'those', 'my', 'your', 'our', 'their',
        'want', 'need', 'add', 'get', 'set'
    )

    $cleanName = $Description.ToLower() -replace '[^a-z0-9\s]', ' '
    $words = $cleanName -split '\s+' | Where-Object { $_ }

    $meaningfulWords = @()
    foreach ($word in $words) {
        if ($stopWords -contains $word) { continue }

        if ($word.Length -ge 3) {
            $meaningfulWords += $word
        }
        elseif ($Description -match "\b$($word.ToUpper())\b") {
            $meaningfulWords += $word
        }
    }

    if ($meaningfulWords.Count -gt 0) {
        $maxWords = if ($meaningfulWords.Count -eq 4) { 4 } else { 3 }
        return ($meaningfulWords | Select-Object -First $maxWords) -join '-'
    }
    else {
        $result = ConvertTo-CleanBranchName -Name $Description
        $fallbackWords = ($result -split '-') | Where-Object { $_ } | Select-Object -First 3
        return [string]::Join('-', $fallbackWords)
    }
}

# Load common helpers (expected: Get-RepoRoot, Test-HasGit, Resolve-Template)
. "$PSScriptRoot/common.ps1"

# Resolve the target project root (git toplevel, else cwd) and the plugin install root
$repoRoot = Get-RepoRoot
$pluginDir = Get-PluginDir

# Check if git is available at this repo root (not a parent)
$hasGit = Test-HasGit

Set-Location $repoRoot

# Keep feature artifacts under root /specs to stay close to Spec Kit workflow
$specsDir = Join-Path $repoRoot 'specs'
New-Item -ItemType Directory -Path $specsDir -Force | Out-Null

# Generate branch suffix
if ($ShortName) {
    $branchSuffix = ConvertTo-CleanBranchName -Name $ShortName
}
else {
    $branchSuffix = Get-BranchName -Description $featureDesc
}

if ([string]::IsNullOrWhiteSpace($branchSuffix)) {
    Write-Error "Error: Could not derive a valid branch short name from the feature description"
    exit 1
}

# Warn if -Number and -Timestamp are both specified
if ($Timestamp -and $Number -ne 0) {
    Write-Warning "[vnr-specify] Warning: -Number is ignored when -Timestamp is used"
    $Number = 0
}

# Determine branch prefix
if ($Timestamp) {
    $featureNum = Get-Date -Format 'yyyyMMdd-HHmmss'
    $branchName = "$featureNum-$branchSuffix"
}
else {
    if ($Number -eq 0) {
        if ($hasGit) {
            $Number = Get-NextBranchNumber -SpecsDir $specsDir
        }
        else {
            $Number = (Get-HighestNumberFromSpecs -SpecsDir $specsDir) + 1
        }
    }

    $featureNum = ('{0:000}' -f $Number)
    $branchName = "$featureNum-$branchSuffix"
}

# GitHub branch name limit
$maxBranchLength = 244
if ($branchName.Length -gt $maxBranchLength) {
    $prefixLength = $featureNum.Length + 1
    $maxSuffixLength = $maxBranchLength - $prefixLength

    $truncatedSuffix = $branchSuffix.Substring(0, [Math]::Min($branchSuffix.Length, $maxSuffixLength))
    $truncatedSuffix = $truncatedSuffix -replace '-$', ''

    $originalBranchName = $branchName
    $branchName = "$featureNum-$truncatedSuffix"

    Write-Warning "[vnr-specify] Branch name exceeded GitHub's 244-byte limit"
    Write-Warning "[vnr-specify] Original: $originalBranchName ($($originalBranchName.Length) bytes)"
    Write-Warning "[vnr-specify] Truncated to: $branchName ($($branchName.Length) bytes)"
}

if ($hasGit) {
    $branchCreated = $false
    try {
        git checkout -q -b $branchName 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $branchCreated = $true
        }
    }
    catch {
        # swallow and handle below
    }

    if (-not $branchCreated) {
        $existingBranch = git branch --list $branchName 2>$null
        if ($existingBranch) {
            if ($AllowExistingBranch) {
                git checkout -q $branchName 2>$null | Out-Null
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "Error: Branch '$branchName' exists but could not be checked out. Resolve any uncommitted changes or conflicts and try again."
                    exit 1
                }
            }
            elseif ($Timestamp) {
                Write-Error "Error: Branch '$branchName' already exists. Rerun to get a new timestamp or use a different -ShortName."
                exit 1
            }
            else {
                Write-Error "Error: Branch '$branchName' already exists. Please use a different feature name or specify a different number with -Number."
                exit 1
            }
        }
        else {
            Write-Error "Error: Failed to create git branch '$branchName'. Please check your git configuration and try again."
            exit 1
        }
    }
}
else {
    Write-Warning "[vnr-specify] Warning: Git repository not detected; skipped branch creation for $branchName"
}

$featureDir = Join-Path $specsDir $branchName
New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

# The canonical input is a BA-provided User Story file (<US-ID>_<slug>.md).
# This script is a fallback for developers prototyping before BA output exists:
# it creates a stub based on userstory-template.md, using the branch name as the US-ID.
# If a BA User Story file already exists in $featureDir, skip stub creation.
$baFile = Get-ChildItem -LiteralPath $featureDir -Filter '*.md' -File -ErrorAction SilentlyContinue |
    Where-Object {
        ($_.Name -notmatch '_ui-detail\.md$') -and
        (@('plan.md','tasks.md','research.md','data-model.md','quickstart.md','spec.md') -notcontains $_.Name.ToLowerInvariant())
    } |
    Select-Object -First 1

if ($baFile) {
    $specFile = $baFile.FullName
}
else {
    $specFile = Join-Path $featureDir ("{0}.md" -f $branchName)
    if (-not (Test-Path -PathType Leaf $specFile)) {
        $template = $null

        try {
            $template = Resolve-Template -TemplateName 'userstory-template' -PluginDir $pluginDir
        }
        catch {
            $template = $null
        }

        if (-not $template) {
            $template = Join-Path $pluginDir 'templates/userstory-template.md'
        }

        if ($template -and (Test-Path $template)) {
            Copy-Item $template $specFile -Force
        }
        else {
            New-Item -ItemType File -Path $specFile | Out-Null
        }
    }
}

# Set environment variables for current session
$env:VNR_FEATURE = $branchName
$env:SPECIFY_FEATURE = $branchName

if ($Json) {
    $obj = [PSCustomObject]@{
        BRANCH_NAME = $branchName
        USER_STORY  = $specFile
        SPEC_FILE   = $specFile   # alias kept for backwards compatibility
        FEATURE_DIR = $featureDir
        FEATURE_NUM = $featureNum
        HAS_GIT     = $hasGit
    }
    $obj | ConvertTo-Json -Compress
}
else {
    Write-Output "BRANCH_NAME: $branchName"
    Write-Output "USER_STORY: $specFile"
    Write-Output "SPEC_FILE: $specFile"
    Write-Output "FEATURE_DIR: $featureDir"
    Write-Output "FEATURE_NUM: $featureNum"
    Write-Output "HAS_GIT: $hasGit"
    Write-Output "VNR_FEATURE environment variable set to: $branchName"
}
