import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Building2, Calendar, User, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import { Project, Client } from "@/shared/types";

interface ProjectWithClient extends Project {
  client_first_name?: string;
  client_last_name?: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, clientsRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/clients?paginate=false")
        ]);

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData);
        }

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add client names to projects
  const projectsWithClients = projects.map(project => {
    const client = clients.find(c => c.id === project.client_id);
    return {
      ...project,
      client_first_name: client?.first_name,
      client_last_name: client?.last_name
    };
  });

  const filteredProjects = filter === "all" 
    ? projectsWithClients 
    : projectsWithClients.filter(project => project.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "planning": return <Clock className="w-4 h-4 text-yellow-600" />;
      case "in_progress": return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case "completed": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "cancelled": return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const statusCounts = {
    all: projectsWithClients.length,
    planning: projectsWithClients.filter(p => p.status === "planning").length,
    in_progress: projectsWithClients.filter(p => p.status === "in_progress").length,
    completed: projectsWithClients.filter(p => p.status === "completed").length,
    cancelled: projectsWithClients.filter(p => p.status === "cancelled").length,
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
            <p className="text-slate-600 mt-1">Manage all foundation repair projects</p>
          </div>
          <Link
            to="/projects/new"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
          {[
            { key: "all", label: "All", count: statusCounts.all },
            { key: "planning", label: "Planning", count: statusCounts.planning },
            { key: "in_progress", label: "In Progress", count: statusCounts.in_progress },
            { key: "completed", label: "Completed", count: statusCounts.completed },
            { key: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === tab.key
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label} {tab.count > 0 && (
                <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                  filter === tab.key ? "bg-blue-100" : "bg-slate-200"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block p-6 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">
                        {project.project_name}
                      </h3>
                      {project.client_first_name && project.client_last_name && (
                        <p className="text-sm text-slate-600 flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {project.client_first_name} {project.client_last_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(project.status)}
                  </div>
                </div>

                {project.description && (
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status.replace("_", " ")}
                  </span>
                  <div className="flex items-center text-xs text-slate-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(project.created_at)}
                  </div>
                </div>

                <div className="mt-3 flex items-center space-x-2">
                  {project.improvement_sketch_url && (
                    <div className="w-2 h-2 bg-green-400 rounded-full" title="Has sketch"></div>
                  )}
                  {project.pier_placements && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full" title="Has pier placements"></div>
                  )}
                  {project.model_data && (
                    <div className="w-2 h-2 bg-purple-400 rounded-full" title="Has 3D model"></div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {filter === "all" ? "No projects yet" : `No ${filter.replace("_", " ")} projects`}
            </h3>
            <p className="text-slate-500 mb-6">
              {filter === "all" 
                ? "Start by creating your first foundation repair project"
                : `No projects with ${filter.replace("_", " ")} status found`
              }
            </p>
            {filter === "all" && (
              <Link
                to="/projects/new"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Link>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
