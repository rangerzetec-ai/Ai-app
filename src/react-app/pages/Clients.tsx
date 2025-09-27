import { useState, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import ClientCard from "@/react-app/components/ClientCard";
import SearchInput from "@/react-app/components/SearchInput";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { useApiCache } from "@/react-app/hooks/useApiCache";
import { useDebounce } from "@/react-app/hooks/useDebounce";

const Clients = memo(() => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Use API cache for better performance
  const { data: clientsData, loading } = useApiCache(
    'clients',
    () => fetch("/api/clients").then(res => res.json()),
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  // Memoize clients data processing
  const clients = useMemo(() => {
    if (!clientsData) return [];
    return Array.isArray(clientsData) ? clientsData : (clientsData.data || []);
  }, [clientsData]);

  // Memoize filtered clients to avoid recalculation on every render
  const filteredClients = useMemo(() => {
    if (!debouncedSearchTerm) return clients;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return clients.filter((client: any) =>
      `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.includes(debouncedSearchTerm) ||
      client.address_line1?.toLowerCase().includes(searchLower) ||
      client.city?.toLowerCase().includes(searchLower)
    );
  }, [clients, debouncedSearchTerm]);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading clients..." className="min-h-[400px]" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
            <p className="text-slate-600 mt-1">Manage your foundation repair clients</p>
          </div>
          <Link
            to="/clients/new"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </Link>
        </div>

        {/* Search */}
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search clients by name, email, phone, or address..."
          className="w-full"
        />

        {/* Clients Grid */}
        {filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client: any) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        ) : searchTerm ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No clients found</h3>
            <p className="text-slate-500">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No clients yet</h3>
            <p className="text-slate-500 mb-6">Get started by adding your first client</p>
            <Link
              to="/clients/new"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
});

Clients.displayName = 'Clients';

export default Clients;
