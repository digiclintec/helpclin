@echo off
title HelpClin - Gerador de Instalador .EXE para Windows
color 0a
echo ========================================================
echo   Compilando Instalador Nativo .EXE do HelpClin
echo ========================================================
echo.
cd /d "%~dp0\desktop - windows"

if not exist "node_modules" (
    echo [*] Instalando dependencias necessarias (Electron + Builder)...
    call yarn install
)

echo [*] Gerando executaveis (Instalador NSIS .exe e Versao Portatil)...
echo.
call yarn run build:all

echo.
echo ========================================================
echo   Concluido com Sucesso!
echo   Os arquivos .EXE estao disponíveis em:
echo   desktop - windows\dist-instalador
echo ========================================================
echo.
explorer "%~dp0\desktop - windows\dist-instalador"
pause
