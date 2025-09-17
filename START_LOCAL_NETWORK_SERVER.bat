@echo off
echo.
echo ===================================================================
echo   MIRAGE TENDERS TRACKING SYSTEM - LOCAL NETWORK SERVER
echo ===================================================================
echo.

cd /d "%~dp0"

echo [1/4] Detecting Network Configuration...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=* delims= " %%j in ("%%i") do (
        set ip=%%j
        if not "!ip:~0,3!"=="127" (
            if not defined NETWORK_IP set NETWORK_IP=%%j
        )
    )
)

if not defined NETWORK_IP set NETWORK_IP=172.18.0.1

echo    Network IP: %NETWORK_IP%
echo.

echo [2/4] Configuring Windows Firewall...
netsh advfirewall firewall show rule name="Mirage Tenders System" >nul 2>&1
if %errorlevel% neq 0 (
    echo    Creating firewall rule...
    netsh advfirewall firewall add rule name="Mirage Tenders System" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
    if %errorlevel% neq 0 (
        echo    WARNING: Run as Administrator for mobile access
    ) else (
        echo    Firewall configured successfully
    )
) else (
    echo    Firewall already configured
)
echo.

echo [3/4] Stopping existing processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo    Ready to start
echo.

echo [4/4] Starting production server...
echo    Production build with network access
echo.

echo ===================================================================
echo   SERVER ACCESS URLS:
echo ===================================================================
echo.
echo   Mobile/Tablet: http://%NETWORK_IP%:3000
echo   Computer:      http://localhost:3000
echo.
echo   Share with team: http://%NETWORK_IP%:3000
echo.
echo ===================================================================
echo.
echo Starting server... Press Ctrl+C to stop
echo.

npx next start -H 0.0.0.0 -p 3000