import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ShoppingBag, X, Check, ArrowUpRight, Package, Sparkles } from 'lucide-react';
import { Product, Category } from '../types';

interface StorefrontProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
}

const CATEGORY_LABELS: Record<Category, string> = {
  airpods: 'AirPods',
  accessoires: 'Accessoires',
  vetements: 'Vêtements',
  technologie: 'Technologie',
};

export const Storefront: React.FC<StorefrontProps> = ({ products, onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [addedId, setAddedId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    onAddToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      {/* Bold Dark Hero */}
      <section className="relative py-14 sm:py-20 border-b border-white/10 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Édition Premium 2026 — AirPods & Accessoires de Marque
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.06]">
            Son d’exception.
            <br />
            <span className="bg-gradient-to-r from-white via-zinc-300 to-purple-400 bg-clip-text text-transparent">
              Accessoires de prestige.
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
            Découvrez notre sélection exclusive d’AirPods nouvelle génération et d’accessoires design de marque, conçus pour sublimer votre quotidien.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-20 bg-[#070709]/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Tout voir' },
            { id: 'airpods', label: 'AirPods' },
            { id: 'accessoires', label: 'Accessoires' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as 'all' | Category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-white text-[#070709] shadow-sm'
                  : 'bg-[#121218] text-zinc-400 border border-white/10 hover:border-white/25 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full pl-10 pr-4 py-2 bg-[#121218] border border-white/10 rounded-full text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div className="relative flex items-center">
            <SlidersHorizontal className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'default' | 'price-asc' | 'price-desc')}
              className="pl-9 pr-4 py-2 bg-[#121218] border border-white/10 rounded-full text-sm text-zinc-300 focus:outline-none focus:border-white/30 cursor-pointer appearance-none"
            >
              <option value="default">Trier : Pertinence</option>
              <option value="price-asc">Prix : Croissant</option>
              <option value="price-desc">Prix : Décroissant</option>
            </select>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="pt-8">
        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">Aucun article ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const outOfStock = product.stock <= 0;
              const isAdded = addedId === product.id;

              return (
                <article
                  key={product.id}
                  onClick={() => openModal(product)}
                  className="group cursor-pointer flex flex-col bg-[#111116] rounded-2xl border border-white/10 overflow-hidden hover:border-white/25 transition-all duration-300"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#181820]">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className={`h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
                        outOfStock ? 'opacity-40 grayscale' : ''
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-transparent to-transparent opacity-60" />

                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {outOfStock ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-500/90 text-white text-[11px] font-semibold">
                          Rupture
                        </span>
                      ) : product.badge ? (
                        <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-white text-[11px] font-medium">
                          {product.badge}
                        </span>
                      ) : null}
                    </div>

                    {!outOfStock && (
                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`absolute bottom-3 right-3 h-10 px-4 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg transition-all duration-200 cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-[#070709] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-zinc-200'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Ajouté
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Ajouter
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="p-4 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">
                        {CATEGORY_LABELS[product.category] || product.category}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-white group-hover:text-zinc-200">
                        {product.name}
                      </h3>
                    </div>
                    <span className="text-sm font-bold text-white whitespace-nowrap">
                      {product.price.toFixed(2)} €
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-[#121218] rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-white/15 grid grid-cols-1 md:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-square md:aspect-auto bg-[#181820] relative">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                    {CATEGORY_LABELS[selectedProduct.category] || selectedProduct.category}
                    {selectedProduct.sku ? ` · ${selectedProduct.sku}` : ''}
                  </span>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h2 className="mt-3 font-display text-2xl font-bold text-white">
                  {selectedProduct.name}
                </h2>
                <p className="mt-2 text-2xl font-bold text-white">
                  {selectedProduct.price.toFixed(2)} €
                </p>

                <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                  {selectedProduct.description || 'Aucune description disponible.'}
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs font-medium">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedProduct.stock > 5
                        ? 'bg-emerald-400'
                        : selectedProduct.stock > 0
                        ? 'bg-amber-400'
                        : 'bg-red-500'
                    }`}
                  />
                  <span className="text-zinc-300">
                    {selectedProduct.stock > 0
                      ? `${selectedProduct.stock} en stock`
                      : 'Rupture de stock'}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
                {selectedProduct.stock > 0 ? (
                  <>
                    <div className="flex items-center border border-white/15 bg-[#181820] rounded-full h-11 px-2">
                      <button
                        onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-white">{modalQty}</span>
                      <button
                        onClick={() => setModalQty((q) => Math.min(selectedProduct.stock, q + 1))}
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        onAddToCart(selectedProduct, modalQty);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 h-11 bg-white text-[#070709] rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Ajouter au panier
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    disabled
                    className="w-full h-11 bg-white/5 text-zinc-500 rounded-full text-sm font-medium cursor-not-allowed"
                  >
                    Indisponible
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
