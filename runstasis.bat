@echo off
echo Starting STASIS Application...
echo.
echo ========================================
echo Starting Frontend Application
echo ========================================
echo.

cd /d %~dp0\frontend
start /B npm start
cd /d %~dp0

echo.
echo STASIS Application is starting...
echo Backend: http://localhost:8080
echo Frontend: http://localhost:3000
echo.
echo.
echo ========================================
echo Starting Spring Boot Backend Application
echo ========================================
echo.

REM Use mvnw wrapper if available, otherwise use mvn command
"C:\Program Files\Java\jdk-23\bin\java.exe" @C:\Users\crund\AppData\Local\Temp\cp_2aorg4reb0y18fn5i8e2rx1hd.argfile com.stasis.stasis.StasisApplication
echo.
