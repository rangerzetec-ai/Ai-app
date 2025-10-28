import { useState, useEffect } from "react";
import { Save, X, Calendar, Home, Columns } from "lucide-react";
import { CreateAppointment, UpdateAppointment, Appointment, Lead, CategorizedPhoto } from "@/shared/types";
import AppointmentMediaUpload from "./AppointmentMediaUpload";
import CategorizedPhotoUpload from "./CategorizedPhotoUpload";
import AddressAutocomplete from "./AddressAutocomplete";

interface AppointmentFormProps {
  appointment?: Appointment;
  lead?: Lead;
  leadId?: number;
  onSubmit: (data: CreateAppointment | UpdateAppointment) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

export default function AppointmentForm({ 
  appointment, 
  lead, 
  leadId, 
  onSubmit, 
  onCancel, 
  isEditing 
}: AppointmentFormProps) {
  const [formData, setFormData] = useState({
    lead_id: appointment?.lead_id || leadId || 0,
    appointment_date: appointment?.appointment_date 
      ? new Date(appointment.appointment_date).toISOString().slice(0, 16)
      : "",
    appointment_type: appointment?.appointment_type || "consultation",
    status: appointment?.status || "scheduled",
    notes: appointment?.notes || "",
    location_address: appointment?.location_address || "",
    duration_minutes: appointment?.duration_minutes || 60,
    site_photos: appointment?.site_photos || "",
    improvement_sketch_url: appointment?.improvement_sketch_url || "",
    improvement_sketch_filename: appointment?.improvement_sketch_filename || "",
    technician_notes: appointment?.technician_notes || "",
    assigned_sales_person_id: appointment?.assigned_sales_person_id || "",
    foundation_type: appointment?.foundation_type || "",
    pier_type: appointment?.pier_type || "",
  });

  const [salesPeople, setSalesPeople] = useState<any[]>([]);
  const [categorizedPhotos, setCategorizedPhotos] = useState<CategorizedPhoto[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSalesPeople = async () => {
      try {
        const response = await fetch("/api/sales-people");
        if (response.ok) {
          const data = await response.json();
          setSalesPeople(data.filter((sp: any) => sp.is_active));
        }
      } catch (error) {
        console.error("Failed to fetch sales people:", error);
      }
    };

    fetchSalesPeople();

    // Fetch existing categorized photos if editing
    if (isEditing && appointment?.id) {
      const fetchCategorizedPhotos = async () => {
        try {
          const response = await fetch(`/api/appointments/${appointment.id}/photos`);
          if (response.ok) {
            const photos = await response.json();
            setCategorizedPhotos(photos);
          }
        } catch (error) {
          console.error("Failed to fetch categorized photos:", error);
        }
      };
      fetchCategorizedPhotos();
    }
  }, [isEditing, appointment?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === "number" ? parseInt(value) || 0 : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.appointment_date) {
      newErrors.appointment_date = "Appointment date is required";
    } else {
      const appointmentDate = new Date(formData.appointment_date);
      const now = new Date();
      if (appointmentDate < now) {
        newErrors.appointment_date = "Appointment date cannot be in the past";
      }
    }
    
    if (!formData.location_address) {
      newErrors.location_address = "Property address is required";
    }
    
    if (formData.duration_minutes <= 0) {
      newErrors.duration_minutes = "Duration must be greater than 0";
    }
    
    if (formData.foundation_type === "pier_and_beam" && !formData.pier_type) {
      newErrors.pier_type = "Please select the pier type for pier and beam foundations";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      // Convert local datetime to ISO string
      const submitData = {
        ...formData,
        appointment_date: new Date(formData.appointment_date).toISOString(),
        // Filter out empty strings for optional fields
        notes: formData.notes || undefined,
        location_address: formData.location_address || undefined,
        assigned_sales_person_id: formData.assigned_sales_person_id ? parseInt(formData.assigned_sales_person_id.toString()) : undefined,
        foundation_type: (formData.foundation_type as "slab" | "pier_and_beam") || undefined,
        pier_type: (formData.pier_type as "poured" | "blocks" | "posts") || undefined,
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error("Failed to save appointment:", error);
      setErrors({ general: "Failed to save appointment. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Lead Information (if provided) */}
        {lead && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">
                Appointment for: {lead.first_name} {lead.last_name}
              </span>
            </div>
            {lead.email && (
              <p className="text-purple-700 text-sm mt-1">{lead.email}</p>
            )}
          </div>
        )}

        {/* Appointment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Appointment Date & Time *
            </label>
            <input
              type="datetime-local"
              name="appointment_date"
              value={formData.appointment_date}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.appointment_date ? "border-red-300" : "border-slate-200"
              }`}
            />
            {errors.appointment_date && (
              <p className="text-red-600 text-sm mt-1">{errors.appointment_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              min="15"
              step="15"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.duration_minutes ? "border-red-300" : "border-slate-200"
              }`}
            />
            {errors.duration_minutes && (
              <p className="text-red-600 text-sm mt-1">{errors.duration_minutes}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Appointment Type
            </label>
            <select
              name="appointment_type"
              value={formData.appointment_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="consultation">Consultation</option>
              <option value="estimate">Estimate</option>
              <option value="inspection">Inspection</option>
              <option value="follow_up">Follow Up</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assigned Sales Person
            </label>
            <select
              name="assigned_sales_person_id"
              value={formData.assigned_sales_person_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Sales Person</option>
              {salesPeople.map((salesPerson) => (
                <option key={salesPerson.id} value={salesPerson.id}>
                  {salesPerson.first_name} {salesPerson.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Property Address *
          </label>
          <AddressAutocomplete
            value={formData.location_address}
            onChange={(address) => setFormData(prev => ({ ...prev, location_address: address }))}
            placeholder="Start typing property address..."
          />
          {errors.location_address && (
            <p className="mt-1 text-sm text-red-600">{errors.location_address}</p>
          )}
        </div>

        {/* Foundation Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Home className="w-4 h-4 inline mr-1" />
              Foundation Type
            </label>
            <select
              name="foundation_type"
              value={formData.foundation_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Foundation Type</option>
              <option value="slab">Slab Foundation</option>
              <option value="pier_and_beam">Pier and Beam Foundation</option>
            </select>
          </div>

          {formData.foundation_type === "pier_and_beam" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Columns className="w-4 h-4 inline mr-1" />
                Pier Type
              </label>
              <select
                name="pier_type"
                value={formData.pier_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Pier Type</option>
                <option value="poured">Poured Concrete Piers</option>
                <option value="blocks">Concrete Block Piers</option>
                <option value="posts">Wooden Posts</option>
              </select>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add any additional notes about this appointment..."
          />
        </div>

        {/* Media Upload - only show for existing appointments */}
        {isEditing && appointment && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Photo Documentation
            </label>
            <CategorizedPhotoUpload
              appointmentId={appointment.id}
              existingPhotos={categorizedPhotos}
              onPhotosChanged={setCategorizedPhotos}
            />
            
            {/* Legacy sketch upload for backward compatibility */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Improvement Sketch (Legacy)
              </label>
              <AppointmentMediaUpload
                appointmentId={appointment.id}
                existingPhotos={appointment.site_photos ? JSON.parse(appointment.site_photos) : []}
                existingSketch={appointment.improvement_sketch_url ? {
                  url: appointment.improvement_sketch_url,
                  filename: appointment.improvement_sketch_filename || "sketch.png"
                } : null}
                onPhotoUploaded={(url) => {
                  const photos = formData.site_photos ? JSON.parse(formData.site_photos) : [];
                  photos.push(url);
                  setFormData(prev => ({ ...prev, site_photos: JSON.stringify(photos) }));
                }}
                onSketchUploaded={(url, filename) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    improvement_sketch_url: url,
                    improvement_sketch_filename: filename
                  }));
                }}
              />
            </div>
          </div>
        )}

        {/* Technician Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Technician Notes
          </label>
          <textarea
            name="technician_notes"
            value={formData.technician_notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Field notes, site conditions, special requirements..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : isEditing ? "Update Appointment" : "Schedule Appointment"}
          </button>
        </div>
      </form>
    </div>
  );
}
