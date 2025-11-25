from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List
from database import get_db
from schemas import ConversationCreate, ConversationResponse, MessageCreate, MessageResponse
from services.history_service import HistoryService
from services.chat_service_ollama import chat_service
from models import Conversation

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.post("/", response_model=ConversationResponse)
async def start_conversation(
    conversation_data: ConversationCreate,
    session: AsyncSession = Depends(get_db)
):
    history_service = HistoryService(session)
    conversation = await history_service.create_conversation(conversation_data)
    
    # If AI initiated, send a greeting
    if conversation.mode == "ai_initiated":
        greeting = "Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?"
        await history_service.add_message(conversation.id, "ai", greeting, None)
    
    # Refresh conversation to include messages
    conversation = await history_service.get_conversation(conversation.id)

    return conversation

@router.get("/", response_model=List[ConversationResponse])
async def list_conversations(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_db)
):
    history_service = HistoryService(session)
    return await history_service.list_conversations(skip, limit)

@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: int,
    session: AsyncSession = Depends(get_db)
):
    history_service = HistoryService(session)
    conversation = await history_service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    session: AsyncSession = Depends(get_db)
):
    history_service = HistoryService(session)
    conversation = await history_service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 1. Save user message
    user_message = await history_service.add_message(conversation_id, "user", message_data.content)

    # 2. Get history
    history = await history_service.get_messages(conversation_id)

    # 3. Generate AI response
    ai_content, suggestions = await chat_service.generate_response(history)

    # 4. Save AI message
    ai_message = await history_service.add_message(conversation_id, "ai", ai_content, suggestions)

    return ai_message

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    session: AsyncSession = Depends(get_db)
):
    history_service = HistoryService(session)
    conversation = await history_service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    await history_service.delete_conversation(conversation_id)
    return {"message": "Conversation supprimée"}

@router.patch("/{conversation_id}")
async def rename_conversation(
    conversation_id: int,
    title: str,
    session: AsyncSession = Depends(get_db)
):
    history_service = HistoryService(session)
    conversation = await history_service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    updated = await history_service.rename_conversation(conversation_id, title)
    return updated
