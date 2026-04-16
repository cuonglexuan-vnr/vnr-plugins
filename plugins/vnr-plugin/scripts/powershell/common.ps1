#!/usr/bin/env pwsh
# Common PowerShell functions for Vnr plugin

# Find repository root by searching upward for vnr-plugin directory
# This is the primary marker for Vnr plugin projects
function Find-VnrRoot {
    param([string]$StartDir = (Get-Location).Path)

    # Normalize to absolute path to prevent issues with relative paths
    # Use -LiteralPath to handle paths with wildcard characters ([, ], *, ?)
    $resolved = Resolve-Path -LiteralPath $StartDir -ErrorAction SilentlyContinue
    $current = if ($resolved) { $resolved.Path } else { $null }
    if (-not $current) { return $null }

    while ($true) {
        if (Test-Path -LiteralPath (Join-Path $current "vnr-plugin") -PathType Container) {
            return $current
        }

        $parent = Split-Path $current -Parent
        if ([string]::IsNullOrEmpty($parent) -or $parent -eq $current) {
            return $null
        }

        $current = $parent
    }
}

# Get repository root, prioritizing vnr-plugin directory over git
# This prevents using a parent git repo when Vnr plugin is initialized in a subdirectory
function Get-RepoRoot {
    # First, look for vnr-plugin directory (Vnr's own marker)
    $vnrRoot = Find-VnrRoot
    if ($vnrRoot) {
        return $vnrRoot
    }

    # Fallback to git if no vnr-plugin found
    try {
        $result = git rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $result.Trim()
        }
    }
    catch {
        # Git command failed
    }

    # Final fallback to script location for non-git repos
    return (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "../../..")).Path
}

function Get-CurrentBranch {
    # First check VNR_FEATURE environment variable
    if ($env:VNR_FEATURE) {
        return $env:VNR_FEATURE
    }

    # Backward-compatible fallback
    if ($env:SPECIFY_FEATURE) {
        return $env:SPECIFY_FEATURE
    }

    # Then check git if available at the Vnr root (not parent)
    $repoRoot = Get-RepoRoot
    if (Test-HasGit) {
        try {
            $result = git -C $repoRoot rev-parse --abbrev-ref HEAD 2>$null
            if ($LASTEXITCODE -eq 0) {
                return $result.Trim()
            }
        }
        catch {
            # Git command failed
        }
    }

    # For non-git repos, try to find the latest feature directory
    $specsDir = Join-Path $repoRoot "specs"

    if (Test-Path $specsDir) {
        $latestFeature = ""
        $highest = 0
        $latestTimestamp = ""

        Get-ChildItem -Path $specsDir -Directory | ForEach-Object {
            if ($_.Name -match '^(\d{8}-\d{6})-') {
                # Timestamp-based branch: compare lexicographically
                $ts = $matches[1]
                if ($ts -gt $latestTimestamp) {
                    $latestTimestamp = $ts
                    $latestFeature = $_.Name
                }
            }
            elseif ($_.Name -match '^(\d{3,})-') {
                [long]$num = 0
                if ([long]::TryParse($matches[1], [ref]$num) -and $num -gt $highest) {
                    $highest = $num
                    # Only update if no timestamp branch found yet
                    if (-not $latestTimestamp) {
                        $latestFeature = $_.Name
                    }
                }
            }
        }

        if ($latestFeature) {
            return $latestFeature
        }
    }

    # Final fallback
    return "main"
}

# Check if we have git available at the Vnr root level
# Returns true only if git is installed and the repo root is inside a git work tree
# Handles both regular repos (.git directory) and worktrees/submodules (.git file)
function Test-HasGit {
    # First check if git command is available
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        return $false
    }

    $repoRoot = Get-RepoRoot

    # Check if .git exists (directory or file for worktrees/submodules)
    if (-not (Test-Path -LiteralPath (Join-Path $repoRoot ".git"))) {
        return $false
    }

    # Verify it's actually a valid git work tree
    try {
        $null = git -C $repoRoot rev-parse --is-inside-work-tree 2>$null
        return ($LASTEXITCODE -eq 0)
    }
    catch {
        return $false
    }
}

function Test-FeatureBranch {
    param(
        [string]$Branch,
        [bool]$HasGit = $true
    )

    # For non-git repos, we can't enforce branch naming but still provide output
    if (-not $HasGit) {
        Write-Warning "[vnr] Warning: Git repository not detected; skipped branch validation"
        return $true
    }

    if ($Branch -notmatch '^[0-9]{3,}-' -and $Branch -notmatch '^\d{8}-\d{6}-') {
        Write-Output "ERROR: Not on a feature branch. Current branch: $Branch"
        Write-Output "Feature branches should be named like: 001-feature-name or 20260403-021300-feature-name"
        return $false
    }

    return $true
}

function Get-FeatureDir {
    param(
        [string]$RepoRoot,
        [string]$Branch
    )

    return (Join-Path $RepoRoot "specs/$Branch")
}

function Get-FeaturePathsEnv {
    $repoRoot = Get-RepoRoot
    $currentBranch = Get-CurrentBranch
    $hasGit = Test-HasGit
    $featureDir = Get-FeatureDir -RepoRoot $repoRoot -Branch $currentBranch

    [PSCustomObject]@{
        REPO_ROOT      = $repoRoot
        PLUGIN_DIR     = Join-Path $repoRoot 'vnr-plugin'
        CURRENT_BRANCH = $currentBranch
        HAS_GIT        = $hasGit
        FEATURE_DIR    = $featureDir
        FEATURE_SPEC   = Join-Path $featureDir 'spec.md'
        IMPL_PLAN      = Join-Path $featureDir 'plan.md'
        TASKS          = Join-Path $featureDir 'tasks.md'
        RESEARCH       = Join-Path $featureDir 'research.md'
        DATA_MODEL     = Join-Path $featureDir 'data-model.md'
        QUICKSTART     = Join-Path $featureDir 'quickstart.md'
        CONTRACTS_DIR  = Join-Path $featureDir 'contracts'
    }
}

function Test-FileExists {
    param(
        [string]$Path,
        [string]$Description
    )

    if (Test-Path -LiteralPath $Path -PathType Leaf) {
        Write-Output "  ✓ $Description"
        return $true
    }
    else {
        Write-Output "  ✗ $Description"
        return $false
    }
}

function Test-DirHasFiles {
    param(
        [string]$Path,
        [string]$Description
    )

    if ((Test-Path -LiteralPath $Path -PathType Container) -and
        (Get-ChildItem -LiteralPath $Path -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Select-Object -First 1)) {
        Write-Output "  ✓ $Description"
        return $true
    }
    else {
        Write-Output "  ✗ $Description"
        return $false
    }
}

# Resolve a template name to a file path using the priority stack:
#   1. vnr-plugin/templates/overrides/
#   2. vnr-plugin/presets/<preset-id>/templates/ (sorted by priority from .registry)
#   3. vnr-plugin/extensions/<ext-id>/templates/
#   4. vnr-plugin/templates/ (core)
function Resolve-Template {
    param(
        [Parameter(Mandatory = $true)][string]$TemplateName,
        [Parameter(Mandatory = $true)][string]$RepoRoot
    )

    $pluginDir = Join-Path $RepoRoot 'vnr-plugin'
    $base = Join-Path $pluginDir 'templates'

    # Priority 1: Project overrides
    $override = Join-Path $base "overrides/$TemplateName.md"
    if (Test-Path -LiteralPath $override) {
        return $override
    }

    # Priority 2: Installed presets (sorted by priority from .registry)
    $presetsDir = Join-Path $pluginDir 'presets'
    if (Test-Path -LiteralPath $presetsDir) {
        $registryFile = Join-Path $presetsDir '.registry'
        $sortedPresets = @()

        if (Test-Path -LiteralPath $registryFile) {
            try {
                $registryData = Get-Content -LiteralPath $registryFile -Raw | ConvertFrom-Json
                $presets = $registryData.presets
                if ($presets) {
                    $sortedPresets = $presets.PSObject.Properties |
                        Sort-Object { if ($null -ne $_.Value.priority) { $_.Value.priority } else { 10 } } |
                        ForEach-Object { $_.Name }
                }
            }
            catch {
                # Fallback: alphabetical directory order
                $sortedPresets = @()
            }
        }

        if ($sortedPresets.Count -gt 0) {
            foreach ($presetId in $sortedPresets) {
                $candidate = Join-Path $presetsDir "$presetId/templates/$TemplateName.md"
                if (Test-Path -LiteralPath $candidate) {
                    return $candidate
                }
            }
        }
        else {
            foreach ($preset in Get-ChildItem -LiteralPath $presetsDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '.*' }) {
                $candidate = Join-Path $preset.FullName "templates/$TemplateName.md"
                if (Test-Path -LiteralPath $candidate) {
                    return $candidate
                }
            }
        }
    }

    # Priority 3: Extension-provided templates
    $extDir = Join-Path $pluginDir 'extensions'
    if (Test-Path -LiteralPath $extDir) {
        foreach ($ext in Get-ChildItem -LiteralPath $extDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '.*' } | Sort-Object Name) {
            $candidate = Join-Path $ext.FullName "templates/$TemplateName.md"
            if (Test-Path -LiteralPath $candidate) {
                return $candidate
            }
        }
    }

    # Priority 4: Core templates
    $core = Join-Path $base "$TemplateName.md"
    if (Test-Path -LiteralPath $core) {
        return $core
    }

    return $null
}
