import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Edit, Mail, Phone, User, TrendingUp, Calendar, Users, CheckCircle } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import LeadCard from "@/react-app/components/LeadCard";
import AppointmentCard from "@/react-app/components/AppointmentCard";

export default function SalesPersonDetail() {
  const { id } = useParams<{ id: string }>();
  const [salesPerson, setSalesPerson] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        const [salesPersonRes, leadsRes, appointmentsRes] = await Promise.all([
          fetch(`/api/sales-people/${id}`),
          fetch(`/api/sales-people/${id}/leads`),
          fetch(`/api/sales-people/${id}/appointments`)
        ]);
        
        if (salesPersonRes.ok) {
          const salesPersonData = await salesPersonRes.json();
          setSalesPerson(salesPersonData);
        }
        
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setLeads(leadsData);
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

  const getStats = () => {
    const upcomingAppointments = appointments.filter(apt => 
      new Date(apt.appointment_date) > new Date() && 
      !["cancelled", "completed", "no_show"].includes(apt.status)
    );

    const completedAppointments = appointments.filter(apt => 
      apt.status === "completed"
    );

    const activeLeads = leads.filter(lead => 
      !["unqualified"].includes(lead.status)
    );

    return {
      totalLeads: leads.length,
      activeLeads: activeLeads.length,
      upcomingAppointments: upcomingAppointments.length,
      completedAppointments: completedAppointments.length
    };
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

  if (!salesPerson) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Sales person not found</h3>
          <Link to="/sales-people" className="text-blue-600 hover:text-blue-700">
            Back to sales team
          </Link>
        </div>
      </Layout>
    );
  }

  const stats = getStats();
  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date) > new Date() && 
    !["cancelled", "completed", "no_show"].includes(apt.status)
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            to="/sales-people"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">
              {salesPerson.first_name} {salesPerson.last_name}
            </h1>
            <p className="text-slate-600 mt-1">Sales team member details and performance</p>
          </div>
          <Link
            to={`/sales-people/${salesPerson.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Sales Person
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Person Info */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  salesPerson.is_active 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {salesPerson.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-slate-400 mr-3" />
                  <div>
                    <p className="text-sm text-slate-600">Sales Person</p>
                    <p className="text-slate-900 font-medium">
                      {salesPerson.first_name} {salesPerson.last_name}
                    </p>
                  </div>
                </div>

                {salesPerson.email && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <a href={`mailto:${salesPerson.email}`} className="text-blue-600 hover:text-blue-700">
                        {salesPerson.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {salesPerson.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-600">Phone</p>
                      <a href={`tel:${salesPerson.phone}`} className="text-blue-600 hover:text-blue-700">
                        {salesPerson.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-slate-400 mr-3" />
                  <div>
                    <p className="text-sm text-slate-600">Joined</p>
                    <p className="text-slate-900">{formatDate(salesPerson.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-900 mb-4">Performance Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 mx-auto text-purple-600 mb-1" />
                    <p className="text-sm text-purple-600">Total Leads</p>
                    <p className="text-xl font-bold text-purple-900">{stats.totalLeads}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Users className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                    <p className="text-sm text-blue-600">Active Leads</p>
                    <p className="text-xl font-bold text-blue-900">{stats.activeLeads}</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <Calendar className="w-6 h-6 mx-auto text-orange-600 mb-1" />
                    <p className="text-sm text-orange-600">Upcoming</p>
                    <p className="text-xl font-bold text-orange-900">{stats.upcomingAppointments}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 mx-auto text-green-600 mb-1" />
                    <p className="text-sm text-green-600">Completed</p>
                    <p className="text-xl font-bold text-green-900">{stats.completedAppointments}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leads and Appointments */}
          <div className="lg:col-span-2">
            {/* Upcoming Appointments */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Upcoming Appointments</h2>
              
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.slice(0, 3).map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} showLeadInfo={true} />
                  ))}
                  {upcomingAppointments.length > 3 && (
                    <div className="text-center">
                      <Link
                        to="/appointments"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View all {upcomingAppointments.length} upcoming appointments →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No upcoming appointments</h3>
                  <p className="text-slate-500">This sales person has no scheduled appointments</p>
                </div>
              )}
            </div>

            {/* Assigned Leads */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Assigned Leads</h2>
              
              {leads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {leads.slice(0, 4).map((lead) => (
                    <LeadCard 
                      key={lead.id} 
                      lead={lead}
                      appointments={appointments.filter(apt => apt.lead_id === lead.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No assigned leads</h3>
                  <p className="text-slate-500">This sales person has no leads assigned yet</p>
                </div>
              )}
              
              {leads.length > 4 && (
                <div className="text-center mt-6">
                  <Link
                    to="/leads"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all {leads.length} assigned leads →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
