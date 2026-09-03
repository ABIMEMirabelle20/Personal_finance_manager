# 💰 Personal Finance Manager

Application web de gestion financière personnelle, pensée pour les étudiants.
Elle permet de suivre ses revenus et dépenses, de définir un budget mensuel,
et de visualiser sa situation financière via des graphiques.

Projet réalisé dans un but de démonstration de compétences (portfolio) :
**JavaScript (frontend), Python/FastAPI (backend), PostgreSQL/SQL (données),
Pandas (analyse statistique)**.

## Architecture

```
personal-finance-manager/
├── backend/                 API REST FastAPI
│   ├── app/
│   │   ├── main.py          Point d'entrée (FastAPI app, CORS, routes)
│   │   ├── config.py        Lecture des variables d'environnement (.env)
│   │   ├── database.py      Connexion SQLAlchemy à PostgreSQL
│   │   ├── models.py        Modèles de tables (Transaction, Budget)
│   │   ├── schemas.py       Schémas Pydantic (validation entrée/sortie API)
│   │   ├── crud.py          Requêtes SQL (SQLAlchemy) centralisées
│   │   └── routers/
│   │       ├── transactions.py   Endpoints CRUD transactions
│   │       ├── budgets.py        Endpoints budget mensuel
│   │       └── stats.py          Endpoints statistiques (via Pandas)
│   ├── sql/schema.sql       Schéma SQL de référence
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                 Interface (HTML / CSS / JS vanilla)
    ├── index.html
    ├── css/style.css
    └── js/
        ├── api.js            Appels à l'API (fetch)
        ├── charts.js         Graphiques (Chart.js)
        ├── transactions.js   Logique CRUD transactions (formulaire, tableau)
        └── app.js            Navigation, état global, orchestration
```

**Pourquoi cette architecture ?**
Le frontend et le backend sont totalement séparés et communiquent uniquement
via une API REST en JSON. C'est exactement le modèle utilisé en entreprise :
tu pourrais remplacer ce frontend par une app mobile ou un frontend React
plus tard sans toucher au backend.

## Ce qui a été construit pour toi

- Un backend FastAPI complet avec CRUD transactions, gestion du budget
  mensuel, et 3 endpoints statistiques utilisant **Pandas**
  (résumé du mois, répartition par catégorie, évolution sur 6 mois).
- Un frontend fonctionnel (tableau de bord, transactions avec filtres,
  budget, rapports) en JavaScript vanilla + Chart.js, responsive
  mobile/tablette/desktop, thème sombre inspiré des dashboards modernes.
- Un schéma de base de données PostgreSQL (créé automatiquement par
  SQLAlchemy, avec le script SQL équivalent fourni en référence).

## Étapes pour lancer le projet en local (à faire toi-même)

### 1. Installer PostgreSQL
Si ce n'est pas déjà fait : installe PostgreSQL (postgresql.org) ou utilise
Docker :
```bash
docker run --name pfm-postgres -e POSTGRES_USER=pfm_user \
  -e POSTGRES_PASSWORD=pfm_password -e POSTGRES_DB=personal_finance_db \
  -p 5432:5432 -d postgres:16
```

### 2. Créer la base de données (si tu n'utilises pas Docker)
```sql
CREATE USER pfm_user WITH PASSWORD 'pfm_password';
CREATE DATABASE personal_finance_db OWNER pfm_user;
```

### 3. Configurer le backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Sur Windows : .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # puis adapte DATABASE_URL si besoin
```

### 4. Lancer l'API
```bash
uvicorn app.main:app --reload --port 8000
```
Les tables sont créées automatiquement au démarrage. Va sur
`http://localhost:8000/docs` pour voir la documentation Swagger générée
automatiquement — teste tes endpoints directement depuis là.

### 5. Lancer le frontend
Le frontend est du HTML/CSS/JS statique : pas de build nécessaire.
Ouvre `frontend/index.html` avec l'extension **Live Server** de VS Code
(clic droit → "Open with Live Server"), ou :
```bash
cd frontend
python -m http.server 5500
```
puis ouvre `http://localhost:5500`.

⚠️ Si tu changes le port du frontend, ajoute-le dans `CORS_ORIGINS`
dans le `.env` du backend, sinon les requêtes seront bloquées.

### 6. Vérifier que tout fonctionne
- Ajoute une transaction depuis l'onglet "Transactions".
- Définis un budget dans l'onglet "Budget".
- Vérifie que le tableau de bord se met à jour avec les graphiques.

## Ce qu'il te reste à faire / personnaliser

Ce projet est fonctionnel mais volontairement laissé ouvert pour que tu
puisses te l'approprier — c'est important pour ta soutenance/entretien :

1. **Comprendre chaque fichier** : lis les commentaires dans le code,
   surtout `crud.py`, `stats.py` (Pandas) et `app.js`. Sois capable
   d'expliquer comment une requête traverse toute la stack (clic bouton
   → fetch → FastAPI → SQLAlchemy → PostgreSQL → retour JSON → Chart.js).
2. **Authentification** (optionnel mais valorisant) : ajouter un système
   de login (JWT) pour gérer plusieurs utilisateurs — actuellement,
   toutes les transactions sont partagées globalement.
3. **Tests** : ajoute des tests avec `pytest` + `httpx` sur les endpoints
   FastAPI (un dossier `backend/tests/` serait un bon ajout pour le
   portfolio).
4. **Migrations propres avec Alembic** : actuellement les tables sont
   créées via `Base.metadata.create_all()` (pratique pour démarrer),
   mais un vrai projet pro utilise Alembic pour versionner le schéma.
   La dépendance est déjà dans `requirements.txt`, il faut l'initialiser :
   `alembic init alembic`.
5. **Améliorer l'UI** : ajouter un mode clair, des animations, une
   pagination sur le tableau de transactions si tu as beaucoup de données.
6. **Déploiement** :
   - Backend : Render, Railway ou Fly.io (gratuit pour un petit projet),
     avec une base PostgreSQL managée (Render/Railway en proposent).
   - Frontend : Netlify, Vercel ou GitHub Pages (fichiers statiques).
   - Pense à changer `API_BASE_URL` dans `frontend/js/api.js` pour
     pointer vers ton backend déployé, et à mettre à jour `CORS_ORIGINS`.
7. **README GitHub** : ajoute des captures d'écran de ton app une fois
   stylée à ton goût, et un lien vers la démo déployée.
8. **Optionnel React** : si tu veux montrer React, tu peux réécrire le
   frontend en React (Vite) en gardant exactement la même API backend —
   c'est un excellent exercice de migration à mettre aussi en avant.

## Endpoints de l'API

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/transactions` | Créer une transaction |
| GET | `/api/transactions` | Lister (filtres : type, category, date_from, date_to) |
| GET | `/api/transactions/{id}` | Détail d'une transaction |
| PUT | `/api/transactions/{id}` | Modifier une transaction |
| DELETE | `/api/transactions/{id}` | Supprimer une transaction |
| POST | `/api/budgets` | Définir/mettre à jour le budget d'un mois |
| GET | `/api/budgets/{month_year}` | Récupérer le budget d'un mois |
| GET | `/api/stats/summary?month_year=` | Totaux + % budget utilisé |
| GET | `/api/stats/by-category?month_year=` | Répartition des dépenses |
| GET | `/api/stats/monthly-evolution?months=6` | Évolution revenus/dépenses |

## Stack technique

- **Frontend** : HTML5, CSS3 (responsive, thème sombre), JavaScript ES6+
  (vanilla, sans framework), Chart.js.
- **Backend** : Python, FastAPI, Pydantic v2, SQLAlchemy 2.
- **Base de données** : PostgreSQL.
- **Data** : Pandas (agrégations pour les statistiques).
