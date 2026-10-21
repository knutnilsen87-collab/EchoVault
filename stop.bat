@echo off
rem Stops the Docker services (Postgres + EchoScore). Data is kept.
rem Close the "EchoVault web" and "EchoVault worker" windows to stop the app itself.
setlocal
cd /d "%~dp0"
docker compose stop
echo.
echo Docker-tjenestene er stoppet. Data er beholdt.
echo Lukk vinduene "EchoVault web" og "EchoVault worker" hvis de fortsatt er apne.
pause
