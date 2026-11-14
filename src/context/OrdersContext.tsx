import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';
import { DEMO_PRODUCTS } from '../data/products';
import { supabase, logAuditEvent } from '../lib/supabaseClient';

export type PaymentMethod = 'pod' | 'transfer' | 'card' | 'bank_transfer' | 'paystack';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type FulfillmentStatus = 'new' | 'gift_boxing' | 'dispatched' | 'delivered' | 'cancelled';

export interface StoreOrder {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
  notes?: string;
  paymentReference?: string;
  paymentGateway?: string;
  waybillNumber?: string;
  courierPartner?: string;
  clientTier?: 'Crown VIP' | 'Atelier Member' | 'First-Time Client';
  giftWrapping?: string;
}

interface OrdersContextType {
  orders: StoreOrder[];
  addOrder: (order: Omit<StoreOrder, 'id' | 'createdAt'>) => StoreOrder;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  updateFulfillmentStatus: (orderId: string, status: FulfillmentStatus) => void;
  deleteOrder: (orderId: string) => void;
  clearAllOrders: () => void;
  isLoading: boolean;
  refreshOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

const ORDERS_STORAGE_KEY = 'crown_coral_orders_v1';

const INITIAL_ORDERS: StoreOrder[] = [
  {
    id: 'CC-942101',
    customerName: 'Mrs. Folake Adeleke',
    phone: '+234 803 412 9001',
    city: 'Lagos - Island (Lekki, Ikoyi, VI)',
    address: 'Plot 14 Admiralty Way, Lekki Phase 1',
    items: [
      {
        product: DEMO_PRODUCTS[0],
        selectedSize: '5Y',
        quantity: 1,
      },
    ],
    subtotal: DEMO_PRODUCTS[0]?.price || 24500,
    deliveryFee: 2500,
    total: (DEMO_PRODUCTS[0]?.price || 24500) + 2500,
    paymentMethod: 'bank_transfer',
    paymentStatus: 'paid',
    fulfillmentStatus: 'gift_boxing',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    notes: 'Please pack in luxury ribbon box for a 5th birthday gift.',
    paymentReference: 'GTB-TRF-0982341-CC',
    paymentGateway: 'Direct Bank Transfer (GTBank Atelier)',
    waybillNumber: 'WAY-CC-LAG-8821',
    courierPartner: 'Fez Priority Island Courier',
    clientTier: 'Crown VIP',
    giftWrapping: 'Signature Emerald Silk Box & Gold Foil Ribbon',
  },
  {
    id: 'CC-942102',
    customerName: 'Chidinma Eze',
    phone: '+234 812 880 3410',
    city: 'Abuja & Nationwide Priority Express',
    address: '8 Rhine Street, Maitama, Abuja',
    items: [
      {
        product: DEMO_PRODUCTS[1] || DEMO_PRODUCTS[0],
        selectedSize: '4Y',
        quantity: 1,
      },
    ],
    subtotal: (DEMO_PRODUCTS[1] || DEMO_PRODUCTS[0]).price,
    deliveryFee: 0,
    total: (DEMO_PRODUCTS[1] || DEMO_PRODUCTS[0]).price,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    fulfillmentStatus: 'dispatched',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    notes: 'Deliver before Friday wedding.',
    paymentReference: 'PSTK-AUTH-874102-3DS',
    paymentGateway: 'Paystack 3D-Secure (Mastercard)',
    waybillNumber: 'WAY-CC-ABJ-1904',
    courierPartner: 'GIG Logistics Air Express',
    clientTier: 'Crown VIP',
    giftWrapping: 'Heritage Champagne Keepsake Box',
  },
  {
    id: 'CC-942103',
    customerName: 'Dr. Amina Bello',
    phone: '+234 706 192 0344',
    city: 'Lagos - Mainland (Ikeja, Surulere, Yaba)',
    address: '15 Isaac John Street, GRA Ikeja',
    items: [
      {
        product: DEMO_PRODUCTS[2] || DEMO_PRODUCTS[0],
        selectedSize: '5Y',
        quantity: 1,
      },
    ],
    subtotal: (DEMO_PRODUCTS[2] || DEMO_PRODUCTS[0]).price,
    deliveryFee: 2500,
    total: (DEMO_PRODUCTS[2] || DEMO_PRODUCTS[0]).price + 2500,
    paymentMethod: 'pod',
    paymentStatus: 'pending',
    fulfillmentStatus: 'new',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    paymentReference: 'POS-AUTH-PENDING-DELIVERY',
    paymentGateway: 'Moniepoint POS on Arrival',
    waybillNumber: 'WAY-CC-MAIN-3012',
    courierPartner: 'In-House Dispatch Rider',
    clientTier: 'Atelier Member',
    giftWrapping: 'Standard French Linen Gift Wrap',
  },
];

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<StoreOrder[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load orders from cache:', e);
    }
    return INITIAL_ORDERS;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync to PostgreSQL database on mount
  const refreshOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: StoreOrder[] = data.map((d: any) => ({
          id: d.id,
          customerName: d.customer_name,
          phone: d.phone,
          email: d.email || undefined,
          city: d.city,
          address: d.delivery_address,
          notes: d.order_notes || undefined,
          subtotal: Number(d.subtotal),
          deliveryFee: Number(d.delivery_fee),
          total: Number(d.total),
          paymentMethod: d.payment_method as PaymentMethod,
          paymentStatus: d.payment_status as PaymentStatus,
          fulfillmentStatus: d.fulfillment_status as FulfillmentStatus,
          createdAt: d.created_at,
          paymentReference: d.payment_reference || undefined,
          paymentGateway: d.payment_gateway || undefined,
          waybillNumber: d.waybill_number || undefined,
          courierPartner: d.courier_partner || undefined,
          clientTier: d.client_tier as any,
          giftWrapping: d.gift_wrapping || undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: d.order_items?.map((item: any) => ({
            product: DEMO_PRODUCTS.find((p) => p.id === item.product_id) || {
              id: item.product_id || 'custom',
              name: item.product_name,
              price: Number(item.price),
              images: ['https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=800'],
              category: 'dresses-partywear',
              categoryLabel: 'Occasionwear',
              gender: 'girls',
              ageRange: '4-6 Years',
              ageMin: 4,
              ageMax: 6,
              availableSizes: [item.size],
              inStock: true,
              stockCount: 10,
              description: '',
              tags: [],
            },
            selectedSize: item.size,
            quantity: item.quantity,
          })) || [],
        }));
        setOrders(mapped);
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('Orders fetched from local fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshOrders();
  }, []);

  // Save to local cache on state change
  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn('Failed to save orders to cache:', e);
    }
  }, [orders]);

  const addOrder = (orderData: Omit<StoreOrder, 'id' | 'createdAt'>): StoreOrder => {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const newOrder: StoreOrder = {
      ...orderData,
      id: `CC-${randomCode}`,
      createdAt: new Date().toISOString(),
      paymentReference:
        orderData.paymentReference ||
        (orderData.paymentMethod === 'card'
          ? `PSTK-AUTH-${randomCode}-3DS`
          : orderData.paymentMethod === 'bank_transfer' || orderData.paymentMethod === 'transfer'
          ? `GTB-TRF-${randomCode}-CC`
          : `POS-COD-${randomCode}`),
      paymentGateway:
        orderData.paymentGateway ||
        (orderData.paymentMethod === 'card'
          ? 'Paystack 3D-Secure'
          : orderData.paymentMethod === 'bank_transfer' || orderData.paymentMethod === 'transfer'
          ? 'GTBank Direct Transfer'
          : 'POS Terminal on Delivery'),
      waybillNumber: orderData.waybillNumber || `WAY-CC-${randomCode}`,
      courierPartner:
        orderData.courierPartner ||
        (orderData.city.includes('Island')
          ? 'Fez Priority Island Rider'
          : orderData.city.includes('Mainland')
          ? 'In-House Dispatch Team'
          : 'GIG Logistics Priority Air'),
      clientTier: orderData.clientTier || 'First-Time Client',
      giftWrapping: orderData.giftWrapping || 'Crown & Coral Signature Silk Gift Box',
    };

    // Optimistic local state update
    setOrders((prev) => [newOrder, ...prev]);

    // Asynchronous PostgreSQL write
    (async () => {
      try {
        await supabase.from('orders').insert({
          id: newOrder.id,
          customer_name: newOrder.customerName,
          phone: newOrder.phone,
          email: newOrder.email || null,
          city: newOrder.city,
          delivery_address: newOrder.address,
          order_notes: newOrder.notes || null,
          payment_method: newOrder.paymentMethod === 'transfer' ? 'bank_transfer' : newOrder.paymentMethod,
          payment_status: newOrder.paymentStatus,
          payment_reference: newOrder.paymentReference || null,
          payment_gateway: newOrder.paymentGateway || null,
          fulfillment_status: newOrder.fulfillmentStatus,
          waybill_number: newOrder.waybillNumber || null,
          courier_partner: newOrder.courierPartner || null,
          client_tier: newOrder.clientTier || 'First-Time Client',
          gift_wrapping: newOrder.giftWrapping || 'Crown & Coral Signature Silk Gift Box',
          subtotal: newOrder.subtotal,
          delivery_fee: newOrder.deliveryFee,
          total: newOrder.total,
        });

        if (newOrder.items && newOrder.items.length > 0) {
          await supabase.from('order_items').insert(
            newOrder.items.map((it) => ({
              order_id: newOrder.id,
              product_id: it.product.id,
              product_name: it.product.name,
              size: it.selectedSize,
              price: it.product.price,
              quantity: it.quantity,
              total: it.product.price * it.quantity,
            }))
          );
        }

        await logAuditEvent('CREATE_ORDER', 'orders', newOrder.id, {
          total: newOrder.total,
          paymentMethod: newOrder.paymentMethod,
        });
      } catch (err) {
        console.warn('PostgreSQL order persistence error:', err);
      }
    })();

    return newOrder;
  };

  const updatePaymentStatus = (orderId: string, status: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, paymentStatus: status } : ord))
    );

    (async () => {
      try {
        await supabase.from('orders').update({ payment_status: status }).eq('id', orderId);
        await logAuditEvent('UPDATE_PAYMENT_STATUS', 'orders', orderId, { status });
      } catch (err) {
        console.warn('PostgreSQL updatePaymentStatus error:', err);
      }
    })();
  };

  const updateFulfillmentStatus = (orderId: string, status: FulfillmentStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, fulfillmentStatus: status } : ord))
    );

    (async () => {
      try {
        await supabase.from('orders').update({ fulfillment_status: status }).eq('id', orderId);
        await logAuditEvent('UPDATE_FULFILLMENT_STATUS', 'orders', orderId, { status });
      } catch (err) {
        console.warn('PostgreSQL updateFulfillmentStatus error:', err);
      }
    })();
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((ord) => ord.id !== orderId));

    (async () => {
      try {
        await supabase.from('orders').delete().eq('id', orderId);
        await logAuditEvent('DELETE_ORDER', 'orders', orderId);
      } catch (err) {
        console.warn('PostgreSQL deleteOrder error:', err);
      }
    })();
  };

  const clearAllOrders = () => {
    setOrders([]);
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addOrder,
        updatePaymentStatus,
        updateFulfillmentStatus,
        deleteOrder,
        clearAllOrders,
        isLoading,
        refreshOrders,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};
