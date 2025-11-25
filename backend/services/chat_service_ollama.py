from typing import List, Tuple, Optional
from models import Message
import httpx

class ChatServiceOllama:
    def __init__(self):
        self.api_url = "http://localhost:11434/v1/chat/completions"
        self.model = "qwen2.5:1.5b"
        
    async def generate_response(self, history: List[Message]) -> Tuple[str, Optional[List[str]]]:
        try:
            messages = [
                {
                    "role": "system",
                    "content": """Tu es un assistant IA intelligent, amical et naturel. 

Ton rôle :
- Réponds de manière conversationnelle et humaine
- Sois concis mais complet dans tes réponses
- Adapte ton ton à celui de l'utilisateur (formel/informel)
- Pose des questions de clarification si nécessaire
- Donne des exemples concrets quand c'est utile
- Sois proactif et propose des solutions

Style de communication :
- Utilise un langage naturel et fluide
- Évite les formulations robotiques
- Montre de l'empathie et de la compréhension
- Sois direct et va à l'essentiel

Réponds toujours en français de manière claire et engageante."""
                }
            ]
            
            for msg in history:
                role = "user" if msg.sender == "user" else "assistant"
                messages.append({"role": role, "content": msg.content})
            
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    self.api_url,
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 500
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    return content, None
                else:
                    print(f"Erreur Ollama: {response.status_code}")
                    return "Désolé, je rencontre des difficultés techniques.", None
                    
        except Exception as e:
            import traceback
            print(f"Erreur génération: {e}")
            print(traceback.format_exc())
            return f"Erreur: {str(e)}", None

chat_service = ChatServiceOllama()
