@echo off
setlocal enabledelayedexpansion
set BASE_URL=http://localhost:5000/api

echo.
echo === 1. REGISTER TEST USER ===
curl -X POST %BASE_URL%/register -H "Content-Type: application/json" -d "{\"email\":\"test@user.com\",\"password\":\"pass123\"}"

echo.
echo === 2. LOGIN & GET TOKEN ===
curl -s -X POST %BASE_URL%/login -H "Content-Type: application/json" -d "{\"email\":\"test@user.com\",\"password\":\"pass123\"}" > response.json
for /f "tokens=*" %%i in ('jq -r ".access_token" response.json') do set JWT=%%i
del response.json

echo.
echo === 3. CREATE LISTING ===
curl -X POST %BASE_URL%/listings ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %JWT%" ^
  -d "{\"title\":\"Test Item\",\"price\":100}"

echo.
echo === 4. VERIFY DATA ===
sqlite3 database/nearbuy.db "SELECT id,email FROM users;"
sqlite3 database/nearbuy.db "SELECT id,title,price FROM listings;"
pause