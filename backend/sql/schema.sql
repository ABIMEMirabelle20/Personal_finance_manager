-- Ce fichier est fourni à titre de référence / démonstration SQL.
-- En pratique, SQLAlchemy crée déjà ces tables automatiquement au démarrage
-- de l'API (voir app/main.py). Tu peux exécuter ce script manuellement
-- si tu veux inspecter ou recréer le schéma "à la main".

CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TYPE category AS ENUM (
    'alimentation', 'logement', 'transport', 'etudes',
    'loisirs', 'sante', 'abonnements', 'autres', 'revenu'
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount FLOAT NOT NULL CHECK (amount > 0),
    type transaction_type NOT NULL,
    category category NOT NULL,
    description VARCHAR(255) DEFAULT '',
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year VARCHAR(7) NOT NULL UNIQUE,
    amount FLOAT NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Exemple de requête analytique : dépenses par catégorie pour un mois donné
-- SELECT category, SUM(amount) AS total
-- FROM transactions
-- WHERE type = 'expense' AND date >= '2026-09-01' AND date <= '2026-09-30'
-- GROUP BY category
-- ORDER BY total DESC;
