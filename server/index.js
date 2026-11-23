import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Products endpoints
app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY rowid DESC').all();
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const { name, description, category, price, stock, image, badge, sku } = req.body;
  if (!name || price === undefined || stock === undefined || !category) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  const newProduct = {
    id: `prod-${Date.now()}`,
    name: String(name).trim(),
    description: String(description || '').trim(),
    category: ['airpods', 'accessoires', 'vetements', 'technologie'].includes(category)
      ? category
      : 'accessoires',
    price: Number(price),
    stock: Math.max(0, parseInt(stock, 10) || 0),
    image:
      image ||
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=900&q=80',
    badge: String(badge || '').trim(),
    sku: String(sku || `KS-${Date.now().toString().slice(-4)}`).trim(),
  };

  db.prepare(`
    INSERT INTO products (id, name, description, category, price, stock, image, badge, sku)
    VALUES (@id, @name, @description, @category, @price, @stock, @image, @badge, @sku)
  `).run(newProduct);

  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Produit introuvable' });
  }

  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
    stock:
      req.body.stock !== undefined
        ? Math.max(0, parseInt(req.body.stock, 10) || 0)
        : existing.stock,
  };

  db.prepare(`
    UPDATE products
    SET name = @name,
        description = @description,
        category = @category,
        price = @price,
        stock = @stock,
        image = @image,
        badge = @badge,
        sku = @sku
    WHERE id = @id
  `).run(updated);

  res.json(updated);
});

app.delete('/api/products/:id', (req, res) => {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Produit introuvable' });
  }
  res.json({ success: true });
});

// Orders endpoints
app.get('/api/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
  const getItems = db.prepare('SELECT productId, name, price, quantity FROM order_items WHERE orderId = ?');

  const result = orders.map((order) => ({
    ...order,
    items: getItems.all(order.id),
  }));

  res.json(result);
});

app.post('/api/orders', (req, res) => {
  const { customerName, customerEmail, customerAddress, items } = req.body;
  if (!customerName || !customerEmail || !customerAddress || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Informations de commande incomplètes' });
  }

  const placeOrder = db.transaction(() => {
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
      if (!product) {
        throw new Error(`Produit introuvable: ${item.productId}`);
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (product.stock < qty) {
        throw new Error(`Stock insuffisant pour ${product.name} (${product.stock} disponible)`);
      }

      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, product.id);
      total += product.price * qty;
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: qty,
      });
    }

    const orderCount = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
    const newOrder = {
      id: `ORD-${1000 + orderCount + 1}`,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim(),
      customerAddress: String(customerAddress).trim(),
      total: Number(total.toFixed(2)),
      status: 'En attente',
      createdAt: new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO orders (id, customerName, customerEmail, customerAddress, total, status, createdAt)
      VALUES (@id, @customerName, @customerEmail, @customerAddress, @total, @status, @createdAt)
    `).run(newOrder);

    const insertItem = db.prepare(`
      INSERT INTO order_items (orderId, productId, name, price, quantity)
      VALUES (@orderId, @productId, @name, @price, @quantity)
    `);
    for (const oi of orderItems) {
      insertItem.run({ orderId: newOrder.id, ...oi });
    }

    return { ...newOrder, items: orderItems };
  });

  try {
    const createdOrder = placeOrder();
    res.status(201).json(createdOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/orders/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Commande introuvable' });
  }
  const status = req.body.status || existing.status;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const items = db.prepare('SELECT productId, name, price, quantity FROM order_items WHERE orderId = ?').all(req.params.id);
  res.json({ ...existing, status, items });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`API server running with SQLite on http://127.0.0.1:${PORT}`);
});
