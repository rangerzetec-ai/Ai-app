import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import AppointmentForm from "@/react-app/components/AppointmentForm";
import { UpdateAppointment, Lead } from "@/shared/types";

export default function EditAppointment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<any>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        const appointmentRes = await fetch(`/api/appointments/${id}`);
        if (appointmentRes.ok) {
          const appointmentData = await appointmentRes.json();
          setAppointment(appointmentData);
          
          // Fetch lead info
          if (appointmentData.lead_id) {
            const leadRes = await fetch(`/api/leads/${appointmentData.lead_id}`);
            if (leadRes.ok) {
              const leadData = await leadRes.json();
              setLead(leadData);
            }
          }
        } else {
          console.error("Failed to fetch appointment");
          navigate("/appointments");
        }
      } catch (error) {
        console.error("Failed to fetch appointment:", error);
        navigate("/appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleSubmit = async (data: UpdateAppointment) => {
    if (!appointment) return;
    
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        navigate(`/appointments/${appointment.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update appointment");
      }
    } catch (error) {
      console.error("Failed to update appointment:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    if (appointment) {
      navigate(`/appointments/${appointment.id}`);
    } else {
      navigate("/appointments");
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

  const leadName = lead ? `${lead.first_name} ${lead.last_name}` : "Unknown Lead";

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Edit Appointment</h1>
            <p className="text-slate-600 mt-1">
              Update appointment with {leadName}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <AppointmentForm
            appointment={appointment}
            lead={lead || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={true}
          />
        </div>
      </div>
    </Layout>
  );
}
