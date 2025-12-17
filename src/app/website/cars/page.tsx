'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  TruckIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

interface Car {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  category: string;
  brand: string;
  model: string;
  year: number;
  seats: number;
  transmission: string;
  fuel_type: string;
  daily_rate: number;
  weekly_rate: number;
  monthly_rate: number;
  featured_image: string;
  is_featured: boolean;
}

export default function CarsPublicPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [transmissionFilter, setTransmissionFilter] = useState('all');

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    filterCars();
  }, [cars, searchQuery, categoryFilter, transmissionFilter]);

  const loadCars = async () => {
    try {
      const { data, error } = await supabase
        .from('website_cars')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('daily_rate', { ascending: true });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCars = () => {
    let filtered = cars;

    if (searchQuery) {
      filtered = filtered.filter((car) =>
        car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((car) => car.category === categoryFilter);
    }

    if (transmissionFilter !== 'all') {
      filtered = filtered.filter((car) => car.transmission === transmissionFilter);
    }

    setFilteredCars(filtered);
  };

  const categories = Array.from(new Set(cars.map((c) => c.category).filter(Boolean)));
  const transmissions = Array.from(new Set(cars.map((c) => c.transmission).filter(Boolean)));

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Car Rental</h1>
          <p className="text-xl text-gray-200">Choose from our premium vehicle fleet</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sceneside-navy focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sceneside-navy focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={transmissionFilter}
              onChange={(e) => setTransmissionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sceneside-navy focus:border-transparent"
            >
              <option value="all">All Transmissions</option>
              {transmissions.map((transmission) => (
                <option key={transmission} value={transmission}>{transmission}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cars Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredCars.length === 0 ? (
          <div className="text-center py-16">
            <TruckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No vehicles found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCars.map((car) => (
              <Link
                key={car.id}
                href={`/website/cars/${car.slug}`}
                className="card hover:shadow-xl transition-shadow group"
              >
                {car.is_featured && (
                  <div className="absolute top-4 right-4 z-10 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                    Popular
                  </div>
                )}
                <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  {car.featured_image ? (
                    <img
                      src={car.featured_image}
                      alt={car.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <TruckIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <span className="text-xs font-semibold text-sceneside-navy bg-blue-50 px-3 py-1 rounded-full">
                    {car.category}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-3 mb-2">{car.name}</h3>
                  {car.short_description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{car.short_description}</p>
                  )}
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-4 h-4" />
                      <span>{car.seats} Seats</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CogIcon className="w-4 h-4" />
                      <span>{car.transmission}</span>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500">From</p>
                        <p className="text-2xl font-bold text-sceneside-navy">${car.daily_rate}<span className="text-sm font-normal text-gray-600">/day</span></p>
                      </div>
                      <span className="text-sceneside-navy text-sm font-medium">View Details →</span>
                    </div>
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
