'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  UserGroupIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalCars: 0,
    totalTours: 0,
    totalInquiries: 0,
    totalTestimonials: 0,
    activeHotels: 0,
    activeCars: 0,
    activeTours: 0,
    newInquiries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [hotels, cars, tours, inquiries, testimonials] = await Promise.all([
        supabase.from('website_hotels').select('id, is_active', { count: 'exact' }),
        supabase.from('website_cars').select('id, is_active', { count: 'exact' }),
        supabase.from('website_tours').select('id, is_active', { count: 'exact' }),
        supabase.from('website_inquiries').select('id, status', { count: 'exact' }),
        supabase.from('website_testimonials').select('id', { count: 'exact' }),
      ]);

      setStats({
        totalHotels: hotels.count || 0,
        totalCars: cars.count || 0,
        totalTours: tours.count || 0,
        totalInquiries: inquiries.count || 0,
        totalTestimonials: testimonials.count || 0,
        activeHotels: hotels.data?.filter(h => h.is_active).length || 0,
        activeCars: cars.data?.filter(c => c.is_active).length || 0,
        activeTours: tours.data?.filter(t => t.is_active).length || 0,
        newInquiries: inquiries.data?.filter(i => i.status === 'new').length || 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-sceneside-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/website"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Analytics</h1>
          <p className="text-gray-600 mt-1">Website performance and insights</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalHotels}</h3>
          <p className="text-gray-600 text-sm">Total Hotels</p>
          <p className="text-xs text-green-600 mt-1">{stats.activeHotels} active</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalCars}</h3>
          <p className="text-gray-600 text-sm">Total Vehicles</p>
          <p className="text-xs text-green-600 mt-1">{stats.activeCars} active</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalTours}</h3>
          <p className="text-gray-600 text-sm">Total Tours</p>
          <p className="text-xs text-green-600 mt-1">{stats.activeTours} active</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <EnvelopeIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</h3>
          <p className="text-gray-600 text-sm">Total Inquiries</p>
          <p className="text-xs text-orange-600 mt-1">{stats.newInquiries} new</p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Summary */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Hotels</span>
              <span className="font-semibold text-gray-900">
                {stats.activeHotels} / {stats.totalHotels} active
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Vehicles</span>
              <span className="font-semibold text-gray-900">
                {stats.activeCars} / {stats.totalCars} active
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Tours</span>
              <span className="font-semibold text-gray-900">
                {stats.activeTours} / {stats.totalTours} active
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Testimonials</span>
              <span className="font-semibold text-gray-900">{stats.totalTestimonials}</span>
            </div>
          </div>
        </div>

        {/* Inquiry Status */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inquiries</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Total Inquiries</span>
              <span className="font-semibold text-gray-900">{stats.totalInquiries}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">New</span>
              <span className="font-semibold text-orange-600">{stats.newInquiries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Processed</span>
              <span className="font-semibold text-green-600">
                {stats.totalInquiries - stats.newInquiries}
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/website/inquiries"
            className="mt-4 block text-center text-sceneside-navy font-medium hover:underline"
          >
            View All Inquiries →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/website/hotels/new"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-sceneside-navy hover:bg-blue-50 transition-colors text-center"
          >
            <p className="font-medium text-gray-900">Add New Hotel</p>
          </Link>
          <Link
            href="/dashboard/website/cars/new"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-sceneside-navy hover:bg-blue-50 transition-colors text-center"
          >
            <p className="font-medium text-gray-900">Add New Vehicle</p>
          </Link>
          <Link
            href="/dashboard/website/tours/new"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-sceneside-navy hover:bg-blue-50 transition-colors text-center"
          >
            <p className="font-medium text-gray-900">Add New Tour</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
