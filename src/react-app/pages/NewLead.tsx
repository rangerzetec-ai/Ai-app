import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import LeadForm from "@/react-app/components/LeadForm";
import { CreateLead, UpdateLead } from "@/shared/types";

export default function NewLead() {
  const navigate = useNavigate();

  const handleSubmit = async (data: CreateLead | UpdateLead) => {
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const lead = await response.json();
        navigate(`/leads/${lead.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create lead");
      }
    } catch (error) {
      console.error("Failed to create lead:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate("/leads");
  };

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
            <h1 className="text-3xl font-bold text-slate-900">New Lead</h1>
            <p className="text-slate-600 mt-1">Add a new potential foundation repair client</p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <LeadForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={false}
          />
        </div>
      </div>
    </Layout>
  );
}
