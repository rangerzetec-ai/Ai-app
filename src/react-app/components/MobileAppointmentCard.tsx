import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, ChevronRight, Wrench } from "lucide-react";
import { Appointment } from "@/shared/types";
import { MobileCard } from "./MobileOptimizedForm";

interface MobileAppointmentCardProps {
  appointment: Appointment;
}

export default function MobileAppointmentCard({ appointment }: MobileAppointmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Link to={`/appointments/${appointment.id}`} className="block">
      <MobileCard className="p-4 active:scale-95 transition-transform duration-150">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-base mb-1">
                Appointment #{appointment.id}
              </h3>
              <div className="flex items-center text-sm text-slate-600 mb-1">
                <Clock className="w-4 h-4 mr-1" />
                <span>{formatDate(appointment.appointment_date)} at {formatTime(appointment.appointment_date)}</span>
              </div>
              {appointment.location_address && (
                <div className="flex items-start text-sm text-slate-600">
                  <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{appointment.location_address}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                appointment.status
              )}`}
            >
              {appointment.status.replace("_", " ")}
            </span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>

      {/* Progress Indicators */}
      {appointment.status === "scheduled" && (
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
          <div className="text-center">
            <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center mb-1 ${
              appointment.pier_placements ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
            }`}>
              {appointment.pier_placements ? '✓' : '○'}
            </div>
            <div className="text-xs text-slate-600">Piers</div>
          </div>
          <div className="text-center">
            <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center mb-1 ${
              appointment.site_photos ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
            }`}>
              {appointment.site_photos ? '✓' : '○'}
            </div>
            <div className="text-xs text-slate-600">Photos</div>
          </div>
          <div className="text-center">
            <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center mb-1 ${
              appointment.technician_notes ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
            }`}>
              {appointment.technician_notes ? '✓' : '○'}
            </div>
            <div className="text-xs text-slate-600">Notes</div>
          </div>
        </div>
      )}

      {/* Quick Action Button for Mobile */}
        <div className="pt-3 border-t border-slate-200 mt-3">
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/appointments/${appointment.id}/technician`;
            }}
            className="flex items-center justify-center w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer touch-target"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Field Assessment
          </div>
        </div>
      </MobileCard>
    </Link>
  );
}
