import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import ProjectForm from "@/react-app/components/ProjectForm";
import { CreateProject, UpdateProject, Client } from "@/shared/types";

export default function NewProject() {
  const params = useParams<{ clientId?: string }>();
  const clientId = params.clientId;
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (response.ok) {
          const clientData = await response.json();
          setClient(clientData);
        } else {
          console.error("Failed to fetch client");
          navigate("/clients");
        }
      } catch (error) {
        console.error("Failed to fetch client:", error);
        navigate("/clients");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId, navigate]);

  const handleSubmit = async (data: CreateProject | UpdateProject) => {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const project = await response.json();
        navigate(`/projects/${project.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    if (client && clientId) {
      navigate(`/clients/${client.id}`);
    } else {
      navigate("/projects");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // If clientId was provided but client not found, show error
  if (clientId && !client) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Client not found</h3>
          <button
            onClick={() => navigate("/clients")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to clients
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">New Project</h1>
            <p className="text-slate-600 mt-1">
              {client ? `Create a new project for ${client.first_name} ${client.last_name}` : "Create a new foundation repair project"}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <ProjectForm
            clientId={clientId ? parseInt(clientId) : undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={false}
          />
        </div>
      </div>
    </Layout>
  );
}
