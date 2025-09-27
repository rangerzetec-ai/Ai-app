import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const NewClient = lazy(() => import("./pages/NewClient"));
const EditClient = lazy(() => import("./pages/EditClient"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const Leads = lazy(() => import("./pages/Leads"));
const NewLead = lazy(() => import("./pages/NewLead"));
const EditLead = lazy(() => import("./pages/EditLead"));
const LeadDetail = lazy(() => import("./pages/LeadDetail"));
const Appointments = lazy(() => import("./pages/Appointments"));
const NewAppointment = lazy(() => import("./pages/NewAppointment"));
const EditAppointment = lazy(() => import("./pages/EditAppointment"));
const AppointmentDetail = lazy(() => import("./pages/AppointmentDetail"));
const TechnicianView = lazy(() => import("./pages/TechnicianView"));
const Projects = lazy(() => import("./pages/Projects"));
const NewProject = lazy(() => import("./pages/NewProject"));
const EditProject = lazy(() => import("./pages/EditProject"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const SalesPeople = lazy(() => import("./pages/SalesPeople"));
const NewSalesPerson = lazy(() => import("./pages/NewSalesPerson"));
const EditSalesPerson = lazy(() => import("./pages/EditSalesPerson"));
const SalesPersonDetail = lazy(() => import("./pages/SalesPersonDetail"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));

// Loading component
const PageLoader = () => (
  <Layout>
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  </Layout>
);

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Client routes */}
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/new" element={<NewClient />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/clients/:id/edit" element={<EditClient />} />
          
          {/* Lead routes */}
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/new" element={<NewLead />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/leads/:id/edit" element={<EditLead />} />
          
          {/* Appointment routes */}
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/new" element={<NewAppointment />} />
          <Route path="/appointments/:id" element={<AppointmentDetail />} />
          <Route path="/appointments/:id/edit" element={<EditAppointment />} />
          <Route path="/appointments/:id/technician" element={<TechnicianView />} />
          
          {/* Project routes */}
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<NewProject />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/edit" element={<EditProject />} />
          <Route path="/clients/:clientId/projects/new" element={<NewProject />} />
          
          {/* Sales people routes */}
          <Route path="/sales-people" element={<SalesPeople />} />
          <Route path="/sales-people/new" element={<NewSalesPerson />} />
          <Route path="/sales-people/:id" element={<SalesPersonDetail />} />
          <Route path="/sales-people/:id/edit" element={<EditSalesPerson />} />
          
          {/* Reports route */}
          <Route path="/reports" element={<Reports />} />
          
          {/* Settings route */}
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
