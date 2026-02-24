import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from models.database import get_db, Conversation
from services.chat_service import process_chat

router = APIRouter()


class ChatRequest(BaseModel):
    chatbot_id: int
    message: str
    session_id: Optional[str] = None


@router.post("")
async def send_message(data: ChatRequest, db: Session = Depends(get_db)):
    session_id = data.session_id or str(uuid.uuid4())

    try:
        result = await process_chat(
            chatbot_id=data.chatbot_id,
            message=data.message,
            session_id=session_id,
            db=db,
        )
        return {
            "success": True,
            "data": result,
            "message": "Message processed successfully",
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@router.get("/history/{chatbot_id}/{session_id}")
def get_chat_history(chatbot_id: int, session_id: str, db: Session = Depends(get_db)):
    conversations = (
        db.query(Conversation)
        .filter(
            Conversation.chatbot_id == chatbot_id,
            Conversation.session_id == session_id,
        )
        .order_by(Conversation.created_at.asc())
        .all()
    )
    return {
        "success": True,
        "data": [
            {
                "id": c.id,
                "role": c.role,
                "content": c.content,
                "action_data": c.action_data,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in conversations
        ],
        "message": "Chat history retrieved successfully",
    }


@router.get("/sessions/{chatbot_id}")
def get_sessions(chatbot_id: int, db: Session = Depends(get_db)):
    """Get unique sessions for a chatbot."""
    sessions = (
        db.query(Conversation.session_id)
        .filter(Conversation.chatbot_id == chatbot_id)
        .distinct()
        .all()
    )
    return {
        "success": True,
        "data": [s[0] for s in sessions],
        "message": "Sessions retrieved successfully",
    }
