@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

:: 🧭 נווט ל־Audio-chat אם לא שם
IF NOT EXIST Audio-chat\backend (
    echo ❌ backend folder not found at Audio-chat\backend
    pause
    exit /b
)

IF NOT EXIST Audio-chat\backend\.venv\Scripts\activate (
    echo ⚠️ No virtual environment found. Please run setup.bat first.
    pause
    exit /b
)

:: ✅ Start Backend
start "AudioChat Backend" cmd /k "cd Audio-chat\backend && call ..\.venv\Scripts\activate && uvicorn main:app --reload"

:: ✅ Start Frontend
start "AudioChat Frontend" cmd /k "cd Audio-chat && npm start"

echo ✅ All servers launched in separate terminals.
pause

