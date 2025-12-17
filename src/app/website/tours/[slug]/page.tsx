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
  location: string;
  destination: string;
  duration: string;
  duration_days: number;
  price: number;
  price_per_person: number;
  max_group_size: number;
  group_size_max: number;
  difficulty_level: string;
  highlights: string[];
  itinerary: string[];
  inclusions: string[];
  exclusions: string[];
  included: string[];
  excluded: string[];
  requirements: string;
  featured_image: string;
  gallery_images: string[];
}

export default function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async (p) => {
      const { data, error } = await supabase
        .from('website_tours')
        .select('*')
        .eq('slug', p.slug)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        notFound();
      }
      setTour(data);
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

  if (!tour) {
    return notFound();
  }

  return <TourDetailContent tour={tour} />;
}

function TourDetailContent({ tour }: { tour: Tour }) {
  const [selectedImage, setSelectedImage] = useState<string>(tour.featured_image || '');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

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
              <button
                onClick={() => openLightbox(0)}
                className="relative h-96 bg-gray-200 rounded-lg overflow-hidden mb-4 w-full group cursor-pointer"
              >
                {selectedImage && (
                  <>
                    <img src={selectedImage} alt={tour.name} className="w-full h-full object-cover" />
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
                      <img src={image} alt={`${tour.name} ${index + 1}`} className="w-full h-full object-cover" />
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
                    alt={`${tour.name} ${selectedImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="text-center text-white mt-4">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                </div>
              </div>
            )}

            {/* Tour Info */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{tour.name}</h1>
              {(tour.location || tour.destination) && (
                <div className="flex items-center gap-2 text-gray-600 mb-6">
                  <MapPinIcon className="w-5 h-5" />
                  <span className="text-lg">{tour.location || tour.destination}</span>
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
                  <p className="font-bold text-gray-900">Max {tour.max_group_size || tour.group_size_max || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-sceneside-navy mb-2" />
                  <p className="text-sm text-gray-600">Availability</p>
                  <p className="font-bold text-gray-900">Year-round</p>
                </div>
              </div>

              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{tour.description}</p>
            </div>

            {/* Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Tour Highlights</h2>
                <ul className="space-y-3">
                  {tour.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircleIcon className="w-6 h-6 text-sceneside-navy flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-lg">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Itinerary */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Day-by-Day Itinerary</h2>
                <div className="space-y-4">
                  {tour.itinerary.map((item, index) => (
                    <div key={index} className="border-l-4 border-sceneside-navy pl-6 pb-4">
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Included/Excluded */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {(tour.inclusions || tour.included) && (tour.inclusions?.length > 0 || tour.included?.length > 0) && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">What's Included</h3>
                  <ul className="space-y-2">
                    {(tour.inclusions || tour.included || []).map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(tour.exclusions || tour.excluded) && (tour.exclusions?.length > 0 || tour.excluded?.length > 0) && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">What's Not Included</h3>
                  <ul className="space-y-2">
                    {(tour.exclusions || tour.excluded || []).map((item, index) => (
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
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 sticky top-4">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Price</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-sceneside-navy">${tour.price_per_person || tour.price || 0}</span>
                  <span className="text-gray-600 text-sm">per person</span>
                </div>
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold text-gray-900">{tour.duration || `${tour.duration_days} days`}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Max Group:</span>
                  <span className="font-semibold text-gray-900">{tour.max_group_size || tour.group_size_max} people</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Departure:</span>
                  <span className="font-semibold text-gray-900">Flexible</span>
                </div>
              </div>

              <Link 
                href="/website/contact" 
                className="block w-full text-center bg-sceneside-navy text-white px-6 py-3 rounded-lg font-semibold hover:bg-sceneside-navy-dark transition-colors mb-4"
              >
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
