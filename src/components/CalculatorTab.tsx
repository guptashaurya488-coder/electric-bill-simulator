import React, { useState, useEffect } from 'react';
import { CustomerInfo, MeterData, CalculationResult } from '../types/billing';
import { Calculator, Save, AlertTriangle, CheckCircle2, Pencil, UserCheck, CheckCircle, Clock } from 'lucide-react';

interface CalculatorTabProps {
  customer: CustomerInfo;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  meter: MeterData;
  setMeter: React.Dispatch<React.SetStateAction<MeterData>>;
  tariffPlan: string;
  setTariffPlan: (plan: string) => void;
  onCalculate: () => void;
  onSaveRecord: () => void;
  onTogglePaymentStatus: () => void;
  onBudgetChange: (newBudget: number) => void;
  isCalculating: boolean;
  isSaving: boolean;
  saveMessage: string | null;
  result: CalculationResult | null;
  onEditCustomer: () => void;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  customer,
  setCustomer,
  meter,
  setMeter,
  tariffPlan,
  setTariffPlan,
  onCalculate,
  onSaveRecord,
  onTogglePaymentStatus,
  onBudgetChange,
  isCalculating,
  isSaving,
  saveMessage,
  result,
  onEditCustomer,
}) => {
  const [directUnitsInput, setDirectUnitsInput] = useState<string>(
    meter.unitsConsumed >= 0 ? meter.unitsConsumed.toFixed(1) : '350'
  );

  useEffect(() => {
    setDirectUnitsInput(meter.unitsConsumed.toFixed(1));
  }, [meter.unitsConsumed]);

  const currencySymbol = '₹';

  // Calculate live units if using readings
  const calculatedUnits = meter.currReading >= meter.prevReading
    ? meter.currReading - meter.prevReading
    : (100000 - meter.prevReading) + meter.currReading;

  const currentDisplayUnits = meter.isDirectUnits
    ? (parseFloat(directUnitsInput) || 0)
    : calculatedUnits;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-black rounded-xl p-4 border border-neutral-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            Electricity Billing Parameters & Meter Inputs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Backend powered by modular C structs, slab calculators, and file storage.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Verified Customer & Account Summary Card */}
          <div className="bg-black rounded-xl p-5 border border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>1. Customer & Account Details</span>
              </h3>
              <button
                type="button"
                onClick={onEditCustomer}
                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-cyan-400 rounded border border-neutral-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit Details</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-black p-3 rounded-lg border border-neutral-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Customer Name</span>
                <span className="font-semibold text-slate-100 mt-0.5 block">{customer.name}</span>
              </div>
              <div className="bg-black p-3 rounded-lg border border-neutral-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Consumer / Account ID</span>
                <span className="font-mono font-semibold text-cyan-400 mt-0.5 block">{customer.consumerId}</span>
              </div>
              <div className="bg-black p-3 rounded-lg border border-neutral-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Billing Month</span>
                <span className="font-semibold text-slate-100 mt-0.5 block">{customer.billingMonth}</span>
              </div>
              <div className="bg-black p-3 rounded-lg border border-neutral-800 sm:col-span-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Service Address</span>
                <span className="text-slate-200 mt-0.5 block">{customer.address}</span>
              </div>
              <div className="bg-black p-3 rounded-lg border border-neutral-800">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                  Monthly Budget Limit ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="1"
                  value={customer.budget || ''}
                  onChange={(e) => onBudgetChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-neutral-700 rounded px-2 py-1 font-mono font-semibold text-emerald-400 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Category & Tariff Selection */}
          <div className="bg-black rounded-xl p-5 border border-neutral-800 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-neutral-800 pb-2">
              2. Consumer Category & Tariff Plan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Category */}
              <div>
                <label className="block text-slate-400 font-medium mb-2">Consumer Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomer({ ...customer, category: 'Domestic' });
                      setTariffPlan('Standard');
                    }}
                    className={`p-3 rounded-lg border text-left transition ${
                      customer.category === 'Domestic'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                        : 'bg-black border-neutral-800 text-slate-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-100">Domestic</div>
                    <div className="text-[11px] text-slate-400 mt-1">Residential homes, apartments</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomer({ ...customer, category: 'Commercial' });
                      setTariffPlan('Standard');
                    }}
                    className={`p-3 rounded-lg border text-left transition ${
                      customer.category === 'Commercial'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                        : 'bg-black border-neutral-800 text-slate-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-100">Commercial</div>
                    <div className="text-[11px] text-slate-400 mt-1">Shops, offices, commercial stores</div>
                  </button>
                </div>
              </div>

              {/* Tariff Plan */}
              <div>
                <label className="block text-slate-400 font-medium mb-2">Selected Tariff Plan</label>
                <select
                  value={tariffPlan}
                  onChange={(e) => setTariffPlan(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 text-xs font-medium"
                >
                  {customer.category === 'Domestic' ? (
                    <>
                      <option value="Standard">Standard Domestic (Tiered Slabs)</option>
                      <option value="Eco Green">Eco Green (Clean Energy Discount 5%)</option>
                      <option value="Time of Use">Time-of-Use (Peak / Off-Peak Differential)</option>
                    </>
                  ) : (
                    <>
                      <option value="Standard">Commercial Standard</option>
                      <option value="Eco Green">Eco Green (Clean Energy Discount 5%)</option>
                      <option value="High Demand">Commercial High Demand (Bulk Commercial)</option>
                    </>
                  )}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Rates configured in C backend <code className="text-cyan-400 font-mono">billing.c</code>
                </p>
              </div>
            </div>
          </div>

          {/* 3. Meter Readings & Units */}
          <div className="bg-black rounded-xl p-5 border border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="text-sm font-semibold text-slate-200">
                3. Electricity Meter Readings & Unit Computation
              </h3>
              {/* Toggle Direct Entry */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Mode:</span>
                <button
                  type="button"
                  onClick={() => setMeter(prev => ({ ...prev, isDirectUnits: false }))}
                  className={`px-2 py-1 rounded text-xs transition ${
                    !meter.isDirectUnits ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Meter Dial Readings
                </button>
                <button
                  type="button"
                  onClick={() => setMeter(prev => ({ ...prev, isDirectUnits: true }))}
                  className={`px-2 py-1 rounded text-xs transition ${
                    meter.isDirectUnits ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Direct Units (kWh)
                </button>
              </div>
            </div>

            {!meter.isDirectUnits ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Previous Meter Reading (kWh)</label>
                  <input
                    type="number"
                    value={meter.prevReading}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setMeter(prev => ({ ...prev, prevReading: val, unitsConsumed: Math.max(0, prev.currReading - val) }));
                    }}
                    className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500">Last billing cycle dial digits</span>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Current Meter Reading (kWh)</label>
                  <input
                    type="number"
                    value={meter.currReading}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setMeter(prev => ({ ...prev, currReading: val, unitsConsumed: Math.max(0, val - prev.prevReading) }));
                    }}
                    className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500">Present meter dial digits</span>
                </div>

                <div className="bg-black rounded-lg p-3 border border-neutral-800 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Calculated Units</span>
                  <div className="flex items-baseline space-x-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-cyan-400">
                      {calculatedUnits.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">kWh</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">Formula: Current - Previous Reading</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <label className="block text-slate-400 font-medium">Direct Electricity Consumption Units (kWh)</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={directUnitsInput}
                    onChange={(e) => {
                      setDirectUnitsInput(e.target.value);
                      const parsed = parseFloat(e.target.value) || 0;
                      setMeter(prev => ({ ...prev, unitsConsumed: parsed }));
                    }}
                    placeholder="e.g. 350"
                    className="w-48 bg-black border border-neutral-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-slate-400 text-xs">Total units consumed in this billing cycle</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={isCalculating}
              onClick={onCalculate}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-md transition flex items-center space-x-2 disabled:opacity-50 text-sm cursor-pointer"
            >
              {isCalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing in C Engine...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>Calculate Electricity Bill (C Engine)</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSaving || !result || result.bill.paymentStatus !== 'Paid'}
              onClick={onSaveRecord}
              title={
                result && result.bill.paymentStatus !== 'Paid'
                  ? 'Mark bill as Paid first to save it to the ledger'
                  : 'Save paid bill to C database'
              }
              className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 text-slate-200 font-semibold rounded-lg border border-neutral-700 transition flex items-center space-x-2 disabled:opacity-40 text-sm cursor-pointer"
            >
              {isSaving ? (
                <span>Writing to C files...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Paid Bill to Ledger</span>
                </>
              )}
            </button>

            {result && result.bill.paymentStatus !== 'Paid' && (
              <span className="text-[11px] text-amber-400">
                Mark bill as Paid in Summary to add to ledger
              </span>
            )}

            {saveMessage && (
              <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Instant Live Summary & Slabs Overview */}
        <div className="space-y-6">
          {/* Bill Summary Card */}
          <div className="bg-black rounded-xl p-5 border border-neutral-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Bill Calculation Summary</span>
              {result && (
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {result.bill.billId}
                </span>
              )}
            </div>

            {result ? (
              <div className="space-y-3 text-xs">
                {/* Total Units */}
                <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                  <span className="text-slate-400">Total Units Billed:</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">
                    {result.bill.meter.unitsConsumed.toFixed(1)} kWh
                  </span>
                </div>

                {/* Energy Charges */}
                <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                  <span className="text-slate-400">Energy Charges:</span>
                  <span className="font-mono text-slate-200">
                    {currencySymbol}{result.bill.charges.energyCharges.toFixed(2)}
                  </span>
                </div>

                {/* Fixed Charges */}
                <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                  <span className="text-slate-400">Fixed Demand Charge:</span>
                  <span className="font-mono text-slate-200">
                    {currencySymbol}{result.bill.charges.fixedCharges.toFixed(2)}
                  </span>
                </div>

                {/* Taxes & Surcharges */}
                <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                  <span className="text-slate-400">Taxes, Duty & Surcharges:</span>
                  <span className="font-mono text-slate-200">
                    +{currencySymbol}
                    {(
                      result.bill.charges.regulatorySurcharge +
                      result.bill.charges.electricityDuty +
                      result.bill.charges.fuelSurcharge
                    ).toFixed(2)}
                  </span>
                </div>

                {/* Rebate */}
                {result.bill.charges.greenRebate > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-neutral-800 text-emerald-400">
                    <span>Rebate / Eco Discount:</span>
                    <span className="font-mono">
                      -{currencySymbol}{result.bill.charges.greenRebate.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Net Total Payable */}
                <div className="bg-black p-3 rounded-lg border border-cyan-800/60 mt-3">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Net Total Payable</div>
                  <div className="text-2xl font-bold font-mono text-cyan-400 mt-0.5">
                    {currencySymbol}{result.bill.charges.totalPayable.toFixed(2)}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-neutral-800">
                    <span>Due Date: {result.bill.dueDate}</span>
                    <span
                      className={`font-semibold ${
                        result.bill.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {result.bill.paymentStatus}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onTogglePaymentStatus}
                    className={`w-full mt-3 py-2 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      result.bill.paymentStatus === 'Paid'
                        ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700'
                        : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-600'
                    }`}
                  >
                    {result.bill.paymentStatus === 'Paid' ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Paid (Click to Mark Unpaid)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Bill as Paid</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                Click "Calculate Electricity Bill" above to run the C engine calculation.
              </div>
            )}
          </div>

          {/* Budget & Anomaly Notification Snippet */}
          {result && (
            <div className="space-y-3">
              {/* Budget Monitor Snippet */}
              <div
                className={`p-3 rounded-xl border text-xs ${
                  result.budgetAlert.isOverBudget
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                    : result.budgetAlert.alertLevel === 'CAUTION'
                    ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                    : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Budget Monitor ({result.budgetAlert.alertLevel})</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  {result.budgetAlert.message}
                </p>
              </div>

              {/* Anomaly Snippet if detected */}
              {result.anomaly.isAnomaly && (
                <div className="p-3 rounded-xl border bg-orange-950/40 border-orange-800 text-orange-200 text-xs">
                  <div className="flex items-center space-x-2 font-semibold text-orange-300">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Usage Anomaly Detected ({result.anomaly.severity})</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                    {result.anomaly.reason}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Slabs Rate Card Reference */}
          {result && (
            <div className="bg-black rounded-xl p-4 border border-neutral-800 text-xs space-y-2">
              <span className="font-semibold text-slate-300">Active Tariff Slabs Breakdown:</span>
              <div className="space-y-1.5">
                {result.bill.slabs.map((slab, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] bg-black px-2.5 py-1 rounded border border-neutral-800">
                    <span className="text-slate-400">{slab.label}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-cyan-400">{currencySymbol}{slab.rate.toFixed(2)}/u</span>
                      <span className="text-slate-500">·</span>
                      <span className="font-mono text-slate-300">{slab.unitsInSlab.toFixed(1)} u</span>
                      <span className="text-slate-500">·</span>
                      <span className="font-mono text-slate-200 font-semibold">{currencySymbol}{slab.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
