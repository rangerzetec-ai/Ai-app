import { useState, useRef } from "react";
import { Camera, Upload, X, FileImage } from "lucide-react";

interface AppointmentMediaUploadProps {
  appointmentId?: number;
  onPhotoUploaded?: (photoUrl: string) => void;
  onSketchUploaded?: (sketchUrl: string, filename: string) => void;
  existingPhotos?: string[];
  existingSketch?: { url: string; filename: string } | null;
  className?: string;
}

export default function AppointmentMediaUpload({
  appointmentId,
  onPhotoUploaded,
  onSketchUploaded,
  existingPhotos = [],
  existingSketch = null,
  className = "",
}: AppointmentMediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [sketch, setSketch] = useState<{ url: string; filename: string } | null>(existingSketch);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const sketchInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !appointmentId) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("photo", file);
        
        const response = await fetch(`/api/appointments/${appointmentId}/upload-photo`, {
          method: "POST",
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          return result.url;
        }
        return null;
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(url => url !== null) as string[];
      
      setPhotos(prev => [...prev, ...validUrls]);
      validUrls.forEach(url => onPhotoUploaded?.(url));
    } catch (error) {
      console.error("Failed to upload photos:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSketchUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !appointmentId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("sketch", file);

      const response = await fetch(`/api/appointments/${appointmentId}/upload-sketch`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const newSketch = { url: result.url, filename: file.name };
        setSketch(newSketch);
        onSketchUploaded?.(result.url, file.name);
      }
    } catch (error) {
      console.error("Failed to upload sketch:", error);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeSketch = () => {
    setSketch(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Site Photos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-700">Site Photos</h3>
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploading || !appointmentId}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Camera className="w-4 h-4 mr-1" />
            Add Photos
          </button>
        </div>
        
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
        
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={`/api/files/${photo}`}
                  alt={`Site photo ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-slate-200"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
            <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No site photos uploaded</p>
            <p className="text-xs text-slate-500 mt-1">Click "Add Photos" to capture site images</p>
          </div>
        )}
      </div>

      {/* Improvement Sketch */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-700">Improvement Sketch</h3>
          {!sketch && (
            <button
              type="button"
              onClick={() => sketchInputRef.current?.click()}
              disabled={uploading || !appointmentId}
              className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload Sketch
            </button>
          )}
        </div>
        
        <input
          ref={sketchInputRef}
          type="file"
          accept="image/*"
          onChange={handleSketchUpload}
          className="hidden"
        />
        
        {sketch ? (
          <div className="relative group">
            <img
              src={`/api/files/${sketch.url}`}
              alt="Improvement sketch"
              className="w-full h-32 object-cover rounded-lg border border-slate-200"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-lg">
              <p className="text-white text-sm font-medium">{sketch.filename}</p>
            </div>
            <button
              onClick={removeSketch}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
            <FileImage className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No improvement sketch uploaded</p>
            <p className="text-xs text-slate-500 mt-1">Upload a sketch to help generate 3D models</p>
          </div>
        )}
      </div>

      {uploading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-slate-600">Uploading...</span>
        </div>
      )}
    </div>
  );
}
