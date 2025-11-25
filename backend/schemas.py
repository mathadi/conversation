from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    sender: str
    content: str
    timestamp: datetime
    suggestions: Optional[List[str]] = None
    
    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    mode: str = "user_initiated" # or "ai_initiated"
    title: Optional[str] = "New Conversation"

class ConversationResponse(BaseModel):
    id: int
    title: str
    mode: str
    created_at: datetime
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True
