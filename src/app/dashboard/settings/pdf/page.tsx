'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { PdfSettings } from '@/types/database';
import { DEFAULT_PDF_SETTINGS, mergePdfSettings, buildPdfCssOverrides } from '@/lib/pdf/pdf-settings';
import { clearPdfSettingsCache } from '@/lib/pdf/pdf-settings';

const TEMPLATES = [
  {
    id: 'classic' as const,
    label: 'Classic',
    description: 'Professional with filled header row and alternating row shading',
  },
  {
    id: 'modern' as const,
    label: 'Modern',
    description: 'Sleek left accent bar, clean table, no background fills',
  },
  {
    id: 'minimal' as const,
    label: 'Minimal',
    description: 'Simple line-only design, maximum whitespace and clarity',
  },
];

const FONTS = [
  { id: 'sans-serif' as const, label: 'Sans-Serif (default)' },
  { id: 'serif' as const, label: 'Serif (formal)' },
  { id: 'mono' as const, label: 'Monospace (technical)' },
];

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-4 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function generatePreviewHTML(s: PdfSettings): string {
  const overrides = buildPdfCssOverrides(s);
  const fontStacks: Record<string, string> = {
    'sans-serif': "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    serif: "Georgia, 'Times New Roman', Times, serif",
    mono: "'Courier New', Courier, monospace",
  };
  const font = fontStacks[s.fontFamily] || fontStacks['sans-serif'];

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:${font}; font-size:11px; color:#333; background:white; padding:20px; }
.document-wrapper { background:white; }
.header { display:flex; justify-content:space-between; align-items:flex-start;
  margin-bottom:20px; padding-bottom:14px; border-bottom:2px solid #1e3a5f; }
.company-name { font-size:16px; font-weight:700; color:#1e3a5f; }
.company-details { font-size:9px; color:#666; line-height:1.5; margin-top:3px; }
.document-type-label { font-size:22px; font-weight:700; color:#1e3a5f; }
.doc-number { font-size:11px; color:#666; margin-top:2px; }
.info-row { display:flex; justify-content:space-between; margin-bottom:16px; font-size:10px; }
.info-block h4 { font-size:8px; color:#999; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
.items-table { width:100%; border-collapse:collapse; margin-bottom:16px; }
.items-table th { background:#1e3a5f; color:white; padding:7px 10px; text-align:left; font-size:10px; }
.items-table th:last-child, .items-table td:last-child { text-align:right; }
.items-table td { padding:7px 10px; border-bottom:1px solid #eee; font-size:10px; }
.items-table tr:nth-child(even) td { background:#f9fafb; }
.totals-section { display:flex; justify-content:flex-end; margin-bottom:16px; }
.totals-table { width:200px; font-size:10px; }
.totals-row { display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #eee; }
.totals-row.grand-total { font-size:13px; font-weight:700; color:#1e3a5f;
  border-top:2px solid #1e3a5f; border-bottom:2px solid #1e3a5f; padding-top:7px; }
.totals-row.grand-total span { color:#1e3a5f; }
.payment-info { background:#f0f4f8; border-left:4px solid #1e3a5f; padding:10px 14px; border-radius:4px; margin-bottom:14px; font-size:10px; }
.payment-info h3 { font-size:11px; color:#1e3a5f; margin-bottom:6px; font-weight:600; }
.footer { margin-top:16px; padding-top:10px; border-top:1px solid #e5e7eb; text-align:center; font-size:9px; color:#666; }
${overrides}
</style>
</head>
<body>
<div class="document-wrapper">
  <div class="header">
    <div>
      ${s.showLogo ? `<div style="font-size:18px;font-weight:900;color:#1e3a5f;letter-spacing:-1px;">S</div>` : ''}
      <div class="company-name">Sceneside L.L.C</div>
      <div class="company-details">
        121 Bedford Street, Waltham, MA 02453<br>
        Phone: 857-384-2899 • Email: sales@sceneside.com
        ${s.headerText ? `<br><em>${s.headerText}</em>` : ''}
      </div>
    </div>
    <div style="text-align:right">
      <div class="document-type-label">INVOICE</div>
      <div class="doc-number">INV-2026-00001</div>
    </div>
  </div>

  <div class="info-row">
    <div class="info-block">
      <h4>Bill To</h4>
      <div><strong>Uganda Embassy</strong></div>
      <div>benon.kayemba@mofa.go.ug</div>
    </div>
    <div class="info-block" style="text-align:right">
      <h4>Details</h4>
      <div>Date: Feb 25, 2026</div>
      <div>Due: Mar 27, 2026</div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Audio Visual &amp; LCD / Projector</td>
        <td>2</td>
        <td>$400.00</td>
        <td>$800.00</td>
      </tr>
      <tr>
        <td>Conference Room Setup</td>
        <td>1</td>
        <td>$600.00</td>
        <td>$600.00</td>
      </tr>
    </tbody>
  </table>

  <div class="totals-section">
    <div class="totals-table">
      <div class="totals-row"><span>Subtotal</span><span>$1,400.00</span></div>
      <div class="totals-row"><span>Tax (6.25%)</span><span>$87.50</span></div>
      <div class="totals-row grand-total"><span>Total Due</span><span>$1,487.50</span></div>
    </div>
  </div>

  ${s.showBankDetails ? `
  <div class="payment-info">
    <h3>Payment Information</h3>
    Bank of America &nbsp;•&nbsp; Account: 466021944682
    ${s.showTaxId ? ' &nbsp;•&nbsp; EIN: 99-3334108' : ''}
  </div>
  ` : ''}

  ${s.showSignatureLine ? `
  <div style="display:flex;justify-content:flex-end;margin:16px 0 8px;">
    <div style="width:180px;border-top:1px solid #333;padding-top:5px;text-align:center;font-size:9px;color:#666;">
      Authorized Signature
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>${s.footerText || 'Thank you for your business!'}</p>
    <p style="margin-top:4px;">Sceneside L.L.C • 121 Bedford Street, Waltham, MA 02453</p>
  </div>
</div>
</body>
</html>`;
}

export default function PdfSettingsPage() {
  const [settings, setSettings] = useState<PdfSettings>({ ...DEFAULT_PDF_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    fetch('/api/settings/pdf')
      .then((r) => r.json())
      .then((data) => {
        const merged = mergePdfSettings(data);
        setSettings(merged);
        setPreviewHtml(generatePreviewHTML(merged));
      })
      .catch(() => setPreviewHtml(generatePreviewHTML(settings)))
      .finally(() => setLoading(false));
  }, []);

  const update = useCallback(<K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      setPreviewHtml(generatePreviewHTML(next));
      return next;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/pdf', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save');
      clearPdfSettingsCache();
      toast.success('PDF settings saved! All future exports will use these settings.');
    } catch {
      toast.error('Failed to save PDF settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/settings" className="btn-ghost p-2">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PDF Template Settings</h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              Customize how all exported PDFs look — invoices, bills, quotations, receipts
            </p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <CheckIcon className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ── LEFT: Controls ── */}
        <div className="space-y-6">

          {/* Template */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Layout Template</h2>
              <p className="text-sm text-gray-500 mt-0.5">Choose the overall layout style</p>
            </div>
            <div className="card-body grid grid-cols-3 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update('template', t.id)}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    settings.template === t.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Mini template visual */}
                  <div className="w-full aspect-[3/4] bg-white rounded border border-gray-100 mb-2 overflow-hidden p-1.5 flex flex-col gap-1">
                    {t.id === 'classic' && (
                      <>
                        <div className="h-2 rounded" style={{ background: settings.primaryColor }} />
                        <div className="h-1.5 bg-gray-100 rounded w-3/4" />
                        <div className="flex-1 mt-1 border border-gray-100 rounded overflow-hidden">
                          <div className="h-2" style={{ background: settings.primaryColor }} />
                          <div className="h-1.5 bg-gray-50" />
                          <div className="h-1.5" />
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded w-1/2 self-end" />
                      </>
                    )}
                    {t.id === 'modern' && (
                      <div className="flex h-full gap-1.5">
                        <div className="w-1 rounded" style={{ background: settings.primaryColor }} />
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="h-2 bg-gray-100 rounded w-3/4" />
                          <div className="h-1.5 bg-gray-50 rounded" />
                          <div className="flex-1 border-t border-gray-100 mt-1 pt-1 flex flex-col gap-0.5">
                            <div className="h-1.5 bg-gray-100 rounded" style={{ borderBottom: `1px solid ${settings.primaryColor}` }} />
                            <div className="h-1.5 bg-gray-50 rounded" />
                            <div className="h-1.5 rounded" />
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded w-1/2 self-end" />
                        </div>
                      </div>
                    )}
                    {t.id === 'minimal' && (
                      <>
                        <div className="h-2 bg-white border-b border-gray-300 w-full" />
                        <div className="h-1.5 bg-gray-50 rounded w-2/3" />
                        <div className="flex-1 mt-1 flex flex-col gap-0.5">
                          <div className="h-1.5 border-b border-gray-200" />
                          <div className="h-1.5 border-b border-gray-100" />
                          <div className="h-1.5 border-b border-gray-100" />
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded w-1/2 self-end" />
                      </>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{t.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Brand Colors</h2>
            </div>
            <div className="card-body grid grid-cols-2 gap-6">
              <div>
                <label className="label">Primary Color</label>
                <p className="text-xs text-gray-500 mb-2">Headers, titles, table bar</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => update('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && update('primaryColor', e.target.value)}
                    className="input flex-1 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
              <div>
                <label className="label">Accent Color</label>
                <p className="text-xs text-gray-500 mb-2">Used in Modern template highlights</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => update('accentColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={settings.accentColor}
                    onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && update('accentColor', e.target.value)}
                    className="input flex-1 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Font */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Typography</h2>
            </div>
            <div className="card-body">
              <label className="label">Font Family</label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => update('fontFamily', f.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      settings.fontFamily === f.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p
                      className="text-xl font-medium mb-1"
                      style={{
                        fontFamily:
                          f.id === 'sans-serif'
                            ? 'sans-serif'
                            : f.id === 'serif'
                            ? 'Georgia, serif'
                            : "'Courier New', monospace",
                      }}
                    >
                      Aa
                    </p>
                    <p className="text-xs text-gray-500 leading-tight">{f.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Sections to Include</h2>
              <p className="text-sm text-gray-500 mt-0.5">Toggle which parts appear on exported PDFs</p>
            </div>
            <div className="card-body space-y-5">
              <ToggleSwitch
                checked={settings.showLogo}
                onChange={(v) => update('showLogo', v)}
                label="Company Logo"
                description="Show the Sceneside logo at the top of the document"
              />
              <ToggleSwitch
                checked={settings.showBankDetails}
                onChange={(v) => update('showBankDetails', v)}
                label="Bank Details"
                description="Include Bank of America account info for payments"
              />
              <ToggleSwitch
                checked={settings.showTaxId}
                onChange={(v) => update('showTaxId', v)}
                label="Tax ID / EIN"
                description="Show EIN number in the bank details section"
              />
              <ToggleSwitch
                checked={settings.showPaymentTerms}
                onChange={(v) => update('showPaymentTerms', v)}
                label="Payment Terms"
                description="Show the payment terms (Net 30, etc.) on the document"
              />
              <ToggleSwitch
                checked={settings.showSignatureLine}
                onChange={(v) => update('showSignatureLine', v)}
                label="Signature Line"
                description="Add an 'Authorized Signature' line at the bottom"
              />
            </div>
          </div>

          {/* Custom text */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Custom Text</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="form-group">
                <label className="label">Footer Message</label>
                <input
                  type="text"
                  value={settings.footerText}
                  onChange={(e) => update('footerText', e.target.value)}
                  className="input"
                  placeholder="Thank you for your business!"
                  maxLength={120}
                />
                <p className="text-xs text-gray-400 mt-1">Appears at the bottom of every PDF</p>
              </div>
              <div className="form-group">
                <label className="label">Header Tagline <span className="text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={settings.headerText}
                  onChange={(e) => update('headerText', e.target.value)}
                  className="input"
                  placeholder="e.g. Licensed Tour Operator · Est. 2015"
                  maxLength={80}
                />
                <p className="text-xs text-gray-400 mt-1">Shown under the company name in the header</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Live Preview ── */}
        <div className="sticky top-6">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Live Preview</h2>
                <p className="text-xs text-gray-500 mt-0.5">Updates as you change settings</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                Live
              </span>
            </div>
            <div className="card-body p-0 overflow-hidden rounded-b-xl">
              <iframe
                srcDoc={previewHtml}
                className="w-full border-0"
                style={{ height: '640px' }}
                title="PDF Preview"
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Note:</strong> These settings apply at export time only. Saved invoice data is never modified.
            Re-exporting an old invoice will use the current template.
          </div>
        </div>
      </div>
    </div>
  );
}
