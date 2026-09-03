"""
Couche d'accès aux données : toutes les requêtes SQLAlchemy sont
centralisées ici pour garder les routers (app/routers/*) légers
et faciles à lire.
"""
from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import extract
from sqlalchemy.orm import Session

from app import models, schemas


# ---------- Transactions ----------

def create_transaction(db: Session, payload: schemas.TransactionCreate) -> models.Transaction:
    transaction = models.Transaction(**payload.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def get_transaction(db: Session, transaction_id: UUID) -> Optional[models.Transaction]:
    return db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()


def list_transactions(
    db: Session,
    type_: Optional[models.TransactionType] = None,
    category: Optional[models.Category] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    query = db.query(models.Transaction)
    if type_:
        query = query.filter(models.Transaction.type == type_)
    if category:
        query = query.filter(models.Transaction.category == category)
    if date_from:
        query = query.filter(models.Transaction.date >= date_from)
    if date_to:
        query = query.filter(models.Transaction.date <= date_to)
    return query.order_by(models.Transaction.date.desc()).all()


def update_transaction(
    db: Session, transaction: models.Transaction, payload: schemas.TransactionUpdate
) -> models.Transaction:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(transaction, field, value)
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, transaction: models.Transaction) -> None:
    db.delete(transaction)
    db.commit()


# ---------- Budget ----------

def upsert_budget(db: Session, payload: schemas.BudgetCreate) -> models.Budget:
    budget = db.query(models.Budget).filter(models.Budget.month_year == payload.month_year).first()
    if budget:
        budget.amount = payload.amount
    else:
        budget = models.Budget(**payload.model_dump())
        db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def get_budget(db: Session, month_year: str) -> Optional[models.Budget]:
    return db.query(models.Budget).filter(models.Budget.month_year == month_year).first()


# ---------- Stats helpers ----------

def transactions_for_month(db: Session, month_year: str):
    year, month = month_year.split("-")
    return (
        db.query(models.Transaction)
        .filter(extract("year", models.Transaction.date) == int(year))
        .filter(extract("month", models.Transaction.date) == int(month))
        .all()
    )
