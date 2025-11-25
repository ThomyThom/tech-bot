@echo off
title Ativando ambiente virtual
cls

echo Instalando venv
python -m venv venv
cls 
echo Ativando o venv
venv\Scripts\activate
cls
exit