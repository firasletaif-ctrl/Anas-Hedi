import pg from 'pg';
import sqliteDb from './db.js';

const { Pool } = pg;
const usePg = Boolean(process.env.DATABASE_URL);

let pool = null;
if (usePg) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

export async function initDb() {
  if (!usePg) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      image TEXT DEFAULT '',
      badge TEXT DEFAULT '',
      sku TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      "customerName" TEXT NOT NULL,
      "customerEmail" TEXT NOT NULL,
      "customerAddress" TEXT NOT NULL,
      "promoCode" TEXT DEFAULT '',
      "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      total DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'En attente',
      "createdAt" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      "orderId" TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      "productId" TEXT NOT NULL,
      name TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      quantity INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promo_codes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      "discountPercent" DOUBLE PRECISION NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const { rows: prodCount } = await pool.query('SELECT COUNT(*)::int AS count FROM products');
  if (prodCount[0].count === 0) {
    const sqliteProds = sqliteDb.prepare('SELECT * FROM products').all();
    for (const p of sqliteProds) {
      await pool.query(
        `INSERT INTO products (id, name, description, category, price, "discountPercent", stock, active, image, badge, sku)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [p.id, p.name, p.description, p.category, p.price, p.discountPercent, p.stock, p.active, p.image, p.badge, p.sku]
      );
    }
  }

  const { rows: promoCount } = await pool.query('SELECT COUNT(*)::int AS count FROM promo_codes');
  if (promoCount[0].count === 0) {
    await pool.query(
      `INSERT INTO promo_codes (id, code, "discountPercent", active) VALUES ('promo-1', 'ZONE10', 10, 1)`
    );
  }

  const { rows: adminCount } = await pool.query('SELECT COUNT(*)::int AS count FROM admins');
  if (adminCount[0].count === 0) {
    const defaultEmail = (process.env.ADMIN_EMAIL || 'admin@zonestore.com').toLowerCase();
    const defaultPassword = process.env.ADMIN_PASSWORD || 'ZoneStore2026!';
    await pool.query(
      `INSERT INTO admins (id, email, password) VALUES ('admin-1', $1, $2)`,
      [defaultEmail, defaultPassword]
    );
  }
}

export async function loginAdmin(email, password) {
  if (usePg) {
    const { rows } = await pool.query(
      'SELECT * FROM admins WHERE LOWER(email) = $1 AND password = $2',
      [email, password]
    );
    return rows[0] || null;
  }
  return sqliteDb.prepare('SELECT * FROM admins WHERE LOWER(email) = ? AND password = ?').get(email, password);
}

export async function getAdmins() {
  if (usePg) {
    const { rows } = await pool.query('SELECT id, email, created_at FROM admins ORDER BY created_at ASC');
    return rows;
  }
  return sqliteDb.prepare('SELECT id, email, created_at FROM admins ORDER BY rowid ASC').all();
}

export async function createAdmin(a) {
  if (usePg) {
    await pool.query('INSERT INTO admins (id, email, password) VALUES ($1, $2, $3)', [a.id, a.email, a.password]);
    return { id: a.id, email: a.email };
  }
  sqliteDb.prepare('INSERT INTO admins (id, email, password) VALUES (@id, @email, @password)').run(a);
  return { id: a.id, email: a.email };
}

export async function deleteAdmin(id) {
  if (usePg) {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM admins');
    if (rows[0].count <= 1) throw new Error('Impossible de supprimer le dernier administrateur');
    await pool.query('DELETE FROM admins WHERE id = $1', [id]);
    return;
  }
  const count = sqliteDb.prepare('SELECT COUNT(*) AS count FROM admins').get().count;
  if (count <= 1) throw new Error('Impossible de supprimer le dernier administrateur');
  sqliteDb.prepare('DELETE FROM admins WHERE id = ?').run(id);
}

export async function getProducts(onlyActive) {
  if (usePg) {
    const sql = onlyActive
      ? 'SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC'
      : 'SELECT * FROM products ORDER BY created_at DESC';
    const { rows } = await pool.query(sql);
    return rows;
  }
  const sql = onlyActive
    ? 'SELECT * FROM products WHERE active = 1 ORDER BY rowid DESC'
    : 'SELECT * FROM products ORDER BY rowid DESC';
  return sqliteDb.prepare(sql).all();
}

export async function createProduct(p) {
  if (usePg) {
    await pool.query(
      `INSERT INTO products (id, name, description, category, price, "discountPercent", stock, active, image, badge, sku)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [p.id, p.name, p.description, p.category, p.price, p.discountPercent, p.stock, p.active, p.image, p.badge, p.sku]
    );
    return p;
  }
  sqliteDb.prepare(`
    INSERT INTO products (id, name, description, category, price, discountPercent, stock, active, image, badge, sku)
    VALUES (@id, @name, @description, @category, @price, @discountPercent, @stock, @active, @image, @badge, @sku)
  `).run(p);
  return p;
}

export async function updateProduct(id, fields) {
  if (usePg) {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    const existing = rows[0];
    if (!existing) return null;
    const updated = {
      ...existing,
      ...fields,
      id: existing.id,
      price: fields.price !== undefined ? Number(fields.price) : existing.price,
      discountPercent: fields.discountPercent !== undefined ? Math.min(99, Math.max(0, Number(fields.discountPercent) || 0)) : existing.discountPercent,
      stock: fields.stock !== undefined ? Math.max(0, parseInt(fields.stock, 10) || 0) : existing.stock,
      active: fields.active !== undefined ? (fields.active ? 1 : 0) : existing.active,
    };
    await pool.query(
      `UPDATE products SET name=$1, description=$2, category=$3, price=$4, "discountPercent"=$5, stock=$6, active=$7, image=$8, badge=$9, sku=$10 WHERE id=$11`,
      [updated.name, updated.description, updated.category, updated.price, updated.discountPercent, updated.stock, updated.active, updated.image, updated.badge, updated.sku, id]
    );
    return updated;
  }
  const existing = sqliteDb.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return null;
  const updated = {
    ...existing,
    ...fields,
    id: existing.id,
    price: fields.price !== undefined ? Number(fields.price) : existing.price,
    discountPercent: fields.discountPercent !== undefined ? Math.min(99, Math.max(0, Number(fields.discountPercent) || 0)) : existing.discountPercent,
    stock: fields.stock !== undefined ? Math.max(0, parseInt(fields.stock, 10) || 0) : existing.stock,
    active: fields.active !== undefined ? (fields.active ? 1 : 0) : existing.active,
  };
  sqliteDb.prepare(`
    UPDATE products SET name=@name, description=@description, category=@category, price=@price, discountPercent=@discountPercent, stock=@stock, active=@active, image=@image, badge=@badge, sku=@sku WHERE id=@id
  `).run(updated);
  return updated;
}

export async function deleteProduct(id) {
  if (usePg) {
    const res = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return res.rowCount > 0;
  }
  return sqliteDb.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;
}

export async function validatePromo(code) {
  if (usePg) {
    const { rows } = await pool.query('SELECT * FROM promo_codes WHERE UPPER(code) = $1 AND active = 1', [code]);
    return rows[0] || null;
  }
  return sqliteDb.prepare('SELECT * FROM promo_codes WHERE UPPER(code) = ? AND active = 1').get(code);
}

export async function getPromos() {
  if (usePg) {
    const { rows } = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    return rows;
  }
  return sqliteDb.prepare('SELECT * FROM promo_codes ORDER BY rowid DESC').all();
}

export async function createPromo(p) {
  if (usePg) {
    await pool.query('INSERT INTO promo_codes (id, code, "discountPercent", active) VALUES ($1,$2,$3,$4)', [p.id, p.code, p.discountPercent, p.active]);
    return p;
  }
  sqliteDb.prepare('INSERT INTO promo_codes (id, code, discountPercent, active) VALUES (@id, @code, @discountPercent, @active)').run(p);
  return p;
}

export async function togglePromo(id, active) {
  if (usePg) {
    const { rows } = await pool.query('SELECT * FROM promo_codes WHERE id = $1', [id]);
    if (!rows[0]) return null;
    await pool.query('UPDATE promo_codes SET active = $1 WHERE id = $2', [active, id]);
    return { ...rows[0], active };
  }
  const existing = sqliteDb.prepare('SELECT * FROM promo_codes WHERE id = ?').get(id);
  if (!existing) return null;
  sqliteDb.prepare('UPDATE promo_codes SET active = ? WHERE id = ?').run(active, id);
  return { ...existing, active };
}

export async function deletePromo(id) {
  if (usePg) {
    await pool.query('DELETE FROM promo_codes WHERE id = $1', [id]);
    return;
  }
  sqliteDb.prepare('DELETE FROM promo_codes WHERE id = ?').run(id);
}

export async function getOrders() {
  if (usePg) {
    const { rows: orders } = await pool.query('SELECT * FROM orders ORDER BY "createdAt" DESC');
    for (const o of orders) {
      const { rows: items } = await pool.query('SELECT "productId", name, price, quantity FROM order_items WHERE "orderId" = $1', [o.id]);
      o.items = items;
    }
    return orders;
  }
  const orders = sqliteDb.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
  const getItems = sqliteDb.prepare('SELECT productId, name, price, quantity FROM order_items WHERE orderId = ?');
  return orders.map((o) => ({ ...o, items: getItems.all(o.id) }));
}

export async function trackOrder(id) {
  if (usePg) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE UPPER(id) = $1', [id]);
    if (!rows[0]) return null;
    const { rows: items } = await pool.query('SELECT "productId", name, price, quantity FROM order_items WHERE "orderId" = $1', [rows[0].id]);
    return { ...rows[0], items };
  }
  const order = sqliteDb.prepare('SELECT * FROM orders WHERE UPPER(id) = ?').get(id);
  if (!order) return null;
  const items = sqliteDb.prepare('SELECT productId, name, price, quantity FROM order_items WHERE orderId = ?').all(order.id);
  return { ...order, items };
}

export async function placeOrder({ customerName, customerEmail, customerAddress, items, promoCode }) {
  if (usePg) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let subtotal = 0;
      const orderItems = [];
      for (const item of items) {
        const { rows } = await client.query('SELECT * FROM products WHERE id = $1 AND active = 1', [item.productId]);
        const product = rows[0];
        if (!product) throw new Error(`Produit indisponible: ${item.productId}`);
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        if (product.stock < qty) throw new Error(`Stock insuffisant pour ${product.name}`);
        const effectivePrice = Number((product.price * (1 - (product.discountPercent || 0) / 100)).toFixed(2));
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [qty, product.id]);
        subtotal += effectivePrice * qty;
        orderItems.push({ productId: product.id, name: product.name, price: effectivePrice, quantity: qty });
      }
      let appliedPromo = '';
      let discountAmount = 0;
      if (promoCode) {
        const { rows } = await client.query('SELECT * FROM promo_codes WHERE UPPER(code) = $1 AND active = 1', [String(promoCode).trim().toUpperCase()]);
        if (rows[0]) {
          appliedPromo = rows[0].code;
          discountAmount = Number(((subtotal * rows[0].discountPercent) / 100).toFixed(2));
        }
      }
      const total = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
      const newOrder = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        customerName: String(customerName).trim(),
        customerEmail: String(customerEmail).trim(),
        customerAddress: String(customerAddress).trim(),
        promoCode: appliedPromo,
        discountAmount,
        total,
        status: 'En attente',
        createdAt: new Date().toISOString(),
      };
      await client.query(
        `INSERT INTO orders (id, "customerName", "customerEmail", "customerAddress", "promoCode", "discountAmount", total, status, "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [newOrder.id, newOrder.customerName, newOrder.customerEmail, newOrder.customerAddress, newOrder.promoCode, newOrder.discountAmount, newOrder.total, newOrder.status, newOrder.createdAt]
      );
      for (const oi of orderItems) {
        await client.query(
          `INSERT INTO order_items ("orderId", "productId", name, price, quantity) VALUES ($1,$2,$3,$4,$5)`,
          [newOrder.id, oi.productId, oi.name, oi.price, oi.quantity]
        );
      }
      await client.query('COMMIT');
      return { ...newOrder, items: orderItems };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // SQLite
  const tx = sqliteDb.transaction(() => {
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = sqliteDb.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(item.productId);
      if (!product) throw new Error(`Produit indisponible: ${item.productId}`);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (product.stock < qty) throw new Error(`Stock insuffisant pour ${product.name}`);
      const effectivePrice = Number((product.price * (1 - (product.discountPercent || 0) / 100)).toFixed(2));
      sqliteDb.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, product.id);
      subtotal += effectivePrice * qty;
      orderItems.push({ productId: product.id, name: product.name, price: effectivePrice, quantity: qty });
    }
    let appliedPromo = '';
    let discountAmount = 0;
    if (promoCode) {
      const promo = sqliteDb.prepare('SELECT * FROM promo_codes WHERE UPPER(code) = ? AND active = 1').get(String(promoCode).trim().toUpperCase());
      if (promo) {
        appliedPromo = promo.code;
        discountAmount = Number(((subtotal * promo.discountPercent) / 100).toFixed(2));
      }
    }
    const total = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
    const newOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim(),
      customerAddress: String(customerAddress).trim(),
      promoCode: appliedPromo,
      discountAmount,
      total,
      status: 'En attente',
      createdAt: new Date().toISOString(),
    };
    sqliteDb.prepare(`INSERT INTO orders (id, customerName, customerEmail, customerAddress, promoCode, discountAmount, total, status, createdAt) VALUES (@id, @customerName, @customerEmail, @customerAddress, @promoCode, @discountAmount, @total, @status, @createdAt)`).run(newOrder);
    const insItem = sqliteDb.prepare(`INSERT INTO order_items (orderId, productId, name, price, quantity) VALUES (@orderId, @productId, @name, @price, @quantity)`);
    for (const oi of orderItems) insItem.run({ orderId: newOrder.id, ...oi });
    return { ...newOrder, items: orderItems };
  });
  return tx();
}

export async function updateOrderStatus(id, status) {
  if (usePg) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!rows[0]) return null;
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    const { rows: items } = await pool.query('SELECT "productId", name, price, quantity FROM order_items WHERE "orderId" = $1', [id]);
    return { ...rows[0], status, items };
  }
  const existing = sqliteDb.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!existing) return null;
  sqliteDb.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  const items = sqliteDb.prepare('SELECT productId, name, price, quantity FROM order_items WHERE orderId = ?').all(id);
  return { ...existing, status, items };
}

export async function exportAll() {
  if (usePg) {
    const products = (await pool.query('SELECT * FROM products')).rows;
    const orders = (await pool.query('SELECT * FROM orders')).rows;
    const order_items = (await pool.query('SELECT * FROM order_items')).rows;
    const promo_codes = (await pool.query('SELECT * FROM promo_codes')).rows;
    return { exportedAt: new Date().toISOString(), products, orders, order_items, promo_codes };
  }
  return {
    exportedAt: new Date().toISOString(),
    products: sqliteDb.prepare('SELECT * FROM products').all(),
    orders: sqliteDb.prepare('SELECT * FROM orders').all(),
    order_items: sqliteDb.prepare('SELECT * FROM order_items').all(),
    promo_codes: sqliteDb.prepare('SELECT * FROM promo_codes').all(),
  };
}

export async function importAll(parsed) {
  if (usePg) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM order_items');
      await client.query('DELETE FROM orders');
      await client.query('DELETE FROM products');
      await client.query('DELETE FROM promo_codes');
      for (const p of parsed.products || []) {
        await client.query(
          `INSERT INTO products (id, name, description, category, price, "discountPercent", stock, active, image, badge, sku) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [p.id, p.name, p.description || '', p.category, p.price, p.discountPercent || 0, p.stock, p.active ?? 1, p.image || '', p.badge || '', p.sku || '']
        );
      }
      for (const o of parsed.orders || []) {
        await client.query(
          `INSERT INTO orders (id, "customerName", "customerEmail", "customerAddress", "promoCode", "discountAmount", total, status, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [o.id, o.customerName, o.customerEmail, o.customerAddress, o.promoCode || '', o.discountAmount || 0, o.total, o.status, o.createdAt]
        );
      }
      for (const oi of parsed.order_items || []) {
        await client.query(
          `INSERT INTO order_items ("orderId", "productId", name, price, quantity) VALUES ($1,$2,$3,$4,$5)`,
          [oi.orderId, oi.productId, oi.name, oi.price, oi.quantity]
        );
      }
      for (const pr of parsed.promo_codes || []) {
        await client.query(
          `INSERT INTO promo_codes (id, code, "discountPercent", active) VALUES ($1,$2,$3,$4)`,
          [pr.id, pr.code, pr.discountPercent, pr.active ?? 1]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    return;
  }

  const restore = sqliteDb.transaction(() => {
    sqliteDb.prepare('DELETE FROM order_items').run();
    sqliteDb.prepare('DELETE FROM orders').run();
    sqliteDb.prepare('DELETE FROM products').run();
    sqliteDb.prepare('DELETE FROM promo_codes').run();
    const insProd = sqliteDb.prepare(`INSERT INTO products (id, name, description, category, price, discountPercent, stock, active, image, badge, sku) VALUES (@id, @name, @description, @category, @price, @discountPercent, @stock, @active, @image, @badge, @sku)`);
    for (const p of parsed.products || []) insProd.run({ discountPercent: 0, active: 1, badge: '', sku: '', description: '', image: '', ...p });
    const insOrd = sqliteDb.prepare(`INSERT INTO orders (id, customerName, customerEmail, customerAddress, promoCode, discountAmount, total, status, createdAt) VALUES (@id, @customerName, @customerEmail, @customerAddress, @promoCode, @discountAmount, @total, @status, @createdAt)`);
    for (const o of parsed.orders || []) insOrd.run({ promoCode: '', discountAmount: 0, ...o });
    const insItem = sqliteDb.prepare(`INSERT INTO order_items (orderId, productId, name, price, quantity) VALUES (@orderId, @productId, @name, @price, @quantity)`);
    for (const oi of parsed.order_items || []) insItem.run(oi);
    const insPromo = sqliteDb.prepare(`INSERT INTO promo_codes (id, code, discountPercent, active) VALUES (@id, @code, @discountPercent, @active)`);
    for (const pr of parsed.promo_codes || []) insPromo.run(pr);
  });
  restore();
}
