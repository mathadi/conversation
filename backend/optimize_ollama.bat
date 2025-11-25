@echo off
echo ============================================
echo OPTIMISATION OLLAMA POUR CPU
echo ============================================
echo.

set OLLAMA_PATH=C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama.exe

REM Configurer Ollama pour CPU lent
set OLLAMA_NUM_PARALLEL=1
set OLLAMA_MAX_LOADED_MODELS=1
set OLLAMA_FLASH_ATTENTION=0

echo Configuration appliquee:
echo - 1 modele en memoire max
echo - 1 requete a la fois
echo - Flash attention desactivee
echo.
echo Redemarrage d'Ollama...

taskkill /F /IM ollama.exe 2>nul
timeout /t 2 /nobreak >nul

start "" "%OLLAMA_PATH%" serve

echo.
echo Ollama optimise pour CPU!
echo Redemarrez le backend maintenant.
pause
