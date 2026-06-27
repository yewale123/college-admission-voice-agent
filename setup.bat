@echo off
echo ============================================
echo  College Admission Voice Agent - Setup
echo ============================================
echo.

REM --- Backend Setup ---
echo [1/4] Setting up Python virtual environment...
cd /d "%~dp0backend"
python -m venv .venv
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.9+
    pause
    exit /b 1
)
echo    Virtual environment created in backend\.venv

echo.
echo [2/4] Installing Python dependencies (this may take 5-10 minutes)...
.venv\Scripts\python.exe -m pip install --upgrade pip -q
.venv\Scripts\pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)
echo    Python dependencies installed!

REM --- Frontend Setup ---
echo.
echo [3/4] Installing Node.js dependencies...
cd /d "%~dp0frontend"
npm install
if errorlevel 1 (
    echo ERROR: npm install failed. Make sure Node.js is installed.
    pause
    exit /b 1
)
echo    Frontend dependencies installed!

echo.
echo [4/4] Setup complete!
echo.
echo ============================================
echo  NEXT STEPS:
echo ============================================
echo.
echo 1. Edit backend\.env and set:
echo    - GEMINI_API_KEY  (get free at https://aistudio.google.com/app/apikey)
echo    - DB_PASSWORD     (your MySQL root password)
echo.
echo 2. Start MySQL and make sure it is running
echo.
echo 3. Run start_backend.bat  (in one terminal)
echo 4. Run start_frontend.bat (in another terminal)
echo.
echo 5. Open http://localhost:5173 in Chrome browser
echo.
echo NOTE: Voice features work best in Google Chrome
echo ============================================
pause
