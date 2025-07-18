@echo off
echo Starting AudioChat with direct access...

:: Check if backend is running
powershell -Command "& {try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/health' -Method GET -TimeoutSec 2; if ($response.StatusCode -eq 200) { Write-Host 'Backend is already running.' } } catch { Write-Host 'Starting backend server...'; Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd ..\backend && python main.py' -WindowStyle Normal }}"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Start the frontend with direct access
start http://localhost:3000/?direct=true

echo AudioChat is starting. Please wait...