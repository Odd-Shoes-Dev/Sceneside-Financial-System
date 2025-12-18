'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CubeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency as currencyFormatter } from '@/lib/currency';

interface Product {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  product_type: 'inventory' | 'non_inventory' | 'service';
  inventory_category?: 'physical_stock' | 'tour_product' | 'permit';
  unit_price: number;
  cost_price: number;
  currency: string;
  track_inventory: boolean;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_point: number | null;
  reorder_quantity: number | null;
  unit_of_measure: string;
  revenue_account_id: string | null;
  cogs_account_id: string | null;
  inventory_account_id: string | null;
  is_taxable: boolean;
  tax_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Tour product fields
  tour_duration_hours?: number;
  min_participants?: number;
  max_participants?: number;
  difficulty_level?: string;
  age_restriction?: string;
  equipment_list?: string[];
  required_permits?: string[];
  // Permit fields
  permit_number?: string;
  permit_type?: string;
  issuing_authority?: string;
  permit_issue_date?: string;
  permit_expiry_date?: string;
  annual_quota?: number;
  quota_used?: number;
  revenue_account?: {
    name: string;
    code: string;
  };
  cogs_account?: {
    name: string;
    code: string;
  };
  inventory_account?: {
    name: string;
    code: string;
  };
}

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadItemDetails();
    }
  }, [params.id]);

  const loadItemDetails = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          revenue_account:revenue_account_id (
            name,
            code
          ),
          cogs_account:cogs_account_id (
            name,
            code
          ),
          inventory_account:inventory_account_id (
            name,
            code
          )
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setItem(data);
    } catch (error) {
      console.error('Failed to load item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', params.id);

      if (error) throw error;

      router.push('/dashboard/inventory');
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return currencyFormatter(amount, currency as any);
  };

  const getStockStatus = () => {
    if (!item) return { label: '', class: '', icon: CubeIcon };
    
    if ((item.quantity_on_hand || 0) === 0) {
      return { label: 'Out of Stock', class: 'badge-error', icon: ExclamationTriangleIcon };
    }
    if ((item.quantity_on_hand || 0) <= (item.reorder_point || 0)) {
      return { label: 'Low Stock', class: 'badge-warning', icon: ArrowTrendingDownIcon };
    }
    return { label: 'In Stock', class: 'badge-success', icon: ArrowTrendingUpIcon };
  };

  const calculateGrossMargin = () => {
    if (!item || item.cost_price === 0) return '0.0';
    const margin = ((item.unit_price - item.cost_price) / item.unit_price) * 100;
    return margin.toFixed(1);
  };

  const calculateTotalValue = () => {
    if (!item) return 0;
    return (item.quantity_on_hand || 0) * (item.cost_price || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Item not found</p>
        <Link href="/dashboard/inventory" className="btn-secondary mt-4">
          Back to Inventory
        </Link>
      </div>
    );
  }

  const status = getStockStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory" className="btn-ghost p-2">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-gray-500 mt-1">SKU: {item.sku || 'N/A'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/inventory/${item.id}/edit`}
            className="btn-secondary"
          >
            <PencilIcon className="w-5 h-5 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="btn-ghost text-red-600 hover:bg-red-50"
          >
            <TrashIcon className="w-5 h-5 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className={`badge ${status.class} flex items-center gap-2`}>
          <StatusIcon className="w-4 h-4" />
          {status.label}
        </span>
        {!item.is_active && (
          <span className="badge badge-gray">Inactive</span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {item.inventory_category === 'tour_product' ? (
          <>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {item.tour_duration_hours || 0}h
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">Min Participants</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {item.min_participants || 1}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">Max Capacity</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {item.max_participants || 10}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">Price per Person</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(item.unit_price, item.currency)}
                </p>
              </div>
            </div>
          </>
        ) : item.inventory_category === 'permit' ? (
          <>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">Permit Number</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {item.permit_number || 'N/A'}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">Quota Used</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {item.quota_used || 0}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">Quota Available</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {(item.annual_quota || 0) - (item.quota_used || 0)}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {item.permit_expiry_date ? new Date(item.permit_expiry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">On Hand</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {item.quantity_on_hand} {item.unit_of_measure}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">Reserved</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {item.quantity_reserved} {item.unit_of_measure}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">Available</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {item.quantity_available} {item.unit_of_measure}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(calculateTotalValue(), item.currency)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Information */}
        <div className="card">
          <div className="card-body">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CubeIcon className="w-5 h-5" />
              Product Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Product Name</p>
                <p className="font-medium text-gray-900">{item.name}</p>
              </div>
              {item.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-900">{item.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">SKU</p>
                <p className="font-mono text-gray-900">{item.sku || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit of Measure</p>
                <p className="text-gray-900 capitalize">{item.unit_of_measure}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Product Type</p>
                <p className="text-gray-900 capitalize">{item.product_type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tax Status</p>
                <p className="text-gray-900">
                  {item.is_taxable ? `Taxable (${item.tax_rate || 0}%)` : 'Non-taxable'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="card">
          <div className="card-body">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5" />
              Pricing & Margin
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Currency</p>
                <p className="font-medium text-gray-900">{item.currency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit Cost</p>
                <p className="font-medium text-gray-900">{formatCurrency(item.cost_price, item.currency)}</p>
                <p className="text-xs text-gray-500 mt-1">Your purchase cost</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Selling Price</p>
                <p className="font-medium text-gray-900">{formatCurrency(item.unit_price, item.currency)}</p>
                <p className="text-xs text-gray-500 mt-1">Customer price</p>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-500">Gross Margin</p>
                <p className="text-2xl font-bold text-green-600">{calculateGrossMargin()}%</p>
                <p className="text-xs text-gray-500 mt-1">Profit margin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Levels */}
      {/* Stock Management / Tour Details / Permit Details */}
      {item.inventory_category === 'tour_product' ? (
        <div className="card">
          <div className="card-body">
            <h2 className="font-semibold text-gray-900 mb-4">Tour Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {item.tour_duration_hours || 0} hours
                </p>
                <p className="text-xs text-gray-500 mt-1">Tour length</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Min Participants</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {item.min_participants || 1}
                </p>
                <p className="text-xs text-gray-500 mt-1">Minimum required</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Max Capacity</p>
                <p className="text-xl font-semibold text-[#52b53b] mt-1">
                  {item.max_participants || 10} people
                </p>
                <p className="text-xs text-gray-500 mt-1">Maximum per tour</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Difficulty</p>
                <p className="text-xl font-semibold text-gray-900 mt-1 capitalize">
                  {item.difficulty_level || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Difficulty level</p>
              </div>
            </div>
            {(item.age_restriction || item.equipment_list?.length || item.required_permits?.length) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                {item.age_restriction && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Age Restriction:</span> {item.age_restriction}
                  </p>
                )}
                {item.equipment_list && item.equipment_list.length > 0 && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Equipment:</span> {item.equipment_list.join(', ')}
                  </p>
                )}
                {item.required_permits && item.required_permits.length > 0 && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Required Permits:</span> {item.required_permits.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : item.inventory_category === 'permit' ? (
        <div className="card">
          <div className="card-body">
            <h2 className="font-semibold text-gray-900 mb-4">Permit Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Permit Number</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {item.permit_number || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Official number</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Issuing Authority</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {item.issuing_authority || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Issued by</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p className="text-xl font-semibold text-amber-600 mt-1">
                  {item.permit_expiry_date ? new Date(item.permit_expiry_date).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Valid until</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quota Usage</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {item.quota_used || 0} / {item.annual_quota || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Used / Total</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <h2 className="font-semibold text-gray-900 mb-4">Stock Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Quantity on Hand</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {item.quantity_on_hand} {item.unit_of_measure}
                </p>
                <p className="text-xs text-gray-500 mt-1">Current stock count</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reserved</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {item.quantity_reserved} {item.unit_of_measure}
                </p>
                <p className="text-xs text-gray-500 mt-1">Allocated to orders</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reorder Point</p>
                <p className="text-xl font-semibold text-amber-600 mt-1">
                  {item.reorder_point || 0} {item.unit_of_measure}
                </p>
                <p className="text-xs text-gray-500 mt-1">Alert when stock falls below</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reorder Quantity</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {item.reorder_quantity || 0} {item.unit_of_measure}
                </p>
                <p className="text-xs text-gray-500 mt-1">Suggested order amount</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accounting Configuration */}
      {(item.revenue_account || item.cogs_account || item.inventory_account) && (
        <div className="card">
          <div className="card-body">
            <h2 className="font-semibold text-gray-900 mb-4">Accounting Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {item.revenue_account && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Revenue Account</p>
                  <p className="font-medium text-gray-900">{item.revenue_account.code} - {item.revenue_account.name}</p>
                </div>
              )}
              {item.cogs_account && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">COGS Account</p>
                  <p className="font-medium text-gray-900">{item.cogs_account.code} - {item.cogs_account.name}</p>
                </div>
              )}
              {item.inventory_account && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Inventory Account</p>
                  <p className="font-medium text-gray-900">{item.inventory_account.code} - {item.inventory_account.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-gray-900">{new Date(item.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-gray-900">{new Date(item.updated_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Track Inventory</p>
              <p className="text-gray-900">{item.track_inventory ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-gray-900">{item.is_active ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
