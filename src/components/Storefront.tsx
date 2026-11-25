import React, { useMemo, useState } from 'react';
import { Search, ShoppingBag, X, Check, Package } from 'lucide-react';
import { Product, Category } from '../types';

interface StorefrontProps {
  products: Product[];
  isDark: boolean;
  onAddToCart: (product: Product, quantity: number) => void;
}

const CATEGORY_LABELS: Record<Category, string> = {
  airpods: 'AirPods',
  bracelets: 'Bracelet Lacoste',
  montres: 'Montres',
  accessoires: 'Accessoires',
};

export const Storefront: React.FC<StorefrontProps> = ({ products, isDark, onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [addedId, setAddedId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const getEffectivePrice = (p: Product) => {
    if (!p.discountPercent || p.discountPercent <= 0) return p.price;
    return Number((p.price * (1 - p.discountPercent / 100)).toFixed(2));
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    onAddToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      {/* Ultra-clean Hero */}
      <section className={`py-12 sm:py-16 border-b ${isDark ? 'border-white/10' : 'border-neutral-200'}`}>
        <h1 className={`font-display text-3xl sm:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
          ZoneStore
        </h1>
        <p className={`mt-3 text-base sm:text-lg max-w-xl ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
          AirPods, Bracelets Lacoste & Montres noires à chiffres arabes. L’essentiel, sans complication.
        </p>
      </section>

      {/* Filter & Search */}
      <section className={`py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 z-20 backdrop-blur-md border-b ${
        isDark ? 'bg-[#09090B]/90 border-white/10' : 'bg-white/90 border-neutral-200'
      }`}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tout' },
            { id: 'airpods', label: 'AirPods' },
            { id: 'bracelets', label: 'Bracelets Lacoste' },
            { id: 'montres', label: 'Montres' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as 'all' | Category)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === tab.id
                  ? isDark
                    ? 'bg-white text-[#09090B]'
                    : 'bg-[#0A0A0A] text-white'
                  : isDark
                  ? 'bg-white/5 text-zinc-400 hover:text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:text-[#0A0A0A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className={`w-full pl-10 pr-4 py-2 rounded-full text-sm border focus:outline-none transition-colors ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/30'
                : 'bg-neutral-50 border-neutral-200 text-[#0A0A0A] placeholder:text-neutral-400 focus:border-[#0A0A0A]'
            }`}
          />
        </div>
      </section>

      {/* Product Grid */}
      <section className="pt-8">
        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <Package className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-zinc-700' : 'text-neutral-300'}`} />
            <p className={isDark ? 'text-zinc-400' : 'text-neutral-500'}>Aucun produit disponible.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const outOfStock = product.stock <= 0;
              const isAdded = addedId === product.id;
              const finalPrice = getEffectivePrice(product);
              const hasDiscount = product.discountPercent > 0;

              return (
                <article
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setModalQty(1);
                  }}
                  className="group cursor-pointer flex flex-col"
                >
                  <div className={`relative aspect-square w-full overflow-hidden rounded-2xl border ${
                    isDark ? 'bg-zinc-900 border-white/10' : 'bg-neutral-100 border-neutral-200/80'
                  }`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                        outOfStock ? 'opacity-40 grayscale' : ''
                      }`}
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {hasDiscount && !outOfStock && (
                        <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[11px] font-semibold">
                          -{product.discountPercent}%
                        </span>
                      )}
                      {product.badge && !outOfStock && (
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-md ${
                          isDark ? 'bg-black/60 text-white' : 'bg-white/90 text-[#0A0A0A]'
                        }`}>
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {!outOfStock && (
                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`absolute bottom-3 right-3 h-10 px-4 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-md transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500 text-white'
                            : isDark
                            ? 'bg-white text-[#09090B] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
                            : 'bg-[#0A0A0A] text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
                        }`}
                      >
                        {isAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                        {isAdded ? 'Ajouté' : 'Ajouter'}
                      </button>
                    )}
                  </div>

                  <div className="mt-3.5 flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>
                        {CATEGORY_LABELS[product.category] || product.category}
                      </p>
                      <h3 className={`mt-0.5 text-sm font-semibold ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
                        {product.name}
                      </h3>
                      {/* Stock indicator */}
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          product.stock > 5 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className={isDark ? 'text-zinc-400' : 'text-neutral-500'}>
                          {product.stock > 5
                            ? `En stock (${product.stock})`
                            : product.stock > 0
                            ? `Stock limité (${product.stock})`
                            : 'Rupture de stock'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right whitespace-nowrap">
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
                        {finalPrice.toFixed(2)} €
                      </span>
                      {hasDiscount && (
                        <p className={`text-xs line-through ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>
                          {product.price.toFixed(2)} €
                        </p>
                      )}
                    </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className={`rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border grid grid-cols-1 md:grid-cols-2 ${
              isDark ? 'bg-[#121216] border-white/15 text-white' : 'bg-white border-neutral-200 text-[#0A0A0A]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-square md:aspect-auto bg-neutral-900">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
            </div>

            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-neutral-400'}`}>
                    {CATEGORY_LABELS[selectedProduct.category] || selectedProduct.category}
                  </span>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className={`p-1.5 rounded-full cursor-pointer ${isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-neutral-100 text-neutral-500'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h2 className="mt-3 font-display text-2xl font-bold">{selectedProduct.name}</h2>
                <div className="mt-2 flex items-baseline gap-2.5">
                  <span className="text-2xl font-bold">{getEffectivePrice(selectedProduct).toFixed(2)} €</span>
                  {selectedProduct.discountPercent > 0 && (
                    <span className="text-sm line-through text-neutral-400">{selectedProduct.price.toFixed(2)} €</span>
                  )}
                </div>

                <p className={`mt-4 text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                  {selectedProduct.description}
                </p>
              </div>

              <div className={`mt-8 pt-6 border-t flex items-center gap-3 ${isDark ? 'border-white/10' : 'border-neutral-100'}`}>
                {selectedProduct.stock > 0 ? (
                  <>
                    <div className={`flex items-center border rounded-full h-11 px-2 ${isDark ? 'border-white/15' : 'border-neutral-200'}`}>
                      <button onClick={() => setModalQty((q) => Math.max(1, q - 1))} className="w-8 h-8 cursor-pointer">-</button>
                      <span className="w-8 text-center text-sm font-medium">{modalQty}</span>
                      <button onClick={() => setModalQty((q) => Math.min(selectedProduct.stock, q + 1))} className="w-8 h-8 cursor-pointer">+</button>
                    </div>
                    <button
                      onClick={() => {
                        onAddToCart(selectedProduct, modalQty);
                        setSelectedProduct(null);
                      }}
                      className={`flex-1 h-11 rounded-full text-sm font-semibold cursor-pointer ${
                        isDark ? 'bg-white text-[#09090B] hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-neutral-800'
                      }`}
                    >
                      Ajouter au panier
                    </button>
                  </>
                ) : (
                  <button disabled className="w-full h-11 rounded-full bg-neutral-500/20 text-neutral-400 text-sm font-medium cursor-not-allowed">
                    Rupture de stock
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
