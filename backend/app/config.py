"""
Configuration centralisée de l'application.
Toutes les valeurs sensibles (URL de base de données, origines CORS...)
sont lues depuis un fichier .env pour ne jamais être codées en dur.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://pfm_user:pfm_password@localhost:5432/personal_finance_db"
    cors_origins: str = "http://localhost:5500,http://127.0.0.1:5500"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
