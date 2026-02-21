@echo off
echo ============================================
echo FleetFlow - Automated Setup and Run Script
echo ============================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PostgreSQL is not installed or not in PATH!
    echo.
    echo Please install PostgreSQL first:
    echo 1. Download from: https://www.postgresql.org/download/windows/
    echo 2. Install with default settings
    echo 3. Remember your postgres password
    echo 4. Run this script again
    echo.
    echo See INSTALL-POSTGRESQL.md for detailed instructions.
    pause
    exit /b 1
)

echo [OK] PostgreSQL is installed
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo.

REM Prompt for PostgreSQL password
set /p DB_PASSWORD="Enter your PostgreSQL password: "
echo.

REM Create .env file for backend
echo [STEP 1/8] Creating backend .env file...
cd backend
if not exist .env (
    (
        echo PORT=3000
        echo NODE_ENV=development
        echo.
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=fleetflow
        echo DB_USER=postgres
        echo DB_PASSWORD=%DB_PASSWORD%
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=fleetflow_super_secret_jwt_key_change_in_production_2024
        echo JWT_EXPIRES_IN=24h
        echo.
        echo # CORS Configuration
        echo CORS_ORIGIN=http://localhost:5173
    ) > .env
    echo [OK] Backend .env file created
) else (
    echo [OK] Backend .env file already exists
)
echo.

REM Create database
echo [STEP 2/8] Creating database...
psql -U postgres -c "DROP DATABASE IF EXISTS fleetflow;" 2>nul
psql -U postgres -c "CREATE DATABASE fleetflow;"
if %ERRORLEVEL% EQU 0 (
    echo [OK] Database created successfully
) else (
    echo [ERROR] Failed to create database. Check your password.
    pause
    exit /b 1
)
echo.

REM Install backend dependencies
echo [STEP 3/8] Installing backend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

REM Run database migrations
echo [STEP 4/8] Running database migrations...
call npm run db:migrate
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to run migrations
    pause
    exit /b 1
)
echo [OK] Database migrations completed
echo.

REM Seed test user
echo [STEP 5/8] Creating test user...
call npm run seed:testuser
echo [OK] Test user created
echo.

REM Install frontend dependencies
echo [STEP 6/8] Installing frontend dependencies...
cd ..\frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.

REM Go back to root
cd ..

echo [STEP 7/8] Starting backend server...
echo.
echo ============================================
echo Starting FleetFlow Backend on port 3000...
echo ============================================
echo.
start "FleetFlow Backend" cmd /k "cd backend && npm start"

timeout /t 5 /nobreak >nul

echo [STEP 8/8] Starting frontend server...
echo.
echo ============================================
echo Starting FleetFlow Frontend on port 5173...
echo ============================================
echo.
start "FleetFlow Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo FleetFlow is now running!
echo ============================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Login credentials:
echo   Email:    admin@fleetflow.com
echo   Password: admin123
echo.
echo Two new windows have opened:
echo   1. Backend Server (port 3000)
echo   2. Frontend Server (port 5173)
echo.
echo Your browser should open automatically.
echo If not, go to: http://localhost:5173
echo.
echo To stop the servers, close both terminal windows.
echo.

REM Wait a bit more then open browser
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo Press any key to exit this window...
pause >nul
