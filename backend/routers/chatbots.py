from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from models.database import get_db, Chatbot

router = APIRouter()


class ChatbotCreate(BaseModel):
    name: str
    department: Optional[str] = ""
    description: Optional[str] = ""
    system_prompt: Optional[str] = ""
    llm_provider: Optional[str] = "claude"
    llm_model: Optional[str] = "claude-sonnet-4-5-20250929"
    api_key: Optional[str] = ""


class ChatbotUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    api_key: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("")
def list_chatbots(db: Session = Depends(get_db)):
    chatbots = db.query(Chatbot).order_by(Chatbot.created_at.desc()).all()
    return {
        "success": True,
        "data": [
            {
                "id": c.id,
                "name": c.name,
                "department": c.department,
                "description": c.description,
                "system_prompt": c.system_prompt,
                "llm_provider": c.llm_provider,
                "llm_model": c.llm_model,
                "is_active": c.is_active,
                "share_token": c.share_token,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "document_count": len(c.documents),
                "action_count": len(c.actions),
            }
            for c in chatbots
        ],
        "message": "Chatbots retrieved successfully",
    }


@router.get("/share/{share_token}")
def get_chatbot_by_share_token(share_token: str, db: Session = Depends(get_db)):
    chatbot = db.query(Chatbot).filter(Chatbot.share_token == share_token).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Shared chatbot not found")
    if not chatbot.is_active:
        raise HTTPException(status_code=403, detail="This chatbot is currently inactive")
    return {
        "success": True,
        "data": {
            "id": chatbot.id,
            "name": chatbot.name,
            "department": chatbot.department,
            "description": chatbot.description,
            "is_active": chatbot.is_active,
        },
        "message": "Shared chatbot retrieved successfully",
    }


@router.get("/{chatbot_id}")
def get_chatbot(chatbot_id: int, db: Session = Depends(get_db)):
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return {
        "success": True,
        "data": {
            "id": chatbot.id,
            "name": chatbot.name,
            "department": chatbot.department,
            "description": chatbot.description,
            "system_prompt": chatbot.system_prompt,
            "llm_provider": chatbot.llm_provider,
            "llm_model": chatbot.llm_model,
            "api_key": "***" if chatbot.api_key else "",
            "is_active": chatbot.is_active,
            "share_token": chatbot.share_token,
            "created_at": chatbot.created_at.isoformat() if chatbot.created_at else None,
            "documents": [
                {
                    "id": d.id,
                    "filename": d.filename,
                    "file_type": d.file_type,
                    "file_size": d.file_size,
                    "chunk_count": d.chunk_count,
                    "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
                }
                for d in chatbot.documents
            ],
            "actions": [
                {
                    "id": a.id,
                    "name": a.name,
                    "action_type": a.action_type,
                    "trigger_keywords": a.trigger_keywords,
                    "description": a.description,
                    "config": a.config,
                    "is_active": a.is_active,
                }
                for a in chatbot.actions
            ],
        },
        "message": "Chatbot retrieved successfully",
    }


@router.post("")
def create_chatbot(data: ChatbotCreate, db: Session = Depends(get_db)):
    chatbot = Chatbot(
        name=data.name,
        department=data.department,
        description=data.description,
        system_prompt=data.system_prompt,
        llm_provider=data.llm_provider,
        llm_model=data.llm_model,
        api_key=data.api_key,
    )
    db.add(chatbot)
    db.commit()
    db.refresh(chatbot)
    return {
        "success": True,
        "data": {"id": chatbot.id, "name": chatbot.name, "share_token": chatbot.share_token},
        "message": "Chatbot created successfully",
    }


@router.put("/{chatbot_id}")
def update_chatbot(chatbot_id: int, data: ChatbotUpdate, db: Session = Depends(get_db)):
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(chatbot, key, value)

    db.commit()
    db.refresh(chatbot)
    return {
        "success": True,
        "data": {"id": chatbot.id, "name": chatbot.name},
        "message": "Chatbot updated successfully",
    }


@router.delete("/{chatbot_id}")
def delete_chatbot(chatbot_id: int, db: Session = Depends(get_db)):
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    db.delete(chatbot)
    db.commit()
    return {
        "success": True,
        "data": None,
        "message": "Chatbot deleted successfully",
    }


@router.get("/providers/list")
def list_providers():
    providers = {
        "claude": {
            "name": "Anthropic Claude",
            "models": ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"],
            "requires_api_key": True,
        },
        "openai": {
            "name": "OpenAI GPT",
            "models": ["gpt-4o", "gpt-4o-mini"],
            "requires_api_key": True,
        },
        "gemini": {
            "name": "Google Gemini",
            "models": ["gemini-1.5-pro", "gemini-1.5-flash"],
            "requires_api_key": True,
        },
        "ollama": {
            "name": "Ollama (Local)",
            "models": ["llama3", "mistral", "gemma3"],
            "requires_api_key": False,
        },
        "groq": {
            "name": "Groq (Free)",
            "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"],
            "requires_api_key": True,
        },
    }
    return {"success": True, "data": providers, "message": "Providers retrieved successfully"}
