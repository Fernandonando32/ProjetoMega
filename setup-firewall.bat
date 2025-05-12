@echo off
echo Configurando regras do Firewall para o Servidor Node.js
echo ------------------------------------------------------

echo.
echo Verificando privilégios de administrador...
NET SESSION >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERRO: Este script precisa ser executado como Administrador.
    echo Por favor, clique com o botão direito no arquivo e selecione "Executar como administrador".
    pause
    exit /b 1
)

echo.
echo Adicionando regra para permitir conexões de entrada na porta 3000 (TCP)...
netsh advfirewall firewall add rule name="Allow Node.js Server TCP 3000" dir=in action=allow protocol=TCP localport=3000

echo.
echo Verificando se a regra foi criada corretamente...
netsh advfirewall firewall show rule name="Allow Node.js Server TCP 3000" >nul 2>&1

if %ERRORLEVEL% neq 0 (
    echo ERRO: Falha ao criar regra de firewall.
    pause
    exit /b 1
) else (
    echo Regra de firewall criada com sucesso!
)

echo.
echo Configuração do firewall concluída com sucesso.
echo Agora o servidor Node.js deve estar acessível através da rede local na porta 3000.
echo.
echo Para acessar o servidor de outros dispositivos na mesma rede, use:
echo http://192.168.68.189:3000
echo.

pause 