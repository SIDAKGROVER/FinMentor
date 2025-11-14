@echo off
REM FinMentor Quick Start Script for Windows

echo.
echo ========================================
echo    FinMentor - Setup & Start Script
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js is installed
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
if not exist node_modules (
    call npm install
) else (
    echo ✓ Backend dependencies already installed
)

REM Start backend
echo.
echo Starting backend server...
start "FinMentor Backend" npm start
echo ✓ Backend started (new window)
timeout /t 3

REM Install frontend dependencies
echo.
cd ..\frontend
echo Installing frontend dependencies...
if not exist node_modules (
    call npm install
) else (
    echo ✓ Frontend dependencies already installed
)

REM Start frontend
echo.
echo Starting frontend development server...
start "FinMentor Frontend" npm run dev
echo ✓ Frontend started (new window)

echo.
echo ========================================
echo    All servers are starting...
echo ========================================
echo.
echo Frontend:  http://localhost:5173
echo Backend:   http://localhost:5000
echo.
echo Make sure to:
echo 1. Grant microphone permission to browser
echo 2. Update backend/.env with Agora credentials
echo 3. (Optional) Add OpenAI API key for AI responses
echo.
pause
