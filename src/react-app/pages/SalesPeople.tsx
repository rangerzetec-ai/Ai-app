import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Users, TrendingUp, Calendar, CheckCircle } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import SalesPersonCard from "@/react-app/components/SalesPersonCard";

export default function SalesPeople() {
  const [salesPeople, setSalesPeople] = useState<any[]>([]);
  const [salesStats, setSalesStats] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesPeopleRes, statsRes] = await Promise.all([
          fetch("/api/sales-people"),
          fetch("/api/sales-people/stats")
        ]);
        
        const salesPeopleData = await salesPeopleRes.json();
        const statsData = await statsRes.json();
        
        // Handle both array and paginated response formats
        const salesPeople = Array.isArray(salesPeopleData) ? salesPeopleData : (salesPeopleData.data || []);
        const stats = Array.isArray(statsData) ? statsData : (statsData.data || []);
        
        setSalesPeople(salesPeople);
        
        // Convert stats array to object keyed by sales person ID
        const statsMap = stats.reduce((acc: any, stat: any) => {
          acc[stat.sales_person_id] = stat;
          return acc;
        }, {});
        setSalesStats(statsMap);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSalesPeople = salesPeople.filter(person =>
    `${person.first_name} ${person.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.phone?.includes(searchTerm)
  );

  const getOverallStats = () => {
    const totalLeads = Object.values(salesStats).reduce((sum: number, stats: any) => sum + (stats.total_leads || 0), 0);
    const activeLeads = Object.values(salesStats).reduce((sum: number, stats: any) => sum + (stats.active_leads || 0), 0);
    const upcomingAppointments = Object.values(salesStats).reduce((sum: number, stats: any) => sum + (stats.upcoming_appointments || 0), 0);
    const completedAppointments = Object.values(salesStats).reduce((sum: number, stats: any) => sum + (stats.completed_appointments || 0), 0);

    return {
      totalSalesPeople: salesPeople.length,
      activeSalesPeople: salesPeople.filter(p => p.is_active).length,
      totalLeads,
      activeLeads,
      upcomingAppointments,
      completedAppointments
    };
  };

  const overallStats = getOverallStats();

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
            <h1 className="text-3xl font-bold text-slate-900">Sales Team</h1>
            <p className="text-slate-600 mt-1">Manage your sales representatives and their assignments</p>
          </div>
          <Link
            to="/sales-people/new"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sales Person
          </Link>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Team</p>
                <p className="text-2xl font-bold text-blue-900">{overallStats.totalSalesPeople}</p>
              </div>
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active</p>
                <p className="text-2xl font-bold text-green-900">{overallStats.activeSalesPeople}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Leads</p>
                <p className="text-2xl font-bold text-purple-900">{overallStats.totalLeads}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Active Leads</p>
                <p className="text-2xl font-bold text-indigo-900">{overallStats.activeLeads}</p>
              </div>
              <Users className="w-6 h-6 text-indigo-500" />
            </div>
          </div>
          
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Upcoming</p>
                <p className="text-2xl font-bold text-orange-900">{overallStats.upcomingAppointments}</p>
              </div>
              <Calendar className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Completed</p>
                <p className="text-2xl font-bold text-emerald-900">{overallStats.completedAppointments}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-emerald-500" />
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
            placeholder="Search sales team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
          />
        </div>

        {/* Sales People Grid */}
        {filteredSalesPeople.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSalesPeople.map((salesPerson) => (
              <SalesPersonCard 
                key={salesPerson.id} 
                salesPerson={salesPerson}
                stats={salesStats[salesPerson.id] || {
                  total_leads: 0,
                  active_leads: 0,
                  upcoming_appointments: 0,
                  completed_appointments: 0
                }}
              />
            ))}
          </div>
        ) : searchTerm ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No sales people found</h3>
            <p className="text-slate-500">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No sales team members yet</h3>
            <p className="text-slate-500 mb-6">Get started by adding your first sales person</p>
            <Link
              to="/sales-people/new"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Sales Person
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
