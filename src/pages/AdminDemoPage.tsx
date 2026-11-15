import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  Clock, 
  Search, 
  Lock, 
  Unlock, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  MessageCircle, 
  Phone, 
  MapPin, 
  Plus, 
  Eye, 
  X,
  CreditCard,
  Banknote,
  Truck,
  Printer,
  Sparkles,
  ShieldCheck,
  Award,
  FileText,
  ExternalLink,
  ChevronRight,
  Filter,
  Database,
  LogOut,
  UserCheck,
  Edit,
  RefreshCw,
  Layers,
  Crown,
  Tag
} from 'lucide-react';
import { useOrders, StoreOrder, PaymentStatus, FulfillmentStatus } from '../context/OrdersContext';
import { useSupport } from '../context/SupportContext';
import { useProducts, ProductVariant } from '../context/ProductsContext';
import { Product, ProductCategory } from '../types';
import { formatPrice } from '../utils/formatters';
import { DEMO_PRODUCTS } from '../data/products';
import SpotlightCard from '../components/ui/SpotlightCard';
import { supabase, logAuditEvent } from '../lib/supabaseClient';

export const AdminDemoPage: React.FC = () => {
  const { 
    orders, 
    updatePaymentStatus, 
    updateFulfillmentStatus, 
    deleteOrder, 
    addOrder,
    refreshOrders
  } = useOrders();

  const { tickets, updateTicketStatus, deleteTicket, unreadCount, refreshTickets } = useSupport();

  // Admin Authentication State (Supabase Auth & Session - P0.1)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('crown_coral_admin_auth') === 'true';
  });
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('crown_coral_admin_email') || null;
  });
  const [authTab, setAuthTab] = useState<'supabase' | 'demo'>('supabase');
  const [emailInput, setEmailInput] = useState('alawoderokibat7@gmail.com');
  const [passwordInput, setPasswordInput] = useState('CrownCoral2026!');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setCurrentUserEmail(session.user.email || null);
        localStorage.setItem('crown_coral_admin_auth', 'true');
        if (session.user.email) localStorage.setItem('crown_coral_admin_email', session.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setCurrentUserEmail(session.user.email || null);
        localStorage.setItem('crown_coral_admin_auth', 'true');
        if (session.user.email) localStorage.setItem('crown_coral_admin_email', session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Products & Inventory State (Phase 2 - P1.1 & P0.4)
  const { 
    products, 
    variants, 
    updateVariantStock, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    refreshProducts: refreshCatalogue 
  } = useProducts();

  // Active View Tab: 'orders' | 'financials' | 'dispatch' | 'inventory' | 'support'
  const [activeTab, setActiveTab] = useState<'orders' | 'financials' | 'dispatch' | 'inventory' | 'support'>('orders');

  // Filters & Search for Orders
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'gift_boxing' | 'dispatched' | 'delivered'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'card' | 'transfer' | 'pod'>('all');

  // Filters & Search for Inventory
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('all');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  
  // Modals
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [waybillOrder, setWaybillOrder] = useState<StoreOrder | null>(null);
  const [verifySlipOrder, setVerifySlipOrder] = useState<StoreOrder | null>(null);
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockAdjustModal, setStockAdjustModal] = useState<{
    variantId: string;
    productName: string;
    size: string;
    currentStock: number;
  } | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(5);
  const [stockReason, setStockReason] = useState<string>('Restock Shipment Arrived');

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdTagline, setNewProdTagline] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('dresses-partywear');
  const [newProdGender, setNewProdGender] = useState<'girls' | 'boys' | 'unisex'>('girls');
  const [newProdPrice, setNewProdPrice] = useState('28000');
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=800&auto=format&fit=crop');
  const [newProdDesc, setNewProdDesc] = useState('Hand-tailored heirloom occasionwear with hand-stitched details.');
  const [newProdFabric, setNewProdFabric] = useState('100% Breathable European Linen & Organic Cotton');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Manual Order Form State
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualCity, setManualCity] = useState('Lagos - Island (Lekki, Ikoyi, VI)');
  const [manualAddress, setManualAddress] = useState('');
  const [manualProductId, setManualProductId] = useState(products[0]?.id || DEMO_PRODUCTS[0]?.id || '');
  const [manualSize, setManualSize] = useState('4Y');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'pod' | 'transfer' | 'card'>('transfer');
  const [manualPaymentStatus, setManualPaymentStatus] = useState<PaymentStatus>('paid');
  const [manualClientTier, setManualClientTier] = useState<'Crown VIP' | 'Atelier Member' | 'First-Time Client'>('Atelier Member');
  const [manualGiftWrapping, setManualGiftWrapping] = useState('Signature Blush Silk Box & Gold Ribbon');

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput,
      });

      if (error) {
        setLoginError(error.message);
      } else if (data.user) {
        setIsAuthenticated(true);
        setCurrentUserEmail(data.user.email || null);
        localStorage.setItem('crown_coral_admin_auth', 'true');
        if (data.user.email) localStorage.setItem('crown_coral_admin_email', data.user.email);
        await logAuditEvent('OWNER_LOGIN', 'auth', data.user.id, { email: data.user.email });
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput.toLowerCase() === 'rocky') {
      setIsAuthenticated(true);
      setCurrentUserEmail('rocky.demo@crowncoral.internal');
      localStorage.setItem('crown_coral_admin_auth', 'true');
      setPinError(false);
      setLoginError('');
    } else {
      setPinError(true);
      setLoginError('Incorrect PIN. For demo sandbox, enter 1234 or rocky');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out:', e);
    }
    setIsAuthenticated(false);
    setCurrentUserEmail(null);
    localStorage.removeItem('crown_coral_admin_auth');
    localStorage.removeItem('crown_coral_admin_email');
  };

  // Filtered orders computation
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter === 'paid' && order.paymentStatus !== 'paid') return false;
      if (statusFilter === 'pending' && order.paymentStatus !== 'pending') return false;
      if (statusFilter === 'gift_boxing' && order.fulfillmentStatus !== 'gift_boxing') return false;
      if (statusFilter === 'dispatched' && order.fulfillmentStatus !== 'dispatched') return false;
      if (statusFilter === 'delivered' && order.fulfillmentStatus !== 'delivered') return false;

      // Payment method filter
      if (paymentMethodFilter !== 'all' && order.paymentMethod !== paymentMethodFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = order.customerName.toLowerCase().includes(query);
        const matchesPhone = order.phone.toLowerCase().includes(query);
        const matchesId = order.id.toLowerCase().includes(query);
        const matchesCity = order.city.toLowerCase().includes(query);
        const matchesRef = order.paymentReference?.toLowerCase().includes(query);
        return matchesName || matchesPhone || matchesId || matchesCity || !!matchesRef;
      }
      return true;
    });
  }, [orders, statusFilter, paymentMethodFilter, searchQuery]);

  // Financial Metrics
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);
  const paidRevenue = useMemo(() => orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0), [orders]);
  const pendingRevenue = useMemo(() => orders.filter((o) => o.paymentStatus === 'pending').reduce((sum, o) => sum + o.total, 0), [orders]);
  const avgOrderValue = useMemo(() => orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0, [orders, totalRevenue]);

  // Inventory Metrics & Filtered List (Phase 2 - P1.1 & P0.4)
  const filteredInventory = useMemo(() => {
    return products.filter((prod) => {
      if (inventoryCategory !== 'all' && prod.category !== inventoryCategory) return false;
      if (inventoryStockFilter === 'in_stock' && prod.stockCount <= 0) return false;
      if (inventoryStockFilter === 'low_stock' && (prod.stockCount <= 0 || prod.stockCount > 5)) return false;
      if (inventoryStockFilter === 'out_of_stock' && prod.stockCount > 0) return false;

      if (inventorySearch.trim()) {
        const q = inventorySearch.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesCategory = (prod.categoryLabel || '').toLowerCase().includes(q);
        const matchesTags = prod.tags.some((t) => t.toLowerCase().includes(q));
        const prodVariants = variants[prod.id] || [];
        const matchesSku = prodVariants.some((v) => v.sku.toLowerCase().includes(q));
        return matchesName || matchesCategory || matchesTags || matchesSku;
      }
      return true;
    });
  }, [products, variants, inventoryCategory, inventoryStockFilter, inventorySearch]);

  const totalInventoryPieces = useMemo(() => products.reduce((sum, p) => sum + p.stockCount, 0), [products]);
  const lowStockCount = useMemo(() => products.filter((p) => p.stockCount > 0 && p.stockCount <= 5).length, [products]);
  const outOfStockCount = useMemo(() => products.filter((p) => p.stockCount === 0).length, [products]);
  const inventoryValuation = useMemo(() => products.reduce((sum, p) => sum + p.price * p.stockCount, 0), [products]);

  const handleApplyStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustModal) return;

    await updateVariantStock(
      stockAdjustModal.variantId,
      stockDelta,
      stockReason || 'Manual stock adjustment by Atelier Admin'
    );
    setStockAdjustModal(null);
  };

  const handleCreateNewProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;
    setIsCreatingProduct(true);

    const priceNum = parseInt(newProdPrice, 10) || 25000;
    await createProduct({
      name: newProdName.trim(),
      tagline: newProdTagline.trim(),
      category: newProdCategory,
      gender: newProdGender,
      price: priceNum,
      images: [newProdImage.trim()],
      description: newProdDesc.trim(),
      fabricDetails: newProdFabric.trim(),
      initialSizes: [
        { size: '4Y', stock: 6 },
        { size: '5Y', stock: 6 },
        { size: '6Y', stock: 6 },
      ],
    });

    setIsCreatingProduct(false);
    setIsAddProductOpen(false);
    setNewProdName('');
    setNewProdTagline('');
  };

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === manualProductId) || products[0] || DEMO_PRODUCTS[0];
    if (!prod) return;

    addOrder({
      customerName: manualName || 'Walk-in Boutique Client',
      phone: manualPhone || '+234 800 000 0000',
      city: manualCity,
      address: manualAddress || 'In-Store Atelier Collection',
      items: [{ product: prod, selectedSize: manualSize, quantity: 1 }],
      subtotal: prod.price,
      deliveryFee: manualCity.includes('In-Store') ? 0 : 2500,
      total: prod.price + (manualCity.includes('In-Store') ? 0 : 2500),
      paymentMethod: manualPaymentMethod,
      paymentStatus: manualPaymentStatus,
      fulfillmentStatus: 'new',
      clientTier: manualClientTier,
      giftWrapping: manualGiftWrapping,
      notes: 'Recorded via Store Admin Operations',
    });

    setIsManualOrderOpen(false);
    setManualName('');
    setManualPhone('');
    setManualAddress('');
  };

  const openWhatsAppCustomer = (order: StoreOrder) => {
    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${order.customerName},\nThis is Crown & Coral Royal Children's Atelier regarding your order #${order.id}.\n• Amount: ₦${order.total.toLocaleString()}\n• Payment: ${order.paymentStatus === 'paid' ? 'PAID & VERIFIED (' + (order.paymentGateway || 'Bank Settlement') + ')' : 'PAYMENT PENDING'}\n• Waybill: ${order.waybillNumber || 'Assigned to Courier'}\n• Packaging: ${order.giftWrapping || 'Silk Gift Box'}\n\nOur royal concierge is overseeing your luxury preparation. Thank you for dressing with Crown & Coral!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const printWaybill = () => {
    window.print();
  };

  // If not authenticated, render Owner Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <SpotlightCard
          theme="light"
          spotlightColor="#D46A7E"
          intensity={0.25}
          spotlightSize={320}
          className="w-full max-w-md p-8 glass-panel rounded-3xl text-center space-y-6 relative border border-white/80 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-boutique-charcoal text-amber-300 mx-auto flex items-center justify-center shadow-md">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-boutique-rose-light text-boutique-rose text-[10px] font-bold tracking-widest uppercase mb-2">
              <Sparkles className="w-3 h-3 text-boutique-rose" />
              <span>Executive Atelier Management</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-boutique-charcoal">
              Crown & Coral · Executive Portal
            </h1>
            <p className="text-xs text-boutique-taupe mt-1.5 max-w-xs mx-auto">
              Secure access to incoming VIP client bookings, payment gateway settlements, and dispatch logistics.
            </p>
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthTab('supabase');
                setLoginError('');
              }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                authTab === 'supabase'
                  ? 'bg-white text-boutique-charcoal shadow-xs'
                  : 'text-boutique-taupe hover:text-boutique-charcoal'
              }`}
            >
              Supabase Auth (Production)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('demo');
                setLoginError('');
              }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                authTab === 'demo'
                  ? 'bg-white text-boutique-charcoal shadow-xs'
                  : 'text-boutique-taupe hover:text-boutique-charcoal'
              }`}
            >
              Demo Sandbox
            </button>
          </div>

          {/* Tab 1: Supabase Email & Password Login */}
          {authTab === 'supabase' ? (
            <form onSubmit={handleSupabaseLogin} className="space-y-3.5 text-left">
              <div>
                <label className="block text-[11px] font-bold text-boutique-charcoal uppercase tracking-wider mb-1">
                  Owner Email
                </label>
                <input
                  type="email"
                  placeholder="alawoderokibat7@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white/90 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent text-boutique-charcoal font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-boutique-charcoal uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white/90 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent text-boutique-charcoal font-medium"
                  required
                />
              </div>

              {loginError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-600 font-medium">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full btn-accent-primary py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-clay-pill disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Sign In With Supabase</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Tab 2: Demo Sandbox Fast Unlock */
            <form onSubmit={handleDemoUnlock} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-boutique-charcoal uppercase tracking-wider mb-1.5">
                  Sandbox PIN
                </label>
                <input
                  type="password"
                  placeholder="Enter 1234 or rocky"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white/90 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
                {loginError && (
                  <span className="text-[11px] text-red-500 font-medium block mt-1">
                    {loginError}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="w-full btn-accent-primary py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-clay-pill"
              >
                <Unlock className="w-4 h-4" />
                <span>Open Sandbox Workspace</span>
              </button>
            </form>
          )}

          <div className="pt-2 text-center border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-boutique-taupe">
            <Database className="w-3.5 h-3.5 text-accent" />
            <span>PostgreSQL: <strong className="text-boutique-charcoal">niukwttwnulraczuyebs</strong></span>
          </div>
        </SpotlightCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Admin Navigation Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/80 shadow-xl relative overflow-hidden">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 text-[11px] font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PostgreSQL Live: niukwttwnulraczuyebs</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/20 text-[#06281E] text-[10px] font-bold uppercase tracking-wider border border-accent/40">
              <UserCheck className="w-3 h-3 text-accent" />
              <span>{currentUserEmail || 'Rocky Alawode (Owner)'}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-boutique-taupe text-[10px] font-bold uppercase tracking-wider">
              RC: 1894201
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-boutique-charcoal">
            Crown & Coral Kids · Executive Operations Suite
          </h1>
          <p className="text-xs sm:text-sm text-boutique-taupe">
            Centralized Supabase PostgreSQL architecture with Row Level Security (RLS) & transactional fulfillment management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              refreshOrders();
              refreshTickets();
            }}
            className="px-3 py-2.5 rounded-xl bg-white/80 hover:bg-white text-boutique-charcoal text-xs font-bold border border-gray-200 transition flex items-center gap-1.5 shadow-xs"
            title="Refresh Database Records"
          >
            <Database className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Sync DB</span>
          </button>

          <button
            onClick={() => setIsManualOrderOpen(true)}
            className="btn-accent-primary px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-clay-pill"
          >
            <Plus className="w-4 h-4" />
            <span>New Atelier Booking</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2.5 rounded-xl bg-white/70 hover:bg-red-50 hover:text-red-600 text-boutique-charcoal text-xs font-bold border border-gray-200 transition flex items-center gap-1"
            title="Sign Out of Portal"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 3D KPI Metrics with React Bits SpotlightCard & Border Glow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Verified Paid Revenue */}
        <SpotlightCard
          theme="light"
          spotlightColor="#10b981"
          intensity={0.18}
          spotlightSize={260}
          className="rounded-2xl p-5 border border-emerald-500/25 bg-emerald-50/20 backdrop-blur-md"
        >
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cleared Paid Revenue</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950 tabular-nums">
              {formatPrice(paidRevenue)}
            </span>
            <span className="block text-[11px] text-emerald-700 font-semibold mt-0.5">
              Paystack 3D-Secure & Verified Transfers
            </span>
          </div>
        </SpotlightCard>

        {/* Pending Payment (POD) */}
        <SpotlightCard
          theme="light"
          spotlightColor="#f59e0b"
          intensity={0.18}
          spotlightSize={260}
          className="rounded-2xl p-5 border border-amber-500/25 bg-amber-50/20 backdrop-blur-md"
        >
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Settlement (POD)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-amber-950 tabular-nums">
              {formatPrice(pendingRevenue)}
            </span>
            <span className="block text-[11px] text-amber-700 font-semibold mt-0.5">
              Assigned to Moniepoint Courier POS
            </span>
          </div>
        </SpotlightCard>

        {/* Total Bookings */}
        <SpotlightCard
          theme="light"
          spotlightColor="#D46A7E"
          intensity={0.18}
          spotlightSize={260}
          className="rounded-2xl p-5 border border-white/80 glass-card"
        >
          <div className="flex items-center justify-between text-boutique-taupe">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Bookings</span>
            <ShoppingBag className="w-4 h-4 text-boutique-rose" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-boutique-charcoal tabular-nums">
              {orders.length}
            </span>
            <span className="block text-[11px] text-boutique-taupe mt-0.5">
              100% Luxury packaging requested
            </span>
          </div>
        </SpotlightCard>

        {/* Average Order Value (AOV) */}
        <SpotlightCard
          theme="light"
          spotlightColor="#a855f7"
          intensity={0.18}
          spotlightSize={260}
          className="rounded-2xl p-5 border border-white/80 glass-card"
        >
          <div className="flex items-center justify-between text-boutique-taupe">
            <span className="text-[11px] font-bold uppercase tracking-wider">Average Order Value</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-boutique-charcoal tabular-nums">
              {formatPrice(avgOrderValue)}
            </span>
            <span className="block text-[11px] text-boutique-taupe mt-0.5">
              Occasionwear & Heirloom Sets
            </span>
          </div>
        </SpotlightCard>

      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-boutique-charcoal text-white shadow-sm'
              : 'bg-white/60 text-boutique-taupe hover:bg-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Customer Orders & Status ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('financials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'financials'
              ? 'bg-boutique-charcoal text-white shadow-sm'
              : 'bg-white/60 text-boutique-taupe hover:bg-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment & Bank Gateway Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('dispatch')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'dispatch'
              ? 'bg-boutique-charcoal text-white shadow-sm'
              : 'bg-white/60 text-boutique-taupe hover:bg-white'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Dispatch & Waybills</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-boutique-charcoal text-white shadow-sm'
              : 'bg-white/60 text-boutique-taupe hover:bg-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Atelier Stock & Catalogue ({products.length})</span>
          {lowStockCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center" title={`${lowStockCount} items have low stock`}>
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'support'
              ? 'bg-boutique-charcoal text-white shadow-sm'
              : 'bg-white/60 text-boutique-taupe hover:bg-white'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Client Support Inbox</span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-boutique-rose text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Orders Filter & Search Toolbar */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-white/80">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: `All (${orders.length})` },
                { id: 'paid', label: `Paid (${orders.filter((o) => o.paymentStatus === 'paid').length})` },
                { id: 'pending', label: `Pending Payment (${orders.filter((o) => o.paymentStatus === 'pending').length})` },
                { id: 'gift_boxing', label: `Gift Boxing (${orders.filter((o) => o.fulfillmentStatus === 'gift_boxing').length})` },
                { id: 'dispatched', label: `Dispatched (${orders.filter((o) => o.fulfillmentStatus === 'dispatched').length})` },
                { id: 'delivered', label: `Delivered (${orders.filter((o) => o.fulfillmentStatus === 'delivered').length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-boutique-rose text-white shadow-xs'
                      : 'bg-white/60 text-boutique-taupe hover:bg-white hover:text-boutique-charcoal'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <input
                type="text"
                placeholder="Search name, phone, CC-#, or Reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-boutique-rose/30"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Orders Table */}
          <div className="glass-panel rounded-3xl overflow-hidden border border-white/80 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200/80 bg-white/40 text-[10px] font-bold uppercase tracking-wider text-boutique-taupe">
                    <th className="py-3.5 px-4 sm:px-6">Booking Reference</th>
                    <th className="py-3.5 px-4 sm:px-6">Client Profile</th>
                    <th className="py-3.5 px-4 sm:px-6">Atelier Pieces</th>
                    <th className="py-3.5 px-4 sm:px-6">Payment Access</th>
                    <th className="py-3.5 px-4 sm:px-6">Fulfillment Stage</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/60 text-xs">
                  {filteredOrders.map((order) => {
                    const isPaid = order.paymentStatus === 'paid';

                    return (
                      <tr key={order.id} className="hover:bg-white/50 transition-colors">
                        
                        {/* Order ID & Time */}
                        <td className="py-4 px-4 sm:px-6 align-top">
                          <span className="font-mono font-bold text-boutique-charcoal block">
                            #{order.id}
                          </span>
                          <span className="text-[10px] font-mono text-boutique-taupe block mt-0.5">
                            {order.paymentReference || 'NO-REF'}
                          </span>
                          <span className="text-[11px] text-boutique-taupe block mt-1">
                            {new Date(order.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        {/* Customer & VIP Tier */}
                        <td className="py-4 px-4 sm:px-6 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-boutique-charcoal block">
                              {order.customerName}
                            </span>
                            {order.clientTier === 'Crown VIP' && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[9px] font-bold flex items-center gap-0.5" title="Frequent Luxury Client">
                                👑 VIP
                              </span>
                            )}
                          </div>
                          <a 
                            href={`tel:${order.phone}`}
                            className="text-[11px] text-boutique-rose hover:underline font-medium block mt-0.5"
                          >
                            {order.phone}
                          </a>
                          <span className="text-[11px] text-boutique-taupe block mt-0.5 line-clamp-1">
                            {order.city}
                          </span>
                        </td>

                        {/* Outfits List */}
                        <td className="py-4 px-4 sm:px-6 align-top max-w-xs">
                          <div className="space-y-1">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="text-[11px] text-boutique-charcoal">
                                <span className="font-semibold">{it.product.name}</span>
                                <span className="text-boutique-taupe"> ({it.selectedSize}) × {it.quantity}</span>
                              </div>
                            ))}
                          </div>
                          {order.giftWrapping && (
                            <div className="mt-1 text-[10px] text-purple-700 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-purple-500" />
                              <span>{order.giftWrapping}</span>
                            </div>
                          )}
                          {order.notes && (
                            <div className="mt-1 p-1 rounded-lg bg-amber-50/80 text-[10px] text-amber-900 border border-amber-200/60">
                              📝 {order.notes}
                            </div>
                          )}
                        </td>

                        {/* Payment Access & Quick Verification */}
                        <td className="py-4 px-4 sm:px-6 align-top">
                          <div className="space-y-1.5">
                            <div className="font-bold text-sm text-boutique-charcoal tabular-nums">
                              {formatPrice(order.total)}
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              {isPaid ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>PAID & VERIFIED</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>PAYMENT PENDING</span>
                                </>
                              )}
                            </span>
                            <div className="text-[10px] text-boutique-taupe">
                              {order.paymentGateway || (order.paymentMethod === 'card' ? 'Paystack' : 'Bank Transfer')}
                            </div>

                            {/* 1-Click Toggle Action */}
                            <div>
                              <button
                                onClick={() => updatePaymentStatus(order.id, isPaid ? 'pending' : 'paid')}
                                className="text-[10px] font-bold text-boutique-rose hover:underline"
                              >
                                Mark as {isPaid ? 'Unpaid' : 'Paid'}
                              </button>
                              {order.paymentMethod === 'transfer' && (
                                <button
                                  onClick={() => setVerifySlipOrder(order)}
                                  className="text-[10px] font-bold text-purple-700 hover:underline ml-2"
                                >
                                  View Transfer
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Fulfillment Stage Selector */}
                        <td className="py-4 px-4 sm:px-6 align-top">
                          <div className="space-y-1.5">
                            <select
                              value={order.fulfillmentStatus}
                              onChange={(e) => updateFulfillmentStatus(order.id, e.target.value as FulfillmentStatus)}
                              className="text-[11px] font-semibold bg-white/90 border border-gray-200 rounded-lg px-2 py-1 text-boutique-charcoal focus:outline-none focus:ring-1 focus:ring-boutique-rose"
                            >
                              <option value="new">New Booking</option>
                              <option value="gift_boxing">In Gift Boxing</option>
                              <option value="dispatched">Dispatched (Courier)</option>
                              <option value="delivered">Delivered to Client</option>
                            </select>
                            <div className="text-[10px] text-boutique-taupe font-mono">
                              {order.waybillNumber}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Customer */}
                            <button
                              onClick={() => openWhatsAppCustomer(order)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition shadow-xs border border-emerald-200"
                              title="Message Client on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>

                            {/* Printable Waybill */}
                            <button
                              onClick={() => setWaybillOrder(order)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition shadow-xs border border-blue-200"
                              title="Print Couture Waybill & Packing Slip"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* View Full 3D Details */}
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-lg bg-white/80 text-boutique-charcoal hover:bg-boutique-charcoal hover:text-white transition shadow-xs border border-gray-200"
                              title="View Full Order Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Delete Order */}
                            <button
                              onClick={() => {
                                if (confirm(`Delete order #${order.id}?`)) {
                                  deleteOrder(order.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition shadow-xs border border-red-200"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FINANCIALS TAB (Gateway Reconciliation) */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-white/80 space-y-4">
            <h3 className="font-serif text-lg font-bold text-boutique-charcoal flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-boutique-rose" />
              <span>Payment Gateway & Settlement Reconciliation</span>
            </h3>
            <p className="text-xs text-boutique-taupe">
              Automatic settlement audit logs across Nigerian payment channels (Paystack 3D-Secure, GTBank direct transfers, and Moniepoint POS).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/80 border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-boutique-taupe block">Card Gateway (Paystack)</span>
                <span className="text-xl font-bold font-serif text-boutique-charcoal mt-1 block">
                  {formatPrice(orders.filter(o => o.paymentMethod === 'card' && o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0))}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-1">✓ 100% 3D-Secure Authenticated</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-boutique-taupe block">Direct Atelier Transfers</span>
                <span className="text-xl font-bold font-serif text-boutique-charcoal mt-1 block">
                  {formatPrice(orders.filter(o => o.paymentMethod === 'transfer' && o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0))}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-1">✓ GTBank 0192847291 Cleared</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-boutique-taupe block">Pay on Delivery Float</span>
                <span className="text-xl font-bold font-serif text-boutique-charcoal mt-1 block">
                  {formatPrice(orders.filter(o => o.paymentMethod === 'pod').reduce((s, o) => s + o.total, 0))}
                </span>
                <span className="text-[11px] text-amber-600 font-semibold block mt-1">⏳ Courier POS Collection in Transit</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden border border-white/80 shadow-md">
            <div className="p-4 bg-white/50 border-b border-gray-200/80 flex items-center justify-between">
              <span className="text-xs font-bold text-boutique-charcoal">Gateway Transaction Log</span>
              <span className="text-[11px] text-boutique-taupe">{orders.length} transactions recorded</span>
            </div>
            <div className="divide-y divide-gray-200/60 text-xs">
              {orders.map((o) => (
                <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/40">
                  <div>
                    <span className="font-mono font-bold text-boutique-charcoal block">#{o.id} · {o.customerName}</span>
                    <span className="text-[11px] text-boutique-taupe font-mono mt-0.5 block">{o.paymentReference} · {o.paymentGateway}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-sm tabular-nums text-boutique-charcoal">{formatPrice(o.total)}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      o.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {o.paymentStatus === 'paid' ? 'SETTLED' : 'AWAITING COURIER'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH & LOGISTICS TAB */}
      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-white/80 space-y-3">
            <h3 className="font-serif text-lg font-bold text-boutique-charcoal flex items-center gap-2">
              <Truck className="w-5 h-5 text-boutique-rose" />
              <span>Courier Fleet & Waybill Logistics</span>
            </h3>
            <p className="text-xs text-boutique-taupe">
              Manage local dispatch riders (Lagos Island, Ikeja GRA, Maitama Abuja) and print official packing waybills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((o) => (
              <div key={o.id} className="glass-card rounded-2xl p-5 border border-white/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-boutique-charcoal">#{o.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    {o.waybillNumber}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-bold text-boutique-charcoal">{o.customerName}</div>
                  <div className="text-boutique-taupe flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-boutique-rose flex-shrink-0 mt-0.5" />
                    <span>{o.address}, {o.city}</span>
                  </div>
                  <div className="text-[11px] text-purple-700 font-semibold pt-1">
                    Partner: {o.courierPartner}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-bold capitalize text-boutique-charcoal">
                    Status: {o.fulfillmentStatus.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => setWaybillOrder(o)}
                    className="px-3 py-1.5 rounded-lg bg-boutique-charcoal text-white text-[11px] font-semibold hover:bg-black transition flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATELIER CATALOGUE & INVENTORY MANAGEMENT TAB (Phase 2 - P1.1 & P0.4) */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          
          {/* Inventory Overview Header Strip */}
          <div className="glass-panel rounded-3xl p-6 border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-accent/20 text-[#06281E]">
                  <Package className="w-5 h-5 text-accent" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-boutique-charcoal">
                    Atelier Catalogue & Live Stock Management
                  </h3>
                  <span className="text-[11px] text-boutique-taupe">
                    Direct PostgreSQL sync with transactional inventory reservation and audit logging.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refreshCatalogue()}
                className="px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-boutique-charcoal text-xs font-bold transition border border-gray-200 flex items-center gap-1.5 shadow-xs"
                title="Refresh products and variants from database"
              >
                <RefreshCw className="w-3.5 h-3.5 text-boutique-taupe" />
                <span>Sync DB</span>
              </button>

              <button
                onClick={() => setIsAddProductOpen(true)}
                className="btn-accent-primary px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Royal Garment</span>
              </button>
            </div>
          </div>

          {/* Key Inventory Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-4 border border-white/80">
              <span className="text-[10px] uppercase font-bold text-boutique-taupe tracking-wider block">
                Garments Available
              </span>
              <span className="text-2xl font-serif font-bold text-boutique-charcoal tabular-nums mt-1 block">
                {totalInventoryPieces} pcs
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Across {products.length} models</span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/80">
              <span className="text-[10px] uppercase font-bold text-boutique-taupe tracking-wider block">
                Low Stock Warning
              </span>
              <span className="text-2xl font-serif font-bold text-amber-700 tabular-nums mt-1 block">
                {lowStockCount} items
              </span>
              <span className="text-[11px] text-amber-600 font-medium">&le; 5 units remaining</span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/80">
              <span className="text-[10px] uppercase font-bold text-boutique-taupe tracking-wider block">
                Sold Out
              </span>
              <span className="text-2xl font-serif font-bold text-rose-700 tabular-nums mt-1 block">
                {outOfStockCount} items
              </span>
              <span className="text-[11px] text-rose-600 font-medium">Storefront purchase disabled</span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/80">
              <span className="text-[10px] uppercase font-bold text-boutique-taupe tracking-wider block">
                Inventory Valuation
              </span>
              <span className="text-2xl font-serif font-bold text-[#06281E] tabular-nums mt-1 block">
                {formatPrice(inventoryValuation)}
              </span>
              <span className="text-[11px] text-[#06281E]/70 font-medium">Retail stock value</span>
            </div>
          </div>

          {/* Inventory Filters & Search Toolbar */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-white/80">
            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: `All Garments (${products.length})` },
                { id: 'in_stock', label: `In Stock (${products.filter((p) => p.stockCount > 5).length})` },
                { id: 'low_stock', label: `Low Stock (${lowStockCount})` },
                { id: 'out_of_stock', label: `Sold Out (${outOfStockCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInventoryStockFilter(tab.id as typeof inventoryStockFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    inventoryStockFilter === tab.id
                      ? 'bg-boutique-charcoal text-white shadow-xs'
                      : 'bg-white/60 text-boutique-taupe hover:bg-white hover:text-boutique-charcoal'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Category Dropdown & Search Input */}
            <div className="flex items-center gap-2">
              <select
                value={inventoryCategory}
                onChange={(e) => setInventoryCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent font-medium text-boutique-charcoal"
              >
                <option value="all">All Categories</option>
                <option value="dresses-partywear">Royal Occasion & Partywear</option>
                <option value="birthday">Sunday Best & Galas</option>
                <option value="matching-sets">Heirloom Linen & Sets</option>
                <option value="baby">Royal Toddlers (1–3 yrs)</option>
              </select>

              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  placeholder="Search piece, SKU, or tag..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Products & Variants List */}
          <div className="space-y-4">
            {filteredInventory.length === 0 ? (
              <div className="glass-panel rounded-3xl p-12 text-center space-y-3 border border-white/80">
                <Package className="w-10 h-10 text-boutique-taupe mx-auto" />
                <h4 className="font-serif font-bold text-base text-boutique-charcoal">No Matching Garments</h4>
                <p className="text-xs text-boutique-taupe">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              filteredInventory.map((prod) => {
                const prodVariants = variants[prod.id] || [];
                const isLow = prod.stockCount > 0 && prod.stockCount <= 5;
                const isOut = prod.stockCount === 0;

                return (
                  <div
                    key={prod.id}
                    className="glass-panel rounded-3xl p-5 border border-white/80 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Product Thumbnail & Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-20 rounded-2xl overflow-hidden bg-boutique-sand/40 flex-shrink-0 border border-gray-200 shadow-2xs">
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-wider">
                              #{prod.id}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-boutique-taupe px-2 py-0.5 rounded-full bg-white/60 border border-gray-200/60">
                              {prod.gender === 'girls' ? '👑 Princesses' : prod.gender === 'boys' ? '👑 Princes' : 'Unisex'}
                            </span>
                            {prod.isFeatured && (
                              <span className="text-[9px] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Featured
                              </span>
                            )}
                          </div>

                          <h4 className="font-serif font-bold text-base text-boutique-charcoal leading-tight">
                            {prod.name}
                          </h4>

                          <p className="text-xs text-boutique-taupe line-clamp-1">
                            {prod.tagline} • <span className="font-semibold text-boutique-charcoal">{formatPrice(prod.price)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Total Stock Badge & Actions */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                            isOut
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span>{isOut ? 'Sold Out' : isLow ? `Low Stock (${prod.stockCount})` : `${prod.stockCount} in Stock`}</span>
                        </span>

                        <button
                          onClick={async () => {
                            await updateProduct(prod.id, { isFeatured: !prod.isFeatured });
                          }}
                          className={`p-2 rounded-xl border text-xs font-bold transition ${
                            prod.isFeatured
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-white/80 text-boutique-taupe border-gray-200 hover:bg-white'
                          }`}
                          title="Toggle Featured on Storefront"
                        >
                          ★
                        </button>

                        <button
                          onClick={async () => {
                            if (confirm(`Remove "${prod.name}" from catalogue?`)) {
                              await deleteProduct(prod.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-white/80 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 transition"
                          title="Delete Garment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Size Variants & Live Stock Controls */}
                    <div className="pt-3 border-t border-gray-200/60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-boutique-charcoal uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-accent" />
                          <span>Size Variants & Real-Time Stock Units</span>
                        </span>
                        <span className="text-[10px] text-boutique-taupe">
                          Click + or - to record transactional stock changes instantly
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {prodVariants.length > 0 ? (
                          prodVariants.map((v) => (
                            <div
                              key={v.id}
                              className="p-2.5 rounded-2xl bg-white/70 border border-gray-200/80 shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-boutique-charcoal">{v.size}</span>
                                <span className={`text-[10px] font-bold ${v.stock_count <= 2 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                  {v.stock_count} pcs
                                </span>
                              </div>
                              <span className="block text-[8px] font-mono text-boutique-taupe truncate" title={v.sku}>
                                {v.sku}
                              </span>

                              {/* Stepper Controls */}
                              <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-100">
                                <button
                                  disabled={v.stock_count <= 0}
                                  onClick={async () => {
                                    await updateVariantStock(v.id, -1, 'Quick admin reduction');
                                  }}
                                  className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center justify-center transition"
                                  title="Decrease by 1"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => {
                                    setStockAdjustModal({
                                      variantId: v.id,
                                      productName: prod.name,
                                      size: v.size,
                                      currentStock: v.stock_count,
                                    });
                                    setStockDelta(5);
                                    setStockReason('Shipment Restock Received');
                                  }}
                                  className="text-[9px] font-bold text-accent hover:underline px-1"
                                  title="Audit / Custom Restock"
                                >
                                  Audit
                                </button>
                                <button
                                  onClick={async () => {
                                    await updateVariantStock(v.id, 1, 'Quick admin restock');
                                  }}
                                  className="w-6 h-6 rounded-lg bg-accent/20 hover:bg-accent/40 text-[#06281E] text-xs font-bold flex items-center justify-center transition"
                                  title="Increase by 1"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          prod.availableSizes.map((size) => (
                            <div
                              key={size}
                              className="p-2.5 rounded-2xl bg-white/70 border border-gray-200/80 shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-boutique-charcoal">{size}</span>
                                <span className="text-[10px] font-bold text-emerald-700">
                                  {Math.round(prod.stockCount / prod.availableSizes.length)} pcs
                                </span>
                              </div>
                              <span className="block text-[8px] font-mono text-boutique-taupe">
                                SKU-{prod.id.toUpperCase()}-{size}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CLIENT SUPPORT INBOX TAB */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-boutique-charcoal flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-boutique-rose" />
                <span>Live Client Support & Concierge Tickets</span>
              </h3>
              <p className="text-xs text-boutique-taupe mt-1">
                Real-time inquiries and sizing questions submitted by shoppers on the website.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                {unreadCount} Unresolved Tickets
              </span>
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden border border-white/80 shadow-md">
            {tickets.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-serif font-bold text-base text-boutique-charcoal">All Inquiries Resolved!</h4>
                <p className="text-xs text-boutique-taupe">No pending client questions in the queue.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200/60 text-xs">
                {tickets.map((t) => (
                  <div key={t.id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-white/40 transition">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-boutique-charcoal">#{t.id}</span>
                        <span className="font-bold text-sm text-boutique-charcoal">{t.customerName}</span>
                        <a href={`tel:${t.phone}`} className="text-[11px] text-boutique-rose hover:underline font-semibold">
                          {t.phone}
                        </a>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          t.status === 'new'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            : t.status === 'in_progress'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/70 border border-gray-100 text-boutique-charcoal text-xs leading-relaxed">
                        "{t.message}"
                      </div>
                      <span className="text-[10px] text-boutique-taupe block">
                        Received {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} via Store Chat
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={`https://wa.me/${t.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${t.customerName},\nThis is Crown & Coral Royal Children's Atelier following up on your question: "${t.message}"\nHow may we assist you further?`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Reply on WhatsApp</span>
                      </a>

                      <select
                        value={t.status}
                        onChange={(e) => updateTicketStatus(t.id, e.target.value as 'new' | 'in_progress' | 'resolved')}
                        className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-boutique-charcoal focus:outline-none focus:ring-1 focus:ring-boutique-rose"
                      >
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>

                      <button
                        onClick={() => {
                          if (confirm(`Delete ticket #${t.id}?`)) deleteTicket(t.id);
                        }}
                        className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE WAYBILL MODAL */}
      {waybillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl border border-gray-200 space-y-6 relative max-h-[92vh] overflow-y-auto text-boutique-charcoal">
            
            {/* Waybill Header */}
            <div className="border-b-2 border-boutique-charcoal pb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent text-[#06281E] font-serif font-bold flex items-center justify-center text-sm shadow-xs">
                    CC
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold tracking-tight">Crown & Coral Royal Children's Atelier</h2>
                    <span className="text-[9px] uppercase tracking-widest text-boutique-taupe">Official Dispatch Manifest & Waybill</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-boutique-rose block">{waybillOrder.waybillNumber}</span>
                <span className="text-[10px] text-boutique-taupe">Date: {new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            {/* Recipient & Courier Block */}
            <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-boutique-taupe block mb-1">Deliver To:</span>
                <div className="font-bold text-sm text-boutique-charcoal">{waybillOrder.customerName}</div>
                <div className="text-boutique-taupe mt-0.5">{waybillOrder.address}</div>
                <div className="text-boutique-taupe font-semibold">{waybillOrder.city}</div>
                <div className="text-boutique-rose font-bold mt-1">Tel: {waybillOrder.phone}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-boutique-taupe block mb-1">Dispatch Partner:</span>
                <div className="font-bold text-boutique-charcoal">{waybillOrder.courierPartner}</div>
                <div className="text-boutique-taupe mt-1">Payment Method: <span className="font-bold">{waybillOrder.paymentMethod.toUpperCase()}</span></div>
                <div className="text-boutique-taupe">Settlement: <span className="font-bold text-emerald-700">{waybillOrder.paymentStatus.toUpperCase()}</span></div>
                <div className="text-boutique-taupe">Packaging: {waybillOrder.giftWrapping}</div>
              </div>
            </div>

            {/* Manifest Items */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-boutique-taupe block mb-2">Package Contents</span>
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-[10px] font-bold uppercase">
                  <tr>
                    <th className="p-2 text-left">Garment / Outfit</th>
                    <th className="p-2 text-center">Size</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {waybillOrder.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-semibold">{it.product.name}</td>
                      <td className="p-2 text-center">{it.selectedSize}</td>
                      <td className="p-2 text-center">{it.quantity}</td>
                      <td className="p-2 text-right tabular-nums">{formatPrice(it.product.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-xs">
              <span className="text-boutique-taupe font-mono">RC: 1894201 · Crown & Coral Atelier Lagos</span>
              <div className="text-right">
                <span className="text-[11px] text-boutique-taupe block">Declared Parcel Total</span>
                <span className="text-lg font-serif font-bold text-boutique-charcoal tabular-nums">{formatPrice(waybillOrder.total)}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex gap-3 print:hidden">
              <button
                onClick={printWaybill}
                className="flex-1 py-3 rounded-xl btn-accent-primary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Slip (A4 / Thermal)</span>
              </button>
              <button
                onClick={() => setWaybillOrder(null)}
                className="py-3 px-6 rounded-xl bg-gray-100 text-boutique-charcoal text-xs font-bold hover:bg-gray-200"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* BANK TRANSFER VERIFICATION SLIP MODAL */}
      {verifySlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Electronic Bank Transfer</span>
                <h3 className="font-serif text-lg font-bold text-boutique-charcoal">Transfer Verification Slip</h3>
              </div>
              <button onClick={() => setVerifySlipOrder(null)} className="p-1 rounded-full text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-boutique-taupe">Beneficiary:</span>
                <span className="font-bold text-boutique-charcoal">Crown & Coral Kids Atelier Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-boutique-taupe">Bank & Account:</span>
                <span className="font-mono font-bold text-boutique-charcoal">GTBank · 0192847291</span>
              </div>
              <div className="flex justify-between">
                <span className="text-boutique-taupe">Reference Code:</span>
                <span className="font-mono font-bold text-purple-800">{verifySlipOrder.paymentReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-boutique-taupe">Amount Expected:</span>
                <span className="font-bold text-sm text-boutique-rose tabular-nums">{formatPrice(verifySlipOrder.total)}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => {
                  updatePaymentStatus(verifySlipOrder.id, 'paid');
                  setVerifySlipOrder(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Verify Funds</span>
              </button>
              <button
                onClick={() => setVerifySlipOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-gray-100 text-boutique-charcoal font-bold text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D ORDER DETAIL INSPECTOR MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-boutique-rose tracking-wider block">
                  3D Atelier Order Inspection
                </span>
                <h3 className="font-serif text-xl font-bold text-boutique-charcoal">
                  #{selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details Card */}
            <div className="p-4 rounded-2xl bg-boutique-sand/30 border border-boutique-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-boutique-charcoal">{selectedOrder.customerName}</span>
                <span className="text-boutique-taupe">{selectedOrder.phone}</span>
              </div>
              <div className="text-boutique-charcoal flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-boutique-rose flex-shrink-0 mt-0.5" />
                <span>{selectedOrder.address}, {selectedOrder.city}</span>
              </div>
            </div>

            {/* Outfits List */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-boutique-taupe block mb-2">
                Purchased Pieces ({selectedOrder.items.length})
              </span>
              <div className="space-y-2">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50/50">
                    <img
                      src={it.product.images[0]}
                      alt={it.product.name}
                      className="w-12 h-14 object-cover rounded-lg"
                    />
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-boutique-charcoal block">{it.product.name}</span>
                      <span className="text-boutique-taupe text-[11px]">Size: {it.selectedSize} · Qty: {it.quantity}</span>
                    </div>
                    <span className="font-bold text-xs tabular-nums text-boutique-charcoal">
                      {formatPrice(it.product.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-boutique-taupe">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold">{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-boutique-taupe">
                <span>Delivery Dispatch</span>
                <span className="tabular-nums font-semibold">{formatPrice(selectedOrder.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-boutique-charcoal pt-1 border-t border-gray-100">
                <span>Total Amount</span>
                <span className="tabular-nums text-boutique-rose">{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => openWhatsAppCustomer(selectedOrder)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-700 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Client</span>
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="py-2.5 px-5 rounded-xl bg-gray-100 text-boutique-charcoal font-bold text-xs hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ORDER MODAL */}
      {isManualOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-boutique-rose tracking-wider block">
                  Direct Atelier Entry
                </span>
                <h3 className="font-serif text-xl font-bold text-boutique-charcoal">
                  Create Manual / Phone Booking
                </h3>
              </div>
              <button
                onClick={() => setIsManualOrderOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-boutique-charcoal mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mrs. Ngozi Adeleke"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-boutique-rose"
                  />
                </div>
                <div>
                  <label className="block font-bold text-boutique-charcoal mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+234 800 000 0000"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-boutique-rose"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-boutique-charcoal mb-1">Delivery Destination</label>
                <select
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-boutique-rose"
                >
                  <option value="Lagos - Island (Lekki, Ikoyi, VI)">Lagos - Island (Lekki, Ikoyi, VI)</option>
                  <option value="Lagos - Mainland (Ikeja, Surulere, Yaba)">Lagos - Mainland (Ikeja, Surulere, Yaba)</option>
                  <option value="Abuja & Nationwide Priority Express">Abuja & Nationwide Priority Express</option>
                  <option value="In-Store Boutique Collection">In-Store Boutique Collection</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-boutique-charcoal mb-1">Full Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="Street name, house number, estate"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-boutique-rose"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-boutique-charcoal mb-1">Select Outfit</label>
                  <select
                    value={manualProductId}
                    onChange={(e) => setManualProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-boutique-rose"
                  >
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({formatPrice(prod.price)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-boutique-charcoal mb-1">Size</label>
                  <input
                    type="text"
                    value={manualSize}
                    onChange={(e) => setManualSize(e.target.value)}
                    placeholder="e.g. 4Y, 5Y, EU 26"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-boutique-rose"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-boutique-charcoal mb-1">Payment Method</label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value as 'pod' | 'transfer' | 'card')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-boutique-rose"
                  >
                    <option value="transfer">Direct Bank Transfer (GTBank)</option>
                    <option value="card">Debit Card (Paystack/POS)</option>
                    <option value="pod">Pay on Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-boutique-charcoal mb-1">Payment Status</label>
                  <select
                    value={manualPaymentStatus}
                    onChange={(e) => setManualPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-boutique-rose"
                  >
                    <option value="paid">Paid & Confirmed</option>
                    <option value="pending">Pending Payment</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 btn-accent-primary py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md"
                >
                  Record Atelier Booking
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualOrderOpen(false)}
                  className="py-2.5 px-5 rounded-xl bg-gray-100 text-boutique-charcoal font-bold text-xs hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK AUDIT ADJUSTMENT MODAL (Phase 2 - P0.4) */}
      {stockAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 space-y-4 text-boutique-charcoal text-xs">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-accent tracking-wider block">
                  Transactional Stock Audit
                </span>
                <h3 className="font-serif text-lg font-bold">
                  {stockAdjustModal.productName}
                </h3>
                <span className="text-xs text-boutique-taupe">
                  Size: <strong className="text-boutique-charcoal">{stockAdjustModal.size}</strong> • Current Stock: <strong className="text-emerald-700">{stockAdjustModal.currentStock} units</strong>
                </span>
              </div>
              <button
                onClick={() => setStockAdjustModal(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyStockAdjustment} className="space-y-3.5">
              <div>
                <label className="block font-bold mb-1">
                  Quantity Adjustment (+ to add stock, - to remove)
                </label>
                <input
                  type="number"
                  required
                  value={stockDelta}
                  onChange={(e) => setStockDelta(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                  placeholder="+5 or -2"
                />
                <span className="text-[10px] text-boutique-taupe mt-1 block">
                  Projected New Stock: <strong className="text-boutique-charcoal">{Math.max(0, stockAdjustModal.currentStock + stockDelta)} units</strong>
                </span>
              </div>

              <div>
                <label className="block font-bold mb-1">Audit Log Reason</label>
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="Restock Shipment Arrived">Restock Shipment Arrived from Tailor</option>
                  <option value="Physical Inventory Reconciliation">Physical Inventory Count Reconciliation</option>
                  <option value="Walk-in Offline Purchase">Walk-in Offline Storefront Sale</option>
                  <option value="Damaged / Fabric Defect Written Off">Damaged / Fabric Defect Written Off</option>
                  <option value="Client VIP Fitting Reservation">Client VIP Fitting Reservation</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 btn-accent-primary py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs"
                >
                  Commit Inventory Movement
                </button>
                <button
                  type="button"
                  onClick={() => setStockAdjustModal(null)}
                  className="py-2.5 px-4 rounded-xl bg-gray-100 text-boutique-charcoal font-bold text-xs hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ROYAL PRODUCT MODAL (Phase 2 - P1.1) */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 space-y-4 text-boutique-charcoal text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-accent tracking-wider block flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-accent" />
                  <span>New Atelier Creation</span>
                </span>
                <h3 className="font-serif text-xl font-bold">
                  Add Royal Garment to Live Catalogue
                </h3>
              </div>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProductSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Garment Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Emerald Silk Ballerina Gown"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Price (₦ Naira)</label>
                  <input
                    type="number"
                    required
                    placeholder="28000"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Hand-embroidered champagne gold roses with tiered organza"
                  value={newProdTagline}
                  onChange={(e) => setNewProdTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="dresses-partywear">Royal Occasion & Partywear</option>
                    <option value="birthday">Sunday Best & Galas</option>
                    <option value="matching-sets">Heirloom Linen & Sets</option>
                    <option value="baby">Royal Toddlers (1–3 yrs)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Gender</label>
                  <select
                    value={newProdGender}
                    onChange={(e) => setNewProdGender(e.target.value as 'girls' | 'boys' | 'unisex')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="girls">Royal Princesses</option>
                    <option value="boys">Young Princes</option>
                    <option value="unisex">Unisex Heirloom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Fabric & Craftsmanship Details</label>
                <input
                  type="text"
                  value={newProdFabric}
                  onChange={(e) => setNewProdFabric(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="flex-1 btn-accent-primary py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingProduct ? 'Publishing to DB...' : 'Publish to Storefront & DB'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-gray-100 text-boutique-charcoal font-bold text-xs hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Atelier Copyright & Corporate Verification Strip */}
      <div className="p-4 rounded-2xl glass-panel text-center text-xs text-boutique-taupe border border-white/80 space-y-1">
        <p className="font-semibold text-boutique-charcoal">
          © 2026 Crown & Coral Kids Atelier Ltd. (RC: 1894201). All rights reserved.
        </p>
        <p className="text-[11px]">
          Compliant with Nigerian Data Protection Regulation (NDPR) & Global E-Commerce Authenticity Standards.
        </p>
      </div>

    </div>
  );
};
