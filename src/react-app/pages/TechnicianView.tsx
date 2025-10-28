import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Smartphone } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import StableTechnicianInterface from "@/react-app/components/StableTechnicianInterface";
import MobileTechnicianInterface from "@/react-app/components/MobileTechnicianInterface";
import { useIsMobile } from "@/react-app/hooks/useIsMobile";
import { Appointment } from "@/shared/types";

export default function TechnicianView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/appointments/${id}`);
        if (response.ok) {
          const data = await response.json();
          setAppointment(data);
        } else {
          navigate("/appointments");
        }
      } catch (error) {
        console.error("Failed to fetch appointment:", error);
        navigate("/appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id, navigate]);

  const handleUpdate = async (updates: Partial<Appointment>) => {
    if (!appointment) {
      console.warn("No appointment available for update");
      return;
    }
    
    // Filter out undefined values and empty updates
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined && value !== null)
    );
    
    // Don't make API call if no valid updates
    if (Object.keys(filteredUpdates).length === 0) {
      console.warn("No valid updates to save");
      return;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filteredUpdates),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const updatedAppointment = await response.json();
        setAppointment(updatedAppointment);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        const errorMessage = typeof errorData === 'string' ? errorData : errorData.error || 'Unknown server error';
        console.error("API error:", errorMessage);
        throw new Error(`Failed to update appointment: ${errorMessage}`);
      }
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
        console.error("Network error:", error);
        throw new Error("Network error: Please check your internet connection and try again");
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to update appointment:", errorMessage);
      throw new Error(errorMessage);
    }
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

  if (!appointment) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Appointment not found</h3>
          <button
            onClick={() => navigate("/appointments")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to appointments
          </button>
        </div>
      </Layout>
    );
  }

  // Mobile view renders without Layout wrapper
  if (isMobileView) {
    return (
      <div className="relative">
        {/* Mobile header with back button */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileView(false)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">Field Assessment</h1>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </div>
        
        {/* Mobile interface */}
        <div className="pt-16">
          {isMobile ? (
            <MobileTechnicianInterface 
              appointment={appointment} 
              onUpdate={handleUpdate}
            />
          ) : (
            <StableTechnicianInterface 
              appointment={appointment} 
              onUpdate={handleUpdate}
              isMobile={true}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/appointments")}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">Technician Assessment</h1>
            <p className="text-slate-600 mt-1">
              Field data collection for appointment #{appointment.id}
            </p>
          </div>
          <button
            onClick={() => setIsMobileView(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            iPad Mode
          </button>
        </div>

        {/* Desktop Technician Interface */}
        <StableTechnicianInterface 
          appointment={appointment} 
          onUpdate={handleUpdate}
          isMobile={false}
        />
      </div>
    </Layout>
  );
}
