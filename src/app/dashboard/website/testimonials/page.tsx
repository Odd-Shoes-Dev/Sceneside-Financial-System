'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Testimonial {
  id: string;
  customer_name: string;
  customer_title: string;
  rating: number;
  comment: string;
  testimonial: string;
  content: string;
  service_type: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [filteredTestimonials, setFilteredTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    filterTestimonials();
  }, [testimonials, filter]);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('website_testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTestimonials = () => {
    if (filter === 'all') {
      setFilteredTestimonials(testimonials);
    } else if (filter === 'active') {
      setFilteredTestimonials(testimonials.filter((t) => t.is_active));
    } else {
      setFilteredTestimonials(testimonials.filter((t) => !t.is_active));
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('website_testimonials')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchTestimonials();
    } catch (error) {
      console.error('Error updating testimonial status:', error);
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const { error } = await supabase
        .from('website_testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? (
            <StarIconSolid key={star} className="w-5 h-5 text-yellow-400" />
          ) : (
            <StarIcon key={star} className="w-5 h-5 text-gray-300" />
          )
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sceneside-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/website"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
            <p className="text-gray-600 mt-1">Manage customer reviews and feedback</p>
          </div>
        </div>
        <Link href="/dashboard/website/testimonials/new" className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Testimonial
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({testimonials.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active ({testimonials.filter((t) => t.is_active).length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'inactive'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Inactive ({testimonials.filter((t) => !t.is_active).length})
        </button>
      </div>

      {/* Testimonials List */}
      {filteredTestimonials.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <ChatBubbleLeftIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No testimonials yet' : `No ${filter} testimonials`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Add your first customer testimonial'
                : `No testimonials match the ${filter} filter`}
            </p>
            {filter === 'all' && (
              <Link href="/dashboard/website/testimonials/new" className="btn-primary">
                <PlusIcon className="w-5 h-5 mr-2" />
                Add First Testimonial
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTestimonials.map((testimonial) => (
            <div key={testimonial.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {testimonial.customer_name}
                      </h3>
                      {testimonial.is_featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                          Featured
                        </span>
                      )}
                      {!testimonial.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                          Inactive
                        </span>
                      )}
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        {testimonial.service_type}
                      </span>
                    </div>
                    {testimonial.customer_title && (
                      <p className="text-sm text-gray-600 mb-2">{testimonial.customer_title}</p>
                    )}
                    <div className="mb-3">{renderStars(testimonial.rating)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/website/testimonials/${testimonial.id}/edit`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </Link>

                    <button
                      onClick={() => toggleActive(testimonial.id, testimonial.is_active)}
                      className={`px-3 py-1 rounded-lg font-medium text-sm transition-colors ${
                        testimonial.is_active
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {testimonial.is_active ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      onClick={() => deleteTestimonial(testimonial.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <blockquote className="text-gray-700 italic border-l-4 border-sceneside-navy pl-4">
                  "{testimonial.comment || testimonial.testimonial || testimonial.content}"
                </blockquote>

                <p className="text-xs text-gray-500 mt-3">
                  Added on {new Date(testimonial.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
