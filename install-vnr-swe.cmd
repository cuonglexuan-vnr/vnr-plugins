@echo off
setlocal EnableExtensions

set "SCRIPT_DIR=%~dp0"
set "BOOTSTRAP=%SCRIPT_DIR%bin\vnr-bootstrap.mjs"
set "PLUGIN_ID=vnr-swe"
set "PROJECT_DIR=%CD%"

if not exist "%BOOTSTRAP%" (
  echo [ERROR] Cannot find bootstrap script:
  echo         %BOOTSTRAP%
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is required and must be in PATH.
  echo         Required version: >= 18.18.0
  exit /b 1
)

where claude >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Claude CLI is required and must be in PATH.
  exit /b 1
)

rem Optional first argument = target project directory
if not "%~1"=="" (
  set "FIRST_ARG=%~1"
  if not "%FIRST_ARG:~0,2%"=="--" (
    if exist "%~1\" (
      set "PROJECT_DIR=%~1"
      shift
    ) else (
      echo [ERROR] Project directory does not exist:
      echo         %~1
      echo.
      echo Usage:
      echo   install-vnr-swe.cmd
      echo   install-vnr-swe.cmd "C:\path\to\project"
      echo   install-vnr-swe.cmd --scope user
      exit /b 1
    )
  )
)

echo [INFO] Project directory: %PROJECT_DIR%
echo [INFO] Installing plugin: %PLUGIN_ID%
echo.

pushd "%PROJECT_DIR%" >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Cannot enter project directory:
  echo         %PROJECT_DIR%
  exit /b 1
)

node "%BOOTSTRAP%" init "%PLUGIN_ID%" %*
set "EXIT_CODE=%ERRORLEVEL%"

popd >nul 2>nul

exit /b %EXIT_CODE%
