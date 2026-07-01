import pymysql

host = "localhost"
port = 3306
user = "root"
password = "bymabpudg30"

databases = ["ecommerce_db"]

try:
    print(f"Connexion au serveur MySQL local ({host}:{port}) en tant que '{user}'...")
    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        autocommit=True
    )
    cursor = conn.cursor()
    print("Connexion réussie !")

    for db in databases:
        print(f"Création de la base de données '{db}' si elle n'existe pas...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db};")
        print(f"Base de données '{db}' initialisée.")

    cursor.close()
    conn.close()
    print("\nToutes les bases de données ont été créées avec succès !")

except Exception as e:
    print(f"\nErreur lors de la connexion ou de l'initialisation de la base de données : {e}")
    print("Veuillez vous assurer que le serveur MySQL est démarré et que le port 3306 est accessible.")
