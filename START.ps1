# FinMentor Quick Start Script for PowerShell

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "    FinMentor - Setup & Start Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install from https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "`nSetting up backend..." -ForegroundColor Yellow
Set-Location backend

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✓ Backend dependencies already installed" -ForegroundColor Green
}

Write-Host "`nStarting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "`nSetting up frontend..." -ForegroundColor Yellow
Set-Location ..\frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✓ Frontend dependencies already installed" -ForegroundColor Green
}

Write-Host "`nStarting frontend development server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "    All servers are starting..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Frontend:  " -NoNewline
Write-Host "http://localhost:5173" -ForegroundColor Green
Write-Host "Backend:   " -NoNewline
Write-Host "http://localhost:5000" -ForegroundColor Green

Write-Host "`nMake sure to:" -ForegroundColor Yellow
Write-Host "1. Grant microphone permission to browser"
Write-Host "2. Update backend/.env with Agora credentials"
Write-Host "3. (Optional) Add OpenAI API key for AI responses`n"

pause
