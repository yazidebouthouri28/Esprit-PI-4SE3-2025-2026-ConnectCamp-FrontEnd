# Demarre ML (5001), Spring Boot (8089) et Angular (4200) dans trois fenetres CMD.
# Usage : clic droit > Executer avec PowerShell, ou : powershell -ExecutionPolicy Bypass -File .\start-dev-full.ps1

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

$pyScript = Join-Path $Root 'INTEGRATION\python_scripts\predict.py'
$mvnw     = Join-Path $Root 'INTEGRATION\mvnw.cmd'
$frontPkg = Join-Path $Root 'INTEGRATION FRONT\package.json'

foreach ($pair in @(
    @{ Path = $pyScript; Name = 'predict.py' }
    @{ Path = $mvnw; Name = 'mvnw.cmd' }
    @{ Path = $frontPkg; Name = 'package.json (INTEGRATION FRONT)' }
)) {
    if (-not (Test-Path -LiteralPath $pair.Path)) {
        Write-Host "[ERREUR] Fichier introuvable : $($pair.Name) -> $($pair.Path)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n=== CampConnect : ML (5001), Spring (8089), Angular (4200) ===" -ForegroundColor Cyan
Write-Host "Racine : $Root`n"

$cmdPy = "cd /d `"$(Join-Path $Root 'INTEGRATION\python_scripts')`" && python predict.py"
Start-Process cmd.exe -ArgumentList @('/k', $cmdPy) -WindowStyle Normal

Start-Sleep -Seconds 2

$cmdSpring = "cd /d `"$(Join-Path $Root 'INTEGRATION')`" && call mvnw.cmd spring-boot:run -DskipTests"
Start-Process cmd.exe -ArgumentList @('/k', $cmdSpring) -WindowStyle Normal

Start-Sleep -Seconds 2

$cmdNg = "cd /d `"$(Join-Path $Root 'INTEGRATION FRONT')`" && npm start"
Start-Process cmd.exe -ArgumentList @('/k', $cmdNg) -WindowStyle Normal

Write-Host "Trois fenetres CMD ouvertes." -ForegroundColor Green
Write-Host "  API ML   : http://127.0.0.1:5001/health"
Write-Host "  Backend  : http://localhost:8089"
Write-Host "  Frontend : http://localhost:4200"
Write-Host "  Fraude   : http://localhost:4200/fraud-detection`n"
