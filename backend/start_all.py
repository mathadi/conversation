import subprocess
import sys
import time

print("="*60)
print("DÉMARRAGE DES SERVEURS")
print("="*60)

# Démarrer Ollama
print("\n1. Démarrage d'Ollama...")
import os
ollama_path = os.path.join(os.path.expanduser("~"), "AppData", "Local", "Programs", "Ollama", "ollama.exe")

try:
    if os.path.exists(ollama_path):
        ollama_process = subprocess.Popen(
            [ollama_path, "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    else:
        ollama_process = subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    print("✓ Ollama démarré")
except FileNotFoundError:
    print("✗ Ollama non trouvé. Lance Ollama depuis le menu Démarrer")
    sys.exit(1)

time.sleep(2)

# Démarrer le backend
print("\n2. Démarrage du backend...")
print("   API: http://localhost:8000")
print("   Docs: http://localhost:8000/docs\n")

try:
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "main:app",
        "--reload",
        "--port", "8000"
    ])
except KeyboardInterrupt:
    print("\n\nArrêt des serveurs...")
    ollama_process.terminate()
    ollama_process.wait()
    print("Serveurs arrêtés")
