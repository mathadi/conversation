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
                    "content": "Tu es un assistant IA. Réponds de manière concise et directe en français."
                }
            ]
            
            # Stratégie : garder tout le contexte mais de manière optimisée
            if len(history) > 8:
                # Garder les 2 premiers messages (contexte initial)
                for msg in history[:2]:
                    role = "user" if msg.sender == "user" else "assistant"
                    messages.append({"role": role, "content": msg.content})
                
                # Ajouter un résumé du milieu
                middle_count = len(history) - 8
                messages.append({
                    "role": "system",
                    "content": f"[{middle_count} messages précédents dans la conversation]"
                })
                
                # Garder les 6 derniers messages (contexte récent)
                for msg in history[-6:]:
                    role = "user" if msg.sender == "user" else "assistant"
                    messages.append({"role": role, "content": msg.content})
            else:
                # Conversation courte : tout envoyer
                for msg in history:
                    role = "user" if msg.sender == "user" else "assistant"
                    messages.append({"role": role, "content": msg.content})
            
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    self.api_url,
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 150,
                        "stream": False
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    return content, None
                else:
                    error_msg = f"Erreur Ollama {response.status_code}: {response.text}"
                    print(error_msg)
                    return "Désolé, je rencontre des difficultés techniques.", None
                    
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"\n{'='*60}")
            print(f"ERREUR GENERATION IA")
            print(f"{'='*60}")
            print(f"Exception: {e}")
            print(f"Type: {type(e).__name__}")
            print(f"\nTraceback:")
            print(error_trace)
            print(f"{'='*60}\n")
            return f"Erreur technique: {type(e).__name__}", None

chat_service = ChatServiceOllama()
