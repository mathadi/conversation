"""
Script pour charger le modèle Qwen avec progression
"""
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from tqdm import tqdm
import sys

model_path = "./models/qwen2.5-1.5b-instruct"

print("=" * 60)
print("CHARGEMENT DU MODELE QWEN2.5-1.5B")
print("=" * 60)
print(f"\nChemin: {model_path}\n")

try:
    # Chargement du tokenizer
    print("1/2 Chargement du tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    print("✓ Tokenizer chargé\n")
    
    # Chargement du modèle
    print("2/2 Chargement du modèle (cela peut prendre quelques minutes)...")
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        dtype=torch.float32,
        low_cpu_mem_usage=True,
        device_map="cpu"
    )
    model.eval()
    print("✓ Modèle chargé\n")
    
    # Test rapide
    print("=" * 60)
    print("TEST DU MODELE")
    print("=" * 60)
    
    test_messages = [
        {
            "role": "system",
            "content": "Tu es un assistant IA serviable, amical et conversationnel. Réponds de manière naturelle et concise."
        },
        {
            "role": "user",
            "content": "Bonjour, comment vas-tu ?"
        }
    ]
    
    print("\nGénération d'une réponse test...")
    text = tokenizer.apply_chat_template(test_messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer([text], return_tensors="pt")
    
    outputs = model.generate(
        **inputs,
        max_new_tokens=50,
        temperature=0.7,
        do_sample=True
    )
    
    response = tokenizer.decode(outputs[0][len(inputs.input_ids[0]):], skip_special_tokens=True)
    
    print(f"\nQuestion: Bonjour, comment vas-tu ?")
    print(f"Réponse: {response}")
    
    print("\n" + "=" * 60)
    print("✓ MODELE PRET A ETRE UTILISE")
    print("=" * 60)
    print("\nVous pouvez maintenant démarrer le backend avec:")
    print("  python start_all.py")
    
except Exception as e:
    print(f"\n✗ ERREUR: {e}")
    sys.exit(1)
