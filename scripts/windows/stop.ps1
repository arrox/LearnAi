<#
.SYNOPSIS
  Detiene LearnAI. Con -RemoveAutostart tambien quita el inicio automatico.
#>
param(
  [int]$Port = 3000,
  [switch]$RemoveAutostart
)

$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$PidFile = Join-Path $Root 'logs\server.pid'
$stopped = $false

if (Test-Path $PidFile) {
  $savedPid = [int](Get-Content $PidFile -Raw)
  $p = Get-Process -Id $savedPid -ErrorAction SilentlyContinue
  if ($p -and $p.ProcessName -eq 'node') {
    Stop-Process -Id $savedPid -Force
    $stopped = $true
  }
  Remove-Item $PidFile -ErrorAction SilentlyContinue
}

# Por si el PID guardado no coincide: cualquier node escuchando en el puerto.
$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
foreach ($l in $listeners) {
  $p = Get-Process -Id $l.OwningProcess -ErrorAction SilentlyContinue
  if ($p -and $p.ProcessName -eq 'node') {
    Stop-Process -Id $p.Id -Force
    $stopped = $true
  }
}

if ($stopped) { Write-Host 'LearnAI detenido.' } else { Write-Host 'LearnAI no estaba corriendo.' }

if ($RemoveAutostart) {
  $lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'LearnAI.lnk'
  if (Test-Path $lnk) {
    Remove-Item $lnk
    Write-Host 'Inicio automatico eliminado.'
  }
}
