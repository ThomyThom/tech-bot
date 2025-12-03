@echo off
title Intalando e executando TECH AI
cls

echo Instalando dependencias
winget install python
python.exe -m pip install --upgrade pip
pip install google-generativeai
pip install Flask nltk
start activate_ambiente
timeout /t 10 /nobreak >nul
cls 
:Menu
echo Configurando API Gemini
echo É necessário uma Chave de API para concluir a ativação do ChatBot
echo Acesse https://aistudio.google.com/ para adquirir uma API gratuitamente
echo.
echo Digite 1 para abrir o site e adquirir uma API key.
echo.

set /p GOOGLE_API_KEY="Digite sua API KEY: "

if "%GOOGLE_API_KEY%"=="1" goto API

:API
start "Tech AI Chatbot" /b "https://aistudio.google.com/" --new-tab
goto Menu

cls
echo Timer para abrir o navegador
start aba
cls
echo executando aplicacao no ambiente virtual
python app.py

echo Aperte CTRL + C 2X para parar o ambiente de execucao

