import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, UserPlus, Calendar, TrendingUp } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import LeadCard from "@/react-app/components/LeadCard";
import { Lead } from "@/shared/types";

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, appointmentsRes] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/appointments")
        ]);
        
        const leadsData = await leadsRes.json();
        const appointmentsData = await appointmentsRes.json();
        
        // Handle both array and paginated response formats
        const leads = Array.isArray(leadsData) ? leadsData : (leadsData.data || []);
        const appointments = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData.data || []);
        
        setLeads(leads);
        setAppointments(appointments);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredLeads = leads.filter(lead =>
    `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.address_line1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusCounts = () => {
    const leadsWithAppointments = leads.filter(lead => 
      appointments.some(apt => apt.lead_id === lead.id)
    );
    
    const conversionReadyLeads = leads.filter(lead => 
      appointments.some(apt => apt.lead_id === lead.id && apt.status === "completed")
    );

    return {
      new: leads.filter(l => l.status === "new").length,
      contacted: leads.filter(l => l.status === "contacted").length,
      qualified: leads.filter(l => l.status === "qualified").length,
      unqualified: leads.filter(l => l.status === "unqualified").length,
      with_appointments: leadsWithAppointments.length,
      conversion_ready: conversionReadyLeads.length,
    };
  };

  const statusCounts = getStatusCounts();

  const handleScheduleAppointment = (leadId: number) => {
    navigate(`/leads/${leadId}/appointments/new`);
  };

  const getLeadAppointments = (leadId: number) => {
    return appointments.filter(apt => apt.lead_id === leadId);
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
            <h1 className="text-3xl font-bold text-slate-900">Leads</h1>
            <p className="text-slate-600 mt-1">Manage your potential foundation repair clients</p>
          </div>
          <Link
            to="/leads/new"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Lead
          </Link>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">New Leads</p>
                <p className="text-2xl font-bold text-blue-900">{statusCounts.new}</p>
              </div>
              <UserPlus className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Contacted</p>
                <p className="text-2xl font-bold text-yellow-900">{statusCounts.contacted}</p>
              </div>
              <UserPlus className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Qualified</p>
                <p className="text-2xl font-bold text-green-900">{statusCounts.qualified}</p>
              </div>
              <UserPlus className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Unqualified</p>
                <p className="text-2xl font-bold text-red-900">{statusCounts.unqualified}</p>
              </div>
              <UserPlus className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">With Appointments</p>
                <p className="text-2xl font-bold text-indigo-900">{statusCounts.with_appointments}</p>
              </div>
              <Calendar className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
          
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Ready to Convert</p>
                <p className="text-2xl font-bold text-emerald-900">{statusCounts.conversion_ready}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
          />
        </div>

        {/* Leads Grid */}
        {filteredLeads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                appointments={getLeadAppointments(lead.id)}
                onScheduleAppointment={handleScheduleAppointment}
              />
            ))}
          </div>
        ) : searchTerm ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No leads found</h3>
            <p className="text-slate-500">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No leads yet</h3>
            <p className="text-slate-500 mb-6">Get started by adding your first lead</p>
            <Link
              to="/leads/new"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
