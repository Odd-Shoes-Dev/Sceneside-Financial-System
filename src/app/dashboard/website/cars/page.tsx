'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

interface Car {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  seats: number;
  transmission: string;
  fuel_type: string;
  daily_rate: number;
  featured_image: string;
  is_featured: boolean;
  is_active: boolean;
}

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    filterCars();
  }, [cars, filter]);

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('website_cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCars = () => {
    if (filter === 'all') {
      setFilteredCars(cars);
    } else if (filter === 'active') {
      setFilteredCars(cars.filter((car) => car.is_active));
    } else {
      setFilteredCars(cars.filter((car) => !car.is_active));
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('website_cars')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchCars();
    } catch (error) {
      console.error('Error updating car status:', error);
    }
  };

  const deleteCar = async (id: string) => {
    if (!confirm('Are you sure you want to delete this car?')) return;

    try {
      const { error } = await supabase
        .from('website_cars')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCars();
    } catch (error) {
      console.error('Error deleting car:', error);
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
            <h1 className="text-2xl font-bold text-gray-900">Cars</h1>
            <p className="text-gray-600 mt-1">
              Manage your vehicle fleet
            </p>
          </div>
        </div>
        <Link href="/dashboard/website/cars/new" className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Car
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
          All ({cars.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active ({cars.filter((c) => c.is_active).length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'inactive'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Inactive ({cars.filter((c) => !c.is_active).length})
        </button>
      </div>

      {/* Cars Grid */}
      {filteredCars.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <TruckIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No cars yet' : `No ${filter} cars`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Get started by adding your first vehicle'
                : `No cars match the ${filter} filter`}
            </p>
            {filter === 'all' && (
              <Link href="/dashboard/website/cars/new" className="btn-primary">
                <PlusIcon className="w-5 h-5 mr-2" />
                Add First Car
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <div key={car.id} className="card hover:shadow-lg transition-shadow">
              <div className="relative">
                {car.featured_image ? (
                  <img
                    src={car.featured_image}
                    alt={car.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                    <TruckIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {car.is_featured && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                    Featured
                  </span>
                )}
                {!car.is_active && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-gray-500 text-white text-xs font-semibold rounded">
                    Inactive
                  </span>
                )}
              </div>

              <div className="card-body">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {car.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {car.brand} {car.model} ({car.year})
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <p className="font-medium text-gray-900">{car.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Seats:</span>
                    <p className="font-medium text-gray-900">{car.seats}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Transmission:</span>
                    <p className="font-medium text-gray-900">{car.transmission}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Fuel:</span>
                    <p className="font-medium text-gray-900">{car.fuel_type}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-sceneside-navy">
                    ${car.daily_rate}
                  </span>
                  <span className="text-gray-600 text-sm">/day</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/website/cars/${car.id}/edit`}
                    className="flex-1 btn-secondary text-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-1 inline" />
                    Edit
                  </Link>

                  <button
                    onClick={() => toggleActive(car.id, car.is_active)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                      car.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {car.is_active ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => deleteCar(car.id)}
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
