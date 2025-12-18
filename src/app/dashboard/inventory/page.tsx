'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency as currencyFormatter } from '@/lib/currency';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MapPinIcon,
  TicketIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { Product } from '@/types/database';

type InventoryTab = 'all' | 'physical_stock' | 'tour_product' | 'permit' | 'equipment';
type StockFilter = 'all' | 'low' | 'out';

interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStock: number;
  outOfStock: number;
  byCategory: {
    physical_stock: number;
    tour_product: number;
    permit: number;
  };
  byStockType: {
    consumable: number;
    reusable: number;
    merchandise: number;
    spare_part: number;
  };
  permits: {
    total: number;
    active: number;
    expired: number;
    pending_renewal: number;
    expiring_soon: number;
  };
  equipment: {
    total: number;
    good_condition: number;
    fair_condition: number;
    poor_condition: number;
    maintenance_due: number;
  };
}

export default function InventoryPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [activeTab, setActiveTab] = useState<InventoryTab>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0,
    byCategory: { physical_stock: 0, tour_product: 0, permit: 0 },
    byStockType: { consumable: 0, reusable: 0, merchandise: 0, spare_part: 0 },
    permits: { total: 0, active: 0, expired: 0, pending_renewal: 0, expiring_soon: 0 },
    equipment: { total: 0, good_condition: 0, fair_condition: 0, poor_condition: 0, maintenance_due: 0 },
  });
  const pageSize = 20;

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (stockFilter === 'low') params.append('low_stock', 'true');
      
      // Map tab to inventory_category or stock_type
      if (activeTab === 'physical_stock') {
        params.append('inventory_category', 'physical_stock');
      } else if (activeTab === 'tour_product') {
        params.append('inventory_category', 'tour_product');
      } else if (activeTab === 'permit') {
        params.append('inventory_category', 'permit');
      } else if (activeTab === 'equipment') {
        params.append('stock_type', 'reusable');
      }

      const response = await fetch(`/api/inventory?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load inventory');
      
      const data = await response.json();
      
      // Additional filter for out of stock
      let filteredData = data.data || [];
      if (stockFilter === 'out') {
        filteredData = filteredData.filter((item: any) => (item.quantity_on_hand || 0) === 0);
      }
      
      setItems(filteredData);
      setTotalCount(stockFilter === 'out' ? filteredData.length : data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, stockFilter, activeTab, currentPage]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/inventory/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return currencyFormatter(amount, currency as any);
  };

  const getStockStatus = (item: Product) => {
    if ((item.quantity_on_hand || 0) === 0) {
      return { label: 'Out of Stock', class: 'badge-error', icon: ExclamationTriangleIcon };
    }
    if ((item.quantity_on_hand || 0) <= (item.reorder_point || 0)) {
      return { label: 'Low Stock', class: 'badge-warning', icon: ArrowTrendingDownIcon };
    }
    return { label: 'In Stock', class: 'badge-success', icon: ArrowTrendingUpIcon };
  };

  const getPermitStatus = (item: Product) => {
    const status = (item as any).permit_status;
    switch (status) {
      case 'active':
        return { label: 'Active', class: 'badge-success' };
      case 'expired':
        return { label: 'Expired', class: 'badge-error' };
      case 'pending_renewal':
        return { label: 'Pending Renewal', class: 'badge-warning' };
      case 'suspended':
        return { label: 'Suspended', class: 'badge-error' };
      default:
        return { label: 'Pending', class: 'badge-secondary' };
    }
  };

  const getConditionStatus = (item: Product) => {
    const condition = (item as any).item_condition;
    switch (condition) {
      case 'new':
        return { label: 'New', class: 'badge-info' };
      case 'good':
        return { label: 'Good', class: 'badge-success' };
      case 'fair':
        return { label: 'Fair', class: 'badge-warning' };
      case 'poor':
        return { label: 'Poor', class: 'badge-error' };
      case 'damaged':
        return { label: 'Damaged', class: 'badge-error' };
      default:
        return { label: condition || 'Unknown', class: 'badge-secondary' };
    }
  };

  const tabs = [
    { id: 'all' as InventoryTab, label: 'All Items', icon: CubeIcon, count: stats.totalItems },
    { id: 'physical_stock' as InventoryTab, label: 'Physical Stock', icon: CubeIcon, count: stats.byCategory.physical_stock },
    { id: 'tour_product' as InventoryTab, label: 'Tour Products', icon: TicketIcon, count: stats.byCategory.tour_product },
    { id: 'permit' as InventoryTab, label: 'Permits & Licenses', icon: DocumentTextIcon, count: stats.permits.total },
    { id: 'equipment' as InventoryTab, label: 'Equipment', icon: WrenchScrewdriverIcon, count: stats.equipment.total },
  ];

  const totalPages = Math.ceil(totalCount / pageSize);

  // Render different cards based on active tab
  const renderSummaryCards = () => {
    if (activeTab === 'permit') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-500">Total Permits</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.permits.total}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.permits.active}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.permits.expiring_soon}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-500">Pending Renewal</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.permits.pending_renewal}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-500">Expired</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.permits.expired}</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'equipment') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-500">Total Equipment</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.equipment.total}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-500">Good Condition</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.equipment.good_condition}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-500">Fair Condition</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.equipment.fair_condition}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-500">Poor/Damaged</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.equipment.poor_condition}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-500">Maintenance Due</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.equipment.maintenance_due}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Total Items</p>
            <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalValue)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Low Stock</p>
            <p className="text-base sm:text-lg lg:text-2xl font-bold text-amber-600 mt-1">{stats.lowStock}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="text-base sm:text-lg lg:text-2xl font-bold text-red-600 mt-1">{stats.outOfStock}</p>
          </div>
        </div>
      </div>
    );
  };

  // Render table based on active tab
  const renderTableContent = () => {
    if (activeTab === 'permit') {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>Permit Name</th>
              <th>Permit Number</th>
              <th>Issuing Authority</th>
              <th>Issue Date</th>
              <th>Expiry Date</th>
              <th>Quota</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const status = getPermitStatus(item);
              const permit = item as any;
              return (
                <tr key={item.id}>
                  <td>
                    <Link href={`/dashboard/inventory/${item.id}`} className="font-medium text-gray-900 hover:text-navy-600">
                      {item.name}
                    </Link>
                    {item.description && <p className="text-sm text-gray-500 truncate max-w-xs">{item.description}</p>}
                  </td>
                  <td className="font-mono text-sm">{permit.permit_number || '-'}</td>
                  <td>{permit.issuing_authority || '-'}</td>
                  <td>{permit.permit_issue_date ? new Date(permit.permit_issue_date).toLocaleDateString() : '-'}</td>
                  <td>{permit.permit_expiry_date ? new Date(permit.permit_expiry_date).toLocaleDateString() : '-'}</td>
                  <td>{permit.annual_quota ? `${permit.quota_used || 0}/${permit.annual_quota}` : '-'}</td>
                  <td><span className={`badge ${status.class}`}>{status.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'equipment') {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>Equipment</th>
              <th>SKU</th>
              <th className="text-right">Quantity</th>
              <th>Condition</th>
              <th>Last Maintenance</th>
              <th>Next Maintenance</th>
              <th className="text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const condition = getConditionStatus(item);
              const equipment = item as any;
              return (
                <tr key={item.id}>
                  <td>
                    <Link href={`/dashboard/inventory/${item.id}`} className="font-medium text-gray-900 hover:text-navy-600">
                      {item.name}
                    </Link>
                    {item.description && <p className="text-sm text-gray-500 truncate max-w-xs">{item.description}</p>}
                  </td>
                  <td className="font-mono text-sm">{item.sku || '-'}</td>
                  <td className="text-right font-medium">{item.quantity_on_hand} {item.unit_of_measure}</td>
                  <td><span className={`badge ${condition.class}`}>{condition.label}</span></td>
                  <td>{equipment.last_maintenance_date ? new Date(equipment.last_maintenance_date).toLocaleDateString() : 'Never'}</td>
                  <td>
                    {equipment.next_maintenance_date ? (
                      <span className={new Date(equipment.next_maintenance_date) <= new Date() ? 'text-red-600 font-medium' : ''}>
                        {new Date(equipment.next_maintenance_date).toLocaleDateString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="text-right font-medium">
                    {formatCurrency((item.quantity_on_hand || 0) * (item.cost_price || 0), item.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'tour_product') {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>Tour</th>
              <th>SKU</th>
              <th className="text-right">Duration</th>
              <th className="text-right">Participants</th>
              <th>Equipment</th>
              <th>Difficulty</th>
              <th className="text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const tour = item as any;
              return (
                <tr key={item.id}>
                  <td>
                    <Link href={`/dashboard/inventory/${item.id}`} className="font-medium text-gray-900 hover:text-navy-600">
                      {item.name}
                    </Link>
                    {item.description && <p className="text-sm text-gray-500 truncate max-w-xs">{item.description}</p>}
                  </td>
                  <td className="font-mono text-sm">{item.sku || '-'}</td>
                  <td className="text-right">{tour.tour_duration_hours ? `${tour.tour_duration_hours}h` : '-'}</td>
                  <td className="text-right">{tour.min_participants || 1}-{tour.max_participants || '∞'}</td>
                  <td>{tour.includes_equipment ? <CheckCircleIcon className="w-5 h-5 text-green-600" /> : <XCircleIcon className="w-5 h-5 text-gray-300" />}</td>
                  <td>{tour.difficulty_level || '-'}</td>
                  <td className="text-right font-medium">{formatCurrency(item.unit_price || 0, item.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    // Default physical stock view
    return (
      <table className="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>SKU</th>
            <th className="text-right">On Hand</th>
            <th className="text-right">Reserved</th>
            <th className="text-right">Available</th>
            <th className="text-right">Unit Cost</th>
            <th className="text-right">Total Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const status = getStockStatus(item);
            const available = (item.quantity_on_hand || 0) - (item.quantity_reserved || 0);
            return (
              <tr key={item.id}>
                <td>
                  <Link href={`/dashboard/inventory/${item.id}`} className="font-medium text-gray-900 hover:text-navy-600">
                    {item.name}
                  </Link>
                  {item.description && <p className="text-sm text-gray-500 truncate max-w-xs">{item.description}</p>}
                </td>
                <td><span className="font-mono text-sm">{item.sku || '-'}</span></td>
                <td className="text-right font-medium">{item.quantity_on_hand} {item.unit_of_measure}</td>
                <td className="text-right text-gray-500">{item.quantity_reserved}</td>
                <td className="text-right font-medium">{available} {item.unit_of_measure}</td>
                <td className="text-right">{formatCurrency(item.cost_price, item.currency)}</td>
                <td className="text-right font-medium">{formatCurrency((item.quantity_on_hand || 0) * (item.cost_price || 0), item.currency)}</td>
                <td><span className={`badge ${status.class}`}>{status.label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 mt-1">Manage stock, tours, permits, and equipment</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/inventory/movements" className="btn-secondary">
            <ArrowsRightLeftIcon className="w-5 h-5 mr-2" />
            Movements
          </Link>
          <Link href="/dashboard/inventory/new" className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Item
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`
                  whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${isActive
                    ? 'border-navy-600 text-navy-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                <span className={`
                  ml-1 py-0.5 px-2 rounded-full text-xs
                  ${isActive ? 'bg-navy-100 text-navy-600' : 'bg-gray-100 text-gray-600'}
                `}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, SKU, or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="input pl-10"
              />
            </div>
            {(activeTab === 'all' || activeTab === 'physical_stock') && (
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={stockFilter}
                  onChange={(e) => {
                    setStockFilter(e.target.value as StockFilter);
                    setCurrentPage(1);
                  }}
                  className="input w-auto"
                >
                  <option value="all">All Items</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <CubeIcon className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-gray-500 mt-2">No inventory items found.</p>
            <Link href="/dashboard/inventory/new" className="btn-primary mt-4 inline-flex">
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Your First Item
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden">
            {renderTableContent()}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden grid gap-4">
            {items.map((item) => {
              const status = getStockStatus(item);
              const available = (item.quantity_on_hand || 0) - (item.quantity_reserved || 0);
              return (
                <div key={item.id} className="card">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          href={`/dashboard/inventory/${item.id}`}
                          className="font-semibold text-gray-900 hover:text-navy-600"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-500 font-mono">{item.sku || '-'}</p>
                      </div>
                      <span className={`badge ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">On Hand</p>
                        <p className="font-semibold">{item.quantity_on_hand}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Reserved</p>
                        <p className="font-semibold">{item.quantity_reserved}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Available</p>
                        <p className="font-semibold">{available}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                      <div>
                        <span className="text-gray-500">Value:</span>
                        <span className="ml-1.5 font-medium">
                          {formatCurrency((item.quantity_on_hand || 0) * (item.cost_price || 0))}
                        </span>
                      </div>
                      <Link
                        href={`/dashboard/inventory/${item.id}`}
                        className="text-navy-600 font-medium"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} items
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
