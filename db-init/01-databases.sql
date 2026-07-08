-- Une base de données dédiée par service (isolation au niveau MySQL — chaque
-- service ne doit pouvoir accéder qu'à ses propres données, voir 02-create-users.sh).
-- Les tables elles-mêmes sont créées par chaque service via Alembic/SQLAlchemy
-- au démarrage (voir services/*/migrations) — ce script ne fait que provisionner
-- les schémas vides.
CREATE DATABASE IF NOT EXISTS user_db;
CREATE DATABASE IF NOT EXISTS product_db;
CREATE DATABASE IF NOT EXISTS order_db;
