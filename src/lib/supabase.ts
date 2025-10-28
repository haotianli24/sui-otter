import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase not configured. Personalized AI features disabled.');
  console.warn('To enable: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
  console.warn('See QUICKSTART_PERSONALIZED_AI.md for setup instructions');
}

// Only create client if credentials are available
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Type definitions for database tables
export interface UserProfile {
  id: string;
  wallet_address: string;
  username: string;
  tone: 'casual' | 'professional' | 'friendly' | 'degen';
  interests: string[];
  personality_summary: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMemory {
  id: string;
  wallet_address: string;
  message: string;
  role: 'user' | 'assistant';
  learned_insights: Record<string, any>;
  timestamp: string;
}

export interface WalletActivity {
  id: string;
  wallet_address: string;
  nft_count: number;
  transaction_count: number;
  defi_protocols: string[];
  last_scanned: string;
}

