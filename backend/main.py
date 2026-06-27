import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes import chat, documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB and tables
    from database import create_database_if_not_exists, Base, engine
    try:
        create_database_if_not_exists()
        Base.metadata.create_all(bind=engine)
        print("MySQL database and tables ready.")
    except Exception as e:
        print(f"WARNING: Could not connect to MySQL: {e}")
        print("Make sure MySQL is running and DB_PASSWORD is set in backend/.env")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.CHROMA_DIR, exist_ok=True)
    yield
    # Shutdown (nothing to clean up)


app = FastAPI(
    title="College Admission Voice Agent API",
    description="AI-powered admission assistant with RAG + MySQL + Groq",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(documents.router)


@app.get("/")
def root():
    return {"message": "College Admission Voice Agent API", "status": "running"}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "llm_provider": "groq",
        "model": settings.GROQ_MODEL,
        "groq_configured": bool(
            settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_groq_api_key_here"
        ),
    }
