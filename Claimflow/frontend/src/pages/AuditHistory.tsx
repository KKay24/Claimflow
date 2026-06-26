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

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return claims
      .flatMap((claim) =>
        (claim.auditLogs || []).map((log) => ({
          claim,
          log,
        })),
      )
      .filter(({ claim }) => !q || claim.title.toLowerCase().includes(q) || claim.id.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.log.createdAt).getTime() - new Date(a.log.createdAt).getTime());
  }, [claims, search]);

  return (
    <div>
      <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <div className="grid min-w-[1120px] grid-cols-[280px_178px_190px_174px_226px_128px] gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#33476b]" size={22} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by claim title or ID..."
                className="small-text h-12 w-full rounded-[8px] border border-slate-200 pl-12 pr-4 outline-none focus:border-blue-500"
              />
            </div>
            {['All Claims', 'All Actions', 'All Users'].map((label) => (
              <button key={label} className="button-text flex h-12 items-center justify-between rounded-[8px] border border-slate-200 px-4">
                {label}
                <ChevronDown size={18} />
              </button>
            ))}
            <button className="button-text flex h-12 items-center gap-3 rounded-[8px] border border-slate-200 px-4">
              <CalendarDays size={20} />
              01 May 2024 - 12 May 2024
              <ChevronDown size={18} className="ml-auto" />
            </button>
            <button className="button-text h-12 rounded-[8px] border border-slate-200 px-4 text-[#33476b]">Clear Filters</button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-[8px] border border-blue-100 bg-blue-50 px-5 py-4">
          <div className="body-text flex items-center gap-4 text-[#33476b]">
            <Info size={22} className="text-blue-600" />
            <span>{rows.length} audit records found</span>
          </div>
          <button className="button-text flex h-11 items-center gap-3 rounded-[8px] border border-blue-300 px-5 text-blue-600">
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
                <tr key={log.id} className="body-text text-[#10244a]">
                  <td className="px-5 py-4">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => onViewClaim(claim.id)} className="flex items-center gap-3 text-left">
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
