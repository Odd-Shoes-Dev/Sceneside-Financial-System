'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  ClockIcon,
  UsersIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface Tour {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  destination: string;
  duration: string;
  duration_days: number;
  price: number;
  group_size_max: number;
  itinerary: Array<{ day: number; title: string; description: string }>;
  included: string[];
  excluded: string[];
  requirements: string;
  featured_image: string;
  gallery_images: string[];
}

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const { data: tour, error } = await supabase
    .from('website_tours')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !tour) {
    notFound();
  }

  return <TourDetailContent tour={tour} />;
}

function TourDetailContent({ tour }: { tour: Tour }) {
  const [selectedImage, setSelectedImage] = useState<string>(tour.featured_image || '');

  const loadTour = async () => {
    try {
      const { data, error } = await supabase
        .from('website_tours')
        .select('*')
        .eq('slug', tour.slug)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return;
      }
    } catch (error) {
      console.error('Error loading tour:', error);
    }
  };

  const allImages = [tour.featured_image, ...(tour.gallery_images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/website" className="hover:text-sceneside-navy">Home</Link>
            <span>/</span>
            <Link href="/website/tours" className="hover:text-sceneside-navy">Tours</Link>
            <span>/</span>
            <span className="text-gray-900">{tour.name}</span>
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
                  <img src={selectedImage} alt={tour.name} className="w-full h-full object-cover" />
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
                      <img src={image} alt={`${tour.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tour Info */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{tour.name}</h1>
              {tour.destination && (
                <div className="flex items-center gap-2 text-gray-600 mb-6">
                  <MapPinIcon className="w-5 h-5" />
                  <span className="text-lg">{tour.destination}</span>
                </div>
              )}

              {/* Tour Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-sceneside-navy mb-2" />
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-bold text-gray-900">{tour.duration || `${tour.duration_days} Days`}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-sceneside-navy mb-2" />
                  <p className="text-sm text-gray-600">Group Size</p>
                  <p className="font-bold text-gray-900">Max {tour.group_size_max || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-sceneside-navy mb-2" />
                  <p className="text-sm text-gray-600">Availability</p>
                  <p className="font-bold text-gray-900">Year-round</p>
                </div>
              </div>

              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{tour.description}</p>
            </div>

            {/* Itinerary */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Day-by-Day Itinerary</h2>
                <div className="space-y-4">
                  {tour.itinerary.map((item, index) => (
                    <div key={index} className="border-l-4 border-sceneside-navy pl-6 pb-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        Day {item.day}: {item.title}
                      </h3>
                      <p className="text-gray-700">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Included/Excluded */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {tour.included && tour.included.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">What's Included</h3>
                  <ul className="space-y-2">
                    {tour.included.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tour.excluded && tour.excluded.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">What's Not Included</h3>
                  <ul className="space-y-2">
                    {tour.excluded.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Requirements */}
            {tour.requirements && (
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">Important Information</h3>
                <p className="text-gray-700">{tour.requirements}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Book This Tour</h3>
              <p className="text-gray-600 mb-6">From</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-sceneside-navy">${tour.price}</span>
                <span className="text-gray-600"> per person</span>
              </div>

              <div className="space-y-3 mb-6 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold">{tour.duration || `${tour.duration_days} days`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Group:</span>
                  <span className="font-semibold">{tour.group_size_max} people</span>
                </div>
                <div className="flex justify-between">
                  <span>Departure:</span>
                  <span className="font-semibold">Flexible</span>
                </div>
              </div>

              <Link href="/website/contact" className="btn-primary w-full text-center mb-4">
                Request Booking
              </Link>

              <p className="text-xs text-gray-500 text-center">
                Contact us for custom dates and private tours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
