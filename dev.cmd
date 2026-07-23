@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: Puli Development Starter Script
:: Edit the variable below to choose which project to run
:: ============================================================
set "PROJECT=admin"
:: Valid options: admin, customer, backend, all
:: ============================================================

set "ROOT_DIR=%~dp0"
set "ADMIN_DIR=%ROOT_DIR%puli-digimenu-adminV2\puli-digimenu-adminV2"
set "CUSTOMER_DIR=%ROOT_DIR%puli-digital-menu_V2\puli-digital-menu_V2"
set "BACKEND_DIR=%ROOT_DIR%puli-mern-backend-v2"

set "ADMIN_PORT=5173"
set "CUSTOMER_PORT=5174"
set "BACKEND_PORT=5000"

if /i "%PROJECT%"=="admin" (
    echo [Puli] Starting Admin Frontend...
    call :start_project "Admin Frontend" "%ADMIN_DIR%" "npm run dev"
    goto :eof
)

if /i "%PROJECT%"=="customer" (
    echo [Puli] Starting Customer Frontend...
    call :start_project "Customer Frontend" "%CUSTOMER_DIR%" "npm run dev"
    goto :eof
)

if /i "%PROJECT%"=="backend" (
    echo [Puli] Starting Backend API...
    call :start_project "Backend API" "%BACKEND_DIR%" "npm run dev"
    goto :eof
)

if /i "%PROJECT%"=="all" (
    echo [Puli] Starting all projects in separate windows...
    start "Puli - Admin Frontend" cmd /c "cd /d "%ADMIN_DIR%" && echo Admin Frontend at http://localhost:%ADMIN_PORT% && npm run dev"
    start "Puli - Customer Frontend" cmd /c "cd /d "%CUSTOMER_DIR%" && echo Customer Frontend at http://localhost:%CUSTOMER_PORT% && npm run dev"
    start "Puli - Backend API" cmd /c "cd /d "%BACKEND_DIR%" && echo Backend API at http://localhost:%BACKEND_PORT% && npm run dev"
    echo [Puli] All projects started in separate windows.
    goto :eof
)

echo [Puli] Unknown project "%PROJECT%".
echo Valid options: admin, customer, backend, all
exit /b 1

:start_project
    echo [Puli] Installing dependencies for %~1...
    cd /d "%~2" || ( echo [ERROR] Directory not found: %~2 & exit /b 1 )
    if not exist "node_modules\.package-lock.json" (
        call npm install
        if errorlevel 1 ( echo [ERROR] npm install failed for %~1 & exit /b 1 )
    )
    echo [Puli] Starting %~1...
    call %~3
    if errorlevel 1 ( echo [ERROR] %~1 failed to start & exit /b 1 )
    goto :eof
