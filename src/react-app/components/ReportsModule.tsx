import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, DollarSign, Users, TrendingUp, MapPin, FileText, Download } from "lucide-react";
import { ReportMetrics } from "@/shared/types";

interface ReportsModuleProps {
  className?: string;
}

export default function ReportsModule({ className = "" }: ReportsModuleProps) {
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [salesPersonData, setSalesPersonData] = useState<any[]>([]);
  const [leadSourceData, setLeadSourceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'leads' | 'financial' | 'projects'>('overview');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end
      });

      const [metricsRes, monthlyRes, salesRes, leadSourceRes] = await Promise.all([
        fetch(`/api/reports/metrics?${params}`),
        fetch(`/api/reports/monthly-trends?${params}`),
        fetch(`/api/reports/sales-person-performance?${params}`),
        fetch(`/api/reports/lead-sources?${params}`)
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      if (monthlyRes.ok) {
        const monthlyReportData = await monthlyRes.json();
        setMonthlyData(monthlyReportData);
      }

      if (salesRes.ok) {
        const salesReportData = await salesRes.json();
        setSalesPersonData(salesReportData);
      }

      if (leadSourceRes.ok) {
        const leadSourceReportData = await leadSourceRes.json();
        setLeadSourceData(leadSourceReportData);
      }
    } catch (error) {
      console.error("Failed to fetch report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const exportReport = async (type: string) => {
    try {
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end,
        format: 'csv'
      });

      const response = await fetch(`/api/reports/export/${type}?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export report:", error);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <FileText className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-xl font-bold text-slate-900">Business Reports</h3>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2"
            />
          </div>
          <button
            onClick={() => exportReport(activeTab)}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.total_revenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Projects</p>
                <p className="text-2xl font-bold text-green-900">{metrics.active_projects}</p>
                <p className="text-xs text-green-600">of {metrics.total_projects} total</p>
              </div>
              <MapPin className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Lead Conversion</p>
                <p className="text-2xl font-bold text-purple-900">
                  {metrics.total_leads > 0 ? Math.round((metrics.converted_leads / metrics.total_leads) * 100) : 0}%
                </p>
                <p className="text-xs text-purple-600">{metrics.converted_leads} of {metrics.total_leads} leads</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Avg Project Value</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(metrics.average_project_value)}</p>
                <p className="text-xs text-orange-600">Profit margin: {metrics.profit_margin.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'sales', label: 'Sales Performance', icon: Users },
            { id: 'leads', label: 'Lead Analysis', icon: Users },
            { id: 'financial', label: 'Financial', icon: DollarSign },
            { id: 'projects', label: 'Projects', icon: MapPin },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Monthly Revenue Trend */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Monthly Revenue Trend</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
                  <Tooltip formatter={(value: number) => [formatCurrency(Number(value)), 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lead Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Lead Sources</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadSourceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {leadSourceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Appointment Completion Rate</h4>
              <div className="space-y-4">
                {metrics && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Completed Appointments</span>
                      <span className="font-bold text-green-600">
                        {metrics.completed_appointments} / {metrics.total_appointments}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${metrics.total_appointments > 0 ? (metrics.completed_appointments / metrics.total_appointments) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-slate-600">
                      {metrics.total_appointments > 0 ? Math.round((metrics.completed_appointments / metrics.total_appointments) * 100) : 0}% completion rate
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div>
          <h4 className="font-semibold text-slate-900 mb-4">Sales Person Performance</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesPersonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leads" fill="#3B82F6" name="Leads" />
                <Bar dataKey="conversions" fill="#10B981" name="Conversions" />
                <Bar dataKey="revenue" fill="#F59E0B" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Monthly Financial Summary</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
                    <Tooltip formatter={(value: number) => [formatCurrency(Number(value))]} />
                    <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Key Financial Metrics</h4>
              {metrics && (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Total Revenue</span>
                      <span className="font-bold text-green-600">{formatCurrency(metrics.total_revenue)}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Total Expenses</span>
                      <span className="font-bold text-red-600">{formatCurrency(metrics.total_expenses)}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Net Profit</span>
                      <span className={`font-bold ${(metrics.total_revenue - metrics.total_expenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(metrics.total_revenue - metrics.total_expenses)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Profit Margin</span>
                      <span className={`font-bold ${metrics.profit_margin >= 15 ? 'text-green-600' : 'text-orange-600'}`}>
                        {metrics.profit_margin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
