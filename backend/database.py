import os
from pathlib import Path
from typing import AsyncGenerator

import psycopg2
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Charger les variables d'environnement
BASE_DIR = Path(__file__).resolve().parent.parent
# environments is in backend/environments, so we use parent of this file (backend)
ENV_DIR = Path(__file__).resolve().parent / "environments"
ENV_FILE = os.getenv("ENV_FILE", ".env")
load_dotenv(ENV_DIR / ENV_FILE)
print(f"Chargement .env depuis: {ENV_DIR / ENV_FILE}")

# Déclaration de la base de données
Base = declarative_base() 

# Configuration de la base de données
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL manquant dans l'environnement. Vérifiez votre fichier .env.*")

# Variables pour la création de la base de données
PG_CONFIG = {
    "user": os.getenv("PGUSER", "postgres"),
    "password": os.getenv("PGPASSWORD", ""),
    "host": os.getenv("PGHOST", "localhost"),
    "port": os.getenv("PGPORT", "5432"),
    "dbname": os.getenv("PGDATABASE", "testconversation")
}

def create_database_if_not_exists() -> None:
    """Crée la base de données si elle n'existe pas."""
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=PG_CONFIG["user"], 
            password=PG_CONFIG["password"],
            host=PG_CONFIG["host"],
            port=PG_CONFIG["port"]
        )
        conn.autocommit = True
        
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s", 
                (PG_CONFIG["dbname"],)
            )
            if not cur.fetchone():
                cur.execute(f"CREATE DATABASE {PG_CONFIG['dbname']}")
                print(f"Base '{PG_CONFIG['dbname']}' creee")
            else:
                print(f"La base '{PG_CONFIG['dbname']}' existe deja")
                
    except Exception as e:
        print(f"Erreur lors de la verification/creation de la base : {e}")
    finally:
        if 'conn' in locals():
            conn.close()

def get_engine():
    """Crée et retourne l'engine SQLAlchemy asynchrone."""
    create_database_if_not_exists()
    return create_async_engine(DATABASE_URL, echo=True)

# Initialisation de l'engine
engine = get_engine()

# Configuration de la session asynchrone
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Alias pour la rétrocompatibilité
async_session_maker = AsyncSessionLocal

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dépendance FastAPI pour obtenir une session de base de données."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Alias pour la compatibilité avec l'ancien code
get_session = get_db

def get_db_connection():
    """Retourne une connexion synchrone à la base de données PostgreSQL."""
    return psycopg2.connect(
        dbname=PG_CONFIG["dbname"],
        user=PG_CONFIG["user"], 
        password=PG_CONFIG["password"],
        host=PG_CONFIG["host"],
        port=PG_CONFIG["port"]
    )
