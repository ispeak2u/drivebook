@echo off
echo ==========================================
echo Saving Work - Pushing Changes to GitHub...
echo ==========================================
echo.
set /p msg="Enter commit message (or press Enter for default): "
if "%msg%"=="" set msg=Update on %date% %time%
echo.
echo Adding changes...
git add .
echo.
echo Committing changes...
git commit -m "%msg%"
echo.
echo Pushing to GitHub...
git push origin main
echo.
echo ==========================================
echo Work saved and pushed successfully!
echo ==========================================
pause