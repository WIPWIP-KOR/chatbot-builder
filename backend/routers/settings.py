from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict
from models.database import get_db, ApiKeySetting

router = APIRouter()


class ApiKeyUpdate(BaseModel):
    provider: str
    api_key: str


class ApiKeyBulkUpdate(BaseModel):
    keys: Dict[str, str]  # {"claude": "sk-...", "openai": "sk-..."}


@router.get("/api-keys")
def get_api_keys(db: Session = Depends(get_db)):
    """Get all saved API keys (masked)."""
    settings = db.query(ApiKeySetting).all()
    data = {}
    for s in settings:
        if s.api_key:
            masked = s.api_key[:8] + "..." + s.api_key[-4:] if len(s.api_key) > 12 else "****"
            data[s.provider] = {
                "is_set": True,
                "masked_key": masked,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            }
    return {"success": True, "data": data, "message": "API keys retrieved"}


@router.put("/api-keys")
def update_api_keys(data: ApiKeyBulkUpdate, db: Session = Depends(get_db)):
    """Update multiple API keys at once."""
    updated = []
    for provider, api_key in data.keys.items():
        if provider not in ("claude", "openai", "gemini"):
            continue

        setting = db.query(ApiKeySetting).filter(ApiKeySetting.provider == provider).first()
        if api_key:
            if setting:
                setting.api_key = api_key
            else:
                setting = ApiKeySetting(provider=provider, api_key=api_key)
                db.add(setting)
            updated.append(provider)
        elif setting:
            db.delete(setting)
            updated.append(provider)

    db.commit()
    return {
        "success": True,
        "data": {"updated": updated},
        "message": "API keys updated successfully",
    }


@router.delete("/api-keys/{provider}")
def delete_api_key(provider: str, db: Session = Depends(get_db)):
    """Delete a specific API key."""
    setting = db.query(ApiKeySetting).filter(ApiKeySetting.provider == provider).first()
    if not setting:
        raise HTTPException(status_code=404, detail="API key not found for this provider")

    db.delete(setting)
    db.commit()
    return {"success": True, "data": None, "message": f"API key for {provider} deleted"}


def get_api_key_for_provider(provider: str, db: Session) -> Optional[str]:
    """Helper: get API key from DB settings for a provider."""
    setting = db.query(ApiKeySetting).filter(ApiKeySetting.provider == provider).first()
    return setting.api_key if setting else None
