import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ChevronDown,
  ClipboardList,
  FileClock,
  FilePlus2,
  FileText,
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
    { view: 'audit' as AppView, label: 'Audit History', icon: FileClock },
  ],
  REVIEWER: [
    { view: 'dashboard' as AppView, label: 'Dashboard', icon: Home },
    { view: 'claims' as AppView, label: 'Review Claims', icon: ClipboardList },
    { view: 'audit' as AppView, label: 'Audit History', icon: FileClock },
  ],
};

const Header: React.FC<AppShellProps> = ({ activeView, onNavigate, children }) => {
  const { user, logout } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const pageCopy: Record<AppView, { title: string; subtitle: string }> = {
    dashboard: {
      title: user.role === 'REVIEWER' ? 'Review Claims' : 'My Claims',
      subtitle:
        user.role === 'REVIEWER'
          ? 'View and review expense reimbursement claims submitted by employees.'
          : 'View and track all your expense reimbursement claims.',
    },
    claims: {
      title: user.role === 'REVIEWER' ? 'Review Claims' : 'My Claims',
      subtitle:
        user.role === 'REVIEWER'
          ? 'View and review expense reimbursement claims submitted by employees.'
          : 'View and track all your expense reimbursement claims.',
    },
    create: {
      title: 'Create / Edit Claim',
      subtitle: 'Fill in the details below to create a new claim or update your draft.',
    },
    audit: {
      title: 'Audit History',
      subtitle: 'View the complete history of actions performed on claims.',
    },
    profile: {
      title: 'My Profile',
      subtitle: 'Manage your account details, support options, and session.',
    },
  };

  const currentPage = pageCopy[activeView];

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
        </nav>
      </aside>

      <main className="min-h-screen lg:pl-[256px]">
        <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1480px] items-center justify-end gap-6">
            <div className="relative hidden lg:block">
              <button
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                className="flex items-center gap-3 rounded-full px-2 py-1"
              >
                <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <span className="text-lg font-extrabold">{user.name.charAt(0)}</span>
                </span>
                <ChevronDown size={20} className={`text-[#33476b] transition ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 top-[72px] w-64 overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-4">
                    <div className="truncate text-[17px] font-extrabold text-[#07152f]">{user.name}</div>
                    <div className="mt-1 text-sm font-semibold text-[#33476b]">{user.role === 'REVIEWER' ? 'Reviewer' : 'Applicant'}</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onNavigate('profile');
                    }}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left font-bold text-[#07152f] hover:bg-blue-50"
                  >
                    <User size={20} className="text-blue-600" />
                    My Profile
                  </button>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-4 text-left font-bold text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">
          <div className="mb-8">
            <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-[#07152f]">{currentPage.title}</h1>
            <p className="mt-3 text-[17px] text-[#33476b]">{currentPage.subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Header;
