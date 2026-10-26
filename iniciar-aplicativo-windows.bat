@echo off
title HelpClin - Aplicativo Nativo Windows
color 0b
echo ========================================================
echo   Iniciando HelpClin - Aplicativo Nativo Windows
echo ========================================================
echo.
cd /d "%~dp0\desktop - windows"

if not exist "node_modules" (
    echo [*] Instalando dependencias do Electron... isso pode levar 1 minuto na primeira vez...
    call yarn install
)

echo [*] Abrindo janela nativa do HelpClin...
echo.
call yarn start
