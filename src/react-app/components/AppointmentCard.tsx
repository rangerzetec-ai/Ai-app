import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, User, UserCheck, Home } from "lucide-react";

interface AppointmentCardProps {
  appointment: any; // Extended appointment with lead/client data
  showLeadInfo?: boolean;
}

export default function AppointmentCard({ appointment, showLeadInfo = true }: AppointmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "completed": return "bg-slate-100 text-slate-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "no_show": return "bg-orange-100 text-orange-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "consultation": return "bg-purple-100 text-purple-800";
      case "estimate": return "bg-blue-100 text-blue-800";
      case "inspection": return "bg-green-100 text-green-800";
      case "follow_up": return "bg-yellow-100 text-yellow-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const datetime = formatDateTime(appointment.appointment_date);
  const leadName = appointment.lead_first_name && appointment.lead_last_name
    ? `${appointment.lead_first_name} ${appointment.lead_last_name}`
    : "Unknown Lead";
  const clientName = appointment.client_first_name && appointment.client_last_name
    ? `${appointment.client_first_name} ${appointment.client_last_name}`
    : null;

  return (
    <Link
      to={`/appointments/${appointment.id}`}
      className="block p-6 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            {showLeadInfo && (
              <div className="flex items-center space-x-2 mb-1">
                {appointment.is_lead_converted ? (
                  <UserCheck className="w-4 h-4 text-green-600" />
                ) : (
                  <User className="w-4 h-4 text-purple-600" />
                )}
                <h3 className="text-lg font-semibold text-slate-900">
                  {clientName || leadName}
                </h3>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                {appointment.status.replace("_", " ")}
              </span>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(appointment.appointment_type)}`}>
                {appointment.appointment_type.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-slate-600">
          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
          <span>{datetime.date} at {datetime.time}</span>
        </div>
        
        <div className="flex items-center text-slate-600">
          <Clock className="w-4 h-4 mr-2 text-slate-400" />
          <span>{appointment.duration_minutes} minutes</span>
        </div>
        
        {appointment.location_address && (
          <div className="flex items-center text-slate-600">
            <MapPin className="w-4 h-4 mr-2 text-slate-400" />
            <span>{appointment.location_address}</span>
          </div>
        )}

        {appointment.foundation_type && (
          <div className="flex items-center text-slate-600">
            <Home className="w-4 h-4 mr-2 text-slate-400" />
            <span className="capitalize">{appointment.foundation_type.replace("_", " ")} Foundation</span>
            {appointment.pier_type && (
              <span className="ml-1 text-slate-500">
                • {appointment.pier_type.charAt(0).toUpperCase() + appointment.pier_type.slice(1)} Piers
              </span>
            )}
          </div>
        )}
      </div>

      {appointment.notes && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-sm text-slate-600 line-clamp-2">{appointment.notes}</p>
        </div>
      )}

      {appointment.is_lead_converted && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center text-green-600 text-xs">
            <UserCheck className="w-3 h-3 mr-1" />
            <span>Lead converted to client</span>
          </div>
        </div>
      )}
    </Link>
  );
}
