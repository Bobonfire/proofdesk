param(
  [int]$Port = 4173,
  [switch]$CheckOnly,
  [switch]$Detach
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSCommandPath
Set-Location $root

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' is not available in PATH."
  }
}

Require-Command "node"
Require-Command "npm"

if (-not (Test-Path (Join-Path $root "node_modules"))) {
  Write-Host "Installing dependencies (one-time)..."
  npm install
}

if ($CheckOnly) {
  Write-Host "ProofDesk preflight check passed."
  exit 0
}

$devCommand = "Set-Location '$root'; npm run dev -w @proofdesk/ui -- --host localhost --port $Port --strictPort --open"

if ($Detach) {
  Start-Process `
    -FilePath "powershell" `
    -ArgumentList @(
      "-NoExit",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      $devCommand
    ) | Out-Null

  Write-Host "ProofDesk server window gestart. Browser wordt automatisch geopend."
  exit 0
}

Invoke-Expression $devCommand
