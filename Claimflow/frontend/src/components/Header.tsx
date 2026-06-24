import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  FileClock,
  FilePlus2,
  FileText,
  Headphones,
  Home,
  LogOut,
  User,
} from 'lucide-react';

export type AppView = 'dashboard' | 'claims' | 'create' | 'audit' | 'profile';

interface AppShellProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

const navByRole = {
  APPLICANT: [
    { view: 'claims' as AppView, label: 'My Claims', icon: Home },
    { view: 'create' as AppView, label: 'Create Claim', icon: FilePlus2 },
    { view: 'profile' as AppView, label: 'My Profile', icon: User },
    { view: 'audit' as AppView, label: 'Audit History', icon: FileClock },
  ],
  REVIEWER: [
    { view: 'dashboard' as AppView, label: 'Dashboard', icon: Home },
    { view: 'claims' as AppView, label: 'Review Claims', icon: ClipboardList },
    { view: 'audit' as AppView, label: 'Audit History', icon: FileClock },
    { view: 'profile' as AppView, label: 'My Profile', icon: User },
  ],
};

const Header: React.FC<AppShellProps> = ({ activeView, onNavigate, children }) => {
  const { user, logout } = useAuth();

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#f7faff] text-[#07152f]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] flex-col bg-[#061f3c] px-4 py-8 text-white shadow-2xl lg:flex">
        <button onClick={() => onNavigate('claims')} className="flex items-center gap-3 text-left">
          <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-blue-600 shadow-lg shadow-blue-950/40">
            <FileText size={27} />
          </span>
          <span className="text-[27px] font-extrabold leading-none tracking-tight">ClaimFlow</span>
        </button>

        <div className="mt-12 px-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-blue-100/70">
          {user.role === 'REVIEWER' ? 'Reviewer' : 'Applicant'}
        </div>

        <nav className="mt-5 space-y-1.5">
          {navByRole[user.role].map((item) => {
            const Icon = item.icon;
            const active = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`flex h-[54px] w-full items-center gap-3.5 rounded-[8px] px-3.5 text-left text-[16px] font-bold transition ${
                  active ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <Icon size={22} />
                {item.label}
              </button>
            );
          })}

          <button
            onClick={logout}
            className="flex h-[54px] w-full items-center gap-3.5 rounded-[8px] px-3.5 text-left text-[16px] font-bold text-white/90 transition hover:bg-white/10"
          >
            <LogOut size={22} />
            Logout
          </button>
        </nav>

        <div className="mt-auto rounded-[8px] border border-blue-400/30 bg-blue-950/20 p-4 text-center">
          <Headphones className="mx-auto mb-2.5" size={28} />
          <div className="text-[15px] font-extrabold">Need Help?</div>
          <p className="mt-2 text-[13px] leading-5 text-blue-50/90">We&apos;re here to help you with any questions.</p>
          <button className="mt-4 h-10 w-full rounded-[8px] border border-blue-400 text-[13px] font-bold text-blue-200">
            Contact Support
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-[256px]">
        <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
};

export default Header;
