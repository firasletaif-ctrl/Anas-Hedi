import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    price REAL NOT NULL,
    discountPercent REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    image TEXT DEFAULT '',
    badge TEXT DEFAULT '',
    sku TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customerName TEXT NOT NULL,
    customerEmail TEXT NOT NULL,
    customerAddress TEXT NOT NULL,
    promoCode TEXT DEFAULT '',
    discountAmount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'En attente',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT NOT NULL,
    productId TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discountPercent REAL NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed initial products if empty
const countRow = db.prepare('SELECT COUNT(*) AS count FROM products').get();
if (countRow.count === 0) {
  const initialProducts = [
    {
      id: 'prod-1',
      name: 'AirPods Pro (2e génération) USB-C',
      description: 'Réduction active du bruit 2x plus performante, Audio Spatial personnalisé, boîtier de charge MagSafe USB-C.',
      category: 'airpods',
      price: 249.00,
      discountPercent: 0,
      stock: 15,
      active: 1,
      image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=900&q=80',
      badge: 'Best-seller',
      sku: 'ZS-AP-PRO2'
    },
    {
      id: 'prod-2',
      name: 'AirPods 4 — Réduction de Bruit',
      description: 'Design repensé pour un maintien optimal, puce H2, Audio Spatial dynamique et boîtier compact sans fil.',
      category: 'airpods',
      price: 179.00,
      discountPercent: 0,
      stock: 20,
      active: 1,
      image: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=900&q=80',
      badge: 'Nouveau',
      sku: 'ZS-AP-4ANC'
    },
    {
      id: 'prod-3',
      name: 'AirPods Max — Noir Sidéral',
      description: 'Casque circum-auriculaire haute fidélité, arceau en acier inoxydable, réduction de bruit pro et Audio Spatial.',
      category: 'airpods',
      price: 549.00,
      discountPercent: 10,
      stock: 5,
      active: 1,
      image: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?auto=format&fit=crop&w=900&q=80',
      badge: 'Édition Luxe',
      sku: 'ZS-AP-MAX'
    },
    {
      id: 'prod-4',
      name: 'Bracelet Lacoste — Édition Classique',
      description: 'Le fameux bracelet Lacoste en acier et silicone tressé avec crocodile emblématique. Fermoir sécurisé et finitions premium.',
      category: 'bracelets',
      price: 89.00,
      discountPercent: 0,
      stock: 24,
      active: 1,
      image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=80',
      badge: 'Populaire',
      sku: 'ZS-LAC-01'
    },
    {
      id: 'prod-5',
      name: 'Montre Noire — Chiffres Arabes',
      description: 'Montre noire élégante avec cadran à chiffres arabes orientaux, verre saphir anti-rayures et bracelet acier noir mat.',
      category: 'montres',
      price: 159.00,
      discountPercent: 15,
      stock: 12,
      active: 1,
      image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80',
      badge: 'Exclusif',
      sku: 'ZS-MNT-AR1'
    },
    {
      id: 'prod-6',
      name: 'Montre Noire Acier — Chiffres Arabes Pro',
      description: 'Boîtier 41mm noir brossé, chiffres arabes lumineux, mouvement automatique de précision et étanchéité 5 ATM.',
      category: 'montres',
      price: 219.00,
      discountPercent: 0,
      stock: 8,
      active: 1,
      image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80',
      badge: 'Nouveau',
      sku: 'ZS-MNT-AR2'
    }
  ];

  const insert = db.prepare(`
    INSERT INTO products (id, name, description, category, price, discountPercent, stock, active, image, badge, sku)
    VALUES (@id, @name, @description, @category, @price, @discountPercent, @stock, @active, @image, @badge, @sku)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(item);
  });
  insertMany(initialProducts);
}

// Seed initial promo code if empty
const promoCount = db.prepare('SELECT COUNT(*) AS count FROM promo_codes').get();
if (promoCount.count === 0) {
  db.prepare(`
    INSERT INTO promo_codes (id, code, discountPercent, active)
    VALUES ('promo-1', 'ZONE10', 10, 1)
  `).run();
}

export default db;
