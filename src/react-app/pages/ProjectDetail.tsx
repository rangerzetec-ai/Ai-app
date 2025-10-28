import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Upload, Play, Save, Edit } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import Enhanced3DViewer from "@/react-app/components/Enhanced3DViewer";
import ProjectFinancials from "@/react-app/components/ProjectFinancials";
import { Project, Client, PierPlacements } from "@/shared/types";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [client] = useState<Client | null>(null);
  const [pierPlacements, setPierPlacements] = useState<PierPlacements>([]);
  const [loading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/projects/${id}`);
        if (response.ok) {
          const projectData = await response.json();
          setProject(projectData);
          
          // Parse pier placements if they exist
          if (projectData.pier_placements) {
            try {
              const placements = JSON.parse(projectData.pier_placements);
              setPierPlacements(placements);
            } catch (e) {
              console.warn("Failed to parse pier placements:", e);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      }
    };

    fetchProjectData();
  }, [id]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !project) return;

    const formData = new FormData();
    formData.append("sketch", file);

    try {
      const response = await fetch(`/api/projects/${project.id}/upload-sketch`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
      } else {
        console.error("Failed to upload file");
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const savePierPlacements = async () => {
    if (!project) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/pier-placements`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pierPlacements),
      });

      if (response.ok) {
        // Show success feedback
        console.log("Pier placements saved successfully");
      }
    } catch (error) {
      console.error("Failed to save pier placements:", error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
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

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Project not found</h3>
          <Link to="/clients" className="text-blue-600 hover:text-blue-700">
            Back to clients
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            to={client ? `/clients/${client.id}` : "/clients"}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{project.project_name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status.replace("_", " ")}
              </span>
            </div>
            {client && (
              <p className="text-slate-600">
                Client: <Link to={`/clients/${client.id}`} className="text-blue-600 hover:text-blue-700">
                  {client.first_name} {client.last_name}
                </Link>
              </p>
            )}
          </div>
          <Link
            to={`/projects/${project.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Project
          </Link>
        </div>

        {/* Project Info */}
        {project.description && (
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-600">{project.description}</p>
          </div>
        )}

        {/* Project Financials */}
        <ProjectFinancials project={project} onUpdate={() => window.location.reload()} />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Tools Panel */}
          <div className="xl:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Improvement Sketch</h3>
                
                {project.improvement_sketch_url ? (
                  <div className="space-y-3">
                    <img
                      src={`/api/files/${project.improvement_sketch_url}`}
                      alt="Improvement sketch"
                      className="w-full h-32 object-cover rounded-lg border border-slate-200"
                    />
                    <p className="text-sm text-slate-600">{project.improvement_sketch_filename}</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                    >
                      Replace Sketch
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 mb-3">Upload improvement sketch</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Choose File
                      </button>
                    </div>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-4">3D Actions</h3>
                <div className="space-y-3">
                  <button
                    disabled={!project.improvement_sketch_url}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Generate 3D Model
                  </button>
                  
                  <button
                    onClick={savePierPlacements}
                    disabled={saving || pierPlacements.length === 0}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Piers"}
                  </button>
                  
                  <button
                    disabled={pierPlacements.length === 0}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Generate Animation
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Pier Summary</h3>
                <div className="text-sm space-y-1">
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
            </div>
          </div>

          {/* 3D Viewer */}
          <div className="xl:col-span-3">
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
              <div className="h-[600px]">
                <Enhanced3DViewer
                  pierPlacements={pierPlacements}
                  onPierPlacementChange={setPierPlacements}
                  editable={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
