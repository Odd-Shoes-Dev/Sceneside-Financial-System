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

export default function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carId, setCarId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'Economy',
    seats: 5,
    transmission: 'Automatic',
    fuel_type: 'Gasoline',
    daily_rate: 0,
    weekly_rate: 0,
    monthly_rate: 0,
    mileage_limit: 'Unlimited',
    insurance_included: true,
    description: '',
    features: [] as string[],
    is_featured: false,
    is_active: true,
    featured_image: '',
    gallery_images: [] as string[],
  });

  const [images, setImages] = useState<ImageItem[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');

  const categories = ['Economy', 'Compact', 'Mid-Size', 'Full-Size', 'SUV', 'Luxury', 'Van', 'Truck'];
  const transmissions = ['Automatic', 'Manual'];
  const fuelTypes = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];

  const commonFeatures = [
    'GPS Navigation',
    'Bluetooth',
    'Backup Camera',
    'USB Ports',
    'Apple CarPlay',
    'Android Auto',
    'Cruise Control',
    'Air Conditioning',
    'Power Windows',
    'Power Locks',
    'Keyless Entry',
    'Sunroof',
    'Leather Seats',
    'Heated Seats',
  ];

  useEffect(() => {
    params.then(p => {
      setCarId(p.id);
      fetchCar(p.id);
    });
  }, []);

  const fetchCar = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('website_cars')
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
      console.error('Error fetching car:', err);
      setError('Failed to load car');
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
        'cars',
        primaryImageIndex
      );

      // Delete removed images
      const currentImageUrls = images.map(img => img.url);
      for (const oldUrl of originalImages) {
        if (!currentImageUrls.includes(oldUrl)) {
          await deleteImageFromStorage(oldUrl, 'cars');
        }
      }

      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Update car
      const { error: updateError } = await supabase
        .from('website_cars')
        .update({
          ...formData,
          slug,
          featured_image: featuredImage,
          gallery_images: galleryImages,
        })
        .eq('id', carId);

      if (updateError) throw updateError;

      router.push('/dashboard/website/cars');
    } catch (err) {
      console.error('Error updating car:', err);
      setError(err instanceof Error ? err.message : 'Failed to update car');
    } finally {
      setLoading(false);
    }
  };

  const addFeature = (feature: string) => {
    if (!formData.features.includes(feature)) {
      setFormData({ ...formData, features: [...formData.features, feature] });
    }
  };

  const removeFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter((f) => f !== feature),
    });
  };

  const addCustomFeature = () => {
    if (newFeature && !formData.features.includes(newFeature)) {
      setFormData({ ...formData, features: [...formData.features, newFeature] });
      setNewFeature('');
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
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/website/cars"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Car</h1>
          <p className="text-gray-600 mt-1">{formData.name}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Vehicle Information</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Display Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  className="input"
                  min="2000"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Seats</label>
                <input
                  type="number"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: Number(e.target.value) })}
                  className="input"
                  min="2"
                  max="15"
                />
              </div>

              <div>
                <label className="label">Transmission</label>
                <select
                  value={formData.transmission}
                  onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  className="input"
                >
                  {transmissions.map((trans) => (
                    <option key={trans} value={trans}>{trans}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Fuel Type</label>
                <select
                  value={formData.fuel_type}
                  onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                  className="input"
                >
                  {fuelTypes.map((fuel) => (
                    <option key={fuel} value={fuel}>{fuel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Mileage Limit</label>
                <input
                  type="text"
                  value={formData.mileage_limit}
                  onChange={(e) => setFormData({ ...formData, mileage_limit: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Pricing</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Daily Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({ ...formData, daily_rate: Number(e.target.value) })}
                    className="input pl-7"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="label">Weekly Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.weekly_rate}
                    onChange={(e) => setFormData({ ...formData, weekly_rate: Number(e.target.value) })}
                    className="input pl-7"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="label">Monthly Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.monthly_rate}
                    onChange={(e) => setFormData({ ...formData, monthly_rate: Number(e.target.value) })}
                    className="input pl-7"
                    min="0"
                    step="0.01"
                  />
                </div>
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
              rows={4}
            />
          </div>
        </div>

        {/* Image Gallery */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Image Gallery</h2>
          </div>
          <div className="card-body">
            <ImageGalleryUpload
              images={images}
              primaryImageIndex={primaryImageIndex}
              onChange={(newImages, newPrimaryIndex) => {
                setImages(newImages);
                setPrimaryImageIndex(newPrimaryIndex);
              }}
              storageFolder="cars"
              maxImages={10}
            />
          </div>
        </div>

        {/* Features */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Features</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="flex flex-wrap gap-2">
              {commonFeatures.map((feature) => (
                <button
                  key={feature}
                  type="button"
                  onClick={() =>
                    formData.features?.includes(feature)
                      ? removeFeature(feature)
                      : addFeature(feature)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.features?.includes(feature)
                      ? 'bg-sceneside-navy text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>

            {formData.features?.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <label className="label mb-2">Selected Features:</label>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(feature)}
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
              <label className="label mb-2">Add Custom Feature:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="input flex-1"
                  placeholder="Enter custom feature"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomFeature())}
                />
                <button
                  type="button"
                  onClick={addCustomFeature}
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
                checked={formData.insurance_included}
                onChange={(e) => setFormData({ ...formData, insurance_included: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-sceneside-navy focus:ring-sceneside-navy"
              />
              <div>
                <span className="font-medium text-gray-900">Insurance Included</span>
                <p className="text-sm text-gray-600">Basic insurance included in rental price</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-sceneside-navy focus:ring-sceneside-navy"
              />
              <div>
                <span className="font-medium text-gray-900">Featured Vehicle</span>
                <p className="text-sm text-gray-600">Display prominently</p>
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
          <Link href="/dashboard/website/cars" className="btn-secondary">
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
