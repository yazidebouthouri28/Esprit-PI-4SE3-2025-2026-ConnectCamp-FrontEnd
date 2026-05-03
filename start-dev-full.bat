@echo off
chcp 65001 >nul
setlocal EnableExtensions
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo.
echo === CampConnect : demarrage ML (5001^), Spring (8089^), Angular (4200^) ===
echo Racine : "%ROOT%"
echo.

if not exist "%ROOT%\INTEGRATION\python_scripts\predict.py" (
  echo [ERREUR] predict.py introuvable.
  pause
  exit /b 1
)
if not exist "%ROOT%\INTEGRATION\mvnw.cmd" (
  echo [ERREUR] mvnw.cmd introuvable dans INTEGRATION.
  pause
  exit /b 1
)
if not exist "%ROOT%\INTEGRATION FRONT\package.json" (
  echo [ERREUR] package.json introuvable dans INTEGRATION FRONT.
  pause
  exit /b 1
)

rem /D = repertoire de travail (chemins avec espaces pris en charge)
start "CampConnect ML 5001" /D "%ROOT%\INTEGRATION\python_scripts" cmd /k python predict.py
timeout /t 2 /nobreak >nul
start "CampConnect Spring 8089" /D "%ROOT%\INTEGRATION" cmd /k call mvnw.cmd spring-boot:run -DskipTests
timeout /t 2 /nobreak >nul
start "CampConnect Angular 4200" /D "%ROOT%\INTEGRATION FRONT" cmd /k npm start

echo Trois fenetres ont ete ouvertes.
echo   - API ML     : http://127.0.0.1:5001/health
echo   - Backend    : http://localhost:8089
echo   - Frontend   : http://localhost:4200
echo   - Fraude     : http://localhost:4200/fraud-detection
echo.
pause
