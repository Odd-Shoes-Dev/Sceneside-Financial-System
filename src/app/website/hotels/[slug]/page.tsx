'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface Hotel {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  location: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  email: string;
  website_url: string;
  star_rating: number;
  price_range: string;
  amenities: string[];
  featured_image: string;
  gallery_images: string[];
}

export default function HotelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async (p) => {
      const { data, error } = await supabase
        .from('website_hotels')
        .select('*')
        .eq('slug', p.slug)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        notFound();
      }
      setHotel(data);
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

  if (!hotel) {
    return notFound();
  }

  return <HotelDetailContent hotel={hotel} />;
}

function HotelDetailContent({ hotel }: { hotel: Hotel }) {
  const [selectedImage, setSelectedImage] = useState<string>(hotel.featured_image || '');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const allImages = [hotel.featured_image, ...(hotel.gallery_images || [])].filter(Boolean);

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
            <Link href="/website/hotels" className="hover:text-sceneside-navy">Hotels</Link>
            <span>/</span>
            <span className="text-gray-900">{hotel.name}</span>
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
                    <img src={selectedImage} alt={hotel.name} className="w-full h-full object-cover" />
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
                      <img src={image} alt={`${hotel.name} ${index + 1}`} className="w-full h-full object-cover" />
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
                    alt={`${hotel.name} ${selectedImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="text-center text-white mt-4">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                </div>
              </div>
            )}

            {/* Hotel Info */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(hotel.star_rating || 0)].map((_, i) => (
                  <StarSolidIcon key={i} className="w-6 h-6 text-yellow-400" />
                ))}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{hotel.name}</h1>
              {hotel.location && (
                <div className="flex items-center gap-2 text-gray-600 mb-6">
                  <MapPinIcon className="w-5 h-5" />
                  <span className="text-lg">{hotel.location}</span>
                </div>
              )}
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{hotel.description}</p>
            </div>

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Details */}
            {hotel.address && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
                <p className="text-gray-700">
                  {hotel.address}<br />
                  {hotel.city}, {hotel.state} {hotel.zip_code}<br />
                  {hotel.country}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 sticky top-4">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Pricing</h3>
                <p className="text-3xl font-bold text-sceneside-navy">{hotel.price_range}</p>
              </div>

              <Link 
                href="/website/contact" 
                className="block w-full text-center bg-sceneside-navy text-white px-6 py-3 rounded-lg font-semibold hover:bg-sceneside-navy-dark transition-colors mb-6"
              >
                Book Now
              </Link>

              {/* Contact Info */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                {hotel.phone && (
                  <a 
                    href={`tel:${hotel.phone}`} 
                    className="flex items-center gap-3 text-gray-700 hover:text-sceneside-navy transition-colors"
                  >
                    <PhoneIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{hotel.phone}</span>
                  </a>
                )}
                {hotel.email && (
                  <a 
                    href={`mailto:${hotel.email}`} 
                    className="flex items-center gap-3 text-gray-700 hover:text-sceneside-navy transition-colors"
                  >
                    <EnvelopeIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm break-all">{hotel.email}</span>
                  </a>
                )}
                {hotel.website_url && (
                  <a 
                    href={hotel.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 text-gray-700 hover:text-sceneside-navy transition-colors"
                  >
                    <GlobeAltIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">Visit Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
