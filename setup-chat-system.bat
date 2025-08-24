@echo off
echo.
echo ========================================
echo    Chat System Setup for Windows
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found: 
node --version

echo.
echo Installing dependencies...
npm install

echo.
echo Setting up database...
node setup-chat-system-complete.js

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start your server: npm run dev
echo 2. Test the chat system
echo.
echo For detailed instructions, see: CHAT_SYSTEM_DEPLOYMENT_GUIDE.md
echo.
pause
