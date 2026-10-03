<#
.SYNOPSIS
  Instala o actualiza LearnAI en este PC y lo deja corriendo en
  http://localhost:<Port>, con Claude Code local (Claude Agent SDK) como IA.

.DESCRIPTION
  1. Verifica Node, Git y Claude Code (instala Claude Code e inicia sesion si falta).
  2. Detiene la version en ejecucion, trae lo ultimo de git, instala y compila.
  3. Arranca el servidor en segundo plano y lo registra para iniciarse al entrar a Windows.
  4. Hace una llamada real a la IA para confirmar que Claude Code responde.

  Ejecutalo desde la carpeta del proyecto:
    powershell -ExecutionPolicy Bypass -File scripts\windows\deploy.ps1

.PARAMETER Port
  Puerto local. Por defecto 3000.
.PARAMETER NoAutostart
  No iniciar LearnAI automaticamente al entrar a Windows (y quitarlo si estaba).
.PARAMETER SkipPull
  No actualizar desde git.
#>
param(
  [int]$Port = 3000,
  [switch]$NoAutostart,
  [switch]$SkipPull
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $Root

function Step([string]$m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok([string]$m) { Write-Host "  [OK] $m" -ForegroundColor Green }
function Warn([string]$m) { Write-Host "  [!] $m" -ForegroundColor Yellow }
function Fail([string]$m) {
  Write-Host "  [ERROR] $m" -ForegroundColor Red
  exit 1
}

# Ejecuta un comando externo y corta el despliegue si falla.
function Invoke-Native([string]$Exe, [string[]]$ArgList) {
  & $Exe @ArgList
  if ($LASTEXITCODE -ne 0) { Fail "Fallo: $Exe $($ArgList -join ' ') (codigo $LASTEXITCODE)" }
}

function Test-ClaudeLogin {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $out = (& claude auth status 2>$null) -join "`n"
    return (($out | ConvertFrom-Json).loggedIn -eq $true)
  } catch {
    return $false
  } finally {
    $ErrorActionPreference = $prev
  }
}

# ---------------------------------------------------------------- requisitos
Step 'Verificando requisitos'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Fail 'No encuentro Node.js. Instalalo con: winget install OpenJS.NodeJS.LTS  (luego abre una terminal nueva).'
}
$nodeVersion = (& node -v).Trim()
if ([int]($nodeVersion.TrimStart('v').Split('.')[0]) -lt 20) { Fail "Node $nodeVersion es muy antiguo; necesitas 20 o superior." }
Ok "Node $nodeVersion"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail 'No encuentro Git. Instalalo con: winget install Git.Git' }
Ok 'Git'

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  Warn 'No encuentro Claude Code; lo instalo con npm.'
  Invoke-Native 'npm.cmd' @('install', '-g', '@anthropic-ai/claude-code')
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')
  if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { Fail 'Instale Claude Code pero no aparece en el PATH. Abre una terminal nueva y vuelve a ejecutar este script.' }
}
Ok 'Claude Code instalado'

if (-not (Test-ClaudeLogin)) {
  Warn 'Claude Code no tiene sesion iniciada. Se abrira el navegador para que entres con tu cuenta de Claude.'
  & claude auth login
  if (-not (Test-ClaudeLogin)) { Fail 'Sigue sin sesion en Claude Code. Ejecuta "claude auth login" y vuelve a intentar.' }
}
Ok 'Claude Code con sesion iniciada (la app usara esta cuenta)'

# ------------------------------------------------------------- actualizar
Step 'Deteniendo la version en ejecucion (si hay una)'
& (Join-Path $PSScriptRoot 'stop.ps1') -Port $Port

if (-not $SkipPull) {
  Step 'Actualizando desde git'
  Invoke-Native 'git' @('pull', '--ff-only')
}

Step 'Instalando dependencias'
Invoke-Native 'npm.cmd' @('ci', '--no-audit', '--no-fund')

if (-not (Test-Path '.env.local')) {
  Copy-Item '.env.example' '.env.local'
  Ok 'Creado .env.local (AI_PROVIDER=claude-code)'
} else {
  Ok '.env.local ya existe (no lo modifique)'
}

Step 'Compilando (modo produccion)'
Invoke-Native 'npm.cmd' @('run', 'build')

# ------------------------------------------------------------- arrancar
Step 'Iniciando LearnAI'
& (Join-Path $PSScriptRoot 'start.ps1') -Port $Port

$url = "http://localhost:$Port"
$up = $false
for ($i = 0; $i -lt 60 -and -not $up; $i++) {
  Start-Sleep -Seconds 1
  try {
    Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 | Out-Null
    $up = $true
  } catch { }
}
if (-not $up) { Fail "El servidor no respondio en $url. Revisa logs\server-error.log" }
Ok "Servidor arriba en $url"

$lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'LearnAI.lnk'
if ($NoAutostart) {
  if (Test-Path $lnk) { Remove-Item $lnk; Ok 'Inicio automatico desactivado' }
} else {
  $shell = New-Object -ComObject WScript.Shell
  $sc = $shell.CreateShortcut($lnk)
  $sc.TargetPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
  $sc.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$(Join-Path $PSScriptRoot 'start.ps1')`" -Port $Port"
  $sc.WorkingDirectory = $Root
  $sc.WindowStyle = 7
  $sc.Description = 'Inicia LearnAI en segundo plano'
  $sc.Save()
  Ok 'LearnAI se iniciara solo cada vez que entres a Windows'
}

# ------------------------------------------------------------- prueba real
Step 'Probando la IA a traves de Claude Code (puede tardar unos segundos)'
$body = @{
  level    = 'B1'
  question = 'Traduce: Ella compra fruta.'
  expected = 'She buys fruit.'
  answer   = 'She buy fruit'
} | ConvertTo-Json
try {
  $res = Invoke-RestMethod -Uri "$url/api/grade" -Method Post `
    -ContentType 'application/json; charset=utf-8' `
    -Body ([Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 180
  Ok "La IA respondio: $($res.feedback_es)"
} catch {
  $detail = $_.ErrorDetails.Message
  if (-not $detail) { $detail = $_.Exception.Message }
  Warn "La IA no respondio: $detail"
  Warn 'La app funciona, pero las funciones de IA fallaran. Ultimas lineas de logs\server-error.log:'
  $errLog = Join-Path $Root 'logs\server-error.log'
  if (Test-Path $errLog) { Get-Content $errLog -Tail 15 }
  exit 1
}

Write-Host "`nListo: LearnAI corre en $url" -ForegroundColor Green
Write-Host "  Detener:     powershell -ExecutionPolicy Bypass -File scripts\windows\stop.ps1"
Write-Host "  Actualizar:  vuelve a ejecutar este script"
Start-Process $url
