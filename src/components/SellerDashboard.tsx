import React, { useState } from 'react';
import {
  Plus,
  Package,
  TrendingUp,
  ShoppingCart,
  Pencil,
  Trash2,
  X,
  Check,
  Lock,
  Download,
  Upload,
  Tag,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { Product, Order, Category, OrderStatus, PromoCode } from '../types';

interface SellerDashboardProps {
  token: string | null;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onLogout: () => void;
  products: Product[];
  orders: Order[];
  promos: PromoCode[];
  onCreateProduct: (data: Omit<Product, 'id'>) => Promise<void>;
  onUpdateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  onCreatePromo: (code: string, discountPercent: number) => Promise<void>;
  onTogglePromo: (id: string, active: number) => Promise<void>;
  onDeletePromo: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  token,
  onLogin,
  onLogout,
  products,
  orders,
  promos,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onCreatePromo,
  onTogglePromo,
  onDeletePromo,
  onRefresh,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'orders' | 'stock' | 'stats' | 'admins' | 'backup'>('stock');
  const [adminsList, setAdminsList] = useState<{ id: string; email: string }[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product form
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('airpods');
  const [price, setPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [stock, setStock] = useState('10');
  const [active, setActive] = useState(1);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [badge, setBadge] = useState('');
  const [saving, setSaving] = useState(false);

  // Promo form
  const [promoCode, setPromoCode] = useState('');
  const [promoPercent, setPromoPercent] = useState('10');

  // Backup state
  const [backupMsg, setBackupMsg] = useState('');

  if (!token) {
    const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      setLoggingIn(true);
      const ok = await onLogin(email, password);
      setLoggingIn(false);
      if (!ok) setLoginError('Email ou mot de passe incorrect');
    };

    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-3xl p-8 shadow-xl text-[#0A0A0A]">
          <div className="w-11 h-11 rounded-2xl bg-[#0A0A0A] text-white flex items-center justify-center mb-5">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#0A0A0A]">Espace Vendeur</h1>
          <p className="text-xs text-neutral-500 mt-1 mb-6">
            Connectez-vous pour gérer ZoneStore.
          </p>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zonestore.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-sm text-[#0A0A0A] placeholder:text-neutral-400 focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-sm text-[#0A0A0A] placeholder:text-neutral-400 focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full h-11 bg-[#0A0A0A] text-white rounded-full text-sm font-semibold hover:bg-neutral-800 cursor-pointer"
            >
              {loggingIn ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  React.useEffect(() => {
    if (token && activeTab === 'admins') {
      fetch('/api/admins', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : []))
        .then(setAdminsList)
        .catch(() => {});
    }
  }, [token, activeTab]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg('');
    const res = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAdminMsg(data.error || 'Erreur');
      return;
    }
    setAdminsList((prev) => [...prev, data]);
    setNewAdminEmail('');
    setNewAdminPassword('');
    setAdminMsg('Compte admin ajouté !');
  };

  const handleDeleteAdmin = async (id: string) => {
    setAdminMsg('');
    const res = await fetch(`/api/admins/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setAdminMsg(data.error || 'Erreur');
      return;
    }
    setAdminsList((prev) => prev.filter((a) => a.id !== id));
  };

  const validOrders = orders.filter((o) => o.status !== 'Annulée');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrder = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;
  const stockValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('airpods');
    setPrice('');
    setDiscountPercent('0');
    setStock('10');
    setActive(1);
    setDescription('');
    setImage('');
    setBadge('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setPrice(String(p.price));
    setDiscountPercent(String(p.discountPercent || 0));
    setStock(String(p.stock));
    setActive(p.active);
    setDescription(p.description);
    setImage(p.image);
    setBadge(p.badge || '');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name,
      category,
      price: parseFloat(price) || 0,
      discountPercent: parseFloat(discountPercent) || 0,
      stock: parseInt(stock, 10) || 0,
      active,
      description,
      image,
      badge,
    };
    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, payload);
    } else {
      await onCreateProduct(payload);
    }
    setSaving(false);
    setIsModalOpen(false);
  };

  const handleExportZip = async () => {
    setBackupMsg('Génération du fichier ZIP...');
    const res = await fetch('/api/backup/export', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setBackupMsg('Erreur lors de l’export');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zonestore-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('Sauvegarde ZIP téléchargée avec succès !');
  };

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupMsg('Importation en cours...');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/backup/import', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      setBackupMsg('Données restaurées avec succès !');
      await onRefresh();
    } else {
      setBackupMsg('Erreur lors de l’importation du ZIP.');
    }
    e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 text-[#0A0A0A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            ZoneStore Admin
          </span>
          <h1 className="font-display text-3xl font-bold mt-1">Tableau de bord vendeur</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A0A0A] text-white rounded-full text-sm font-medium hover:bg-neutral-800 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Ajouter un produit
          </button>
          <button
            onClick={onLogout}
            className="p-2.5 rounded-full border border-neutral-200 text-neutral-500 hover:text-red-600 cursor-pointer"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 my-6">
        {[
          { id: 'stock', label: `Stock (${products.length})` },
          { id: 'orders', label: `Commandes (${orders.length})` },
          { id: 'stats', label: 'Chiffres & Promos' },
          { id: 'admins', label: 'Comptes Admin' },
          { id: 'backup', label: 'Export / Import ZIP' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'bg-[#0A0A0A] text-white'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:text-[#0A0A0A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: STOCK */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 bg-neutral-50">
                  <th className="py-3.5 px-5">Produit</th>
                  <th className="py-3.5 px-4">Prix</th>
                  <th className="py-3.5 px-4">Réduction</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">En vente</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/60">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-neutral-100" />
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-neutral-400">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold">{p.price.toFixed(2)} DT</td>
                    <td className="py-3.5 px-4">
                      {p.discountPercent > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                          -{p.discountPercent}%
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onUpdateProduct(p.id, { stock: Math.max(0, p.stock - 1) })}
                          className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-medium">{p.stock}</span>
                        <button
                          onClick={() => onUpdateProduct(p.id, { stock: p.stock + 1 })}
                          className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onUpdateProduct(p.id, { active: p.active ? 0 : 1 })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
                          p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {p.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {p.active ? 'Visible' : 'Masqué'}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button onClick={() => openEditModal(p)} className="p-2 text-neutral-500 hover:text-[#0A0A0A] cursor-pointer">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-neutral-400 hover:text-red-600 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-500 text-sm">
              Aucune commande pour le moment.
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold">{order.id}</span>
                    <span className="text-xs text-neutral-400">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    {order.promoCode && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                        Promo: {order.promoCode} (-{order.discountAmount?.toFixed(2)} DT)
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{order.customerName} · {order.customerEmail}</p>
                  <p className="text-xs text-neutral-500">{order.customerAddress}</p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    {order.items.map((item, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-neutral-100 text-xs">
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between md:flex-col md:items-end gap-3">
                  <span className="font-display text-xl font-bold">{order.total.toFixed(2)} DT</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${(order.customerAddress.match(/Tél:\s*([0-9+\s]+)/)?.[1] || '').replace(/\s+/g, '')}?text=${encodeURIComponent(
                        `Bonjour ${order.customerName}, votre commande ${order.id} sur ZoneStore (${order.total.toFixed(2)} DT) est bien confirmée ! Statut : ${order.status}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#25D366] text-white hover:opacity-90"
                    >
                      WhatsApp
                    </a>
                    <select
                      value={order.status}
                      onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-neutral-200 bg-neutral-50 cursor-pointer"
                    >
                      <option value="En attente">En attente</option>
                      <option value="Expédiée">Expédiée</option>
                      <option value="Livrée">Livrée</option>
                      <option value="Annulée">Annulée</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: STATS & PROMO CODES */}
      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200">
              <div className="flex justify-between text-neutral-400 text-xs mb-2">
                <span>Chiffre d'affaires</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="font-display text-2xl font-bold">{totalRevenue.toFixed(2)} DT</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200">
              <div className="flex justify-between text-neutral-400 text-xs mb-2">
                <span>Commandes valides</span>
                <ShoppingCart className="w-4 h-4" />
              </div>
              <p className="font-display text-2xl font-bold">{validOrders.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200">
              <div className="flex justify-between text-neutral-400 text-xs mb-2">
                <span>Panier moyen</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="font-display text-2xl font-bold">{avgOrder.toFixed(2)} DT</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200">
              <div className="flex justify-between text-neutral-400 text-xs mb-2">
                <span>Valeur du stock</span>
                <Package className="w-4 h-4" />
              </div>
              <p className="font-display text-2xl font-bold">{stockValue.toFixed(2)} DT</p>
            </div>
          </div>

          {/* Promo Codes Section */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Codes Promo
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!promoCode.trim()) return;
                await onCreatePromo(promoCode.trim(), Number(promoPercent) || 10);
                setPromoCode('');
              }}
              className="flex flex-wrap gap-3 mb-6"
            >
              <input
                type="text"
                required
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Code (ex: ZONE20)"
                className="px-3.5 py-2 rounded-xl border border-neutral-200 text-sm uppercase"
              />
              <input
                type="number"
                min="1"
                max="99"
                required
                value={promoPercent}
                onChange={(e) => setPromoPercent(e.target.value)}
                placeholder="% réduction"
                className="w-32 px-3.5 py-2 rounded-xl border border-neutral-200 text-sm"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-[#0A0A0A] text-white rounded-xl text-sm font-medium cursor-pointer"
              >
                Créer le code
              </button>
            </form>

            <div className="space-y-2">
              {promos.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm">{pr.code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      -{pr.discountPercent}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTogglePromo(pr.id, pr.active ? 0 : 1)}
                      className={`text-xs px-3 py-1 rounded-full font-medium cursor-pointer ${
                        pr.active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {pr.active ? 'Actif' : 'Inactif'}
                    </button>
                    <button onClick={() => onDeletePromo(pr.id)} className="p-1.5 text-neutral-400 hover:text-red-600 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ADMINS */}
      {activeTab === 'admins' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 max-w-2xl">
          <h2 className="font-display text-xl font-bold mb-2">Comptes Administrateurs</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Ajoutez d’autres comptes vendeurs ayant accès à cet espace.
          </p>

          {adminMsg && (
            <div className="mb-4 p-3 rounded-xl bg-neutral-100 text-xs font-medium text-[#0A0A0A]">
              {adminMsg}
            </div>
          )}

          <form onSubmit={handleAddAdmin} className="flex flex-wrap gap-3 mb-6">
            <input
              type="email"
              required
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="Email (ex: vendeur@zonestore.com)"
              className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-[#0A0A0A]"
            />
            <input
              type="password"
              required
              minLength={4}
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-44 px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-[#0A0A0A]"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-[#0A0A0A] text-white rounded-xl text-sm font-medium cursor-pointer"
            >
              Ajouter
            </button>
          </form>

          <div className="space-y-2">
            {adminsList.map((adm) => (
              <div key={adm.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                <span className="text-sm font-medium text-[#0A0A0A]">{adm.email}</span>
                <button
                  onClick={() => handleDeleteAdmin(adm.id)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BACKUP ZIP */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 max-w-2xl">
          <h2 className="font-display text-xl font-bold">Sauvegarde & Migration Render (.zip)</h2>
          <p className="text-sm text-neutral-500 mt-2 mb-6">
            Exportez toutes vos données (produits, commandes, codes promo) dans un fichier ZIP. Si votre base de données gratuite Render expire, créez-en une nouvelle et importez simplement votre fichier ZIP.
          </p>

          {backupMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-neutral-100 text-sm font-medium text-[#0A0A0A]">
              {backupMsg}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleExportZip}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#0A0A0A] text-white rounded-full text-sm font-medium hover:bg-neutral-800 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Exporter tout en ZIP
            </button>

            <label className="inline-flex items-center gap-2 px-5 py-3 border border-neutral-300 bg-white text-[#0A0A0A] rounded-full text-sm font-medium hover:bg-neutral-50 cursor-pointer">
              <Upload className="w-4 h-4" />
              Importer un ZIP
              <input type="file" accept=".zip" onChange={handleImportZip} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold">{editingProduct ? 'Modifier le produit' : 'Nouveau produit'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Nom *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Catégorie *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white">
                    <option value="airpods">AirPods</option>
                    <option value="bracelets">Bracelet Lacoste</option>
                    <option value="montres">Montres</option>
                    <option value="accessoires">Accessoires</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Badge</label>
                  <input type="text" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Nouveau, Exclusif..." className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Prix (DT) *</label>
                  <input type="number" step="0.01" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Réduction (%)</label>
                  <input type="number" min="0" max="99" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Stock *</label>
                  <input type="number" min="0" required value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">URL Image</label>
                <input type="url" value={image} onChange={(e) => setImage(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm resize-none" />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-full border border-neutral-200 text-sm cursor-pointer">Annuler</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-full bg-[#0A0A0A] text-white text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer">
                  <Check className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
