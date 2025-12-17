'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeftIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export default function NewTestimonialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_title: '',
    rating: 5,
    content: '',
    service_type: 'General',
    is_featured: false,
    is_active: true,
  });

  const serviceTypes = ['General', 'Hotel', 'Car Rental', 'Tour', 'Customer Service'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('website_testimonials')
        .insert({
          ...formData,
        });

      if (insertError) throw insertError;

      router.push('/dashboard/website/testimonials');
    } catch (err) {
      console.error('Error creating testimonial:', err);
      setError(err instanceof Error ? err.message : 'Failed to create testimonial');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData({ ...formData, rating: star })}
            className="focus:outline-none"
          >
            {star <= rating ? (
              <StarIconSolid className="w-8 h-8 text-yellow-400 hover:scale-110 transition-transform" />
            ) : (
              <StarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400 hover:scale-110 transition-all" />
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/website/testimonials"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Testimonial</h1>
          <p className="text-gray-600 mt-1">Add a customer review</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Customer Information</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="input"
                placeholder="e.g., John Smith"
                required
              />
            </div>

            <div>
              <label className="label">Customer Title/Position (Optional)</label>
              <input
                type="text"
                value={formData.customer_title}
                onChange={(e) => setFormData({ ...formData, customer_title: e.target.value })}
                className="input"
                placeholder="e.g., Business Traveler, Family Vacationer"
              />
            </div>

            <div>
              <label className="label">Service Type</label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="input"
              >
                {serviceTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Rating</h2>
          </div>
          <div className="card-body">
            <label className="label mb-3">
              Select Rating <span className="text-red-500">*</span>
            </label>
            {renderStars(formData.rating)}
            <p className="text-sm text-gray-600 mt-2">
              {formData.rating} out of 5 stars
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Testimonial Content</h2>
          </div>
          <div className="card-body">
            <label className="label">
              Customer Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="input"
              rows={6}
              placeholder="Write the customer's feedback..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.content.length} characters
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Settings</h2>
          </div>
          <div className="card-body space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-sceneside-navy focus:ring-sceneside-navy"
              />
              <div>
                <span className="font-medium text-gray-900">Featured Testimonial</span>
                <p className="text-sm text-gray-600">Display this testimonial prominently</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-sceneside-navy focus:ring-sceneside-navy"
              />
              <div>
                <span className="font-medium text-gray-900">Active</span>
                <p className="text-sm text-gray-600">Show this testimonial on the public website</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/website/testimonials" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating...' : 'Create Testimonial'}
          </button>
        </div>
      </form>
    </div>
  );
}
