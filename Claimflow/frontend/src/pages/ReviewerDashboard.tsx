import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  Search,
  Send,
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

const ReviewerDashboard: React.FC<ReviewerDashboardProps> = ({ onViewClaim }) => {
  const [claims, setClaims] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/reviewer/applications');
      setClaims(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reviewer claims.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

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
  const returnedCount = claims.filter((claim) => claim.status === 'RETURNED_FOR_CHANGES').length;
  const totalCount = claims.length;

  const getStatusBadge = (claimStatus: string) => {
    const base = 'inline-flex rounded-[6px] border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ';
    switch (claimStatus) {
      case 'SUBMITTED':
        return <span className={base + 'border-amber-200 bg-amber-50 text-amber-700'}>Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className={base + 'border-violet-200 bg-violet-50 text-violet-700'}>Under Review</span>;
      case 'APPROVED':
        return <span className={base + 'border-emerald-200 bg-emerald-50 text-emerald-700'}>Approved</span>;
      case 'REJECTED':
        return <span className={base + 'border-red-200 bg-red-50 text-red-700'}>Rejected</span>;
      case 'RETURNED_FOR_CHANGES':
        return <span className={base + 'border-orange-200 bg-orange-50 text-orange-700'}>Returned</span>;
      default:
        return <span className={base + 'border-slate-200 bg-slate-100 text-slate-700'}>{claimStatus}</span>;
    }
  };

  const categoryBadge = (category: string) => {
    const palette: Record<string, string> = {
      TRAVEL: 'border-blue-200 bg-blue-50 text-blue-700',
      INTERNET: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      MEALS: 'border-orange-200 bg-orange-50 text-orange-700',
      FUEL: 'border-red-200 bg-red-50 text-red-700',
      EQUIPMENT: 'border-violet-200 bg-violet-50 text-violet-700',
    };
    return (
      <span className={`inline-flex rounded-[6px] border px-3 py-1 text-xs font-extrabold ${palette[category] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
        {category.replaceAll('_', ' ')}
      </span>
    );
  };

  const statCards = [
    { label: 'Total Claims', value: totalCount, caption: 'All time', icon: FileSpreadsheet, classes: 'border-blue-200 text-blue-700 bg-blue-50' },
    { label: 'Submitted', value: submittedCount, caption: 'Awaiting review', icon: Send, classes: 'border-amber-200 text-amber-700 bg-amber-50' },
    { label: 'Under Review', value: reviewCount, caption: 'In progress', icon: Timer, classes: 'border-violet-200 text-violet-700 bg-violet-50' },
    { label: 'Approved', value: approvedCount, caption: 'Completed', icon: CheckCircle, classes: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
    { label: 'Rejected', value: rejectedCount, caption: 'Completed', icon: XCircle, classes: 'border-red-200 text-red-700 bg-red-50' },
    { label: 'Returned', value: returnedCount, caption: 'Sent back', icon: RotateCcw, classes: 'border-orange-200 text-orange-700 bg-orange-50' },
  ];

  const recentClaims = filteredClaims.slice(0, 5);
  const percentage = (count: number) => (totalCount ? Math.round((count / totalCount) * 100) : 0);

  return (
    <div className="w-full space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <section key={card.label} className={`rounded-[8px] border bg-white p-5 shadow-sm ${card.classes}`}>
              <div className="flex items-start gap-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${card.classes}`}>
                  <Icon size={24} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold">{card.label}</h3>
                  <div className="mt-2 text-[28px] font-extrabold text-[#07152f]">{card.value}</div>
                  <p className="mt-1 text-sm font-medium text-[#33476b]">{card.caption}</p>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.5fr_0.85fr_0.85fr_1.1fr_auto_auto]">
          <div className="relative">
            <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#33476b]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, applicant or ID..."
              className="h-12 w-full rounded-[8px] border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <button className="flex h-12 items-center justify-between rounded-[8px] border border-slate-200 px-4 text-sm font-extrabold">
            All Statuses <ChevronDown size={18} />
          </button>
          <button className="flex h-12 items-center justify-between rounded-[8px] border border-slate-200 px-4 text-sm font-extrabold">
            All Categories <ChevronDown size={18} />
          </button>
          <button className="flex h-12 items-center gap-3 rounded-[8px] border border-slate-200 px-4 text-sm font-extrabold">
            <CalendarDays size={20} />
            <span>
              <span className="block text-xs text-[#33476b]">Date Range</span>
              01 May 2024 - 12 May 2024
            </span>
            <ChevronDown size={18} className="ml-auto" />
          </button>
          <button className="h-12 rounded-[8px] border border-slate-200 px-5 text-sm font-extrabold text-[#33476b]">Clear Filters</button>
          <button className="flex h-12 items-center gap-3 rounded-[8px] bg-blue-600 px-5 text-sm font-extrabold text-white">
            <Download size={19} />
            Export
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-extrabold text-[#07152f]">Recent Claims</h2>
          <button className="flex items-center gap-2 text-sm font-extrabold text-blue-600">
            View all claims <ArrowRight size={18} />
          </button>
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
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead className="border-y border-slate-200 bg-slate-50 text-sm font-extrabold text-[#07152f]">
                <tr>
                  <th className="px-5 py-4">Claim ID</th>
                  <th className="px-5 py-4">Title</th>
                  <th className="px-5 py-4">Applicant</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Submitted On</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    onClick={() => onViewClaim(claim.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onViewClaim(claim.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className="cursor-pointer text-sm text-[#10244a] transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  >
                    <td className="px-5 py-4 font-extrabold text-blue-600">CLM-{claim.id.slice(0, 8)}</td>
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-[#07152f]">{claim.title}</div>
                      {claim.description && <p className="mt-1 text-[#33476b]">{claim.description}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-extrabold">{claim.applicant?.name || 'Unknown'}</div>
                      <div className="text-[#33476b]">{claim.applicant?.email}</div>
                    </td>
                    <td className="px-5 py-4">{categoryBadge(claim.category)}</td>
                    <td className="px-5 py-4 font-extrabold">USD {parseFloat(claim.amount as any).toFixed(2)}</td>
                    <td className="px-5 py-4">{getStatusBadge(claim.status)}</td>
                    <td className="px-5 py-4">
                      {new Date(claim.createdAt).toLocaleDateString()}<br />
                      <span className="text-[#33476b]">{new Date(claim.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onViewClaim(claim.id);
                        }}
                        className="rounded-[8px] border border-blue-200 px-5 py-2 text-sm font-extrabold text-blue-600"
                      >
                        {claim.status === 'SUBMITTED' ? 'Start Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-[#33476b]">
          <span>Showing 1 to {recentClaims.length} of {filteredClaims.length} results</span>
          <div className="flex items-center gap-3">
            <span className="rounded-[8px] bg-blue-600 px-4 py-3 font-extrabold text-white">1</span>
            <span className="rounded-[8px] border border-slate-200 px-4 py-3 font-extrabold">2</span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold text-[#07152f]">Claims by Status</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
            <div
              className="mx-auto flex h-40 w-40 items-center justify-center rounded-full"
              style={{
                background: 'conic-gradient(#7c3aed 0 21%, #f59e0b 21% 51%, #10b981 51% 86%, #ef4444 86% 95%, #fb923c 95% 100%)',
              }}
            >
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center">
                <span className="text-2xl font-extrabold text-[#07152f]">{totalCount}</span>
                <span className="text-xs font-semibold text-[#33476b]">Total</span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Under Review', reviewCount, 'bg-violet-600'],
                ['Submitted', submittedCount, 'bg-amber-500'],
                ['Approved', approvedCount, 'bg-emerald-500'],
                ['Rejected', rejectedCount, 'bg-red-500'],
                ['Returned', returnedCount, 'bg-orange-400'],
              ].map(([label, count, dot]) => (
                <div key={label as string} className="grid grid-cols-[1fr_auto] items-center gap-4">
                  <span className="flex items-center gap-3 font-bold text-[#10244a]">
                    <span className={`h-3 w-3 rounded-full ${dot}`} />
                    {label}
                  </span>
                  <span className="text-[#33476b]">{count} ({percentage(count as number)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#07152f]">My Review Activity</h2>
            <button className="flex items-center gap-2 text-sm font-extrabold text-blue-600">
              View full activity <ArrowRight size={18} />
            </button>
          </div>
          <div className="mt-5 divide-y divide-slate-200">
            {[
              ['Moved to Under Review', 'CLM-2024-0052 · Flight to Nairobi', '12 May 2024, 02:15 PM', Timer, 'bg-violet-100 text-violet-700'],
              ['Approved', 'CLM-2024-0048 · Office Chair', '09 May 2024, 04:10 PM', CheckCircle, 'bg-emerald-100 text-emerald-700'],
              ['Returned for Changes', 'CLM-2024-0045 · Hotel Accommodation', '08 May 2024, 03:05 PM', RotateCcw, 'bg-orange-100 text-orange-700'],
            ].map(([title, detail, date, Icon, classes]) => {
              const ActivityIcon = Icon as typeof Timer;
              return (
                <div key={title as string} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-4">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${classes}`}>
                      <ActivityIcon size={20} />
                    </span>
                    <div>
                      <div className="font-extrabold text-[#07152f]">{title as string}</div>
                      <div className="text-sm text-[#33476b]">{detail as string}</div>
                    </div>
                  </div>
                  <span className="text-sm text-[#33476b]">{date as string}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReviewerDashboard;
