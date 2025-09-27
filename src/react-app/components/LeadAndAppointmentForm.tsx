import { useState, useEffect } from "react";
import { Save, X, Calendar, UserPlus, Home, Columns } from "lucide-react";
import { CreateLeadWithAppointment } from "@/shared/types";
import AddressAutocomplete from "./AddressAutocomplete";

interface LeadAndAppointmentFormProps {
  onSubmit: (data: CreateLeadWithAppointment) => Promise<void>;
  onCancel: () => void;
}

export default function LeadAndAppointmentForm({ onSubmit, onCancel }: LeadAndAppointmentFormProps) {
  const [leadData, setLeadData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    notes: "",
    source: "",
    status: "new" as const,
    assigned_sales_person_id: "",
  });

  const [appointmentData, setAppointmentData] = useState({
    appointment_date: "",
    appointment_type: "consultation" as const,
    status: "scheduled" as const,
    notes: "",
    location_address: "",
    duration_minutes: 60,
    technician_notes: "",
    assigned_sales_person_id: "",
    foundation_type: "",
    pier_type: "",
  });

  const [salesPeople, setSalesPeople] = useState<any[]>([]);
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
  }, []);

  const handleLeadChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLeadData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleAppointmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setAppointmentData(prev => ({ 
      ...prev, 
      [name]: type === "number" ? parseInt(value) || 0 : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Lead validation
    if (!leadData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    
    if (!leadData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    
    if (leadData.email && !/\S+@\S+\.\S+/.test(leadData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    // Appointment validation
    if (!appointmentData.appointment_date) {
      newErrors.appointment_date = "Appointment date is required";
    } else {
      const appointmentDate = new Date(appointmentData.appointment_date);
      const now = new Date();
      if (appointmentDate < now) {
        newErrors.appointment_date = "Appointment date cannot be in the past";
      }
    }
    
    if (!appointmentData.location_address) {
      newErrors.location_address = "Property address is required";
    }
    
    if (appointmentData.duration_minutes <= 0) {
      newErrors.duration_minutes = "Duration must be greater than 0";
    }
    
    if (appointmentData.foundation_type === "pier_and_beam" && !appointmentData.pier_type) {
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
      const submitData: CreateLeadWithAppointment = {
        lead: {
          ...leadData,
          assigned_sales_person_id: leadData.assigned_sales_person_id ? parseInt(leadData.assigned_sales_person_id.toString()) : undefined,
        },
        appointment: {
          ...appointmentData,
          appointment_date: new Date(appointmentData.appointment_date).toISOString(),
          assigned_sales_person_id: appointmentData.assigned_sales_person_id ? parseInt(appointmentData.assigned_sales_person_id.toString()) : undefined,
          foundation_type: (appointmentData.foundation_type as "slab" | "pier_and_beam") || undefined,
          pier_type: (appointmentData.pier_type as "poured" | "blocks" | "posts") || undefined,
        }
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error("Failed to save lead and appointment:", error);
      setErrors({ general: "Failed to save lead and appointment. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Lead Information Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <UserPlus className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-900">Lead Information</h3>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={leadData.first_name}
                onChange={handleLeadChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.first_name ? "border-red-300" : "border-slate-200"
                }`}
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <p className="text-red-600 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={leadData.last_name}
                onChange={handleLeadChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.last_name ? "border-red-300" : "border-slate-200"
                }`}
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <p className="text-red-600 text-sm mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={leadData.email}
                onChange={handleLeadChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.email ? "border-red-300" : "border-slate-200"
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={leadData.phone}
                onChange={handleLeadChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                name="address_line1"
                value={leadData.address_line1}
                onChange={handleLeadChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                name="address_line2"
                value={leadData.address_line2}
                onChange={handleLeadChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Apt, suite, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={leadData.city}
                  onChange={handleLeadChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={leadData.state}
                  onChange={handleLeadChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Zip Code
                </label>
                <input
                  type="text"
                  name="zip_code"
                  value={leadData.zip_code}
                  onChange={handleLeadChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Zip code"
                />
              </div>
            </div>
          </div>

          {/* Lead Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Source
              </label>
              <input
                type="text"
                name="source"
                value={leadData.source}
                onChange={handleLeadChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Website, Referral, Advertisement"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assigned Sales Person
              </label>
              <select
                name="assigned_sales_person_id"
                value={leadData.assigned_sales_person_id}
                onChange={handleLeadChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

          {/* Lead Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lead Notes
            </label>
            <textarea
              name="notes"
              value={leadData.notes}
              onChange={handleLeadChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Add any additional notes about this lead..."
            />
          </div>
        </div>

        {/* Appointment Information Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-900">Appointment Details</h3>
          </div>

          {/* Appointment Date and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Appointment Date & Time *
              </label>
              <input
                type="datetime-local"
                name="appointment_date"
                value={appointmentData.appointment_date}
                onChange={handleAppointmentChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
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
                value={appointmentData.duration_minutes}
                onChange={handleAppointmentChange}
                min="15"
                step="15"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.duration_minutes ? "border-red-300" : "border-slate-200"
                }`}
              />
              {errors.duration_minutes && (
                <p className="text-red-600 text-sm mt-1">{errors.duration_minutes}</p>
              )}
            </div>
          </div>

          {/* Appointment Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Appointment Type
              </label>
              <select
                name="appointment_type"
                value={appointmentData.appointment_type}
                onChange={handleAppointmentChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="consultation">Consultation</option>
                <option value="estimate">Estimate</option>
                <option value="inspection">Inspection</option>
                <option value="follow_up">Follow Up</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assigned Sales Person
              </label>
              <select
                name="assigned_sales_person_id"
                value={appointmentData.assigned_sales_person_id}
                onChange={handleAppointmentChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              value={appointmentData.location_address}
              onChange={(address) => setAppointmentData(prev => ({ ...prev, location_address: address }))}
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
                value={appointmentData.foundation_type}
                onChange={handleAppointmentChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Foundation Type</option>
                <option value="slab">Slab Foundation</option>
                <option value="pier_and_beam">Pier and Beam Foundation</option>
              </select>
            </div>

            {appointmentData.foundation_type === "pier_and_beam" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Columns className="w-4 h-4 inline mr-1" />
                  Pier Type
                </label>
                <select
                  name="pier_type"
                  value={appointmentData.pier_type}
                  onChange={handleAppointmentChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Pier Type</option>
                  <option value="poured">Poured Concrete Piers</option>
                  <option value="blocks">Concrete Block Piers</option>
                  <option value="posts">Wooden Posts</option>
                </select>
                {errors.pier_type && (
                  <p className="text-red-600 text-sm mt-1">{errors.pier_type}</p>
                )}
              </div>
            )}
          </div>

          {/* Appointment Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Appointment Notes
            </label>
            <textarea
              name="notes"
              value={appointmentData.notes}
              onChange={handleAppointmentChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add any additional notes about this appointment..."
            />
          </div>

          {/* Technician Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Technician Notes
            </label>
            <textarea
              name="technician_notes"
              value={appointmentData.technician_notes}
              onChange={handleAppointmentChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Field notes, site conditions, special requirements..."
            />
          </div>
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
            {saving ? "Creating..." : "Create Lead & Schedule Appointment"}
          </button>
        </div>
      </form>
    </div>
  );
}
