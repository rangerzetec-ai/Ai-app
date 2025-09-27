import React, { useState, useCallback, useMemo } from "react";
import { X, FileImage, Eye } from "lucide-react";
import { CategorizedPhoto } from "@/shared/types";
import { useImageOptimization } from "@/react-app/hooks/useImageOptimization";
import { useDebounce } from "@/react-app/hooks/useDebounce";

interface OptimizedCategorizedPhotoUploadProps {
  appointmentId: number;
  existingPhotos: CategorizedPhoto[];
  onPhotosChanged: (photos: CategorizedPhoto[]) => void;
  maxPhotosPerCategory?: number;
}

const PHOTO_CATEGORIES = [
  {
    id: 'structural_damage',
    label: 'Structural Damage',
    description: 'Foundation cracks, settling, structural issues',
    color: 'bg-red-50 border-red-200 text-red-700',
    icon: '🏠'
  },
  {
    id: 'psych_photos',
    label: 'Psychological Impact',
    description: 'Before photos showing problems that motivate action',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    icon: '📸'
  },
  {
    id: 'environment',
    label: 'Site Environment',
    description: 'Property layout, access, surrounding conditions',
    color: 'bg-green-50 border-green-200 text-green-700',
    icon: '🌍'
  },
  {
    id: 'measurements',
    label: 'Measurements',
    description: 'Dimensions, levels, technical measurements',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    icon: '📏'
  }
] as const;

const PhotoThumbnail = React.memo(({ 
  photo, 
  onDelete, 
  onDescriptionChange,
  onView 
}: {
  photo: CategorizedPhoto;
  onDelete: () => void;
  onDescriptionChange: (description: string) => void;
  onView: () => void;
}) => {
  const [description, setDescription] = useState(photo.description || "");
  const debouncedDescription = useDebounce(description, 500);

  React.useEffect(() => {
    if (debouncedDescription !== photo.description) {
      onDescriptionChange(debouncedDescription);
    }
  }, [debouncedDescription, photo.description, onDescriptionChange]);

  return (
    <div className="relative group bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="aspect-square bg-slate-100 relative">
        <img
          src={`/api/files/${photo.url}`}
          alt={photo.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <button
                onClick={onView}
                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-3 h-3" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add description..."
          className="w-full text-xs border border-slate-200 rounded px-2 py-1 resize-none"
          rows={2}
        />
      </div>
    </div>
  );
});

export default function OptimizedCategorizedPhotoUpload({
  appointmentId,
  existingPhotos,
  onPhotosChanged,
  maxPhotosPerCategory = 8
}: OptimizedCategorizedPhotoUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'structural_damage' | 'psych_photos' | 'environment' | 'measurements'>('structural_damage');
  const [viewingPhoto, setViewingPhoto] = useState<CategorizedPhoto | null>(null);
  const { optimizeImage, isOptimizing } = useImageOptimization();

  // Memoized photo grouping for performance
  const photosByCategory = useMemo(() => {
    return existingPhotos.reduce((acc, photo) => {
      if (!acc[photo.type]) {
        acc[photo.type] = [];
      }
      acc[photo.type].push(photo);
      return acc;
    }, {} as Record<string, CategorizedPhoto[]>);
  }, [existingPhotos]);

  const handleFileUpload = useCallback(async (files: FileList, category: string) => {
    const existingInCategory = photosByCategory[category]?.length || 0;
    
    if (existingInCategory >= maxPhotosPerCategory) {
      alert(`Maximum ${maxPhotosPerCategory} photos allowed per category`);
      return;
    }

    const filesToUpload = Math.min(files.length, maxPhotosPerCategory - existingInCategory);
    setUploading(category);

    try {
      const uploadPromises = Array.from(files).slice(0, filesToUpload).map(async (file) => {
        // Optimize image before upload
        const optimizedFile = await optimizeImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
          format: 'jpeg'
        });

        const formData = new FormData();
        formData.append("photo", optimizedFile);
        formData.append("photoType", category);
        formData.append("filename", file.name);

        const response = await fetch(`/api/appointments/${appointmentId}/upload-categorized-photo`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        return await response.json();
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      const newPhotos = uploadedPhotos.map(result => ({
        id: result.id,
        url: result.photo_url || result.url,
        type: result.type,
        filename: result.filename,
        description: undefined,
      } as CategorizedPhoto));

      onPhotosChanged([...existingPhotos, ...newPhotos]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(null);
    }
  }, [appointmentId, existingPhotos, onPhotosChanged, photosByCategory, maxPhotosPerCategory, optimizeImage]);

  const deletePhoto = useCallback(async (photoId: number) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/photos/${photoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onPhotosChanged(existingPhotos.filter(p => p.id !== photoId));
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete photo");
    }
  }, [appointmentId, existingPhotos, onPhotosChanged]);

  const updatePhotoDescription = useCallback(async (photoId: number, description: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/photos/${photoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (response.ok) {
        const updatedPhoto = await response.json();
        onPhotosChanged(existingPhotos.map(p => 
          p.id === photoId ? { ...p, description: updatedPhoto.description } : p
        ));
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  }, [appointmentId, existingPhotos, onPhotosChanged]);

  const totalPhotos = existingPhotos.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Photo Documentation</h3>
          <p className="text-sm text-slate-600">
            Organize photos by category for better project documentation
          </p>
        </div>
        <div className="text-sm text-slate-500">
          {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} total
        </div>
      </div>

      {/* Category Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PHOTO_CATEGORIES.map(category => {
          const categoryPhotos = photosByCategory[category.id] || [];
          const isSelected = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected 
                  ? category.color + ' border-current shadow-md' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{category.icon}</span>
                <span className="text-xs font-medium">
                  {categoryPhotos.length}/{maxPhotosPerCategory}
                </span>
              </div>
              <div className="font-medium text-sm mb-1">{category.label}</div>
              <div className="text-xs opacity-75">{category.description}</div>
            </button>
          );
        })}
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
        <div className="text-center">
          <FileImage className="mx-auto h-8 w-8 text-slate-400 mb-3" />
          <div className="mb-2">
            <label
              htmlFor={`photo-upload-${selectedCategory}`}
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
            >
              Upload photos for {PHOTO_CATEGORIES.find(c => c.id === selectedCategory)?.label}
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Images will be optimized automatically. Max {maxPhotosPerCategory} per category.
          </p>
          <input
            id={`photo-upload-${selectedCategory}`}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files, selectedCategory)}
            className="hidden"
            disabled={uploading !== null || isOptimizing}
          />
        </div>
      </div>

      {/* Upload Status */}
      {(uploading || isOptimizing) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-3"></div>
            <span className="text-sm text-blue-700">
              {isOptimizing ? "Optimizing images..." : "Uploading photos..."}
            </span>
          </div>
        </div>
      )}

      {/* Selected Category Photos */}
      {selectedCategory && (
        <div>
          <h4 className="font-medium text-slate-900 mb-3">
            {PHOTO_CATEGORIES.find(c => c.id === selectedCategory)?.label} Photos
          </h4>
          
          {photosByCategory[selectedCategory]?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photosByCategory[selectedCategory].map(photo => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  onDelete={() => deletePhoto(photo.id!)}
                  onDescriptionChange={(description) => updatePhotoDescription(photo.id!, description)}
                  onView={() => setViewingPhoto(photo)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileImage className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No photos in this category yet</p>
            </div>
          )}
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setViewingPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={`/api/files/${viewingPhoto.url}`}
              alt={viewingPhoto.filename}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded">
              <div className="font-medium">{viewingPhoto.filename}</div>
              {viewingPhoto.description && (
                <div className="text-sm opacity-90 mt-1">{viewingPhoto.description}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
