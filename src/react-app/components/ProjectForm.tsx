import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { CreateProject, UpdateProject, Project, Client } from "@/shared/types";

interface ProjectFormProps {
  project?: Project;
  clientId?: number;
  onSubmit: (data: CreateProject | UpdateProject) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function ProjectForm({ project, clientId, onSubmit, onCancel, isEditing = false }: ProjectFormProps) {
  const [formData, setFormData] = useState<CreateProject>({
    client_id: clientId || 0,
    project_name: project?.project_name || "",
    description: project?.description || "",
    status: project?.status || "planning",
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(!clientId);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchClients = async () => {
      if (clientId) return; // Skip if client is already specified
      
      try {
        const response = await fetch("/api/clients?paginate=false");
        if (response.ok) {
          const clientsData = await response.json();
          setClients(clientsData);
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [clientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = name === "client_id" ? parseInt(value) : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate required fields
    const newErrors: Record<string, string> = {};
    
    if (!formData.project_name.trim()) {
      newErrors.project_name = "Project name is required";
    }
    
    if (!clientId && (!formData.client_id || formData.client_id === 0)) {
      newErrors.client_id = "Please select a client";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        console.error("Failed to save project:", error);
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
        {/* Client Selection (only show if clientId not provided) */}
        {!clientId && (
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-slate-700 mb-2">
              Client *
            </label>
            {loadingClients ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <select
                id="client_id"
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                className={`${inputClasses} ${errors.client_id ? errorClasses : ""}`}
                required
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            )}
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
            )}
          </div>
        )}

        {/* Project Name */}
        <div>
          <label htmlFor="project_name" className="block text-sm font-medium text-slate-700 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            id="project_name"
            name="project_name"
            value={formData.project_name}
            onChange={handleChange}
            className={`${inputClasses} ${errors.project_name ? errorClasses : ""}`}
            placeholder="e.g., Foundation Repair - Main House"
            required
          />
          {errors.project_name && (
            <p className="mt-1 text-sm text-red-600">{errors.project_name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className={`${inputClasses} ${errors.description ? errorClasses : ""}`}
            placeholder="Describe the foundation issues and planned repairs..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`${inputClasses} ${errors.status ? errorClasses : ""}`}
          >
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status}</p>
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
            {loading ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
