from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from models.database import init_db
from routers import chatbots, chat, documents, actions, settings

app = FastAPI(title="Chatbot Builder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbots.router, prefix="/api/chatbots", tags=["chatbots"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(actions.router, prefix="/api/actions", tags=["actions"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/api/health")
async def health_check():
    return {"success": True, "data": None, "message": "Server is running"}
