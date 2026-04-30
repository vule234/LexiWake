param(
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

$adbPath = Join-Path $ldplayerHome 'adb.exe'

if (-not (Test-Path $adbPath)) {
  throw "Khong tim thay adb cua LDPlayer tai: $adbPath"
}

$env:ANDROID_HOME = $ldplayerHome
$env:ANDROID_SDK_ROOT = $ldplayerHome

if (-not (($env:Path -split ';') -contains $ldplayerHome)) {
  $env:Path = "$ldplayerHome;$env:Path"
}

Write-Host "ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "ANDROID_SDK_ROOT=$env:ANDROID_SDK_ROOT"
Write-Host "Kiem tra adb..."
& $adbPath kill-server | Out-Null
Start-Sleep -Seconds 1
& $adbPath start-server | Out-Null
& $adbPath devices

$expoGoInstalled = & $adbPath shell pm list packages host.exp.exponent
if (-not $expoGoInstalled) {
  Write-Warning "Chua thay Expo Go trong LDPlayer. Hay cai Expo Go truoc."
}

Write-Host "Khoi dong Expo cho LDPlayer..."
Write-Host "Sau khi Metro hien exp://..., mo script open-ldplayer-expo.ps1 voi URL do."
npx expo start
