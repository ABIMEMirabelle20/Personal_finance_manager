from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import budgets, stats, transactions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crée les tables si elles n'existent pas encore.
    # Pour un vrai projet en production, on utiliserait plutôt Alembic
    # (voir backend/README.md) mais ceci suffit pour démarrer vite.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Personal Finance Manager API",
    description="API REST pour la gestion de finances personnelles (transactions, budget, statistiques).",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(stats.router)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "service": "personal-finance-manager-api"}
