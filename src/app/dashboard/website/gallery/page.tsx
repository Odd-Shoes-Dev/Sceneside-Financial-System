'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  TagIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface GalleryImage {
  id: string;
  title: string;
  image_url: string;
  category: string;
  tags: string[];
  created_at: string;
}

interface ImageFile {
  file: File;
  preview: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');

  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>([]);
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  const categories = ['General', 'Hotels', 'Cars', 'Tours', 'Destinations', 'Activities'];

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('website_gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: ImageFile[] = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push({
          file,
          preview: reader.result as string,
        });
        if (newImages.length === files.length) {
          setSelectedFiles((prev) => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    
    const newImages: ImageFile[] = [];
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push({
          file,
          preview: reader.result as string,
        });
        if (newImages.length === imageFiles.length) {
          setSelectedFiles((prev) => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `gallery/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('website-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('website-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const tagArray = tags.split(',').map((t) => t.trim()).filter((t) => t);

      // Upload all images
      const uploadPromises = selectedFiles.map(async (imageFile, index) => {
        const imageUrl = await uploadImage(imageFile.file);
        return {
          title: `${category} Image ${index + 1}`,
          image_url: imageUrl,
          category,
          tags: tagArray,
        };
      });

      const imageData = await Promise.all(uploadPromises);

      const { error: insertError } = await supabase
        .from('website_gallery')
        .insert(imageData);

      if (insertError) throw insertError;

      // Reset form
      setSelectedFiles([]);
      setCategory('General');
      setTags('');
      setShowUploadForm(false);

      fetchImages();
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (id: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const { error } = await supabase
        .from('website_gallery')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete from storage
      const path = imageUrl.split('/').pop();
      if (path) {
        await supabase.storage
          .from('website-images')
          .remove([`gallery/${path}`]);
      }

      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const filteredImages = filter === 'all' 
    ? images 
    : images.filter((img) => img.category === filter);

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
        <div>
          <Link 
            href="/dashboard/website" 
            className="text-gray-600 hover:text-sceneside-navy mb-2 inline-flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Website
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-600 mt-1">Manage your image library</p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Upload Image
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Upload Images</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-sceneside-navy transition-colors"
              >
                <PhotoIcon className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop images here, or</p>
                <label className="btn-primary cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesChange}
                    className="hidden"
                  />
                  Choose Images
                </label>
                <p className="text-sm text-gray-500 mt-2">You can select multiple images</p>
              </div>

              {/* Selected Images Preview */}
              {selectedFiles.length > 0 && (
                <div>
                  <label className="label">Selected Images ({selectedFiles.length})</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedFiles.map((imageFile, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageFile.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="input"
                    placeholder="e.g., summer, beach, sunset"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false);
                    setSelectedFiles([]);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || selectedFiles.length === 0}
                  className="btn-primary"
                >
                  {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({images.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === cat
                ? 'bg-sceneside-navy text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat} ({images.filter((img) => img.category === cat).length})
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {filteredImages.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <PhotoIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No images yet
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your first image to get started
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100"
            >
              <img
                src={image.image_url}
                alt={image.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                <h4 className="text-white font-medium mb-2 px-2 text-center">
                  {image.title}
                </h4>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-white bg-opacity-20 text-white text-xs rounded">
                    {image.category}
                  </span>
                </div>
                {image.tags && image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3 px-2">
                    {image.tags.map((tag, i) => (
                      <span key={i} className="text-xs text-white bg-white bg-opacity-20 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => deleteImage(image.id, image.image_url)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
