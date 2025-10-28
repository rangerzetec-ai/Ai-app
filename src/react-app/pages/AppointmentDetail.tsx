import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Calendar, Clock, MapPin, User, UserCheck, CheckCircle2, Home, Columns } from "lucide-react";
import Layout from "@/react-app/components/Layout";

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/appointments/${id}`);
        if (response.ok) {
          const data = await response.json();
          setAppointment(data);
        }
      } catch (error) {
        console.error("Failed to fetch appointment:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "completed": return "bg-slate-100 text-slate-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "no_show": return "bg-orange-100 text-orange-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "consultation": return "bg-purple-100 text-purple-800";
      case "estimate": return "bg-blue-100 text-blue-800";
      case "inspection": return "bg-green-100 text-green-800";
      case "follow_up": return "bg-yellow-100 text-yellow-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const handleConvertLead = async () => {
    if (!appointment || appointment.is_lead_converted) return;
    
    setConverting(true);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}/convert-lead`, {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.converted) {
          // Refresh appointment data
          const updatedResponse = await fetch(`/api/appointments/${id}`);
          if (updatedResponse.ok) {
            const updatedData = await updatedResponse.json();
            setAppointment(updatedData);
          }
          
          // Optionally navigate to the new client
          if (result.client) {
            setTimeout(() => {
              navigate(`/clients/${result.client.id}`);
            }, 2000);
          }
        }
      } else {
        const error = await response.json();
        console.error("Failed to convert lead:", error);
      }
    } catch (error) {
      console.error("Failed to convert lead:", error);
    } finally {
      setConverting(false);
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

  if (!appointment) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Appointment not found</h3>
          <Link to="/appointments" className="text-blue-600 hover:text-blue-700">
            Back to appointments
          </Link>
        </div>
      </Layout>
    );
  }

  const datetime = formatDateTime(appointment.appointment_date);
  const leadName = appointment.lead_first_name && appointment.lead_last_name
    ? `${appointment.lead_first_name} ${appointment.lead_last_name}`
    : "Unknown Lead";
  const clientName = appointment.client_first_name && appointment.client_last_name
    ? `${appointment.client_first_name} ${appointment.client_last_name}`
    : null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            to="/appointments"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">
              Appointment with {clientName || leadName}
            </h1>
            <p className="text-slate-600 mt-1">{datetime.date} at {datetime.time}</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/appointments/${appointment.id}/technician`}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Technician Tools
            </Link>
            <Link
              to={`/appointments/${appointment.id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Appointment
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Appointment Details */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Appointment Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-600">Date & Time</p>
                      <p className="text-slate-900 font-medium">{datetime.date}</p>
                      <p className="text-slate-900">{datetime.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-600">Duration</p>
                      <p className="text-slate-900">{appointment.duration_minutes} minutes</p>
                    </div>
                  </div>

                  {appointment.location_address && (
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-600">Location</p>
                        <p className="text-slate-900">{appointment.location_address}</p>
                      </div>
                    </div>
                  )}

                  {appointment.foundation_type && (
                    <div className="flex items-start">
                      <Home className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-600">Foundation</p>
                        <p className="text-slate-900 capitalize">
                          {appointment.foundation_type.replace("_", " ")} Foundation
                        </p>
                        {appointment.pier_type && (
                          <p className="text-sm text-slate-600 flex items-center mt-1">
                            <Columns className="w-4 h-4 mr-1" />
                            {appointment.pier_type.charAt(0).toUpperCase() + appointment.pier_type.slice(1)} Piers
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status.replace("_", " ")}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-2">Type</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(appointment.appointment_type)}`}>
                      {appointment.appointment_type.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center">
                    {appointment.is_lead_converted ? (
                      <UserCheck className="w-5 h-5 text-green-500 mr-3" />
                    ) : (
                      <User className="w-5 h-5 text-purple-500 mr-3" />
                    )}
                    <div>
                      <p className="text-sm text-slate-600">Contact Status</p>
                      <p className="text-slate-900">
                        {appointment.is_lead_converted ? "Converted to Client" : "Lead"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {appointment.notes && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-medium text-slate-900 mb-2">Notes</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{appointment.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info & Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {clientName || leadName}
              </h3>

              {/* Lead Conversion */}
              {!appointment.is_lead_converted && appointment.status === "completed" && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                    <h4 className="font-medium text-green-900">Convert to Client</h4>
                  </div>
                  <p className="text-sm text-green-700 mb-4">
                    This appointment is completed. Convert this lead to a client to create projects and manage ongoing work.
                  </p>
                  <button
                    onClick={handleConvertLead}
                    disabled={converting}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {converting ? "Converting..." : "Convert to Client"}
                  </button>
                </div>
              )}

              {appointment.is_lead_converted && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <UserCheck className="w-5 h-5 text-blue-600 mr-2" />
                    <h4 className="font-medium text-blue-900">Converted to Client</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    This lead has been successfully converted to a client.
                  </p>
                  {appointment.client_id && (
                    <Link
                      to={`/clients/${appointment.client_id}`}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Client Profile
                    </Link>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-3">
                <Link
                  to={appointment.is_lead_converted ? `/clients/${appointment.client_id}` : `/leads/${appointment.lead_id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 mr-2" />
                  View {appointment.is_lead_converted ? "Client" : "Lead"} Profile
                </Link>

                {appointment.is_lead_converted && appointment.client_id && (
                  <Link
                    to={`/clients/${appointment.client_id}/projects/new`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                  >
                    Create Project
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
