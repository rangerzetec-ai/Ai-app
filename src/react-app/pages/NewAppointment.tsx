import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Calendar } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import AppointmentForm from "@/react-app/components/AppointmentForm";
import LeadAndAppointmentForm from "@/react-app/components/LeadAndAppointmentForm";
import { CreateAppointment, UpdateAppointment, Lead, CreateLeadWithAppointment } from "@/shared/types";

export default function NewAppointment() {
  const { leadId } = useParams<{ leadId?: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [createNewLead, setCreateNewLead] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all leads for selection if no specific lead ID
        const leadsRes = await fetch("/api/leads");
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          // Handle both array and paginated response formats
          const leads = Array.isArray(leadsData) ? leadsData : (leadsData.data || []);
          setLeads(leads);
        }

        // If specific lead ID provided, fetch that lead
        if (leadId) {
          const leadRes = await fetch(`/api/leads/${leadId}`);
          if (leadRes.ok) {
            const leadData = await leadRes.json();
            setLead(leadData);
          } else {
            console.error("Failed to fetch lead");
            navigate("/leads");
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leadId, navigate]);

  const handleSubmit = async (data: CreateAppointment | UpdateAppointment) => {
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const appointment = await response.json();
        navigate(`/appointments/${appointment.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create appointment");
      }
    } catch (error) {
      console.error("Failed to create appointment:", error);
      throw error;
    }
  };

  const handleLeadAndAppointmentSubmit = async (data: CreateLeadWithAppointment) => {
    try {
      const response = await fetch("/api/leads-with-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        navigate(`/appointments/${result.appointment.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create lead and appointment");
      }
    } catch (error) {
      console.error("Failed to create lead and appointment:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    if (lead) {
      navigate(`/leads/${lead.id}`);
    } else {
      navigate("/appointments");
    }
  };

  const toggleCreateMode = () => {
    setCreateNewLead(!createNewLead);
    setLead(null);
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

  if (leadId && !lead) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Lead not found</h3>
          <button
            onClick={() => navigate("/leads")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to leads
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
            <h1 className="text-3xl font-bold text-slate-900">Schedule Appointment</h1>
            <p className="text-slate-600 mt-1">
              {lead 
                ? `Create an appointment for ${lead.first_name} ${lead.last_name}`
                : createNewLead
                ? "Create a new lead and schedule their first appointment"
                : "Schedule a new appointment with a lead"
              }
            </p>
          </div>
        </div>

        {/* Mode Selection and Lead Selection */}
        {!lead && !createNewLead && (
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Choose Option</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setCreateNewLead(true)}
                  className="p-6 text-left border-2 border-dashed border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <UserPlus className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Create New Lead & Appointment</h4>
                      <p className="text-sm text-slate-600">Add a new lead and schedule their first appointment in one step</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setCreateNewLead(false)}
                  className="p-6 text-left border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Schedule for Existing Lead</h4>
                      <p className="text-sm text-slate-600">Choose from your existing leads to schedule an appointment</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Lead Selection (if selecting existing lead) */}
            {!createNewLead && leads.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Select a Lead</h3>
                  <button
                    onClick={toggleCreateMode}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Create new lead instead
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leads.map((leadOption) => (
                    <button
                      key={leadOption.id}
                      onClick={() => setLead(leadOption)}
                      className="p-4 text-left border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200"
                    >
                      <h4 className="font-medium text-slate-900">
                        {leadOption.first_name} {leadOption.last_name}
                      </h4>
                      <p className="text-sm text-slate-600">{leadOption.email || leadOption.phone}</p>
                      <span className="inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {leadOption.status.replace("_", " ")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Forms */}
        {createNewLead && (
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Create New Lead & Appointment</h2>
                <p className="text-slate-600 mt-1">Fill out both lead information and appointment details below</p>
              </div>
              <button
                onClick={toggleCreateMode}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Use existing lead instead
              </button>
            </div>
            <LeadAndAppointmentForm
              onSubmit={handleLeadAndAppointmentSubmit}
              onCancel={handleCancel}
            />
          </div>
        )}

        {(lead || leadId) && !createNewLead && (
          <div className="max-w-2xl">
            <AppointmentForm
              lead={lead || undefined}
              leadId={lead?.id || (leadId ? parseInt(leadId) : undefined)}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isEditing={false}
            />
          </div>
        )}

        {/* No leads available - offer to create new lead */}
        {!lead && !createNewLead && leads.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No leads available</h3>
            <p className="text-slate-500 mb-6">Create your first lead and schedule an appointment in one step</p>
            <button
              onClick={() => setCreateNewLead(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create New Lead & Appointment
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
