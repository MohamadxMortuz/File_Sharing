Write-Host "🚀 Starting Secure File Sharing System..." -ForegroundColor Cyan

# Check MongoDB
Write-Host "🔍 Checking MongoDB..." -ForegroundColor Yellow
$mongoRunning = Get-Process mongod -ErrorAction SilentlyContinue
if (-not $mongoRunning) {
    Write-Host "⚠️  MongoDB not running. Attempting to start..." -ForegroundColor Red
    try {
        Start-Process mongod -WindowStyle Hidden
        Start-Sleep -Seconds 2
        Write-Host "✅ MongoDB started" -ForegroundColor Green
    } catch {
        Write-Host "❌ Could not start MongoDB. Please start it manually or use MongoDB Atlas." -ForegroundColor Red
        Write-Host "   Run: mongod" -ForegroundColor Yellow
        exit
    }
} else {
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
}

# Start Backend
Write-Host "📦 Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm install; npm start"

# Wait a bit for backend to initialize
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🎨 Starting frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm install; npm start"

Write-Host "`n✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
