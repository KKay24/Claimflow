import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Lock, Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to login. Please check your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: 'APPLICANT' | 'REVIEWER') => {
    setError(null);
    setIsSubmitting(true);
    const quickEmail = role === 'APPLICANT' ? 'applicant@test.com' : 'reviewer@test.com';
    const quickPassword = 'password123';
    
    setEmail(quickEmail);
    setPassword(quickPassword);

    try {
      await login(quickEmail, quickPassword);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Quick login failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -z-10 animate-pulse delay-1000"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-600/30 mb-4">
            <FileText size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">ClaimFlow</h1>
          <p className="text-sm text-slate-400 mt-2 text-center">
            Expense Reimbursement Submission & Approval Workflow
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 hover:gap-3 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
            <span className="bg-slate-900 px-3 text-slate-500">Quick Test Accounts</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleQuickLogin('APPLICANT')}
            disabled={isSubmitting}
            className="flex flex-col items-center gap-2 bg-slate-950 hover:bg-slate-800/50 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl cursor-pointer transition-all duration-200 group text-center"
          >
            <User size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200">Applicant Log In</span>
            <span className="text-[10px] text-slate-500">John Applicant</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('REVIEWER')}
            disabled={isSubmitting}
            className="flex flex-col items-center gap-2 bg-slate-950 hover:bg-slate-800/50 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl cursor-pointer transition-all duration-200 group text-center"
          >
            <ShieldCheck size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200">Reviewer Log In</span>
            <span className="text-[10px] text-slate-500">Sarah Reviewer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
