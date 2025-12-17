'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeftIcon,
  PlusIcon,
  BuildingOffice2Icon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

interface Hotel {
  id: string;
  name: string;
  slug: string;
  location: string;
  city: string;
  state: string;
  star_rating: number;
  price_range: string;
  short_description: string;
  featured_image: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

export default function HotelsListPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadHotels();
  }, [filter]);

  const loadHotels = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('website_hotels')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.eq('is_active', true);
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Error loading hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hotel?')) return;

    try {
      const { error } = await supabase
        .from('website_hotels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadHotels();
    } catch (error) {
      console.error('Error deleting hotel:', error);
      alert('Failed to delete hotel');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('website_hotels')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadHotels();
    } catch (error) {
      console.error('Error toggling hotel status:', error);
    }
  };

  const filteredHotels = hotels;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-sceneside-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/website"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
            <p className="text-gray-600 mt-1">Manage hotel listings</p>
          </div>
        </div>
        <Link href="/dashboard/website/hotels/new" className="btn-primary">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Hotel
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({hotels.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'active'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'inactive'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Inactive
        </button>
      </div>

      {/* Hotels List */}
      {filteredHotels.length === 0 ? (
        <div className="text-center py-12 card">
          <BuildingOffice2Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hotels yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first hotel.</p>
          <Link href="/dashboard/website/hotels/new" className="btn-primary inline-flex">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Hotel
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.map((hotel) => (
            <div key={hotel.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
              {/* Hotel Image */}
              <div className="h-48 bg-gray-200 relative">
                {hotel.featured_image ? (
                  <img
                    src={hotel.featured_image}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BuildingOffice2Icon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {hotel.is_featured && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                      Featured
                    </span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => toggleActive(hotel.id, hotel.is_active)}
                    className={`p-1.5 rounded ${
                      hotel.is_active
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-gray-500 hover:bg-gray-600'
                    } text-white`}
                    title={hotel.is_active ? 'Active' : 'Inactive'}
                  >
                    {hotel.is_active ? (
                      <EyeIcon className="w-4 h-4" />
                    ) : (
                      <EyeSlashIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Hotel Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{hotel.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {hotel.city}, {hotel.state}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < hotel.star_rating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {hotel.price_range && (
                    <span className="text-xs text-gray-600">• {hotel.price_range}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {hotel.short_description}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/website/hotels/${hotel.id}/edit`}
                    className="flex-1 btn-secondary text-sm justify-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(hotel.id)}
                    className="btn-ghost text-red-600 hover:bg-red-50 text-sm p-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
