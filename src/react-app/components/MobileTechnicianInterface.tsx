import { useState, useRef } from "react";
import { 
  Camera, 
  Save, 
  Upload, 
  Grid, 
  MapPin,
  FileText,
  Image as ImageIcon,
  Plus
} from "lucide-react";
import { Appointment, PierPlacements, CategorizedPhoto } from "@/shared/types";
import { MobileButton, MobileCard, MobileTextarea, MobileModal } from "./MobileOptimizedForm";
import OptimizedCategorizedPhotoUpload from "./OptimizedCategorizedPhotoUpload";
import FoundationCanvas from "./FoundationCanvas";

interface MobileTechnicianInterfaceProps {
  appointment: Appointment;
  onUpdate: (updates: Partial<Appointment>) => Promise<void>;
}

export default function MobileTechnicianInterface({ appointment, onUpdate }: MobileTechnicianInterfaceProps) {
  const [pierPlacements, setPierPlacements] = useState<PierPlacements>(() => {
    if (appointment.pier_placements) {
      try {
        return JSON.parse(appointment.pier_placements);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [categorizedPhotos, setCategorizedPhotos] = useState<CategorizedPhoto[]>([]);
  const [technicianNotes, setTechnicianNotes] = useState(appointment.technician_notes || "");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | 'photos' | 'notes'>('2d');
  
  const [showSketchModal, setShowSketchModal] = useState(false);
  
  const sketchInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  

  const handleSketchUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("sketch", file);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}/upload-sketch`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        await onUpdate({
          improvement_sketch_url: result.url,
          improvement_sketch_filename: file.name,
        });
        setShowSketchModal(false);
      }
    } catch (error) {
      console.error("Failed to upload sketch:", error);
      alert("Failed to upload sketch. Please try again.");
    }
  };

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // For now, treat camera captures as regular photo uploads
    // This could be enhanced to use the categorized photo upload system
    const file = files[0];
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("photoType", "site_condition");
    formData.append("filename", file.name);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}/upload-categorized-photo`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const newPhoto: CategorizedPhoto = {
          id: result.id,
          url: result.url,
          type: "site_condition",
          filename: file.name,
        };
        setCategorizedPhotos(prev => [...prev, newPhoto]);
      }
    } catch (error) {
      console.error("Failed to capture photo:", error);
      alert("Failed to capture photo. Please try again.");
    }
  };

  const saveProgress = async () => {
    setSaving(true);
    try {
      const updates: Partial<Appointment> = {
        pier_placements: pierPlacements.length > 0 ? JSON.stringify(pierPlacements) : undefined,
        technician_notes: technicianNotes.trim() || undefined,
      };
      
      await onUpdate(updates);
      
      // Show success feedback
      setTimeout(() => setSaving(false), 1000);
    } catch (error) {
      console.error("Failed to save progress:", error);
      alert("Failed to save progress. Please check your connection and try again.");
      setSaving(false);
    }
  };

  const getPierSummary = () => {
    const total = pierPlacements.length;
    const pushPiers = pierPlacements.filter(p => p.type === "push_pier").length;
    const helicalPiers = pierPlacements.filter(p => p.type === "helical_pier").length;
    const steelPiers = pierPlacements.filter(p => p.type === "steel_pier").length;
    
    return { total, pushPiers, helicalPiers, steelPiers };
  };

  const summary = getPierSummary();

  return (
    <div className="space-y-4 pb-24">
      {/* Header Info Card */}
      <MobileCard className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Appointment #{appointment.id}
            </h2>
            {appointment.location_address && (
              <div className="flex items-center text-sm text-slate-600">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="line-clamp-2">{appointment.location_address}</span>
              </div>
            )}
          </div>
          <div className="ml-3">
            <MobileButton
              onClick={saveProgress}
              loading={saving}
              size="sm"
              leftIcon={saving ? undefined : <Save className="w-4 h-4" />}
              className="whitespace-nowrap"
            >
              {saving ? "Saved!" : "Save"}
            </MobileButton>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-xs text-slate-500">Total Piers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{categorizedPhotos.length}</div>
            <div className="text-xs text-slate-500">Photos Taken</div>
          </div>
        </div>
      </MobileCard>

      {/* Quick Action Bar */}
      <div className="grid grid-cols-2 gap-3">
        <MobileButton
          onClick={() => cameraInputRef.current?.click()}
          variant="secondary"
          size="lg"
          leftIcon={<Camera className="w-5 h-5" />}
          className="h-14"
        >
          Take Photo
        </MobileButton>
        <MobileButton
          onClick={() => setShowSketchModal(true)}
          variant="secondary" 
          size="lg"
          leftIcon={<Upload className="w-5 h-5" />}
          className="h-14"
        >
          Upload Sketch
        </MobileButton>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
        />
      </div>

      {/* View Mode Selector */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('2d')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            viewMode === '2d'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Grid className="w-4 h-4 mx-auto mb-1" />
          Foundation
        </button>
        <button
          onClick={() => setViewMode('photos')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            viewMode === 'photos'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4 mx-auto mb-1" />
          Photos
        </button>
        <button
          onClick={() => setViewMode('notes')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            viewMode === 'notes'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 mx-auto mb-1" />
          Notes
        </button>
      </div>

      {/* Foundation View */}
      {viewMode === '2d' && (
        <MobileCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Foundation Layout</h3>
              <div className="text-sm text-slate-500">
                {summary.total} piers placed
              </div>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Tap foundation to place piers • Pinch to zoom • Drag to pan
            </div>
          </div>
          
          {/* Interactive Foundation Canvas for Mobile */}
          <div className="h-96 bg-slate-50">
            <FoundationCanvas
              pierPlacements={pierPlacements}
              onPierPlacementChange={(placements) => {
                setPierPlacements(placements);
                // Auto-save when piers are placed/removed
                const updates: Partial<Appointment> = {
                  pier_placements: placements.length > 0 ? JSON.stringify(placements) : undefined,
                };
                onUpdate(updates).catch(error => {
                  console.error("Auto-save failed:", error);
                });
              }}
              blueprint={appointment.improvement_sketch_url || undefined}
              editable={true}
              className="h-full touch-action-none"
            />
          </div>

          {/* Mobile Pier Type Legend */}
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white rounded-lg p-2">
                <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                <div className="text-xs font-medium text-slate-700">Push</div>
                <div className="text-xs text-slate-500">{summary.pushPiers}</div>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="w-3 h-3 bg-teal-500 rounded-full mx-auto mb-1"></div>
                <div className="text-xs font-medium text-slate-700">Helical</div>
                <div className="text-xs text-slate-500">{summary.helicalPiers}</div>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1"></div>
                <div className="text-xs font-medium text-slate-700">Steel</div>
                <div className="text-xs text-slate-500">{summary.steelPiers}</div>
              </div>
            </div>
            {summary.total === 0 && (
              <div className="mt-3 text-center">
                <div className="text-xs text-slate-500 bg-blue-50 rounded-lg p-2">
                  💡 Tap anywhere on the foundation to start placing piers
                </div>
              </div>
            )}
          </div>
        </MobileCard>
      )}

      {/* Photos View */}
      {viewMode === 'photos' && (
        <MobileCard className="p-4">
          <OptimizedCategorizedPhotoUpload
            appointmentId={appointment.id}
            existingPhotos={categorizedPhotos}
            onPhotosChanged={setCategorizedPhotos}
            maxPhotosPerCategory={6}
          />
        </MobileCard>
      )}

      {/* Notes View */}
      {viewMode === 'notes' && (
        <MobileCard className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Field Notes</h3>
              <div className="text-sm text-slate-500">
                {technicianNotes.length} characters
              </div>
            </div>
            
            <MobileTextarea
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="Add notes about site conditions, pier requirements, customer concerns, access issues, etc..."
              className="min-h-[200px]"
            />

            {/* Quick Note Templates */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Quick Templates:</div>
              <div className="flex flex-wrap gap-2">
                {[
                  "Access is good",
                  "Foundation settling visible",
                  "Customer concerned about...",
                  "Recommend additional piers",
                  "Soil conditions:",
                ].map((template) => (
                  <button
                    key={template}
                    onClick={() => {
                      const newNotes = technicianNotes ? `${technicianNotes}\n${template}` : template;
                      setTechnicianNotes(newNotes);
                    }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full transition-colors"
                  >
                    + {template}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </MobileCard>
      )}

      {/* Bottom Progress Summary */}
      <MobileCard className="p-4 sticky bottom-20 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="text-center">
          <div className="text-sm font-medium text-slate-900 mb-2">
            Assessment Progress
          </div>
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${summary.total > 0 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              Piers: {summary.total}
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${categorizedPhotos.length > 0 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              Photos: {categorizedPhotos.length}
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${technicianNotes.length > 10 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              Notes: {technicianNotes.length > 10 ? 'Complete' : 'Needed'}
            </div>
          </div>
        </div>
      </MobileCard>

      {/* Sketch Upload Modal */}
      <MobileModal
        isOpen={showSketchModal}
        onClose={() => setShowSketchModal(false)}
        title="Upload Improvement Sketch"
        size="sm"
      >
        <div className="p-6 space-y-4">
          {appointment.improvement_sketch_url ? (
            <div className="space-y-3">
              <img
                src={`/api/files/${appointment.improvement_sketch_url}`}
                alt="Current sketch"
                className="w-full rounded-lg border border-slate-200"
              />
              <p className="text-sm text-slate-600">
                Current: {appointment.improvement_sketch_filename}
              </p>
              <MobileButton
                onClick={() => sketchInputRef.current?.click()}
                variant="secondary"
                size="md"
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Replace Sketch
              </MobileButton>
            </div>
          ) : (
            <div className="text-center py-8">
              <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h4 className="font-medium text-slate-900 mb-2">No sketch uploaded</h4>
              <p className="text-sm text-slate-600 mb-4">
                Upload a photo or diagram of the foundation improvement plan
              </p>
              <MobileButton
                onClick={() => sketchInputRef.current?.click()}
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Choose File
              </MobileButton>
            </div>
          )}
          
          <input
            ref={sketchInputRef}
            type="file"
            accept="image/*"
            onChange={handleSketchUpload}
            className="hidden"
          />
        </div>
      </MobileModal>
    </div>
  );
}
