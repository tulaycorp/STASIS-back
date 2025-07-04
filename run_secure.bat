@echo off
echo Building STASIS application with Spring Security...

echo Compiling Spring Boot application...
call mvnw.cmd clean compile

if %ERRORLEVEL% EQU 0 (
    echo ✓ Compilation successful!
    
    echo Running Spring Boot application...
    call mvnw.cmd spring-boot:run
) else (
    echo ✗ Compilation failed!
    exit /b 1
)
