import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  FileText,
  Loader2,
  Plane,
  UploadCloud,
  X,
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface ClaimFormPageProps {
  onCancel: () => void;
  onSaved: () => void;
}

const ClaimFormPage: React.FC<ClaimFormPageProps> = ({ onCancel, onSaved }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('Flight to Nairobi');
  const [category, setCategory] = useState('TRAVEL');
  const [description, setDescription] = useState('Flight to Nairobi for client meeting.');
  const [amount, setAmount] = useState('450.00');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const saveClaim = async (submitAfterCreate: boolean) => {
    if (!title.trim() || !category || !amount) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('amount', amount);
      if (file) formData.append('file', file);

      const response = await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (submitAfterCreate) {
        await api.post(`/applications/${response.data.id}/submit`);
      }

      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <nav className="-mx-5 -mt-8 mb-9 flex min-h-[116px] items-center justify-between gap-6 border-b border-slate-200 bg-white px-5 py-6 shadow-sm sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-[#07152f]">Create / Edit Claim</h1>
          <p className="mt-3 text-[17px] text-[#33476b]">Fill in the details below to create a new claim or update your draft.</p>
        </div>
        <div className="hidden items-center gap-4 lg:flex">
          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-blue-600 text-white">
            <span className="text-lg font-extrabold">{user?.name.charAt(0)}</span>
          </div>
          <div>
            <div className="text-[18px] font-extrabold leading-tight">{user?.name}</div>
            <div className="text-[17px] text-[#33476b]">Applicant</div>
          </div>
          <ChevronDown size={20} className="text-[#33476b]" />
        </div>
      </nav>

      <section className="rounded-[8px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row">
          <div className="text-[20px] text-[#33476b]">
            Claim Status: <span className="rounded-[6px] bg-blue-100 px-3 py-1 font-extrabold text-blue-700">DRAFT</span>
          </div>
          <div className="text-[19px] text-[#33476b]">Last saved: 12 May 2024, 10:30 AM</div>
        </div>

        {error && <div className="mb-6 rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

        <div className="grid gap-x-7 gap-y-7 lg:grid-cols-2">
          <label className="block">
            <span className="text-base font-extrabold">Title <span className="text-red-500">*</span></span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-3 h-[52px] w-full rounded-[8px] border border-slate-300 px-5 text-[20px] outline-none focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-base font-extrabold">Category <span className="text-red-500">*</span></span>
            <div className="relative mt-3">
              <Plane className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600" size={27} />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-[52px] w-full appearance-none rounded-[8px] border border-slate-300 bg-white px-16 text-[20px] outline-none focus:border-blue-500"
              >
                <option value="TRAVEL">Travel</option>
                <option value="FUEL">Fuel</option>
                <option value="INTERNET">Internet</option>
                <option value="MEALS">Meals</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="OTHER">Other</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[#33476b]" size={22} />
            </div>
          </label>

          <label className="block lg:col-span-2">
            <span className="text-base font-extrabold">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              maxLength={500}
              className="mt-3 h-[132px] w-full rounded-[8px] border border-slate-300 p-5 text-[20px] outline-none focus:border-blue-500"
            />
            <span className="float-right -mt-8 mr-5 text-sm text-[#33476b]">{description.length}/500</span>
          </label>

          <label className="block">
            <span className="text-base font-extrabold">Amount <span className="text-red-500">*</span></span>
            <div className="mt-3 flex h-[52px] rounded-[8px] border border-slate-300 text-[20px]">
              <span className="flex w-24 items-center justify-center border-r border-slate-300 bg-slate-50">USD</span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="min-w-0 flex-1 px-5 outline-none"
              />
            </div>
            <p className="mt-2 text-[15px] text-[#33476b]">Enter the total amount to be reimbursed.</p>
          </label>

          <label className="block">
            <span className="text-base font-extrabold">Date of Expense <span className="text-red-500">*</span></span>
            <div className="mt-3 flex h-[52px] items-center justify-between gap-4 rounded-[8px] border border-slate-300 px-5 text-[20px]">
              <span className="flex items-center gap-4">
              <Calendar size={24} className="text-[#33476b]" />
              10 May 2024
              </span>
              <Calendar size={24} className="text-[#33476b]" />
            </div>
          </label>
        </div>

        <div className="mt-7">
          <span className="text-base font-extrabold">Attachment <span className="font-normal text-[#33476b]">(Optional)</span></span>
          <label className="mt-3 flex min-h-[116px] w-full max-w-[920px] cursor-pointer flex-col items-center justify-between gap-5 rounded-[8px] border border-dashed border-blue-500 p-4 lg:flex-row">
            <input className="hidden" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            <div className="flex min-w-0 flex-1 items-center gap-4 rounded-[8px] border border-slate-200 bg-slate-50 p-4">
              <FileText className="text-red-600" size={34} />
              <div className="min-w-0">
                <div className="truncate text-lg font-extrabold">{file?.name || 'receipt.pdf'}</div>
                <div className="text-sm text-[#33476b]">{file ? `${Math.ceil(file.size / 1024)} KB` : '123 KB'}</div>
              </div>
              <X className="ml-auto text-[#07152f]" size={24} onClick={(event) => { event.preventDefault(); setFile(null); }} />
            </div>
            <div className="flex min-w-[240px] items-center justify-center gap-4 text-center">
              <UploadCloud size={38} className="text-blue-600" />
              <div>
                <div className="font-extrabold text-blue-600">Click to upload</div>
                <div className="text-sm text-[#33476b]">PDF, JPG, PNG (Max. 5MB)</div>
              </div>
            </div>
          </label>
          <p className="mt-3 text-[15px] text-[#33476b]">Attach receipts or supporting documents (optional).</p>
        </div>

        <div className="mt-10 flex flex-col justify-end gap-6 sm:flex-row">
          <button onClick={onCancel} className="h-12 min-w-[136px] rounded-[8px] border border-slate-300 px-8 text-[17px] font-extrabold">
            Cancel
          </button>
          <button onClick={() => saveClaim(false)} disabled={submitting} className="h-12 min-w-[168px] rounded-[8px] border border-slate-300 px-8 text-[17px] font-extrabold">
            Save as Draft
          </button>
          <button
            onClick={() => saveClaim(true)}
            disabled={submitting}
            className="flex h-12 min-w-[168px] items-center justify-center gap-2 rounded-[8px] bg-blue-600 px-8 text-[17px] font-extrabold text-white"
          >
            {submitting && <Loader2 className="animate-spin" size={20} />}
            Submit Claim
          </button>
        </div>
      </section>
    </div>
  );
};

export default ClaimFormPage;
