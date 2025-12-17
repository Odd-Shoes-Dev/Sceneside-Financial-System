'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import {
  BuildingOffice2Icon,
  TruckIcon,
  MapIcon,
  StarIcon,
  ArrowRightIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface Hotel {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  location: string;
  star_rating: number;
  price_range: string;
  featured_image: string;
}

interface Car {
  id: string;
  name: string;
  slug: string;
  category: string;
  seats: number;
  transmission: string;
  daily_rate: number;
  featured_image: string;
}

interface Tour {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  duration_days: number;
  price: number;
  featured_image: string;
}

interface Testimonial {
  id: string;
  customer_name: string;
  customer_title: string;
  rating: number;
  comment: string;
  service_type: string;
  created_at: string;
}

interface WebsiteContent {
  section_key: string;
  content: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
}

export default function WebsiteHomePage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      // Load featured hotels
      const { data: hotelsData, error: hotelsError } = await supabase
        .from('website_hotels')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(3);
      
      if (hotelsError) console.warn('Hotels table not ready:', hotelsError.message);

      // Load featured cars
      const { data: carsData, error: carsError } = await supabase
        .from('website_cars')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(3);
      
      if (carsError) console.warn('Cars table not ready:', carsError.message);

      // Load featured tours
      const { data: toursData, error: toursError } = await supabase
        .from('website_tours')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(3);
      
      if (toursError) console.warn('Tours table not ready:', toursError.message);

      // Load testimonials
      const { data: testimonialsData, error: testimonialsError } = await supabase
        .from('website_testimonials')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (testimonialsError) console.warn('Testimonials table not ready:', testimonialsError.message);

      // Load website content
      const { data: contentData, error: contentError } = await supabase
        .from('website_content')
        .select('*');
      
      if (contentError) console.warn('Content table not ready:', contentError.message);

      // Load gallery images for hero background
      const { data: galleryData, error: galleryError } = await supabase
        .from('website_gallery')
        .select('id, image_url')
        .limit(10);
      
      if (galleryError) console.warn('Gallery table not ready:', galleryError.message);

      setHotels(hotelsData || []);
      setCars(carsData || []);
      setTours(toursData || []);
      setTestimonials(testimonialsData || []);
      setGalleryImages(galleryData || []);

      // Convert content array to object
      const contentObj: Record<string, string> = {};
      contentData?.forEach((item) => {
        contentObj[item.section_key] = item.content;
      });
      setContent(contentObj);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rotate background images every 5 seconds
  useEffect(() => {
    if (galleryImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [galleryImages.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-sceneside-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/website" className="flex items-center">
              <img 
                src="/Sceneside assets/Sceneside_logo.png" 
                alt="Sceneside L.L.C" 
                className="h-10 w-auto"
              />
            </Link>
            <div className="hidden md:flex space-x-8">
              <Link href="/website" className="text-gray-700 hover:text-sceneside-navy">Home</Link>
              <Link href="/website/hotels" className="text-gray-700 hover:text-sceneside-navy">Hotels</Link>
              <Link href="/website/cars" className="text-gray-700 hover:text-sceneside-navy">Car Rental</Link>
              <Link href="/website/tours" className="text-gray-700 hover:text-sceneside-navy">Tours</Link>
              <Link href="/website/gallery" className="text-gray-700 hover:text-sceneside-navy">Gallery</Link>
              <Link href="/website/contact" className="text-gray-700 hover:text-sceneside-navy">Contact</Link>
            </div>
            <Link href="/website/contact" className="btn-primary">
              Book Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative text-white py-24 overflow-hidden">
        {/* Background Image Slideshow */}
        {galleryImages.length > 0 ? (
          <>
            {galleryImages.map((image, index) => (
              <div
                key={image.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={image.image_url}
                  alt="Background"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/60" />
          </>
        ) : (
          // Fallback to gradient if no gallery images
          <div className="absolute inset-0 bg-gradient-to-r from-sceneside-navy to-sceneside-navy-dark" />
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
              {content['hero_title'] || 'Explore America with Sceneside'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto drop-shadow-md">
              {content['hero_subtitle'] || 'Premium hotels, reliable car rentals, and unforgettable tours across the United States'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/website/hotels" className="bg-white text-sceneside-navy px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
                Browse Hotels
              </Link>
              <Link href="/website/cars" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-sceneside-navy transition-colors shadow-lg">
                Rent a Car
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      {hotels.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Featured Hotels</h2>
                <p className="text-gray-600 mt-2">Handpicked accommodations for your stay</p>
              </div>
              <Link href="/website/hotels" className="text-sceneside-navy font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                View All <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {hotels.map((hotel) => (
                <Link key={hotel.id} href={`/website/hotels/${hotel.slug}`} className="card hover:shadow-xl transition-shadow group">
                  <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    {hotel.featured_image && (
                      <img src={hotel.featured_image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(hotel.star_rating || 0)].map((_, i) => (
                        <StarSolidIcon key={i} className="w-4 h-4 text-yellow-400" />
                      ))}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{hotel.location}</p>
                    <p className="text-gray-700 mb-4 line-clamp-2">{hotel.short_description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sceneside-navy font-semibold">{hotel.price_range}</span>
                      <span className="text-sceneside-navy text-sm font-medium group-hover:gap-2 flex items-center gap-1">
                        View Details <ArrowRightIcon className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Cars */}
      {cars.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Vehicle Fleet</h2>
                <p className="text-gray-600 mt-2">Choose from our premium car rental options</p>
              </div>
              <Link href="/website/cars" className="text-sceneside-navy font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                View All <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {cars.map((car) => (
                <Link key={car.id} href={`/website/cars/${car.slug}`} className="card hover:shadow-xl transition-shadow group">
                  <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    {car.featured_image && (
                      <img src={car.featured_image} alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-semibold text-sceneside-navy bg-blue-50 px-3 py-1 rounded-full">{car.category}</span>
                    <h3 className="text-xl font-bold text-gray-900 mt-3 mb-2">{car.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span>{car.seats} Seats</span>
                      <span>•</span>
                      <span>{car.transmission}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-2xl font-bold text-sceneside-navy">${car.daily_rate}</span>
                        <span className="text-gray-600 text-sm">/day</span>
                      </div>
                      <span className="text-sceneside-navy text-sm font-medium group-hover:gap-2 flex items-center gap-1">
                        Rent Now <ArrowRightIcon className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Tours */}
      {tours.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Popular Tours</h2>
                <p className="text-gray-600 mt-2">Discover amazing destinations and experiences</p>
              </div>
              <Link href="/website/tours" className="text-sceneside-navy font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                View All <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {tours.map((tour) => (
                <Link key={tour.id} href={`/website/tours/${tour.slug}`} className="card hover:shadow-xl transition-shadow group">
                  <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    {tour.featured_image && (
                      <img src={tour.featured_image} alt={tour.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tour.name}</h3>
                    <p className="text-gray-700 mb-4 line-clamp-2">{tour.short_description}</p>
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                      <span>{tour.duration_days} {tour.duration_days === 1 ? 'Day' : 'Days'}</span>
                      <span className="text-2xl font-bold text-sceneside-navy">${tour.price}</span>
                    </div>
                    <span className="text-sceneside-navy text-sm font-medium group-hover:gap-2 flex items-center gap-1">
                      Learn More <ArrowRightIcon className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">What Our Customers Say</h2>
              <p className="text-gray-600 mt-2">Real experiences from real travelers</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.slice(0, 3).map((testimonial) => (
                <div key={testimonial.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarSolidIcon key={i} className="w-6 h-6 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">"{testimonial.comment}"</p>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="font-bold text-gray-900 text-lg">{testimonial.customer_name}</p>
                    {testimonial.customer_title && (
                      <p className="text-sm text-gray-500 mb-1">{testimonial.customer_title}</p>
                    )}
                    <span className="inline-block mt-2 px-3 py-1 bg-sceneside-navy/10 text-sceneside-navy text-xs font-semibold rounded-full">
                      {testimonial.service_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-sceneside-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8 text-gray-200">Contact us today to plan your perfect trip</p>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="tel:+1234567890" className="flex items-center gap-2 text-lg hover:text-gray-200">
              <PhoneIcon className="w-6 h-6" />
              {content['contact_phone'] || '(123) 456-7890'}
            </a>
            <a href="mailto:info@sceneside.com" className="flex items-center gap-2 text-lg hover:text-gray-200">
              <EnvelopeIcon className="w-6 h-6" />
              {content['contact_email'] || 'info@sceneside.com'}
            </a>
          </div>
          <Link href="/website/contact" className="inline-block mt-8 bg-white text-sceneside-navy px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Get in Touch
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Sceneside L.L.C</h3>
              <p className="text-sm">{content['footer_about'] || 'Your trusted partner for hotels, car rentals, and tours across the United States.'}</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/website/hotels" className="hover:text-white">Hotels</Link></li>
                <li><Link href="/website/cars" className="hover:text-white">Car Rental</Link></li>
                <li><Link href="/website/tours" className="hover:text-white">Tours</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/website" className="hover:text-white">About Us</Link></li>
                <li><Link href="/website/gallery" className="hover:text-white">Gallery</Link></li>
                <li><Link href="/website/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>{content['contact_address'] || '123 Main Street, City, State 12345'}</li>
                <li>{content['contact_phone'] || '(123) 456-7890'}</li>
                <li>{content['contact_email'] || 'info@sceneside.com'}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Sceneside L.L.C. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
