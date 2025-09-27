import { useState, useRef, useEffect } from "react";
import { Upload, Save, Download, Tablet, MapPin, FileText, Grid, Box, Users } from "lucide-react";
import Enhanced3DViewer from "./Enhanced3DViewer";
import Generated3DModel from "./Generated3DModel";
import FoundationCanvas from "./FoundationCanvas";
import ContractGenerator from "./ContractGenerator";
import CategorizedPhotoUpload from "./CategorizedPhotoUpload";
import { NetworkErrorBoundary } from "./SafeErrorBoundary";
import NetworkErrorHandler from "./NetworkErrorHandler";
import { Appointment, PierPlacements, SalesPerson, CategorizedPhoto } from "@/shared/types";

interface TechnicianInterfaceProps {
  appointment: Appointment;
  onUpdate: (updates: Partial<Appointment>) => Promise<void>;
  isMobile?: boolean;
}

const handleUpdateWithValidation = async (
  onUpdate: (updates: Partial<Appointment>) => Promise<void>,
  updates: Partial<Appointment>,
  retryCount = 0
) => {
  try {
    // Always allow updates with comprehensive logging
    console.log("Attempting appointment update:", { updates, retryCount });
    
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 30000);
    });
    
    const updatePromise = onUpdate(updates);
    const result = await Promise.race([updatePromise, timeoutPromise]);
    
    console.log("Update successful:", result);
    return result;
  } catch (error) {
    console.error("Update failed:", error);
    
    // Comprehensive network error detection
    const isNetworkError = error instanceof TypeError || 
                          error instanceof Error && (
                            error.message.includes('fetch') ||
                            error.message.includes('network') ||
                            error.message.includes('Load failed') ||
                            error.message.includes('timeout') ||
                            error.message.includes('Failed to fetch') ||
                            error.message.toLowerCase().includes('connection') ||
                            error.name === 'AbortError' ||
                            error.name === 'TimeoutError'
                          );
    
    // Enhanced retry logic with progressive backoff
    if (retryCount < 7 && isNetworkError) { // Increased to 7 attempts
      const baseDelay = Math.min(1000 * Math.pow(1.5, retryCount), 15000);
      const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
      const backoffTime = baseDelay + jitter;
      
      console.log(`Network error detected. Retrying update (attempt ${retryCount + 1}/${7}) after ${Math.round(backoffTime)}ms`);
      console.log("Error details:", { 
        message: error.message, 
        name: error.name, 
        type: typeof error 
      });
      
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return handleUpdateWithValidation(onUpdate, updates, retryCount + 1);
    }
    
    // Enhanced error messaging for different failure types
    if (isNetworkError) {
      const timeoutError = error.message.includes('timeout');
      const connectionError = error.message.includes('Load failed') || error.message.includes('Failed to fetch');
      
      if (timeoutError) {
        throw new Error("Request timed out after multiple attempts. The server may be overloaded. Please try again in a few moments.");
      } else if (connectionError) {
        throw new Error("Network connection failed after 7 attempts. Please check your internet connection and try again.");
      } else {
        throw new Error(`Network error occurred: ${error.message}. Please check your connection and try again.`);
      }
    }
    
    // Re-throw non-network errors
    throw error;
  }
};

export default function TechnicianInterface({ appointment, onUpdate, isMobile = false }: TechnicianInterfaceProps) {
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
  const [sitePhotos] = useState<string[]>(() => {
    if (appointment.site_photos) {
      try {
        return JSON.parse(appointment.site_photos);
      } catch {
        return [];
      }
    }
    return [];
  });
  
  const [technicianNotes, setTechnicianNotes] = useState(appointment.technician_notes || "");
  const [saving, setSaving] = useState(false);
  const [generating3D, setGenerating3D] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'ai'>('2d');
  const [activeTab, setActiveTab] = useState<'assessment' | 'contract'>('assessment');
  const [salesPerson, setSalesPerson] = useState<SalesPerson | null>(null);
  
  const sketchInputRef = useRef<HTMLInputElement>(null);

  // Enhanced fetch logic with comprehensive error handling
  useEffect(() => {
    const fetchWithRetry = async (url: string, retries = 8) => {
      let lastError: Error | null = null;
      
      for (let i = 0; i < retries; i++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased timeout
          
          console.log(`Fetching ${url} (attempt ${i + 1}/${retries})`);
          
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          clearTimeout(timeoutId);
          
          // Success case
          if (response.ok) {
            const data = await response.json();
            console.log(`Successfully fetched ${url}`);
            return data;
          }
          
          // Handle specific HTTP status codes
          if (response.status >= 500) {
            throw new Error(`Server error ${response.status}: ${response.statusText}`);
          } else if (response.status === 404) {
            throw new Error(`Resource not found: ${url}`);
          } else if (response.status === 429) {
            throw new Error(`Rate limited: ${response.statusText}`);
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          lastError = error as Error;
          
          const err = error as Error;
          const isNetworkError = err.name === 'AbortError' || 
                                err.name === 'TypeError' ||
                                err.message.includes('Load failed') ||
                                err.message.includes('Failed to fetch') ||
                                err.message.includes('network') ||
                                err.message.includes('timeout');
          
          const isServerError = err.message.includes('Server error') ||
                               err.message.includes('Rate limited');
          
          console.warn(`Fetch attempt ${i + 1}/${retries} failed for ${url}:`, {
            message: err.message,
            name: err.name,
            isNetworkError,
            isServerError
          });
          
          // Final attempt failure
          if (i === retries - 1) {
            if (isNetworkError) {
              throw new Error(`Network connection failed after ${retries} attempts. Please check your internet connection and try refreshing the page.`);
            } else if (isServerError) {
              throw new Error(`Server temporarily unavailable after ${retries} attempts. Please try again in a few minutes.`);
            }
            throw lastError;
          }
          
          // Progressive backoff with jitter
          let backoffTime: number;
          if (isNetworkError) {
            backoffTime = Math.min(1500 * Math.pow(1.8, i) + Math.random() * 1000, 15000);
          } else if (isServerError) {
            backoffTime = Math.min(3000 * Math.pow(2, i) + Math.random() * 2000, 20000);
          } else {
            backoffTime = Math.min(800 * (i + 1) + Math.random() * 500, 5000);
          }
          
          console.log(`Waiting ${Math.round(backoffTime)}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
      
      throw lastError || new Error('All fetch attempts failed');
    };

    const fetchSalesPerson = async () => {
      if (appointment.assigned_sales_person_id) {
        try {
          console.log("Fetching sales person:", appointment.assigned_sales_person_id);
          const data = await fetchWithRetry(`/api/sales-people/${appointment.assigned_sales_person_id}`);
          setSalesPerson(data);
          console.log("Sales person loaded successfully");
        } catch (error) {
          console.error("Failed to fetch sales person after retries:", error);
          // Set null to indicate failure but don't crash the app
          setSalesPerson(null);
        }
      }
    };

    const fetchCategorizedPhotos = async () => {
      try {
        console.log("Fetching categorized photos for appointment:", appointment.id);
        const photos = await fetchWithRetry(`/api/appointments/${appointment.id}/photos`);
        setCategorizedPhotos(Array.isArray(photos) ? photos : []);
        console.log(`Loaded ${photos.length} categorized photos`);
      } catch (error) {
        console.error("Failed to fetch categorized photos after retries:", error);
        // Set empty array as safe fallback
        setCategorizedPhotos([]);
      }
    };

    // Sequential fetching to reduce server load
    const fetchData = async () => {
      try {
        await fetchSalesPerson();
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
        await fetchCategorizedPhotos();
      } catch (error) {
        console.error("Error in data fetching sequence:", error);
      }
    };

    fetchData();
  }, [appointment.assigned_sales_person_id, appointment.id]);

  

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
        await handleUpdateWithValidation(onUpdate, {
          improvement_sketch_url: result.url,
          improvement_sketch_filename: file.name,
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = typeof errorData === 'string' ? errorData : errorData.error || 'Unknown error';
        console.error("Failed to upload sketch:", errorMessage);
        alert(`Failed to upload sketch: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Failed to upload sketch:", error);
      alert("Network error occurred while uploading sketch. Please check your connection and try again.");
    }
  };

  const generate3DModel = async () => {
    if (pierPlacements.length === 0) {
      alert("Please place at least one pier on the foundation before generating a 3D model.");
      return;
    }

    if (categorizedPhotos.length === 0 && sitePhotos.length === 0 && !appointment.improvement_sketch_url) {
      alert("Please upload at least one photo or improvement sketch to generate a 3D model.");
      return;
    }
    
    setGenerating3D(true);
    try {
      // First save the current pier placements with retry
      await handleUpdateWithValidation(onUpdate, {
        pier_placements: JSON.stringify(pierPlacements),
      });

      // Generate 3D model with retry logic
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          response = await fetch(`/api/appointments/${appointment.id}/generate-3d-model`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              site_photos: sitePhotos,
              categorized_photos: categorizedPhotos,
              improvement_sketch_url: appointment.improvement_sketch_url,
              pier_placements: pierPlacements,
            }),
          });
          break; // Success, exit retry loop
        } catch (fetchError) {
          retryCount++;
          console.warn(`3D generation fetch attempt ${retryCount} failed:`, fetchError);
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          } else {
            throw fetchError;
          }
        }
      }

      if (response && response.ok) {
        const result = await response.json();
        if (result.model_data) {
          await handleUpdateWithValidation(onUpdate, { generated_model_data: JSON.stringify(result.model_data) });
          alert("Client 3D presentation generated successfully! Switch to Client view to see the impressive visualization.");
          setViewMode('ai'); // Automatically switch to client presentation view
        } else {
          console.warn("No model data returned from generation");
          alert("3D presentation generation completed but no data was returned.");
        }
      } else {
        const errorData = await (response?.json().catch(() => ({ error: 'Unknown server error' })) || { error: 'No response' });
        const errorMessage = typeof errorData === 'string' ? errorData : errorData.error || 'Unknown server error';
        console.error("Failed to generate 3D model:", errorMessage);
        alert(`Failed to generate 3D model: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("3D generation error:", errorMessage);
      
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || error instanceof TypeError) {
        alert("Network error occurred while generating 3D model. Please check your connection and try again.");
      } else {
        alert(`Error generating 3D model: ${errorMessage}`);
      }
    } finally {
      setGenerating3D(false);
    }
  };

  const saveProgress = async () => {
    setSaving(true);
    try {
      const updates: Partial<Appointment> = {
        // Always include all current state to ensure data consistency
        pier_placements: pierPlacements.length > 0 ? JSON.stringify(pierPlacements) : undefined,
        site_photos: sitePhotos.length > 0 ? JSON.stringify(sitePhotos) : undefined,
        technician_notes: technicianNotes.trim() || undefined,
      };
      
      console.log("Saving progress with updates:", updates);
      await handleUpdateWithValidation(onUpdate, updates);
      
      // Visual feedback for successful save
      const originalText = document.querySelector('[data-save-button]')?.textContent;
      const saveButton = document.querySelector('[data-save-button]');
      if (saveButton) {
        saveButton.textContent = 'Saved!';
        setTimeout(() => {
          saveButton.textContent = originalText || 'Save';
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to save progress:", errorMessage);
      alert(`Failed to save progress: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const exportData = () => {
    const exportData = {
      appointment_id: appointment.id,
      pier_placements: pierPlacements,
      site_photos: sitePhotos,
      technician_notes: technicianNotes,
      location: appointment.location_address,
      date: appointment.appointment_date,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointment-${appointment.id}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContractGenerated = (contractUrl: string) => {
    console.log("Contract generated:", contractUrl);
    // In a real implementation, this would save the contract URL to the appointment
    // and potentially trigger email delivery to the customer
  };

  const containerClass = isMobile 
    ? "min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-2" 
    : "min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6";

  return (
    <NetworkErrorHandler onRetry={() => window.location.reload()}>
    <div className={containerClass}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Tablet className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-lg font-bold text-slate-900">
                {activeTab === 'assessment' ? 'Field Assessment' : 'Contract Generator'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {activeTab === 'contract' && (
                <div className="flex items-center text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                  <Users className="w-3 h-3 mr-1" />
                  Close Tool
                </div>
              )}
              <button
                onClick={saveProgress}
                disabled={saving}
                data-save-button
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            {appointment.location_address && (
              <div className="flex items-center text-sm text-slate-600">
                <MapPin className="w-4 h-4 mr-1" />
                {appointment.location_address}
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('assessment')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  activeTab === 'assessment' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                Assessment
              </button>
              <button
                onClick={() => setActiveTab('contract')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  activeTab === 'contract' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Tab Navigation */}
      {!isMobile && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 mb-6 shadow-lg">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex-1 inline-flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
                activeTab === 'assessment'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Grid className="w-5 h-5 mr-2" />
              Field Assessment
            </button>
            <button
              onClick={() => setActiveTab('contract')}
              className={`flex-1 inline-flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
                activeTab === 'contract'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-5 h-5 mr-2" />
              Contract Generator
              <div className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">
                One-Call Close
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Assessment Tab */}
      {activeTab === 'assessment' && (
        <div className={isMobile ? "space-y-4" : "grid grid-cols-1 xl:grid-cols-4 gap-6"}>
          {/* Tools Panel */}
          <div className={isMobile ? "" : "xl:col-span-1"}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg space-y-4">
            {!isMobile && (
              <div className="border-b border-slate-200 pb-4 mb-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Technician Tools</h2>
                <p className="text-sm text-slate-600">Capture site data and place piers</p>
              </div>
            )}

            {/* Photo Summary */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Photo Documentation</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">Total Photos:</span>
                  <span className="font-medium text-sm">{categorizedPhotos.length + sitePhotos.length}</span>
                </div>
                {categorizedPhotos.filter(p => p.type === 'psych_photos').length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-purple-600">Psych Photos:</span>
                    <span className="font-medium text-sm text-purple-600">
                      {categorizedPhotos.filter(p => p.type === 'psych_photos').length}
                    </span>
                  </div>
                )}
                {categorizedPhotos.filter(p => p.type === 'structural_damage').length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-red-600">Damage Photos:</span>
                    <span className="font-medium text-sm text-red-600">
                      {categorizedPhotos.filter(p => p.type === 'structural_damage').length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Improvement Sketch */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Improvement Sketch</h3>
              {appointment.improvement_sketch_url ? (
                <div className="space-y-2">
                  <img
                    src={`/api/files/${appointment.improvement_sketch_url}`}
                    alt="Improvement sketch"
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <p className="text-xs text-slate-600">{appointment.improvement_sketch_filename}</p>
                </div>
              ) : (
                <button
                  onClick={() => sketchInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Sketch
                </button>
              )}
              
              <input
                ref={sketchInputRef}
                type="file"
                accept="image/*"
                onChange={handleSketchUpload}
                className="hidden"
              />
            </div>

            {/* View Mode Toggle */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Visualization Mode</h3>
              <div className="grid grid-cols-3 gap-1 mb-3">
                <button
                  onClick={() => setViewMode('2d')}
                  className={`inline-flex items-center justify-center px-2 py-2 rounded-lg transition-all text-xs ${
                    viewMode === '2d' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Grid className="w-3 h-3 mr-1" />
                  2D
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`inline-flex items-center justify-center px-2 py-2 rounded-lg transition-all text-xs ${
                    viewMode === '3d' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Box className="w-3 h-3 mr-1" />
                  3D
                </button>
                <button
                  onClick={() => setViewMode('ai')}
                  disabled={!appointment.generated_model_data}
                  className={`inline-flex items-center justify-center px-2 py-2 rounded-lg transition-all text-xs ${
                    viewMode === 'ai' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                      : appointment.generated_model_data
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  🏠 Client
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {viewMode === '2d' 
                  ? 'Click foundation to add pier with details' 
                  : viewMode === '3d'
                    ? 'Interactive 3D pier placement with modal'
                    : 'Client presentation view with impressive visuals'}
              </p>
            </div>

            {/* Client 3D Presentation */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Client 3D Presentation</h3>
              <button
                onClick={generate3DModel}
                disabled={generating3D || pierPlacements.length === 0 || (categorizedPhotos.length === 0 && sitePhotos.length === 0 && !appointment.improvement_sketch_url)}
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {generating3D ? "Creating Presentation..." : "Generate Client 3D Model"}
              </button>
              {pierPlacements.length === 0 && (
                <p className="text-xs text-orange-600 mt-2">Place piers first to create client presentation</p>
              )}
              {pierPlacements.length > 0 && categorizedPhotos.length === 0 && sitePhotos.length === 0 && !appointment.improvement_sketch_url && (
                <p className="text-xs text-orange-600 mt-2">Upload photos or sketch for better presentation</p>
              )}
              <p className="text-xs text-slate-500 mt-2">Creates impressive 3D visualization for client "wow factor"</p>
            </div>

            {/* Pier Summary */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">Pier Summary</h3>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Piers:</span>
                  <span className="font-medium">{pierPlacements.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Push Piers:</span>
                  <span className="font-medium text-red-600">
                    {pierPlacements.filter(p => p.type === "push_pier").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Helical Piers:</span>
                  <span className="font-medium text-teal-600">
                    {pierPlacements.filter(p => p.type === "helical_pier").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Steel Piers:</span>
                  <span className="font-medium text-blue-600">
                    {pierPlacements.filter(p => p.type === "steel_pier").length}
                  </span>
                </div>
              </div>
            </div>

            {/* Export */}
            {!isMobile && (
              <button
                onClick={exportData}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
            )}
          </div>
        </div>

        {/* Foundation Viewer */}
        <div className={isMobile ? "" : "xl:col-span-3"}>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold text-slate-900">Foundation Model</h3>
                <div className="flex items-center space-x-2">
                  {viewMode === '2d' ? (
                    <>
                      <Grid className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-600 font-medium">2D Canvas</span>
                    </>
                  ) : viewMode === '3d' ? (
                    <>
                      <Box className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-purple-600 font-medium">3D Interactive</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">🏠</span>
                      <span className="text-sm text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">Client Presentation</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {viewMode === '2d' 
                  ? 'Click foundation to place piers • Scroll to zoom' 
                  : viewMode === '3d'
                    ? 'Interactive pier placement • Click foundation to add piers'
                    : 'Client presentation with impressive underground pier visualization'}
              </div>
            </div>
            <div className={isMobile ? "h-[400px]" : "h-[600px]"}>
              {viewMode === '2d' ? (
                <FoundationCanvas
                  pierPlacements={pierPlacements}
                  onPierPlacementChange={setPierPlacements}
                  blueprint={appointment.improvement_sketch_url || undefined}
                  editable={true}
                  className="h-full"
                />
              ) : viewMode === '3d' ? (
                <Enhanced3DViewer
                  pierPlacements={pierPlacements}
                  onPierPlacementChange={setPierPlacements}
                  editable={true}
                  blueprint={appointment.improvement_sketch_url || undefined}
                />
              ) : (
                <Generated3DModel
                  modelData={appointment.generated_model_data ? JSON.parse(appointment.generated_model_data) : null}
                  pierPlacements={pierPlacements}
                  blueprint={appointment.improvement_sketch_url || undefined}
                />
              )}
            </div>
          </div>
        </div>

        {/* Photo Documentation - Full width */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <NetworkErrorBoundary name="PhotoUpload">
            <CategorizedPhotoUpload
              appointmentId={appointment.id}
              existingPhotos={categorizedPhotos}
              onPhotosChanged={setCategorizedPhotos}
            />
          </NetworkErrorBoundary>
        </div>

        {/* Technician Notes - Full width on mobile */}
        {isMobile && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <div className="flex items-center mb-3">
              <FileText className="w-5 h-5 text-slate-600 mr-2" />
              <h3 className="font-semibold text-slate-900 text-sm">Field Notes</h3>
            </div>
            <textarea
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="Add notes about site conditions, pier requirements, etc..."
              className="w-full h-24 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            
            <div className="flex space-x-3 mt-4">
              <button
                onClick={saveProgress}
                disabled={saving}
                data-save-button
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Progress"}
              </button>
              
              <button
                onClick={exportData}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Contract Generator Tab */}
      {activeTab === 'contract' && (
        <div className={isMobile ? "space-y-4" : ""}>
          <ContractGenerator
            appointment={appointment}
            pierPlacements={pierPlacements}
            salesPerson={salesPerson}
            onContractGenerated={handleContractGenerated}
          />
        </div>
      )}
    </div>
    </NetworkErrorHandler>
  );
}
