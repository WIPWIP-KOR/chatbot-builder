from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from models.database import get_db, Action, ActionSubmission, Chatbot

router = APIRouter()


class ActionCreate(BaseModel):
    chatbot_id: int
    name: str
    action_type: str  # SHOW_FORM, SHOW_GUIDE, REDIRECT, NOTIFY
    trigger_keywords: Optional[str] = ""
    description: Optional[str] = ""
    config: Optional[dict] = {}
    is_active: Optional[bool] = True


class ActionUpdate(BaseModel):
    name: Optional[str] = None
    action_type: Optional[str] = None
    trigger_keywords: Optional[str] = None
    description: Optional[str] = None
    config: Optional[dict] = None
    is_active: Optional[bool] = None


class ActionSubmissionCreate(BaseModel):
    chatbot_id: int
    action_id: int
    session_id: str
    form_data: dict


@router.get("/{chatbot_id}")
def list_actions(chatbot_id: int, db: Session = Depends(get_db)):
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    actions = db.query(Action).filter(Action.chatbot_id == chatbot_id).all()
    return {
        "success": True,
        "data": [
            {
                "id": a.id,
                "chatbot_id": a.chatbot_id,
                "name": a.name,
                "action_type": a.action_type,
                "trigger_keywords": a.trigger_keywords,
                "description": a.description,
                "config": a.config,
                "is_active": a.is_active,
            }
            for a in actions
        ],
        "message": "Actions retrieved successfully",
    }


@router.post("")
def create_action(data: ActionCreate, db: Session = Depends(get_db)):
    chatbot = db.query(Chatbot).filter(Chatbot.id == data.chatbot_id).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    action = Action(
        chatbot_id=data.chatbot_id,
        name=data.name,
        action_type=data.action_type,
        trigger_keywords=data.trigger_keywords,
        description=data.description,
        config=data.config,
        is_active=data.is_active,
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    return {
        "success": True,
        "data": {"id": action.id, "name": action.name},
        "message": "Action created successfully",
    }


@router.put("/{action_id}")
def update_action(action_id: int, data: ActionUpdate, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(action, key, value)

    db.commit()
    db.refresh(action)
    return {
        "success": True,
        "data": {"id": action.id, "name": action.name},
        "message": "Action updated successfully",
    }


@router.delete("/{action_id}")
def delete_action(action_id: int, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    db.delete(action)
    db.commit()
    return {
        "success": True,
        "data": None,
        "message": "Action deleted successfully",
    }


@router.post("/submit")
def submit_action(data: ActionSubmissionCreate, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == data.action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    submission = ActionSubmission(
        chatbot_id=data.chatbot_id,
        action_id=data.action_id,
        session_id=data.session_id,
        form_data=data.form_data,
        status="completed",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return {
        "success": True,
        "data": {
            "id": submission.id,
            "status": submission.status,
            "form_data": submission.form_data,
        },
        "message": "Action submitted successfully",
    }


@router.get("/submissions/{chatbot_id}")
def list_submissions(chatbot_id: int, db: Session = Depends(get_db)):
    submissions = (
        db.query(ActionSubmission)
        .filter(ActionSubmission.chatbot_id == chatbot_id)
        .order_by(ActionSubmission.created_at.desc())
        .all()
    )
    return {
        "success": True,
        "data": [
            {
                "id": s.id,
                "action_id": s.action_id,
                "session_id": s.session_id,
                "form_data": s.form_data,
                "status": s.status,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in submissions
        ],
        "message": "Submissions retrieved successfully",
    }
