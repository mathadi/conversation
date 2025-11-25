from typing import List, Tuple, Optional
from models import Message
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor

class ChatService:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.model_path = "./models/qwen2.5-1.5b-instruct"
        self.loading = False
        self.executor = ThreadPoolExecutor(max_workers=1)
        
    def _load_model_sync(self):
        if self.model is None and not self.loading:
            self.loading = True
            try:
                from transformers import AutoModelForCausalLM, AutoTokenizer
                import torch
                
                print(f"Chargement du modèle depuis {self.model_path}...")
                print("Optimisation pour CPU en cours...")
                
                print("[1/4] Chargement du tokenizer...")
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
                print("[1/4] Tokenizer OK")
                
                print("[2/4] Chargement du modèle (peut prendre 2-5 min)...")
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_path,
                    low_cpu_mem_usage=True
                )
                print("[2/4] Modèle OK")
                
                print("[3/4] Mode évaluation...")
                self.model.eval()
                print("[3/4] Mode évaluation OK")
                
                print("[4/4] Désactivation des gradients...")
                for param in self.model.parameters():
                    param.requires_grad = False
                print("[4/4] Gradients désactivés")
                
                print("\n" + "="*50)
                print("MODELE CHARGE ET OPTIMISE!")
                print("="*50 + "\n")
            except Exception as e:
                print(f"Erreur chargement modèle: {e}")
                self.model = None
            finally:
                self.loading = False
    
    def _generate_sync(self, messages):
        import torch
        
        text = self.tokenizer.apply_chat_template(
            messages, 
            tokenize=False, 
            add_generation_prompt=True
        )
        
        inputs = self.tokenizer([text], return_tensors="pt", truncation=True, max_length=128)
        
        # Génération ultra-rapide pour CPU
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=30,  # Très court pour rapidité
                do_sample=False,  # Greedy = plus rapide
                pad_token_id=self.tokenizer.eos_token_id,
                use_cache=True
            )
        
        response = self.tokenizer.decode(
            outputs[0][len(inputs.input_ids[0]):], 
            skip_special_tokens=True
        )
        return response

    async def generate_response(self, history: List[Message]) -> Tuple[str, Optional[List[str]]]:
        try:
            # Charger le modèle si nécessaire
            if self.model is None and not self.loading:
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(self.executor, self._load_model_sync)
            
            # Si le modèle n'est pas encore chargé
            if self.model is None:
                return "Le modèle est en cours de chargement, veuillez réessayer dans quelques instants.", None
            
            # Préparer les messages avec prompt système
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
            
            # Générer la réponse dans un thread séparé
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(self.executor, self._generate_sync, messages)
            
            return response, None
            
        except Exception as e:
            import traceback
            print(f"Erreur génération: {e}")
            print(traceback.format_exc())
            return "Désolé, je rencontre des difficultés techniques.", None

chat_service = ChatService()

# Précharger le modèle au démarrage
import threading
import time

def preload_model():
    time.sleep(2)  # Attendre que le serveur soit prêt
    print("\n" + "="*60)
    print("DÉMARRAGE DU CHARGEMENT DU MODÈLE")
    print("="*60 + "\n")
    chat_service._load_model_sync()

preload_thread = threading.Thread(target=preload_model, daemon=True)
preload_thread.start()
