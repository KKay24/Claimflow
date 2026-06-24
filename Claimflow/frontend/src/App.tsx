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
import './App.css'

function ClaimFlowApp() {
  const { isAuthenticated, isLoading, user } = useAuth();
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
