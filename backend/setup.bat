@echo off
echo Setting up AudioChat backend...

REM Create virtual environment if it doesn't exist
if not exist env (
    echo Creating virtual environment...
    python -m venv env
)

REM Activate virtual environment
call env\Scripts\activate

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo Please edit the .env file with your configuration
)

echo Setup complete!
echo To start the server, run: run.bat