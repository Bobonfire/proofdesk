@echo off
setlocal

set PORT=4173
set FOUND=0

for /f "tokens=5" %%p in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
  set FOUND=1
  echo ProofDesk stoppen op PID %%p ...
  taskkill /PID %%p /F >nul 2>&1
)

if %FOUND%==0 (
  echo Geen ProofDesk server gevonden op poort %PORT%.
) else (
  echo ProofDesk server gestopt.
)

pause
endlocal
