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
6. **Déploiement** : voir la section dédiée "Déploiement en production
   (Render + Vercel)" plus bas dans ce README — un fichier `render.yaml`
   est déjà fourni pour automatiser le déploiement du backend.
7. **README GitHub** : ajoute des captures d'écran de ton app une fois
   stylée à ton goût, et un lien vers la démo déployée.
8. **Optionnel React** : si tu veux montrer React, tu peux réécrire le
   frontend en React (Vite) en gardant exactement la même API backend —
   c'est un excellent exercice de migration à mettre aussi en avant.

## Déploiement en production (Render + Vercel)

**Architecture** : backend + base de données sur **Render**, frontend statique sur **Vercel**. Les deux sont gratuits pour ce type de projet.

### Étape 0 — Mettre le code sur GitHub
Les deux plateformes déploient à partir d'un dépôt GitHub.
1. Crée un dépôt sur [github.com/new](https://github.com/new)
2. Depuis le dossier `personal-finance-manager` :
```bash
git init
git add .
git commit -m "Premier commit"
git branch -M main
git remote add origin https://github.com/TON-PSEUDO/personal-finance-manager.git
git push -u origin main
```

### Étape 1 — Déployer le backend + la base sur Render
1. Va sur [render.com](https://render.com), crée un compte (connexion via GitHub la plus simple)
2. Clique **"New +"** → **"Blueprint"**
3. Sélectionne ton dépôt GitHub `personal-finance-manager`
4. Render détecte automatiquement le fichier `render.yaml` à la racine du projet et propose de créer :
   - un service web (ton API, dans le dossier `backend/`)
   - une base PostgreSQL gratuite, déjà reliée à l'API via `DATABASE_URL`
5. Clique **"Apply"** — le déploiement démarre (2-5 minutes la première fois)
6. Une fois terminé, note l'URL de ton API, du type : `https://personal-finance-manager-api.onrender.com`
7. Vérifie que ça fonctionne en ouvrant `https://TON-URL.onrender.com/docs` — tu dois voir la doc Swagger.

⚠️ **Offre gratuite Render** : le service s'endort après 15 minutes d'inactivité et met ~30-50 secondes à se "réveiller" au premier appel suivant. C'est normal, pas un bug — précise-le si tu montres la démo en direct.

### Étape 2 — Adapter le frontend pour pointer vers le backend déployé
Avant de déployer le frontend, modifie une seule ligne dans `frontend/js/api.js` :
```javascript
const API_BASE_URL = "https://personal-finance-manager-api.onrender.com/api";
```
(remplace par ta vraie URL Render de l'étape 1, en gardant le `/api` à la fin)

Commit et pousse ce changement :
```bash
git add frontend/js/api.js
git commit -m "Pointer vers le backend déployé"
git push
```

### Étape 3 — Déployer le frontend sur Vercel
1. Va sur [vercel.com](https://vercel.com), crée un compte (connexion via GitHub)
2. **"Add New..."** → **"Project"**
3. Importe ton dépôt `personal-finance-manager`
4. Dans les paramètres du projet, règle **"Root Directory"** sur `frontend`
5. **Framework Preset** → laisse "Other" (aucun build nécessaire, c'est du HTML/CSS/JS pur)
6. Clique **"Deploy"**
7. Une fois terminé, tu obtiens une URL du type `https://personal-finance-manager.vercel.app`

### Étape 4 — Autoriser ton frontend Vercel dans le backend (CORS)
Retourne sur Render, ouvre ton service backend → **"Environment"** → modifie la variable `CORS_ORIGINS` :
```
CORS_ORIGINS=https://personal-finance-manager.vercel.app
```
(remplace par ta vraie URL Vercel). Sauvegarde — Render redéploie automatiquement avec la nouvelle valeur.

### Étape 5 — Tester
Ouvre ton URL Vercel, ajoute une transaction. Si le CORS est bien configuré, ça doit s'enregistrer normalement (compte 30-50 secondes de délai la première fois si le backend Render s'était endormi).

### En cas d'erreur CORS après déploiement
Ouvre la console du navigateur (F12) sur ton site Vercel — si tu vois une erreur mentionnant "CORS" ou "Access-Control-Allow-Origin", vérifie que l'URL dans `CORS_ORIGINS` sur Render correspond **exactement** à ton URL Vercel (avec `https://`, sans `/` à la fin).

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
