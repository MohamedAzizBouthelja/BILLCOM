import pymysql

conn = pymysql.connect(host='localhost', port=3306, user='root', password='bymabpudg30', db='product_db')
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
print("OK - Table products recree avec le nouveau schema")
