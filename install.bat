@echo off
title Intalando e executando TECH AI
cls

echo Instalando dependencias
winget install python
start activate_ambiente
python.exe -m pip install --upgrade pip
pip install google-generativeai
pip install Flask nltk
timeout /t 10 /nobreak >nul
cls 
echo Configurand API Gemini
set GOOGLE_API_KEY=AIzaSyBJ9nH-oCNQj9QIoHxsGIeO0QORydJSKpI
cls
echo Timer para abrir o navegador
start aba
cls
echo executando aplicacao no ambiente virtual
python app.py

echo Aperte CTRL + C 2X para parar o ambiente de execucao
