from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Kadhiri AI Public Grievance Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str
    REDIS_URL: str

    OPENAI_API_KEY: str

    UPLOAD_TEMP_DIRECTORY: str = "./temp_audio"
    CSV_DIRECTORY: str = "./csv_exports"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
