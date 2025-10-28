import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import ProjectForm from "@/react-app/components/ProjectForm";
import { Project, UpdateProject, Client } from "@/shared/types";

export default function EditProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        const projectRes = await fetch(`/api/projects/${id}`);
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setProject(projectData);
          
          // Fetch client info
          const clientRes = await fetch(`/api/clients/${projectData.client_id}`);
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            setClient(clientData);
          }
        } else {
          console.error("Failed to fetch project");
          navigate("/clients");
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
        navigate("/clients");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleSubmit = async (data: UpdateProject) => {
    if (!project) return;
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        navigate(`/projects/${project.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update project");
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    if (project) {
      navigate(`/projects/${project.id}`);
    } else {
      navigate("/clients");
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

  if (!project || !client) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Project not found</h3>
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
            <h1 className="text-3xl font-bold text-slate-900">Edit Project</h1>
            <p className="text-slate-600 mt-1">
              Update {project.project_name} for {client.first_name} {client.last_name}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <ProjectForm
            project={project}
            clientId={project.client_id}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={true}
          />
        </div>
      </div>
    </Layout>
  );
}
