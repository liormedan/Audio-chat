@echo off
echo Activating virtual environment...
call %~dp0env\Scripts\activate.bat

echo Installing required packages...
pip install -r %~dp0requirements.txt

echo Setup complete! You can now run the backend server with:
echo python %~dp0main.py