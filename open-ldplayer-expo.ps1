param(
  [Parameter(Mandatory = $true)]
  [string]$ExpoUrl,
  [string]$LdplayerHome = $env:LDPLAYER_HOME
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $LdplayerHome) {
  $candidates = @(
    'D:\LDPlayer\LDPlayer9',
    'C:\LDPlayer\LDPlayer9'
  )
  $LdplayerHome = $candidates | Where-Object { Test-Path (Join-Path $_ 'adb.exe') } | Select-Object -First 1
}

if (-not $LdplayerHome) {
  throw 'Khong tim thay LDPlayer. Hay dat bien moi truong LDPLAYER_HOME.'
}

$adbPath = Join-Path $LdplayerHome 'adb.exe'

if (-not (Test-Path $adbPath)) {
  throw "Khong tim thay adb cua LDPlayer tai: $adbPath"
}

& $adbPath kill-server | Out-Null
Start-Sleep -Seconds 1
& $adbPath start-server | Out-Null
Start-Sleep -Seconds 1
& $adbPath devices

Write-Host "Mo Expo Go voi URL: $ExpoUrl"
& $adbPath shell am start -a android.intent.action.VIEW -d $ExpoUrl host.exp.exponent
