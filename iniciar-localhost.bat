@echo off
title HelpClin - Servidor Local (Localhost)
color 0b
echo ========================================================
echo   Iniciando HelpClin e Portal SaaS em Modo Local...
echo ========================================================
echo.
cd /d "%~dp0\web - frontend"

if not exist "node_modules" (
    echo [*] Instalando dependencias necessarias...
    call yarn install
)

echo [*] Iniciando servidor de desenvolvimento Vite...
echo [*] Seu navegador abrira em http://localhost:5173
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5173
call yarn dev
pause
