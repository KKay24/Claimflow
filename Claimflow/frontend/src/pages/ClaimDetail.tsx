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
  CornerUpLeft,
  Edit2,
  Send,
  Loader2,
  Paperclip,
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
        return <span className={base + "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"}>Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className={base + "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}>Under Review</span>;
      case 'APPROVED':
        return <span className={base + "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"}>Approved</span>;
      case 'REJECTED':
        return <span className={base + "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"}>Rejected</span>;
      case 'RETURNED_FOR_CHANGES':
        return <span className={base + "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"}>Returned for Changes</span>;
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white font-semibold cursor-pointer transition-colors">
          <ArrowLeft size={18} /> Back to dashboard
        </button>

        <div className="flex items-center gap-3">
          {claim.status === 'DRAFT' && user?.role === 'APPLICANT' && (
            <button
              onClick={openEditModal}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <Edit2 size={16} /> Edit Draft
            </button>
          )}

          {claim.status === 'DRAFT' && user?.role === 'APPLICANT' && (
            <button
              onClick={() => handleStatusTransition('SUBMITTED')}
              disabled={submittingAction}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {submittingAction ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Submit Claim
            </button>
          )}

          {claim.status === 'RETURNED_FOR_CHANGES' && user?.role === 'APPLICANT' && (
            <button
              onClick={() => handleStatusTransition('DRAFT')}
              disabled={submittingAction}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-purple-600/10 hover:shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {submittingAction ? <Loader2 size={16} className="animate-spin" /> : <CornerUpLeft size={16} />}
              Move to Draft to Edit
            </button>
          )}
        </div>
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
