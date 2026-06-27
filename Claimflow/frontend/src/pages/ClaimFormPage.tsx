import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  FileText,
  Fuel,
  Loader2,
  Monitor,
  MoreHorizontal,
  Plane,
  Utensils,
  UploadCloud,
  Wifi,
  X,
} from 'lucide-react';
import api from '../utils/api';

interface ClaimFormPageProps {
  onCancel: () => void;
  onSaved: () => void;
}

const categoryOptions = [
  { value: 'TRAVEL', label: 'Travel', icon: Plane },
  { value: 'FUEL', label: 'Fuel', icon: Fuel },
  { value: 'INTERNET', label: 'Internet', icon: Wifi },
  { value: 'MEALS', label: 'Meals', icon: Utensils },
  { value: 'EQUIPMENT', label: 'Equipment', icon: Monitor },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal },
];

const currencyOptions = ['USD', 'AUD', 'GBP', 'EUR', 'CAD', 'ZMW', 'ZAR', 'JPY'];

const today = () => new Date().toISOString().slice(0, 10);

const ClaimFormPage: React.FC<ClaimFormPageProps> = ({ onCancel, onSaved }) => {
  const [title, setTitle] = useState('Flight to Nairobi');
  const [category, setCategory] = useState('TRAVEL');
  const [description, setDescription] = useState('Flight to Nairobi for client meeting.');
  const [amount, setAmount] = useState('450.00');
  const [currency, setCurrency] = useState('USD');
  const [expenseDate, setExpenseDate] = useState(today());
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const saveClaim = async (submitAfterCreate: boolean) => {
    if (!title.trim() || !category || !amount || !currency || !expenseDate) {
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
      formData.append('currency', currency);
      formData.append('expenseDate', expenseDate);
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

  const selectedCategory = categoryOptions.find((option) => option.value === category) || categoryOptions[0];
  const SelectedCategoryIcon = selectedCategory.icon;

  return (
    <div>
      <section className="rounded-[8px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row">
          <div className="body-text text-[#33476b]">
            Claim Status: <span className="status-badge rounded-[6px] bg-blue-100 px-3 py-1 text-blue-700">DRAFT</span>
          </div>
          <div className="body-text text-[#33476b]">Last saved: 12 May 2024, 10:30 AM</div>
        </div>

        {error && <div className="small-text mb-6 rounded-[8px] border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        <div className="grid gap-x-7 gap-y-7 lg:grid-cols-2">
          <label className="block">
            <span className="body-text">Title <span className="text-red-500">*</span></span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="body-text mt-3 h-[52px] w-full rounded-[8px] border border-slate-300 px-5 outline-none focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="body-text">Category <span className="text-red-500">*</span></span>
            <div className="relative mt-3">
              <SelectedCategoryIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600" size={27} />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="body-text h-[52px] w-full appearance-none rounded-[8px] border border-slate-300 bg-white px-16 outline-none focus:border-blue-500"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[#33476b]" size={22} />
            </div>
          </label>

          <label className="block lg:col-span-2">
            <span className="body-text">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              maxLength={500}
              className="body-text mt-3 h-[132px] w-full rounded-[8px] border border-slate-300 p-5 outline-none focus:border-blue-500"
            />
            <span className="helper-text float-right -mt-8 mr-5 text-[#33476b]">{description.length}/500</span>
          </label>

          <label className="block">
            <span className="body-text">Amount <span className="text-red-500">*</span></span>
            <div className="body-text mt-3 flex h-[52px] rounded-[8px] border border-slate-300">
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className="w-28 rounded-l-[8px] border-r border-slate-300 bg-slate-50 px-4 outline-none"
              >
                {currencyOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="min-w-0 flex-1 px-5 outline-none"
              />
            </div>
            <p className="helper-text mt-2 text-[#33476b]">Choose a currency and enter the amount to be reimbursed.</p>
          </label>

          <label className="block">
            <span className="body-text">Date of Expense <span className="text-red-500">*</span></span>
            <div className="body-text relative mt-3 flex h-[52px] items-center rounded-[8px] border border-slate-300 px-5">
              <Calendar size={22} className="pointer-events-none absolute left-5 text-[#33476b]" />
              <input
                type="date"
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.target.value)}
                className="h-full w-full bg-transparent pl-10 pr-3 outline-none"
              />
            </div>
            <p className="helper-text mt-2 text-[#33476b]">Select the date the expense happened.</p>
          </label>
        </div>

        <div className="mt-7">
          <span className="body-text">Attachment <span className="text-[#33476b]">(Optional)</span></span>
          <label className="mt-3 flex min-h-[116px] w-full max-w-[920px] cursor-pointer flex-col items-center justify-between gap-5 rounded-[8px] border border-dashed border-blue-500 p-4 lg:flex-row">
            <input className="hidden" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            {file && (
              <div className="flex min-w-0 flex-1 items-center gap-4 rounded-[8px] border border-slate-200 bg-slate-50 p-4">
                <FileText className="text-red-600" size={34} />
                <div className="min-w-0">
                  <div className="card-title truncate">{file.name}</div>
                  <div className="helper-text text-[#33476b]">{Math.ceil(file.size / 1024)} KB</div>
                </div>
                <X className="ml-auto text-[#07152f]" size={24} onClick={(event) => { event.preventDefault(); setFile(null); }} />
              </div>
            )}
            <div className="flex min-w-[240px] flex-1 items-center justify-center gap-4 text-center">
              <UploadCloud size={38} className="text-blue-600" />
              <div>
                <div className="button-text text-blue-600">Click to upload</div>
                <div className="helper-text text-[#33476b]">PDF, JPG, PNG (Max. 5MB)</div>
              </div>
            </div>
          </label>
          <p className="helper-text mt-3 text-[#33476b]">Attach receipts or supporting documents (optional).</p>
        </div>

        <div className="mt-10 flex flex-col justify-end gap-6 sm:flex-row">
          <button onClick={onCancel} className="button-text h-12 min-w-[136px] rounded-[8px] border border-slate-300 px-8">
            Cancel
          </button>
          <button onClick={() => saveClaim(false)} disabled={submitting} className="button-text h-12 min-w-[168px] rounded-[8px] border border-slate-300 px-8">
            Save as Draft
          </button>
          <button
            onClick={() => saveClaim(true)}
            disabled={submitting}
            className="button-text flex h-12 min-w-[168px] items-center justify-center gap-2 rounded-[8px] bg-blue-600 px-8 text-white"
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
