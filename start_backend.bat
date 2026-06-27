@echo off
echo Starting College Admission Voice Agent Backend...
echo.
cd /d "%~dp0backend"
if not exist ".venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found. Run setup first.
    pause
    exit /b 1
)
call .venv\Scripts\activate.bat
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
