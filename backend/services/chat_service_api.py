from typing import List, Tuple, Optional
from models import Message
import httpx

class ChatServiceAPI:
    def __init__(self):
        # Utilise Groq (gratuit et rapide) ou OpenAI
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.api_key = "VOTRE_CLE_API_GROQ"  # Obtenir sur https://console.groq.com
        self.model = "llama-3.1-8b-instant"
        
    async def generate_response(self, history: List[Message]) -> Tuple[str, Optional[List[str]]]:
        try:
            messages = [
                {
                    "role": "system",
                    "content": "Tu es un assistant IA serviable, amical et conversationnel. Réponds de manière naturelle, comme dans une vraie conversation. Sois concis mais utile. Adapte-toi au contexte et au ton de l'utilisateur."
                }
            ]
            
            for msg in history:
                role = "user" if msg.sender == "user" else "assistant"
                messages.append({"role": role, "content": msg.content})
            
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
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
                    print(f"Erreur API: {response.status_code}")
                    return "Désolé, je rencontre des difficultés techniques.", None
                    
        except Exception as e:
            print(f"Erreur génération: {e}")
            return "Désolé, je rencontre des difficultés techniques.", None

chat_service = ChatServiceAPI()
