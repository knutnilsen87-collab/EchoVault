@echo off
rem ============================================================================
rem  EchoVault - start everything locally (Windows). Double-click to run.
rem  Starts: Postgres + EchoScore (Docker), web app (localhost:3000) and worker.
rem  Safe to run again: steps that are already done are skipped or are no-ops.
rem ============================================================================
setlocal
title EchoVault - starter
cd /d "%~dp0"

echo.
echo  ECHOVAULT  -  lokal oppstart
echo  ---------------------------------------------
echo.

rem ---------- 0. Kjorer den allerede? ----------
where curl >nul 2>nul || goto no_curl
curl -s -f -o nul http://localhost:3000/api/v1/health
if not errorlevel 1 (
  echo [ok] EchoVault kjorer allerede - apner nettleseren.
  start "" http://localhost:3000
  timeout /t 3 /nobreak >nul
  exit /b 0
)

rem ---------- 1. Forutsetninger ----------
where git >nul 2>nul || goto no_git
where node >nul 2>nul || goto no_node
for /f "tokens=1 delims=v." %%v in ('node -v') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 22 goto old_node
where docker >nul 2>nul || goto no_docker

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [..] Installerer pnpm ...
  call npm install -g pnpm@10 || goto fail
)

rem ---------- 2. Docker Desktop ----------
docker info >nul 2>nul
if not errorlevel 1 goto docker_ok
echo [..] Starter Docker Desktop ...
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
set /a TRIES=0
:wait_docker
timeout /t 3 /nobreak >nul
docker info >nul 2>nul
if not errorlevel 1 goto docker_ok
set /a TRIES+=1
if %TRIES% GEQ 60 goto docker_timeout
goto wait_docker
:docker_ok
echo [ok] Docker kjorer

rem ---------- 3. Konfigurasjon ----------
if not exist "apps\web\.env.local" (
  copy /y ".env.example" "apps\web\.env.local" >nul
  echo [ok] Opprettet apps\web\.env.local fra .env.example
)

rem ---------- 4. Database + EchoScore ----------
echo [..] Starter Postgres og EchoScore i Docker - forste gang tar dette noen minutter ...
docker compose up -d --build || goto fail

rem ---------- 5. Avhengigheter ----------
echo [..] Installerer pakker ...
call pnpm install || goto fail

rem ---------- 6. Vent paa database, migrer ----------
set /a TRIES=0
:wait_pg
docker compose exec -T postgres pg_isready -U echovault >nul 2>nul
if not errorlevel 1 goto pg_ok
set /a TRIES+=1
if %TRIES% GEQ 40 goto pg_timeout
timeout /t 2 /nobreak >nul
goto wait_pg
:pg_ok
echo [ok] Postgres er klar
call pnpm db:migrate || goto fail

rem ---------- 7. Vent paa EchoScore, legg inn demo-data ----------
set /a TRIES=0
:wait_es
curl -s -f -o nul http://localhost:8001/health
if not errorlevel 1 goto es_ok
set /a TRIES+=1
if %TRIES% GEQ 60 goto es_timeout
timeout /t 2 /nobreak >nul
goto wait_es
:es_ok
echo [ok] EchoScore er klar
call pnpm db:seed --demo || goto fail

rem ---------- 8. Start web + worker i egne vinduer ----------
echo [..] Starter worker og web-app i egne vinduer ...
start "EchoVault worker" cmd /k "pnpm worker"
start "EchoVault web" cmd /k "pnpm dev"

set /a TRIES=0
:wait_web
timeout /t 2 /nobreak >nul
curl -s -f -o nul http://localhost:3000/api/v1/health
if not errorlevel 1 goto web_ok
set /a TRIES+=1
if %TRIES% GEQ 90 goto web_timeout
goto wait_web
:web_ok
start "" http://localhost:3000

echo.
echo  ---------------------------------------------
echo  EchoVault kjorer:  http://localhost:3000
echo.
echo  Testkontoer - passord: echovault-dev-password
echo    kjoper    buyer@echovault.local
echo    artist    artist@echovault.local
echo    reviewer  reviewer@echovault.local
echo    admin     admin@echovault.local
echo.
echo  Betaling er i TESTMODUS - ingen ekte penger.
echo  Stopp: lukk vinduene "EchoVault web" og "EchoVault worker",
echo         og dobbeltklikk stop.bat for a stoppe Docker-tjenestene.
echo  ---------------------------------------------
echo.
pause
exit /b 0

rem ---------- Feilmeldinger ----------
:no_git
echo [X] Git mangler. Installer: winget install Git.Git   - eller https://git-scm.com
goto fail
:no_node
echo [X] Node.js mangler. Installer Node 22 LTS: winget install OpenJS.NodeJS.LTS
goto fail
:old_node
echo [X] Node.js %NODE_MAJOR% er for gammel - trenger 22 eller nyere: winget install OpenJS.NodeJS.LTS
goto fail
:no_docker
echo [X] Docker mangler. Installer Docker Desktop: winget install Docker.DockerDesktop
goto fail
:no_curl
echo [X] curl mangler - krever Windows 10 1803 eller nyere.
goto fail
:docker_timeout
echo [X] Docker Desktop startet ikke. Start det manuelt og kjor start.bat igjen.
goto fail
:pg_timeout
echo [X] Postgres ble ikke klar. Se: docker compose logs postgres
goto fail
:es_timeout
echo [X] EchoScore ble ikke klar. Se: docker compose logs echoscore
goto fail
:web_timeout
echo [X] Web-appen svarte ikke paa localhost:3000. Se vinduet "EchoVault web".
goto fail
:fail
echo.
echo Oppstarten stoppet. Se feilmeldingen over.
pause
exit /b 1
