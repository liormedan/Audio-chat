@echo off
echo Starting AudioChat backend server...

REM Activate virtual environment
call env\Scripts\activate

REM Run the server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000