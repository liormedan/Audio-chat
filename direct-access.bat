@echo off
echo Starting AudioChat with direct access...

:: Set working directory to the script location
cd /d "%~dp0"

:: Check if backend is running
powershell -Command "& {try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/health' -Method GET -TimeoutSec 2; if ($response.StatusCode -eq 200) { Write-Host 'Backend is already running.' } } catch { Write-Host 'Starting backend server...'; Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd backend && python main.py' -WindowStyle Normal }}"

:: Wait a moment for backend to initialize
echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

:: Check if frontend is running
powershell -Command "& {try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -Method GET -TimeoutSec 2; if ($response.StatusCode -eq 200) { Write-Host 'Frontend is already running.' } } catch { Write-Host 'Starting frontend server...'; Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npm start' -WindowStyle Normal }}"

:: Wait a moment for frontend to initialize
echo Waiting for frontend to initialize...
timeout /t 5 /nobreak > nul

:: Open the direct access URL
echo Opening AudioChat with direct access...
start http://localhost:3000/direct-access.html

echo AudioChat is starting. Please wait...
echo You will be automatically logged in with your Google account.