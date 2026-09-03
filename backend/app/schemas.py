"""
Schémas Pydantic : ils définissent la forme des données qui entrent
et sortent de l'API (validation automatique + documentation Swagger).
"""
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from app.models import Category, TransactionType


# ---------- Transactions ----------

class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0, description="Montant, toujours positif")
    type: TransactionType
    category: Category
    description: Optional[str] = ""
    date: date


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[TransactionType] = None
    category: Optional[Category] = None
    description: Optional[str] = None
    date: Optional[date] = None


class TransactionOut(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------- Budget ----------

class BudgetBase(BaseModel):
    month_year: str = Field(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="Format YYYY-MM")
    amount: float = Field(..., ge=0)


class BudgetCreate(BudgetBase):
    pass


class BudgetOut(BudgetBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------- Stats ----------

class SummaryOut(BaseModel):
    total_income: float
    total_expenses: float
    balance: float
    budget: Optional[float] = None
    budget_used_percent: Optional[float] = None


class CategoryBreakdownItem(BaseModel):
    category: str
    total: float
    percent: float


class MonthlyPoint(BaseModel):
    month: str
    income: float
    expenses: float
