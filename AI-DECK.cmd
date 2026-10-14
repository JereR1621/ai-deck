@echo off
rem Doble clic para abrir AI DECK.
cd /d "%~dp0"
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0"
