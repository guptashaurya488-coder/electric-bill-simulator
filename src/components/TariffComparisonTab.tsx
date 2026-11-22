import React, { useState, useEffect } from 'react';
import { TariffComparisonPlan } from '../types/billing';
import { Scale, CheckCircle2, TrendingDown, Info } from 'lucide-react';

interface TariffComparisonTabProps {
  currentUnits: number;
  currentCategory: 'Domestic' | 'Commercial';
  onSelectTariff: (plan: string, category: 'Domestic' | 'Commercial') => void;
}

export const TariffComparisonTab: React.FC<TariffComparisonTabProps> = ({
  currentUnits,
  currentCategory,
  onSelectTariff,
}) => {
  const [units, setUnits] = useState<number>(currentUnits || 350);
  const [category, setCategory] = useState<'Domestic' | 'Commercial'>(currentCategory || 'Domestic');
  const [plans, setPlans] = useState<TariffComparisonPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const currencySymbol = '₹';

  const fetchComparison = async (u: number, cat: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/compare-tariffs?units=${u}&category=${cat}`);
      const data = await res.json();
      if (data.comparison) {
        const allowedPlans = (data.comparison as TariffComparisonPlan[]).filter(
          (p) => p.planName === 'Standard' || p.planName === 'Eco Green'
        );
        setPlans(allowedPlans);
      }
    } catch (e) {
      console.error('Tariff comparison error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison(units, category);
  }, [units, category]);

  // Find lowest plan
  const lowestPlan = plans.length > 0
    ? [...plans].sort((a, b) => a.totalPayable - b.totalPayable)[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-black rounded-xl p-4 border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            Tariff Plan & Rate Structure Comparison Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates your exact consumption volume against alternative regulatory tariff plans in C (<code className="text-cyan-400 font-mono">billing.c</code>).
          </p>
        </div>

        {/* Quick controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-black px-3 py-1.5 rounded-lg border border-neutral-800">
            <span className="text-slate-400">Category:</span>
            <button
              type="button"
              onClick={() => setCategory('Domestic')}
              className={`px-2 py-0.5 rounded font-semibold ${category === 'Domestic' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
            >
              Domestic
            </button>
            <button
              type="button"
              onClick={() => setCategory('Commercial')}
              className={`px-2 py-0.5 rounded font-semibold ${category === 'Commercial' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
            >
              Commercial
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-black px-3 py-1.5 rounded-lg border border-neutral-800">
            <span className="text-slate-400">Volume:</span>
            <input
              type="number"
              min="10"
              max="10000"
              value={units}
              onChange={(e) => setUnits(parseFloat(e.target.value) || 0)}
              className="w-20 bg-black border border-neutral-700 rounded px-2 py-0.5 text-center font-mono text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-400">kWh</span>
          </div>
        </div>
      </div>

      {/* Lowest Cost Recommendation Callout */}
      {lowestPlan && (
        <div className="bg-emerald-950/40 rounded-xl p-4 border border-emerald-800 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-900/60 border border-emerald-700 text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-emerald-200">
                Recommended Most Economical Plan: {lowestPlan.planName}
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5">
                For a monthly consumption of {units.toFixed(1)} kWh, the <strong className="text-emerald-300">{lowestPlan.planName}</strong> plan results in the lowest net payable bill of <strong className="font-mono text-emerald-300">{currencySymbol}{lowestPlan.totalPayable.toFixed(2)}</strong> (effective rate {currencySymbol}{lowestPlan.effectiveRatePerUnit.toFixed(2)}/kWh).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTariff(lowestPlan.planName, category)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs transition whitespace-nowrap shadow-sm"
          >
            Apply to My Bill
          </button>
        </div>
      )}

      {/* Plan Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan, idx) => {
          const isBest = lowestPlan?.planName === plan.planName;
          return (
            <div
              key={idx}
              className={`rounded-xl p-5 border flex flex-col justify-between transition ${
                isBest
                  ? 'bg-black border-emerald-600 ring-1 ring-emerald-500/50 shadow-lg'
                  : 'bg-black border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{plan.planName}</h3>
                    <span className="text-[11px] text-slate-400">{category} Tariff</span>
                  </div>
                  {isBest && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      LOWEST COST
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Calculated Bill</span>
                  <div className="text-2xl font-black font-mono text-cyan-400">
                    {currencySymbol}{plan.totalPayable.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>Effective Rate:</span>
                    <strong className="font-mono text-slate-200">{currencySymbol}{plan.effectiveRatePerUnit.toFixed(2)} / kWh</strong>
                  </div>
                </div>

                {/* Breakdown List */}
                <div className="space-y-2 text-xs pt-2 border-t border-neutral-800">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Energy Charges:</span>
                    <span className="font-mono">{currencySymbol}{plan.energyCharges.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Fixed Demand Charge:</span>
                    <span className="font-mono">{currencySymbol}{plan.fixedCharges.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Taxes, Duty & Surcharge:</span>
                    <span className="font-mono">+{currencySymbol}{plan.taxes.toFixed(2)}</span>
                  </div>

                  {plan.rebate > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Clean Energy Rebate:</span>
                      <span className="font-mono">-{currencySymbol}{plan.rebate.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => onSelectTariff(plan.planName, category)}
                  className={`w-full py-2 rounded-lg text-xs font-semibold transition ${
                    isBest
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-slate-200 border border-neutral-700'
                  }`}
                >
                  Select this Tariff
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
