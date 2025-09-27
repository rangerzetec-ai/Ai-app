import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import SalesPersonForm from "@/react-app/components/SalesPersonForm";

export default function NewSalesPerson() {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/sales-people", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const salesPerson = await response.json();
        navigate(`/sales-people/${salesPerson.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create sales person");
      }
    } catch (error) {
      console.error("Failed to create sales person:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate("/sales-people");
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
            <h1 className="text-3xl font-bold text-slate-900">Add Sales Person</h1>
            <p className="text-slate-600 mt-1">Add a new member to your sales team</p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <SalesPersonForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={false}
          />
        </div>
      </div>
    </Layout>
  );
}
