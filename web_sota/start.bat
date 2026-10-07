@echo off
setlocal
REM Fleet launcher: web_sota mirror of ..\start.ps1
set "HERE=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%HERE%start.ps1" %*
if errorlevel 1 (
  echo.
  echo [start.bat] exited with error - window held open, instacrash guard
  pause
  exit /b 1
)
endlocal
exit /b 0
