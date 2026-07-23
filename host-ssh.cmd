@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: Puli - Remote Host Deployment Script (Windows CMD)
:: Configure the variables below before running.
:: ============================================================
set "SSH_USER=<SSH_USERNAME>"
set "SSH_HOST=<SERVER_IP_OR_DOMAIN>"
set "SSH_PORT=22"
set "REMOTE_DIR=/var/www/puli"
set "APP_PORT=3000"
:: ============================================================

set "ROOT_DIR=%~dp0"

echo [Puli] === Remote Deployment Script ============================
echo.

:: Validate SSH and SCP are available
where ssh >nul 2>nul
if errorlevel 1 (
    echo [ERROR] ssh is not installed or not in PATH.
    echo         Install OpenSSH Client or Git for Windows.
    exit /b 1
)
where scp >nul 2>nul
if errorlevel 1 (
    echo [ERROR] scp is not installed or not in PATH.
    exit /b 1
)

:: Validate configuration
if "%SSH_USER%"=="<SSH_USERNAME>" (
    echo [ERROR] SSH_USER is not configured. Edit host-ssh.cmd and set SSH_USER.
    exit /b 1
)
if "%SSH_HOST%"=="<SERVER_IP_OR_DOMAIN>" (
    echo [ERROR] SSH_HOST is not configured. Edit host-ssh.cmd and set SSH_HOST.
    exit /b 1
)

echo [Puli] Deploying to %SSH_USER%@%SSH_HOST%:%SSH_PORT%
echo [Puli] Remote directory: %REMOTE_DIR%
echo.

:: Create remote directory
echo [Puli] Creating remote directory...
ssh -p %SSH_PORT% "%SSH_USER%@%SSH_HOST%" "mkdir -p %REMOTE_DIR%"
if errorlevel 1 (
    echo [ERROR] Failed to create remote directory. Check SSH connection.
    exit /b 1
)

:: Transfer project (exclude unnecessary directories)
echo [Puli] Transferring project files...
scp -P %SSH_PORT% -r ^
    --exclude=.git ^
    --exclude=node_modules ^
    --exclude=.next ^
    --exclude=dist ^
    --exclude=build ^
    --exclude=coverage ^
    --exclude=*.log ^
    "%ROOT_DIR%*" "%SSH_USER%@%SSH_HOST%:%REMOTE_DIR%/"
if errorlevel 1 (
    echo [ERROR] File transfer failed.
    exit /b 1
)

:: Install dependencies on remote
echo [Puli] Installing dependencies on remote...
ssh -p %SSH_PORT% "%SSH_USER%@%SSH_HOST%" "cd %REMOTE_DIR%/puli-mern-backend-v2 && npm install"
if errorlevel 1 (
    echo [WARN] Backend npm install failed. Check remote Node.js version.
)

ssh -p %SSH_PORT% "%SSH_USER%@%SSH_HOST%" "cd %REMOTE_DIR%/puli-digimenu-adminV2/puli-digimenu-adminV2 && npm install"
ssh -p %SSH_PORT% "%SSH_USER%@%SSH_HOST%" "cd %REMOTE_DIR%/puli-digital-menu_V2/puli-digital-menu_V2 && npm install"

:: Build frontends
echo [Puli] Building frontends on remote...
ssh -p %SSH_PORT% "%SSH_USER%@%SSH_HOST%" "cd %REMOTE_DIR%/puli-digimenu-adminV2/puli-digimenu-adminV2 && npm run build"
ssh -p %SSH_PORT% "%SSH_USER%@%SSH_HOST%" "cd %REMOTE_DIR%/puli-digital-menu_V2/puli-digital-menu_V2 && npm run build"

:: Start or restart application with PM2
echo [Puli] Starting application with PM2...
ssh -p %SSH_PORT% "%SSH_USER%@%SSH_HOST%" "cd %REMOTE_DIR%/puli-mern-backend-v2 && pm2 startOrRestart ecosystem.config.js --update-env 2>nul || pm2 start server.js --name puli-backend -i max"
if errorlevel 1 (
    echo [Puli] PM2 not found. Trying direct start with nohup...
    ssh -p %SSH_PORT% "%SSH_USER%@%SSH_HOST%" "cd %REMOTE_DIR%/puli-mern-backend-v2 && nohup node server.js > app.log 2>&1 &"
)

echo.
echo [Puli] === Deployment Complete =================================
echo [Puli] Backend API:    http://%SSH_HOST%:%APP_PORT%
echo [Puli] Admin Panel:    http://%SSH_HOST%:%APP_PORT%/admin  (or different port)
echo [Puli] Customer Menu:  http://%SSH_HOST%:%APP_PORT%       (or different port)
echo.
echo [Puli] Useful commands:
echo   ssh -p %SSH_PORT% %SSH_USER%@%SSH_HOST%
echo   pm2 list              (list processes)
echo   pm2 logs puli-backend (view logs)
echo   pm2 restart puli-backend (restart)
echo.
echo [Puli] To update: edit host-ssh.cmd variables then re-run this script.
