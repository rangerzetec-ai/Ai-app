import { Link } from "react-router-dom";
import { Mail, Phone, User, Users, Calendar, CheckCircle } from "lucide-react";

interface SalesPersonCardProps {
  salesPerson: any;
  stats?: {
    total_leads: number;
    active_leads: number;
    upcoming_appointments: number;
    completed_appointments: number;
  };
}

export default function SalesPersonCard({ salesPerson, stats }: SalesPersonCardProps) {
  const formatName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`;
  };

  return (
    <div className="p-6 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {formatName(salesPerson.first_name, salesPerson.last_name)}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                salesPerson.is_active 
                  ? "bg-green-100 text-green-800 border border-green-200" 
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}>
                {salesPerson.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {salesPerson.email && (
          <div className="flex items-center text-slate-600">
            <Mail className="w-4 h-4 mr-2 text-slate-400" />
            <a href={`mailto:${salesPerson.email}`} className="text-blue-600 hover:text-blue-700">
              {salesPerson.email}
            </a>
          </div>
        )}
        
        {salesPerson.phone && (
          <div className="flex items-center text-slate-600">
            <Phone className="w-4 h-4 mr-2 text-slate-400" />
            <a href={`tel:${salesPerson.phone}`} className="text-blue-600 hover:text-blue-700">
              {salesPerson.phone}
            </a>
          </div>
        )}
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-purple-500" />
              <div>
                <p className="text-xs text-slate-500">Total Leads</p>
                <p className="text-sm font-semibold text-slate-900">{stats.total_leads}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-500" />
              <div>
                <p className="text-xs text-slate-500">Active Leads</p>
                <p className="text-sm font-semibold text-slate-900">{stats.active_leads}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
              <div>
                <p className="text-xs text-slate-500">Upcoming</p>
                <p className="text-sm font-semibold text-slate-900">{stats.upcoming_appointments}</p>
              </div>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              <div>
                <p className="text-xs text-slate-500">Completed</p>
                <p className="text-sm font-semibold text-slate-900">{stats.completed_appointments}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex items-center space-x-2">
        <Link
          to={`/sales-people/${salesPerson.id}`}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm"
        >
          View Details
        </Link>
        <Link
          to={`/sales-people/${salesPerson.id}/edit`}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 transition-colors text-sm"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
