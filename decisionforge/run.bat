@echo off
setlocal enabledelayedexpansion
title DECISIONFORGE Platform Launcher

echo ======================================================================
echo          DECISIONFORGE - Autonomous Decision Intelligence Platform
echo         "Don't just find answers. Discover what would change your mind."
echo ======================================================================

set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64;%USERPROFILE%\.local\bin;%PATH%"

cd /d "%~dp0"

echo [1/4] Checking Python environment...
if not exist "backend\.venv\Scripts\python.exe" (
    echo Creating virtual environment with uv...
    uv venv backend\.venv --python 3.11
    uv pip install -r requirements.txt --python backend\.venv\Scripts\python.exe
)

echo [2/4] Initializing Database ^& Seed Benchmarks...
set PYTHONPATH=%cd%
backend\.venv\Scripts\python.exe -c "from backend.database.db import init_db; from backend.data.seeds import seed_demo_data; init_db(); seed_demo_data(); print('Database ready.')"

echo [3/4] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "DECISIONFORGE Backend" cmd /k "set PYTHONPATH=%cd% && backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

echo [4/4] Launching React Frontend on http://localhost:5173 ...
cd frontend
start "DECISIONFORGE Frontend" cmd /k "npm.cmd run dev"

echo.
echo ======================================================================
echo DECISIONFORGE is running!
echo Frontend: http://localhost:5173
echo Backend API ^& Docs: http://127.0.0.1:8000/docs
echo ======================================================================
echo Opening browser...
timeout /t 3 >nul
start http://localhost:5173
