import type { PdfSettings } from '@/types/database';

export const DEFAULT_PDF_SETTINGS: PdfSettings = {
  template: 'classic',
  primaryColor: '#1e3a5f',
  accentColor: '#3b82f6',
  fontFamily: 'sans-serif',
  showLogo: true,
  logoPosition: 'left',
  showBankDetails: true,
  showPaymentTerms: true,
  showSignatureLine: false,
  showTaxId: true,
  footerText: 'Thank you for your business!',
  headerText: '',
};

export function mergePdfSettings(saved?: Partial<PdfSettings> | null): PdfSettings {
  return { ...DEFAULT_PDF_SETTINGS, ...(saved || {}) };
}

const FONT_STACKS: Record<string, string> = {
  'sans-serif': "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  'serif': "Georgia, 'Times New Roman', Times, serif",
  'mono': "'Courier New', Courier, monospace",
};

/**
 * Generates a CSS override block to inject into PDF HTML based on user settings.
 * Injected AFTER base styles so it wins via source-order specificity.
 */
export function buildPdfCssOverrides(s: PdfSettings): string {
  const font = FONT_STACKS[s.fontFamily] || FONT_STACKS['sans-serif'];
  const primary = s.primaryColor;
  const accent = s.accentColor;

  // Base overrides shared by all templates
  const base = `
    body { font-family: ${font}; }
    .company-name { color: ${primary} !important; }
    .document-type-label { color: ${primary} !important; }
  `;

  if (s.template === 'classic') {
    return base + `
      .header { border-bottom: 2px solid ${primary} !important; }
      .items-table th { background-color: ${primary} !important; color: #fff !important; }
      .items-table tr:nth-child(even) td { background-color: #f9fafb; }
      .totals-row.grand-total { color: ${primary} !important; border-top: 2px solid ${primary} !important; border-bottom: 2px solid ${primary} !important; }
      .totals-row.grand-total span { color: ${primary} !important; }
      .payment-info { background: #f0f4f8; border-left: 4px solid ${primary}; }
      .payment-info h3 { color: ${primary} !important; }
      .footer { border-top: 1px solid #e5e7eb; color: #6b7280; }
    `;
  }

  if (s.template === 'modern') {
    return base + `
      .document-wrapper { border-left: 6px solid ${primary} !important; padding-left: 34px; }
      .header { border-bottom: 1px solid #e5e7eb !important; }
      .document-type-label { background: ${primary} !important; color: #fff !important; display: inline-block; padding: 4px 14px; border-radius: 4px; font-size: 13px; letter-spacing: 2px; }
      .items-table th { background: transparent !important; color: ${primary} !important; border-bottom: 2px solid ${primary} !important; }
      .items-table tr:nth-child(even) td { background: transparent !important; }
      .items-table td { border-bottom: 1px solid #f3f4f6; }
      .totals-row.grand-total { color: ${primary} !important; border-top: 2px solid ${primary} !important; border-bottom: none !important; font-size: 17px; }
      .totals-row.grand-total span { color: ${primary} !important; }
      .payment-info { background: transparent !important; border: 1px solid #e5e7eb; border-radius: 8px; }
      .payment-info h3 { color: ${accent} !important; }
      .footer { color: #9ca3af; }
    `;
  }

  // minimal
  return base + `
    .header { border-bottom: 1px solid #d1d5db !important; }
    .document-type-label { color: #6b7280 !important; font-weight: 400; letter-spacing: 1px; }
    .items-table th { background: transparent !important; color: #6b7280 !important; border-bottom: 1px solid ${primary} !important; font-weight: 500; text-transform: uppercase; font-size: 11px; }
    .items-table tr:nth-child(even) td { background: transparent !important; }
    .items-table td { border-bottom: 1px solid #f3f4f6; }
    .totals-row.grand-total { color: #111827 !important; border-top: 1px solid #d1d5db !important; border-bottom: none !important; }
    .payment-info { background: #fafafa !important; border: 1px solid #e5e7eb; }
    .footer { color: #9ca3af; }
  `;
}

/** Async loader for client-side pages (fetches from API). Caches in memory during session. */
let _cached: PdfSettings | null = null;
export async function fetchPdfSettings(): Promise<PdfSettings> {
  if (_cached) return _cached;
  try {
    const res = await fetch('/api/settings/pdf');
    if (res.ok) {
      const json = await res.json();
      _cached = mergePdfSettings(json);
      return _cached;
    }
  } catch { /* fallback to defaults */ }
  return { ...DEFAULT_PDF_SETTINGS };
}

export function clearPdfSettingsCache() {
  _cached = null;
}
