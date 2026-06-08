@echo off
cd /d "%~dp0"

:: Start Flask in background (minimized, no console window)
start /min "" ".venv\Scripts\python.exe" flask_server.py

:: Start Electron (waits for Flask via waitForFlask)
npm start