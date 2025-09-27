import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import SalesPersonForm from "@/react-app/components/SalesPersonForm";

export default function EditSalesPerson() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [salesPerson, setSalesPerson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesPerson = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/sales-people/${id}`);
        if (response.ok) {
          const salesPersonData = await response.json();
          setSalesPerson(salesPersonData);
        } else {
          console.error("Failed to fetch sales person");
          navigate("/sales-people");
        }
      } catch (error) {
        console.error("Failed to fetch sales person:", error);
        navigate("/sales-people");
      } finally {
        setLoading(false);
      }
    };

    fetchSalesPerson();
  }, [id, navigate]);

  const handleSubmit = async (data: any) => {
    if (!salesPerson) return;
    
    try {
      const response = await fetch(`/api/sales-people/${salesPerson.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        navigate(`/sales-people/${salesPerson.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update sales person");
      }
    } catch (error) {
      console.error("Failed to update sales person:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    if (salesPerson) {
      navigate(`/sales-people/${salesPerson.id}`);
    } else {
      navigate("/sales-people");
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

  if (!salesPerson) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Sales person not found</h3>
          <button
            onClick={() => navigate("/sales-people")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to sales team
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
            <h1 className="text-3xl font-bold text-slate-900">Edit Sales Person</h1>
            <p className="text-slate-600 mt-1">
              Update information for {salesPerson.first_name} {salesPerson.last_name}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <SalesPersonForm
            salesPerson={salesPerson}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={true}
          />
        </div>
      </div>
    </Layout>
  );
}
