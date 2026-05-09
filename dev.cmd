@echo off
setlocal
cd /d "%~dp0"

REM В терминале Cursor часто первым в PATH оказывается встроенный node без npm —
REM поднимаем стандартный Node.js для этой сессии.
if exist "%ProgramFiles%\nodejs\node.exe" (
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
)

npm run dev
