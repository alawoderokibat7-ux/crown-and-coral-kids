import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, logAuditEvent } from '../lib/supabaseClient';

export interface SupportTicket {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'new' | 'in_progress' | 'resolved';
  channel: 'chat_widget' | 'whatsapp';
  orderIdRef?: string;
}

interface SupportContextType {
  tickets: SupportTicket[];
  addTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => SupportTicket;
  updateTicketStatus: (id: string, status: 'new' | 'in_progress' | 'resolved') => void;
  deleteTicket: (id: string) => void;
  unreadCount: number;
  isLoading: boolean;
  refreshTickets: () => Promise<void>;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

const SUPPORT_STORAGE_KEY = 'crown_coral_support_inbox_v1';

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-1041',
    customerName: 'Mrs. Bunmi Okonjo',
    phone: '+234 802 334 1920',
    subject: 'Sizing recommendation for 7th Birthday',
    message: 'Hello, my daughter is turning 7 next week. Is the Sage Garden Eyelet Midi Dress true to size, or should I take size 8Y?',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    status: 'new',
    channel: 'chat_widget',
  },
  {
    id: 'TCK-1042',
    customerName: 'Tunde Bakare',
    phone: '+234 818 901 2234',
    subject: 'Pay on Delivery Confirmation - Lekki Phase 1',
    message: 'Can I pay with debit card POS when the dispatch rider gets to my office in Lekki?',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    channel: 'chat_widget',
  },
];

export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem(SUPPORT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load support tickets from cache:', e);
    }
    return INITIAL_TICKETS;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync with PostgreSQL on mount
  const refreshTickets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: SupportTicket[] = data.map((t: any) => ({
          id: t.id,
          customerName: t.customer_name,
          phone: t.phone,
          email: t.email || undefined,
          subject: t.subject || 'Atelier Inquiry',
          message: t.message,
          createdAt: t.created_at,
          status: t.status as 'new' | 'in_progress' | 'resolved',
          channel: 'chat_widget',
          orderIdRef: t.order_id || undefined,
        }));
        setTickets(mapped);
        localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('Support tickets fetched from local fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTickets();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(tickets));
    } catch (e) {
      console.warn('Failed to save support tickets to cache:', e);
    }
  }, [tickets]);

  const addTicket = (data: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>): SupportTicket => {
    const newTicket: SupportTicket = {
      ...data,
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    // Optimistic local state update
    setTickets((prev) => [newTicket, ...prev]);

    // Asynchronous PostgreSQL write
    (async () => {
      try {
        await supabase.from('support_tickets').insert({
          id: newTicket.id,
          customer_name: newTicket.customerName,
          phone: newTicket.phone,
          email: newTicket.email || null,
          subject: newTicket.subject || 'Storefront Concierge Question',
          message: newTicket.message,
          status: 'new',
          order_id: newTicket.orderIdRef || null,
        });

        await logAuditEvent('CREATE_TICKET', 'support_tickets', newTicket.id);
      } catch (err) {
        console.warn('PostgreSQL support ticket sync error:', err);
      }
    })();

    return newTicket;
  };

  const updateTicketStatus = (id: string, status: 'new' | 'in_progress' | 'resolved') => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );

    (async () => {
      try {
        await supabase.from('support_tickets').update({ status }).eq('id', id);
        await logAuditEvent('UPDATE_TICKET_STATUS', 'support_tickets', id, { status });
      } catch (err) {
        console.warn('PostgreSQL updateTicketStatus error:', err);
      }
    })();
  };

  const deleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));

    (async () => {
      try {
        await supabase.from('support_tickets').delete().eq('id', id);
        await logAuditEvent('DELETE_TICKET', 'support_tickets', id);
      } catch (err) {
        console.warn('PostgreSQL deleteTicket error:', err);
      }
    })();
  };

  const unreadCount = tickets.filter((t) => t.status === 'new').length;

  return (
    <SupportContext.Provider
      value={{
        tickets,
        addTicket,
        updateTicketStatus,
        deleteTicket,
        unreadCount,
        isLoading,
        refreshTickets,
      }}
    >
      {children}
    </SupportContext.Provider>
  );
};

export const useSupport = () => {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
};
