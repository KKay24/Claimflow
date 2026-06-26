import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  Download,
  Info,
  Loader2,
  Plane,
  Search,
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  comment: string | null;
  createdAt: string;
  user: UserSummary;
}

interface Application {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  applicant?: UserSummary;
  auditLogs?: AuditLog[];
}

interface AuditHistoryProps {
  onViewClaim: (id: string) => void;
}

const badge = (status: string | null) => {
  if (!status) return <span className="text-slate-400">NEW</span>;
  const palette: Record<string, string> = {
    DRAFT: 'bg-blue-50 text-blue-700 border-blue-200',
    SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-200',
    UNDER_REVIEW: 'bg-violet-50 text-violet-700 border-violet-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    RETURNED_FOR_CHANGES: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return <span className={`status-badge rounded-[6px] border px-3 py-1 ${palette[status] || palette.DRAFT}`}>{status}</span>;
};

const AuditHistory: React.FC<AuditHistoryProps> = ({ onViewClaim }) => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [claimFilter, setClaimFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const listEndpoint = user?.role === 'REVIEWER' ? '/reviewer/applications' : '/applications/my';
      const listResponse = await api.get(listEndpoint);
      const details = await Promise.all(
        listResponse.data.map((claim: Application) =>
          api
            .get(user?.role === 'REVIEWER' ? `/reviewer/applications/${claim.id}` : `/applications/${claim.id}`)
            .then((response) => response.data)
            .catch(() => claim),
        ),
      );
      setClaims(details);
      setLoading(false);
    };

    load();
  }, [user?.role]);

  const allRows = useMemo(
    () =>
      claims.flatMap((claim) =>
        (claim.auditLogs || []).map((log) => ({
          claim,
          log,
        })),
      ),
    [claims],
  );

  const claimOptions = useMemo(
    () => claims.map((claim) => ({ id: claim.id, title: claim.title })),
    [claims],
  );

  const actionOptions = useMemo(
    () => Array.from(new Set(allRows.map(({ log }) => log.newStatus))).sort(),
    [allRows],
  );

  const userOptions = useMemo(
    () => Array.from(new Set(allRows.map(({ log }) => log.user?.name || 'System'))).sort(),
    [allRows],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    return allRows
      .filter(({ claim, log }) => {
        const logTime = new Date(log.createdAt).getTime();
        const actorName = log.user?.name || 'System';
        const matchesSearch =
          !q ||
          [claim.title, claim.id, log.comment, actorName, log.oldStatus, log.newStatus]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(q));

        return (
          matchesSearch &&
          (claimFilter === 'ALL' || claim.id === claimFilter) &&
          (actionFilter === 'ALL' || log.newStatus === actionFilter) &&
          (userFilter === 'ALL' || actorName === userFilter) &&
          (!fromTime || logTime >= fromTime) &&
          (!toTime || logTime <= toTime)
        );
      })
      .sort((a, b) => new Date(b.log.createdAt).getTime() - new Date(a.log.createdAt).getTime());
  }, [actionFilter, allRows, claimFilter, dateFrom, dateTo, search, userFilter]);

  const clearFilters = () => {
    setSearch('');
    setClaimFilter('ALL');
    setActionFilter('ALL');
    setUserFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const exportRows = () => {
    const headers = ['Date & Time', 'Claim', 'Action', 'Old Status', 'New Status', 'User', 'Role', 'Comment'];
    const csvRows = rows.map(({ claim, log }) => [
      new Date(log.createdAt).toLocaleString(),
      claim.title,
      'Status Changed',
      log.oldStatus || 'NEW',
      log.newStatus,
      log.user?.name || 'System',
      log.user?.role || user?.role || '',
      log.comment || '-',
    ]);
    const csv = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'claimflow-audit-history.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <div className="grid min-w-[1120px] grid-cols-[280px_178px_190px_174px_260px_128px] gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#33476b]" size={22} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by claim title or ID..."
                className="small-text h-12 w-full rounded-[8px] border border-slate-200 pl-12 pr-4 outline-none focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <select value={claimFilter} onChange={(event) => setClaimFilter(event.target.value)} className="button-text h-12 w-full appearance-none rounded-[8px] border border-slate-200 bg-white px-4 pr-10 outline-none focus:border-blue-500">
                <option value="ALL">All Claims</option>
                {claimOptions.map((claim) => (
                  <option key={claim.id} value={claim.id}>{claim.title}</option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
            <div className="relative">
              <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="button-text h-12 w-full appearance-none rounded-[8px] border border-slate-200 bg-white px-4 pr-10 outline-none focus:border-blue-500">
                <option value="ALL">All Actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>{action.replaceAll('_', ' ')}</option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
            <div className="relative">
              <select value={userFilter} onChange={(event) => setUserFilter(event.target.value)} className="button-text h-12 w-full appearance-none rounded-[8px] border border-slate-200 bg-white px-4 pr-10 outline-none focus:border-blue-500">
                <option value="ALL">All Users</option>
                {userOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
            <div className="button-text flex h-12 items-center gap-3 rounded-[8px] border border-slate-200 px-4">
              <CalendarDays size={20} />
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="min-w-0 bg-transparent outline-none" />
              <span>-</span>
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="min-w-0 bg-transparent outline-none" />
            </div>
            <button onClick={clearFilters} className="button-text h-12 rounded-[8px] border border-slate-200 px-4 text-[#33476b] hover:bg-slate-50">Clear Filters</button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-[8px] border border-blue-100 bg-blue-50 px-5 py-4">
          <div className="body-text flex items-center gap-4 text-[#33476b]">
            <Info size={22} className="text-blue-600" />
            <span>{rows.length} audit records found</span>
          </div>
          <button onClick={exportRows} className="button-text flex h-11 items-center gap-3 rounded-[8px] border border-blue-300 px-5 text-blue-600 hover:bg-blue-100">
            <Download size={19} />
            Export
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-[8px] border border-slate-200">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="table-header bg-slate-50 text-[#07152f]">
              <tr>
                <th className="px-5 py-4">Date & Time</th>
                <th className="px-5 py-4">Claim</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Change</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-blue-600">
                    <Loader2 className="mx-auto animate-spin" size={32} />
                  </td>
                </tr>
              ) : rows.map(({ claim, log }) => (
                <tr
                  key={log.id}
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
                  <td className="px-5 py-4">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onViewClaim(claim.id);
                      }}
                      className="flex items-center gap-3 text-left hover:text-blue-600"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-blue-50 text-blue-600">
                        <Plane size={22} />
                      </span>
                      <span>
                        <span className="block">{claim.title}</span>
                        <span className="small-text block text-[#33476b]">{claim.id.slice(0, 8)}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-block h-3 w-3 rounded-full bg-violet-500" /> <span className="ml-2">Status Changed</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">{badge(log.oldStatus)} <span>→</span> {badge(log.newStatus)}</div>
                  </td>
                  <td className="px-5 py-4">{log.user?.name || 'System'}</td>
                  <td className="px-5 py-4">{badge(log.user?.role || user?.role || '')}</td>
                  <td className="px-5 py-4">{log.comment || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AuditHistory;
