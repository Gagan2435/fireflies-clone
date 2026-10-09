@echo off
echo Fireflies.ai clone: starting backend (8000) and frontend (3000)
cd /d "%~dp0backend"
python -m pip install -q -r requirements.txt
start "Fireflies API" cmd /k "python -m uvicorn app.main:app --reload --port 8000"
cd /d "%~dp0frontend"
if not exist node_modules call npm install
start "Fireflies Web" cmd /k "npm run dev"
echo Open http://localhost:3000  (API docs: http://localhost:8000/docs)
