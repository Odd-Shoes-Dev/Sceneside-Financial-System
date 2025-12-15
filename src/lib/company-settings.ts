import { createClient } from '@/lib/supabase/server';
import type { CompanySettings } from '@/types/database';

let cachedSettings: CompanySettings | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches company settings from the database
 * Uses caching to avoid excessive database calls
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - cacheTime) < CACHE_DURATION) {
    return cachedSettings;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Failed to fetch company settings:', error);
    // Return default settings if database fetch fails
    return getDefaultSettings();
  }

  cachedSettings = data;
  cacheTime = now;
  
  return data;
}

/**
 * Returns default company settings
 */
function getDefaultSettings(): CompanySettings {
  return {
    id: '',
    name: 'Sceneside L.L.C',
    legal_name: 'Sceneside L.L.C',
    ein: '99-3334108',
    address_line1: '121 Bedford Street',
    address_line2: null,
    city: 'Waltham',
    state: 'MA',
    zip_code: '02453',
    country: 'USA',
    phone: '857-384-2899',
    email: null,
    website: null,
    logo_url: null,
    base_currency: 'USD',
    fiscal_year_start_month: 1,
    inventory_method: 'fifo',
    default_payment_terms: 30,
    sales_tax_rate: 0.0625,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Clears the settings cache
 * Call this after updating company settings
 */
export function clearSettingsCache() {
  cachedSettings = null;
  cacheTime = 0;
}
