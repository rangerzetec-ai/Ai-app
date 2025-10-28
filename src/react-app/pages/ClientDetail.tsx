import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Phone, Mail, Calendar, Edit, FolderOpen } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import { Client, Project } from "@/shared/types";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        const [clientRes, projectsRes] = await Promise.all([
          fetch(`/api/clients/${id}`),
          fetch(`/api/clients/${id}/projects`)
        ]);
        
        if (clientRes.ok) {
          const clientData = await clientRes.json();
          setClient(clientData);
        }
        
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  if (!client) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Client not found</h3>
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
            to="/clients"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">
              {client.first_name} {client.last_name}
            </h1>
            <p className="text-slate-600 mt-1">Client information and projects</p>
          </div>
          <Link
            to={`/clients/${client.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Client
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Info */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
              
              <div className="space-y-4">
                {client.email && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <a href={`mailto:${client.email}`} className="text-blue-600 hover:text-blue-700">
                        {client.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-600">Phone</p>
                      <a href={`tel:${client.phone}`} className="text-blue-600 hover:text-blue-700">
                        {client.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {(client.address_line1 || client.city) && (
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Address</p>
                      <div className="text-slate-900">
                        {client.address_line1 && <div>{client.address_line1}</div>}
                        {client.address_line2 && <div>{client.address_line2}</div>}
                        {client.city && (
                          <div>
                            {client.city}
                            {client.state && `, ${client.state}`}
                            {client.zip_code && ` ${client.zip_code}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-slate-400 mr-3" />
                  <div>
                    <p className="text-sm text-slate-600">Client Since</p>
                    <p className="text-slate-900">{formatDate(client.created_at)}</p>
                  </div>
                </div>
              </div>
              
              {client.notes && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-medium text-slate-900 mb-2">Notes</h3>
                  <p className="text-slate-600 text-sm whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Projects */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Projects</h2>
              <Link
                to={`/clients/${client.id}/projects/new`}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Link>
            </div>
            
            {projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block p-6 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {project.project_name}
                        </h3>
                        
                        {project.description && (
                          <p className="text-slate-600 mb-3 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status.replace("_", " ")}
                          </span>
                          <span>Created {formatDate(project.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {project.improvement_sketch_url && (
                          <div className="w-2 h-2 bg-green-400 rounded-full" title="Has sketch"></div>
                        )}
                        {project.pier_placements && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full" title="Has pier placements"></div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl">
                <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No projects yet</h3>
                <p className="text-slate-500 mb-6">Start by creating the first project for this client</p>
                <Link
                  to={`/clients/${client.id}/projects/new`}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
