import pymysql

pw = 'bymabpudg30'

# ── product_db ──────────────────────────────────────────────
conn = pymysql.connect(host='localhost', port=3306, user='root', password=pw, db='product_db')
cur = conn.cursor()
cur.execute('DROP TABLE IF EXISTS products')
cur.execute(
    "CREATE TABLE products ("
    "  id INT NOT NULL AUTO_INCREMENT,"
    "  name VARCHAR(100) NOT NULL,"
    "  slug VARCHAR(120) NOT NULL,"
    "  description VARCHAR(500),"
    "  price FLOAT NOT NULL,"
    "  old_price FLOAT,"
    "  stock INT NOT NULL DEFAULT 0,"
    "  image_url VARCHAR(500),"
    "  badge VARCHAR(20) DEFAULT '',"
    "  rating FLOAT DEFAULT 0.0,"
    "  reviews INT DEFAULT 0,"
    "  featured TINYINT(1) NOT NULL DEFAULT 0,"
    "  category VARCHAR(50),"
    "  category_name VARCHAR(50),"
    "  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,"
    "  PRIMARY KEY (id),"
    "  UNIQUE KEY uq_name (name),"
    "  UNIQUE KEY uq_slug (slug)"
    ")"
)
conn.commit()
conn.close()
print("product_db.products recree OK")

# ── order_db ─────────────────────────────────────────────────
conn = pymysql.connect(host='localhost', port=3306, user='root', password=pw, db='order_db')
cur = conn.cursor()
cur.execute('DROP TABLE IF EXISTS orders')
cur.execute(
    "CREATE TABLE orders ("
    "  id INT NOT NULL AUTO_INCREMENT,"
    "  order_number VARCHAR(50) NOT NULL,"
    "  username VARCHAR(50) NOT NULL,"
    "  product_id INT,"
    "  quantity INT,"
    "  items_json TEXT,"
    "  total_price FLOAT NOT NULL,"
    "  payment_method VARCHAR(50) NOT NULL DEFAULT 'cod',"
    "  shipping_address VARCHAR(500),"
    "  status VARCHAR(20) NOT NULL DEFAULT 'pending',"
    "  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,"
    "  PRIMARY KEY (id),"
    "  UNIQUE KEY uq_order_number (order_number),"
    "  INDEX idx_username (username)"
    ")"
)
conn.commit()
conn.close()
print("order_db.orders recree OK")
