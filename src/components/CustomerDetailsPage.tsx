import React, { useState } from 'react';
import { CustomerInfo } from '../types/billing';
import {
  User,
  CreditCard,
  MapPin,
  Calendar,
  IndianRupee,
  Home,
  Building2,
  ArrowRight,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface CustomerDetailsPageProps {
  customer: CustomerInfo;
  onSubmitDetails: (validatedCustomer: CustomerInfo) => void;
  isEditing?: boolean;
}

export const CustomerDetailsPage: React.FC<CustomerDetailsPageProps> = ({
  customer,
  onSubmitDetails,
  isEditing = false,
}) => {
  const [form, setForm] = useState<CustomerInfo>(customer);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const validate = (data: CustomerInfo): Partial<Record<keyof CustomerInfo, string>> => {
    const nextErrors: Partial<Record<keyof CustomerInfo, string>> = {};
    if (!data.name.trim() || data.name.trim().length < 2) {
      nextErrors.name = 'Please enter customer full name (at least 2 characters).';
    }
    if (!data.consumerId.trim()) {
      nextErrors.consumerId = 'Please enter a valid Consumer / Account ID.';
    }
    if (!data.address.trim() || data.address.trim().length < 5) {
      nextErrors.address = 'Please enter the complete service address.';
    }
    if (!data.billingMonth.trim()) {
      nextErrors.billingMonth = 'Please enter billing month & year.';
    }
    if (!data.budget || Number.isNaN(data.budget) || data.budget <= 0) {
      nextErrors.budget = 'Please enter a monthly budget greater than ₹0.';
    }
    return nextErrors;
  };

  const handleFieldChange = <K extends keyof CustomerInfo>(field: K, value: CustomerInfo[K]) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (attemptedSubmit) {
      setErrors(validate(updated));
    }
  };

  const handleFillSample = () => {
    const sample: CustomerInfo = {
      name: 'Arjun Verma',
      consumerId: 'CN-702319',
      address: 'Flat 102, Sunrise Towers, Sector 18',
      category: 'Domestic',
      billingMonth: 'November 2026',
      budget: 2400,
    };
    setForm(sample);
    setErrors({});
  };

  const handleReset = () => {
    setForm({
      name: '',
      consumerId: '',
      address: '',
      category: 'Domestic',
      billingMonth: 'November 2026',
      budget: 0,
    });
    setErrors({});
    setAttemptedSubmit(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onSubmitDetails({
      ...form,
      name: form.name.trim(),
      consumerId: form.consumerId.trim(),
      address: form.address.trim(),
      billingMonth: form.billingMonth.trim(),
    });
  };

  const isFormComplete = Object.keys(validate(form)).length === 0;

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      {/* Step Header Banner */}
      <div className="bg-black rounded-xl p-5 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-cyan-400 mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Step 1 · Required Before Billing Panel Access</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Customer & Account Details
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fill in the consumer account details below to unlock the Bill Calculator, Appliance Audit, Analytics, Tariff Comparison, and Mentor &amp; Student panels.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleFillSample}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-cyan-400 rounded-lg border border-neutral-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fill Sample</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-slate-300 rounded-lg border border-neutral-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Clear all fields"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Customer & Account Details Form Card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-black rounded-xl p-6 border border-neutral-800 space-y-6"
      >
        {/* Account Fields */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 border-b border-neutral-800 pb-2">
            Account Holder & Billing Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Customer Name */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Customer Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g. Arjun Verma"
                  className={`w-full bg-black border rounded-lg pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none font-medium transition ${
                    errors.name
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-neutral-800 focus:border-cyan-500'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Consumer / Account ID */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Consumer / Account ID <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={form.consumerId}
                  onChange={(e) => handleFieldChange('consumerId', e.target.value)}
                  placeholder="e.g. CN-702319"
                  className={`w-full bg-black border rounded-lg pl-9 pr-3 py-2.5 text-slate-100 font-mono focus:outline-none transition ${
                    errors.consumerId
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-neutral-800 focus:border-cyan-500'
                  }`}
                />
              </div>
              {errors.consumerId && (
                <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.consumerId}</span>
                </p>
              )}
            </div>

            {/* Service Address */}
            <div className="md:col-span-2">
              <label className="block text-slate-300 font-medium mb-1.5">
                Service Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  placeholder="e.g. Flat 102, Sunrise Towers, Sector 18"
                  className={`w-full bg-black border rounded-lg pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none transition ${
                    errors.address
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-neutral-800 focus:border-cyan-500'
                  }`}
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.address}</span>
                </p>
              )}
            </div>

            {/* Billing Month & Year */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Billing Month & Year <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={form.billingMonth}
                  onChange={(e) => handleFieldChange('billingMonth', e.target.value)}
                  placeholder="e.g. November 2026"
                  className={`w-full bg-black border rounded-lg pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none transition ${
                    errors.billingMonth
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-neutral-800 focus:border-cyan-500'
                  }`}
                />
              </div>
              {errors.billingMonth && (
                <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.billingMonth}</span>
                </p>
              )}
            </div>

            {/* Monthly Budget Limit */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Monthly Budget Limit (₹ INR) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="1"
                  value={form.budget || ''}
                  onChange={(e) => handleFieldChange('budget', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 2400"
                  className={`w-full bg-black border rounded-lg pl-9 pr-3 py-2.5 text-slate-100 font-mono focus:outline-none transition ${
                    errors.budget
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-neutral-800 focus:border-cyan-500'
                  }`}
                />
              </div>
              {errors.budget && (
                <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.budget}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Consumer Category Selection */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-200 border-b border-neutral-800 pb-2">
            Consumer Category
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => handleFieldChange('category', 'Domestic')}
              className={`p-4 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                form.category === 'Domestic'
                  ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200'
                  : 'bg-black border-neutral-800 text-slate-400 hover:border-neutral-700'
              }`}
            >
              <Home className={`w-5 h-5 mt-0.5 ${form.category === 'Domestic' ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold text-slate-100 text-sm">Domestic Connection</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Residential homes, flats, apartments with tiered domestic slabs
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleFieldChange('category', 'Commercial')}
              className={`p-4 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                form.category === 'Commercial'
                  ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200'
                  : 'bg-black border-neutral-800 text-slate-400 hover:border-neutral-700'
              }`}
            >
              <Building2 className={`w-5 h-5 mt-0.5 ${form.category === 'Commercial' ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold text-slate-100 text-sm">Commercial Connection</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Shops, offices, clinics, commercial establishments
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Submit & Gate Notice */}
        <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {isFormComplete ? (
              <span className="text-emerald-400 font-medium">
                All required account fields are filled. Ready to proceed.
              </span>
            ) : (
              <span>
                Complete all <span className="text-rose-400">*</span> required fields to unlock the billing & analytics panels.
              </span>
            )}
          </div>

          <button
            type="submit"
            className={`px-6 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              isFormComplete
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
                : 'bg-neutral-900 hover:bg-neutral-800 text-slate-300 border border-neutral-700'
            }`}
          >
            <span>{isEditing ? 'Save Details & Open Billing Panel' : 'Continue to Billing Panel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
