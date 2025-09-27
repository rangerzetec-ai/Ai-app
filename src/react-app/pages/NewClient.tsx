import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import ClientForm from "@/react-app/components/ClientForm";
import { CreateClient, UpdateClient } from "@/shared/types";

export default function NewClient() {
  const navigate = useNavigate();

  const handleSubmit = async (data: CreateClient | UpdateClient) => {
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const client = await response.json();
        navigate(`/clients/${client.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create client");
      }
    } catch (error) {
      console.error("Failed to create client:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate("/clients");
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
            <h1 className="text-3xl font-bold text-slate-900">New Client</h1>
            <p className="text-slate-600 mt-1">Add a new foundation repair client</p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <ClientForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={false}
          />
        </div>
      </div>
    </Layout>
  );
}
