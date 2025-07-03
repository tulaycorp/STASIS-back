@echo off
REM STASIS Application Build and Deployment Script for Windows

setlocal EnableDelayedExpansion

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker and try again.
    exit /b 1
)

if "%1"=="build" goto build
if "%1"=="dev" goto dev
if "%1"=="prod" goto prod
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="cleanup" goto cleanup
goto help

:build
echo [INFO] Building Docker images...
docker build -t stasis-backend:latest .
docker build -t stasis-frontend:latest ./frontend
echo [SUCCESS] All images built successfully
goto end

:dev
echo [INFO] Starting development environment...
call :build
docker-compose up -d
echo [SUCCESS] Development environment started
echo [INFO] Frontend: http://localhost
echo [INFO] Backend: http://localhost:8080
echo [INFO] Database: localhost:5432
goto end

:prod
echo [INFO] Starting production environment...
if not exist .env (
    echo [WARNING] .env file not found. Creating from template...
    copy .env.example .env
    echo [WARNING] Please edit .env file with your production values before running again.
    exit /b 1
)
call :build
docker-compose -f docker-compose.prod.yml up -d
echo [SUCCESS] Production environment started
goto end

:stop
echo [INFO] Stopping all services...
docker-compose down
docker-compose -f docker-compose.prod.yml down
echo [SUCCESS] All services stopped
goto end

:restart
call :stop
timeout /t 2 /nobreak >nul
call :dev
goto end

:logs
docker-compose logs -f
goto end

:cleanup
echo [INFO] Cleaning up Docker resources...
docker system prune -f
echo [SUCCESS] Cleanup completed
goto end

:help
echo STASIS Docker Deployment Script
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   build       Build Docker images
echo   dev         Start development environment
echo   prod        Start production environment
echo   stop        Stop all services
echo   restart     Restart services
echo   logs        Show logs
echo   cleanup     Clean up Docker resources
echo   help        Show this help message
echo.
goto end

:end
