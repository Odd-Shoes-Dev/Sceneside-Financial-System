'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapIcon,
} from '@heroicons/react/24/outline';

interface Tour {
  id: string;
  name: string;
  location: string;
  duration_days: number;
  price_per_person: number;
  max_group_size: number;
  featured_image: string;
  is_featured: boolean;
  is_active: boolean;
}

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchTours();
  }, []);

  useEffect(() => {
    filterTours();
  }, [tours, filter]);

  const fetchTours = async () => {
    try {
      const { data, error } = await supabase
        .from('website_tours')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTours(data || []);
    } catch (error) {
      console.error('Error fetching tours:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTours = () => {
    if (filter === 'all') {
      setFilteredTours(tours);
    } else if (filter === 'active') {
      setFilteredTours(tours.filter((tour) => tour.is_active));
    } else {
      setFilteredTours(tours.filter((tour) => !tour.is_active));
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('website_tours')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchTours();
    } catch (error) {
      console.error('Error updating tour status:', error);
    }
  };

  const deleteTour = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tour?')) return;

    try {
      const { error } = await supabase
        .from('website_tours')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTours();
    } catch (error) {
      console.error('Error deleting tour:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sceneside-navy"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Tours</h1>
            <p className="text-gray-600 mt-1">
              Manage your tour packages and experiences
            </p>
          </div>
        </div>
        <Link href="/dashboard/website/tours/new" className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Tour
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({tours.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active ({tours.filter((t) => t.is_active).length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'inactive'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Inactive ({tours.filter((t) => !t.is_active).length})
        </button>
      </div>

      {/* Tours Grid */}
      {filteredTours.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <MapIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No tours yet' : `No ${filter} tours`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Get started by adding your first tour package'
                : `No tours match the ${filter} filter`}
            </p>
            {filter === 'all' && (
              <Link href="/dashboard/website/tours/new" className="btn-primary">
                <PlusIcon className="w-5 h-5 mr-2" />
                Add First Tour
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map((tour) => (
            <div key={tour.id} className="card hover:shadow-lg transition-shadow">
              <div className="relative">
                {tour.featured_image ? (
                  <img
                    src={tour.featured_image}
                    alt={tour.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                    <MapIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {tour.is_featured && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                    Featured
                  </span>
                )}
                {!tour.is_active && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-gray-500 text-white text-xs font-semibold rounded">
                    Inactive
                  </span>
                )}
              </div>

              <div className="card-body">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {tour.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{tour.location}</p>

                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <p className="font-medium text-gray-900">
                      {tour.duration_days} {tour.duration_days === 1 ? 'Day' : 'Days'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Group Size:</span>
                    <p className="font-medium text-gray-900">Up to {tour.max_group_size}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-sceneside-navy">
                    ${tour.price_per_person}
                  </span>
                  <span className="text-gray-600 text-sm">/person</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/website/tours/${tour.id}/edit`}
                    className="flex-1 btn-secondary text-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-1 inline" />
                    Edit
                  </Link>

                  <button
                    onClick={() => toggleActive(tour.id, tour.is_active)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                      tour.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {tour.is_active ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => deleteTour(tour.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
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
