@echo off
title LoMMuS
echo "Warning: This batch script may not work as expected!"
:start
choice /c:CN /n /m "LoMMuS will (re)start in 1 second. Press N to restart Now, or C to exit" /t:1 /d:N
if errorlevel 2 (
node lommus.js) else goto start
GOTO start
