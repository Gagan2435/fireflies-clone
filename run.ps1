# Fireflies.ai clone: starts backend (8000) and frontend (3000) in separate windows.
$root = $PSScriptRoot
Push-Location "$root\backend"; python -m pip install -q -r requirements.txt; Pop-Location
Start-Process cmd.exe -ArgumentList "/k cd /d `"$root\backend`" && python -m uvicorn app.main:app --reload --port 8000"
if (-not (Test-Path "$root\frontend\node_modules")) { Push-Location "$root\frontend"; npm install; Pop-Location }
Start-Process cmd.exe -ArgumentList "/k cd /d `"$root\frontend`" && npm run dev"
Write-Host "Open http://localhost:3000  (API docs: http://localhost:8000/docs)"
