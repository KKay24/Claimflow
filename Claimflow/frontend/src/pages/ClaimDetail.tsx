import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Download,
  AlertTriangle,
  Edit2,
  Send,
  Loader2,
  Paperclip,
  Copy,
  Info,
  Tag,
  CheckCircle2,
  Flag,
  Plane,
} from 'lucide-react';

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

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
  description: string | null;
  amount: number;
  attachmentUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  applicant?: UserSummary;
  attachment?: Attachment | null;
  auditLogs?: AuditLog[];
}

interface ClaimDetailProps {
  claimId: string;
  onBack: () => void;
}

const ClaimDetail: React.FC<ClaimDetailProps> = ({ claimId, onBack }) => {
  const { user } = useAuth();
  const [claim, setClaim] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Transition actions state
  const [comment, setComment] = useState('');
  const [activeAction, setActiveAction] = useState<'REJECT' | 'RETURN' | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [updatingClaim, setUpdatingClaim] = useState(false);

  const fetchClaimDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = user?.role === 'REVIEWER' 
        ? `/reviewer/applications/${claimId}`
        : `/applications/${claimId}`;
      const response = await api.get(endpoint);
      setClaim(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch claim details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimDetails();
  }, [claimId]);

  const handleStatusTransition = async (targetStatus: string, commentVal?: string) => {
    setSubmittingAction(true);
    setError(null);
    try {
      let endpoint = '';
      const isReviewer = user?.role === 'REVIEWER';

      if (isReviewer) {
        if (targetStatus === 'UNDER_REVIEW') endpoint = `/reviewer/applications/${claimId}/start-review`;
        else if (targetStatus === 'APPROVED') endpoint = `/reviewer/applications/${claimId}/approve`;
        else if (targetStatus === 'REJECTED') endpoint = `/reviewer/applications/${claimId}/reject`;
        else if (targetStatus === 'RETURNED_FOR_CHANGES') endpoint = `/reviewer/applications/${claimId}/return`;
      } else {
        if (targetStatus === 'SUBMITTED') endpoint = `/applications/${claimId}/submit`;
        else if (targetStatus === 'DRAFT') endpoint = `/applications/${claimId}/draft`;
      }

      await api.post(endpoint, { comment: commentVal });
      
      // Reset comments and state
      setComment('');
      setActiveAction(null);
      
      // Refresh claim
      await fetchClaimDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to transition status to ${targetStatus}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const openEditModal = () => {
    if (!claim) return;
    setEditTitle(claim.title);
    setEditCategory(claim.category);
    setEditDescription(claim.description || '');
    setEditAmount(claim.amount.toString());
    setEditFile(null);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editCategory || !editAmount) {
      setEditError('Please fill in all required fields.');
      return;
    }
    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setEditError('Please enter a valid amount greater than zero.');
      return;
    }

    setUpdatingClaim(true);
    setEditError(null);
    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('category', editCategory);
      formData.append('description', editDescription);
      formData.append('amount', editAmount);
      if (editFile) {
        formData.append('file', editFile);
      }

      await api.patch(`/applications/${claimId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsEditModalOpen(false);
      await fetchClaimDetails();
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update claim.');
    } finally {
      setUpdatingClaim(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ";
    switch (status) {
      case 'DRAFT':
        return <span className={base + "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}>Draft</span>;
      case 'SUBMITTED':
        return <span className={base + "bg-amber-50 text-amber-700 border border-amber-200"}>Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className={base + "bg-violet-50 text-violet-700 border border-violet-200"}>Under Review</span>;
      case 'APPROVED':
        return <span className={base + "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"}>Approved</span>;
      case 'REJECTED':
        return <span className={base + "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"}>Rejected</span>;
      case 'RETURNED_FOR_CHANGES':
        return <span className={base + "bg-orange-50 text-orange-700 border border-orange-200"}>Returned for Changes</span>;
      default:
        return <span className={base + "bg-slate-100 text-slate-700"}>{status}</span>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatShortDateTime = (date: string) =>
    new Date(date).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatDateOnly = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const statusOrder = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED'];
  const progressStatus = claim?.status === 'REJECTED' ? 'APPROVED' : claim?.status === 'RETURNED_FOR_CHANGES' ? 'UNDER_REVIEW' : claim?.status;
  const currentProgressIndex = Math.max(0, statusOrder.indexOf(progressStatus || 'DRAFT'));

  const auditRows = [...(claim?.auditLogs || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <span className="text-slate-500 font-medium">Loading claim details...</span>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-semibold cursor-pointer">
          <ArrowLeft size={18} /> Back to dashboard
        </button>
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl flex items-center gap-3">
          <AlertTriangle />
          <div>
            <h3 className="font-bold">Error loading claim</h3>
            <p className="text-sm mt-1">{error || 'Claim not found.'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'APPLICANT') {
    const progressSteps = [
      { status: 'DRAFT', label: 'Draft', icon: CheckCircle2, date: claim.createdAt },
      { status: 'SUBMITTED', label: 'Submitted', icon: Plane, date: claim.updatedAt },
      { status: 'UNDER_REVIEW', label: 'Under Review', icon: Clock },
      { status: 'APPROVED', label: 'Approved / Rejected', icon: CheckCircle2 },
      { status: 'COMPLETED', label: 'Completed', icon: Flag },
    ];

    return (
      <div className="w-full space-y-5">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-extrabold text-blue-600">
            <ArrowLeft size={17} /> Back to My Claims
          </button>
          <h1 className="mt-5 text-[30px] font-extrabold leading-tight text-[#07152f]">Claim Details</h1>
          <p className="mt-2 text-[17px] text-[#33476b]">View the details and progress of your claim.</p>
        </div>

        <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <span className="flex h-20 w-20 items-center justify-center rounded-[8px] bg-violet-100 text-violet-700">
                <Plane size={42} />
              </span>
              <div>
                <h2 className="text-[26px] font-extrabold text-[#07152f]">{claim.title}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#10244a]">
                  <span className="rounded-[6px] bg-blue-50 px-3 py-1 font-bold text-blue-600">{claim.category}</span>
                  <span>Claim ID: {claim.id.slice(0, 13)}</span>
                  <Copy size={16} className="text-[#33476b]" />
                </div>
              </div>
            </div>

            <div className="text-left lg:text-right">
              {getStatusBadge(claim.status)}
              <div className="mt-4 text-sm font-bold text-[#33476b]">Submitted on</div>
              <div className="mt-1 text-base font-semibold text-[#07152f]">{formatShortDateTime(claim.createdAt)}</div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.7fr_1.05fr]">
          <section className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <FileText size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#07152f]">Description</h3>
                    <p className="mt-2 text-sm text-[#10244a]">{claim.description || 'No description provided.'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Tag size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#07152f]">Category</h3>
                    <p className="mt-2 text-sm text-[#10244a]">{claim.category}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <DollarSign size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#07152f]">Amount</h3>
                    <p className="mt-2 text-base font-semibold text-[#07152f]">USD {parseFloat(claim.amount as any).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Calendar size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#07152f]">Date of Expense</h3>
                    <p className="mt-2 text-sm text-[#10244a]">{formatDateOnly(claim.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 border-slate-200 lg:border-l lg:pl-8">
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Paperclip size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-[#07152f]">Attachment</h3>
                    {claim.attachment ? (
                      <div className="mt-3 flex items-center justify-between rounded-[8px] border border-slate-200 px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold text-[#07152f]">{claim.attachment.fileName}</div>
                          <div className="text-xs text-[#33476b]">{formatFileSize(claim.attachment.fileSize)}</div>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${claim.attachment.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 rounded-[8px] border border-slate-200 p-2 text-blue-600"
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[#33476b]">No attachment uploaded.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <FileText size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#07152f]">Notes (Optional)</h3>
                    <p className="mt-2 text-sm text-[#33476b]">-</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-[#07152f]">Claim Information</h3>
            <dl className="mt-6 space-y-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="font-bold text-[#07152f]">Status</dt>
                <dd>{getStatusBadge(claim.status)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-bold text-[#07152f]">Submitted On</dt>
                <dd className="text-right text-[#10244a]">{formatShortDateTime(claim.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-bold text-[#07152f]">Last Updated</dt>
                <dd className="text-right text-[#10244a]">{formatShortDateTime(claim.updatedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-bold text-[#07152f]">Created On</dt>
                <dd className="text-right text-[#10244a]">{formatShortDateTime(claim.createdAt)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-[#07152f]">Claim Status Progress</h3>
          <div className="mt-8 grid grid-cols-5 items-start">
            {progressSteps.map((step, index) => {
              const Icon = step.icon;
              const complete = index < currentProgressIndex;
              const active = index === currentProgressIndex;
              return (
                <div key={step.status} className="relative text-center">
                  {index > 0 && <div className={`absolute right-1/2 top-5 h-0.5 w-full ${index <= currentProgressIndex ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                  <span
                    className={`relative z-10 mx-auto flex h-11 w-11 items-center justify-center rounded-full border-4 ${
                      complete
                        ? 'border-emerald-100 bg-emerald-500 text-white'
                        : active
                          ? 'border-amber-100 bg-amber-500 text-white'
                          : 'border-slate-100 bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon size={22} />
                  </span>
                  <div className="mt-3 text-sm font-extrabold text-[#07152f]">{step.label}</div>
                  <div className="mt-1 text-xs text-[#33476b]">{step.date ? formatShortDateTime(step.date) : ''}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="px-2 text-lg font-extrabold text-[#07152f]">Audit History</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="border-y border-slate-200 text-[#33476b]">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Status Change</th>
                  <th className="px-4 py-3">Comment</th>
                  <th className="px-4 py-3">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditRows.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-4">
                      <span className="mr-4 inline-block h-3 w-3 rounded-full bg-emerald-500" />
                      {formatShortDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-4 font-medium text-[#10244a]">
                      {log.oldStatus ? 'Claim submitted' : 'Claim created'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(log.oldStatus || 'NEW')}
                        <span>→</span>
                        {getStatusBadge(log.newStatus)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#10244a]">{log.comment || 'Initial claim created'}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700">
                          {log.user?.name?.charAt(0) || user.name.charAt(0)}
                        </span>
                        <span>
                          <span className="block font-extrabold text-[#07152f]">{log.user?.name || user.name}</span>
                          <span className="text-[#33476b]">({log.user?.role || 'Applicant'})</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-[8px] border border-blue-100 bg-blue-50 px-5 py-4 text-[#10244a]">
            <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <div className="font-extrabold text-blue-700">Note</div>
              <p className="mt-1 text-sm">You will be notified once your claim is reviewed by the finance team.</p>
            </div>
          </div>
        </section>

        {claim.status === 'DRAFT' && (
          <div className="flex justify-end gap-3">
            <button onClick={openEditModal} className="rounded-[8px] border border-slate-200 px-5 py-3 text-sm font-extrabold text-[#07152f]">
              <Edit2 size={16} className="mr-2 inline" />
              Edit Draft
            </button>
            <button
              onClick={() => handleStatusTransition('SUBMITTED')}
              disabled={submittingAction}
              className="rounded-[8px] bg-blue-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"
            >
              {submittingAction ? <Loader2 size={16} className="mr-2 inline animate-spin" /> : <Send size={16} className="mr-2 inline" />}
              Submit Claim
            </button>
          </div>
        )}

        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <h3 className="mb-4 text-lg font-bold text-white">Edit Expense Claim</h3>
              {editError && <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">{editError}</div>}
              <form onSubmit={handleUpdateClaim} className="space-y-4">
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-indigo-500" required />
                <div className="grid grid-cols-2 gap-4">
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-indigo-500" required>
                    <option value="TRAVEL">Travel</option>
                    <option value="FUEL">Fuel</option>
                    <option value="INTERNET">Internet</option>
                    <option value="MEALS">Meals</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input type="number" step="0.01" min="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-indigo-500" required />
                </div>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-indigo-500" />
                <input type="file" onChange={(e) => setEditFile(e.target.files ? e.target.files[0] : null)} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-300 outline-none" />
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" disabled={updatingClaim} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">
                    {updatingClaim && <Loader2 size={14} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (user?.role === 'REVIEWER') {
    const progressSteps = [
      { status: 'DRAFT', label: 'Draft', icon: CheckCircle2, date: claim.createdAt },
      { status: 'SUBMITTED', label: 'Submitted', icon: CheckCircle2, date: claim.createdAt },
      { status: 'UNDER_REVIEW', label: 'Under Review', icon: Clock, date: claim.updatedAt },
      { status: 'APPROVED', label: 'Approved / Rejected', icon: CheckCircle2 },
      { status: 'COMPLETED', label: 'Completed', icon: Flag },
    ];

    const reviewActionAvailable = claim.status === 'SUBMITTED' || claim.status === 'UNDER_REVIEW';

    return (
      <div className="w-full space-y-5">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-extrabold text-blue-600">
            <ArrowLeft size={17} /> Back to Review Claims
          </button>
          <h1 className="mt-5 text-[30px] font-extrabold leading-tight text-[#07152f]">Claim Details</h1>
          <p className="mt-2 text-[17px] text-[#33476b]">Review the claim details and take appropriate action.</p>
        </div>

        <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <span className="flex h-20 w-20 items-center justify-center rounded-[8px] bg-violet-100 text-violet-700">
                <Plane size={42} />
              </span>
              <div>
                <h2 className="text-[26px] font-extrabold text-[#07152f]">{claim.title}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#10244a]">
                  <span className="rounded-[6px] bg-blue-50 px-3 py-1 font-bold text-blue-600">{claim.category}</span>
                  <span>Claim ID: {claim.id.slice(0, 13)}</span>
                  <Copy size={16} className="text-[#33476b]" />
                  {claim.applicant && (
                    <span>
                      Applicant: <span className="font-extrabold text-blue-600">{claim.applicant.name}</span> ({claim.applicant.email})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left lg:text-right">
              {getStatusBadge(claim.status)}
              <div className="mt-4 text-sm font-bold text-[#33476b]">Submitted on</div>
              <div className="mt-1 text-base font-semibold text-[#07152f]">{formatShortDateTime(claim.createdAt)}</div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <section className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <FileText size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#07152f]">Description</h3>
                    <p className="mt-2 text-sm text-[#10244a]">{claim.description || 'No description provided.'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Tag size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#07152f]">Category</h3>
                    <p className="mt-2 text-sm text-[#10244a]">{claim.category}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <DollarSign size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#07152f]">Amount</h3>
                    <p className="mt-2 text-base font-semibold text-[#07152f]">USD {parseFloat(claim.amount as any).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Calendar size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#07152f]">Date of Expense</h3>
                    <p className="mt-2 text-sm text-[#10244a]">{formatDateOnly(claim.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 border-slate-200 lg:border-l lg:pl-8">
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Paperclip size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-[#07152f]">Attachment</h3>
                    {claim.attachment ? (
                      <div className="mt-3 flex items-center justify-between rounded-[8px] border border-slate-200 px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold text-[#07152f]">{claim.attachment.fileName}</div>
                          <div className="text-xs text-[#33476b]">{formatFileSize(claim.attachment.fileSize)}</div>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${claim.attachment.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 rounded-[8px] border border-slate-200 p-2 text-blue-600"
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[#33476b]">No attachment uploaded.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <FileText size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#07152f]">Notes from Applicant</h3>
                    <p className="mt-2 text-sm text-[#33476b]">-</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-[#07152f]">Claim Information</h3>
            <dl className="mt-6 space-y-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="font-bold text-[#07152f]">Status</dt>
                <dd>{getStatusBadge(claim.status)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-bold text-[#07152f]">Submitted On</dt>
                <dd className="text-right text-[#10244a]">{formatShortDateTime(claim.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-bold text-[#07152f]">Last Updated</dt>
                <dd className="text-right text-[#10244a]">{formatShortDateTime(claim.updatedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-bold text-[#07152f]">Created On</dt>
                <dd className="text-right text-[#10244a]">{formatShortDateTime(claim.createdAt)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-[#07152f]">Claim Status Progress</h3>
          <div className="mt-8 grid grid-cols-5 items-start">
            {progressSteps.map((step, index) => {
              const Icon = step.icon;
              const complete = index < currentProgressIndex;
              const active = index === currentProgressIndex;
              return (
                <div key={step.status} className="relative text-center">
                  {index > 0 && <div className={`absolute right-1/2 top-5 h-0.5 w-full ${index <= currentProgressIndex ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                  <span
                    className={`relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 ${
                      complete
                        ? 'border-emerald-100 bg-emerald-500 text-white'
                        : active
                          ? 'border-violet-100 bg-violet-600 text-white'
                          : 'border-slate-100 bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon size={22} />
                  </span>
                  <div className="mt-3 text-sm font-extrabold text-[#07152f]">{step.label}</div>
                  <div className="mt-1 text-xs text-[#33476b]">{step.date ? formatShortDateTime(step.date) : ''}</div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.9fr_1fr]">
          <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="px-2 text-lg font-extrabold text-[#07152f]">Audit History</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-y border-slate-200 text-[#33476b]">
                  <tr>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Status Change</th>
                    <th className="px-4 py-3">By</th>
                    <th className="px-4 py-3">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {auditRows.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-4">
                        <span className={`mr-4 inline-block h-3 w-3 rounded-full ${log.newStatus === 'UNDER_REVIEW' ? 'bg-violet-500' : log.newStatus === 'SUBMITTED' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        {formatShortDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-4 font-medium text-[#10244a]">
                        {log.newStatus === 'UNDER_REVIEW' ? 'Moved to review' : log.oldStatus ? 'Claim submitted' : 'Claim created'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(log.oldStatus || 'NEW')}
                          <span>→</span>
                          {getStatusBadge(log.newStatus)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#10244a]">
                        <span className="font-extrabold">{log.user?.name || 'System'}</span>
                        <span className="block text-[#33476b]">({log.user?.role || 'Reviewer'})</span>
                      </td>
                      <td className="px-4 py-4 text-[#10244a]">{log.comment || 'Initial claim created'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="mt-4 rounded-[8px] border border-blue-200 px-5 py-3 text-sm font-extrabold text-blue-600">
              View Full Audit History
            </button>
          </section>

          <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-extrabold text-[#07152f]">Review Actions</h3>
            <p className="mt-2 text-sm text-[#33476b]">Please review the claim details and choose an action.</p>

            <div className="mt-4 space-y-3">
              {claim.status === 'SUBMITTED' && (
                <button
                  onClick={() => handleStatusTransition('UNDER_REVIEW')}
                  disabled={submittingAction}
                  className="w-full rounded-[8px] bg-blue-600 px-4 py-3 text-left font-extrabold text-white disabled:opacity-50"
                >
                  Start Review
                  <span className="block text-xs font-semibold">Move this claim into review</span>
                </button>
              )}

              <button
                onClick={() => handleStatusTransition('APPROVED')}
                disabled={submittingAction || !reviewActionAvailable}
                className="w-full rounded-[8px] bg-emerald-600 px-4 py-3 text-left font-extrabold text-white disabled:opacity-50"
              >
                Approve
                <span className="block text-xs font-semibold">Approve this claim</span>
              </button>

              <button
                onClick={() => setActiveAction(activeAction === 'REJECT' ? null : 'REJECT')}
                disabled={!reviewActionAvailable}
                className="w-full rounded-[8px] bg-red-600 px-4 py-3 text-left font-extrabold text-white disabled:opacity-50"
              >
                Reject
                <span className="block text-xs font-semibold">Reject this claim</span>
              </button>

              <button
                onClick={() => setActiveAction(activeAction === 'RETURN' ? null : 'RETURN')}
                disabled={!reviewActionAvailable}
                className="w-full rounded-[8px] bg-orange-500 px-4 py-3 text-left font-extrabold text-white disabled:opacity-50"
              >
                Return for Changes
                <span className="block text-xs font-semibold">Send back to applicant for changes</span>
              </button>

              {activeAction && (
                <div className="rounded-[8px] border border-slate-200 p-3">
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={3}
                    placeholder={activeAction === 'REJECT' ? 'Reason for rejection...' : 'Requested changes...'}
                    className="w-full rounded-[8px] border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleStatusTransition(activeAction === 'REJECT' ? 'REJECTED' : 'RETURNED_FOR_CHANGES', comment)}
                    disabled={submittingAction || !comment.trim()}
                    className="mt-3 w-full rounded-[8px] bg-[#07152f] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"
                  >
                    Confirm {activeAction === 'REJECT' ? 'Reject' : 'Return'}
                  </button>
                </div>
              )}

              <button className="w-full rounded-[8px] border border-blue-400 px-4 py-3 text-left font-extrabold text-blue-600">
                Add Internal Note (Optional)
              </button>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-[8px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#10244a]">
              <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
              Review actions will be recorded in the audit trail.
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white font-semibold cursor-pointer transition-colors">
          <ArrowLeft size={18} /> Back to dashboard
        </button>

        <div />
      </div>

      {/* Main Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
                  {claim.category}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {claim.title}
                </h2>
              </div>
              <div>{getStatusBadge(claim.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 dark:border-slate-800/80 py-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-slate-500">
                  <DollarSign size={20} className="text-indigo-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Amount Claimed</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    ${parseFloat(claim.amount as any).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-slate-500">
                  <Calendar size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Date Submitted</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(claim.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2">
                Description / Explanation
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                {claim.description || 'No explanation provided.'}
              </p>
            </div>

            {claim.applicant && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold uppercase">
                  {claim.applicant.name.charAt(0)}
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Submitted By</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {claim.applicant.name} ({claim.applicant.email})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Attachment Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Paperclip size={18} className="text-slate-400" />
              Receipt Attachment
            </h3>

            {claim.attachment ? (
              <div className="flex items-center justify-between border border-slate-100 dark:border-slate-800 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-lg text-indigo-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                      {claim.attachment.fileName}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {formatFileSize(claim.attachment.fileSize)} • {claim.attachment.mimeType}
                    </p>
                  </div>
                </div>

                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${claim.attachment.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 p-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <Download size={16} />
                </a>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-slate-400 text-xs">No receipt attachment uploaded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Timeline & Review Actions */}
        <div className="space-y-6">
          {/* Review Actions Panel (For Reviewers) */}
          {user?.role === 'REVIEWER' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Workflow Actions
              </h3>

              {claim.status === 'SUBMITTED' && (
                <button
                  onClick={() => handleStatusTransition('UNDER_REVIEW')}
                  disabled={submittingAction}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-md text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {submittingAction && <Loader2 size={16} className="animate-spin" />}
                  Start Review
                </button>
              )}

              {claim.status === 'UNDER_REVIEW' && !activeAction && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusTransition('APPROVED')}
                    disabled={submittingAction}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-md text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {submittingAction && <Loader2 size={16} className="animate-spin" />}
                    Approve Claim
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveAction('RETURN')}
                      className="border border-purple-200 hover:border-purple-300 text-purple-700 dark:border-purple-800 dark:text-purple-400 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all hover:bg-purple-50 dark:hover:bg-purple-900/10 text-center"
                    >
                      Return
                    </button>
                    <button
                      onClick={() => setActiveAction('REJECT')}
                      className="border border-rose-200 hover:border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-400 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all hover:bg-rose-50 dark:hover:bg-rose-900/10 text-center"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Reject / Return Form (Requires Comment) */}
              {claim.status === 'UNDER_REVIEW' && activeAction && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                      {activeAction === 'REJECT' ? 'Rejecting Claim' : 'Returning for Changes'}
                    </span>
                    <button
                      onClick={() => {
                        setActiveAction(null);
                        setComment('');
                      }}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Please explain why this claim is being ${activeAction === 'REJECT' ? 'rejected' : 'returned'}...`}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm rounded-xl p-3 outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
                    required
                  />

                  <button
                    onClick={() =>
                      handleStatusTransition(
                        activeAction === 'REJECT' ? 'REJECTED' : 'RETURNED_FOR_CHANGES',
                        comment,
                      )
                    }
                    disabled={submittingAction || !comment.trim()}
                    className={`w-full text-white font-bold py-2.5 rounded-xl text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      activeAction === 'REJECT'
                        ? 'bg-rose-600 hover:bg-rose-500'
                        : 'bg-purple-600 hover:bg-purple-500'
                    } disabled:opacity-50`}
                  >
                    {submittingAction && <Loader2 size={14} className="animate-spin" />}
                    Confirm {activeAction === 'REJECT' ? 'Rejection' : 'Return'}
                  </button>
                </div>
              )}

              {['APPROVED', 'REJECTED', 'RETURNED_FOR_CHANGES'].includes(claim.status) && (
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 text-center">
                  <p className="text-xs text-slate-400">
                    No further review actions are available for this claim in its current status.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Audit History Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              Audit Log Timeline
            </h3>

            {claim.auditLogs && claim.auditLogs.length > 0 ? (
              <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-8">
                {claim.auditLogs.map((log, index) => (
                  <div key={log.id} className="relative">
                    {/* Circle Indicator on vertical timeline */}
                    <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 border border-slate-300 dark:bg-slate-900 dark:border-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                    </span>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {log.newStatus === 'DRAFT' && index === 0 ? 'Draft Created' : `To ${log.newStatus}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-0.5">
                        By {log.user.name} ({log.user.role})
                      </p>

                      {log.comment && (
                        <div className="mt-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/40">
                          <p className="text-xs text-slate-500 dark:text-slate-300 italic">
                            "{log.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs">No audit logs found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal (Applicant Only) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">Edit Expense Claim</h3>
            {editError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-lg mb-4">
                {editError}
              </div>
            )}
            <form onSubmit={handleUpdateClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
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
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
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
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
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
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-lg p-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Receipt File (Optional - Replaces existing)
                </label>
                <input
                  type="file"
                  onChange={(e) => setEditFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingClaim}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer flex items-center gap-2"
                >
                  {updatingClaim && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimDetail;
