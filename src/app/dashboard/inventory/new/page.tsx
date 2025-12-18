'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency as currencyFormatter, type SupportedCurrency } from '@/lib/currency';
import { CurrencySelect } from '@/components/ui/currency-select';
import {
  ArrowLeftIcon,
  CubeIcon,
  TicketIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

type InventoryCategory = 'physical_stock' | 'tour_product' | 'permit';
type StockType = 'consumable' | 'reusable' | 'merchandise' | 'spare_part';

export default function NewInventoryItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get('type') as InventoryCategory) || 'physical_stock';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryCategory, setInventoryCategory] = useState<InventoryCategory>(initialCategory);

  const [formData, setFormData] = useState({
    // Basic fields
    sku: '',
    name: '',
    description: '',
    category: '',
    unit_of_measure: 'each',
    unit_cost: 0,
    selling_price: 0,
    currency: 'USD',
    quantity_on_hand: 0,
    reorder_point: 10,
    reorder_quantity: 50,
    is_taxable: true,
    is_active: true,
    notes: '',
    
    // Stock type
    stock_type: 'consumable' as StockType,
    item_condition: 'new',
    
    // Equipment/Reusable fields
    maintenance_interval_days: 0,
    
    // Tour product fields
    tour_duration_hours: 0,
    min_participants: 1,
    max_participants: 10,
    includes_equipment: false,
    equipment_list: '',
    difficulty_level: '',
    age_restriction: '',
    
    // Permit fields
    permit_number: '',
    permit_type: '',
    issuing_authority: '',
    permit_issue_date: '',
    permit_expiry_date: '',
    permit_cost: 0,
    annual_quota: 0,
    renewal_reminder_days: 30,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : type === 'number' 
          ? Number(value) 
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // If category is provided, find or create the category ID
      let category_id = null;
      if (formData.category) {
        const categoryResponse = await fetch(`/api/inventory/categories?name=${encodeURIComponent(formData.category)}`);
        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json();
          category_id = categoryData.id;
        }
      }

      // Build payload based on inventory category
      const payload: any = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || null,
        category_id,
        inventory_category: inventoryCategory,
        unit_of_measure: formData.unit_of_measure,
        cost_price: formData.unit_cost,
        unit_price: formData.selling_price,
        currency: formData.currency,
        is_taxable: formData.is_taxable,
        is_active: formData.is_active,
      };

      if (inventoryCategory === 'physical_stock') {
        payload.stock_type = formData.stock_type;
        payload.item_condition = formData.item_condition;
        payload.quantity_on_hand = formData.quantity_on_hand;
        payload.reorder_point = formData.reorder_point;
        payload.reorder_quantity = formData.reorder_quantity;
        payload.track_inventory = true;

        // Equipment/Reusable specific fields
        if (formData.stock_type === 'reusable') {
          payload.maintenance_interval_days = formData.maintenance_interval_days || null;
        }
      } else if (inventoryCategory === 'tour_product') {
        payload.tour_duration_hours = formData.tour_duration_hours || null;
        payload.min_participants = formData.min_participants || 1;
        payload.max_participants = formData.max_participants || 10;
        payload.includes_equipment = formData.includes_equipment;
        payload.equipment_list = formData.equipment_list ? formData.equipment_list.split(',').map(s => s.trim()) : [];
        payload.difficulty_level = formData.difficulty_level || null;
        payload.age_restriction = formData.age_restriction || null;
        payload.track_inventory = false;
      } else if (inventoryCategory === 'permit') {
        payload.permit_number = formData.permit_number;
        payload.permit_type = formData.permit_type || null;
        payload.issuing_authority = formData.issuing_authority || null;
        payload.permit_issue_date = formData.permit_issue_date || null;
        payload.permit_expiry_date = formData.permit_expiry_date || null;
        payload.permit_cost = formData.permit_cost || 0;
        payload.annual_quota = formData.annual_quota || null;
        payload.renewal_reminder_days = formData.renewal_reminder_days || 30;
        payload.track_inventory = false;
      }
      
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create inventory item');
      }

      router.push('/dashboard/inventory');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'Tour Equipment',
    'Safety Gear',
    'Vehicle Parts',
    'Office Supplies',
    'Merchandise',
    'Consumables',
    'Spare Parts',
    'Other',
  ];

  const unitsOfMeasure = [
    { value: 'each', label: 'Each' },
    { value: 'pair', label: 'Pair' },
    { value: 'set', label: 'Set' },
    { value: 'box', label: 'Box' },
    { value: 'case', label: 'Case' },
    { value: 'pack', label: 'Pack' },
    { value: 'lb', label: 'Pound (lb)' },
    { value: 'oz', label: 'Ounce (oz)' },
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'gal', label: 'Gallon' },
    { value: 'l', label: 'Liter' },
    { value: 'hour', label: 'Hour' },
    { value: 'person', label: 'Per Person' },
  ];

  const grossMargin = formData.selling_price > 0 
    ? ((formData.selling_price - formData.unit_cost) / formData.selling_price * 100).toFixed(1)
    : '0.0';

  const categoryOptions = [
    { id: 'physical_stock', label: 'Physical Stock', icon: CubeIcon, description: 'Consumables, equipment, merchandise' },
    { id: 'tour_product', label: 'Tour Product', icon: TicketIcon, description: 'Capacity-based tour offerings' },
    { id: 'permit', label: 'Permit/License', icon: DocumentTextIcon, description: 'Permits and licenses' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/inventory"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Inventory Item</h1>
          <p className="text-gray-600">Add a new product to your inventory</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Inventory Category Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Item Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoryOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = inventoryCategory === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setInventoryCategory(option.id as InventoryCategory)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${isSelected
                      ? 'border-[#52b53b] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-[#52b53b]' : 'text-gray-400'}`} />
                  <p className={`font-medium ${isSelected ? 'text-[#52b53b]' : 'text-gray-900'}`}>{option.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CubeIcon className="w-5 h-5 text-[#52b53b]" />
            <h2 className="font-semibold text-gray-900">
              {inventoryCategory === 'physical_stock' && 'Product Information'}
              {inventoryCategory === 'tour_product' && 'Tour Information'}
              {inventoryCategory === 'permit' && 'Permit Information'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                placeholder={inventoryCategory === 'permit' ? 'PRM-001' : inventoryCategory === 'tour_product' ? 'TOUR-001' : 'PROD-001'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {inventoryCategory === 'tour_product' ? 'Tour Name' : inventoryCategory === 'permit' ? 'Permit Name' : 'Product Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                placeholder={inventoryCategory === 'tour_product' ? 'Desert Safari Adventure' : inventoryCategory === 'permit' ? 'National Park Access Permit' : 'Enter product name'}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                placeholder={inventoryCategory === 'tour_product' ? 'Tour description...' : inventoryCategory === 'permit' ? 'Permit details...' : 'Product description...'}
              />
            </div>

            {inventoryCategory === 'physical_stock' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Type
                  </label>
                  <select
                    name="stock_type"
                    value={formData.stock_type}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  >
                    <option value="consumable">Consumable (single use)</option>
                    <option value="reusable">Reusable Equipment</option>
                    <option value="merchandise">Merchandise (for sale)</option>
                    <option value="spare_part">Spare Part</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    name="item_condition"
                    value={formData.item_condition}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit of Measure
              </label>
              <select
                name="unit_of_measure"
                value={formData.unit_of_measure}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              >
                {unitsOfMeasure.map((unit) => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_taxable"
                  checked={formData.is_taxable}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-[#52b53b] focus:ring-[#52b53b]"
                />
                <span className="text-sm text-gray-700">Taxable</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-[#52b53b] focus:ring-[#52b53b]"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tour Product Specific Fields */}
        {inventoryCategory === 'tour_product' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TicketIcon className="w-5 h-5 text-[#52b53b]" />
              <h2 className="font-semibold text-gray-900">Tour Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  name="tour_duration_hours"
                  value={formData.tour_duration_hours}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Participants
                </label>
                <input
                  type="number"
                  name="min_participants"
                  value={formData.min_participants}
                  onChange={handleChange}
                  min="1"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Participants
                </label>
                <input
                  type="number"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  min="1"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                >
                  <option value="">Select...</option>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="challenging">Challenging</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age Restriction
                </label>
                <input
                  type="text"
                  name="age_restriction"
                  value={formData.age_restriction}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="18+ or All ages"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="includes_equipment"
                    checked={formData.includes_equipment}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-[#52b53b] focus:ring-[#52b53b]"
                  />
                  <span className="text-sm text-gray-700">Includes Equipment</span>
                </label>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment List (comma-separated)
                </label>
                <input
                  type="text"
                  name="equipment_list"
                  value={formData.equipment_list}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="Helmet, Life jacket, Paddle"
                />
              </div>
            </div>
          </div>
        )}

        {/* Permit Specific Fields */}
        {inventoryCategory === 'permit' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <DocumentTextIcon className="w-5 h-5 text-[#52b53b]" />
              <h2 className="font-semibold text-gray-900">Permit Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permit Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="permit_number"
                  value={formData.permit_number}
                  onChange={handleChange}
                  required={inventoryCategory === 'permit'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="NPK-2024-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permit Type
                </label>
                <input
                  type="text"
                  name="permit_type"
                  value={formData.permit_type}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="Commercial Tour Operator"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuing Authority
                </label>
                <input
                  type="text"
                  name="issuing_authority"
                  value={formData.issuing_authority}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="National Parks Service"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permit Cost ({formData.currency || 'USD'})
                </label>
                <input
                  type="number"
                  name="permit_cost"
                  value={formData.permit_cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="500.00"
                />
                <p className="text-xs text-gray-500 mt-1">Uses currency from Pricing section below</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  name="permit_issue_date"
                  value={formData.permit_issue_date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="permit_expiry_date"
                  value={formData.permit_expiry_date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Quota
                </label>
                <input
                  type="number"
                  name="annual_quota"
                  value={formData.annual_quota}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="1000"
                />
                <p className="text-xs text-gray-500 mt-1">Leave 0 for unlimited</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renewal Reminder (days before expiry)
                </label>
                <input
                  type="number"
                  name="renewal_reminder_days"
                  value={formData.renewal_reminder_days}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="30"
                />
              </div>
            </div>
          </div>
        )}

        {/* Equipment/Reusable Specific Fields */}
        {inventoryCategory === 'physical_stock' && formData.stock_type === 'reusable' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <WrenchScrewdriverIcon className="w-5 h-5 text-[#52b53b]" />
              <h2 className="font-semibold text-gray-900">Equipment Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Interval (days)
                </label>
                <input
                  type="number"
                  name="maintenance_interval_days"
                  value={formData.maintenance_interval_days}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="90"
                />
              </div>
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Pricing</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {inventoryCategory === 'tour_product' ? 'Cost per Tour' : 'Unit Cost'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="unit_cost"
                value={formData.unit_cost}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">Your cost</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {inventoryCategory === 'tour_product' ? 'Price per Person' : 'Selling Price'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="selling_price"
                value={formData.selling_price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">Customer price</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency <span className="text-red-500">*</span>
              </label>
              <CurrencySelect
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">Pricing currency</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gross Margin
            </label>
            <div className="h-10 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 max-w-xs">
              {grossMargin}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Profit margin</p>
          </div>
        </div>

        {/* Inventory - Only show for physical stock */}
        {inventoryCategory === 'physical_stock' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Stock Levels</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Quantity
                </label>
                <input
                  type="number"
                  name="quantity_on_hand"
                  value={formData.quantity_on_hand}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Current stock count</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Point
                </label>
                <input
                  type="number"
                  name="reorder_point"
                  value={formData.reorder_point}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="10"
                />
                <p className="text-xs text-gray-500 mt-1">Alert when stock falls below</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Quantity
                </label>
                <input
                  type="number"
                  name="reorder_quantity"
                  value={formData.reorder_quantity}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="50"
                />
                <p className="text-xs text-gray-500 mt-1">Suggested order amount</p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            placeholder="Internal notes about this item..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/inventory"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#52b53b] text-white rounded-lg text-sm font-medium hover:bg-[#449932] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
