from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    APP_NAME: str = "CosmeticIQ"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-Powered Cosmetic Safety & Suitability Platform"
    
    # Database - defaults to SQLite if PostgreSQL not configured
    DATABASE_URL: str = ""
    
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    
    # Production settings
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def cors_origins_list(self) -> list:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
