import React, { useMemo, useState } from 'react';
import {
  Search,
  ShoppingBag,
  X,
  Check,
  Package,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
} from 'lucide-react';
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

  const openProductPage = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const featuredProduct = products[0];

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

  if (selectedProduct) {
    const recommendations = products
      .filter((p) => p.id !== selectedProduct.id && p.stock > 0)
      .slice(0, 3);
    const finalPrice = getEffectivePrice(selectedProduct);
    const hasDiscount = selectedProduct.discountPercent > 0;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24">
        <button
          onClick={() => setSelectedProduct(null)}
          className={`inline-flex items-center gap-2 text-sm font-medium mb-8 cursor-pointer transition-colors ${
            isDark ? 'text-zinc-400 hover:text-white' : 'text-neutral-500 hover:text-[#0A0A0A]'
          }`}
        >
          ← Retour à la boutique
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left: Large Image */}
          <div className={`lg:col-span-6 aspect-square rounded-3xl overflow-hidden border ${
            isDark ? 'bg-zinc-900 border-white/10' : 'bg-neutral-100 border-neutral-200'
          }`}>
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right: Complete Product Sheet */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-neutral-400'}`}>
                  {CATEGORY_LABELS[selectedProduct.category] || selectedProduct.category}
                </span>
                {selectedProduct.sku && (
                  <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>
                    · Réf: {selectedProduct.sku}
                  </span>
                )}
              </div>

              <h1 className={`mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
                {selectedProduct.name}
              </h1>

              <div className="mt-4 flex items-baseline gap-3">
                <span className={`font-display text-3xl font-bold ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
                  {finalPrice.toFixed(2)} DT
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg line-through text-neutral-400">
                      {selectedProduct.price.toFixed(2)} DT
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                      -{selectedProduct.discountPercent}%
                    </span>
                  </>
                )}
              </div>

              <div className="mt-5 inline-flex items-center gap-2 text-sm">
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedProduct.stock > 5 ? 'bg-emerald-500' : selectedProduct.stock > 0 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                />
                <span className={isDark ? 'text-zinc-300' : 'text-neutral-600'}>
                  {selectedProduct.stock > 5
                    ? `En stock (${selectedProduct.stock} disponibles)`
                    : selectedProduct.stock > 0
                    ? `Stock limité (${selectedProduct.stock} restants)`
                    : 'Rupture de stock'}
                </span>
              </div>

              <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-neutral-200'}`}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                  Description complète
                </h3>
                <p className={`text-base leading-relaxed ${isDark ? 'text-zinc-300' : 'text-neutral-600'}`}>
                  {selectedProduct.description || 'Produit premium sélectionné par ZoneStore.'}
                </p>
              </div>
            </div>

            <div className={`pt-6 border-t flex items-center gap-4 ${isDark ? 'border-white/10' : 'border-neutral-200'}`}>
              {selectedProduct.stock > 0 ? (
                <>
                  <div className={`flex items-center border rounded-full h-12 px-3 ${isDark ? 'border-white/15 bg-white/5' : 'border-neutral-300 bg-white'}`}>
                    <button onClick={() => setModalQty((q) => Math.max(1, q - 1))} className="w-8 h-8 cursor-pointer font-semibold">-</button>
                    <span className="w-10 text-center text-sm font-semibold">{modalQty}</span>
                    <button onClick={() => setModalQty((q) => Math.min(selectedProduct.stock, q + 1))} className="w-8 h-8 cursor-pointer font-semibold">+</button>
                  </div>
                  <button
                    onClick={() => {
                      onAddToCart(selectedProduct, modalQty);
                      setAddedId(selectedProduct.id);
                      setTimeout(() => setAddedId(null), 1200);
                    }}
                    className={`flex-1 h-12 rounded-full text-sm font-semibold cursor-pointer transition-transform active:scale-95 ${
                      addedId === selectedProduct.id
                        ? 'bg-emerald-500 text-white'
                        : isDark
                        ? 'bg-white text-[#09090B] hover:bg-zinc-200'
                        : 'bg-[#0A0A0A] text-white hover:bg-neutral-800'
                    }`}
                  >
                    {addedId === selectedProduct.id ? 'Ajouté au panier ✓' : 'Ajouter au panier'}
                  </button>
                </>
              ) : (
                <button disabled className="w-full h-12 rounded-full bg-neutral-500/20 text-neutral-400 text-sm font-medium cursor-not-allowed">
                  Rupture de stock
                </button>
              )}
            </div>

            <div className={`grid grid-cols-2 gap-3 pt-2 text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 shrink-0" /> Expédition 24/48h
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" /> Qualité garantie
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className={`mt-20 pt-12 border-t ${isDark ? 'border-white/10' : 'border-neutral-200'}`}>
            <h2 className={`font-display text-2xl font-bold mb-8 ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
              Vous aimerez aussi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <article
                  key={rec.id}
                  onClick={() => openProductPage(rec)}
                  className={`group cursor-pointer rounded-3xl border overflow-hidden transition-all ${
                    isDark
                      ? 'bg-[#111115] border-white/10 hover:border-white/25'
                      : 'bg-white border-neutral-200 hover:shadow-lg'
                  }`}
                >
                  <div className="aspect-square overflow-hidden bg-neutral-900">
                    <img
                      src={rec.image}
                      alt={rec.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 flex items-center justify-between gap-2">
                    <div>
                      <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>
                        {CATEGORY_LABELS[rec.category] || rec.category}
                      </p>
                      <h3 className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
                        {rec.name}
                      </h3>
                    </div>
                    <span className={`font-display font-bold text-sm ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
                      {getEffectivePrice(rec).toFixed(2)} DT
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      {/* Luxury Editorial Hero */}
      <section className="py-10 sm:py-16">
        <div
          className={`relative overflow-hidden rounded-[2rem] border p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center ${
            isDark
              ? 'bg-gradient-to-br from-[#121218] via-[#0D0D12] to-[#09090B] border-white/10'
              : 'bg-gradient-to-br from-neutral-100 via-neutral-50 to-white border-neutral-200/80'
          }`}
        >
          <div className="lg:col-span-7 space-y-6">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border ${
                isDark
                  ? 'bg-white/5 border-white/10 text-zinc-300'
                  : 'bg-white border-neutral-200 text-neutral-600 shadow-xs'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Sélection Exclusive 2026
            </div>

            <h1
              className={`font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] ${
                isDark ? 'text-white' : 'text-[#0A0A0A]'
              }`}
            >
              L’élégance au poignet.
              <br />
              <span className={isDark ? 'text-zinc-400' : 'text-neutral-400'}>
                La pureté du son.
              </span>
            </h1>

            <p
              className={`text-base sm:text-lg max-w-lg leading-relaxed ${
                isDark ? 'text-zinc-400' : 'text-neutral-500'
              }`}
            >
              AirPods nouvelle génération, bracelets Lacoste iconiques et montres noires à chiffres arabes. Livraison rapide & stock en temps réel.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="#catalogue"
                className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold transition-transform active:scale-95 ${
                  isDark
                    ? 'bg-white text-[#09090B] hover:bg-zinc-200'
                    : 'bg-[#0A0A0A] text-white hover:bg-neutral-800'
                }`}
              >
                Découvrir la collection
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {featuredProduct && (
            <div className="lg:col-span-5">
              <div
                onClick={() => {
                  setSelectedProduct(featuredProduct);
                  setModalQty(1);
                }}
                className={`group cursor-pointer relative aspect-[4/4.2] rounded-3xl overflow-hidden border shadow-2xl ${
                  isDark ? 'border-white/15 bg-zinc-900' : 'border-neutral-200 bg-white'
                }`}
              >
                <img
                  src={featuredProduct.image}
                  alt={featuredProduct.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest text-zinc-300 font-medium">
                      À la une
                    </span>
                    <h3 className="font-display text-lg font-bold mt-0.5">{featuredProduct.name}</h3>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-white text-[#0A0A0A] text-xs font-bold">
                    {getEffectivePrice(featuredProduct).toFixed(2)} DT
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Trust Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-10">
        {[
          { icon: Truck, title: 'Livraison Rapide', desc: 'Expédition sous 24/48h' },
          { icon: ShieldCheck, title: 'Qualité Certifiée', desc: 'Produits vérifiés & garantis' },
          { icon: Sparkles, title: 'Codes Promo', desc: 'Remises exclusives au panier' },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-4 p-4 rounded-2xl border ${
              isDark ? 'bg-white/[0.02] border-white/10' : 'bg-neutral-50/70 border-neutral-200/70'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-white/10 text-white' : 'bg-white text-[#0A0A0A] shadow-xs'
              }`}
            >
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
                {item.title}
              </p>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Filter & Search */}
      <section
        id="catalogue"
        className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 z-20 backdrop-blur-xl border-y ${
          isDark ? 'bg-[#09090B]/90 border-white/10' : 'bg-white/90 border-neutral-200/80'
        }`}
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tout voir' },
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
                    ? 'bg-white text-[#09090B] shadow-sm'
                    : 'bg-[#0A0A0A] text-white shadow-sm'
                  : isDark
                  ? 'bg-white/5 text-zinc-400 hover:text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:text-[#0A0A0A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search
            className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-zinc-500' : 'text-neutral-400'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className={`w-full pl-10 pr-4 py-2 rounded-full text-sm border focus:outline-none transition-colors ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/30'
                : 'bg-neutral-50 border-neutral-200 text-[#0A0A0A] placeholder:text-neutral-400 focus:border-[#0A0A0A]'
            }`}
          />
        </div>
      </section>

      {/* Product Grid */}
      <section className="pt-10">
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
                  className={`group cursor-pointer flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 ${
                    isDark
                      ? 'bg-[#111115] border-white/10 hover:border-white/25'
                      : 'bg-white border-neutral-200/80 hover:border-neutral-300 hover:shadow-xl hover:shadow-black/5'
                  }`}
                >
                  <div className={`relative aspect-[4/4.2] w-full overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-neutral-100'}`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                        outOfStock ? 'opacity-40 grayscale' : ''
                      }`}
                    />

                    <div className="absolute top-3.5 left-3.5 flex gap-1.5">
                      {hasDiscount && !outOfStock && (
                        <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[11px] font-bold shadow-xs">
                          -{product.discountPercent}%
                        </span>
                      )}
                      {product.badge && !outOfStock && (
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md ${
                            isDark ? 'bg-black/65 text-white' : 'bg-white/90 text-[#0A0A0A] shadow-xs'
                          }`}
                        >
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {!outOfStock && (
                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`absolute bottom-3.5 right-3.5 h-10 px-4 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500 text-white'
                            : isDark
                            ? 'bg-white text-[#09090B] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                            : 'bg-[#0A0A0A] text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                        }`}
                      >
                        {isAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                        {isAdded ? 'Ajouté' : 'Ajouter'}
                      </button>
                    )}
                  </div>

                  <div className="p-5 flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>
                        {CATEGORY_LABELS[product.category] || product.category}
                      </p>
                      <h3 className={`mt-1 text-base font-semibold ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
                        {product.name}
                      </h3>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            product.stock > 5 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                        />
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
                      <span className={`font-display text-lg font-bold ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
                        {finalPrice.toFixed(2)} DT
                      </span>
                      {hasDiscount && (
                        <p className={`text-xs line-through ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>
                          {product.price.toFixed(2)} DT
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
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
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-neutral-400'}`}>
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
                  <span className="font-display text-2xl font-bold">{getEffectivePrice(selectedProduct).toFixed(2)} DT</span>
                  {selectedProduct.discountPercent > 0 && (
                    <span className="text-sm line-through text-neutral-400">{selectedProduct.price.toFixed(2)} DT</span>
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
