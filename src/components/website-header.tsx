'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface WebsiteHeaderProps {
  title: string;
  description: string;
  activePage?: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
}

export default function WebsiteHeader({ title, description, activePage }: WebsiteHeaderProps) {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadGalleryImages();
  }, []);

  // Rotate background images every 5 seconds
  useEffect(() => {
    if (galleryImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [galleryImages.length]);

  const loadGalleryImages = async () => {
    try {
      const { data, error } = await supabase
        .from('website_gallery')
        .select('id, image_url')
        .limit(10);
      
      if (!error && data) {
        setGalleryImages(data);
      }
    } catch (error) {
      console.error('Error loading gallery images:', error);
    }
  };

  const navLinkClass = (page: string) => 
    activePage === page 
      ? "text-sceneside-navy font-semibold" 
      : "text-gray-700 hover:text-sceneside-navy";

  return (
    <>
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
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <Link href="/website" className={navLinkClass('home')}>Home</Link>
              <Link href="/website/hotels" className={navLinkClass('hotels')}>Hotels</Link>
              <Link href="/website/cars" className={navLinkClass('cars')}>Car Rental</Link>
              <Link href="/website/tours" className={navLinkClass('tours')}>Tours</Link>
              <Link href="/website/gallery" className={navLinkClass('gallery')}>Gallery</Link>
              <Link href="/website/contact" className={navLinkClass('contact')}>Contact</Link>
            </div>
            
            {/* Desktop Book Now Button */}
            <Link href="/website/contact" className="hidden md:block btn-primary">
              Book Now
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-sceneside-navy"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                <Link 
                  href="/website" 
                  className={`${navLinkClass('home')} px-4 py-2`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="/website/hotels" 
                  className={`${navLinkClass('hotels')} px-4 py-2`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Hotels
                </Link>
                <Link 
                  href="/website/cars" 
                  className={`${navLinkClass('cars')} px-4 py-2`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Car Rental
                </Link>
                <Link 
                  href="/website/tours" 
                  className={`${navLinkClass('tours')} px-4 py-2`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tours
                </Link>
                <Link 
                  href="/website/gallery" 
                  className={`${navLinkClass('gallery')} px-4 py-2`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Gallery
                </Link>
                <Link 
                  href="/website/contact" 
                  className={`${navLinkClass('contact')} px-4 py-2`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <Link 
                  href="/website/contact" 
                  className="btn-primary mx-4 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Book Now
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Header with Gallery Background */}
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">{title}</h1>
            <p className="text-xl text-gray-100 drop-shadow-md">{description}</p>
          </div>
        </div>
      </section>
    </>
  );
}
