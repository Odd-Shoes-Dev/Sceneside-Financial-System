'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import ImageGalleryUpload, { uploadImagesToStorage, deleteImageFromStorage } from '@/components/image-gallery-upload';

interface ImageItem {
  url: string;
  file?: File;
  isNew?: boolean;
}

export default function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: '',
    state: '',
    zip_code: '',
    address: '',
    phone: '',
    email: '',
    website_url: '',
    star_rating: 3,
    price_range: '',
    short_description: '',
    description: '',
    amenities: [] as string[],
    is_featured: false,
    is_active: true,
    featured_image: '',
    gallery_images: [] as string[],
  });

  const [images, setImages] = useState<ImageItem[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');

  const commonAmenities = [
    'Free WiFi',
    'Swimming Pool',
    'Fitness Center',
    'Restaurant',
    'Bar/Lounge',
    'Room Service',
    'Free Parking',
    'Airport Shuttle',
    'Pet Friendly',
    'Business Center',
    'Spa',
    'Air Conditioning',
    'Laundry Service',
    '24-Hour Front Desk',
  ];

  useEffect(() => {
    params.then(p => {
      setHotelId(p.id);
      fetchHotel(p.id);
    });
  }, []);

  const fetchHotel = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('website_hotels')
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
      console.error('Error fetching hotel:', err);
      setError('Failed to load hotel');
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
        'hotels',
        primaryImageIndex
      );

      // Delete removed images
      const currentImageUrls = images.map(img => img.url);
      for (const oldUrl of originalImages) {
        if (!currentImageUrls.includes(oldUrl)) {
          await deleteImageFromStorage(oldUrl, 'hotels');
        }
      }

      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Update hotel
      const { error: updateError } = await supabase
        .from('website_hotels')
        .update({
          ...formData,
          slug,
          featured_image: featuredImage,
          gallery_images: galleryImages,
        })
        .eq('id', hotelId);

      if (updateError) throw updateError;

      router.push('/dashboard/website/hotels');
    } catch (err) {
      console.error('Error updating hotel:', err);
      setError(err instanceof Error ? err.message : 'Failed to update hotel');
    } finally {
      setLoading(false);
    }
  };

  const addAmenity = (amenity: string) => {
    if (!formData.amenities.includes(amenity)) {
      setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((a) => a !== amenity),
    });
  };

  const addCustomAmenity = () => {
    if (newAmenity && !formData.amenities.includes(newAmenity)) {
      setFormData({ ...formData, amenities: [...formData.amenities, newAmenity] });
      setNewAmenity('');
    }
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/website/hotels"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Hotel</h1>
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
                  Hotel Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">City <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">State <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Zip Code</label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Website URL</label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Star Rating</label>
                <select
                  value={formData.star_rating}
                  onChange={(e) => setFormData({ ...formData, star_rating: Number(e.target.value) })}
                  className="input"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} Star{rating > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Price Range</label>
                <input
                  type="text"
                  value={formData.price_range}
                  onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                  className="input"
                  placeholder="e.g., $150-$300/night"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Descriptions */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Descriptions</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">Short Description</label>
              <textarea
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                className="input"
                rows={2}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.short_description?.length || 0}/500 characters
              </p>
            </div>

            <div>
              <label className="label">Full Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={6}
              />
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Images</h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload multiple images. The primary image will be shown in listings.
            </p>
          </div>
          <div className="card-body">
            <ImageGalleryUpload
              images={images}
              primaryImageIndex={primaryImageIndex}
              onChange={(newImages, newPrimaryIndex) => {
                setImages(newImages);
                setPrimaryImageIndex(newPrimaryIndex);
              }}
              storageFolder="hotels"
              maxImages={10}
            />
          </div>
        </div>

        {/* Amenities */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Amenities</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="flex flex-wrap gap-2">
              {commonAmenities.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() =>
                    formData.amenities?.includes(amenity)
                      ? removeAmenity(amenity)
                      : addAmenity(amenity)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.amenities?.includes(amenity)
                      ? 'bg-sceneside-navy text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>

            {formData.amenities?.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <label className="label mb-2">Selected Amenities:</label>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="hover:text-blue-900"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <label className="label mb-2">Add Custom Amenity:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  className="input flex-1"
                  placeholder="Enter custom amenity"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                />
                <button
                  type="button"
                  onClick={addCustomAmenity}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
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
                <span className="font-medium text-gray-900">Featured Hotel</span>
                <p className="text-sm text-gray-600">Display prominently on homepage</p>
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
                <p className="text-sm text-gray-600">Show on public website</p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/website/hotels" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
