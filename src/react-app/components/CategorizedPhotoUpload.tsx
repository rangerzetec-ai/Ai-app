import { useState, useRef } from "react";
import { Camera, Upload, X, FileImage, Eye, Brain, Home, Wrench } from "lucide-react";

export type PhotoCategory = "site_condition" | "structural_damage" | "foundation_issues" | "psych_photos" | "before_after" | "equipment" | "other";

export interface CategorizedPhoto {
  id?: number;
  url: string;
  type: PhotoCategory;
  filename?: string;
  description?: string;
}

interface CategorizedPhotoUploadProps {
  appointmentId?: number;
  existingPhotos?: CategorizedPhoto[];
  onPhotosChanged?: (photos: CategorizedPhoto[]) => void;
  className?: string;
}

const PHOTO_CATEGORIES: { value: PhotoCategory; label: string; icon: React.ComponentType<any>; color: string; description: string }[] = [
  {
    value: "site_condition",
    label: "Site Conditions",
    icon: Home,
    color: "blue",
    description: "Overall property and site conditions"
  },
  {
    value: "structural_damage",
    label: "Structural Damage",
    icon: Wrench,
    color: "red",
    description: "Visible structural issues and damage"
  },
  {
    value: "foundation_issues",
    label: "Foundation Issues",
    icon: FileImage,
    color: "orange",
    description: "Foundation-specific problems and concerns"
  },
  {
    value: "psych_photos",
    label: "Psychological Impact",
    icon: Brain,
    color: "purple",
    description: "Photos showing emotional/psychological impact on homeowners"
  },
  {
    value: "before_after",
    label: "Before/After",
    icon: Eye,
    color: "green",
    description: "Comparison photos showing improvements"
  },
  {
    value: "equipment",
    label: "Equipment & Tools",
    icon: Wrench,
    color: "slate",
    description: "Equipment, tools, and installation process"
  },
  {
    value: "other",
    label: "Other",
    icon: Camera,
    color: "slate",
    description: "Miscellaneous photos"
  }
];

export default function CategorizedPhotoUpload({
  appointmentId,
  existingPhotos = [],
  onPhotosChanged,
  className = "",
}: CategorizedPhotoUploadProps) {
  const [photos, setPhotos] = useState<CategorizedPhoto[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>("site_condition");
  const [expandedCategory, setExpandedCategory] = useState<PhotoCategory | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !appointmentId) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("photoType", selectedCategory);
        formData.append("filename", file.name);
        
        const response = await fetch(`/api/appointments/${appointmentId}/upload-categorized-photo`, {
          method: "POST",
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          return {
            id: result.id,
            url: result.url,
            type: selectedCategory,
            filename: file.name,
            description: ""
          } as CategorizedPhoto;
        }
        return null;
      });

      const newPhotos = await Promise.all(uploadPromises);
      const validPhotos = newPhotos.filter(photo => photo !== null) as CategorizedPhoto[];
      
      const updatedPhotos = [...photos, ...validPhotos];
      setPhotos(updatedPhotos);
      onPhotosChanged?.(updatedPhotos);
      
      // Auto-expand the category we just uploaded to
      setExpandedCategory(selectedCategory);
    } catch (error) {
      console.error("Failed to upload photos:", error);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photoIndex: number) => {
    const photo = photos[photoIndex];
    if (photo.id && appointmentId) {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}/photos/${photo.id}`, {
          method: "DELETE",
        });
        
        if (response.ok) {
          const updatedPhotos = photos.filter((_, i) => i !== photoIndex);
          setPhotos(updatedPhotos);
          onPhotosChanged?.(updatedPhotos);
        }
      } catch (error) {
        console.error("Failed to remove photo:", error);
      }
    }
  };

  const updatePhotoDescription = async (photoIndex: number, description: string) => {
    const photo = photos[photoIndex];
    if (photo.id && appointmentId) {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}/photos/${photo.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ description }),
        });
        
        if (response.ok) {
          const updatedPhotos = [...photos];
          updatedPhotos[photoIndex] = { ...photo, description };
          setPhotos(updatedPhotos);
          onPhotosChanged?.(updatedPhotos);
        }
      } catch (error) {
        console.error("Failed to update photo description:", error);
      }
    }
  };

  const getPhotosForCategory = (category: PhotoCategory) => {
    return photos.filter(photo => photo.type === category);
  };

  const getCategoryColor = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      red: "bg-red-100 text-red-800 border-red-200", 
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      green: "bg-green-100 text-green-800 border-green-200",
      slate: "bg-slate-100 text-slate-800 border-slate-200"
    };
    return colors[color as keyof typeof colors] || colors.slate;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Controls */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Photo Documentation</h3>
            <p className="text-sm text-slate-600">Upload photos from camera or gallery, organized by category for comprehensive documentation</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as PhotoCategory)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              {PHOTO_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !appointmentId}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Photos"}
            </button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>

      {/* Photo Categories */}
      <div className="space-y-4">
        {PHOTO_CATEGORIES.map((category) => {
          const categoryPhotos = getPhotosForCategory(category.value);
          const isExpanded = expandedCategory === category.value;
          const hasPhotos = categoryPhotos.length > 0;
          
          return (
            <div key={category.value} className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.value)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(category.color)}`}>
                    <category.icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-slate-900">{category.label}</h4>
                    <p className="text-xs text-slate-600">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {hasPhotos && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category.color)}`}>
                      {categoryPhotos.length}
                    </span>
                  )}
                  <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ↓
                  </div>
                </div>
              </button>
              
              {(isExpanded || hasPhotos) && (
                <div className="px-4 pb-4">
                  {categoryPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {categoryPhotos.map((photo, index) => {
                        const globalIndex = photos.findIndex(p => p === photo);
                        return (
                          <div key={index} className="relative group">
                            <img
                              src={`/api/files/${photo.url}`}
                              alt={`${category.label} ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-slate-200"
                            />
                            <button
                              onClick={() => removePhoto(globalIndex)}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            
                            {/* Description input */}
                            <div className="mt-1">
                              <input
                                type="text"
                                placeholder="Add description..."
                                value={photo.description || ""}
                                onChange={(e) => updatePhotoDescription(globalIndex, e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                      <category.icon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">No {category.label.toLowerCase()} uploaded</p>
                      <p className="text-xs text-slate-500 mt-1">{category.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {uploading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-slate-600">Uploading photos...</span>
        </div>
      )}
    </div>
  );
}
