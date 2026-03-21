@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0start-proofdesk.ps1" -Detach
if errorlevel 1 (
  echo.
  echo ProofDesk kon niet gestart worden.
  echo Stuur deze foutmelding door, dan fix ik hem direct.
  pause
)
endlocal
