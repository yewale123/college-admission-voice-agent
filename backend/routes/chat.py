import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import ChatSession, ChatMessage
from services.rag_service import ask_question, detect_language

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    language: str = "en"


class MessageOut(BaseModel):
    role: str
    content: str
    language: str
    created_at: str


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    language: str


@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Create or retrieve session
    session_id = request.session_id or str(uuid.uuid4())
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not session:
        session = ChatSession(session_id=session_id, language=request.language)
        db.add(session)
        db.commit()
        db.refresh(session)

    # Fetch recent history for context
    history_records = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(12)
        .all()
    )
    chat_history = [{"role": m.role, "content": m.content} for m in history_records]

    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=request.message,
        language=request.language,
    )
    db.add(user_msg)
    db.commit()

    # Auto-detect language from the actual message text
    detected_lang = detect_language(request.message)

    # Get answer from RAG
    try:
        answer = ask_question(request.message, chat_history, detected_lang)
    except Exception as e:
        answer = (
            "माफ करें, अभी कोई तकनीकी समस्या है। कृपया दोबारा पूछें।"
            if detected_lang == "hi"
            else "I'm sorry, I encountered an error. Please try again."
        )
        print(f"RAG error: {e}")

    # Save assistant message with detected language (so TTS uses correct voice)
    assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=answer,
        language=detected_lang,
    )
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(session_id=session_id, answer=answer, language=detected_lang)


@router.get("/{session_id}/history", response_model=List[MessageOut])
def get_history(session_id: str, db: Session = Depends(get_db)):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [
        MessageOut(
            role=m.role,
            content=m.content,
            language=m.language,
            created_at=m.created_at.isoformat(),
        )
        for m in messages
    ]


@router.delete("/{session_id}")
def clear_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if session:
        db.delete(session)
        db.commit()
    return {"message": "Session cleared"}
