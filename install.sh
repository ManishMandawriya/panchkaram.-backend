#!/bin/bash

echo "🚀 Installing Panchakarma API..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before starting the application."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs uploads

# Check if MySQL is running (optional)
if command -v mysql &> /dev/null; then
    echo "🔍 Checking MySQL connection..."
    if mysql -u root -p -e "SELECT 1;" &> /dev/null; then
        echo "✅ MySQL is running"
    else
        echo "⚠️  MySQL is not running or not accessible. Please start MySQL before running the application."
    fi
else
    echo "⚠️  MySQL is not installed. Please install MySQL 8.0 or higher."
fi

echo ""
echo "🎉 Installation completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start MySQL database"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit http://localhost:3000/api/docs for API documentation"
echo ""
echo "For Docker deployment:"
echo "1. Run 'docker-compose up -d' to start all services"
echo "2. Visit http://localhost:3000 for the API"
echo "3. Visit http://localhost:8080 for phpMyAdmin" 