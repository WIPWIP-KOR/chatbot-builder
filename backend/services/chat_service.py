from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from models.database import Chatbot, Conversation, Action, ApiKeySetting
from services.llm.factory import get_llm_provider
from services.rag_service import query_vectordb
from services.action_service import build_action_prompt, parse_action_from_response


def build_system_prompt(chatbot: Chatbot, context: str, actions: List[Action]) -> str:
    """Build the full system prompt with context and action instructions."""
    base_prompt = chatbot.system_prompt or ""

    prompt = f"""You are '{chatbot.name}' chatbot. You serve the '{chatbot.department or "General"}' department.
{base_prompt}

Answer based on the following reference documents:
---
{context if context else "No reference documents available."}
---

Rules:
1. If the answer is not in the documents, honestly say you don't know.
2. Answer in the same language the user is using.
3. Be helpful and concise.
"""

    action_prompt = build_action_prompt(actions)
    if action_prompt:
        prompt += action_prompt

    return prompt


async def process_chat(
    chatbot_id: int,
    message: str,
    session_id: str,
    db: Session,
) -> Dict:
    """Process a chat message and return response with optional action."""
    # Get chatbot
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    if not chatbot:
        raise ValueError("Chatbot not found")

    if not chatbot.is_active:
        raise ValueError("Chatbot is not active")

    # Get conversation history
    history = (
        db.query(Conversation)
        .filter(
            Conversation.chatbot_id == chatbot_id,
            Conversation.session_id == session_id,
        )
        .order_by(Conversation.created_at.asc())
        .limit(20)  # Keep last 20 messages for context
        .all()
    )

    # Query RAG for relevant context
    context_chunks = query_vectordb(chatbot_id, message)
    context = "\n\n".join(context_chunks) if context_chunks else ""

    # Get active actions
    actions = db.query(Action).filter(
        Action.chatbot_id == chatbot_id,
        Action.is_active == True,
    ).all()

    # Build system prompt
    system_prompt = build_system_prompt(chatbot, context, actions)

    # Build messages for LLM
    messages = []
    for conv in history:
        messages.append({"role": conv.role, "content": conv.content})
    messages.append({"role": "user", "content": message})

    # Resolve API key: per-chatbot > DB settings > env var
    api_key = chatbot.api_key if chatbot.api_key else None
    if not api_key:
        db_setting = db.query(ApiKeySetting).filter(
            ApiKeySetting.provider == chatbot.llm_provider
        ).first()
        if db_setting:
            api_key = db_setting.api_key

    # Get LLM provider and generate response
    provider = get_llm_provider(
        provider=chatbot.llm_provider,
        model=chatbot.llm_model,
        api_key=api_key,
    )

    raw_response = await provider.chat(messages, system_prompt)

    # Parse action from response
    clean_text, action_data = parse_action_from_response(raw_response)

    # Save user message
    user_conv = Conversation(
        chatbot_id=chatbot_id,
        session_id=session_id,
        role="user",
        content=message,
    )
    db.add(user_conv)

    # Save assistant message
    assistant_conv = Conversation(
        chatbot_id=chatbot_id,
        session_id=session_id,
        role="assistant",
        content=clean_text,
        action_data=action_data,
    )
    db.add(assistant_conv)
    db.commit()

    return {
        "response": clean_text,
        "action": action_data,
        "session_id": session_id,
    }
