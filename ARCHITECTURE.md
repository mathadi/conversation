# Architecture du Projet

## 📁 Structure

```
conversation/
├── backend/                    # API FastAPI
│   ├── environments/
│   │   └── .env               # Configuration
│   ├── models/
│   │   └── qwen2.5-1.5b-instruct/  # Modèle IA (après téléchargement)
│   ├── routers/
│   │   └── chat.py            # Routes API conversations
│   ├── services/
│   │   ├── chat_service.py    # Service IA
│   │   └── history_service.py # Service base de données
│   ├── config.py              # Configuration app
│   ├── database.py            # Connexion PostgreSQL
│   ├── main.py                # Point d'entrée FastAPI
│   ├── models.py              # Modèles SQLModel
│   └── schemas.py             # Schémas Pydantic
│
└── frontend/                   # Interface React
    └── src/
        ├── App.tsx            # Composant principal
        └── App.css            # Styles

```

## 🔧 Architecture Technique

### Ports
- **8000** : Serveur Qwen (Transformers)
- **8001** : Backend FastAPI
- **5173** : Frontend React (Vite)
- **5432** : PostgreSQL

### Flux de données

```
Utilisateur (Frontend:5173)
    ↓
Backend FastAPI (8001)
    ↓
PostgreSQL (5432) + Serveur Qwen (8000)
```

## 🗄️ Base de données

### Tables

**Conversation**
- id (PK)
- title
- mode (user_initiated | ai_initiated)
- created_at
- messages (relation)

**Message**
- id (PK)
- conversation_id (FK)
- sender (user | ai)
- content
- timestamp
- suggestions (JSON)

## 🔄 API Endpoints

### Backend (Port 8001)

```
POST   /conversations              # Créer conversation
GET    /conversations              # Liste conversations
GET    /conversations/{id}         # Détails conversation
POST   /conversations/{id}/messages # Envoyer message
```

### Serveur Qwen (Port 8000)

```
POST   /v1/chat/completions        # Générer réponse IA
```

## 🚀 Démarrage

### 1. Base de données
```bash
# Créer la base PostgreSQL
createdb testconversation
```

### 2. Backend + Qwen
```bash
# Installer dépendances
pip install -r backend/requirements.txt
pip install -r requirements_qwen.txt

# Télécharger modèle
python download_qwen.py

# Démarrer serveurs
python serve_qwen_transformers.py
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## ⚙️ Configuration

### .env
```env
# Base de données
DATABASE_URL=postgresql+asyncpg://postgres:root@localhost:5432/testconversation

# Modèle IA
LLAMA_API_URL=http://localhost:8000/v1/chat/completions
LLAMA_MODEL=qwen2.5-1.5b
LLAMA_TIMEOUT=60
```

### Frontend
```typescript
const API_BASE = 'http://localhost:8001'
```

## 🔍 Vérifications

### ✅ Architecture correcte si :

1. **Base de données** : PostgreSQL sur port 5432
2. **Modèle téléchargé** : `backend/models/qwen2.5-1.5b-instruct/` existe
3. **Serveur Qwen** : Port 8000 accessible
4. **Backend FastAPI** : Port 8001 accessible
5. **Frontend** : Port 5173 accessible
6. **CORS** : Configuré pour permettre 5173 → 8001

### ❌ Problèmes potentiels :

1. **Port 8001 au lieu de 8000** : Frontend doit pointer vers 8001 ✅ (Corrigé)
2. **Modèle non téléchargé** : Exécuter `download_qwen.py`
3. **PostgreSQL non démarré** : Vérifier le service
4. **Dépendances manquantes** : Installer requirements

## 📊 Stack Technique

**Backend**
- FastAPI
- SQLModel + AsyncPG
- PostgreSQL
- Transformers (Hugging Face)
- PyTorch

**Frontend**
- React 19
- TypeScript
- Tailwind CSS v4
- Vite

**IA**
- Qwen2.5-1.5B-Instruct
- Transformers API
- Format OpenAI compatible
