# Backend - API Chat IA

## Installation

### 1. Dépendances Python
```bash
pip install -r requirements.txt
pip install transformers torch
```

### 2. Base de données PostgreSQL
```bash
createdb testconversation
```

### 3. Télécharger le modèle Qwen (si pas déjà fait)
```bash
python download_qwen.py
```

## Configuration

Fichier `environments/.env` :
```env
DATABASE_URL=postgresql+asyncpg://postgres:root@localhost:5432/testconversation
LLAMA_API_URL=http://localhost:8000/v1/chat/completions
LLAMA_MODEL=qwen2.5-1.5b
```

## Démarrage

```bash
python start_all.py
```

Ou directement :
```bash
uvicorn main:app --reload --port 8000
```

## API

- **Docs** : http://localhost:8000/docs
- **Base** : http://localhost:8000

### Endpoints

```
POST   /conversations              # Créer conversation
GET    /conversations              # Liste conversations
GET    /conversations/{id}         # Détails
POST   /conversations/{id}/messages # Envoyer message
```

## Structure

```
backend/
├── environments/
│   └── .env                    # Configuration
├── models/
│   └── qwen2.5-1.5b-instruct/  # Modèle IA
├── routers/
│   └── chat.py                 # Routes API
├── services/
│   ├── chat_service.py         # Service IA
│   └── history_service.py      # Service DB
├── config.py                   # Config app
├── database.py                 # Connexion DB
├── main.py                     # Point d'entrée
├── models.py                   # Modèles SQLModel
└── schemas.py                  # Schémas Pydantic
```
