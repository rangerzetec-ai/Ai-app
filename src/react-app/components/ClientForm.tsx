import { useState } from "react";
import { Save, X } from "lucide-react";
import { CreateClient, UpdateClient, Client } from "@/shared/types";

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClient | UpdateClient) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function ClientForm({ client, onSubmit, onCancel, isEditing = false }: ClientFormProps) {
  const [formData, setFormData] = useState<CreateClient>({
    first_name: client?.first_name || "",
    last_name: client?.last_name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    address_line1: client?.address_line1 || "",
    address_line2: client?.address_line2 || "",
    city: client?.city || "",
    state: client?.state || "",
    zip_code: client?.zip_code || "",
    notes: client?.notes || "",
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await onSubmit(formData);
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        console.error("Failed to save client:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm";
  const errorClasses = "border-red-300 focus:ring-red-500";

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={`${inputClasses} ${errors.first_name ? errorClasses : ""}`}
              required
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={`${inputClasses} ${errors.last_name ? errorClasses : ""}`}
              required
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
            )}
          </div>
        </div>

        {/* Contact Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`${inputClasses} ${errors.email ? errorClasses : ""}`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`${inputClasses} ${errors.phone ? errorClasses : ""}`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Address Fields */}
        <div>
          <label htmlFor="address_line1" className="block text-sm font-medium text-slate-700 mb-2">
            Address Line 1
          </label>
          <input
            type="text"
            id="address_line1"
            name="address_line1"
            value={formData.address_line1}
            onChange={handleChange}
            className={`${inputClasses} ${errors.address_line1 ? errorClasses : ""}`}
          />
          {errors.address_line1 && (
            <p className="mt-1 text-sm text-red-600">{errors.address_line1}</p>
          )}
        </div>

        <div>
          <label htmlFor="address_line2" className="block text-sm font-medium text-slate-700 mb-2">
            Address Line 2
          </label>
          <input
            type="text"
            id="address_line2"
            name="address_line2"
            value={formData.address_line2}
            onChange={handleChange}
            className={`${inputClasses} ${errors.address_line2 ? errorClasses : ""}`}
          />
          {errors.address_line2 && (
            <p className="mt-1 text-sm text-red-600">{errors.address_line2}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`${inputClasses} ${errors.city ? errorClasses : ""}`}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-2">
              State
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={`${inputClasses} ${errors.state ? errorClasses : ""}`}
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="zip_code" className="block text-sm font-medium text-slate-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              id="zip_code"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleChange}
              className={`${inputClasses} ${errors.zip_code ? errorClasses : ""}`}
            />
            {errors.zip_code && (
              <p className="mt-1 text-sm text-red-600">{errors.zip_code}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={formData.notes}
            onChange={handleChange}
            className={`${inputClasses} ${errors.notes ? errorClasses : ""}`}
            placeholder="Any additional notes about the client..."
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : isEditing ? "Update Client" : "Create Client"}
          </button>
        </div>
      </form>
    </div>
  );
}
