import { useState } from "react";
import { Save, X } from "lucide-react";
import { CreateProjectRevenue } from "@/shared/types";

interface RevenueFormProps {
  projectId: number;
  onSubmit: (data: CreateProjectRevenue) => Promise<void>;
  onCancel: () => void;
}

export default function RevenueForm({ projectId, onSubmit, onCancel }: RevenueFormProps) {
  const [formData, setFormData] = useState<CreateProjectRevenue>({
    project_id: projectId,
    description: "",
    amount: 0,
    revenue_date: new Date().toISOString().split('T')[0],
    payment_method: "",
    payment_status: "pending",
    invoice_number: "",
    notes: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
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
        console.error("Failed to save revenue:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm";
  const errorClasses = "border-red-300 focus:ring-red-500";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Add Revenue</h3>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`${inputClasses} ${errors.description ? errorClasses : ""}`}
              placeholder="e.g., Foundation repair payment"
              required
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className={`${inputClasses} ${errors.amount ? errorClasses : ""}`}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="revenue_date" className="block text-sm font-medium text-slate-700 mb-2">
              Revenue Date *
            </label>
            <input
              type="date"
              id="revenue_date"
              name="revenue_date"
              value={formData.revenue_date}
              onChange={handleChange}
              className={`${inputClasses} ${errors.revenue_date ? errorClasses : ""}`}
              required
            />
            {errors.revenue_date && (
              <p className="mt-1 text-sm text-red-600">{errors.revenue_date}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-slate-700 mb-2">
              Payment Method
            </label>
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className={`${inputClasses} ${errors.payment_method ? errorClasses : ""}`}
            >
              <option value="">Select payment method</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="financing">Financing</option>
              <option value="insurance">Insurance</option>
              <option value="other">Other</option>
            </select>
            {errors.payment_method && (
              <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
            )}
          </div>

          {/* Payment Status */}
          <div>
            <label htmlFor="payment_status" className="block text-sm font-medium text-slate-700 mb-2">
              Payment Status *
            </label>
            <select
              id="payment_status"
              name="payment_status"
              value={formData.payment_status}
              onChange={handleChange}
              className={`${inputClasses} ${errors.payment_status ? errorClasses : ""}`}
              required
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial Payment</option>
              <option value="overdue">Overdue</option>
            </select>
            {errors.payment_status && (
              <p className="mt-1 text-sm text-red-600">{errors.payment_status}</p>
            )}
          </div>

          {/* Invoice Number */}
          <div>
            <label htmlFor="invoice_number" className="block text-sm font-medium text-slate-700 mb-2">
              Invoice Number
            </label>
            <input
              type="text"
              id="invoice_number"
              name="invoice_number"
              value={formData.invoice_number}
              onChange={handleChange}
              className={`${inputClasses} ${errors.invoice_number ? errorClasses : ""}`}
              placeholder="e.g., INV-2024-001"
            />
            {errors.invoice_number && (
              <p className="mt-1 text-sm text-red-600">{errors.invoice_number}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className={`${inputClasses} ${errors.notes ? errorClasses : ""}`}
              placeholder="Additional notes about this payment..."
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
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Add Revenue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
