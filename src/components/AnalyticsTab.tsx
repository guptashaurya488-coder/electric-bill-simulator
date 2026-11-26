import React, { useState } from 'react';
import { MonthlyRecord, PredictionResult, BudgetAlert, AnomalyWarning, BillBreakdown } from '../types/billing';
import { TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, BarChart3, Target, Trash2 } from 'lucide-react';

interface AnalyticsTabProps {
  history: MonthlyRecord[];
  prediction: PredictionResult | null;
  budgetAlert: BudgetAlert | null;
  anomaly: AnomalyWarning | null;
  currentBill: BillBreakdown | null;
  budget: number;
  onBudgetChange: (newBudget: number) => void;
  onDeleteRecord?: (billId: string, rowIndex: number) => Promise<void> | void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  history,
  prediction,
  budgetAlert,
  anomaly,
  currentBill,
  budget,
  onBudgetChange,
  onDeleteRecord,
}) => {
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const currencySymbol = '₹';

  // Compare current month vs last month
  const lastRecord = history.length > 0 ? history[history.length - 1] : null;
  const currentUnits = currentBill ? currentBill.meter.unitsConsumed : (lastRecord ? lastRecord.units : 0);
  const currentAmount = currentBill ? currentBill.charges.totalPayable : (lastRecord ? lastRecord.amount : 0);

  const prevUnits = lastRecord ? lastRecord.units : 0;
  const prevAmount = lastRecord ? lastRecord.amount : 0;

  const unitDiff = currentUnits - prevUnits;
  const unitDiffPct = prevUnits > 0 ? (unitDiff / prevUnits) * 100 : 0;

  const amountDiff = currentAmount - prevAmount;
  const amountDiffPct = prevAmount > 0 ? (amountDiff / prevAmount) * 100 : 0;

  // Chart data: August, September, October, November (Forecast), December (Forecast) + any additional paid records
  const refUnits = currentUnits > 0 ? currentUnits : (prediction?.predictedUnits || 350);
  const avgRate = currentUnits > 0 && currentAmount > 0 ? currentAmount / currentUnits : 6.93;

  const findMonthRecord = (prefix: string) =>
    history.find(h => h.month.toLowerCase().startsWith(prefix.toLowerCase()));

  const augRec = findMonthRecord('aug');
  const sepRec = findMonthRecord('sep');
  const octRec = findMonthRecord('oct');
  const novRec = findMonthRecord('nov');

  const chartItems: Array<{
    label: string;
    units: number;
    amount: number;
    isPredicted: boolean;
    subtitle: string;
  }> = [
    {
      label: 'August',
      units: augRec ? augRec.units : Math.round(refUnits * 0.96),
      amount: augRec ? augRec.amount : Math.round(refUnits * 0.96 * avgRate),
      isPredicted: false,
      subtitle: augRec ? 'Paid Actual' : 'Est. Baseline',
    },
    {
      label: 'September',
      units: sepRec ? sepRec.units : Math.round(refUnits * 0.87),
      amount: sepRec ? sepRec.amount : Math.round(refUnits * 0.87 * avgRate),
      isPredicted: false,
      subtitle: sepRec ? 'Paid Actual' : 'Est. Baseline',
    },
    {
      label: 'October',
      units: octRec ? octRec.units : Math.round(refUnits * 0.92),
      amount: octRec ? octRec.amount : Math.round(refUnits * 0.92 * avgRate),
      isPredicted: false,
      subtitle: octRec ? 'Paid Actual' : 'Est. Baseline',
    },
    {
      label: novRec ? 'November' : 'Nov (Forecast)',
      units: novRec ? novRec.units : currentUnits,
      amount: novRec ? novRec.amount : currentAmount,
      isPredicted: !novRec,
      subtitle: novRec ? 'Paid Actual' : 'November Forecast',
    },
  ];

  if (prediction) {
    chartItems.push({
      label: 'Dec (Forecast)',
      units: prediction.predictedUnits,
      amount: prediction.predictedAmount,
      isPredicted: true,
      subtitle: 'December Forecast',
    });
  }

  // Include any other paid months recorded in history (excluding Aug-Nov already plotted)
  history.forEach(h => {
    const m = h.month.toLowerCase();
    if (!m.startsWith('aug') && !m.startsWith('sep') && !m.startsWith('oct') && !m.startsWith('nov')) {
      chartItems.push({
        label: h.month.split(' ')[0],
        units: h.units,
        amount: h.amount,
        isPredicted: false,
        subtitle: 'Paid Actual',
      });
    }
  });

  const maxUnits = Math.max(...chartItems.map(c => c.units), 400);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-black rounded-xl p-4 border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Consumption Trends, Predictive Forecasting & Budget Monitoring
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical regression models and anomaly detection powered by C backend (<code className="text-cyan-400 font-mono">prediction.c</code> & <code className="text-cyan-400 font-mono">history.c</code>).
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Model Engine:</span>
          <span className="px-2.5 py-1 rounded bg-black border border-neutral-800 text-cyan-300 font-mono text-[11px]">
            Least-Squares Regression + 3M Moving Avg
          </span>
        </div>
      </div>

      {/* Top Row: Key Metrics & Month-over-Month Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Current Month Units */}
        <div className="bg-black p-4 rounded-xl border border-neutral-800 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Current Month Usage</span>
          <div className="text-2xl font-bold font-mono text-cyan-400">{currentUnits.toFixed(1)} kWh</div>
          <div className="flex items-center space-x-1 text-[11px] pt-1">
            {history.length === 0 ? (
              <span className="text-slate-500">No prior paid bill</span>
            ) : unitDiff >= 0 ? (
              <span className="text-rose-400 font-medium flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                +{unitDiff.toFixed(1)} kWh (+{unitDiffPct.toFixed(1)}%)
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                {unitDiff.toFixed(1)} kWh ({unitDiffPct.toFixed(1)}%)
              </span>
            )}
            {history.length > 0 && <span className="text-slate-500">vs last month</span>}
          </div>
        </div>

        {/* Current Month Bill */}
        <div className="bg-black p-4 rounded-xl border border-neutral-800 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Current Month Bill</span>
          <div className="text-2xl font-bold font-mono text-slate-100">{currencySymbol}{currentAmount.toFixed(2)}</div>
          <div className="flex items-center space-x-1 text-[11px] pt-1">
            {history.length === 0 ? (
              <span className="text-slate-500">No prior paid bill</span>
            ) : amountDiff >= 0 ? (
              <span className="text-rose-400 font-medium flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                +{currencySymbol}{amountDiff.toFixed(2)} (+{amountDiffPct.toFixed(1)}%)
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                -{currencySymbol}{Math.abs(amountDiff).toFixed(2)} ({amountDiffPct.toFixed(1)}%)
              </span>
            )}
            {history.length > 0 && <span className="text-slate-500">vs last month</span>}
          </div>
        </div>

        {/* 3-Month Moving Average */}
        <div className="bg-black p-4 rounded-xl border border-neutral-800 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">3-Month Moving Baseline</span>
          <div className="text-2xl font-bold font-mono text-slate-300">
            {prediction && history.length > 0 ? `${prediction.avg3mUnits.toFixed(1)} kWh` : '—'}
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            {history.length > 0 ? 'Rolling historical average baseline' : 'No paid history recorded yet'}
          </p>
        </div>

        {/* Next Month Predicted Bill */}
        <div className="bg-black p-4 rounded-xl border border-cyan-800/80 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">Next Month Forecast</span>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {prediction ? `${currencySymbol}${prediction.predictedAmount.toFixed(2)}` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-300 pt-1 flex items-center justify-between">
            <span>Units: <strong className="font-mono text-cyan-300">{prediction?.predictedUnits.toFixed(1)} kWh</strong></span>
            <span className="text-emerald-400 font-semibold">{prediction?.confidence} Confidence</span>
          </div>
        </div>
      </div>

      {/* Graphical Comparison Bar Chart */}
      <div className="bg-black rounded-xl p-5 border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Monthly Electricity Consumption (Units & Forecast)
            </h3>
            <p className="text-xs text-slate-400">
              August, September, October baseline / paid usage alongside November &amp; December forecasts.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-cyan-500 rounded-sm" />
              <span className="text-slate-300">Aug–Oct Baseline / Paid</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-emerald-400 rounded-sm border border-dashed border-emerald-300" />
              <span className="text-slate-300">Nov &amp; Dec Forecast</span>
            </div>
          </div>
        </div>

        {/* Custom Bar Visualization */}
        <div className="pt-4 pb-2">
          <div className="h-48 flex items-end gap-3 sm:gap-6 border-b border-neutral-800 pb-2 px-2">
            {chartItems.map((item, idx) => {
              const heightPct = Math.round((item.units / maxUnits) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-14 bg-black border border-neutral-700 text-white text-[10px] rounded px-2 py-1 shadow-lg pointer-events-none whitespace-nowrap z-20">
                    <div className="text-slate-400">{item.subtitle}</div>
                    <div className="font-bold">{item.units.toFixed(1)} kWh</div>
                    <div className="text-cyan-400">{currencySymbol}{item.amount.toFixed(2)}</div>
                  </div>

                  {/* Value on top of bar */}
                  <span className="text-[10px] font-mono text-slate-400 mb-1">
                    {item.units.toFixed(0)}
                  </span>

                  {/* Bar */}
                  <div
                    style={{ height: `${Math.max(10, heightPct)}%` }}
                    className={`w-full max-w-[48px] rounded-t-md transition-all duration-300 ${
                      item.isPredicted
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 border border-dashed border-emerald-200 opacity-90'
                        : 'bg-gradient-to-t from-cyan-700 to-cyan-500 hover:from-cyan-600 hover:to-cyan-400'
                    }`}
                  />

                  {/* Label */}
                  <span className={`text-[11px] mt-2 font-medium truncate ${item.isPredicted ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Section: Budget Monitor & Anomaly Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Monitoring Card */}
        <div className="bg-black rounded-xl p-5 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              Monthly Electricity Budget Tracker
            </h3>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
              budgetAlert?.isOverBudget
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : budgetAlert?.alertLevel === 'CAUTION'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {budgetAlert?.alertLevel || 'NORMAL'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center text-slate-300 gap-3">
              <span>Budget Cap ({currencySymbol}):</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={budget || ''}
                  onChange={(e) => onBudgetChange(parseFloat(e.target.value) || 0)}
                  className="w-28 bg-black border border-neutral-700 rounded px-2.5 py-1 text-right font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span>Current Estimated Bill:</span>
              <span className="font-mono font-bold text-cyan-400">
                {currencySymbol}{currentAmount.toFixed(2)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Budget Consumed</span>
                <span className="font-mono font-semibold">{budgetAlert?.pctConsumed.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-black rounded-full h-3 overflow-hidden border border-neutral-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    budgetAlert?.isOverBudget
                      ? 'bg-rose-500'
                      : (budgetAlert?.pctConsumed || 0) >= 85
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, budgetAlert?.pctConsumed || 0)}%` }}
                />
              </div>
            </div>

            {/* Diagnostic Message */}
            <div className="bg-black p-3 rounded-lg border border-neutral-800 text-[11px] text-slate-300 leading-relaxed">
              {budgetAlert?.message}
            </div>
          </div>
        </div>

        {/* Anomaly & Surge Detection Warning Card */}
        <div className="bg-black rounded-xl p-5 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Abnormal Consumption & Surge Detector
            </h3>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
              anomaly?.isAnomaly
                ? 'bg-orange-950 text-orange-300 border border-orange-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {anomaly?.severity || 'NORMAL'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Variance vs 3-Month Moving Average:</span>
              <span className={`font-mono font-bold ${
                (anomaly?.percentAboveAvg || 0) > 25
                  ? 'text-rose-400'
                  : (anomaly?.percentAboveAvg || 0) > 0
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {(anomaly?.percentAboveAvg || 0) > 0 ? '+' : ''}
                {anomaly?.percentAboveAvg.toFixed(1)}%
              </span>
            </div>

            <div className="bg-black p-3.5 rounded-lg border border-neutral-800 space-y-2">
              <div className="font-semibold text-slate-200 text-xs">Statistical Observation:</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {anomaly?.reason}
              </p>

              {anomaly?.suggestedAction && (
                <div className="pt-2 border-t border-neutral-800">
                  <div className="font-semibold text-cyan-400 text-[11px]">Recommended Engineering Audit:</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {anomaly.suggestedAction}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="bg-black rounded-xl p-5 border border-neutral-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-200">
            Historical Billing &amp; Payment Ledger (<code className="text-cyan-400 font-mono text-xs">records_history.csv / records_history.bin</code>)
          </h3>
          <span className="text-[11px] text-slate-400">
            {history.length} saved {history.length === 1 ? 'record' : 'records'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-black text-slate-400 border-b border-neutral-800">
                <th className="py-2.5 px-3">Bill ID</th>
                <th className="py-2.5 px-3">Billing Month</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Units (kWh)</th>
                <th className="py-2.5 px-3 text-right">Amount Billed</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 px-3 text-center text-slate-500 text-xs">
                    No billing records found yet.
                  </td>
                </tr>
              ) : (
                history.map((rec, i) => (
                  <tr key={`${rec.billId}-${i}`} className="hover:bg-neutral-950 transition">
                    <td className="py-2.5 px-3 font-mono tabular-nums font-medium text-cyan-400">{rec.billId}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">{rec.month}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-300">{rec.dueDate || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{rec.category}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right font-bold text-slate-200">{rec.units.toFixed(1)}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right font-bold text-slate-100">{currencySymbol}{rec.amount.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {onDeleteRecord && (
                        confirmDeleteIndex === i ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={deletingIndex === i}
                              onClick={async () => {
                                setDeletingIndex(i);
                                await onDeleteRecord(rec.billId, i);
                                setDeletingIndex(null);
                                setConfirmDeleteIndex(null);
                              }}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white transition-colors cursor-pointer whitespace-nowrap"
                            >
                              {deletingIndex === i ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              disabled={deletingIndex === i}
                              onClick={() => setConfirmDeleteIndex(null)}
                              className="px-2 py-1 rounded text-[11px] font-medium bg-neutral-900 hover:bg-neutral-800 text-slate-300 border border-neutral-700 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteIndex(i)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium text-rose-400 hover:text-rose-300 bg-black hover:bg-rose-950/50 border border-neutral-800 hover:border-rose-800/70 transition-colors cursor-pointer whitespace-nowrap"
                            title={`Remove ${rec.month} record from storage`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
