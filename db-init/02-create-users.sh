#!/bin/bash
# Crée un utilisateur MySQL dédié par service, avec des privilèges limités à
# sa propre base de données (pas de root applicatif — voir PHASE7_SECURITE.md).
# Sourcé par le entrypoint officiel de l'image mysql, qui exporte déjà
# MYSQL_ROOT_PASSWORD et les *_SVC_PASSWORD définis dans docker-compose.yml.
set -euo pipefail

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    CREATE USER IF NOT EXISTS 'user_svc'@'%' IDENTIFIED BY '${USER_SVC_PASSWORD}';
    GRANT ALL PRIVILEGES ON user_db.* TO 'user_svc'@'%';

    CREATE USER IF NOT EXISTS 'product_svc'@'%' IDENTIFIED BY '${PRODUCT_SVC_PASSWORD}';
    GRANT ALL PRIVILEGES ON product_db.* TO 'product_svc'@'%';

    CREATE USER IF NOT EXISTS 'order_svc'@'%' IDENTIFIED BY '${ORDER_SVC_PASSWORD}';
    GRANT ALL PRIVILEGES ON order_db.* TO 'order_svc'@'%';

    FLUSH PRIVILEGES;
EOSQL
