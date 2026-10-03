<#
.SYNOPSIS
  Arranca LearnAI en segundo plano (modo produccion) en http://localhost:<Port>.
  Lo usa deploy.ps1 y el acceso directo de inicio automatico.
#>
param([int]$Port = 3000)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$LogDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
  Write-Host "Ya hay un servidor escuchando en el puerto $Port; no inicio otro."
  exit 0
}

$NextBin = Join-Path $Root 'node_modules\next\dist\bin\next'
if (-not (Test-Path $NextBin)) {
  Write-Host "No encuentro $NextBin. Ejecuta primero scripts\windows\deploy.ps1." -ForegroundColor Red
  exit 1
}

# Solo localhost: la app no tiene login y usa tu cuenta de Claude Code.
$proc = Start-Process -FilePath 'node' `
  -ArgumentList @("`"$NextBin`"", 'start', '-H', '127.0.0.1', '-p', "$Port") `
  -WorkingDirectory $Root `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $LogDir 'server.log') `
  -RedirectStandardError (Join-Path $LogDir 'server-error.log') `
  -PassThru

Set-Content -Path (Join-Path $LogDir 'server.pid') -Value $proc.Id
Write-Host "LearnAI iniciado (PID $($proc.Id)) en http://localhost:$Port"
