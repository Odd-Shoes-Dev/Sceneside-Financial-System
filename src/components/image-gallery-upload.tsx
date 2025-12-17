'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  PhotoIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  StarIcon as StarOutlineIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface ImageItem {
  url: string;
  file?: File;
  isNew?: boolean;
}

interface ImageGalleryUploadProps {
  images: ImageItem[];
  primaryImageIndex: number;
  onChange: (images: ImageItem[], primaryIndex: number) => void;
  storageFolder: string; // e.g., 'hotels', 'cars', 'tours'
  maxImages?: number;
}

export default function ImageGalleryUpload({
  images,
  primaryImageIndex,
  onChange,
  storageFolder,
  maxImages = 10,
}: ImageGalleryUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: ImageItem[] = [];
    
    // Convert FileList to array and limit number of images
    const fileArray = Array.from(files).slice(0, maxImages - images.length);

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) continue;

      // Create preview URL
      const reader = new FileReader();
      const preview = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newImages.push({
        url: preview,
        file,
        isNew: true,
      });
    }

    // Add new images to the gallery
    const updatedImages = [...images, ...newImages];
    onChange(updatedImages, primaryImageIndex);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    let newPrimaryIndex = primaryImageIndex;

    // Adjust primary index if needed
    if (index === primaryImageIndex) {
      newPrimaryIndex = 0;
    } else if (index < primaryImageIndex) {
      newPrimaryIndex = primaryImageIndex - 1;
    }

    onChange(updatedImages, Math.max(0, newPrimaryIndex));
  };

  const setPrimaryImage = (index: number) => {
    onChange(images, index);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap images
    [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];

    // Adjust primary index if needed
    let newPrimaryIndex = primaryImageIndex;
    if (primaryImageIndex === index) {
      newPrimaryIndex = swapIndex;
    } else if (primaryImageIndex === swapIndex) {
      newPrimaryIndex = index;
    }

    onChange(newImages, newPrimaryIndex);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-sceneside-navy bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop images here, or click to select
        </p>
        <label className="btn-primary cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={images.length >= maxImages}
          />
          Choose Images
        </label>
        <p className="text-xs text-gray-500 mt-2">
          {images.length}/{maxImages} images • Recommended: 1920x1080px or higher
        </p>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="label">Images</label>
            <p className="text-xs text-gray-500">
              Click the star to set as primary image
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden border-2 transition-all"
                style={{
                  borderColor: index === primaryImageIndex ? '#1e40af' : '#e5e7eb',
                }}
              >
                {/* Image */}
                <div className="aspect-video bg-gray-100">
                  <img
                    src={image.url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all">
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Set as Primary */}
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Set as primary image"
                    >
                      {index === primaryImageIndex ? (
                        <StarSolidIcon className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <StarOutlineIcon className="w-5 h-5 text-gray-700" />
                      )}
                    </button>

                    {/* Move Up */}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'up')}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Move up"
                      >
                        <ArrowUpIcon className="w-5 h-5 text-gray-700" />
                      </button>
                    )}

                    {/* Move Down */}
                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'down')}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Move down"
                      >
                        <ArrowDownIcon className="w-5 h-5 text-gray-700" />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Delete image"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Primary Badge */}
                {index === primaryImageIndex && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <StarSolidIcon className="w-3 h-3" />
                    Primary
                  </div>
                )}

                {/* Position Badge */}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="text-center py-4">
          <div className="animate-spin h-8 w-8 border-4 border-sceneside-navy border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-gray-600 mt-2">Uploading images...</p>
        </div>
      )}
    </div>
  );
}

// Helper function to upload images to Supabase Storage
export async function uploadImagesToStorage(
  images: ImageItem[],
  storageFolder: string,
  primaryIndex: number
): Promise<{ featuredImage: string; galleryImages: string[] }> {
  const uploadedUrls: string[] = [];

  for (const image of images) {
    if (image.isNew && image.file) {
      // Upload new image
      const fileExt = image.file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${storageFolder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('website-images')
        .upload(filePath, image.file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('website-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    } else {
      // Keep existing image URL
      uploadedUrls.push(image.url);
    }
  }

  // Set primary image and gallery images
  const featuredImage = uploadedUrls[primaryIndex] || uploadedUrls[0] || '';
  const galleryImages = uploadedUrls.filter((_, index) => index !== primaryIndex);

  return { featuredImage, galleryImages };
}

// Helper function to delete image from storage
export async function deleteImageFromStorage(imageUrl: string, storageFolder: string) {
  if (!imageUrl) return;

  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${storageFolder}/${fileName}`;

    await supabase.storage.from('website-images').remove([filePath]);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}
