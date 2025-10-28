import { useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { Users, TrendingUp, Calendar, UserPlus, Clock } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { useApiCache } from "@/react-app/hooks/useApiCache";

const Dashboard = memo(() => {
  // Use API cache for better performance
  const { data: clientsData, loading: clientsLoading } = useApiCache(
    'clients',
    () => fetch("/api/clients").then(res => res.json()),
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );
  
  const { data: leadsData, loading: leadsLoading } = useApiCache(
    'leads',
    () => fetch("/api/leads").then(res => res.json()),
    { ttl: 5 * 60 * 1000 }
  );
  
  const { data: appointmentsData, loading: appointmentsLoading } = useApiCache(
    'appointments',
    () => fetch("/api/appointments").then(res => res.json()),
    { ttl: 2 * 60 * 1000 } // 2 minutes cache for appointments
  );

  const loading = clientsLoading || leadsLoading || appointmentsLoading;

  // Memoize computed stats to avoid recalculation
  const stats = useMemo(() => {
    if (!clientsData || !leadsData || !appointmentsData) {
      return {
        totalClients: 0,
        totalProjects: 0,
        activeProjects: 0,
        totalLeads: 0,
        upcomingAppointments: 0,
        recentClients: [],
        recentProjects: [],
        recentLeads: [],
      };
    }

    // Handle both array and paginated response formats
    const clients = Array.isArray(clientsData) ? clientsData : (clientsData.data || []);
    const leads = Array.isArray(leadsData) ? leadsData : (leadsData.data || []);
    const appointments = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData.data || []);
    
    const now = new Date();
    const upcomingAppointments = appointments.filter((apt: any) => 
      new Date(apt.appointment_date) > now && 
      !["cancelled", "completed", "no_show"].includes(apt.status)
    );
    
    return {
      totalClients: clients.length,
      totalProjects: 0, // We'll add this when we have project endpoints
      activeProjects: 0,
      totalLeads: leads.length,
      upcomingAppointments: upcomingAppointments.length,
      recentClients: clients.slice(0, 5),
      recentProjects: [],
      recentLeads: leads.slice(0, 5),
    };
  }, [clientsData, leadsData, appointmentsData]);

  const StatCard = memo(({ title, value, icon: Icon, color, href }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    href?: string;
  }) => {
    const content = (
      <div className={`p-6 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl hover:shadow-lg hover:shadow-${color}-500/10 transition-all duration-300 transform hover:-translate-y-1`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-xl bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </div>
    );

    return href ? <Link to={href}>{content}</Link> : content;
  });

  // Memoize the current month to avoid recalculation
  const currentMonth = useMemo(() => 
    new Date().toLocaleDateString("en-US", { month: "long" }), 
    []
  );

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading dashboard..." className="min-h-[400px]" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Foundation repair project overview</p>
          </div>
          <Link
            to="/clients/new"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            New Client
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            icon={UserPlus}
            color="purple"
            href="/leads"
          />
          <StatCard
            title="Upcoming Appointments"
            value={stats.upcomingAppointments}
            icon={Clock}
            color="indigo"
            href="/appointments"
          />
          <StatCard
            title="Total Clients"
            value={stats.totalClients}
            icon={Users}
            color="blue"
            href="/clients"
          />
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="This Month"
            value={currentMonth}
            icon={Calendar}
            color="slate"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Leads */}
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Recent Leads</h2>
              <Link
                to="/leads"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>
            
            {stats.recentLeads.length > 0 ? (
              <div className="space-y-4">
                {stats.recentLeads.map((lead: any) => (
                  <Link
                    key={lead.id}
                    to={`/leads/${lead.id}`}
                    className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-medium text-sm">
                        {lead.first_name[0]}{lead.last_name[0]}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-slate-900">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="text-sm text-slate-500">{lead.email || lead.phone}</p>
                    </div>
                    <div className="ml-2">
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                        {lead.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No leads yet</p>
                <Link
                  to="/leads/new"
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Add your first lead
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Quick Actions</h2>
            
            <div className="space-y-4">
              <Link
                to="/leads/new"
                className="flex items-center p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-slate-900">Add New Lead</p>
                  <p className="text-sm text-slate-500">Create lead profile and schedule appointment</p>
                </div>
              </Link>
              
              <Link
                to="/appointments/new"
                className="flex items-center p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-slate-900">Schedule Appointment</p>
                  <p className="text-sm text-slate-500">Book consultation or inspection</p>
                </div>
              </Link>

              <Link
                to="/clients"
                className="flex items-center p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-slate-900">Manage Clients</p>
                  <p className="text-sm text-slate-500">View converted clients and projects</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
