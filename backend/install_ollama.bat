@echo off
echo ========================================
echo Installation d'Ollama
echo ========================================
echo.

echo Telechargement d'Ollama...
powershell -Command "Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile '%TEMP%\OllamaSetup.exe'"

echo.
echo Installation d'Ollama...
start /wait %TEMP%\OllamaSetup.exe

echo.
echo Nettoyage...
del %TEMP%\OllamaSetup.exe

echo.
echo ========================================
echo Ollama installe avec succes!
echo ========================================
echo.
echo Telechargement du modele qwen2.5:1.5b...
ollama pull qwen2.5:1.5b

echo.
echo ========================================
echo Installation terminee!
echo ========================================
echo.
echo Pour demarrer Ollama: ollama serve
echo Pour tester: ollama run qwen2.5:1.5b
echo.
pause
