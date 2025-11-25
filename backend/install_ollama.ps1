Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation d'Ollama" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Telechargement d'Ollama..." -ForegroundColor Yellow
$installerPath = "$env:TEMP\OllamaSetup.exe"
Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile $installerPath

Write-Host ""
Write-Host "Installation d'Ollama..." -ForegroundColor Yellow
Start-Process -FilePath $installerPath -Wait

Write-Host ""
Write-Host "Nettoyage..." -ForegroundColor Yellow
Remove-Item $installerPath

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Ollama installe avec succes!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Telechargement du modele qwen2.5:1.5b..." -ForegroundColor Yellow
ollama pull qwen2.5:1.5b

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Installation terminee!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pour demarrer Ollama: ollama serve" -ForegroundColor Cyan
Write-Host "Pour tester: ollama run qwen2.5:1.5b" -ForegroundColor Cyan
Write-Host ""
