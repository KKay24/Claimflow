import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Eye,
  FileSpreadsheet,
  Loader2,
  Search,
  ShieldCheck,
  Timer,
  XCircle,
} from 'lucide-react';
import api from '../utils/api';

interface Applicant {
  id: string;
  name: string;
  email: string;
}

interface Application {
  id: string;
  title: string;
  category: string;
  description: string | null;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  applicant?: Applicant;
}

interface ReviewerDashboardProps {
  onViewClaim: (id: string) => void;
}

const statusFilters = [
  { label: 'All', value: '' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Returned', value: 'RETURNED_FOR_CHANGES' },
];

const ReviewerDashboard: React.FC<ReviewerDashboardProps> = ({ onViewClaim }) => {
  const [claims, setClaims] = useState<Application[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClaims = async (selectedStatus = status) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/reviewer/applications', {
        params: selectedStatus ? { status: selectedStatus } : {},
      });
      setClaims(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reviewer claims.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims(status);
  }, [status]);

  const filteredClaims = claims.filter((claim) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      claim.title,
      claim.category,
      claim.status,
      claim.applicant?.name,
      claim.applicant?.email,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query));
  });

  const submittedCount = claims.filter((claim) => claim.status === 'SUBMITTED').length;
  const reviewCount = claims.filter((claim) => claim.status === 'UNDER_REVIEW').length;
  const approvedCount = claims.filter((claim) => claim.status === 'APPROVED').length;
  const rejectedCount = claims.filter((claim) => claim.status === 'REJECTED').length;

  const getStatusBadge = (claimStatus: string) => {
    const base = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ';
    switch (claimStatus) {
      case 'SUBMITTED':
        return <span className={base + 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}>Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className={base + 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}>Under Review</span>;
      case 'APPROVED':
        return <span className={base + 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}>Approved</span>;
      case 'REJECTED':
        return <span className={base + 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}>Rejected</span>;
      case 'RETURNED_FOR_CHANGES':
        return <span className={base + 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}>Returned</span>;
      default:
        return <span className={base + 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}>{claimStatus}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex justify-end lg:-mt-[68px] lg:mb-4">
        <div className="relative w-full lg:w-[360px]">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search claims or applicants"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Submitted</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{submittedCount}</h3>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl text-blue-600">
            <FileSpreadsheet size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Under Review</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{reviewCount}</h3>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl text-amber-600">
            <Timer size={20} />
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
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Rejected</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{rejectedCount}</h3>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl text-rose-600">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white my-0 leading-none">Claims queue</h2>
            <span className="text-xs font-semibold text-slate-400">{filteredClaims.length} claim(s) shown</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => setStatus(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  status === filter.value
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <span className="text-xs font-semibold text-slate-400">Loading review queue...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-sm flex items-center justify-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="bg-amber-50 dark:bg-amber-950/20 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-slate-900 dark:text-white font-bold text-sm">No claims match this view</h4>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              Adjust the status filter or search query to find another claim.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-6">Claim</th>
                  <th className="py-4 px-4">Applicant</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredClaims.map((claim) => (
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
                    <td className="py-4 px-4">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {claim.applicant?.name || 'Unknown'}
                      </div>
                      <div className="text-[10px] text-slate-400">{claim.applicant?.email}</div>
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-slate-400">{claim.category}</td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-200">
                      ${parseFloat(claim.amount as any).toFixed(2)}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(claim.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onViewClaim(claim.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 hover:font-bold dark:text-slate-400 dark:hover:text-white cursor-pointer transition-colors"
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewerDashboard;
