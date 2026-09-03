"""
Mise en place du moteur SQLAlchemy et de la session de base de données.
Le pattern get_db() est le pattern standard FastAPI pour injecter
une session par requête et la refermer proprement ensuite.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
