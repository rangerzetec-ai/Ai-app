import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Building2, 
  Home, 
  Users, 
  Calendar, 
  UserCheck, 
  Menu, 
  X,
  ChevronRight,
  FolderOpen,
  BarChart3,
  Settings as SettingsIcon
} from "lucide-react";

interface MobileLayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { path: "/", label: "Dashboard", icon: Home, color: "blue" },
  { path: "/leads", label: "Leads", icon: UserCheck, color: "purple" },
  { path: "/appointments", label: "Appointments", icon: Calendar, color: "indigo" },
  { path: "/clients", label: "Clients", icon: Users, color: "blue" },
  { path: "/projects", label: "Projects", icon: FolderOpen, color: "cyan" },
  { path: "/sales-people", label: "Sales Team", icon: Building2, color: "green" },
  { path: "/reports", label: "Reports", icon: BarChart3, color: "orange" },
  { path: "/settings", label: "Settings", icon: SettingsIcon, color: "slate" },
];

function MobileLayout({ children }: MobileLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    if (path === "/clients" && location.pathname.startsWith("/projects")) return true;
    return false;
  };

  const getColorClasses = (color: string, active: boolean) => {
    const colors = {
      blue: active 
        ? "bg-blue-50 text-blue-700 border-blue-200" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      purple: active 
        ? "bg-purple-50 text-purple-700 border-purple-200" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      indigo: active 
        ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      green: active 
        ? "bg-green-50 text-green-700 border-green-200" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      cyan: active 
        ? "bg-cyan-50 text-cyan-700 border-cyan-200" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      orange: active 
        ? "bg-orange-50 text-orange-700 border-orange-200" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      slate: active 
        ? "bg-slate-100 text-slate-700 border-slate-200" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  PierPro
                </h1>
              </div>
            </div>
            
            <div className="text-sm text-slate-500">
              {navigationItems.find(item => isActive(item.path))?.label || "PierPro"}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        >
          <div 
            className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl safe-area-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                      PierPro
                    </h2>
                    <p className="text-sm text-slate-500">Foundation Management</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 border ${getColorClasses(item.color, active)}`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-6 h-6" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-40" />
                  </Link>
                );
              })}
            </nav>

            {/* App Version */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-center text-xs text-slate-400 bg-slate-50 py-2 px-3 rounded-lg">
                PierPro Mobile v1.0
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="px-4 py-6 pb-20 safe-area-bottom">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/60 pb-safe z-40">
        <div className="flex items-center justify-around py-2">
          {navigationItems.slice(0, 4).map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-2 min-w-[60px] transition-colors ${
                  active 
                    ? "text-blue-600" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center p-2 min-w-[60px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Menu className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default MobileLayout;
