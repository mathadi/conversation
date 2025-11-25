from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List
from models import Conversation, Message
from schemas import ConversationCreate

class HistoryService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_conversation(self, conversation_data: ConversationCreate) -> Conversation:
        conversation = Conversation(
            title=conversation_data.title,
            mode=conversation_data.mode
        )
        self.session.add(conversation)
        await self.session.commit()
        await self.session.refresh(conversation)
        return conversation

    async def get_conversation(self, conversation_id: int) -> Conversation:
        statement = select(Conversation).options(selectinload(Conversation.messages)).where(Conversation.id == conversation_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def add_message(self, conversation_id: int, sender: str, content: str, suggestions: List[str] = None) -> Message:
        message = Message(
            conversation_id=conversation_id,
            sender=sender,
            content=content,
            suggestions=suggestions
        )
        self.session.add(message)
        await self.session.commit()
        await self.session.refresh(message)
        return message

    async def get_messages(self, conversation_id: int) -> List[Message]:
        statement = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.timestamp)
        result = await self.session.execute(statement)
        return result.scalars().all()

    async def list_conversations(self, skip: int = 0, limit: int = 100) -> List[Conversation]:
        statement = select(Conversation).options(selectinload(Conversation.messages)).offset(skip).limit(limit).order_by(Conversation.created_at.desc())
        result = await self.session.execute(statement)
        return result.scalars().all()
    
    async def delete_conversation(self, conversation_id: int):
        # Delete messages first
        statement = select(Message).where(Message.conversation_id == conversation_id)
        result = await self.session.execute(statement)
        messages = result.scalars().all()
        for msg in messages:
            await self.session.delete(msg)
        
        # Delete conversation
        statement = select(Conversation).where(Conversation.id == conversation_id)
        result = await self.session.execute(statement)
        conversation = result.scalar_one_or_none()
        if conversation:
            await self.session.delete(conversation)
            await self.session.commit()
    
    async def rename_conversation(self, conversation_id: int, title: str) -> Conversation:
        statement = select(Conversation).options(selectinload(Conversation.messages)).where(Conversation.id == conversation_id)
        result = await self.session.execute(statement)
        conversation = result.scalar_one_or_none()
        if conversation:
            conversation.title = title
            await self.session.commit()
            await self.session.refresh(conversation)
        return conversation
