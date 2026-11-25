import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, CheckCircle2, Tag } from 'lucide-react';
import { CartItem, Product } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: (customer: { name: string; email: string; address: string; promoCode?: string }) => Promise<boolean>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  isDark,
  onClose,
  items,
  onUpdateQty,
  onRemove,
  onCheckout,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const getEffectivePrice = (p: Product) => {
    if (!p.discountPercent || p.discountPercent <= 0) return p.price;
    return Number((p.price * (1 - p.discountPercent / 100)).toFixed(2));
  };

  const subtotal = items.reduce((sum, item) => sum + getEffectivePrice(item.product) * item.quantity, 0);
  const promoDiscount = appliedPromo ? Number(((subtotal * appliedPromo.discountPercent) / 100).toFixed(2)) : 0;
  const total = Math.max(0, Number((subtotal - promoDiscount).toFixed(2)));

  const handleApplyPromo = async () => {
    setPromoError('');
    if (!promoInput.trim()) return;
    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim() }),
      });
      if (!res.ok) {
        setPromoError('Code promo invalide');
        setAppliedPromo(null);
        return;
      }
      const data = await res.json();
      setAppliedPromo(data);
    } catch {
      setPromoError('Erreur de vérification');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const ok = await onCheckout({
      name,
      email,
      address,
      promoCode: appliedPromo?.code,
    });
    setSubmitting(false);
    if (ok) {
      setStep('success');
      setName('');
      setEmail('');
      setAddress('');
      setAppliedPromo(null);
      setPromoInput('');
    } else {
      setError('Erreur lors de la commande. Vérifiez le stock.');
    }
  };

  const handleClose = () => {
    if (step === 'success') setStep('cart');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs" onClick={handleClose}>
      <div
        className={`w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l ${
          isDark ? 'bg-[#121216] border-white/10 text-white' : 'bg-white border-neutral-200 text-[#0A0A0A]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-5 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-neutral-100'}`}>
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="font-display text-lg font-bold">
              {step === 'cart' && `Panier (${items.reduce((s, i) => s + i.quantity, 0)})`}
              {step === 'checkout' && 'Finaliser la commande'}
              {step === 'success' && 'Commande confirmée'}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-neutral-500/15 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'success' ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
              <h3 className="font-display text-xl font-bold">Merci pour votre commande !</h3>
              <p className={`mt-2 text-sm max-w-xs ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                Votre commande a bien été enregistrée.
              </p>
              <button
                onClick={handleClose}
                className={`mt-8 px-6 py-2.5 rounded-full text-sm font-semibold cursor-pointer ${
                  isDark ? 'bg-white text-[#09090B]' : 'bg-[#0A0A0A] text-white'
                }`}
              >
                Continuer
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-neutral-400 mb-3" />
              <p className="text-neutral-500 text-sm">Votre panier est vide.</p>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-5">
              {items.map(({ product, quantity }) => {
                const price = getEffectivePrice(product);
                return (
                  <div key={product.id} className={`flex gap-4 pb-5 border-b ${isDark ? 'border-white/10' : 'border-neutral-100'}`}>
                    <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-medium">{product.name}</h4>
                          <p className="text-xs text-neutral-400 mt-0.5">{price.toFixed(2)} €</p>
                        </div>
                        <button onClick={() => onRemove(product.id)} className="text-neutral-400 hover:text-red-500 p-1 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className={`flex items-center border rounded-full h-8 px-1.5 ${isDark ? 'border-white/15' : 'border-neutral-200'}`}>
                          <button onClick={() => onUpdateQty(product.id, quantity - 1)} className="w-6 h-6 cursor-pointer">-</button>
                          <span className="w-6 text-center text-xs font-medium">{quantity}</span>
                          <button onClick={() => onUpdateQty(product.id, Math.min(product.stock, quantity + 1))} className="w-6 h-6 cursor-pointer">+</button>
                        </div>
                        <span className="text-sm font-semibold">{(price * quantity).toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Promo Code */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Code promo</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Ex: ZONE10"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs uppercase focus:outline-none ${
                        isDark ? 'bg-white/5 border-white/15 text-white' : 'bg-neutral-50 border-neutral-200 text-[#0A0A0A]'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                      isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-neutral-900 text-white hover:bg-neutral-800'
                    }`}
                  >
                    Appliquer
                  </button>
                </div>
                {promoError && <p className="text-xs text-red-500 mt-1.5">{promoError}</p>}
                {appliedPromo && (
                  <p className="text-xs text-emerald-500 mt-1.5 font-medium">
                    Code {appliedPromo.code} appliqué (-{appliedPromo.discountPercent}%)
                  </p>
                )}
              </div>
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-xl bg-red-500/15 text-red-500 text-xs">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Nom complet</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none ${
                    isDark ? 'bg-white/5 border-white/15 text-white' : 'bg-white border-neutral-200 text-[#0A0A0A]'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none ${
                    isDark ? 'bg-white/5 border-white/15 text-white' : 'bg-white border-neutral-200 text-[#0A0A0A]'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Adresse de livraison</label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none resize-none ${
                    isDark ? 'bg-white/5 border-white/15 text-white' : 'bg-white border-neutral-200 text-[#0A0A0A]'
                  }`}
                />
              </div>
            </form>
          )}
        </div>

        {items.length > 0 && step !== 'success' && (
          <div className={`px-6 py-5 border-t ${isDark ? 'border-white/10 bg-[#09090B]' : 'border-neutral-100 bg-neutral-50'}`}>
            {appliedPromo && (
              <div className="flex items-center justify-between text-xs text-emerald-500 mb-2">
                <span>Réduction ({appliedPromo.code})</span>
                <span>-{promoDiscount.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-neutral-400">Total</span>
              <span className="font-display text-xl font-bold">{total.toFixed(2)} €</span>
            </div>

            {step === 'cart' ? (
              <button
                onClick={() => setStep('checkout')}
                className={`w-full h-12 rounded-full text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                  isDark ? 'bg-white text-[#09090B] hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-neutral-800'
                }`}
              >
                Passer la commande <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className={`px-5 h-12 border rounded-full text-sm font-medium cursor-pointer ${
                    isDark ? 'border-white/15 text-zinc-300' : 'border-neutral-200 text-neutral-700'
                  }`}
                >
                  Retour
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className={`flex-1 h-12 rounded-full text-sm font-semibold cursor-pointer ${
                    isDark ? 'bg-white text-[#09090B]' : 'bg-[#0A0A0A] text-white'
                  }`}
                >
                  {submitting ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
