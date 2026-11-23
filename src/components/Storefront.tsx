import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ShoppingBag, X, Check, ArrowUpRight, Package } from 'lucide-react';
import { Product, Category } from '../types';

interface StorefrontProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
}

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
      {/* Hero Section */}
      <section className="py-12 sm:py-16 border-b border-neutral-200/80">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-600 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Collection 2026 — Vêtements & Technologie
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0A0A0A] leading-[1.08]">
            Design minimaliste.
            <br />
            <span className="text-neutral-400">Performance quotidienne.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-neutral-500 max-w-xl leading-relaxed">
            Une sélection pointue de pièces vestimentaires techniques et d’objets technologiques conçus pour durer.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-20 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-neutral-200/60">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Tout voir' },
            { id: 'vetements', label: 'Vêtements' },
            { id: 'technologie', label: 'Technologie' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as 'all' | Category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-[#0A0A0A] text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:text-[#0A0A0A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-full text-sm text-[#0A0A0A] placeholder:text-neutral-400 focus:outline-none focus:border-[#0A0A0A] transition-colors"
            />
          </div>

          <div className="relative flex items-center">
            <SlidersHorizontal className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'default' | 'price-asc' | 'price-desc')}
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-full text-sm text-neutral-700 focus:outline-none focus:border-[#0A0A0A] cursor-pointer appearance-none"
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
            <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 font-medium">Aucun article ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {filteredProducts.map((product) => {
              const outOfStock = product.stock <= 0;
              const isAdded = addedId === product.id;

              return (
                <article
                  key={product.id}
                  onClick={() => openModal(product)}
                  className="group cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-200/70">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className={`h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
                        outOfStock ? 'opacity-50 grayscale' : ''
                      }`}
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {outOfStock ? (
                        <span className="px-2.5 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-medium">
                          Rupture
                        </span>
                      ) : product.badge ? (
                        <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[#0A0A0A] text-[11px] font-medium shadow-xs">
                          {product.badge}
                        </span>
                      ) : null}
                    </div>

                    {!outOfStock && (
                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`absolute bottom-3 right-3 h-10 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-medium shadow-md transition-all duration-200 cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/95 backdrop-blur-xs text-[#0A0A0A] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-[#0A0A0A] hover:text-white'
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

                  <div className="mt-3.5 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                        {product.category === 'vetements' ? 'Vêtements' : 'Technologie'}
                      </p>
                      <h3 className="mt-0.5 text-sm font-medium text-[#0A0A0A] group-hover:underline decoration-neutral-300 underline-offset-4">
                        {product.name}
                      </h3>
                    </div>
                    <span className="text-sm font-semibold text-[#0A0A0A] whitespace-nowrap">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-neutral-200 grid grid-cols-1 md:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-square md:aspect-auto bg-neutral-100 relative">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                    {selectedProduct.category === 'vetements' ? 'Vêtements' : 'Technologie'}
                    {selectedProduct.sku ? ` · ${selectedProduct.sku}` : ''}
                  </span>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h2 className="mt-3 font-display text-2xl font-bold text-[#0A0A0A]">
                  {selectedProduct.name}
                </h2>
                <p className="mt-2 text-2xl font-semibold text-[#0A0A0A]">
                  {selectedProduct.price.toFixed(2)} €
                </p>

                <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
                  {selectedProduct.description || 'Aucune description disponible.'}
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs font-medium">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedProduct.stock > 5
                        ? 'bg-emerald-500'
                        : selectedProduct.stock > 0
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <span className="text-neutral-600">
                    {selectedProduct.stock > 0
                      ? `${selectedProduct.stock} en stock`
                      : 'Rupture de stock'}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center gap-3">
                {selectedProduct.stock > 0 ? (
                  <>
                    <div className="flex items-center border border-neutral-200 rounded-full h-11 px-2">
                      <button
                        onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-[#0A0A0A] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{modalQty}</span>
                      <button
                        onClick={() => setModalQty((q) => Math.min(selectedProduct.stock, q + 1))}
                        className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-[#0A0A0A] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        onAddToCart(selectedProduct, modalQty);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 h-11 bg-[#0A0A0A] text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Ajouter au panier
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    disabled
                    className="w-full h-11 bg-neutral-100 text-neutral-400 rounded-full text-sm font-medium cursor-not-allowed"
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
