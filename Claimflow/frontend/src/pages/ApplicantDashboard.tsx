import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import {
  Plus,
  FileText,
  AlertCircle,
  Loader2,
  Eye,
  Search,
  CalendarDays,
  ChevronDown,
} from 'lucide-react';

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

interface Application {
  id: string;
  title: string;
  category: string;
  description: string | null;
  amount: number;
  attachmentUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  attachment?: Attachment | null;
}

interface ApplicantDashboardProps {
  onViewClaim: (id: string) => void;
  onCreate: () => void;
}

const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({ onViewClaim, onCreate }) => {
  const [claims, setClaims] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Claim Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('TRAVEL');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/applications/my');
      setClaims(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch claims.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !amount) {
      setModalError('Please fill in all required fields.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setModalError('Please enter a valid amount greater than zero.');
      return;
    }

    setSubmittingClaim(true);
    setModalError(null);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('amount', amount);
      if (file) {
        formData.append('file', file);
      }

      await api.post('/applications', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Clear Form and Close Modal
      setTitle('');
      setCategory('TRAVEL');
      setDescription('');
      setAmount('');
      setFile(null);
      setIsModalOpen(false);

      // Refresh list
      await fetchClaims();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to submit claim.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Stats calculation
  const draftCount = claims.filter((c) => c.status === 'DRAFT').length;

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ";
    switch (status) {
      case 'DRAFT':
        return <span className={base + "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}>Draft</span>;
      case 'SUBMITTED':
        return <span className={base + "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"}>Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className={base + "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}>Under Review</span>;
      case 'APPROVED':
        return <span className={base + "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"}>Approved</span>;
      case 'REJECTED':
        return <span className={base + "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"}>Rejected</span>;
      case 'RETURNED_FOR_CHANGES':
        return <span className={base + "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"}>Returned</span>;
      default:
        return <span className={base + "bg-slate-100 text-slate-700"}>{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-end">
        <button
          onClick={onCreate}
          className="flex h-14 items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 rounded-[8px] shadow-lg shadow-blue-600/20 transition-all duration-200 cursor-pointer text-base"
        >
          <Plus size={22} />
          Create New Claim
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-5">
        <div className="bg-white border border-blue-200 p-6 rounded-[8px] shadow-sm">
          <div className="space-y-1">
            <span className="text-base text-blue-700 font-bold">Draft</span>
            <h3 className="text-4xl font-extrabold text-[#07152f] mt-6">{draftCount}</h3>
          </div>
        </div>

        {[
          ['Submitted', 'SUBMITTED', 'border-amber-200 text-amber-700'],
          ['Under Review', 'UNDER_REVIEW', 'border-violet-200 text-violet-700'],
          ['Approved', 'APPROVED', 'border-emerald-200 text-emerald-700'],
          ['Rejected', 'REJECTED', 'border-red-200 text-red-700'],
          ['Returned', 'RETURNED_FOR_CHANGES', 'border-orange-200 text-orange-700'],
        ].map(([label, status, classes]) => (
          <div key={status} className={`bg-white border ${classes} p-6 rounded-[8px] shadow-sm`}>
            <span className="text-base font-bold">{label}</span>
            <h3 className="text-4xl font-extrabold text-[#07152f] mt-6">{claims.filter((c) => c.status === status).length}</h3>
          </div>
        ))}
      </div>

      <div className="grid gap-5 border-t border-slate-200 pt-7 lg:grid-cols-[1.5fr_1.2fr_1.2fr_1.3fr]">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#33476b]" size={24} />
          <input placeholder="Search by title or description..." className="h-14 w-full rounded-[8px] border border-slate-200 bg-white pl-14 pr-4 outline-none" />
        </div>
        <button className="flex h-14 items-center justify-between rounded-[8px] border border-slate-200 bg-white px-5 font-bold">
          All Statuses <ChevronDown size={20} />
        </button>
        <button className="flex h-14 items-center justify-between rounded-[8px] border border-slate-200 bg-white px-5 font-bold">
          All Categories <ChevronDown size={20} />
        </button>
        <button className="flex h-14 items-center gap-4 rounded-[8px] border border-slate-200 bg-white px-5 text-[#33476b]">
          <CalendarDays size={22} /> Select Date Range
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[8px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[#07152f] text-sm font-extrabold">
                <th className="py-5 px-6">Title</th>
                <th className="py-5 px-4">Category</th>
                <th className="py-5 px-4">Amount</th>
                <th className="py-5 px-4">Status</th>
                <th className="py-5 px-4">Last Updated</th>
                <th className="py-5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-blue-600" size={32} /></td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="py-12 text-center text-red-600">{error}</td></tr>
              ) : claims.map((claim) => (
                <tr key={claim.id} className="text-[#10244a] text-base hover:bg-slate-50">
                  <td className="py-4 px-6">
                    <div className="font-extrabold text-[#07152f]">{claim.title}</div>
                    {claim.description && <p className="mt-1 text-sm text-[#33476b]">{claim.description}</p>}
                  </td>
                  <td className="py-4 px-4 font-bold">{claim.category}</td>
                  <td className="py-4 px-4 font-extrabold">${parseFloat(claim.amount as any).toFixed(2)}</td>
                  <td className="py-4 px-4">{getStatusBadge(claim.status)}</td>
                  <td className="py-4 px-4">
                    {new Date(claim.updatedAt).toLocaleDateString()}<br />
                    <span className="text-[#33476b]">{new Date(claim.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => onViewClaim(claim.id)} className="rounded-[8px] border border-blue-200 px-5 py-2 font-bold text-blue-600">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-5 text-[#33476b]">
          <span>Showing 1 to {claims.length} of {claims.length} results</span>
          <span className="rounded-[8px] bg-blue-600 px-4 py-3 font-bold text-white">1</span>
        </div>
      </div>

      {/* Legacy list kept unreachable while modal state is false */}
      {false && (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-150 dark:border-slate-800/80 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white my-0 leading-none">Your Expense Claims</h2>
          <span className="text-xs font-semibold text-slate-400">{claims.length} claim(s) found</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <span className="text-xs font-semibold text-slate-400">Loading claims...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-sm flex items-center justify-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : claims.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="bg-indigo-50 dark:bg-indigo-950/20 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
              <FileText size={24} />
            </div>
            <h4 className="text-slate-900 dark:text-white font-bold text-sm">No claims submitted yet</h4>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              Get started by clicking the "Create Expense Claim" button to submit your first claim.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-6">Claim Title</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Date Created</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {claims.map((claim) => (
                  <tr
                    key={claim.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors text-slate-700 dark:text-slate-300 text-sm group"
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        {claim.title}
                      </div>
                      {claim.description && (
                        <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                          {claim.description}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-slate-400">{claim.category}</td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-200">
                      ${parseFloat(claim.amount as any).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(claim.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onViewClaim(claim.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 hover:font-bold dark:text-slate-400 dark:hover:text-white cursor-pointer transition-colors"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white my-0">Create Expense Claim</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            {modalError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-lg mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flight to Sydney Conference"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-lg p-2.5 text-sm outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-lg p-2.5 text-sm outline-none"
                    required
                  >
                    <option value="TRAVEL">Travel</option>
                    <option value="FUEL">Fuel</option>
                    <option value="INTERNET">Internet</option>
                    <option value="MEALS">Meals</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-lg p-2.5 text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Explain what this expense is for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-lg p-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Receipt File (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer flex items-center gap-2"
                >
                  {submittingClaim && <Loader2 size={14} className="animate-spin" />}
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantDashboard;
