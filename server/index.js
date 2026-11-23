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
      name: 'Veste Technique Minimaliste',
      description: 'Veste coupe-vent imperméable en nylon recyclé avec coutures thermocollées et coupe structurée.',
      category: 'vetements',
      price: 189.00,
      stock: 14,
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80',
      badge: 'Nouveau',
      sku: 'KS-VET-001'
    },
    {
      id: 'prod-2',
      name: 'Hoodie Heavyweight 480g',
      description: 'Coton biologique épais 480g/m², coupe boxy moderne, finitions bord-côte premium.',
      category: 'vetements',
      price: 95.00,
      stock: 28,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
      badge: 'Best-seller',
      sku: 'KS-VET-002'
    },
    {
      id: 'prod-3',
      name: 'Pantalon Cargo Studio',
      description: 'Pantalon technique stretch avec poches dissimulées et cordon de serrage à la cheville.',
      category: 'vetements',
      price: 120.00,
      stock: 9,
      image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80',
      badge: '',
      sku: 'KS-VET-003'
    },
    {
      id: 'prod-4',
      name: 'T-Shirt Essentiel Noir',
      description: 'Jersey de coton peigné 260g, col rond épais, tombé parfait au quotidien.',
      category: 'vetements',
      price: 45.00,
      stock: 42,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
      badge: '',
      sku: 'KS-VET-004'
    },
    {
      id: 'prod-5',
      name: 'Casque Audio ANC Studio',
      description: 'Réduction de bruit active hybride, autonomie 45h, aluminium anodisé et coussinets à mémoire de forme.',
      category: 'technologie',
      price: 279.00,
      stock: 11,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
      badge: 'Best-seller',
      sku: 'KS-TEC-001'
    },
    {
      id: 'prod-6',
      name: 'Clavier Mécanique Sans-Fil 75%',
      description: 'Châssis en aluminium CNC, switches tactiles silencieux, triple connexion Bluetooth / 2.4GHz / USB-C.',
      category: 'technologie',
      price: 159.00,
      stock: 7,
      image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=900&q=80',
      badge: 'Nouveau',
      sku: 'KS-TEC-002'
    },
    {
      id: 'prod-7',
      name: 'Montre Connectée Titane',
      description: 'Écran AMOLED saphir, suivi santé avancé, boîtier titane grade 5 et bracelet fluoroélastomère.',
      category: 'technologie',
      price: 329.00,
      stock: 5,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
      badge: 'Stock limité',
      sku: 'KS-TEC-003'
    },
    {
      id: 'prod-8',
      name: 'Station de Charge MagSafe 3-en-1',
      description: 'Charge rapide 15W pour smartphone, montre et écouteurs. Finition verre trempé et alliage de zinc.',
      category: 'technologie',
      price: 89.00,
      stock: 19,
      image: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?auto=format&fit=crop&w=900&q=80',
      badge: '',
      sku: 'KS-TEC-004'
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
    category: category === 'technologie' ? 'technologie' : 'vetements',
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
