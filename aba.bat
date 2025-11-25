@echo off
title Esperando ambiente virtual
cls

echo Esperando ambiente virtual ficar on-line...
timeout /t 15 /nobreak >nul
cls
start "Tech AI Chatbot" /b "http://127.0.0.1:5000/" --new-tab
C:
exit