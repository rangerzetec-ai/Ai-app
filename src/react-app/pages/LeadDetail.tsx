import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Phone, Mail, Calendar, Edit, UserCheck, Clock } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import AppointmentCard from "@/react-app/components/AppointmentCard";
import { Lead, Appointment } from "@/shared/types";

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        const [leadRes, appointmentsRes] = await Promise.all([
          fetch(`/api/leads/${id}`),
          fetch(`/api/leads/${id}/appointments`)
        ]);
        
        if (leadRes.ok) {
          const leadData = await leadRes.json();
          setLead(leadData);
        }
        
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          setAppointments(appointmentsData);
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
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-yellow-100 text-yellow-800";
      case "qualified": return "bg-green-100 text-green-800";
      case "unqualified": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date) > new Date() && 
    !["cancelled", "completed", "no_show"].includes(apt.status)
  );

  const pastAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date) <= new Date() || 
    ["cancelled", "completed", "no_show"].includes(apt.status)
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!lead) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Lead not found</h3>
          <Link to="/leads" className="text-blue-600 hover:text-blue-700">
            Back to leads
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
            to="/leads"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">
              {lead.first_name} {lead.last_name}
            </h1>
            <p className="text-slate-600 mt-1">Lead information and appointments</p>
          </div>
          <Link
            to={`/leads/${lead.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Lead
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Info */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Lead Information</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                  {lead.status.replace("_", " ")}
                </span>
              </div>
              
              <div className="space-y-4">
                {lead.email && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-700">
                        {lead.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {lead.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-600">Phone</p>
                      <a href={`tel:${lead.phone}`} className="text-blue-600 hover:text-blue-700">
                        {lead.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {(lead.address_line1 || lead.city) && (
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Address</p>
                      <div className="text-slate-900">
                        {lead.address_line1 && <div>{lead.address_line1}</div>}
                        {lead.address_line2 && <div>{lead.address_line2}</div>}
                        {lead.city && (
                          <div>
                            {lead.city}
                            {lead.state && `, ${lead.state}`}
                            {lead.zip_code && ` ${lead.zip_code}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-slate-400 mr-3" />
                  <div>
                    <p className="text-sm text-slate-600">Lead Since</p>
                    <p className="text-slate-900">{formatDate(lead.created_at)}</p>
                  </div>
                </div>

                {lead.source && (
                  <div className="flex items-center">
                    <UserCheck className="w-5 h-5 text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-600">Source</p>
                      <p className="text-slate-900">{lead.source}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {lead.notes && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-medium text-slate-900 mb-2">Notes</h3>
                  <p className="text-slate-600 text-sm whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
                <Link
                  to={`/leads/${lead.id}/appointments/new`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Appointment
                </Link>
              </div>
            </div>
          </div>

          {/* Appointments */}
          <div className="lg:col-span-2">
            {/* Upcoming Appointments */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                  Upcoming Appointments
                </h2>
              </div>
              
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No upcoming appointments</h3>
                  <p className="text-slate-500 mb-4">Schedule the first appointment with this lead</p>
                  <Link
                    to={`/leads/${lead.id}/appointments/new`}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Appointment
                  </Link>
                </div>
              )}
            </div>

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Appointment History</h2>
                <div className="space-y-4">
                  {pastAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
