# ============================================
# Local Business Reviews - Setup and Run Script (PowerShell)
# ============================================
# This PowerShell script will:
# 1. Check for Node.js installation
# 2. Install dependencies
# 3. Initialize the database
# 4. Start the server
# 5. Open the application in browser
# ============================================

# Set error action to stop on errors
$ErrorActionPreference = "Stop"

Write-Host "This script will set up and run the Local Business Reviews application." -ForegroundColor Cyan
Write-Host "Please ensure you have an active internet connection." -ForegroundColor Cyan

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Here is the steps that will be performed: (Setup is using PowerShell)" -ForegroundColor Cyan
Write-Host "--------------------------------------------" -ForegroundColor Cyan
Write-Host "1. Check for Node.js and npm installation" -ForegroundColor Cyan
Write-Host "2. Install npm dependencies" -ForegroundColor Cyan
Write-Host "3. Initialize the database with sample data" -ForegroundColor Cyan
Write-Host "4. Start the server" -ForegroundColor Cyan
Write-Host "5. Open the application in your default web browser" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "If you see any errors during the setup, please read the README.md file carefully for guidance. Located in the same folder as this script." -ForegroundColor Red

Read-Host -Prompt "Press ENTER to start setup..."

Write-Host "It will start the setup in 2 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 2



Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Local Business Reviews - Setup Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
Write-Host "Working directory: $ScriptDir" -ForegroundColor Gray
Write-Host ""

# ============================================
# STEP 1: Check for Node.js
# ============================================
Write-Host "[1/6] Checking for Node.js..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js command failed"
    }
    Write-Host "Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Download the LTS version and run the installer." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation, restart your computer and run this script again." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}


Write-Host ""

# ============================================
# STEP 3: Check for package.json
# ============================================
Write-Host "[3/6] Checking project files..." -ForegroundColor Yellow

if (-not (Test-Path "package.json")) {
    Write-Host ""
    Write-Host "ERROR: package.json not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This script must be run from the FBLA project folder." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Project files found" -ForegroundColor Green
Write-Host ""

# ============================================
# STEP 4: Install Dependencies
# ============================================
Write-Host "[4/6] Installing npm dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

if (Test-Path "node_modules") {
    Write-Host "node_modules folder exists. Checking for updates..." -ForegroundColor Gray
} else {
    Write-Host "Installing dependencies for the first time..." -ForegroundColor Gray
}

Write-Host ""

try {
    & npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed with exit code $LASTEXITCODE"
    }
    Write-Host ""
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to install npm packages!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details: $_" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Check your internet connection" -ForegroundColor Yellow
    Write-Host "2. Try running PowerShell as Administrator" -ForegroundColor Yellow
    Write-Host "3. Delete node_modules folder and try again" -ForegroundColor Yellow
    Write-Host "4. Run: npm cache clean --force" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# ============================================
# STEP 5: Initialize Database
# ============================================
Write-Host "[5/6] Initializing database..." -ForegroundColor Yellow
Write-Host ""

# Create database folder if it doesn't exist
if (-not (Test-Path "database")) {
    New-Item -ItemType Directory -Path "database" | Out-Null
    Write-Host "Created database folder" -ForegroundColor Gray
}

if (Test-Path "database\reviews.db") {
    Write-Host "Database already exists: database\reviews.db" -ForegroundColor Green
    Write-Host "Keeping existing data..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "To reset with sample data, delete database\reviews.db and rerun this script." -ForegroundColor Gray
} else {
    Write-Host "Creating new database with sample data..." -ForegroundColor Gray
    Write-Host ""

    try {
        & npm run init-db
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Database initialization returned exit code $LASTEXITCODE" -ForegroundColor Yellow
            Write-Host "Continuing anyway..." -ForegroundColor Yellow
        } else {
            Write-Host "Database initialized with sample data!" -ForegroundColor Green
        }
    } catch {
        Write-Host "Warning: Database initialization encountered an issue: $_" -ForegroundColor Yellow
        Write-Host "Continuing anyway..." -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================
# STEP 6: Start Server and Open Browser
# ============================================
Write-Host "[6/6] Starting server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server URL: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Sample login credentials:" -ForegroundColor Yellow
Write-Host "  Email: john@example.com" -ForegroundColor White
Write-Host "  Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "To stop the server, press Ctrl+C in this window." -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Wait 2 seconds then open browser
Write-Host "Opening browser in 2 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Starting server now..." -ForegroundColor Green
Write-Host "If you see any errors during the setup, please read the README.md file carefully for guidance. Located in the same folder as this script." -ForegroundColor Red
Write-Host "For guidence of how to test and/or navigate the website please find the 'help' page within the website or find the 'Usage' section within the README.md" -ForegroundColor Yellow
Write-Host ""


# Start the server (this will block until Ctrl+C)
try {
    & npm start
} catch {
    Write-Host ""
    Write-Host "Server stopped or encountered an error." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Server has stopped" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
