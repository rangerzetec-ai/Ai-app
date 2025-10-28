import Layout from "@/react-app/components/Layout";
import ReportsModule from "@/react-app/components/ReportsModule";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

export default function Reports() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">Business Reports & Analytics</h1>
            <p className="text-slate-600 mt-1">
              Comprehensive insights into your foundation repair business performance
            </p>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Analytics</p>
                <p className="text-2xl font-bold">Performance</p>
                <p className="text-blue-200 text-sm">Track business metrics</p>
              </div>
              <BarChart3 className="w-10 h-10 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Revenue</p>
                <p className="text-2xl font-bold">Tracking</p>
                <p className="text-green-200 text-sm">Financial insights</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Sales</p>
                <p className="text-2xl font-bold">Performance</p>
                <p className="text-purple-200 text-sm">Team productivity</p>
              </div>
              <Users className="w-10 h-10 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Growth</p>
                <p className="text-2xl font-bold">Trends</p>
                <p className="text-orange-200 text-sm">Business growth</p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Reports Module */}
        <ReportsModule />
      </div>
    </Layout>
  );
}
