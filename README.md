# Install `vnr-swe`

## Requirements

- Node.js `>= 18.18.0` [[12]]
- `claude` CLI available in `PATH`

> `vnr-bootstrap` adds the `vnr-ai` marketplace and installs the `vnr-swe` plugin through Claude Code. It does **not** copy any files into your project — the plugin runs from Claude's plugin store.

## PowerShell

### Install
``` powershell
npx github:cuonglexuan-vnr/vnr-plugins init vnr-swe
```

### Install from the current project folder
```powershell
powershell -ExecutionPolicy Bypass -File "\\company-pc\tools\vnr-plugins\install-vnr-swe.ps1"
```

### Install to a specific project folder
```powershell
powershell -ExecutionPolicy Bypass -File "\\company-pc\tools\vnr-plugins\install-vnr-swe.ps1" -ProjectDir "C:\work\my-project"
```

## CMD

### Install from the current project folder
```bat
\\company-pc\tools\vnr-plugins\install-vnr-swe.cmd
```

### Install to a specific project folder
```bat
\\company-pc\tools\vnr-plugins\install-vnr-swe.cmd "C:\work\my-project"
```

## Options

The bootstrap supports `--scope <project|user>`, `--refresh-marketplace`, and `--help`. The default scope is `project`.

| Purpose | PowerShell | CMD | Effect |
|---|---|---|---|
| Install to project scope | `-Scope project` | `--scope project` | Install plugin for the current project  |
| Install to user scope | `-Scope user` | `--scope user` | Install plugin for the current user  |
| Refresh marketplace cache | `-RefreshMarketplace` | `--refresh-marketplace` | Remove cached marketplace and re-add it  |
| Show bootstrap help | *(run bootstrap directly)* | `--help` | Show bootstrap help  |

## Examples

### PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File "\\company-pc\tools\vnr-plugins\install-vnr-swe.ps1" -ProjectDir "C:\work\my-project"
```

```powershell
powershell -ExecutionPolicy Bypass -File "\\company-pc\tools\vnr-plugins\install-vnr-swe.ps1" -Scope user
```

### CMD
```bat
\\company-pc\tools\vnr-plugins\install-vnr-swe.cmd "C:\work\my-project"
```

```bat
\\company-pc\tools\vnr-plugins\install-vnr-swe.cmd "C:\work\my-project" --scope user
```

## Publishing to the VNR registry

DevHub distributes this marketplace as one zip on the VNR artifact registry, so teammates without access to
this TFS repository still get it. Publish after merging changes to plugins or `.claude-plugin/marketplace.json`.

Requirements: Node.js 18 or newer, and a registry API token with `repository:write` on the `vnr-ai` repository.

```powershell
npm install
$env:AK_TOKEN = '<registry token>'
npm run publish:registry
```

```bash
npm install
AK_TOKEN='<registry token>' npm run publish:registry
```

The script zips only `.claude-plugin/`, `plugins/` and `README.md` (flat, at the zip root) and uploads it to:

```text
https://registry.vnresource.net/api/v1/repositories/vnr-ai/download/marketplace.zip
```

DevHub picks the new version up on the next **Sync** in Settings › Marketplaces. Optional overrides:
`AK_REPO_BASE` (another repository) and `AK_ARTIFACT` (another file name). Run `npm test` to check the zip builder.
