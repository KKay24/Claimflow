import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
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
  currency?: string;
  expenseDate?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  applicant?: Applicant;
}

interface ReviewerClaimsPageProps {
  onViewClaim: (id: string) => void;
}

const ReviewerClaimsPage: React.FC<ReviewerClaimsPageProps> = ({ onViewClaim }) => {
  const [claims, setClaims] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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

  const totalCount = claims.length;
  const submittedCount = claims.filter((claim) => claim.status === 'SUBMITTED').length;
  const reviewCount = claims.filter((claim) => claim.status === 'UNDER_REVIEW').length;
  const approvedCount = claims.filter((claim) => claim.status === 'APPROVED').length;
  const rejectedCount = claims.filter((claim) => claim.status === 'REJECTED').length;
  const returnedCount = claims.filter((claim) => claim.status === 'RETURNED_FOR_CHANGES').length;

  const statCards = [
    { label: 'Total Claims', status: 'ALL', value: totalCount, caption: 'All time', icon: FileSpreadsheet, classes: 'border-blue-200 text-blue-700 bg-blue-50' },
    { label: 'Submitted', status: 'SUBMITTED', value: submittedCount, caption: 'Awaiting review', icon: Send, classes: 'border-amber-200 text-amber-700 bg-amber-50' },
    { label: 'Under Review', status: 'UNDER_REVIEW', value: reviewCount, caption: 'In progress', icon: Timer, classes: 'border-violet-200 text-violet-700 bg-violet-50' },
    { label: 'Approved', status: 'APPROVED', value: approvedCount, caption: 'Completed', icon: CheckCircle, classes: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
    { label: 'Rejected', status: 'REJECTED', value: rejectedCount, caption: 'Completed', icon: XCircle, classes: 'border-red-200 text-red-700 bg-red-50' },
    { label: 'Returned', status: 'RETURNED_FOR_CHANGES', value: returnedCount, caption: 'Sent back', icon: RotateCcw, classes: 'border-orange-200 text-orange-700 bg-orange-50' },
  ];

  const categoryOptions = useMemo(
    () => Array.from(new Set(claims.map((claim) => claim.category))).sort(),
    [claims],
  );

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    return claims.filter((claim) => {
      const createdTime = new Date(claim.createdAt).getTime();
      const matchesSearch =
        !query ||
        [claim.id, claim.title, claim.description, claim.category, claim.status, claim.applicant?.name, claim.applicant?.email]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));

      return (
        matchesSearch &&
        (statusFilter === 'ALL' || claim.status === statusFilter) &&
        (categoryFilter === 'ALL' || claim.category === categoryFilter) &&
        (!fromTime || createdTime >= fromTime) &&
        (!toTime || createdTime <= toTime)
      );
    });
  }, [categoryFilter, claims, dateFrom, dateTo, search, statusFilter]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const exportClaims = () => {
    const headers = ['Claim ID', 'Title', 'Applicant', 'Category', 'Amount', 'Status', 'Submitted On'];
    const rows = filteredClaims.map((claim) => [
      `CLM-${claim.id.slice(0, 8)}`,
      claim.title,
      claim.applicant?.name || 'Unknown',
      claim.category,
      `${claim.currency || 'USD'} ${parseFloat(claim.amount as any).toFixed(2)}`,
      claim.status,
      new Date(claim.createdAt).toLocaleString(),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'claimflow-review-claims.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (claimStatus: string) => {
    const base = 'status-badge inline-flex rounded-[6px] border px-3 py-1 uppercase ';
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
      <span className={`status-badge inline-flex rounded-[6px] border px-3 py-1 ${palette[category] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
        {category.replaceAll('_', ' ')}
      </span>
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isSelected = statusFilter === card.status;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setStatusFilter(card.status)}
              aria-pressed={isSelected}
              title={`Filter by ${card.label}`}
              className={`group flex min-h-[150px] cursor-pointer rounded-[8px] border bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1.5 hover:border-blue-500 hover:bg-white hover:shadow-xl hover:shadow-blue-950/10 active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500 ${card.classes} ${
                isSelected ? 'border-blue-500 ring-2 ring-blue-500 shadow-lg shadow-blue-950/10' : ''
              }`}
            >
              <div className="flex w-full flex-col justify-between gap-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${card.classes}`}>
                      <Icon size={12} strokeWidth={2.4} />
                    </span>
                    <h3 className="card-title min-w-0 whitespace-nowrap">{card.label}</h3>
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-3">
                    <div className="page-title text-[#07152f]">{card.value}</div>
                    <p className="small-text text-[#33476b]">{card.caption}</p>
                  </div>
                  <p className="helper-text mt-1 text-[#33476b] opacity-0 transition-opacity group-hover:opacity-100">
                    Click to filter
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <section className="max-w-full overflow-hidden rounded-[8px] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid items-center gap-3 xl:grid-cols-[220px_160px_170px_260px_112px_108px]">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#33476b]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, applicant or ID..."
              className="helper-text h-11 w-full rounded-[8px] border border-slate-200 bg-white pl-10 pr-3 outline-none focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="button-text h-11 w-full appearance-none rounded-[8px] border border-slate-200 bg-white px-3 pr-8 outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              {statCards.filter((card) => card.status !== 'ALL').map((card) => (
                <option key={card.status} value={card.status}>{card.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="button-text h-11 w-full appearance-none rounded-[8px] border border-slate-200 bg-white px-3 pr-8 outline-none focus:border-blue-500"
            >
              <option value="ALL">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="button-text flex h-11 items-center gap-2 rounded-[8px] border border-slate-200 px-3 text-left">
            <CalendarDays size={17} />
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="min-w-0 bg-transparent outline-none" />
            <span>-</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="min-w-0 bg-transparent outline-none" />
          </div>
          <button onClick={clearFilters} className="button-text h-11 rounded-[8px] border border-slate-200 px-3 text-[#33476b] hover:bg-slate-50">Clear Filters</button>
          <button onClick={exportClaims} className="button-text flex h-11 items-center justify-center gap-2 rounded-[8px] bg-blue-600 px-3 text-white hover:bg-blue-700">
            <Download size={17} />
            Export
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <span className="helper-text text-slate-400">Loading review queue...</span>
          </div>
        ) : error ? (
          <div className="small-text flex items-center justify-center gap-2 p-8 text-center text-rose-500">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="px-4 py-20 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[8px] bg-amber-50 text-amber-600">
              <ShieldCheck size={24} />
            </div>
            <h4 className="card-title text-slate-900">No claims match this view</h4>
            <p className="helper-text mx-auto mt-1 max-w-sm text-slate-400">
              Adjust the status filter or search query to find another claim.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead className="table-header border-y border-slate-200 bg-slate-50 text-[#07152f]">
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
                {filteredClaims.map((claim) => (
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
                    className="body-text cursor-pointer text-[#10244a] transition hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  >
                    <td className="px-5 py-4 text-blue-600">CLM-{claim.id.slice(0, 8)}</td>
                    <td className="px-5 py-4">
                      <div className="text-[#07152f]">{claim.title}</div>
                      {claim.description && <p className="small-text mt-1 text-[#33476b]">{claim.description}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <div>{claim.applicant?.name || 'Unknown'}</div>
                      <div className="small-text text-[#33476b]">{claim.applicant?.email}</div>
                    </td>
                    <td className="px-5 py-4">{categoryBadge(claim.category)}</td>
                    <td className="px-5 py-4">{claim.currency || 'USD'} {parseFloat(claim.amount as any).toFixed(2)}</td>
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
                        className="button-text rounded-[8px] border border-blue-200 px-5 py-2 text-blue-600 hover:bg-blue-50"
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
        <div className="small-text flex items-center justify-between border-t border-slate-200 px-5 py-4 text-[#33476b]">
          <span>Showing 1 to {filteredClaims.length} of {claims.length} results</span>
          <span className="button-text rounded-[8px] bg-blue-600 px-4 py-3 text-white">1</span>
        </div>
      </section>
    </div>
  );
};

export default ReviewerClaimsPage;
