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

export default async function HotelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const { data: hotel, error } = await supabase
    .from('website_hotels')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !hotel) {
    notFound();
  }

  return <HotelDetailContent hotel={hotel} />;
}

function HotelDetailContent({ hotel }: { hotel: Hotel }) {
  const [selectedImage, setSelectedImage] = useState<string>(hotel.featured_image || '');

  const loadHotel = async () => {
    try {
      const { data, error } = await supabase
        .from('website_hotels')
        .select('*')
        .eq('slug', hotel.slug)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return;
      }
    } catch (error) {
      console.error('Error loading hotel:', error);
    }
  };

  const allImages = [hotel.featured_image, ...(hotel.gallery_images || [])].filter(Boolean);

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
              <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden mb-4">
                {selectedImage && (
                  <img src={selectedImage} alt={hotel.name} className="w-full h-full object-cover" />
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
                      <img src={image} alt={`${hotel.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

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
            <div className="card sticky top-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Pricing</h3>
              <p className="text-3xl font-bold text-sceneside-navy mb-6">{hotel.price_range}</p>

              {/* Contact Info */}
              <div className="space-y-4 mb-6">
                {hotel.phone && (
                  <a href={`tel:${hotel.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-sceneside-navy">
                    <PhoneIcon className="w-5 h-5" />
                    <span>{hotel.phone}</span>
                  </a>
                )}
                {hotel.email && (
                  <a href={`mailto:${hotel.email}`} className="flex items-center gap-3 text-gray-700 hover:text-sceneside-navy">
                    <EnvelopeIcon className="w-5 h-5" />
                    <span className="break-all">{hotel.email}</span>
                  </a>
                )}
                {hotel.website_url && (
                  <a href={hotel.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-sceneside-navy">
                    <GlobeAltIcon className="w-5 h-5" />
                    <span>Visit Website</span>
                  </a>
                )}
              </div>

              <Link href="/website/contact" className="btn-primary w-full text-center">
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
