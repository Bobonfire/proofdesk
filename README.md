# ProofDesk

## Start UI (no manual npm commands)

Double-click:

- `Start-ProofDesk.cmd`

This will:
1. Install dependencies once (if missing).
2. Open a visible server window (with live logs).
3. Open ProofDesk in your browser automatically.
4. If needed: wait 5 seconds and refresh once.

Default URL: `http://127.0.0.1:4173`

To stop the local server, double-click:

- `Stop-ProofDesk.cmd`

Advanced:

- Preflight only (no server):  
  `powershell -ExecutionPolicy Bypass -File .\start-proofdesk.ps1 -CheckOnly`

If no browser appears, keep the server window open and share its last error line.
