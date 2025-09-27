import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import LeadForm from "@/react-app/components/LeadForm";
import { Lead, UpdateLead } from "@/shared/types";

export default function EditLead() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/leads/${id}`);
        if (response.ok) {
          const leadData = await response.json();
          setLead(leadData);
        } else {
          console.error("Failed to fetch lead");
          navigate("/leads");
        }
      } catch (error) {
        console.error("Failed to fetch lead:", error);
        navigate("/leads");
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id, navigate]);

  const handleSubmit = async (data: UpdateLead) => {
    if (!lead) return;
    
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        navigate(`/leads/${lead.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update lead");
      }
    } catch (error) {
      console.error("Failed to update lead:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    if (lead) {
      navigate(`/leads/${lead.id}`);
    } else {
      navigate("/leads");
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

  if (!lead) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Lead not found</h3>
          <button
            onClick={() => navigate("/leads")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to leads
          </button>
        </div>
      </Layout>
    );
  }

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
            <h1 className="text-3xl font-bold text-slate-900">Edit Lead</h1>
            <p className="text-slate-600 mt-1">
              Update information for {lead.first_name} {lead.last_name}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <LeadForm
            lead={lead}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={true}
          />
        </div>
      </div>
    </Layout>
  );
}
