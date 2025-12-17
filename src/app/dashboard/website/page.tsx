'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GlobeAltIcon,
  BuildingOffice2Icon,
  TruckIcon,
  MapIcon,
  PhotoIcon,
  ChatBubbleBottomCenterTextIcon,
  EnvelopeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function WebsiteManagementPage() {
  const [stats, setStats] = useState({
    hotels: 0,
    cars: 0,
    tours: 0,
    inquiries: 0,
    testimonials: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/website/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const sections = [
    {
      title: 'Hotels',
      description: 'Manage hotel listings and accommodations',
      icon: BuildingOffice2Icon,
      href: '/dashboard/website/hotels',
      count: stats.hotels,
      color: 'bg-blue-500',
    },
    {
      title: 'Car Hire',
      description: 'Manage vehicle fleet and rental options',
      icon: TruckIcon,
      href: '/dashboard/website/cars',
      count: stats.cars,
      color: 'bg-green-500',
    },
    {
      title: 'Tours & Packages',
      description: 'Manage tour packages and destinations',
      icon: MapIcon,
      href: '/dashboard/website/tours',
      count: stats.tours,
      color: 'bg-purple-500',
    },
    {
      title: 'Website Content',
      description: 'Edit homepage, about, and general content',
      icon: GlobeAltIcon,
      href: '/dashboard/website/content',
      count: null,
      color: 'bg-orange-500',
    },
    {
      title: 'Gallery',
      description: 'Manage photo library and media',
      icon: PhotoIcon,
      href: '/dashboard/website/gallery',
      count: null,
      color: 'bg-pink-500',
    },
    {
      title: 'Testimonials',
      description: 'Customer reviews and testimonials',
      icon: ChatBubbleBottomCenterTextIcon,
      href: '/dashboard/website/testimonials',
      count: stats.testimonials,
      color: 'bg-yellow-500',
    },
    {
      title: 'Inquiries',
      description: 'Booking requests and contact forms',
      icon: EnvelopeIcon,
      href: '/dashboard/website/inquiries',
      count: stats.inquiries,
      color: 'bg-red-500',
    },
    {
      title: 'Analytics',
      description: 'Website performance and insights',
      icon: ChartBarIcon,
      href: '/dashboard/website/analytics',
      count: null,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Website Management</h1>
        <p className="text-gray-600 mt-1">
          Manage your public tourism website content
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/website/hotels/new"
          className="btn-primary text-sm"
        >
          Add Hotel
        </Link>
        <Link
          href="/dashboard/website/cars/new"
          className="btn-secondary text-sm"
        >
          Add Vehicle
        </Link>
        <Link
          href="/dashboard/website/tours/new"
          className="btn-secondary text-sm"
        >
          Add Tour
        </Link>
        <a
          href={process.env.NEXT_PUBLIC_WEBSITE_URL || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-sm inline-flex items-center gap-2"
        >
          <GlobeAltIcon className="w-4 h-4" />
          View Public Website
        </a>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 ${section.color} rounded-lg flex items-center justify-center`}>
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{section.title}</h3>
                      {section.count !== null && (
                        <p className="text-sm text-gray-500">{section.count} items</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <GlobeAltIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">About Website Management</h4>
            <p className="text-sm text-blue-700 mt-1">
              All content you manage here will be displayed on your public tourism website.
              Changes are reflected immediately after saving. Make sure to upload high-quality
              images and write compelling descriptions to attract customers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
