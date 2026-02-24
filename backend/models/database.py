from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chatbot_builder.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Chatbot(Base):
    __tablename__ = "chatbots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    department = Column(String)
    description = Column(String)
    system_prompt = Column(Text, default="")
    llm_provider = Column(String, default="claude")
    llm_model = Column(String, default="claude-sonnet-4-5-20250929")
    api_key = Column(String, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="chatbot", cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="chatbot", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="chatbot", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String)
    file_size = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    chatbot = relationship("Chatbot", back_populates="documents")


class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    name = Column(String, nullable=False)
    action_type = Column(String, nullable=False)  # SHOW_FORM, SHOW_GUIDE, REDIRECT, NOTIFY
    trigger_keywords = Column(Text, default="")  # comma-separated keywords
    description = Column(String, default="")
    config = Column(JSON, default={})  # action-specific configuration
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    chatbot = relationship("Chatbot", back_populates="actions")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    session_id = Column(String, nullable=False)
    role = Column(String, nullable=False)  # user / assistant
    content = Column(Text, nullable=False)
    action_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    chatbot = relationship("Chatbot", back_populates="conversations")


class ActionSubmission(Base):
    __tablename__ = "action_submissions"

    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    action_id = Column(Integer, ForeignKey("actions.id"), nullable=False)
    session_id = Column(String, nullable=False)
    form_data = Column(JSON, nullable=False)
    status = Column(String, default="submitted")  # submitted, processing, completed
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
