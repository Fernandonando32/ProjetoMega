@echo off
echo Iniciando o Servidor da Aplicacao FTTH
echo --------------------------------------

echo Verificando se o servidor ja esta em execucao...
netstat -ano | findstr :3000 > nul
if %ERRORLEVEL% equ 0 (
    echo O servidor ja esta em execucao na porta 3000!
    echo Se deseja reiniciar, feche o processo atual primeiro.
    echo Voce pode usar o comando: taskkill /F /IM node.exe
    echo.
    pause
    exit /b 1
)

echo Servidor nao detectado, iniciando...
echo.
echo O servidor estara disponivel em:
echo - Local: http://localhost:3000
echo - Rede local: http://192.168.68.189:3000
echo.
echo Pressione Ctrl+C para encerrar o servidor quando quiser
echo.

node server.js

pause 