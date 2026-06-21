@echo off
echo ==========================================
echo Starting Work - Pulling Latest Changes...
echo ==========================================
git pull origin main
echo.
echo Running npm install...
call npm install
echo.
echo ==========================================
echo Workspace is up to date! Happy coding!
echo ==========================================
pause