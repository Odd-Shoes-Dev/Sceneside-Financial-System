'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  UsersIcon,
  CogIcon,
  BoltIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Car {
  id: string;
  name: string;
  slug: string;
  description: string;
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
  mileage_limit: string;
  insurance_included: boolean;
  features: string[];
  featured_image: string;
  gallery_images: string[];
}

export default async function CarDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const { data: car, error } = await supabase
    .from('website_cars')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !car) {
    notFound();
  }

  return <CarDetailContent car={car} />;
}

function CarDetailContent({ car }: { car: Car }) {
  const [selectedImage, setSelectedImage] = useState<string>(car.featured_image || '');

  const loadCar = async () => {
    try {
      const { data, error } = await supabase
        .from('website_cars')
        .select('*')
        .eq('slug', car.slug)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return;
      }
    } catch (error) {
      console.error('Error loading car:', error);
    }
  };

  const allImages = [car.featured_image, ...(car.gallery_images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/website" className="hover:text-sceneside-navy">Home</Link>
            <span>/</span>
            <Link href="/website/cars" className="hover:text-sceneside-navy">Car Rental</Link>
            <span>/</span>
            <span className="text-gray-900">{car.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden mb-4">
                {selectedImage && (
                  <img src={selectedImage} alt={car.name} className="w-full h-full object-cover" />
                )}
              </div>
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {allImages.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(image)}
                      className={`relative h-24 bg-gray-200 rounded-lg overflow-hidden ${
                        selectedImage === image ? 'ring-2 ring-sceneside-navy' : ''
                      }`}
                    >
                      <img src={image} alt={`${car.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Car Info */}
            <div className="mb-8">
              <span className="text-sm font-semibold text-sceneside-navy bg-blue-50 px-3 py-1 rounded-full">
                {car.category}
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-2">{car.name}</h1>
              <p className="text-gray-600 mb-6">{car.brand} {car.model} • {car.year}</p>

              {/* Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-sceneside-navy mb-2" />
                  <p className="text-sm text-gray-600">Seats</p>
                  <p className="font-bold text-gray-900">{car.seats}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <CogIcon className="w-6 h-6 text-sceneside-navy mb-2" />
                  <p className="text-sm text-gray-600">Transmission</p>
                  <p className="font-bold text-gray-900">{car.transmission}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <BoltIcon className="w-6 h-6 text-sceneside-navy mb-2" />
                  <p className="text-sm text-gray-600">Fuel Type</p>
                  <p className="font-bold text-gray-900">{car.fuel_type}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-sceneside-navy mb-2" />
                  <p className="text-sm text-gray-600">Mileage</p>
                  <p className="font-bold text-gray-900">{car.mileage_limit || 'Unlimited'}</p>
                </div>
              </div>

              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{car.description}</p>
            </div>

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Features & Equipment</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {car.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rental Terms */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-3">Rental Terms</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Mileage: {car.mileage_limit || 'Unlimited'}</li>
                <li>✓ Insurance: {car.insurance_included ? 'Included' : 'Available for additional fee'}</li>
                <li>✓ Minimum rental age: 21 years</li>
                <li>✓ Valid driver's license required</li>
                <li>✓ Fuel policy: Return with same fuel level</li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Pricing</h3>
              
              <div className="space-y-4 mb-6">
                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600">Daily Rate</p>
                  <p className="text-3xl font-bold text-sceneside-navy">${car.daily_rate}</p>
                </div>
                {car.weekly_rate > 0 && (
                  <div className="border-b pb-4">
                    <p className="text-sm text-gray-600">Weekly Rate</p>
                    <p className="text-2xl font-bold text-gray-900">${car.weekly_rate}</p>
                    <p className="text-xs text-green-600">Save ${(car.daily_rate * 7 - car.weekly_rate).toFixed(2)}</p>
                  </div>
                )}
                {car.monthly_rate > 0 && (
                  <div className="pb-4">
                    <p className="text-sm text-gray-600">Monthly Rate</p>
                    <p className="text-2xl font-bold text-gray-900">${car.monthly_rate}</p>
                    <p className="text-xs text-green-600">Best Value!</p>
                  </div>
                )}
              </div>

              <Link href="/website/contact" className="btn-primary w-full text-center">
                Reserve Now
              </Link>

              <p className="text-xs text-gray-500 mt-4 text-center">Free cancellation up to 24 hours before pickup</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
