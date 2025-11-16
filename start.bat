@echo off
echo 🚀 Starting FeedbackPro...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo.

REM Backend setup
echo 📦 Setting up Backend...
cd backend

if not exist "node_modules\" (
    echo Installing backend dependencies...
    call npm install
)

echo Starting backend server...
start "FeedbackPro Backend" cmd /k npm start

timeout /t 3 /nobreak >nul

REM Frontend setup
echo.
echo 📦 Setting up Frontend...
cd ..\frontend

if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
)

echo Starting frontend server...
start "FeedbackPro Frontend" cmd /k npm start

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🎉 FeedbackPro is running!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:5000
echo.
echo Close the terminal windows to stop the servers
echo.
pause
