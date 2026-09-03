from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


@router.post("", response_model=schemas.BudgetOut)
def set_budget(payload: schemas.BudgetCreate, db: Session = Depends(get_db)):
    """Crée ou met à jour le budget d'un mois donné (upsert)."""
    return crud.upsert_budget(db, payload)


@router.get("/{month_year}", response_model=schemas.BudgetOut)
def get_budget(month_year: str, db: Session = Depends(get_db)):
    budget = crud.get_budget(db, month_year)
    if not budget:
        raise HTTPException(status_code=404, detail="Aucun budget défini pour ce mois")
    return budget
