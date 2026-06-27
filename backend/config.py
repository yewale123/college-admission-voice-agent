from pydantic_settings import BaseSettings
from urllib.parse import quote_plus
from typing import List


class Settings(BaseSettings):
    # LLM - Groq (free at https://console.groq.com)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # MySQL Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "college_admission_db"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    # App
    UPLOAD_DIR: str = "uploads"
    CHROMA_DIR: str = "uploads/chroma_db"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{quote_plus(self.DB_PASSWORD)}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
