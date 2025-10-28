import { ReactNode, memo, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, Settings } from "lucide-react";
import { useIsMobile } from "@/react-app/hooks/useIsMobile";
import MobileLayout from "./MobileLayout";

interface LayoutProps {
  children: ReactNode;
}

const Layout = memo(({ children }: LayoutProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Memoize the active path check to avoid recalculation
  const isActive = useMemo(() => (path: string) => location.pathname === path, [location.pathname]);
  
  // Use mobile layout on mobile devices
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  PierPro
                </h1>
              </div>
              <div className="flex space-x-1">
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive("/")
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/leads"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith("/leads")
                      ? "bg-purple-100 text-purple-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Leads
                </Link>
                <Link
                  to="/appointments"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith("/appointments")
                      ? "bg-indigo-100 text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Appointments
                </Link>
                <Link
                  to="/clients"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith("/clients")
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Clients
                </Link>
                <Link
                  to="/projects"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith("/projects")
                      ? "bg-cyan-100 text-cyan-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Projects
                </Link>
                <Link
                  to="/sales-people"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith("/sales-people")
                      ? "bg-green-100 text-green-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Sales Team
                </Link>
                <Link
                  to="/reports"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith("/reports")
                      ? "bg-orange-100 text-orange-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Reports
                </Link>
                <Link
                  to="/settings"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith("/settings")
                      ? "bg-slate-100 text-slate-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors duration-200">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
