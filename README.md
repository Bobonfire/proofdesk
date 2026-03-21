# ProofDesk

## Start UI (no manual npm commands)

Double-click:

- `Start-ProofDesk.cmd`

This will:
1. Install dependencies once (if missing).
2. Start the local UI server.
3. Open ProofDesk in your browser automatically.

Default URL: `http://127.0.0.1:4173`

Advanced:

- Preflight only (no server):  
  `powershell -ExecutionPolicy Bypass -File .\start-proofdesk.ps1 -CheckOnly`
