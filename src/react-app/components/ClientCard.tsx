import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Calendar } from "lucide-react";
import { Client } from "@/shared/types";

interface ClientCardProps {
  client: Client;
}

const ClientCard = memo(({ client }: ClientCardProps) => {
  // Memoize date formatting to avoid recalculation
  const formattedDate = useMemo(() => 
    new Date(client.created_at).toLocaleDateString(), 
    [client.created_at]
  );

  // Memoize full name to avoid recalculation
  const fullName = useMemo(() => 
    `${client.first_name} ${client.last_name}`, 
    [client.first_name, client.last_name]
  );

  // Note: initials could be used for avatar in future
  // const initials = useMemo(() => 
  //   `${client.first_name[0]}${client.last_name[0]}`, 
  //   [client.first_name, client.last_name]
  // );
  
  return (
    <Link
      to={`/clients/${client.id}`}
      className="group block p-6 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
            {fullName}
          </h3>
          
          <div className="mt-3 space-y-2">
            {client.email && (
              <div className="flex items-center text-sm text-slate-600">
                <Mail className="w-4 h-4 mr-2 text-slate-400" />
                {client.email}
              </div>
            )}
            
            {client.phone && (
              <div className="flex items-center text-sm text-slate-600">
                <Phone className="w-4 h-4 mr-2 text-slate-400" />
                {client.phone}
              </div>
            )}
            
            {(client.address_line1 || client.city) && (
              <div className="flex items-start text-sm text-slate-600">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
                <div>
                  {client.address_line1 && <div>{client.address_line1}</div>}
                  {client.address_line2 && <div>{client.address_line2}</div>}
                  {client.city && (
                    <div>
                      {client.city}
                      {client.state && `, ${client.state}`}
                      {client.zip_code && ` ${client.zip_code}`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center text-xs text-slate-500">
            <Calendar className="w-3 h-3 mr-1" />
            {formattedDate}
          </div>
        </div>
      </div>
      
      {client.notes && (
        <div className="mt-4 p-3 bg-slate-50/80 rounded-lg">
          <p className="text-sm text-slate-600 line-clamp-2">{client.notes}</p>
        </div>
      )}
    </Link>
  );
});

ClientCard.displayName = 'ClientCard';

export default ClientCard;
