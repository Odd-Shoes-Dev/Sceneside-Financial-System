'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import WebsiteHeader from '@/components/website-header';
import {
  MapIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UsersIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface Tour {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  destination: string;
  duration: string;
  duration_days: number;
  price: number;
  group_size_max: number;
  featured_image: string;
  is_featured: boolean;
}

export default function ToursPublicPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [durationFilter, setDurationFilter] = useState('all');

  useEffect(() => {
    loadTours();
  }, []);

  useEffect(() => {
    filterTours();
  }, [tours, searchQuery, durationFilter]);

  const loadTours = async () => {
    try {
      const { data, error } = await supabase
        .from('website_tours')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('duration_days', { ascending: true});

      if (error) throw error;
      setTours(data || []);
    } catch (error) {
      console.error('Error loading tours:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTours = () => {
    let filtered = tours;

    if (searchQuery) {
      filtered = filtered.filter((tour) =>
        tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.destination?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (durationFilter !== 'all') {
      if (durationFilter === 'short') {
        filtered = filtered.filter((tour) => tour.duration_days <= 3);
      } else if (durationFilter === 'medium') {
        filtered = filtered.filter((tour) => tour.duration_days >= 4 && tour.duration_days <= 7);
      } else if (durationFilter === 'long') {
        filtered = filtered.filter((tour) => tour.duration_days > 7);
      }
    }

    setFilteredTours(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-sceneside-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WebsiteHeader 
        title="Discover America" 
        description="Unforgettable tours and experiences across the United States"
        activePage="tours"
      />

      {/* Filters */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tours by name or destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sceneside-navy focus:border-transparent"
              />
            </div>
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sceneside-navy focus:border-transparent"
            >
              <option value="all">All Durations</option>
              <option value="short">Short (1-3 days)</option>
              <option value="medium">Medium (4-7 days)</option>
              <option value="long">Long (8+ days)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredTours.length === 0 ? (
          <div className="text-center py-16">
            <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No tours found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTours.map((tour) => (
              <Link
                key={tour.id}
                href={`/website/tours/${tour.slug}`}
                className="card hover:shadow-xl transition-shadow group"
              >
                {tour.is_featured && (
                  <div className="absolute top-4 right-4 z-10 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                    Featured
                  </div>
                )}
                <div className="relative h-56 bg-gray-200 rounded-t-lg overflow-hidden">
                  {tour.featured_image ? (
                    <img
                      src={tour.featured_image}
                      alt={tour.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <MapIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tour.name}</h3>
                  {tour.destination && (
                    <p className="text-sm text-gray-600 mb-3">{tour.destination}</p>
                  )}
                  <p className="text-gray-700 mb-4 line-clamp-2">{tour.short_description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{tour.duration || `${tour.duration_days} days`}</span>
                    </div>
                    {tour.group_size_max && (
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-4 h-4" />
                        <span>Max {tour.group_size_max}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <CurrencyDollarIcon className="w-5 h-5 text-sceneside-navy" />
                      <span className="text-2xl font-bold text-sceneside-navy">{tour.price}</span>
                      <span className="text-sm text-gray-600">/person</span>
                    </div>
                    <span className="text-sceneside-navy text-sm font-medium">View Details →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
