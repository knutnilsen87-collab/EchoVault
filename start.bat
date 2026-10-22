@echo off
rem ============================================================================
rem  EchoVault - start everything locally (Windows). Double-click to run.
rem  Starts: Postgres + EchoScore (Docker), web app (localhost:4747) and worker.
rem  Safe to run again. Full output of every step goes to start.log.
rem ============================================================================
setlocal
title EchoVault - starter
cd /d "%~dp0"
set "LOG=%~dp0start.log"
echo ==== %date% %time% ==== > "%LOG%"

echo.
echo  ECHOVAULT  -  lokal oppstart   (logg: start.log)
echo  ---------------------------------------------
echo.

rem ---------- 0. Kjorer den allerede? ----------
where curl >nul 2>nul || goto no_curl
curl -s -f -o nul http://localhost:4747/api/v1/health
if not errorlevel 1 (
  echo [ok] EchoVault kjorer allerede - apner nettleseren.
  start "" http://localhost:4747
  timeout /t 3 /nobreak >nul
  exit /b 0
)

rem ---------- 1. Forutsetninger ----------
set "STEP=forutsetninger"
where git >nul 2>nul || goto no_git
where node >nul 2>nul || goto no_node
for /f "tokens=1 delims=v." %%v in ('node -v') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 22 goto old_node
where docker >nul 2>nul || goto no_docker
node -v >> "%LOG%" 2>&1

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [..] Installerer pnpm ...
  call npm install -g pnpm@10 >> "%LOG%" 2>&1 || goto fail
)
echo [ok] Git, Node og pnpm funnet

rem ffmpeg lager MP3-forhandslytting. Valgfritt: uten ffmpeg virker alt annet.
set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links;%PATH%"
where ffmpeg >nul 2>nul
if not errorlevel 1 goto ffmpeg_ok
where winget >nul 2>nul
if errorlevel 1 goto ffmpeg_missing
echo [..] Installerer ffmpeg med winget - for forhandslytting ...
winget install -e --id Gyan.FFmpeg --silent --accept-package-agreements --accept-source-agreements >> "%LOG%" 2>&1
where ffmpeg >nul 2>nul
if errorlevel 1 goto ffmpeg_missing
:ffmpeg_ok
echo [ok] ffmpeg funnet
goto ffmpeg_done
:ffmpeg_missing
echo [!] ffmpeg mangler - appen starter, men uten forhandslytting av lyd.
echo     Installer senere med:  winget install Gyan.FFmpeg
:ffmpeg_done

rem ---------- 2. Docker Desktop ----------
set "STEP=Docker Desktop"
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
set "STEP=Docker compose - Postgres og EchoScore"
echo [..] Starter Postgres og EchoScore i Docker - forste gang tar dette noen minutter ...
docker compose up -d --build >> "%LOG%" 2>&1 || goto fail
echo [ok] Docker-tjenestene er startet

rem ---------- 5. Avhengigheter ----------
set "STEP=pnpm install"
echo [..] Installerer pakker - forste gang tar dette noen minutter ...
call pnpm install --reporter=append-only >> "%LOG%" 2>&1 || goto fail
echo [ok] Pakker installert

rem ---------- 6. Vent paa database, migrer ----------
set "STEP=database"
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
call pnpm db:migrate >> "%LOG%" 2>&1 || goto fail
echo [ok] Database oppdatert

rem ---------- 7. Vent paa EchoScore, legg inn demo-data ----------
set "STEP=demo-data"
set /a TRIES=0
:wait_es
curl -s -f -o nul http://localhost:4748/health
if not errorlevel 1 goto es_ok
set /a TRIES+=1
if %TRIES% GEQ 90 goto es_timeout
timeout /t 2 /nobreak >nul
goto wait_es
:es_ok
echo [ok] EchoScore er klar
echo [..] Legger inn testkontoer og demo-laater ...
call pnpm db:seed --demo >> "%LOG%" 2>&1 || goto fail
echo [ok] Demo-data klar

rem ---------- 8. Start web + worker i egne vinduer ----------
set "STEP=web-app"
netstat -ano | findstr /R /C:":4747 .*LISTENING" >nul
if not errorlevel 1 goto port_busy
echo [..] Starter worker og web-app i egne vinduer ...
start "EchoVault worker" cmd /k "pnpm worker"
start "EchoVault web" cmd /k "pnpm dev"

set /a TRIES=0
:wait_web
timeout /t 2 /nobreak >nul
curl -s -f -o nul http://localhost:4747/api/v1/health
if not errorlevel 1 goto web_ok
set /a TRIES+=1
if %TRIES% GEQ 120 goto web_timeout
goto wait_web
:web_ok
start "" http://localhost:4747

echo.
echo  ---------------------------------------------
echo  EchoVault kjorer:  http://localhost:4747
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
goto fail_plain
:no_node
echo [X] Node.js mangler. Installer Node 22 LTS: winget install OpenJS.NodeJS.LTS
goto fail_plain
:old_node
echo [X] Node.js %NODE_MAJOR% er for gammel - trenger 22 eller nyere: winget install OpenJS.NodeJS.LTS
goto fail_plain
:no_docker
echo [X] Docker mangler. Installer Docker Desktop: winget install Docker.DockerDesktop
goto fail_plain
:no_curl
echo [X] curl mangler - krever Windows 10 1803 eller nyere.
goto fail_plain
:docker_timeout
echo [X] Docker Desktop startet ikke. Start det manuelt og kjor start.bat igjen.
goto fail_plain
:pg_timeout
echo [X] Postgres ble ikke klar. Se: docker compose logs postgres
goto fail_plain
:es_timeout
echo [X] EchoScore ble ikke klar. Se: docker compose logs echoscore
goto fail_plain
:port_busy
echo [X] Port 4747 brukes allerede av et annet program. Lukk det, eller endre porten i
echo     apps\web\package.json og NEXT_PUBLIC_APP_URL i apps\web\.env.local.
goto fail_plain
:web_timeout
echo [X] Web-appen svarte ikke paa localhost:4747. Se vinduet "EchoVault web".
goto fail_plain

:fail
echo.
echo [X] Steget "%STEP%" feilet. Siste linjer fra start.log:
echo ---------------------------------------------
powershell -NoProfile -Command "Get-Content -Path '%LOG%' -Tail 25"
echo ---------------------------------------------
:fail_plain
echo.
echo Oppstarten stoppet. Hele loggen ligger i start.log.
pause
exit /b 1
