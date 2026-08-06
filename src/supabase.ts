import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://ancuzwijqbhqhzwncaqo.supabase.co";
export const SUPABASE_KEY = "sb_publishable_dMnCTpzzdu_UAx3xaN4nKA_r35X1uVH";

// Initialize the Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export interface Order {
  id?: string | number; // usually uuid or integer
  customer_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  product_variant: string;
  quantity: number;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  created_at?: string;
  cancellation_reason?: string;
}

// Default prices for common variants to make stats look highly realistic and dynamic
export const PRODUCT_PRICES: Record<string, number> = {
  'Wireless Ergonomic Mouse': 59,
  'Ultra-Slim Mechanical Keyboard': 129,
  'Minimalist Desk Pad': 35,
  'Noise Cancelling Headphones': 199,
  'Leather Travel Wallet': 45,
  'Portable Power Bank 20k': 49,
};

// Default cities in our system for filter and creation
export const POPULAR_CITIES = [
  'Casablanca',
  'Marrakech',
  'Rabat',
  'Tangier',
  'Fes',
  'Agadir',
  'Cairo',
  'Alexandria',
  'Riyadh',
  'Jeddah',
  'Dubai',
];

export const PRODUCT_VARIANTS = Object.keys(PRODUCT_PRICES);

export function getProductPrice(variant: string): number {
  const normalized = Object.keys(PRODUCT_PRICES).find(
    key => key.toLowerCase() === variant.toLowerCase() || variant.toLowerCase().includes(key.toLowerCase())
  );
  return normalized ? PRODUCT_PRICES[normalized] : 49; // Default fallback price
}

export function getNormalizedStatus(status: string | undefined): Order['status'] {
  if (!status) return 'Pending';
  const s = status.trim().toLowerCase();
  if (s === 'pending') return 'Pending';
  if (s === 'confirmed') return 'Confirmed';
  if (s === 'shipped') return 'Shipped';
  if (s === 'delivered') return 'Delivered';
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
  
  // Capitalize first letter as fallback
  try {
    return (status.trim().charAt(0).toUpperCase() + status.trim().slice(1).toLowerCase()) as Order['status'];
  } catch {
    return 'Pending';
  }
}
