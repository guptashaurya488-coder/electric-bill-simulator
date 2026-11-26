import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Play,
  Terminal,
  Calculator,
  FileCode,
  Database,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { CalculationResult } from '../types/billing';

interface DemoPageProps {
  onBack: () => void;
}

const ARCHITECTURE_STEPS = [
  {
    step: '01. Input Collection (HTML & CSS)',
    title: 'Web Interface Layer',
    description:
      'Collects consumer category, meter readings or direct kWh units, monthly budget, tariff plan, and appliance wattage hours.',
  },
  {
    step: '02. Express Process Bridge',
    title: 'Server API Gateway',
    description:
      'Receives JSON payloads at /api/calculate and executes the compiled C executable ./smart_bill_calculator with child_process.',
  },
  {
    step: '03. Core C Calculation Engine',
    title: 'Slab, Tax & Forecast Logic',
    description:
      'Applies progressive energy slabs, fixed charges, 5% regulatory surcharge, 8% electricity duty, ₹0.35/kWh FCA, and rebates.',
  },
  {
    step: '04. Binary & CSV Storage',
    title: 'Persistent Ledger Output',
    description:
      'Appends paid bills using fopen/fwrite into records_history.csv and records_history.bin while returning live JSON results.',
  },
];

const C_MODULES = [
  {
    file: 'main.c',
    role: 'CLI Driver & JSON Bridge',
    details: 'Parses --calculate, --history, --compare-tariffs, --save, and --demo commands.',
  },
  {
    file: 'billing.c',
    role: 'Progressive Slab & Tax Engine',
    details: 'Computes Domestic and Commercial slab rates, surcharges, duty, and rebates.',
  },
  {
    file: 'appliances.c',
    role: 'Load & Wattage Auditor',
    details: 'Calculates monthly kWh = (Watts × Qty × Hours × 30) / 1000 per appliance.',
  },
  {
    file: 'history.c',
    role: 'CSV/Binary File I/O & Budget',
    details: 'Manages records_history.csv/.bin storage, budget alerts, and surge detection.',
  },
  {
    file: 'prediction.c',
    role: 'Trend & Forecasting Model',
    details: 'Uses moving averages and least-squares regression to forecast next-month consumption.',
  },
];

export const DemoPage: React.FC<DemoPageProps> = ({ onBack }) => {
  const [demoUnits, setDemoUnits] = useState<number>(350);
  const [demoCategory, setDemoCategory] = useState<'Domestic' | 'Commercial'>('Domestic');
  const [demoPlan, setDemoPlan] = useState<'Standard' | 'Eco Green'>('Standard');
  const [demoResult, setDemoResult] = useState<CalculationResult | null>(null);
  const [isRunningCalc, setIsRunningCalc] = useState<boolean>(false);

  const [cliOutput, setCliOutput] = useState<string>('');
  const [cliTimeMs, setCliTimeMs] = useState<number | null>(null);
  const [isRunningCli, setIsRunningCli] = useState<boolean>(false);

  const runLiveDemoCalculation = useCallback(
    async (units: number, category: 'Domestic' | 'Commercial', tariffPlan: 'Standard' | 'Eco Green') => {
      setIsRunningCalc(true);
      try {
        const res = await fetch('/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: 'Teacher Walkthrough Demo',
            consumerId: 'DEMO-2026',
            address: 'Computer Science Lab',
            category,
            billingMonth: 'November 2026',
            budget: 2500,
            prevReading: 1000,
            currReading: 1000 + units,
            unitsConsumed: units,
            tariffPlan,
          }),
        });
        if (res.ok) {
          const data: CalculationResult = await res.json();
          setDemoResult(data);
        }
      } catch (err) {
        console.error('Demo calculation failed:', err);
      } finally {
        setIsRunningCalc(false);
      }
    },
    []
  );

  const runNativeCliDemo = useCallback(async () => {
    setIsRunningCli(true);
    try {
      const res = await fetch('/api/run-c-cli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: '--demo' }),
      });
      if (res.ok) {
        const data = await res.json();
        setCliOutput(data.output || '');
        setCliTimeMs(typeof data.executionTimeMs === 'number' ? data.executionTimeMs : null);
      }
    } catch (err) {
      console.error('CLI demo run failed:', err);
    } finally {
      setIsRunningCli(false);
    }
  }, []);

  useEffect(() => {
    runLiveDemoCalculation(demoUnits, demoCategory, demoPlan);
  }, [demoUnits, demoCategory, demoPlan, runLiveDemoCalculation]);

  useEffect(() => {
    runNativeCliDemo();
  }, [runNativeCliDemo]);

  const bill = demoResult?.bill;

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* Top Action & Header */}
      <div className="bg-[#161616] rounded-xl p-6 border border-neutral-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-neutral-900 text-slate-200 border border-neutral-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            <span>Back to Mentor &amp; Student</span>
          </button>

          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
            <span>Project Demonstration Mode</span>
            <span aria-hidden="true">·</span>
            <span className="text-orange-400 font-medium">Interactive C Engine Walkthrough</span>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-4 space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Implementation of Bill Calculation Using C, HTML &amp; CSS
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>
              Project Mentor: <strong className="text-slate-200">Dr. Rupam Srivastava</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Student: <strong className="text-slate-200">Shaurya Gupta</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Backend: <strong className="text-cyan-400 font-mono">gcc -O2 (smart_bill_calculator)</strong>
            </span>
          </div>
        </div>
      </div>

      {/* How the Project Works: 4-Stage Pipeline */}
      <div className="bg-[#161616] rounded-xl p-6 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <Layers className="w-4 h-4 text-orange-400" />
          <h2 className="text-base font-semibold text-white">
            How This Project Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ARCHITECTURE_STEPS.map((item) => (
            <div
              key={item.step}
              className="bg-black rounded-lg p-4 border border-neutral-800 space-y-2"
            >
              <div className="text-xs font-mono text-orange-400 font-semibold">
                {item.step}
              </div>
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Interactive C Calculation Walkthrough */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls & Summary */}
        <div className="lg:col-span-5 bg-[#161616] rounded-xl p-6 border border-neutral-800 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-orange-400" />
              Live C Engine Simulation
            </h2>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {isRunningCalc ? 'Calculating...' : `${demoResult?.executionTimeMs ?? 0} ms`}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="demo-units-slider" className="text-slate-300 font-medium">
                  Test Consumption (Units)
                </label>
                <span className="font-mono tabular-nums font-bold text-orange-400 text-sm">
                  {demoUnits} kWh
                </span>
              </div>
              <input
                id="demo-units-slider"
                type="range"
                min={50}
                max={750}
                step={10}
                value={demoUnits}
                onChange={(e) => setDemoUnits(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {[100, 200, 350, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDemoUnits(preset)}
                    className={`px-3 py-1.5 rounded-md font-mono tabular-nums transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      demoUnits === preset
                        ? 'bg-orange-600 text-white font-semibold'
                        : 'bg-black text-slate-300 border border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {preset} kWh
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-slate-400 block">Consumer Category</span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-black rounded-lg border border-neutral-800">
                  {(['Domestic', 'Commercial'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setDemoCategory(cat)}
                      className={`py-1.5 px-2 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        demoCategory === cat
                          ? 'bg-neutral-800 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 block">Tariff Plan</span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-black rounded-lg border border-neutral-800">
                  {(['Standard', 'Eco Green'] as const).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setDemoPlan(plan)}
                      className={`py-1.5 px-2 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        demoPlan === plan
                          ? 'bg-neutral-800 text-cyan-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {bill && (
              <div className="bg-black rounded-lg p-4 border border-neutral-800 space-y-2.5">
                <div className="flex justify-between text-slate-300">
                  <span>Energy Slab Charges</span>
                  <span className="font-mono tabular-nums">₹{bill.charges.energyCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Fixed Meter Charges</span>
                  <span className="font-mono tabular-nums">₹{bill.charges.fixedCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Regulatory Surcharge (5%)</span>
                  <span className="font-mono tabular-nums">₹{bill.charges.regulatorySurcharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Electricity Duty (8%)</span>
                  <span className="font-mono tabular-nums">₹{bill.charges.electricityDuty.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Fuel Surcharge (₹0.35/kWh)</span>
                  <span className="font-mono tabular-nums">₹{bill.charges.fuelSurcharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Green / Prompt Rebate</span>
                  <span className="font-mono tabular-nums">-₹{bill.charges.greenRebate.toFixed(2)}</span>
                </div>
                <div className="border-t border-neutral-800 pt-2.5 flex justify-between items-center text-sm font-bold">
                  <span className="text-white">Total Payable</span>
                  <span className="font-mono tabular-nums text-orange-400 text-base">
                    ₹{bill.charges.totalPayable.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step-by-Step Slab Breakdown */}
        <div className="lg:col-span-7 bg-[#161616] rounded-xl p-6 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Slab-Wise Calculation Formula Output (<code className="font-mono text-xs text-cyan-400">billing.c</code>)
            </h2>
            <span className="text-xs text-slate-400">
              {demoCategory} · {demoPlan}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-black text-slate-400 border-b border-neutral-800">
                  <th className="py-2.5 px-3">Slab Tier</th>
                  <th className="py-2.5 px-3 text-right">Rate (₹/kWh)</th>
                  <th className="py-2.5 px-3 text-right">Units Billed</th>
                  <th className="py-2.5 px-3 text-right">Slab Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {bill?.slabs.map((slab, idx) => (
                  <tr key={idx} className="hover:bg-black/60 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-200">{slab.label}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-300">
                      ₹{slab.rate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-cyan-400 font-semibold">
                      {slab.unitsInSlab.toFixed(1)} kWh
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-white font-semibold">
                      ₹{slab.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Statutory Formula Summary */}
          <div className="bg-black rounded-lg p-4 border border-neutral-800 text-xs text-slate-300 space-y-1.5">
            <div className="font-semibold text-white">Billing Formula Executed in C:</div>
            <p className="font-mono text-[11px] text-slate-400 leading-relaxed">
              Total Payable = (Energy Charges + Fixed Charges + 5% Regulatory Surcharge + 8% Duty + Units × ₹0.35 FCA) − Rebate
            </p>
          </div>
        </div>
      </div>

      {/* C Architecture & Live CLI Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* C Modules Overview */}
        <div className="lg:col-span-6 bg-[#161616] rounded-xl p-6 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">
              Modular C Source Files &amp; Persistence
            </h2>
          </div>

          <div className="divide-y divide-neutral-800 text-xs">
            {C_MODULES.map((mod) => (
              <div key={mod.file} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-cyan-400">{mod.file}</span>
                  <span className="text-slate-400">{mod.role}</span>
                </div>
                <p className="text-slate-400 leading-relaxed">{mod.details}</p>
              </div>
            ))}
          </div>

          <div className="bg-black rounded-lg p-3.5 border border-neutral-800 flex items-start gap-2.5 text-xs text-slate-300">
            <Database className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Dual Storage Files:</span>
              Paid monthly bills (including August–October history and newly saved bills) persist in{' '}
              <code className="font-mono text-cyan-400">data/records_history.csv</code> and binary{' '}
              <code className="font-mono text-cyan-400">data/records_history.bin</code>.
            </div>
          </div>
        </div>

        {/* Live C CLI Output */}
        <div className="lg:col-span-6 bg-[#161616] rounded-xl p-6 border border-neutral-800 space-y-4 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-orange-400" />
              <h2 className="text-base font-semibold text-white">
                Native C CLI Output
              </h2>
            </div>

            <button
              type="button"
              onClick={runNativeCliDemo}
              disabled={isRunningCli}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunningCli ? 'Running...' : 'Run C Binary Demo'}</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Command: ./smart_bill_calculator --demo</span>
            {cliTimeMs !== null && <span className="tabular-nums text-emerald-400">{cliTimeMs} ms</span>}
          </div>

          <pre className="flex-1 bg-black rounded-lg p-4 border border-neutral-800 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre">
            {cliOutput || 'Click "Run C Binary Demo" to execute the compiled C program.'}
          </pre>
        </div>
      </div>
    </div>
  );
};
