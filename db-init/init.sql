-- Création d'une seule base de données contenant tous les services
CREATE DATABASE IF NOT EXISTS ecommerce_db;

USE ecommerce_db;

CREATE TABLE IF NOT EXISTS users (
	id INT AUTO_INCREMENT PRIMARY KEY,
	username VARCHAR(50) NOT NULL UNIQUE,
	email VARCHAR(100) NOT NULL UNIQUE,
	hashed_password VARCHAR(255) NOT NULL,
	role VARCHAR(20) NOT NULL DEFAULT 'user',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
	id INT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(100) NOT NULL UNIQUE,
	description VARCHAR(500) NULL,
	price DECIMAL(10,2) NOT NULL,
	stock INT NOT NULL DEFAULT 0,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
	id INT AUTO_INCREMENT PRIMARY KEY,
	username VARCHAR(50) NOT NULL,
	product_id INT NOT NULL,
	quantity INT NOT NULL,
	total_price DECIMAL(10,2) NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'pending',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	INDEX idx_orders_username (username),
	INDEX idx_orders_product_id (product_id)
);

INSERT IGNORE INTO products (name, description, price, stock) VALUES
('TICOM', 'Application modulaire tout-en-un pour Order Care, Cash et Inventory Management.', 1.00, 0),
('Mobile Portability', 'Solution digitale pour rendre les processus de portabilité mobile plus fiables et efficaces.', 1.00, 0),
('Provisioning', 'Solution de gestion des commandes de services et catalogue produit pour réduire le time-to-market.', 1.00, 0),
('Advanced Offer Manager', 'Solution flexible pour gérer les changements d''offres, les plans d''engagement, les terminaux et les frais de résiliation.', 1.00, 0);

-- Accès complet à devuser (utilisé par Docker)
CREATE USER IF NOT EXISTS 'devuser'@'%' IDENTIFIED BY 'devpassword';
GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'devuser'@'%';
FLUSH PRIVILEGES;

