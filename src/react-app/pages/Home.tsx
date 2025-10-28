import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically redirect to dashboard
    navigate('/dashboard');
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">PierPro CRM</h2>
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    </div>
  );
}
