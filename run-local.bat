@echo off
title STASIS Application Launcher (Local)
color 0B

echo ===============================================
echo    STASIS Application Launcher (LOCAL)
echo    Student Academic System Information System
echo ===============================================
echo.

REM Set the current directory to the script location
cd /d "%~dp0"

REM Check if Maven wrapper is available (preferred) or Maven is installed
if exist "mvnw.cmd" (
    set MVN_CMD=mvnw.cmd
    echo Using Maven wrapper (mvnw.cmd)
) else (
    where mvn >nul 2>nul
    if %errorlevel% neq 0 (
        echo ERROR: Neither Maven wrapper (mvnw.cmd) nor Maven is available
        echo Please ensure mvnw.cmd exists or install Maven and add it to your PATH
        pause
        exit /b 1
    )
    set MVN_CMD=mvn
    echo Using system Maven
)

REM Check if Node.js/npm is available
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js/npm is not installed or not in PATH
    echo Please install Node.js and add it to your PATH
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "frontend" (
    echo ERROR: Frontend directory not found
    echo Please ensure you're running this from the project root
    pause
    exit /b 1
)

echo [1/3] Starting Spring Boot Backend with Local Database...
echo       Profile: local
echo       Port: 8080
echo       Database: PostgreSQL localhost:5432/stasis
echo       Actuator endpoints: http://localhost:8080/actuator
echo.
start "STASIS Backend - Local DB" cmd /k "echo Starting Spring Boot with Local Database... && %MVN_CMD% spring-boot:run -Dspring-boot.run.profiles=local"

echo [2/3] Waiting for backend to initialize...
echo       This may take 30-60 seconds for first startup...
timeout /t 15 /nobreak >nul

echo [3/3] Starting React Frontend...
echo       Port: 3000
echo       Proxy to backend: http://localhost:8080
echo.
start "STASIS Frontend" cmd /k "echo Starting React Frontend... && cd frontend && npm start"

echo.
echo ===============================================
echo    STASIS Applications Started Successfully!
echo ===============================================
echo.
echo Access Points:
echo - Frontend (React):     http://localhost:3000
echo - Backend API:          http://localhost:8080
echo - Health Check:         http://localhost:8080/actuator/health
echo - Application Info:     http://localhost:8080/actuator/info
echo - All Actuator Endpoints: http://localhost:8080/actuator
echo.
echo VSCode Spring Boot Dashboard:
echo - Open VSCode
echo - Install "Spring Boot Dashboard" extension if not installed
echo - The dashboard should automatically detect the running application
echo - View live metrics, beans, mappings, and more
echo.
echo Database: Connected to Local PostgreSQL (localhost:5432/stasis)
echo Username: postgres | Password: 123
echo.
echo Note: Both applications are running in separate command windows.
echo       Close those windows to stop the applications.
echo.
echo Press any key to exit this launcher...
pause >nul
