import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar, Search, Clock, CheckCircle, XCircle } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import AppointmentCard from "@/react-app/components/AppointmentCard";
import MobileAppointmentCard from "@/react-app/components/MobileAppointmentCard";
import { useIsMobile } from "@/react-app/hooks/useIsMobile";
import { Appointment } from "@/shared/types";

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch("/api/appointments");
        const data = await response.json();
        
        // Handle both array and paginated response formats
        const appointments = Array.isArray(data) ? data : (data.data || []);
        setAppointments(appointments);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.location_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.id.toString().includes(searchTerm);
    
    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    return {
      scheduled: appointments.filter(a => a.status === "scheduled").length,
      confirmed: appointments.filter(a => a.status === "confirmed").length,
      completed: appointments.filter(a => a.status === "completed").length,
      cancelled: appointments.filter(a => a.status === "cancelled").length,
      no_show: appointments.filter(a => a.status === "no_show").length,
    };
  };

  const statusCounts = getStatusCounts();

  // Sort appointments by date
  const sortedAppointments = filteredAppointments.sort((a, b) => 
    new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
  );

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = sortedAppointments.filter(apt => 
    new Date(apt.appointment_date) > now && !["cancelled", "completed", "no_show"].includes(apt.status)
  );
  const pastAppointments = sortedAppointments.filter(apt => 
    new Date(apt.appointment_date) <= now || ["cancelled", "completed", "no_show"].includes(apt.status)
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`font-bold text-slate-900 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
              Appointments
            </h1>
            {!isMobile && (
              <p className="text-slate-600 mt-1">Manage your consultation and inspection schedule</p>
            )}
          </div>
          <Link
            to="/appointments/new"
            className={`inline-flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
              isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
            }`}
          >
            <Plus className={`mr-2 ${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
            {isMobile ? 'New' : 'New Appointment'}
          </Link>
        </div>

        {/* Status Summary Cards */}
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-5'}`}>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-900">{statusCounts.scheduled}</p>
              </div>
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-900">{statusCounts.confirmed}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{statusCounts.completed}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-slate-500" />
            </div>
          </div>
          
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-900">{statusCounts.cancelled}</p>
              </div>
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
          
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">No Show</p>
                <p className="text-2xl font-bold text-orange-900">{statusCounts.no_show}</p>
              </div>
              <XCircle className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 backdrop-blur-sm"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>

        {/* Appointments */}
        {sortedAppointments.length > 0 ? (
          <div className="space-y-8">
            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                  Upcoming Appointments ({upcomingAppointments.length})
                </h2>
                <div className={isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
                  {upcomingAppointments.map((appointment) => (
                    isMobile ? (
                      <MobileAppointmentCard key={appointment.id} appointment={appointment} />
                    ) : (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div className={isMobile ? "pb-24" : ""}>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Past Appointments ({pastAppointments.length})
                </h2>
                <div className={isMobile ? "space-y-4 pb-8" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
                  {pastAppointments.map((appointment) => (
                    isMobile ? (
                      <MobileAppointmentCard key={appointment.id} appointment={appointment} />
                    ) : (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : searchTerm || filterStatus !== "all" ? (
          <div className={`text-center py-16 ${isMobile ? "pb-32" : ""}`}>
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No appointments found</h3>
            <p className="text-slate-500">Try adjusting your search terms or filters</p>
          </div>
        ) : (
          <div className={`text-center py-16 ${isMobile ? "pb-32" : ""}`}>
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No appointments yet</h3>
            <p className="text-slate-500 mb-6">Get started by scheduling your first appointment</p>
            <Link
              to="/appointments/new"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
