@echo off
setlocal

set "REPO=C:\konkourx"
set "SHIM=%TEMP%\konkourx-os-userinfo-shim.cjs"

if not exist "%REPO%\package.json" (
  echo.
  echo [ERROR] Project not found at %REPO%
  echo Edit REPO in this file if your project is elsewhere.
  pause
  exit /b 1
)

> "%SHIM%" (
  echo const os = require('node:os'^);
  echo try {
  echo   os.userInfo(^);
  echo } catch (err^) {
  echo   os.userInfo = function (^) {
  echo     const username = process.env.USERNAME ^|^| process.env.USER ^|^| 'local-user';
  echo     const homedir = process.env.USERPROFILE ^|^| process.env.HOME ^|^| process.cwd(^);
  echo     return {
  echo       uid: -1,
  echo       gid: -1,
  echo       username,
  echo       homedir,
  echo       shell: null
  echo     };
  echo   };
  echo }
)

echo Starting KonkourX API...
start "KonkourX API" powershell.exe -NoExit -ExecutionPolicy Bypass -Command ^
  "cd '%REPO%'; $env:NODE_OPTIONS='--require=%SHIM%'; pnpm.cmd --filter api dev"

timeout /t 3 /nobreak >nul

echo Starting Student Web...
start "KonkourX Student" powershell.exe -NoExit -ExecutionPolicy Bypass -Command ^
  "cd '%REPO%'; $env:VITE_API_URL='http://localhost:4000'; pnpm.cmd --filter student-web dev --host 127.0.0.1"

echo Starting Counselor Web...
start "KonkourX Counselor" powershell.exe -NoExit -ExecutionPolicy Bypass -Command ^
  "cd '%REPO%'; $env:VITE_API_URL='http://localhost:4000'; pnpm.cmd --filter counselor-web dev --host 127.0.0.1"

timeout /t 5 /nobreak >nul

echo Opening browser...
start "" "http://localhost:5173"
start "" "http://localhost:5174"

echo.
echo KonkourX launch commands were started.
echo.
echo Student:   http://localhost:5173
echo Counselor: http://localhost:5174
echo API:       http://localhost:4000
echo.
echo Student login:
echo   student.seed@konkourix.local
echo   konkourix-dev-password
echo.
echo Counselor login:
echo   counselor.seed@konkourix.local
echo   konkourix-dev-password
echo.
echo Keep the three PowerShell windows open while using the app.
echo Close them to stop the services.
echo.
pause
endlocal
