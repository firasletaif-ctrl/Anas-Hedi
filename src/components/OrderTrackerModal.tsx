import React, { useState } from 'react';
import { X, Search, Package, Truck, CheckCircle2, Clock, Printer } from 'lucide-react';
import { Order } from '../types';

interface OrderTrackerModalProps {
  isOpen: boolean;
  isDark: boolean;
  initialOrderId?: string;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  isDark,
  initialOrderId = '',
  onClose,
}) => {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const fetchOrder = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(idToFetch.trim())}`);
      if (!res.ok) {
        setError('Aucune commande trouvée avec ce numéro.');
      } else {
        setOrder(await res.json());
      }
    } catch {
      setError('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = JSON.parse(localStorage.getItem('zs_my_orders') || '[]');
      if (Array.isArray(saved)) {
        setRecentIds(saved);
        if (saved.length > 0 && !order) {
          setOrderId(saved[0]);
          fetchOrder(saved[0]);
        }
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchOrder(orderId);
  };

  const steps = ['En attente', 'Expédiée', 'Livrée'];
  const currentStepIdx = order ? steps.indexOf(order.status) : -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-3xl border p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto ${
          isDark
            ? 'bg-[#121216] border-white/15 text-white'
            : 'bg-white border-neutral-200 text-[#0A0A0A]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5" />
            <h2 className="font-display text-xl font-bold">Suivi de commande & Reçu</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-500/15 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              placeholder="Numéro de commande (ex: ORD-1001)"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm uppercase focus:outline-none ${
                isDark
                  ? 'bg-white/5 border-white/15 text-white'
                  : 'bg-neutral-50 border-neutral-200 text-[#0A0A0A]'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
              isDark
                ? 'bg-white text-[#09090B] hover:bg-zinc-200'
                : 'bg-[#0A0A0A] text-white hover:bg-neutral-800'
            }`}
          >
            {loading ? '...' : 'Suivre'}
          </button>
        </form>

        {recentIds.length > 0 && (
          <div className="mb-5">
            <p className="text-[11px] font-medium text-neutral-400 mb-2">
              Mes commandes récentes :
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recentIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setOrderId(id);
                    fetchOrder(id);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                    order?.id === id
                      ? isDark
                        ? 'bg-white text-[#09090B] border-white'
                        : 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                      : isDark
                      ? 'bg-white/5 border-white/15 text-zinc-300 hover:bg-white/10'
                      : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/15 text-red-500 text-xs font-medium mb-4">
            {error}
          </div>
        )}

        {order && (
          <div className="space-y-6">
            {/* Status Progress */}
            {order.status === 'Annulée' ? (
              <div className="p-3.5 rounded-xl bg-red-500/15 text-red-500 text-sm font-semibold text-center">
                Commande Annulée
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'En attente', icon: Clock },
                  { label: 'Expédiée', icon: Truck },
                  { label: 'Livrée', icon: CheckCircle2 },
                ].map((s, idx) => {
                  const active = idx <= currentStepIdx;
                  return (
                    <div
                      key={s.label}
                      className={`p-3 rounded-2xl border text-center transition-colors ${
                        active
                          ? isDark
                            ? 'bg-white text-[#09090B] border-white'
                            : 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-zinc-500'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                      }`}
                    >
                      <s.icon className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-[11px] font-semibold">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Receipt / Ticket */}
            <div
              className={`p-5 rounded-2xl border font-mono text-xs space-y-3 ${
                isDark
                  ? 'bg-white/[0.03] border-white/15'
                  : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex justify-between items-center border-b border-dashed border-neutral-400/30 pb-3">
                <div>
                  <p className="font-bold text-sm">ZONESTORE — REÇU</p>
                  <p className="text-neutral-400">
                    {new Date(order.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <span className="font-bold text-sm">{order.id}</span>
              </div>

              <div className="space-y-1 text-neutral-400">
                <p>Client : {order.customerName}</p>
                <p>Adresse : {order.customerAddress}</p>
              </div>

              <div className="border-t border-dashed border-neutral-400/30 pt-3 space-y-1.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>{(item.price * item.quantity).toFixed(2)} DT</span>
                  </div>
                ))}
              </div>

              {order.promoCode && (
                <div className="flex justify-between text-emerald-500">
                  <span>Promo ({order.promoCode})</span>
                  <span>-{Number(order.discountAmount || 0).toFixed(2)} DT</span>
                </div>
              )}

              <div className="border-t border-dashed border-neutral-400/30 pt-3 flex justify-between font-bold text-sm">
                <span>TOTAL PAYÉ</span>
                <span>{order.total.toFixed(2)} DT</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className={`w-full h-11 rounded-full border text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'border-white/15 hover:bg-white/10 text-white'
                  : 'border-neutral-300 hover:bg-neutral-100 text-[#0A0A0A]'
              }`}
            >
              <Printer className="w-4 h-4" />
              Imprimer / Enregistrer le reçu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
