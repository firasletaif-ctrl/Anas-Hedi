import React, { useEffect, useState } from 'react';
import { ShoppingBag, Sun, Moon } from 'lucide-react';
import { Logo } from './components/Logo';
import { Storefront } from './components/Storefront';
import { SellerDashboard } from './components/SellerDashboard';
import { CartDrawer } from './components/CartDrawer';
import { Product, CartItem, Order, OrderStatus, PromoCode } from './types';

function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 6;
}

function checkIsAdmin() {
  return window.location.pathname === '/admin' || window.location.hash === '#/admin';
}

export function App() {
  const [isAdmin, setIsAdmin] = useState(checkIsAdmin);
  const [isDark, setIsDark] = useState<boolean>(() => isNightTime());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('zs_admin_token'));

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onRouteChange = () => setIsAdmin(checkIsAdmin());
    window.addEventListener('hashchange', onRouteChange);
    window.addEventListener('popstate', onRouteChange);
    return () => {
      window.removeEventListener('hashchange', onRouteChange);
      window.removeEventListener('popstate', onRouteChange);
    };
  }, []);

  const fetchPublicProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async (authToken: string) => {
    const headers = { Authorization: `Bearer ${authToken}` };
    const [prodRes, ordRes, promoRes] = await Promise.all([
      fetch('/api/products?all=1', { headers }),
      fetch('/api/orders', { headers }),
      fetch('/api/promos', { headers }),
    ]);

    if (prodRes.status === 401 || ordRes.status === 401) {
      localStorage.removeItem('zs_admin_token');
      setToken(null);
      return;
    }

    if (prodRes.ok) setProducts(await prodRes.json());
    if (ordRes.ok) setOrders(await ordRes.json());
    if (promoRes.ok) setPromos(await promoRes.json());
    setLoading(false);
  };

  const refreshData = async () => {
    if (isAdmin && token) {
      await fetchAdminData(token);
    } else {
      await fetchPublicProducts();
    }
  };

  useEffect(() => {
    refreshData();
  }, [isAdmin, token]);

  const handleLogin = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('zs_admin_token', data.token);
    setToken(data.token);
    return true;
  };

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem('zs_admin_token');
    setToken(null);
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(product.stock, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
  };

  const handleUpdateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleCheckout = async (customer: { name: string; email: string; address: string; promoCode?: string }) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.name,
          customerEmail: customer.email,
          customerAddress: customer.address,
          promoCode: customer.promoCode,
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        }),
      });
      if (!res.ok) return false;
      setCart([]);
      await refreshData();
      return true;
    } catch {
      return false;
    }
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const handleCreateProduct = async (data: Omit<Product, 'id'>) => {
    const res = await fetch('/api/products', { method: 'POST', headers: authHeaders, body: JSON.stringify(data) });
    if (res.ok) await refreshData();
  };

  const handleUpdateProduct = async (id: string, data: Partial<Product>) => {
    const res = await fetch(`/api/products/${id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(data) });
    if (res.ok) await refreshData();
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: authHeaders });
    if (res.ok) await refreshData();
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status }) });
    if (res.ok) await refreshData();
  };

  const handleCreatePromo = async (code: string, discountPercent: number) => {
    const res = await fetch('/api/promos', { method: 'POST', headers: authHeaders, body: JSON.stringify({ code, discountPercent }) });
    if (res.ok) await refreshData();
  };

  const handleTogglePromo = async (id: string, active: number) => {
    const res = await fetch(`/api/promos/${id}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ active }) });
    if (res.ok) await refreshData();
  };

  const handleDeletePromo = async (id: string) => {
    const res = await fetch(`/api/promos/${id}`, { method: 'DELETE', headers: authHeaders });
    if (res.ok) await refreshData();
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const effectiveDark = isAdmin ? false : isDark;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      effectiveDark ? 'bg-[#09090B] text-white' : 'bg-white text-[#0A0A0A]'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 h-16 backdrop-blur-md border-b ${
        effectiveDark ? 'bg-[#09090B]/85 border-white/10' : 'bg-white/85 border-neutral-200'
      }`}>
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              if (isAdmin) window.location.hash = '';
            }}
            className="cursor-pointer"
          >
            <Logo isDark={effectiveDark} />
          </button>

          {!isAdmin && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsDark((d) => !d)}
                className={`p-2 rounded-full border cursor-pointer transition-colors ${
                  effectiveDark ? 'border-white/15 text-zinc-300 hover:text-white' : 'border-neutral-200 text-neutral-600 hover:text-[#0A0A0A]'
                }`}
                title="Mode Jour / Nuit"
              >
                {effectiveDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold cursor-pointer ${
                  effectiveDark
                    ? 'border-white/15 bg-white/5 text-white hover:border-white/30'
                    : 'border-neutral-200 bg-white text-[#0A0A0A] hover:border-[#0A0A0A]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Panier</span>
                {cartCount > 0 && (
                  <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                    effectiveDark ? 'bg-white text-[#09090B]' : 'bg-[#0A0A0A] text-white'
                  }`}>
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        {loading ? (
          <div className="py-32 text-center text-sm text-neutral-400">Chargement...</div>
        ) : isAdmin ? (
          <SellerDashboard
            token={token}
            onLogin={handleLogin}
            onLogout={handleLogout}
            products={products}
            orders={orders}
            promos={promos}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onCreatePromo={handleCreatePromo}
            onTogglePromo={handleTogglePromo}
            onDeletePromo={handleDeletePromo}
            onRefresh={refreshData}
          />
        ) : (
          <Storefront products={products} isDark={effectiveDark} onAddToCart={handleAddToCart} />
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-8 ${effectiveDark ? 'border-white/10 bg-[#09090B]' : 'border-neutral-200 bg-white'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo isDark={effectiveDark} />
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} ZoneStore. Tous droits réservés.
          </p>
        </div>
      </footer>

      <CartDrawer
        isOpen={isCartOpen}
        isDark={effectiveDark}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}

export default App;
