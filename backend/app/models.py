"""
Modèles de la base de données (tables SQL) définis avec SQLAlchemy.
"""
import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Enum, Float, String
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class TransactionType(str, enum.Enum):
    INCOME = "income"      # revenu
    EXPENSE = "expense"    # dépense


class Category(str, enum.Enum):
    FOOD = "alimentation"
    HOUSING = "logement"
    TRANSPORT = "transport"
    STUDIES = "etudes"
    LEISURE = "loisirs"
    HEALTH = "sante"
    SUBSCRIPTIONS = "abonnements"
    OTHER = "autres"
    # Catégorie spéciale utilisée uniquement pour les revenus
    INCOME_SOURCE = "revenu"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    amount = Column(Float, nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    category = Column(Enum(Category), nullable=False)
    description = Column(String(255), nullable=True, default="")
    date = Column(Date, nullable=False, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Budget(Base):
    """
    Un seul budget par mois/année (ex: budget de "09-2026").
    """
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    month_year = Column(String(7), nullable=False, unique=True)  # format "YYYY-MM"
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
