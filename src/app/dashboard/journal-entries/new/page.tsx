'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, cn } from '@/lib/utils';

interface LineItem {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

interface JournalEntryForm {
  entryNumber: string;
  date: string;
  reference: string;
  description: string;
  type: 'Manual' | 'System' | 'Adjustment' | 'Closing';
  lineItems: LineItem[];
}

const SAMPLE_ACCOUNTS = [
  { code: '1000', name: 'Cash - Operating Account', type: 'Asset' },
  { code: '1010', name: 'Cash - Savings Account', type: 'Asset' },
  { code: '1200', name: 'Accounts Receivable', type: 'Asset' },
  { code: '1300', name: 'Inventory - Medical Supplies', type: 'Asset' },
  { code: '1400', name: 'Prepaid Insurance', type: 'Asset' },
  { code: '1500', name: 'Equipment', type: 'Asset' },
  { code: '1510', name: 'Accumulated Depreciation - Equipment', type: 'Asset' },
  { code: '2000', name: 'Accounts Payable', type: 'Liability' },
  { code: '2100', name: 'Wages Payable', type: 'Liability' },
  { code: '2110', name: 'Federal Tax Withholding', type: 'Liability' },
  { code: '2120', name: 'State Tax Withholding', type: 'Liability' },
  { code: '2130', name: 'FICA Payable', type: 'Liability' },
  { code: '2140', name: 'Benefits Payable', type: 'Liability' },
  { code: '2200', name: 'Sales Tax Payable', type: 'Liability' },
  { code: '2210', name: 'Local Tax Payable', type: 'Liability' },
  { code: '2220', name: 'Medical Device Tax', type: 'Liability' },
  { code: '2500', name: 'Equipment Loan Payable', type: 'Liability' },
  { code: '3000', name: 'Owner Equity', type: 'Equity' },
  { code: '3100', name: 'Retained Earnings', type: 'Equity' },
  { code: '4100', name: 'Sales Revenue', type: 'Revenue' },
  { code: '4200', name: 'Interest Income', type: 'Revenue' },
  { code: '5100', name: 'Cost of Goods Sold', type: 'Expense' },
  { code: '5200', name: 'Rent Expense', type: 'Expense' },
  { code: '5250', name: 'Electricity Expense', type: 'Expense' },
  { code: '5260', name: 'Gas Expense', type: 'Expense' },
  { code: '5270', name: 'Water & Sewer', type: 'Expense' },
  { code: '5280', name: 'Internet & Phone', type: 'Expense' },
  { code: '5300', name: 'Salaries & Wages', type: 'Expense' },
  { code: '5310', name: 'Payroll Tax Expense', type: 'Expense' },
  { code: '5320', name: 'Benefits Expense', type: 'Expense' },
  { code: '5400', name: 'Depreciation Expense', type: 'Expense' },
  { code: '5500', name: 'Loss on Damaged Inventory', type: 'Expense' },
  { code: '5600', name: 'Interest Expense', type: 'Expense' },
];

export default function NewJournalEntryPage() {
  const [formData, setFormData] = useState<JournalEntryForm>({
    entryNumber: `JE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    type: 'Manual',
    lineItems: [
      {
        id: '1',
        accountCode: '',
        accountName: '',
        description: '',
        debit: 0,
        credit: 0,
      },
      {
        id: '2',
        accountCode: '',
        accountName: '',
        description: '',
        debit: 0,
        credit: 0,
      }
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addLineItem = () => {
    const newLineItem: LineItem = {
      id: String(Date.now()),
      accountCode: '',
      accountName: '',
      description: '',
      debit: 0,
      credit: 0,
    };
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newLineItem]
    }));
  };

  const removeLineItem = (id: string) => {
    if (formData.lineItems.length <= 2) return; // Keep at least 2 line items
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // If account code changes, update account name
          if (field === 'accountCode') {
            const account = SAMPLE_ACCOUNTS.find(acc => acc.code === value);
            updatedItem.accountName = account ? account.name : '';
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const getTotalDebits = () => {
    return formData.lineItems.reduce((sum, item) => sum + (item.debit || 0), 0);
  };

  const getTotalCredits = () => {
    return formData.lineItems.reduce((sum, item) => sum + (item.credit || 0), 0);
  };

  const isBalanced = () => {
    const debits = getTotalDebits();
    const credits = getTotalCredits();
    return Math.abs(debits - credits) < 0.01 && debits > 0 && credits > 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.reference.trim()) {
      newErrors.reference = 'Reference is required';
    }

    // Validate line items
    formData.lineItems.forEach((item, index) => {
      if (!item.accountCode) {
        newErrors[`lineItem_${index}_account`] = 'Account is required';
      }
      if (!item.description.trim()) {
        newErrors[`lineItem_${index}_description`] = 'Description is required';
      }
      if (item.debit === 0 && item.credit === 0) {
        newErrors[`lineItem_${index}_amount`] = 'Either debit or credit amount is required';
      }
      if (item.debit > 0 && item.credit > 0) {
        newErrors[`lineItem_${index}_amount`] = 'Cannot have both debit and credit amounts';
      }
    });

    if (!isBalanced()) {
      newErrors.balance = 'Entry must be balanced (total debits must equal total credits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Here you would normally submit to an API
      console.log('Submitting journal entry:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to journal entries list or show success message
      alert('Journal entry created successfully!');
      
    } catch (error) {
      console.error('Error creating journal entry:', error);
      alert('Failed to create journal entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      // Here you would save as draft
      console.log('Saving draft:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Draft saved successfully!');
      
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/dashboard/reports/journal-entries" className="btn-ghost p-1.5 sm:p-2">
            <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">New Journal Entry</h1>
            <p className="text-sm sm:text-base text-gray-600">Create a new accounting journal entry</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entry Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-sceneside-navy" />
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Entry Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entry Number</label>
              <input
                type="text"
                value={formData.entryNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, entryNumber: e.target.value }))}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sceneside-navy focus:border-sceneside-navy bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sceneside-navy focus:border-sceneside-navy"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sceneside-navy focus:border-sceneside-navy"
              >
                <option value="Manual">Manual</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Closing">Closing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Invoice #, Check #, etc."
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sceneside-navy focus:border-sceneside-navy",
                  errors.reference ? "border-red-300" : "border-gray-300"
                )}
                required
              />
              {errors.reference && (
                <p className="mt-1 text-xs text-red-600">{errors.reference}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the purpose of this journal entry..."
              rows={3}
              className={cn(
                "block w-full px-3 py-2 text-sm border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sceneside-navy focus:border-sceneside-navy",
                errors.description ? "border-red-300" : "border-gray-300"
              )}
              required
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-sceneside-navy" />
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Line Items</h3>
              </div>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-sceneside-navy hover:bg-sceneside-navy/10 rounded-md"
              >
                <PlusIcon className="w-3 h-3" />
                Add Line
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {formData.lineItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <select
                        value={item.accountCode}
                        onChange={(e) => updateLineItem(item.id, 'accountCode', e.target.value)}
                        className={cn(
                          "block w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-sceneside-navy focus:border-sceneside-navy",
                          errors[`lineItem_${index}_account`] ? "border-red-300" : "border-gray-300"
                        )}
                        required
                      >
                        <option value="">Select Account</option>
                        {SAMPLE_ACCOUNTS.map((account) => (
                          <option key={account.code} value={account.code}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                      {errors[`lineItem_${index}_account`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`lineItem_${index}_account`]}</p>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Line item description..."
                        className={cn(
                          "block w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-sceneside-navy focus:border-sceneside-navy",
                          errors[`lineItem_${index}_description`] ? "border-red-300" : "border-gray-300"
                        )}
                        required
                      />
                      {errors[`lineItem_${index}_description`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`lineItem_${index}_description`]}</p>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.debit || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : 0;
                          updateLineItem(item.id, 'debit', value);
                          if (value > 0) updateLineItem(item.id, 'credit', 0);
                        }}
                        placeholder="0.00"
                        className={cn(
                          "block w-full px-2 py-1 text-xs text-right tabular-nums border rounded focus:outline-none focus:ring-1 focus:ring-sceneside-navy focus:border-sceneside-navy",
                          errors[`lineItem_${index}_amount`] ? "border-red-300" : "border-gray-300"
                        )}
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.credit || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : 0;
                          updateLineItem(item.id, 'credit', value);
                          if (value > 0) updateLineItem(item.id, 'debit', 0);
                        }}
                        placeholder="0.00"
                        className={cn(
                          "block w-full px-2 py-1 text-xs text-right tabular-nums border rounded focus:outline-none focus:ring-1 focus:ring-sceneside-navy focus:border-sceneside-navy",
                          errors[`lineItem_${index}_amount`] ? "border-red-300" : "border-gray-300"
                        )}
                      />
                      {errors[`lineItem_${index}_amount`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`lineItem_${index}_amount`]}</p>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      {formData.lineItems.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-3 sm:px-6 py-3 text-sm font-semibold text-gray-900">
                    Totals
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-sm font-bold text-right tabular-nums text-red-600">
                    {formatCurrency(getTotalDebits())}
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-sm font-bold text-right tabular-nums text-green-600">
                    {formatCurrency(getTotalCredits())}
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-center">
                    {isBalanced() ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <XMarkIcon className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {errors.balance && (
            <div className="px-4 sm:px-6 py-3 bg-red-50 border-t border-red-200">
              <p className="text-sm text-red-600">{errors.balance}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
          <Link
            href="/dashboard/reports/journal-entries"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isBalanced()}
            className="inline-flex items-center justify-center px-4 py-2 bg-sceneside-navy text-white rounded-lg text-sm font-medium hover:bg-sceneside-navy/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}