import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, FileText, User, Shield } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md shadow-indigo-600/20">
            <FileText size={20} className="animate-pulse" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            ClaimFlow
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 py-1.5 px-3.5 rounded-full">
            {user.role === 'REVIEWER' ? (
              <Shield size={15} className="text-amber-500" />
            ) : (
              <User size={15} className="text-indigo-500" />
            )}
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {user.name}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {user.role}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 hover:bg-rose-50 hover:text-rose-600 text-slate-500 dark:text-slate-400 p-2 rounded-full transition-all duration-200 cursor-pointer"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
