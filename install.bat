@echo off
echo 🚀 Installing Panchakarma API...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18 or higher.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please edit .env file with your configuration before starting the application.
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist logs mkdir logs
if not exist uploads mkdir uploads

echo.
echo 🎉 Installation completed!
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Start MySQL database
echo 3. Run 'npm run dev' to start the development server
echo 4. Visit http://localhost:3000/api/docs for API documentation
echo.
echo For Docker deployment:
echo 1. Run 'docker-compose up -d' to start all services
echo 2. Visit http://localhost:3000 for the API
echo 3. Visit http://localhost:8080 for phpMyAdmin
echo.
pause 