@echo off
setlocal

:: ============================================================
:: SSH Login Script for Puli
:: Configure the variables below before running.
:: ============================================================
set "SSH_USER=<SSH_USERNAME>"
set "SSH_HOST=<SERVER_IP_OR_DOMAIN>"
set "SSH_PORT=22"
:: ============================================================

:: Validate SSH is available
where ssh >nul 2>nul
if errorlevel 1 (
    echo [ERROR] ssh is not installed or not in PATH.
    echo         Install OpenSSH Client or Git for Windows.
    pause
    exit /b 1
)

:: Validate configuration
if "%SSH_USER%"=="<SSH_USERNAME>" (
    echo [ERROR] SSH_USER is not configured. Edit ssh-login.cmd and set SSH_USER.
    pause
    exit /b 1
)
if "%SSH_HOST%"=="<SERVER_IP_OR_DOMAIN%" (
    echo [ERROR] SSH_HOST is not configured. Edit ssh-login.cmd and set SSH_HOST.
    pause
    exit /b 1
)

echo [Puli] Connecting to %SSH_USER%@%SSH_HOST%:%SSH_PORT%...
ssh -p %SSH_PORT% "%SSH_USER%@%SSH_HOST%"

if errorlevel 1 (
    echo.
    echo [ERROR] SSH connection failed. Check:
    echo   - Server is running
    echo   - SSH key is set up
    echo   - Firewall allows port %SSH_PORT%
    pause
)
