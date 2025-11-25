import asyncio
from datetime import datetime, timedelta
from sqlmodel import SQLModel
from database import engine, AsyncSessionLocal
from models import Conversation, Message

async def create_fake_conversations():
    """Crée des conversations avec des messages fictifs"""
    
    # Créer les tables si elles n'existent pas
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        # Conversation 1: Support technique
        conv1 = Conversation(
            title="Problème de connexion",
            mode="user_initiated",
            created_at=datetime.now() - timedelta(days=2)
        )
        session.add(conv1)
        await session.commit()
        await session.refresh(conv1)
        
        messages1 = [
            Message(conversation_id=conv1.id, sender="user", content="Bonjour, j'ai un problème de connexion à mon compte", timestamp=datetime.now() - timedelta(days=2)),
            Message(conversation_id=conv1.id, sender="ai", content="Bonjour ! Je vais vous aider. Pouvez-vous me décrire le problème plus précisément ?", timestamp=datetime.now() - timedelta(days=2) + timedelta(minutes=1)),
            Message(conversation_id=conv1.id, sender="user", content="Je n'arrive pas à me connecter, ça dit mot de passe incorrect", timestamp=datetime.now() - timedelta(days=2) + timedelta(minutes=2)),
            Message(conversation_id=conv1.id, sender="ai", content="Avez-vous essayé de réinitialiser votre mot de passe ? Je peux vous guider dans cette démarche.", timestamp=datetime.now() - timedelta(days=2) + timedelta(minutes=3))
        ]
        
        # Conversation 2: IA initiée
        conv2 = Conversation(
            title="Conversation IA",
            mode="ai_initiated",
            created_at=datetime.now() - timedelta(days=1)
        )
        session.add(conv2)
        await session.commit()
        await session.refresh(conv2)
        
        messages2 = [
            Message(conversation_id=conv2.id, sender="ai", content="Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?", timestamp=datetime.now() - timedelta(days=1)),
            Message(conversation_id=conv2.id, sender="user", content="Salut ! Peux-tu m'expliquer comment fonctionne l'intelligence artificielle ?", timestamp=datetime.now() - timedelta(days=1) + timedelta(minutes=5)),
            Message(conversation_id=conv2.id, sender="ai", content="Bien sûr ! L'IA fonctionne en analysant des données pour apprendre des modèles et faire des prédictions. Voulez-vous que j'entre dans les détails ?", timestamp=datetime.now() - timedelta(days=1) + timedelta(minutes=6))
        ]
        
        # Conversation 3: Programmation
        conv3 = Conversation(
            title="Aide Python",
            mode="user_initiated",
            created_at=datetime.now() - timedelta(hours=3)
        )
        session.add(conv3)
        await session.commit()
        await session.refresh(conv3)
        
        messages3 = [
            Message(conversation_id=conv3.id, sender="user", content="Comment créer une liste en Python ?", timestamp=datetime.now() - timedelta(hours=3)),
            Message(conversation_id=conv3.id, sender="ai", content="En Python, vous pouvez créer une liste avec des crochets : ma_liste = [1, 2, 3] ou ma_liste = []", timestamp=datetime.now() - timedelta(hours=3) + timedelta(minutes=1)),
            Message(conversation_id=conv3.id, sender="user", content="Et comment ajouter un élément ?", timestamp=datetime.now() - timedelta(hours=3) + timedelta(minutes=2)),
            Message(conversation_id=conv3.id, sender="ai", content="Utilisez la méthode append() : ma_liste.append('nouvel_element')", timestamp=datetime.now() - timedelta(hours=3) + timedelta(minutes=3))
        ]
        
        # Ajouter tous les messages
        for messages in [messages1, messages2, messages3]:
            for msg in messages:
                session.add(msg)
        
        await session.commit()
        print("✅ 3 conversations avec messages fictifs créées !")

if __name__ == "__main__":
    asyncio.run(create_fake_conversations())