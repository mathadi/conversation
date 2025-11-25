@echo off
echo ========================================
echo Telechargement du modele Qwen2.5:1.5b
echo ========================================
echo.

ollama pull qwen2.5:1.5b

echo.
echo ========================================
echo Modele telecharge avec succes!
echo ========================================
echo.
echo Pour tester: ollama run qwen2.5:1.5b
echo.
pause
