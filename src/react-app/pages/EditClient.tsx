import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import ClientForm from "@/react-app/components/ClientForm";
import { Client, UpdateClient } from "@/shared/types";

export default function EditClient() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/clients/${id}`);
        if (response.ok) {
          const clientData = await response.json();
          setClient(clientData);
        } else {
          console.error("Failed to fetch client");
          navigate("/clients");
        }
      } catch (error) {
        console.error("Failed to fetch client:", error);
        navigate("/clients");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id, navigate]);

  const handleSubmit = async (data: UpdateClient) => {
    if (!client) return;
    
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        navigate(`/clients/${client.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update client");
      }
    } catch (error) {
      console.error("Failed to update client:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    if (client) {
      navigate(`/clients/${client.id}`);
    } else {
      navigate("/clients");
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

  if (!client) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Client not found</h3>
          <button
            onClick={() => navigate("/clients")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to clients
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
            <h1 className="text-3xl font-bold text-slate-900">Edit Client</h1>
            <p className="text-slate-600 mt-1">
              Update information for {client.first_name} {client.last_name}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <ClientForm
            client={client}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={true}
          />
        </div>
      </div>
    </Layout>
  );
}
