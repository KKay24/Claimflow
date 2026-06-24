import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import type { AppView } from './components/Header';
import Login from './pages/Login';
import ApplicantDashboard from './pages/ApplicantDashboard';
import ClaimDetail from './pages/ClaimDetail';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ClaimFormPage from './pages/ClaimFormPage';
import AuditHistory from './pages/AuditHistory';
import { Headphones, LogOut } from 'lucide-react';
import './App.css';

function ClaimFlowApp() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppView>('claims');

  const navigate = (view: AppView) => {
    setSelectedClaimId(null);
    setActiveView(view === 'dashboard' ? 'claims' : view);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-sm font-semibold text-slate-500">Loading ClaimFlow...</div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Header activeView={activeView} onNavigate={navigate}>
      {selectedClaimId ? (
        <ClaimDetail
          claimId={selectedClaimId}
          onBack={() => setSelectedClaimId(null)}
        />
      ) : activeView === 'create' && user?.role === 'APPLICANT' ? (
        <ClaimFormPage onCancel={() => setActiveView('claims')} onSaved={() => setActiveView('claims')} />
      ) : activeView === 'audit' ? (
        <AuditHistory onViewClaim={setSelectedClaimId} />
      ) : activeView === 'profile' ? (
        <div className="rounded-[8px] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-extrabold">My Profile</h1>
          <p className="mt-2 text-slate-500">{user?.name} · {user?.role}</p>
          <p className="mt-1 text-slate-500">{user?.email}</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <section className="rounded-[8px] border border-blue-200 bg-blue-50 p-6">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-blue-600 text-white">
                  <Headphones size={24} />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-[#07152f]">Need Help?</h2>
                  <p className="mt-1 text-sm text-[#33476b]">Contact support for assistance.</p>
                </div>
              </div>
              <button className="mt-5 h-11 w-full rounded-[8px] border border-blue-500 bg-white text-sm font-extrabold text-blue-600">
                Contact Support
              </button>
            </section>

            <section className="rounded-[8px] border border-red-200 bg-red-50 p-6">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-red-600 text-white">
                  <LogOut size={24} />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-[#07152f]">Logout</h2>
                  <p className="mt-1 text-sm text-[#33476b]">End your current session.</p>
                </div>
              </div>
              <button onClick={logout} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-red-600 text-sm font-extrabold text-white">
                <LogOut size={18} />
                Logout
              </button>
            </section>
          </div>
        </div>
      ) : user?.role === 'REVIEWER' ? (
        <ReviewerDashboard onViewClaim={setSelectedClaimId} />
      ) : (
        <ApplicantDashboard onViewClaim={setSelectedClaimId} onCreate={() => setActiveView('create')} />
      )}
    </Header>
  );
}

function App() {
  return (
    <AuthProvider>
      <ClaimFlowApp />
    </AuthProvider>
  );
}

export default App
