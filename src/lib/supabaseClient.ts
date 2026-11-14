import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://niukwttwnulraczuyebs.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdWt3dHR3bnVscmFjenV5ZWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NjA4MzEsImV4cCI6MjExMDIzNjgzMX0._I5VbeV8isczBMT3RKHQVbZdOn5KEmW-J7VjO7CEE0g';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Audit log helper: Records staff/owner administrative actions
 */
export async function logAuditEvent(action: string, entity: string, entityId?: string, details?: Record<string, unknown>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      action,
      entity,
      entity_id: entityId || null,
      details: details ? JSON.parse(JSON.stringify(details)) : null,
    });
  } catch (err) {
    console.warn('Audit logging skipped:', err);
  }
}
