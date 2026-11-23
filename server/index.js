import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const initialData = {
  products: [
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
  ],
  orders: [
    {
      id: 'ORD-1001',
      customerName: 'Amine Benali',
      customerEmail: 'amine.benali@example.com',
      customerAddress: '14 Avenue Habib Bourguiba, Tunis',
      items: [
        { productId: 'prod-5', name: 'Casque Audio ANC Studio', price: 279.00, quantity: 1 },
        { productId: 'prod-4', name: 'T-Shirt Essentiel Noir', price: 45.00, quantity: 2 }
      ],
      total: 369.00,
      status: 'Expédiée',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ]
};

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return initialData;
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Initialize data file on startup
readData();

// Products endpoints
app.get('/api/products', (req, res) => {
  const data = readData();
  res.json(data.products);
});

app.post('/api/products', (req, res) => {
  const data = readData();
  const { name, description, category, price, stock, image, badge, sku } = req.body;
  if (!name || price === undefined || stock === undefined || !category) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }
  const newProduct = {
    id: `prod-${Date.now()}`,
    name: String(name).trim(),
    description: String(description || '').trim(),
    category: ['airpods', 'accessoires', 'vetements', 'technologie'].includes(category) ? category : 'accessoires',
    price: Number(price),
    stock: Math.max(0, parseInt(stock, 10) || 0),
    image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    badge: String(badge || '').trim(),
    sku: String(sku || `KS-${Date.now().toString().slice(-4)}`).trim()
  };
  data.products.unshift(newProduct);
  writeData(data);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const data = readData();
  const idx = data.products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Produit introuvable' });
  }
  const existing = data.products[idx];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
    stock: req.body.stock !== undefined ? Math.max(0, parseInt(req.body.stock, 10) || 0) : existing.stock,
  };
  data.products[idx] = updated;
  writeData(data);
  res.json(updated);
});

app.delete('/api/products/:id', (req, res) => {
  const data = readData();
  const filtered = data.products.filter((p) => p.id !== req.params.id);
  if (filtered.length === data.products.length) {
    return res.status(404).json({ error: 'Produit introuvable' });
  }
  data.products = filtered;
  writeData(data);
  res.json({ success: true });
});

// Orders endpoints
app.get('/api/orders', (req, res) => {
  const data = readData();
  res.json(data.orders);
});

app.post('/api/orders', (req, res) => {
  const data = readData();
  const { customerName, customerEmail, customerAddress, items } = req.body;
  if (!customerName || !customerEmail || !customerAddress || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Informations de commande incomplètes' });
  }

  let total = 0;
  const orderItems = [];

  for (const item of items) {
    const product = data.products.find((p) => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ error: `Produit introuvable: ${item.productId}` });
    }
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    if (product.stock < qty) {
      return res.status(400).json({ error: `Stock insuffisant pour ${product.name} (${product.stock} disponible)` });
    }
    product.stock -= qty;
    total += product.price * qty;
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: qty
    });
  }

  const newOrder = {
    id: `ORD-${1000 + data.orders.length + 1}`,
    customerName: String(customerName).trim(),
    customerEmail: String(customerEmail).trim(),
    customerAddress: String(customerAddress).trim(),
    items: orderItems,
    total: Number(total.toFixed(2)),
    status: 'En attente',
    createdAt: new Date().toISOString()
  };

  data.orders.unshift(newOrder);
  writeData(data);
  res.status(201).json(newOrder);
});

app.patch('/api/orders/:id', (req, res) => {
  const data = readData();
  const order = data.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Commande introuvable' });
  }
  if (req.body.status) {
    order.status = req.body.status;
  }
  writeData(data);
  res.json(order);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`API server running on http://127.0.0.1:${PORT}`);
});
