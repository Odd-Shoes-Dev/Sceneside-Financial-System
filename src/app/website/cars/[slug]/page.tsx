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

export default function CarDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async (p) => {
      const { data, error } = await supabase
        .from('website_cars')
        .select('*')
        .eq('slug', p.slug)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        notFound();
      }
      setCar(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-sceneside-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!car) {
    return notFound();
  }

  return <CarDetailContent car={car} />;
}

function CarDetailContent({ car }: { car: Car }) {
  const [selectedImage, setSelectedImage] = useState<string>(car.featured_image || '');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

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

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

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
              <button
                onClick={() => openLightbox(0)}
                className="relative h-96 bg-gray-200 rounded-lg overflow-hidden mb-4 w-full group cursor-pointer"
              >
                {selectedImage && (
                  <>
                    <img src={selectedImage} alt={car.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-lg font-semibold">
                        Click to view full size
                      </span>
                    </div>
                  </>
                )}
              </button>
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {allImages.slice(0, 8).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => openLightbox(index)}
                      className={`relative h-24 bg-gray-200 rounded-lg overflow-hidden hover:ring-2 hover:ring-sceneside-navy transition-all ${
                        selectedImage === image ? 'ring-2 ring-sceneside-navy' : ''
                      }`}
                    >
                      <img src={image} alt={`${car.name} ${index + 1}`} className="w-full h-full object-cover" />
                      {index === 7 && allImages.length > 8 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">+{allImages.length - 8}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lightbox */}
            {showLightbox && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center" onClick={closeLightbox}>
                <button
                  onClick={closeLightbox}
                  className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50"
                >
                  ×
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 text-white text-6xl hover:text-gray-300 z-50"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 text-white text-6xl hover:text-gray-300 z-50"
                >
                  ›
                </button>
                <div className="max-w-7xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={allImages[selectedImageIndex]}
                    alt={`${car.name} ${selectedImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="text-center text-white mt-4">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                </div>
              </div>
            )}

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
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-600 mb-4">Rental Rates</h3>
              
              <div className="space-y-4 mb-6">
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Daily Rate</p>
                  <p className="text-3xl font-bold text-sceneside-navy">${car.daily_rate.toFixed(2)}</p>
                </div>
                {car.weekly_rate > 0 && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Weekly Rate</p>
                    <p className="text-2xl font-bold text-gray-900">${car.weekly_rate.toFixed(2)}</p>
                    <p className="text-xs text-green-600 mt-1">Save ${(car.daily_rate * 7 - car.weekly_rate).toFixed(2)}</p>
                  </div>
                )}
                {car.monthly_rate > 0 && (
                  <div className="pb-4">
                    <p className="text-sm text-gray-600 mb-1">Monthly Rate</p>
                    <p className="text-2xl font-bold text-gray-900">${car.monthly_rate.toFixed(2)}</p>
                    <p className="text-xs text-green-600 mt-1">Best Value!</p>
                  </div>
                )}
              </div>

              <Link 
                href="/website/contact" 
                className="block w-full text-center bg-sceneside-navy text-white px-6 py-3 rounded-lg font-semibold hover:bg-sceneside-navy-dark transition-colors mb-4"
              >
                Reserve Now
              </Link>

              <p className="text-xs text-gray-500 text-center">Free cancellation up to 24 hours before pickup</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
