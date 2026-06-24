import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Login from './pages/Login';
import ApplicantDashboard from './pages/ApplicantDashboard';
import ClaimDetail from './pages/ClaimDetail';
import ReviewerDashboard from './pages/ReviewerDashboard';
import './App.css'

function ClaimFlowApp() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main>
        {selectedClaimId ? (
          <ClaimDetail
            claimId={selectedClaimId}
            onBack={() => setSelectedClaimId(null)}
          />
        ) : user?.role === 'REVIEWER' ? (
          <ReviewerDashboard onViewClaim={setSelectedClaimId} />
        ) : (
          <ApplicantDashboard onViewClaim={setSelectedClaimId} />
        )}
      </main>
    </div>
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
