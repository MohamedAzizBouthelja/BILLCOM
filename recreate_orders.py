import pymysql

conn = pymysql.connect(host='localhost', port=3306, user='root', password='bymabpudg30', db='order_db')
cur = conn.cursor()

cur.execute('DROP TABLE IF EXISTS orders')

sql = (
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
cur.execute(sql)
conn.commit()
conn.close()
print("OK - Table orders recree avec le nouveau schema")
