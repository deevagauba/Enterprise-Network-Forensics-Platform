@echo off
title Enterprise Network Forensics Platform
echo ============================================
echo  Enterprise Network Forensics Platform
echo ============================================
echo.

:: Lock the working directory to wherever this .bat file lives
cd /d "%~dp0"

:: ---------------------------------------------------
:: 0. Check prerequisites
:: ---------------------------------------------------
echo Checking prerequisites...
echo.

where python >nul 2>nul
IF ERRORLEVEL 1 (
    echo [X] Python is NOT installed.
    echo     Download it from: https://python.org
    echo     Make sure to check "Add Python to PATH" during install.
    echo.
    set "MISSING=1"
) ELSE (
    echo [OK] Python found.
)

where node >nul 2>nul
IF ERRORLEVEL 1 (
    echo [X] Node.js is NOT installed.
    echo     Download it from: https://nodejs.org
    echo     Use the LTS version and restart your PC after installing.
    echo.
    set "MISSING=1"
) ELSE (
    echo [OK] Node.js found.
)

IF DEFINED MISSING (
    echo.
    echo Please install the missing tools above and run this script again.
    pause
    exit /b 1
)

echo.

:: ---------------------------------------------------
:: 1. Setup Python Backend
:: ---------------------------------------------------
echo [1/2] Setting up Python Backend...

IF NOT EXIST "%~dp0backend\venv\Scripts\activate.bat" (
    echo Creating virtual environment and installing dependencies...
    python -m venv "%~dp0backend\venv"
    call "%~dp0backend\venv\Scripts\activate.bat"
    pip install -r "%~dp0backend\requirements.txt"
) ELSE (
    echo Backend environment is ready.
)
echo.

:: ---------------------------------------------------
:: 2. Setup Node.js Frontend
:: ---------------------------------------------------
echo [2/2] Setting up Node.js Frontend...

IF NOT EXIST "%~dp0frontend\node_modules\package.json" (
    echo Installing React dependencies - this may take a minute...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
) ELSE (
    echo Frontend environment is ready.
)
echo.

:: ---------------------------------------------------
:: 3. Launch both servers
:: ---------------------------------------------------
echo Launching application...
echo.

start "ENFP Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && python app.py"
start "ENFP Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo ============================================
echo  Both servers are starting in new windows.
echo  Open the Vite URL shown in the frontend
echo  window in your browser.
echo ============================================
pause