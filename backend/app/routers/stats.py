"""
Endpoints d'analyse statistique.
C'est ici que Pandas est utilisé : on charge les transactions dans un
DataFrame puis on fait des agrégations (par catégorie, par mois...)
plutôt que d'écrire ces calculs "à la main" en Python pur.
"""
from datetime import date

import pandas as pd
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/stats", tags=["stats"])


def _transactions_to_dataframe(transactions: list[models.Transaction]) -> pd.DataFrame:
    if not transactions:
        return pd.DataFrame(columns=["amount", "type", "category", "date"])
    return pd.DataFrame(
        [
            {
                "amount": t.amount,
                "type": t.type.value,
                "category": t.category.value,
                "date": t.date,
            }
            for t in transactions
        ]
    )


@router.get("/summary", response_model=schemas.SummaryOut)
def summary(month_year: str, db: Session = Depends(get_db)):
    transactions = crud.transactions_for_month(db, month_year)
    df = _transactions_to_dataframe(transactions)

    total_income = float(df.loc[df["type"] == "income", "amount"].sum()) if not df.empty else 0.0
    total_expenses = float(df.loc[df["type"] == "expense", "amount"].sum()) if not df.empty else 0.0
    balance = total_income - total_expenses

    budget = crud.get_budget(db, month_year)
    budget_amount = budget.amount if budget else None
    budget_used_percent = (
        round((total_expenses / budget_amount) * 100, 1) if budget_amount and budget_amount > 0 else None
    )

    return schemas.SummaryOut(
        total_income=total_income,
        total_expenses=total_expenses,
        balance=balance,
        budget=budget_amount,
        budget_used_percent=budget_used_percent,
    )


@router.get("/by-category", response_model=list[schemas.CategoryBreakdownItem])
def by_category(month_year: str, db: Session = Depends(get_db)):
    transactions = crud.transactions_for_month(db, month_year)
    df = _transactions_to_dataframe(transactions)
    df = df[df["type"] == "expense"]

    if df.empty:
        return []

    grouped = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    total = grouped.sum()
    return [
        schemas.CategoryBreakdownItem(
            category=cat, total=float(total_amount), percent=round(float(total_amount) / total * 100, 1)
        )
        for cat, total_amount in grouped.items()
    ]


@router.get("/monthly-evolution", response_model=list[schemas.MonthlyPoint])
def monthly_evolution(db: Session = Depends(get_db), months: int = 6):
    """Évolution des revenus/dépenses sur les N derniers mois (par défaut 6)."""
    all_transactions = crud.list_transactions(db)
    df = _transactions_to_dataframe(all_transactions)

    if df.empty:
        return []

    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.to_period("M").astype(str)

    pivot = (
        df.groupby(["month", "type"])["amount"]
        .sum()
        .unstack(fill_value=0)
        .rename(columns={"income": "income", "expense": "expenses"})
    )
    pivot = pivot.reindex(columns=["income", "expenses"], fill_value=0)
    pivot = pivot.sort_index().tail(months)

    return [
        schemas.MonthlyPoint(month=month, income=float(row.get("income", 0)), expenses=float(row.get("expenses", 0)))
        for month, row in pivot.iterrows()
    ]
