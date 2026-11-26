import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import AdmZip from 'adm-zip';
import multer from 'multer';
import nodemailer from 'nodemailer';
import * as db from './db-adapter.js';

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
app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const adminRow = await db.loginAdmin(email, password);
  const envMatch = email === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;
  if (adminRow || envMatch) {
    const token = crypto.randomBytes(24).toString('hex');
    activeTokens.add(token);
    return res.json({ token, email });
  }
  return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
});

app.get('/api/admins', requireAdmin, async (req, res) => {
  res.json(await db.getAdmins());
});

app.post('/api/admins', requireAdmin, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password || password.length < 4) {
    return res.status(400).json({ error: 'Email et mot de passe (min 4 caractères) requis' });
  }
  try {
    res.status(201).json(await db.createAdmin({ id: `admin-${Date.now()}`, email, password }));
  } catch {
    res.status(400).json({ error: 'Cet email administrateur existe déjà' });
  }
});

app.delete('/api/admins/:id', requireAdmin, async (req, res) => {
  try {
    await db.deleteAdmin(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/logout', requireAdmin, (req, res) => {
  activeTokens.delete((req.headers.authorization || '').slice(7));
  res.json({ success: true });
});

// Products
app.get('/api/products', async (req, res) => {
  const showAll = req.query.all === '1';
  let onlyActive = true;
  if (showAll) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token && activeTokens.has(token)) onlyActive = false;
  }
  res.json(await db.getProducts(onlyActive));
});

app.post('/api/products', requireAdmin, async (req, res) => {
  const { name, description, category, price, discountPercent, stock, active, image, badge, sku } = req.body;
  if (!name || price === undefined || stock === undefined || !category) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }
  const newProduct = {
    id: `prod-${Date.now()}`,
    name: String(name).trim(),
    description: String(description || '').trim(),
    category: ['airpods', 'bracelets', 'montres', 'accessoires'].includes(category) ? category : 'airpods',
    price: Number(price),
    discountPercent: Math.min(99, Math.max(0, Number(discountPercent) || 0)),
    stock: Math.max(0, parseInt(stock, 10) || 0),
    active: active === undefined ? 1 : active ? 1 : 0,
    image: image || 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=900&q=80',
    badge: String(badge || '').trim(),
    sku: String(sku || `ZS-${Date.now().toString().slice(-4)}`).trim(),
  };
  res.status(201).json(await db.createProduct(newProduct));
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  const updated = await db.updateProduct(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(updated);
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  const ok = await db.deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Produit introuvable' });
  res.json({ success: true });
});

// Promos
app.post('/api/promos/validate', async (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'Code requis' });
  const promo = await db.validatePromo(code);
  if (!promo) return res.status(404).json({ error: 'Code promo invalide ou expiré' });
  res.json({ code: promo.code, discountPercent: promo.discountPercent });
});

app.get('/api/promos', requireAdmin, async (req, res) => {
  res.json(await db.getPromos());
});

app.post('/api/promos', requireAdmin, async (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const discountPercent = Math.min(99, Math.max(1, Number(req.body?.discountPercent) || 0));
  if (!code || discountPercent <= 0) return res.status(400).json({ error: 'Code et pourcentage requis' });
  try {
    res.status(201).json(await db.createPromo({ id: `promo-${Date.now()}`, code, discountPercent, active: 1 }));
  } catch {
    res.status(400).json({ error: 'Ce code promo existe déjà' });
  }
});

app.patch('/api/promos/:id', requireAdmin, async (req, res) => {
  const updated = await db.togglePromo(req.params.id, req.body.active ? 1 : 0);
  if (!updated) return res.status(404).json({ error: 'Code introuvable' });
  res.json(updated);
});

app.delete('/api/promos/:id', requireAdmin, async (req, res) => {
  await db.deletePromo(req.params.id);
  res.json({ success: true });
});

// Orders
app.get('/api/orders/track/:id', async (req, res) => {
  const order = await db.trackOrder(String(req.params.id || '').trim().toUpperCase());
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  res.json(order);
});

app.get('/api/orders', requireAdmin, async (req, res) => {
  res.json(await db.getOrders());
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
    </div>
  `;

  if (process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
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

app.post('/api/orders', async (req, res) => {
  const { customerName, customerEmail, customerAddress, items, promoCode } = req.body;
  if (!customerName || !customerEmail || !customerAddress || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Informations de commande incomplètes' });
  }
  try {
    const createdOrder = await db.placeOrder({ customerName, customerEmail, customerAddress, items, promoCode });
    sendOrderConfirmationEmail(createdOrder);
    res.status(201).json(createdOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/orders/:id', requireAdmin, async (req, res) => {
  const updated = await db.updateOrderStatus(req.params.id, req.body.status);
  if (!updated) return res.status(404).json({ error: 'Commande introuvable' });
  res.json(updated);
});

// Backup Export/Import ZIP
app.get('/api/backup/export', requireAdmin, async (req, res) => {
  const data = await db.exportAll();
  const zip = new AdmZip();
  zip.addFile('zonestore-backup.json', Buffer.from(JSON.stringify(data, null, 2), 'utf-8'));
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="zonestore-backup-${new Date().toISOString().slice(0, 10)}.zip"`);
  res.send(zip.toBuffer());
});

app.post('/api/backup/import', requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier ZIP fourni' });
  try {
    const zip = new AdmZip(req.file.buffer);
    const entry = zip.getEntry('zonestore-backup.json');
    if (!entry) return res.status(400).json({ error: 'Le fichier ZIP ne contient pas zonestore-backup.json' });
    await db.importAll(JSON.parse(entry.getData().toString('utf-8')));
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

db.initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`ZoneStore server running (${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}) on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
