#!/usr/bin/env pwsh
# Các hàm PowerShell dùng chung cho plugin Vnr

# Xác định gốc cài đặt của plugin (nơi chứa agents/, memory/, templates/,
# scripts/ của plugin). Plugin được cài qua Claude Code, không được scaffold vào
# project, nên ưu tiên biến môi trường CLAUDE_PLUGIN_ROOT do Claude đặt cho các lệnh của plugin;
# nếu không có thì dựa vào vị trí của chính script này (scripts/powershell -> gốc plugin cách hai cấp).
function Get-PluginDir {
    if ($env:CLAUDE_PLUGIN_ROOT) {
        return $env:CLAUDE_PLUGIN_ROOT
    }
    return (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "../..")).Path
}

# Lấy gốc dự án đích (nơi chứa specs/ và src/). Ưu tiên git toplevel;
# dự án không dùng git thì quay về thư mục làm việc hiện tại.
function Get-RepoRoot {
    try {
        $result = git rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $result.Trim()
        }
    }
    catch {
        # Lệnh git thất bại
    }

    # Phương án cuối cho repo không dùng git: thư mục làm việc hiện tại
    return (Get-Location).Path
}

function Get-CurrentBranch {
    # Kiểm tra biến môi trường VNR_FEATURE trước
    if ($env:VNR_FEATURE) {
        return $env:VNR_FEATURE
    }

    # Phương án dự phòng tương thích ngược
    if ($env:SPECIFY_FEATURE) {
        return $env:SPECIFY_FEATURE
    }

    # Sau đó kiểm tra git nếu có tại gốc Vnr (không xét thư mục cha)
    $repoRoot = Get-RepoRoot
    if (Test-HasGit) {
        try {
            $result = git -C $repoRoot rev-parse --abbrev-ref HEAD 2>$null
            if ($LASTEXITCODE -eq 0) {
                return $result.Trim()
            }
        }
        catch {
            # Lệnh git thất bại
        }
    }

    # Với repo không dùng git, thử tìm thư mục feature mới nhất
    $specsDir = Join-Path $repoRoot "specs"

    if (Test-Path $specsDir) {
        $latestFeature = ""
        $highest = 0
        $latestTimestamp = ""

        Get-ChildItem -Path $specsDir -Directory | ForEach-Object {
            if ($_.Name -match '^(\d{8}-\d{6})-') {
                # Nhánh theo timestamp: so sánh theo thứ tự từ điển
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
                    # Chỉ cập nhật nếu chưa tìm thấy nhánh timestamp nào
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

    # Phương án cuối
    return "main"
}

# Kiểm tra git có dùng được ở cấp gốc Vnr không
# Chỉ trả về true khi git đã cài và gốc repo nằm trong một git work tree
# Xử lý cả repo thường (thư mục .git) lẫn worktree/submodule (tệp .git)
function Test-HasGit {
    # Trước hết kiểm tra lệnh git có sẵn không
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        return $false
    }

    $repoRoot = Get-RepoRoot

    # Kiểm tra .git có tồn tại không (thư mục, hoặc tệp với worktree/submodule)
    if (-not (Test-Path -LiteralPath (Join-Path $repoRoot ".git"))) {
        return $false
    }

    # Xác minh đó đúng là một git work tree hợp lệ
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

    # Với repo không dùng git, không thể ép quy tắc đặt tên nhánh nhưng vẫn xuất kết quả
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
    # Xác định tệp User Story của BA trong thư mục feature.
    # Quy ước: `<US-ID>_<slug>.md` (ví dụ SCC-E01-F01-U02_Thiet_Lap_Phan_Tang_Nhan_Tai.md).
    # Dự phòng: mọi *.md không phải artifact do SWE sinh ra, sau đó là 'spec.md' kiểu cũ.
    param([string]$FeatureDir)

    if (-not (Test-Path -LiteralPath $FeatureDir -PathType Container)) {
        return (Join-Path $FeatureDir 'spec.md')  # dự phòng kiểu cũ
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

    # Dự phòng kiểu cũ để các feature hiện có vẫn chạy được
    return (Join-Path $FeatureDir 'spec.md')
}

function Resolve-UiDetailPath {
    # `<US-ID>_*_ui-detail.md` của BA được ưu tiên; không có thì dùng 'ui-detail.md' do SWE sinh ra.
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
        # FEATURE_SPEC giữ lại làm alias của USER_STORY để tương thích ngược
        # với các skill/script vẫn còn dùng tên cũ.
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

# Xác định một tên template thành đường dẫn tệp theo ngăn xếp ưu tiên (đều nằm dưới gốc plugin):
#   1. templates/overrides/
#   2. presets/<preset-id>/templates/ (sắp theo mức ưu tiên từ .registry)
#   3. extensions/<ext-id>/templates/
#   4. templates/ (lõi)
function Resolve-Template {
    param(
        [Parameter(Mandatory = $true)][string]$TemplateName,
        [Parameter(Mandatory = $true)][string]$PluginDir
    )

    $pluginDir = $PluginDir
    $base = Join-Path $pluginDir 'templates'

    # Ưu tiên 1: ghi đè theo dự án
    $override = Join-Path $base "overrides/$TemplateName.md"
    if (Test-Path -LiteralPath $override) {
        return $override
    }

    # Ưu tiên 2: các preset đã cài (sắp theo mức ưu tiên từ .registry)
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
                # Dự phòng: theo thứ tự thư mục bảng chữ cái
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

    # Ưu tiên 3: template do extension cung cấp
    $extDir = Join-Path $pluginDir 'extensions'
    if (Test-Path -LiteralPath $extDir) {
        foreach ($ext in Get-ChildItem -LiteralPath $extDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '.*' } | Sort-Object Name) {
            $candidate = Join-Path $ext.FullName "templates/$TemplateName.md"
            if (Test-Path -LiteralPath $candidate) {
                return $candidate
            }
        }
    }

    # Ưu tiên 4: template lõi
    $core = Join-Path $base "$TemplateName.md"
    if (Test-Path -LiteralPath $core) {
        return $core
    }

    return $null
}
