#!/usr/bin/env pwsh
# Common PowerShell functions for Vnr plugin

# Resolve the plugin install root (where this plugin's agents/, memory/, templates/,
# scripts/ live). The plugin is installed via Claude Code — not scaffolded into the
# project — so prefer the CLAUDE_PLUGIN_ROOT env var Claude sets for plugin commands;
# fall back to this script's own location (scripts/powershell -> plugin root is two up).
function Get-PluginDir {
    if ($env:CLAUDE_PLUGIN_ROOT) {
        return $env:CLAUDE_PLUGIN_ROOT
    }
    return (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "../..")).Path
}

# Get the target project root (where specs/ and src/ live). Prefer the git toplevel;
# fall back to the current working directory for non-git projects.
function Get-RepoRoot {
    try {
        $result = git rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $result.Trim()
        }
    }
    catch {
        # Git command failed
    }

    # Final fallback for non-git repos: the current working directory
    return (Get-Location).Path
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

function Resolve-UserStoryPath {
    # Resolve the BA User Story file inside a feature folder.
    # Convention: `<US-ID>_<slug>.md` (e.g., SCC-E01-F01-U02_Thiet_Lap_Phan_Tang_Nhan_Tai.md).
    # Fallbacks: any *.md that isn't a generated SWE artifact, then a legacy 'spec.md'.
    param([string]$FeatureDir)

    if (-not (Test-Path -LiteralPath $FeatureDir -PathType Container)) {
        return (Join-Path $FeatureDir 'spec.md')  # legacy fallback
    }

    $reserved = @(
        'plan.md', 'tasks.md', 'research.md', 'data-model.md',
        'quickstart.md', 'spec.md'
    )

    $candidate = Get-ChildItem -LiteralPath $FeatureDir -Filter '*.md' -File -ErrorAction SilentlyContinue |
        Where-Object {
            ($_.Name -notmatch '_ui-detail\.md$') -and
            ($reserved -notcontains $_.Name.ToLowerInvariant())
        } |
        Select-Object -First 1 -ExpandProperty FullName

    if ($candidate) { return $candidate }

    # Legacy fallback so existing features keep working
    return (Join-Path $FeatureDir 'spec.md')
}

function Resolve-UiDetailPath {
    # BA's `<US-ID>_*_ui-detail.md` takes precedence; fall back to SWE-generated 'ui-detail.md'.
    param([string]$FeatureDir)

    if (-not (Test-Path -LiteralPath $FeatureDir -PathType Container)) {
        return (Join-Path $FeatureDir 'ui-detail.md')
    }

    $baUiDetail = Get-ChildItem -LiteralPath $FeatureDir -Filter '*_ui-detail.md' -File -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
    if ($baUiDetail) { return $baUiDetail }

    return (Join-Path $FeatureDir 'ui-detail.md')
}

function Get-FeaturePathsEnv {
    $repoRoot = Get-RepoRoot
    $currentBranch = Get-CurrentBranch
    $hasGit = Test-HasGit
    $featureDir = Get-FeatureDir -RepoRoot $repoRoot -Branch $currentBranch
    $userStory = Resolve-UserStoryPath -FeatureDir $featureDir
    $uiDetail  = Resolve-UiDetailPath  -FeatureDir $featureDir

    [PSCustomObject]@{
        REPO_ROOT      = $repoRoot
        PLUGIN_DIR     = Get-PluginDir
        CURRENT_BRANCH = $currentBranch
        HAS_GIT        = $hasGit
        FEATURE_DIR    = $featureDir
        USER_STORY     = $userStory
        UI_DETAIL      = $uiDetail
        # FEATURE_SPEC kept as alias of USER_STORY for backwards compatibility
        # with skills/scripts that still reference the old name.
        FEATURE_SPEC   = $userStory
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

# Resolve a template name to a file path using the priority stack (all under the plugin root):
#   1. templates/overrides/
#   2. presets/<preset-id>/templates/ (sorted by priority from .registry)
#   3. extensions/<ext-id>/templates/
#   4. templates/ (core)
function Resolve-Template {
    param(
        [Parameter(Mandatory = $true)][string]$TemplateName,
        [Parameter(Mandatory = $true)][string]$PluginDir
    )

    $pluginDir = $PluginDir
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
