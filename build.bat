@echo off
echo ===================================
echo     Termix Build Script
echo ===================================

echo.
echo [1] Build Windows (Portable)
echo [2] Build Linux (AppImage + DEB)
echo [3] Build All (Windows + Linux)
echo.

set /p choice="Chon nen tang muon build (1-3): "

if "%choice%"=="1" (
    echo Dang build cho Windows...
    npm run build:win
    goto end
)

if "%choice%"=="2" (
    echo Dang build cho Linux...
    npm run build:linux
    goto end
)

if "%choice%"=="3" (
    echo Dang build cho ca Windows va Linux...
    npm run build:win
    npm run build:linux
    goto end
)

echo Lua chon khong hop le!

:end
echo.
echo Hoan tat!
pause
