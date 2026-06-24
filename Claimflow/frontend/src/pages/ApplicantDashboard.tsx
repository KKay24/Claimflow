import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  FileText,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  Loader2,
  Eye,
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
}

const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({ onViewClaim }) => {
  const { user } = useAuth();
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
  const totalAmount = claims.reduce((acc, c) => acc + parseFloat(c.amount as any), 0);
  const approvedCount = claims.filter((c) => c.status === 'APPROVED').length;
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
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white my-0 leading-none">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Submit and track your expense reimbursement claims.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-5 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all duration-200 cursor-pointer text-sm"
        >
          <Plus size={18} />
          Create Expense Claim
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Claims</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{claims.length}</h3>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-slate-600 dark:text-slate-300">
            <FileSpreadsheet size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Amount</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${totalAmount.toFixed(2)}</h3>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl text-indigo-600">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Approved</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{approvedCount}</h3>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl text-emerald-600">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Drafts</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{draftCount}</h3>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-slate-500">
            <FileText size={20} />
          </div>
        </div>
      </div>

      {/* Claims List Table/Grid */}
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
