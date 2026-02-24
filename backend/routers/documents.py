import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from models.database import get_db, Document, Chatbot
from services.rag_service import (
    parse_document,
    add_document_to_vectordb,
    delete_document_from_vectordb,
    UPLOAD_DIR,
)

router = APIRouter()

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}


def _get_file_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


@router.post("/upload")
async def upload_document(
    chatbot_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validate chatbot exists
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    # Validate file type
    file_ext = _get_file_extension(file.filename)
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Save file to disk
    chatbot_upload_dir = os.path.join(UPLOAD_DIR, str(chatbot_id))
    os.makedirs(chatbot_upload_dir, exist_ok=True)
    file_path = os.path.join(chatbot_upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    try:
        # Parse document
        text = parse_document(file_path, file_ext)

        # Create DB record
        document = Document(
            chatbot_id=chatbot_id,
            filename=file.filename,
            file_type=file_ext,
            file_size=file_size,
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        # Add to vector DB
        chunk_count = add_document_to_vectordb(chatbot_id, document.id, text)
        document.chunk_count = chunk_count
        db.commit()

        return {
            "success": True,
            "data": {
                "id": document.id,
                "filename": document.filename,
                "file_type": document.file_type,
                "file_size": document.file_size,
                "chunk_count": chunk_count,
            },
            "message": "Document uploaded and processed successfully",
        }
    except Exception as e:
        # Clean up file on failure
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove from vector DB
    delete_document_from_vectordb(document.chatbot_id, document.id)

    # Remove file from disk
    file_path = os.path.join(UPLOAD_DIR, str(document.chatbot_id), document.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    # Remove DB record
    db.delete(document)
    db.commit()

    return {
        "success": True,
        "data": None,
        "message": "Document deleted successfully",
    }


@router.get("/{chatbot_id}")
def list_documents(chatbot_id: int, db: Session = Depends(get_db)):
    documents = db.query(Document).filter(Document.chatbot_id == chatbot_id).all()
    return {
        "success": True,
        "data": [
            {
                "id": d.id,
                "filename": d.filename,
                "file_type": d.file_type,
                "file_size": d.file_size,
                "chunk_count": d.chunk_count,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            }
            for d in documents
        ],
        "message": "Documents retrieved successfully",
    }
