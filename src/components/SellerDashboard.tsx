import React, { useState } from 'react';
import {
  Plus,
  Package,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { Product, Order, Category, OrderStatus } from '../types';

interface SellerDashboardProps {
  products: Product[];
  orders: Order[];
  onCreateProduct: (data: Omit<Product, 'id'>) => Promise<void>;
  onUpdateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
}

const PRESET_IMAGES: Record<Category, string[]> = {
  vetements: [
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
  ],
  technologie: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
  ],
};

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  products,
  orders,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('vetements');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [badge, setBadge] = useState('');
  const [sku, setSku] = useState('');
  const [saving, setSaving] = useState(false);

  // Stats
  const totalRevenue = orders
    .filter((o) => o.status !== 'Annulée')
    .reduce((sum, o) => sum + o.total, 0);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('vetements');
    setPrice('');
    setStock('10');
    setDescription('');
    setImage(PRESET_IMAGES.vetements[0]);
    setBadge('Nouveau');
    setSku('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setDescription(product.description);
    setImage(product.image);
    setBadge(product.badge || '');
    setSku(product.sku || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name,
      category,
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      description,
      image: image || PRESET_IMAGES[category][0],
      badge,
      sku,
    };

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, payload);
    } else {
      await onCreateProduct(payload);
    }
    setSaving(false);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-neutral-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Espace Vendeur
          </span>
          <h1 className="font-display text-3xl font-bold text-[#0A0A0A] mt-1">
            Gestion de la boutique
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0A0A0A] text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Ajouter un article
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-8">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-medium">Chiffre d'affaires</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-bold text-[#0A0A0A]">
            {totalRevenue.toFixed(2)} €
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-medium">Commandes</span>
            <ShoppingCart className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-bold text-[#0A0A0A]">{orders.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-medium">Articles / Stock total</span>
            <Package className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-bold text-[#0A0A0A]">
            {products.length} <span className="text-sm font-normal text-neutral-400">/ {totalStock} unités</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-medium">Stock faible (≤ 5)</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-500' : ''}`} />
          </div>
          <p className="font-display text-2xl font-bold text-[#0A0A0A]">{lowStockCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'products'
              ? 'bg-[#0A0A0A] text-white'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:text-[#0A0A0A]'
          }`}
        >
          Catalogue ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#0A0A0A] text-white'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:text-[#0A0A0A]'
          }`}
        >
          Commandes ({orders.length})
        </button>
      </div>

      {/* Products Table */}
      {activeTab === 'products' ? (
        <div className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 bg-neutral-50/60">
                  <th className="py-3.5 px-5">Article</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4">Prix (€)</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-11 h-11 rounded-xl object-cover bg-neutral-100 shrink-0"
                        />
                        <div>
                          <p className="font-medium text-[#0A0A0A]">{product.name}</p>
                          <p className="text-xs text-neutral-400">{product.sku || product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                        {product.category === 'vetements' ? 'Vêtements' : 'Technologie'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0A0A0A]">
                      {product.price.toFixed(2)} €
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            onUpdateProduct(product.id, { stock: Math.max(0, product.stock - 1) })
                          }
                          className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 cursor-pointer"
                        >
                          -
                        </button>
                        <span
                          className={`w-8 text-center font-medium ${
                            product.stock === 0
                              ? 'text-red-600'
                              : product.stock <= 5
                              ? 'text-amber-600'
                              : 'text-[#0A0A0A]'
                          }`}
                        >
                          {product.stock}
                        </span>
                        <button
                          onClick={() => onUpdateProduct(product.id, { stock: product.stock + 1 })}
                          className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 rounded-lg text-neutral-500 hover:text-[#0A0A0A] hover:bg-neutral-100 cursor-pointer"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center text-neutral-500 text-sm">
              Aucune commande pour le moment.
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-[#0A0A0A]">{order.id}</span>
                    <span className="text-xs text-neutral-400">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-800">
                    {order.customerName} · <span className="text-neutral-500 font-normal">{order.customerEmail}</span>
                  </p>
                  <p className="text-xs text-neutral-500">{order.customerAddress}</p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    {order.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 text-xs text-neutral-700"
                      >
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-100">
                  <span className="font-display text-xl font-bold text-[#0A0A0A]">
                    {order.total.toFixed(2)} €
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-neutral-200 bg-neutral-50 text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] cursor-pointer"
                  >
                    <option value="En attente">En attente</option>
                    <option value="Expédiée">Expédiée</option>
                    <option value="Livrée">Livrée</option>
                    <option value="Annulée">Annulée</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create / Edit Product Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-[#0A0A0A]">
                {editingProduct ? 'Modifier l’article' : 'Nouvel article'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                  Nom de l’article *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Veste Technique Minimaliste"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                    Catégorie *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:border-[#0A0A0A]"
                  >
                    <option value="vetements">Vêtements</option>
                    <option value="technologie">Technologie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                    Badge (optionnel)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Ex: Nouveau, Promo..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                    Prix (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="99.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                    Quantité en stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="15"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                  URL de l’image
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails, matériaux, caractéristiques..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-[#0A0A0A] resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-[#0A0A0A] text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Enregistrement...' : editingProduct ? 'Mettre à jour' : 'Publier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
