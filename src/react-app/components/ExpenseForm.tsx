import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { CreateProjectExpense, ExpenseCategory } from "@/shared/types";

interface ExpenseFormProps {
  projectId: number;
  onSubmit: (data: CreateProjectExpense) => Promise<void>;
  onCancel: () => void;
}

export default function ExpenseForm({ projectId, onSubmit, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState<CreateProjectExpense>({
    project_id: projectId,
    category_id: 0,
    description: "",
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    is_billable: true,
    vendor_name: "",
    notes: "",
  });
  
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/expense-categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, category_id: data[0].id }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked 
                     : type === 'number' ? parseFloat(value) || 0 
                     : value;
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // First create the expense
      await onSubmit(formData);
      
      // If there's a receipt file, upload it separately
      // Note: This would require the expense ID from the response
      // For now, we'll include the receipt upload in the main expense creation
      
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        console.error("Failed to save expense:", error);
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
          <h3 className="text-lg font-semibold text-slate-900">Add Expense</h3>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-slate-700 mb-2">
              Category *
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className={`${inputClasses} ${errors.category_id ? errorClasses : ""}`}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
            )}
          </div>

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
              placeholder="e.g., Steel piers for foundation repair"
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
            <label htmlFor="expense_date" className="block text-sm font-medium text-slate-700 mb-2">
              Expense Date *
            </label>
            <input
              type="date"
              id="expense_date"
              name="expense_date"
              value={formData.expense_date}
              onChange={handleChange}
              className={`${inputClasses} ${errors.expense_date ? errorClasses : ""}`}
              required
            />
            {errors.expense_date && (
              <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>
            )}
          </div>

          {/* Vendor */}
          <div>
            <label htmlFor="vendor_name" className="block text-sm font-medium text-slate-700 mb-2">
              Vendor/Supplier
            </label>
            <input
              type="text"
              id="vendor_name"
              name="vendor_name"
              value={formData.vendor_name}
              onChange={handleChange}
              className={`${inputClasses} ${errors.vendor_name ? errorClasses : ""}`}
              placeholder="e.g., ABC Steel Supply"
            />
            {errors.vendor_name && (
              <p className="mt-1 text-sm text-red-600">{errors.vendor_name}</p>
            )}
          </div>

          {/* Billable */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_billable"
              name="is_billable"
              checked={formData.is_billable}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
            <label htmlFor="is_billable" className="ml-2 block text-sm text-slate-700">
              This expense is billable to the client
            </label>
          </div>

          {/* Receipt Upload */}
          <div>
            <label htmlFor="receipt" className="block text-sm font-medium text-slate-700 mb-2">
              Receipt (optional)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4">
              <input
                type="file"
                id="receipt"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {receiptFile && (
                <p className="mt-2 text-sm text-slate-600">
                  Selected: {receiptFile.name}
                </p>
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
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className={`${inputClasses} ${errors.notes ? errorClasses : ""}`}
              placeholder="Additional notes about this expense..."
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
              className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
