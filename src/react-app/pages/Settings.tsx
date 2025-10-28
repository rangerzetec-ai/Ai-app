import { useState, useEffect } from "react";
import { Plus, Users, Bell, Edit2, Trash2, Save } from "lucide-react";
import Layout from "@/react-app/components/Layout";
import { Engineer, NotificationContact, CreateEngineer, CreateNotificationContact } from "@/shared/types";

export default function Settings() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [notificationContacts, setNotificationContacts] = useState<NotificationContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'engineers' | 'notifications'>('engineers');
  
  // Forms state
  const [showEngineerForm, setShowEngineerForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);
  const [editingContact, setEditingContact] = useState<NotificationContact | null>(null);
  
  const [engineerForm, setEngineerForm] = useState<CreateEngineer>({
    name: "",
    email: "",
    is_active: true,
  });
  
  const [contactForm, setContactForm] = useState<CreateNotificationContact>({
    contact_type: "project_notification",
    phone_number: "",
    contact_name: "",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [engineersRes, contactsRes] = await Promise.all([
        fetch("/api/engineers"),
        fetch("/api/notification-contacts")
      ]);
      
      if (engineersRes.ok) {
        const engineersData = await engineersRes.json();
        setEngineers(engineersData);
      }
      
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setNotificationContacts(contactsData);
      }
    } catch (error) {
      console.error("Failed to fetch settings data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEngineerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEngineer ? `/api/engineers/${editingEngineer.id}` : "/api/engineers";
      const method = editingEngineer ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(engineerForm),
      });
      
      if (response.ok) {
        await fetchData();
        setShowEngineerForm(false);
        setEditingEngineer(null);
        setEngineerForm({ name: "", email: "", is_active: true });
      }
    } catch (error) {
      console.error("Failed to save engineer:", error);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingContact ? `/api/notification-contacts/${editingContact.id}` : "/api/notification-contacts";
      const method = editingContact ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      
      if (response.ok) {
        await fetchData();
        setShowContactForm(false);
        setEditingContact(null);
        setContactForm({ contact_type: "project_notification", phone_number: "", contact_name: "", is_active: true });
      }
    } catch (error) {
      console.error("Failed to save contact:", error);
    }
  };

  const deleteEngineer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this engineer?")) return;
    
    try {
      const response = await fetch(`/api/engineers/${id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to delete engineer:", error);
    }
  };

  const deleteContact = async (id: number) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    
    try {
      const response = await fetch(`/api/notification-contacts/${id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  };

  const startEditEngineer = (engineer: Engineer) => {
    setEditingEngineer(engineer);
    setEngineerForm({
      name: engineer.name,
      email: engineer.email,
      is_active: engineer.is_active,
    });
    setShowEngineerForm(true);
  };

  const startEditContact = (contact: NotificationContact) => {
    setEditingContact(contact);
    setContactForm({
      contact_type: contact.contact_type,
      phone_number: contact.phone_number,
      contact_name: contact.contact_name || "",
      is_active: contact.is_active,
    });
    setShowContactForm(true);
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-600 mt-1">Manage your app configuration and workflow settings</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('engineers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'engineers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Engineers
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Notifications
            </button>
          </nav>
        </div>

        {/* Engineers Tab */}
        {activeTab === 'engineers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Engineers</h2>
              <button
                onClick={() => {
                  setShowEngineerForm(true);
                  setEditingEngineer(null);
                  setEngineerForm({ name: "", email: "", is_active: true });
                }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Engineer
              </button>
            </div>

            {/* Engineer Form */}
            {showEngineerForm && (
              <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">
                  {editingEngineer ? 'Edit Engineer' : 'Add New Engineer'}
                </h3>
                <form onSubmit={handleEngineerSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={engineerForm.name}
                        onChange={(e) => setEngineerForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                        placeholder="Engineer name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={engineerForm.email}
                        onChange={(e) => setEngineerForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                        placeholder="engineer@company.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={engineerForm.is_active}
                      onChange={(e) => setEngineerForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    <label className="text-sm text-slate-700">Active</label>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingEngineer ? 'Update' : 'Save'} Engineer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEngineerForm(false);
                        setEditingEngineer(null);
                      }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Engineers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {engineers.map((engineer) => (
                <div key={engineer.id} className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{engineer.name}</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditEngineer(engineer)}
                        className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEngineer(engineer.id)}
                        className="p-1 text-slate-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm mb-2">{engineer.email}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    engineer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {engineer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>

            {engineers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No engineers configured</h3>
                <p className="text-slate-500">Add engineers to enable automatic assumption letter requests.</p>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Notification Contacts</h2>
                <p className="text-slate-600 text-sm">Phone numbers that will receive project notifications</p>
              </div>
              <button
                onClick={() => {
                  setShowContactForm(true);
                  setEditingContact(null);
                  setContactForm({ contact_type: "project_notification", phone_number: "", contact_name: "", is_active: true });
                }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </button>
            </div>

            {/* Contact Form */}
            {showContactForm && (
              <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </h3>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Contact Name</label>
                      <input
                        type="text"
                        value={contactForm.contact_name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, contact_name: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                        placeholder="Contact name (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={contactForm.phone_number}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone_number: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={contactForm.is_active}
                      onChange={(e) => setContactForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    <label className="text-sm text-slate-700">Active</label>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingContact ? 'Update' : 'Save'} Contact
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowContactForm(false);
                        setEditingContact(null);
                      }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Contacts List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notificationContacts.map((contact) => (
                <div key={contact.id} className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">
                      {contact.contact_name || 'Unnamed Contact'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditContact(contact)}
                        className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="p-1 text-slate-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm mb-2">{contact.phone_number}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    contact.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {contact.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>

            {notificationContacts.length === 0 && (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No notification contacts</h3>
                <p className="text-slate-500">Add phone numbers to receive project notifications.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
