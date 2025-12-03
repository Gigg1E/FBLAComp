@echo off
REM Simple launcher for the PowerShell setup script
REM This avoids batch file issues by using PowerShell instead

echo.
echo Starting setup script...
echo.

REM Run the PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "%~dp0setup-and-run.ps1"

REM Keep window open if there was an error
if %errorlevel% neq 0 (
    echo.
    echo Script exited with error code: %errorlevel%
    pause
)
