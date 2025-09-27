import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Calendar, UserPlus, Clock, CheckCircle2 } from "lucide-react";
import { Lead } from "@/shared/types";

interface LeadCardProps {
  lead: Lead;
  appointments?: any[];
  onScheduleAppointment?: (leadId: number) => void;
}

export default function LeadCard({ lead, appointments = [], onScheduleAppointment }: LeadCardProps) {
  

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date) > new Date() && 
    !["cancelled", "completed", "no_show"].includes(apt.status)
  );

  const completedAppointments = appointments.filter(apt => 
    apt.status === "completed"
  );

  const getLeadProgress = () => {
    if (completedAppointments.length > 0) return "conversion_ready";
    if (upcomingAppointments.length > 0) return "appointment_scheduled";
    if (lead.status === "qualified") return "qualified";
    if (lead.status === "contacted") return "contacted";
    return "new";
  };

  const getProgressColor = (progress: string) => {
    switch (progress) {
      case "conversion_ready": return "bg-green-100 text-green-800 border-green-200";
      case "appointment_scheduled": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "qualified": return "bg-blue-100 text-blue-800 border-blue-200";
      case "contacted": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  const getProgressText = (progress: string) => {
    switch (progress) {
      case "conversion_ready": return "Ready to Convert";
      case "appointment_scheduled": return "Appointment Scheduled";
      case "qualified": return "Qualified Lead";
      case "contacted": return "Contacted";
      default: return "New Lead";
    }
  };

  const progress = getLeadProgress();

  return (
    <div className="p-6 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <Link to={`/leads/${lead.id}`} className="flex items-center space-x-3 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {lead.first_name} {lead.last_name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getProgressColor(progress)}`}>
                {getProgressText(progress)}
              </span>
            </div>
          </div>
        </Link>
      </div>

      <div className="space-y-2 text-sm">
        {lead.email && (
          <div className="flex items-center text-slate-600">
            <Mail className="w-4 h-4 mr-2 text-slate-400" />
            <span>{lead.email}</span>
          </div>
        )}
        
        {lead.phone && (
          <div className="flex items-center text-slate-600">
            <Phone className="w-4 h-4 mr-2 text-slate-400" />
            <span>{lead.phone}</span>
          </div>
        )}
        
        {(lead.city || lead.address_line1) && (
          <div className="flex items-center text-slate-600">
            <MapPin className="w-4 h-4 mr-2 text-slate-400" />
            <span>
              {lead.address_line1 && `${lead.address_line1}, `}
              {lead.city && lead.city}
              {lead.state && `, ${lead.state}`}
            </span>
          </div>
        )}
        
        <div className="flex items-center text-slate-600">
          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
          <span>Added {formatDate(lead.created_at)}</span>
        </div>
      </div>

      {/* Appointment Status */}
      {upcomingAppointments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-indigo-600 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              <span>Next: {new Date(upcomingAppointments[0].appointment_date).toLocaleDateString()}</span>
            </div>
            <Link
              to={`/appointments/${upcomingAppointments[0].id}`}
              className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
            >
              View
            </Link>
          </div>
        </div>
      )}

      {completedAppointments.length > 0 && !upcomingAppointments.length && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center text-green-600 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            <span>{completedAppointments.length} completed appointment{completedAppointments.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex items-center space-x-2">
        {!upcomingAppointments.length && onScheduleAppointment && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onScheduleAppointment(lead.id);
            }}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Schedule
          </button>
        )}
        <Link
          to={`/leads/${lead.id}`}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 transition-colors text-sm"
        >
          Details
        </Link>
      </div>

      {lead.source && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Source: <span className="font-medium">{lead.source}</span>
          </p>
        </div>
      )}
    </div>
  );
}
