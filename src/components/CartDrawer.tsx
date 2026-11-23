import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: (customer: { name: string; email: string; address: string }) => Promise<boolean>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const ok = await onCheckout({ name, email, address });
    setSubmitting(false);
    if (ok) {
      setStep('success');
      setName('');
      setEmail('');
      setAddress('');
    } else {
      setError('Une erreur est survenue lors de la commande. Vérifiez le stock.');
    }
  };

  const handleClose = () => {
    if (step === 'success') setStep('cart');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs" onClick={handleClose}>
      <div
        className="w-full max-w-md bg-[#121218] border-l border-white/10 h-full shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-white" />
            <h2 className="font-display text-lg font-bold text-white">
              {step === 'cart' && `Panier (${items.reduce((s, i) => s + i.quantity, 0)})`}
              {step === 'checkout' && 'Finaliser la commande'}
              {step === 'success' && 'Commande confirmée'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'success' ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">Merci pour votre commande !</h3>
              <p className="mt-2 text-sm text-zinc-400 max-w-xs">
                Votre commande a bien été enregistrée et sera expédiée sous peu.
              </p>
              <button
                onClick={handleClose}
                className="mt-8 px-6 py-2.5 bg-white text-[#070709] rounded-full text-sm font-semibold hover:bg-zinc-200 cursor-pointer"
              >
                Continuer mes achats
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-zinc-400 text-sm">Votre panier est vide.</p>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-5">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-4 pb-5 border-b border-white/10">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-24 object-cover rounded-xl bg-[#181820] shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-medium text-white">{product.name}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {product.price.toFixed(2)} €
                        </p>
                      </div>
                      <button
                        onClick={() => onRemove(product.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-white/15 bg-[#181820] rounded-full h-8 px-1.5">
                        <button
                          onClick={() => onUpdateQty(product.id, quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-medium text-white">{quantity}</span>
                        <button
                          onClick={() =>
                            onUpdateQty(product.id, Math.min(product.stock, quantity + 1))
                          }
                          className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {(product.price * quantity).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Yassine Mansouri"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181820] border border-white/15 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yassine@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181820] border border-white/15 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Adresse de livraison
                </label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rue, Ville, Code postal..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181820] border border-white/15 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 resize-none"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && step !== 'success' && (
          <div className="px-6 py-5 border-t border-white/10 bg-[#0D0D12]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-zinc-400">Total</span>
              <span className="font-display text-xl font-bold text-white">
                {subtotal.toFixed(2)} €
              </span>
            </div>

            {step === 'cart' ? (
              <button
                onClick={() => setStep('checkout')}
                className="w-full h-12 bg-white text-[#070709] rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Passer la commande
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-5 h-12 border border-white/15 bg-[#181820] text-zinc-300 rounded-full text-sm font-medium hover:bg-white/10 cursor-pointer"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className="flex-1 h-12 bg-white text-[#070709] rounded-full text-sm font-semibold hover:bg-zinc-200 disabled:opacity-50 cursor-pointer"
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
