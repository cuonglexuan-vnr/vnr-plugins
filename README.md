# Install `vnr-speckit`

## Requirements

- Node.js `>= 18.18.0` [[12]]
- `claude` CLI available in `PATH` 

> `vnr-bootstrap` scaffolds into the current Git repo root, or the current working directory if you are not in a Git repo. Run the installer from your project folder, or pass the project folder explicitly. 

## PowerShell

### Install
``` powershell
npx github:cuonglexuan-vnr/vnr-plugins init vnr-speckit
```

### Install from the current project folder
```powershell
powershell -ExecutionPolicy Bypass -File "\\company-pc\tools\vnr-plugins\install-vnr-speckit.ps1"
```

### Install to a specific project folder
```powershell
powershell -ExecutionPolicy Bypass -File "\\company-pc\tools\vnr-plugins\install-vnr-speckit.ps1" -ProjectDir "C:\work\my-project"
```

## CMD

### Install from the current project folder
```bat
\\company-pc\tools\vnr-plugins\install-vnr-speckit.cmd
```

### Install to a specific project folder
```bat
\\company-pc\tools\vnr-plugins\install-vnr-speckit.cmd "C:\work\my-project"
```

## Options

The bootstrap supports `--scope <project|user>`, `--force`, `--no-scaffold`, `--refresh-marketplace`, and `--help`. The default scope is `project`. 

| Purpose | PowerShell | CMD | Effect |
|---|---|---|---|
| Install to project scope | `-Scope project` | `--scope project` | Install plugin for the current project  |
| Install to user scope | `-Scope user` | `--scope user` | Install plugin for the current user  |
| Overwrite existing scaffold | `-Force` | `--force` | Replace existing `vnr-speckit` folder  |
| Install only, no scaffold | `-NoScaffold` | `--no-scaffold` | Skip creating the local project folder  |
| Refresh marketplace cache | `-RefreshMarketplace` | `--refresh-marketplace` | Remove cached marketplace and re-add it  |
| Show bootstrap help | *(run bootstrap directly)* | `--help` | Show bootstrap help  |

## Examples

### PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File "\\company-pc\tools\vnr-plugins\install-vnr-speckit.ps1" -ProjectDir "C:\work\my-project" -Force
```

```powershell
powershell -ExecutionPolicy Bypass -File "\\company-pc\tools\vnr-plugins\install-vnr-speckit.ps1" -ProjectDir "C:\work\my-project" -Scope user -NoScaffold
```

### CMD
```bat
\\company-pc\tools\vnr-plugins\install-vnr-speckit.cmd "C:\work\my-project" --force
```

```bat
\\company-pc\tools\vnr-plugins\install-vnr-speckit.cmd "C:\work\my-project" --scope user --no-scaffold
```