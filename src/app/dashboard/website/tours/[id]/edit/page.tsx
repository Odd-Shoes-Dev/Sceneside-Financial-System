'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeftIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import ImageGalleryUpload, { uploadImagesToStorage, deleteImageFromStorage } from '@/components/image-gallery-upload';

interface ImageItem {
  url: string;
  file?: File;
  isNew?: boolean;
}

export default function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tourId, setTourId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    duration_days: 1,
    price_per_person: 0,
    group_discount_percentage: 0,
    max_group_size: 10,
    difficulty_level: 'Easy',
    description: '',
    highlights: [] as string[],
    itinerary: [] as string[],
    inclusions: [] as string[],
    exclusions: [] as string[],
    is_featured: false,
    is_active: true,
    featured_image: '',
    gallery_images: [] as string[],
  });

  const [images, setImages] = useState<ImageItem[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  
  const [newHighlight, setNewHighlight] = useState('');
  const [newItinerary, setNewItinerary] = useState('');
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  const difficultyLevels = ['Easy', 'Moderate', 'Challenging', 'Difficult'];

  useEffect(() => {
    params.then(p => {
      setTourId(p.id);
      fetchTour(p.id);
    });
  }, []);

  const fetchTour = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('website_tours')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData(data);
        
        // Load existing images
        const allImages: ImageItem[] = [];
        if (data.featured_image) {
          allImages.push({ url: data.featured_image, isNew: false });
        }
        if (data.gallery_images && Array.isArray(data.gallery_images)) {
          data.gallery_images.forEach((url: string) => {
            allImages.push({ url, isNew: false });
          });
        }
        
        setImages(allImages);
        setOriginalImages([data.featured_image, ...(data.gallery_images || [])].filter(Boolean));
      }
    } catch (err) {
      console.error('Error fetching tour:', err);
      setError('Failed to load tour');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Upload all images
      const { featuredImage, galleryImages } = await uploadImagesToStorage(
        images,
        'tours',
        primaryImageIndex
      );

      // Delete removed images
      const currentImageUrls = images.map(img => img.url);
      for (const oldUrl of originalImages) {
        if (!currentImageUrls.includes(oldUrl)) {
          await deleteImageFromStorage(oldUrl, 'tours');
        }
      }

      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Update tour
      const { error: updateError } = await supabase
        .from('website_tours')
        .update({
          ...formData,
          slug,
          featured_image: featuredImage,
          gallery_images: galleryImages,
        })
        .eq('id', tourId);

      if (updateError) throw updateError;

      router.push('/dashboard/website/tours');
    } catch (err) {
      console.error('Error updating tour:', err);
      setError(err instanceof Error ? err.message : 'Failed to update tour');
    } finally {
      setLoading(false);
    }
  };

  const addToArray = (field: keyof typeof formData, value: string) => {
    if (value.trim()) {
      setFormData({
        ...formData,
        [field]: [...(formData[field] as string[]), value.trim()],
      });
    }
  };

  const removeFromArray = (field: keyof typeof formData, index: number) => {
    setFormData({
      ...formData,
      [field]: (formData[field] as string[]).filter((_, i) => i !== index),
    });
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sceneside-navy"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/website/tours"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Tour</h1>
          <p className="text-gray-600 mt-1">{formData.name}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">
                  Tour Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Grand Canyon Adventure"
                  required
                />
              </div>

              <div>
                <label className="label">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input"
                  placeholder="e.g., Arizona, USA"
                  required
                />
              </div>

              <div>
                <label className="label">Duration (Days)</label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                  className="input"
                  min="1"
                />
              </div>

              <div>
                <label className="label">
                  Price per Person <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.price_per_person}
                    onChange={(e) => setFormData({ ...formData, price_per_person: Number(e.target.value) })}
                    className="input pl-7"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Group Discount (%)</label>
                <input
                  type="number"
                  value={formData.group_discount_percentage}
                  onChange={(e) => setFormData({ ...formData, group_discount_percentage: Number(e.target.value) })}
                  className="input"
                  min="0"
                  max="100"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="label">Max Group Size</label>
                <input
                  type="number"
                  value={formData.max_group_size}
                  onChange={(e) => setFormData({ ...formData, max_group_size: Number(e.target.value) })}
                  className="input"
                  min="1"
                />
              </div>

              <div>
                <label className="label">Difficulty Level</label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                  className="input"
                >
                  {difficultyLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Description</h2>
          </div>
          <div className="card-body">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={6}
              placeholder="Describe the tour experience..."
            />
          </div>
        </div>

        {/* Image Gallery */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Tour Images</h2>
          </div>
          <div className="card-body">
            <ImageGalleryUpload
              images={images}
              primaryImageIndex={primaryImageIndex}
              onChange={(newImages, newPrimaryIndex) => {
                setImages(newImages);
                setPrimaryImageIndex(newPrimaryIndex);
              }}
              storageFolder="tours"
              maxImages={10}
            />
          </div>
        </div>

        {/* Highlights */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Tour Highlights</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                className="input flex-1"
                placeholder="Add a highlight"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('highlights', newHighlight);
                    setNewHighlight('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  addToArray('highlights', newHighlight);
                  setNewHighlight('');
                }}
                className="btn-primary"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>

            {formData.highlights.length > 0 && (
              <ul className="space-y-2">
                {formData.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1">{highlight}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('highlights', index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <MinusIcon className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Itinerary */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Daily Itinerary</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newItinerary}
                onChange={(e) => setNewItinerary(e.target.value)}
                className="input flex-1"
                placeholder="Add day activity (e.g., Day 1: Arrival and hotel check-in)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('itinerary', newItinerary);
                    setNewItinerary('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  addToArray('itinerary', newItinerary);
                  setNewItinerary('');
                }}
                className="btn-primary"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>

            {formData.itinerary.length > 0 && (
              <ul className="space-y-2">
                {formData.itinerary.map((day, index) => (
                  <li key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded">
                    <span className="flex-1">{day}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('itinerary', index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <MinusIcon className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Inclusions & Exclusions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inclusions */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Inclusions</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  className="input flex-1"
                  placeholder="What's included"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('inclusions', newInclusion);
                      setNewInclusion('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    addToArray('inclusions', newInclusion);
                    setNewInclusion('');
                  }}
                  className="btn-secondary"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>

              {formData.inclusions.length > 0 && (
                <ul className="space-y-2">
                  {formData.inclusions.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <span className="flex-1">✓ {item}</span>
                      <button
                        type="button"
                        onClick={() => removeFromArray('inclusions', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Exclusions */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Exclusions</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExclusion}
                  onChange={(e) => setNewExclusion(e.target.value)}
                  className="input flex-1"
                  placeholder="What's not included"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('exclusions', newExclusion);
                      setNewExclusion('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    addToArray('exclusions', newExclusion);
                    setNewExclusion('');
                  }}
                  className="btn-secondary"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>

              {formData.exclusions.length > 0 && (
                <ul className="space-y-2">
                  {formData.exclusions.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded text-sm">
                      <span className="flex-1">✗ {item}</span>
                      <button
                        type="button"
                        onClick={() => removeFromArray('exclusions', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Settings</h2>
          </div>
          <div className="card-body space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-sceneside-navy focus:ring-sceneside-navy"
              />
              <div>
                <span className="font-medium text-gray-900">Featured Tour</span>
                <p className="text-sm text-gray-600">Display this tour prominently</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-sceneside-navy focus:ring-sceneside-navy"
              />
              <div>
                <span className="font-medium text-gray-900">Active</span>
                <p className="text-sm text-gray-600">Show this tour on the public website</p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/website/tours" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Updating...' : 'Update Tour'}
          </button>
        </div>
      </form>
    </div>
  );
}
