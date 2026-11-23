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
    stock INTEGER NOT NULL DEFAULT 0,
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
      price: 279.00,
      stock: 18,
      image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=900&q=80',
      badge: 'Best-seller',
      sku: 'KS-AP-PRO2'
    },
    {
      id: 'prod-2',
      name: 'AirPods Max — Noir Sidéral',
      description: 'Casque circum-auriculaire haute fidélité, arceau en acier inoxydable, réduction de bruit pro et Audio Spatial.',
      category: 'airpods',
      price: 579.00,
      stock: 6,
      image: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?auto=format&fit=crop&w=900&q=80',
      badge: 'Édition Luxe',
      sku: 'KS-AP-MAX'
    },
    {
      id: 'prod-3',
      name: 'AirPods 4 — Réduction de Bruit',
      description: 'Design repensé pour un maintien optimal, puce H2, Audio Spatial dynamique et boîtier compact sans fil.',
      category: 'airpods',
      price: 199.00,
      stock: 22,
      image: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=900&q=80',
      badge: 'Nouveau',
      sku: 'KS-AP-4ANC'
    },
    {
      id: 'prod-4',
      name: 'Étui AirPods Pro Cuir & Carbone',
      description: 'Coque de protection de marque en fibre de carbone véritable et cuir pleine fleur avec mousqueton anodisé.',
      category: 'accessoires',
      price: 59.00,
      stock: 30,
      image: 'https://images.unsplash.com/photo-1625517488022-8f6d6c3d02f8?auto=format&fit=crop&w=900&q=80',
      badge: 'Designer',
      sku: 'KS-ACC-001'
    },
    {
      id: 'prod-5',
      name: 'Coque MagSafe Cuir Noir — iPhone 16 Pro',
      description: 'Cuir italien tannage végétal, boutons en aluminium usiné, anneau MagSafe intégré haute puissance.',
      category: 'accessoires',
      price: 69.00,
      stock: 25,
      image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80',
      badge: 'Best-seller',
      sku: 'KS-ACC-002'
    },
    {
      id: 'prod-6',
      name: 'Station de Charge MagSafe 3-en-1 Titane',
      description: 'Charge rapide 15W certifiée pour iPhone, Apple Watch et AirPods. Finition titane brossé et verre fumé.',
      category: 'accessoires',
      price: 139.00,
      stock: 12,
      image: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?auto=format&fit=crop&w=900&q=80',
      badge: 'Nouveau',
      sku: 'KS-ACC-003'
    },
    {
      id: 'prod-7',
      name: 'Bracelet Apple Watch Milanais Noir',
      description: 'Acier inoxydable 316L tissé, fermoir magnétique ultra-précis, résistant à l’eau et à la corrosion.',
      category: 'accessoires',
      price: 89.00,
      stock: 15,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
      badge: '',
      sku: 'KS-ACC-004'
    },
    {
      id: 'prod-8',
      name: 'Batterie Externe MagSafe Slim 10 000mAh',
      description: 'Châssis ultra-fin en aluminium anodisé noir, charge sans fil magnétique 15W et port USB-C PD 20W.',
      category: 'accessoires',
      price: 79.00,
      stock: 19,
      image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80',
      badge: '',
      sku: 'KS-ACC-005'
    }
  ];

  const insert = db.prepare(`
    INSERT INTO products (id, name, description, category, price, stock, image, badge, sku)
    VALUES (@id, @name, @description, @category, @price, @stock, @image, @badge, @sku)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(item);
  });
  insertMany(initialProducts);
}

export default db;
