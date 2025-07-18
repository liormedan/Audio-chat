@echo off
echo Starting AudioChat frontend only...

:: Set working directory to the script location
cd /d "%~dp0"

:: Create a temporary HTML file that will set localStorage values
echo Creating temporary HTML file...
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo   ^<title^>Setting up AudioChat^</title^>
echo ^</head^>
echo ^<body^>
echo   ^<h1^>Setting up AudioChat...^</h1^>
echo   ^<script^>
echo     // Set the defaultPage to 'chats' in localStorage
echo     localStorage.setItem('defaultPage', 'chats'^);
echo     
echo     // Create a mock user for direct access
echo     const mockUser = {
echo       uid: "direct-access-user",
echo       email: "direct-access@example.com",
echo       displayName: "Direct Access User",
echo       photoURL: null
echo     };
echo     
echo     // Store the mock user in localStorage
echo     localStorage.setItem('directAccessUser', JSON.stringify^(mockUser^)^);
echo     
echo     // Set the database provider to Firebase
echo     localStorage.setItem('db_provider', 'firebase'^);
echo     
echo     // Close this window after setting localStorage values
echo     document.write^("^<p^>Setup complete! You can close this window.^</p^>"^);
echo   ^</script^>
echo ^</body^>
echo ^</html^>
) > setup-localStorage.html

:: Open the temporary HTML file to set localStorage values
echo Opening setup HTML file...
start setup-localStorage.html

:: Wait a moment for the user to see the setup page
echo Waiting for setup to complete...
timeout /t 3 /nobreak > nul

:: Start the frontend directly
echo Starting frontend server...
start cmd /c npm start

:: Wait for frontend to initialize
echo Waiting for frontend to initialize...
timeout /t 8 /nobreak > nul

:: Open the direct access URL
echo Opening AudioChat with direct access...
start http://localhost:3000/?authenticated=true

echo AudioChat is starting. Please wait...
echo You will be automatically logged in with direct access mode and the chat interface will open directly.