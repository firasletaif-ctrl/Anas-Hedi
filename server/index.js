import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import AdmZip from 'adm-zip';
import multer from 'multer';
import nodemailer from 'nodemailer';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@zonestore.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ZoneStore2026!';
const activeTokens = new Set();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: 'Accès non autorisé' });
  }
  next();
}

// Auth
app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const adminRow = db.prepare('SELECT * FROM admins WHERE LOWER(email) = ? AND password = ?').get(email, password);
  const envMatch = email === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;

  if (adminRow || envMatch) {
    const token = crypto.randomBytes(24).toString('hex');
    activeTokens.add(token);
    return res.json({ token, email });
  }
  return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
});

app.get('/api/admins', requireAdmin, (req, res) => {
  const admins = db.prepare('SELECT id, email, created_at FROM admins ORDER BY rowid ASC').all();
  res.json(admins);
});

app.post('/api/admins', requireAdmin, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password || password.length < 4) {
    return res.status(400).json({ error: 'Email et mot de passe (min 4 caractères) requis' });
  }
  try {
    const newAdmin = {
      id: `admin-${Date.now()}`,
      email,
      password,
    };
    db.prepare('INSERT INTO admins (id, email, password) VALUES (@id, @email, @password)').run(newAdmin);
    res.status(201).json({ id: newAdmin.id, email: newAdmin.email });
  } catch {
    res.status(400).json({ error: 'Cet email administrateur existe déjà' });
  }
});

app.delete('/api/admins/:id', requireAdmin, (req, res) => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM admins').get().count;
  if (count <= 1) {
    return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' });
  }
  db.prepare('DELETE FROM admins WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/auth/logout', requireAdmin, (req, res) => {
  const token = (req.headers.authorization || '').slice(7);
  activeTokens.delete(token);
  res.json({ success: true });
});

// Products endpoints
app.get('/api/products', (req, res) => {
  const showAll = req.query.all === '1';
  if (showAll) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token && activeTokens.has(token)) {
      const products = db.prepare('SELECT * FROM products ORDER BY rowid DESC').all();
      return res.json(products);
    }
  }
  const products = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY rowid DESC').all();
  res.json(products);
});

app.post('/api/products', requireAdmin, (req, res) => {
  const { name, description, category, price, discountPercent, stock, active, image, badge, sku } = req.body;
  if (!name || price === undefined || stock === undefined || !category) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  const newProduct = {
    id: `prod-${Date.now()}`,
    name: String(name).trim(),
    description: String(description || '').trim(),
    category: ['airpods', 'bracelets', 'montres', 'accessoires'].includes(category)
      ? category
      : 'airpods',
    price: Number(price),
    discountPercent: Math.min(99, Math.max(0, Number(discountPercent) || 0)),
    stock: Math.max(0, parseInt(stock, 10) || 0),
    active: active === undefined ? 1 : active ? 1 : 0,
    image:
      image ||
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=900&q=80',
    badge: String(badge || '').trim(),
    sku: String(sku || `ZS-${Date.now().toString().slice(-4)}`).trim(),
  };

  db.prepare(`
    INSERT INTO products (id, name, description, category, price, discountPercent, stock, active, image, badge, sku)
    VALUES (@id, @name, @description, @category, @price, @discountPercent, @stock, @active, @image, @badge, @sku)
  `).run(newProduct);

  res.status(201).json(newProduct);
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Produit introuvable' });
  }

  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
    discountPercent:
      req.body.discountPercent !== undefined
        ? Math.min(99, Math.max(0, Number(req.body.discountPercent) || 0))
        : existing.discountPercent,
    stock:
      req.body.stock !== undefined
        ? Math.max(0, parseInt(req.body.stock, 10) || 0)
        : existing.stock,
    active:
      req.body.active !== undefined ? (req.body.active ? 1 : 0) : existing.active,
  };

  db.prepare(`
    UPDATE products
    SET name = @name,
        description = @description,
        category = @category,
        price = @price,
        discountPercent = @discountPercent,
        stock = @stock,
        active = @active,
        image = @image,
        badge = @badge,
        sku = @sku
    WHERE id = @id
  `).run(updated);

  res.json(updated);
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Produit introuvable' });
  }
  res.json({ success: true });
});

// Promo codes endpoints
app.post('/api/promos/validate', (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'Code requis' });

  const promo = db.prepare('SELECT * FROM promo_codes WHERE UPPER(code) = ? AND active = 1').get(code);
  if (!promo) {
    return res.status(404).json({ error: 'Code promo invalide ou expiré' });
  }
  res.json({ code: promo.code, discountPercent: promo.discountPercent });
});

app.get('/api/promos', requireAdmin, (req, res) => {
  const promos = db.prepare('SELECT * FROM promo_codes ORDER BY rowid DESC').all();
  res.json(promos);
});

app.post('/api/promos', requireAdmin, (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const discountPercent = Math.min(99, Math.max(1, Number(req.body?.discountPercent) || 0));
  if (!code || discountPercent <= 0) {
    return res.status(400).json({ error: 'Code et pourcentage requis' });
  }
  try {
    const newPromo = {
      id: `promo-${Date.now()}`,
      code,
      discountPercent,
      active: 1,
    };
    db.prepare(`
      INSERT INTO promo_codes (id, code, discountPercent, active)
      VALUES (@id, @code, @discountPercent, @active)
    `).run(newPromo);
    res.status(201).json(newPromo);
  } catch {
    res.status(400).json({ error: 'Ce code promo existe déjà' });
  }
});

app.patch('/api/promos/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Code introuvable' });
  const active = req.body.active !== undefined ? (req.body.active ? 1 : 0) : existing.active;
  db.prepare('UPDATE promo_codes SET active = ? WHERE id = ?').run(active, req.params.id);
  res.json({ ...existing, active });
});

app.delete('/api/promos/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM promo_codes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Public order tracking by ID
app.get('/api/orders/track/:id', (req, res) => {
  const orderId = String(req.params.id || '').trim().toUpperCase();
  const order = db.prepare('SELECT * FROM orders WHERE UPPER(id) = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Commande introuvable' });
  }
  const items = db.prepare('SELECT productId, name, price, quantity FROM order_items WHERE orderId = ?').all(order.id);
  res.json({ ...order, items });
});

// Orders endpoints
app.get('/api/orders', requireAdmin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
  const getItems = db.prepare('SELECT productId, name, price, quantity FROM order_items WHERE orderId = ?');

  const result = orders.map((order) => ({
    ...order,
    items: getItems.all(order.id),
  }));

  res.json(result);
});

app.post('/api/orders', (req, res) => {
  const { customerName, customerEmail, customerAddress, items, promoCode } = req.body;
  if (!customerName || !customerEmail || !customerAddress || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Informations de commande incomplètes' });
  }

  const placeOrder = db.transaction(() => {
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(item.productId);
      if (!product) {
        throw new Error(`Produit indisponible: ${item.productId}`);
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (product.stock < qty) {
        throw new Error(`Stock insuffisant pour ${product.name} (${product.stock} disponible)`);
      }

      const effectivePrice = Number((product.price * (1 - (product.discountPercent || 0) / 100)).toFixed(2));
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, product.id);
      subtotal += effectivePrice * qty;
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: effectivePrice,
        quantity: qty,
      });
    }

    let appliedPromo = '';
    let discountAmount = 0;
    if (promoCode) {
      const cleanCode = String(promoCode).trim().toUpperCase();
      const promo = db.prepare('SELECT * FROM promo_codes WHERE UPPER(code) = ? AND active = 1').get(cleanCode);
      if (promo) {
        appliedPromo = promo.code;
        discountAmount = Number(((subtotal * promo.discountPercent) / 100).toFixed(2));
      }
    }

    const total = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
    const orderCount = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
    const newOrder = {
      id: `ORD-${1000 + orderCount + 1}`,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim(),
      customerAddress: String(customerAddress).trim(),
      promoCode: appliedPromo,
      discountAmount,
      total,
      status: 'En attente',
      createdAt: new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO orders (id, customerName, customerEmail, customerAddress, promoCode, discountAmount, total, status, createdAt)
      VALUES (@id, @customerName, @customerEmail, @customerAddress, @promoCode, @discountAmount, @total, @status, @createdAt)
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

async function sendOrderConfirmationEmail(order) {
  const itemsHtml = order.items
    .map((i) => `<li>${i.quantity}x ${i.name} — ${(i.price * i.quantity).toFixed(2)} DT</li>`)
    .join('');

  const htmlContent = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px;">
      <h2 style="margin:0 0 8px;">Merci pour votre commande, ${order.customerName} !</h2>
      <p style="color:#666;font-size:14px;">Numéro de commande : <strong>${order.id}</strong></p>
      <ul style="padding-left:18px;font-size:14px;">${itemsHtml}</ul>
      <p style="font-size:16px;font-weight:bold;margin-top:16px;">Total : ${order.total.toFixed(2)} DT</p>
      <p style="color:#666;font-size:13px;">Adresse : ${order.customerAddress}</p>
      <p style="color:#888;font-size:12px;margin-top:24px;">ZoneStore — Vous pouvez suivre votre commande à tout moment sur le site avec le numéro ${order.id}.</p>
    </div>
  `;

  // Option 1: Resend API (RESEND_API_KEY)
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'ZoneStore <onboarding@resend.dev>',
          to: [order.customerEmail],
          subject: `Confirmation de votre commande ${order.id} — ZoneStore`,
          html: htmlContent,
        }),
      });
      return;
    } catch (err) {
      console.error('Erreur Resend:', err.message);
    }
  }

  // Option 2: SMTP (Nodemailer)
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) return;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"ZoneStore" <${smtpUser}>`,
      to: order.customerEmail,
      subject: `Confirmation de votre commande ${order.id} — ZoneStore`,
      html: htmlContent,
    });
  } catch (err) {
    console.error('Erreur envoi email:', err.message);
  }
}

  try {
    const createdOrder = placeOrder();
    sendOrderConfirmationEmail(createdOrder);
    res.status(201).json(createdOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/orders/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Commande introuvable' });
  }
  const status = req.body.status || existing.status;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const items = db.prepare('SELECT productId, name, price, quantity FROM order_items WHERE orderId = ?').all(req.params.id);
  res.json({ ...existing, status, items });
});

// Backup Export ZIP
app.get('/api/backup/export', requireAdmin, (req, res) => {
  const data = {
    exportedAt: new Date().toISOString(),
    products: db.prepare('SELECT * FROM products').all(),
    orders: db.prepare('SELECT * FROM orders').all(),
    order_items: db.prepare('SELECT * FROM order_items').all(),
    promo_codes: db.prepare('SELECT * FROM promo_codes').all(),
  };

  const zip = new AdmZip();
  zip.addFile('zonestore-backup.json', Buffer.from(JSON.stringify(data, null, 2), 'utf-8'));
  const buffer = zip.toBuffer();

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="zonestore-backup-${new Date().toISOString().slice(0, 10)}.zip"`);
  res.send(buffer);
});

// Backup Import ZIP
app.post('/api/backup/import', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier ZIP fourni' });
  }

  try {
    const zip = new AdmZip(req.file.buffer);
    const entry = zip.getEntry('zonestore-backup.json');
    if (!entry) {
      return res.status(400).json({ error: 'Le fichier ZIP ne contient pas zonestore-backup.json' });
    }

    const parsed = JSON.parse(entry.getData().toString('utf-8'));
    const restore = db.transaction(() => {
      db.prepare('DELETE FROM order_items').run();
      db.prepare('DELETE FROM orders').run();
      db.prepare('DELETE FROM products').run();
      db.prepare('DELETE FROM promo_codes').run();

      const insProd = db.prepare(`
        INSERT INTO products (id, name, description, category, price, discountPercent, stock, active, image, badge, sku)
        VALUES (@id, @name, @description, @category, @price, @discountPercent, @stock, @active, @image, @badge, @sku)
      `);
      for (const p of parsed.products || []) {
        insProd.run({
          discountPercent: 0,
          active: 1,
          badge: '',
          sku: '',
          description: '',
          image: '',
          ...p,
        });
      }

      const insOrd = db.prepare(`
        INSERT INTO orders (id, customerName, customerEmail, customerAddress, promoCode, discountAmount, total, status, createdAt)
        VALUES (@id, @customerName, @customerEmail, @customerAddress, @promoCode, @discountAmount, @total, @status, @createdAt)
      `);
      for (const o of parsed.orders || []) {
        insOrd.run({ promoCode: '', discountAmount: 0, ...o });
      }

      const insItem = db.prepare(`
        INSERT INTO order_items (orderId, productId, name, price, quantity)
        VALUES (@orderId, @productId, @name, @price, @quantity)
      `);
      for (const oi of parsed.order_items || []) {
        insItem.run(oi);
      }

      const insPromo = db.prepare(`
        INSERT INTO promo_codes (id, code, discountPercent, active)
        VALUES (@id, @code, @discountPercent, @active)
      `);
      for (const pr of parsed.promo_codes || []) {
        insPromo.run(pr);
      }
    });

    restore();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Erreur lors de l’import ZIP: ' + err.message });
  }
});

// Serve built frontend in production (Render)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ZoneStore server running with SQLite on http://0.0.0.0:${PORT}`);
});
