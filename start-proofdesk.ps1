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

function Wait-ForUrl {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$Retries = 25
  )

  for ($i = 0; $i -lt $Retries; $i++) {
    try {
      Invoke-WebRequest -Uri $Url -UseBasicParsing -Method Head -TimeoutSec 2 | Out-Null
      return $true
    } catch {
      Start-Sleep -Milliseconds 700
    }
  }

  return $false
}

if (-not (Test-Path (Join-Path $root "node_modules"))) {
  Write-Host "Installing dependencies (one-time)..."
  npm install
}

if ($CheckOnly) {
  Write-Host "ProofDesk preflight check passed."
  exit 0
}

$url = "http://127.0.0.1:$Port"

if (Wait-ForUrl -Url $url -Retries 2) {
  Start-Process $url | Out-Null
  Write-Host "ProofDesk draait al. Browser geopend op $url"
  exit 0
}

$devCommand = "Set-Location '$root'; npm run dev -w @proofdesk/ui -- --host 127.0.0.1 --port $Port --strictPort"

if ($Detach) {
  $proc = Start-Process `
    -FilePath "powershell" `
    -ArgumentList @(
      "-NoExit",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      $devCommand
    ) `
    -PassThru

  if (Wait-ForUrl -Url $url) {
    Start-Process $url | Out-Null
    Write-Host "ProofDesk gestart en browser geopend op $url"
  } else {
    Start-Process $url | Out-Null
    Write-Host "Servervenster gestart (PID $($proc.Id)). Browser geopend op $url."
    Write-Host "Als de pagina nog leeg is: wacht 5 seconden en ververs 1x."
  }
  exit 0
}

Invoke-Expression "$devCommand --open"
