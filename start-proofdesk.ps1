param(
  [int]$Port = 4173,
  [switch]$NoBrowser,
  [switch]$CheckOnly
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

$url = "http://127.0.0.1:$Port"
Write-Host "Starting ProofDesk on $url"

$devProcess = Start-Process `
  -FilePath "npm" `
  -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "$Port") `
  -WorkingDirectory $root `
  -PassThru

$ready = $false
for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Seconds 1
  try {
    Invoke-WebRequest -Uri $url -UseBasicParsing -Method Head -TimeoutSec 2 | Out-Null
    $ready = $true
    break
  } catch {
  }
}

if (-not $NoBrowser) {
  Start-Process $url | Out-Null
}

if ($ready) {
  Write-Host "ProofDesk is running. Close this window to stop the server."
} else {
  Write-Host "Server started, but readiness check did not complete in time."
  Write-Host "Open manually: $url"
}

Wait-Process -Id $devProcess.Id
