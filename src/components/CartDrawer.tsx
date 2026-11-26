import React, { useState } from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Tag,
  Truck,
  ShieldCheck,
  User,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { CartItem, Product } from '../types';
import { AddressMapPicker } from './AddressMapPicker';

interface CartDrawerProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: (customer: {
    name: string;
    email: string;
    address: string;
    promoCode?: string;
  }) => Promise<boolean>;
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
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const getEffectivePrice = (p: Product) => {
    if (!p.discountPercent || p.discountPercent <= 0) return p.price;
    return Number((p.price * (1 - p.discountPercent / 100)).toFixed(2));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + getEffectivePrice(item.product) * item.quantity,
    0
  );
  const promoDiscount = appliedPromo
    ? Number(((subtotal * appliedPromo.discountPercent) / 100).toFixed(2))
    : 0;
  const total = Math.max(0, Number((subtotal - promoDiscount).toFixed(2)));
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

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
        setPromoError('Code promo invalide ou expiré');
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
    const fullAddress = phone ? `${address} (Tél: ${phone})` : address;
    const ok = await onCheckout({
      name,
      email,
      address: fullAddress,
      promoCode: appliedPromo?.code,
    });
    setSubmitting(false);
    if (ok) {
      setStep('success');
      setName('');
      setPhone('');
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
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs"
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l ${
          isDark
            ? 'bg-[#111115] border-white/10 text-white'
            : 'bg-white border-neutral-200 text-[#0A0A0A]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + Stepper */}
        <div
          className={`px-6 pt-5 pb-4 border-b ${
            isDark ? 'border-white/10' : 'border-neutral-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5" />
              <h2 className="font-display text-lg font-bold">
                {step === 'cart' && `Mon Panier (${totalItems})`}
                {step === 'checkout' && 'Finaliser la commande'}
                {step === 'success' && 'Commande confirmée'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-neutral-500/15 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {items.length > 0 && step !== 'success' && (
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold">
              <span
                className={`px-2.5 py-1 rounded-full ${
                  step === 'cart'
                    ? isDark
                      ? 'bg-white text-[#09090B]'
                      : 'bg-[#0A0A0A] text-white'
                    : isDark
                    ? 'bg-white/10 text-zinc-400'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                1. Panier
              </span>
              <span className="text-neutral-400">→</span>
              <span
                className={`px-2.5 py-1 rounded-full ${
                  step === 'checkout'
                    ? isDark
                      ? 'bg-white text-[#09090B]'
                      : 'bg-[#0A0A0A] text-white'
                    : isDark
                    ? 'bg-white/10 text-zinc-400'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                2. Livraison
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'success' ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="font-display text-2xl font-bold">
                Merci pour votre commande !
              </h3>
              <p
                className={`mt-2.5 text-sm max-w-xs leading-relaxed ${
                  isDark ? 'text-zinc-400' : 'text-neutral-500'
                }`}
              >
                Votre commande a bien été enregistrée. Nous vous contacterons très rapidement pour la livraison.
              </p>
              <button
                onClick={handleClose}
                className={`mt-8 px-7 py-3 rounded-full text-sm font-semibold cursor-pointer ${
                  isDark
                    ? 'bg-white text-[#09090B] hover:bg-zinc-200'
                    : 'bg-[#0A0A0A] text-white hover:bg-neutral-800'
                }`}
              >
                Retour à la boutique
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                  isDark ? 'bg-white/5 text-zinc-500' : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                <ShoppingBag className="w-7 h-7" />
              </div>
              <p className="font-medium text-sm">Votre panier est vide</p>
              <p className="text-xs text-neutral-500 mt-1">
                Ajoutez des AirPods, bracelets ou montres pour commencer.
              </p>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-4">
              {items.map(({ product, quantity }) => {
                const price = getEffectivePrice(product);
                return (
                  <div
                    key={product.id}
                    className={`flex gap-3.5 p-3.5 rounded-2xl border ${
                      isDark
                        ? 'bg-white/[0.03] border-white/10'
                        : 'bg-neutral-50/70 border-neutral-200/70'
                    }`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-xl shrink-0 bg-neutral-900"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold leading-snug">
                            {product.name}
                          </h4>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {price.toFixed(2)} DT / unité
                          </p>
                        </div>
                        <button
                          onClick={() => onRemove(product.id)}
                          className="text-neutral-400 hover:text-red-500 p-1 cursor-pointer h-fit"
                          title="Retirer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div
                          className={`flex items-center border rounded-full h-8 px-1.5 ${
                            isDark
                              ? 'border-white/15 bg-white/5'
                              : 'border-neutral-200 bg-white'
                          }`}
                        >
                          <button
                            onClick={() => onUpdateQty(product.id, quantity - 1)}
                            className="w-6 h-6 cursor-pointer font-semibold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-semibold">
                            {quantity}
                          </span>
                          <button
                            onClick={() =>
                              onUpdateQty(
                                product.id,
                                Math.min(product.stock, quantity + 1)
                              )
                            }
                            className="w-6 h-6 cursor-pointer font-semibold"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-display text-sm font-bold">
                          {(price * quantity).toFixed(2)} DT
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Promo Code */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark
                    ? 'bg-white/[0.02] border-white/10'
                    : 'bg-neutral-50 border-neutral-200/70'
                }`}
              >
                <label className="block text-xs font-semibold mb-2">
                  Code promo
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Ex: ZONE10"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs uppercase focus:outline-none ${
                        isDark
                          ? 'bg-white/5 border-white/15 text-white'
                          : 'bg-white border-neutral-200 text-[#0A0A0A]'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                      isDark
                        ? 'bg-white text-[#09090B] hover:bg-zinc-200'
                        : 'bg-[#0A0A0A] text-white hover:bg-neutral-800'
                    }`}
                  >
                    Appliquer
                  </button>
                </div>
                {promoError && (
                  <p className="text-xs text-red-500 mt-1.5">{promoError}</p>
                )}
                {appliedPromo && (
                  <div className="flex items-center justify-between text-xs text-emerald-500 mt-2 font-medium">
                    <span>
                      Code {appliedPromo.code} appliqué (-
                      {appliedPromo.discountPercent}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoInput('');
                      }}
                      className="underline cursor-pointer"
                    >
                      Retirer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 text-red-500 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Order Mini Recap */}
              <div
                className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                  isDark
                    ? 'bg-white/[0.03] border-white/10 text-zinc-300'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                }`}
              >
                <div className="flex justify-between font-semibold">
                  <span>{totalItems} article(s)</span>
                  <span>{total.toFixed(2)} DT</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Livraison rapide incluse</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Nom complet *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom et prénom"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-white'
                        : 'bg-white border-neutral-200 text-[#0A0A0A]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Téléphone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 22 123 456"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-white'
                        : 'bg-white border-neutral-200 text-[#0A0A0A]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-white'
                        : 'bg-white border-neutral-200 text-[#0A0A0A]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Adresse de livraison *
                </label>
                <div className="mb-3">
                  <AddressMapPicker isDark={isDark} onSelectAddress={(addr) => setAddress(addr)} />
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ville, rue, numéro..."
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none resize-none ${
                      isDark
                        ? 'bg-white/5 border-white/15 text-white'
                        : 'bg-white border-neutral-200 text-[#0A0A0A]'
                    }`}
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && step !== 'success' && (
          <div
            className={`px-6 py-5 border-t ${
              isDark
                ? 'border-white/10 bg-[#09090B]'
                : 'border-neutral-100 bg-neutral-50'
            }`}
          >
            {appliedPromo && (
              <div className="flex items-center justify-between text-xs text-emerald-500 mb-1.5">
                <span>Réduction ({appliedPromo.code})</span>
                <span>-{promoDiscount.toFixed(2)} DT</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-neutral-400">Total à payer</span>
              <span className="font-display text-2xl font-bold">
                {total.toFixed(2)} DT
              </span>
            </div>

            {step === 'cart' ? (
              <button
                onClick={() => setStep('checkout')}
                className={`w-full h-12 rounded-full text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 ${
                  isDark
                    ? 'bg-white text-[#09090B] hover:bg-zinc-200'
                    : 'bg-[#0A0A0A] text-white hover:bg-neutral-800'
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
                    isDark
                      ? 'border-white/15 text-zinc-300'
                      : 'border-neutral-200 text-neutral-700 bg-white'
                  }`}
                >
                  Retour
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className={`flex-1 h-12 rounded-full text-sm font-semibold cursor-pointer transition-transform active:scale-95 ${
                    isDark
                      ? 'bg-white text-[#09090B] hover:bg-zinc-200'
                      : 'bg-[#0A0A0A] text-white hover:bg-neutral-800'
                  }`}
                >
                  {submitting ? 'Traitement...' : 'Confirmer la commande'}
                </button>
              </div>
            )}

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Commande sécurisée · ZoneStore</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
