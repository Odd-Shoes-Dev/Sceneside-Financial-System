'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon as StarOutlineIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface Hotel {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  location: string;
  city: string;
  state: string;
  star_rating: number;
  price_range: string;
  featured_image: string;
  is_featured: boolean;
}

export default function HotelsPublicPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');

  useEffect(() => {
    loadHotels();
  }, []);

  useEffect(() => {
    filterHotels();
  }, [hotels, searchQuery, stateFilter]);

  const loadHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('website_hotels')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Error loading hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHotels = () => {
    let filtered = hotels;

    if (searchQuery) {
      filtered = filtered.filter((hotel) =>
        hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (stateFilter !== 'all') {
      filtered = filtered.filter((hotel) => hotel.state === stateFilter);
    }

    setFilteredHotels(filtered);
  };

  const states = Array.from(new Set(hotels.map((h) => h.state).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-sceneside-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-sceneside-navy text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/website" className="text-white/80 hover:text-white mb-4 inline-block">&larr; Back to Home</Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Hotels</h1>
          <p className="text-xl text-gray-200">Find the perfect accommodation for your stay</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sceneside-navy focus:border-transparent"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sceneside-navy focus:border-transparent"
            >
              <option value="all">All States</option>
              {states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hotels Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredHotels.length === 0 ? (
          <div className="text-center py-16">
            <BuildingOffice2Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No hotels found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHotels.map((hotel) => (
              <Link
                key={hotel.id}
                href={`/website/hotels/${hotel.slug}`}
                className="card hover:shadow-xl transition-shadow group"
              >
                {hotel.is_featured && (
                  <div className="absolute top-4 right-4 z-10 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                    Featured
                  </div>
                )}
                <div className="relative h-56 bg-gray-200 rounded-t-lg overflow-hidden">
                  {hotel.featured_image ? (
                    <img
                      src={hotel.featured_image}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BuildingOffice2Icon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      i < (hotel.star_rating || 0) ? (
                        <StarSolidIcon key={i} className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <StarOutlineIcon key={i} className="w-4 h-4 text-gray-300" />
                      )
                    ))}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
                  {hotel.location && (
                    <div className="flex items-center gap-1 text-gray-600 text-sm mb-3">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{hotel.location}</span>
                    </div>
                  )}
                  <p className="text-gray-700 mb-4 line-clamp-2">{hotel.short_description}</p>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-sceneside-navy font-bold text-lg">{hotel.price_range}</span>
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
