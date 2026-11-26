import React, { useState } from 'react';
import { ApplianceItem } from '../types/billing';
import { Plus, Trash2, Zap } from 'lucide-react';

interface ApplianceAuditorTabProps {
  appliances: ApplianceItem[];
  onAppliancesChange: (nextAppliances: ApplianceItem[]) => void;
  onRecalculate: () => void;
  avgRatePerKwh: number;
}

const PRESET_APPLIANCES = [
  { name: '1.5 Ton 5-Star Inverter AC', watts: 1500, defaultHours: 6 },
  { name: 'Double Door Refrigerator (260L)', watts: 250, defaultHours: 14 },
  { name: 'BLDC Energy Saving Fan', watts: 35, defaultHours: 12 },
  { name: 'Standard Ceiling Fan', watts: 75, defaultHours: 10 },
  { name: 'LED Bulbs & Battens', watts: 12, defaultHours: 6 },
  { name: 'Old Incandescent Yellow Bulb', watts: 60, defaultHours: 5 },
  { name: 'Storage Water Geyser (25L)', watts: 2000, defaultHours: 1.5 },
  { name: 'Smart LED TV 55-inch', watts: 120, defaultHours: 5 },
  { name: 'Front Load Washing Machine', watts: 500, defaultHours: 1 },
  { name: 'Microwave Oven (Convection)', watts: 1200, defaultHours: 0.5 },
  { name: 'Desktop PC + Dual Monitors', watts: 250, defaultHours: 8 },
  { name: 'Submersible Water Pump', watts: 750, defaultHours: 1 },
  { name: 'Electric Steam Iron', watts: 1000, defaultHours: 0.5 },
];

export const ApplianceAuditorTab: React.FC<ApplianceAuditorTabProps> = ({
  appliances,
  onAppliancesChange,
  onRecalculate,
  avgRatePerKwh,
}) => {
  const currencySymbol = '₹';

  // New appliance input state
  const [name, setName] = useState('');
  const [watts, setWatts] = useState<number>(100);
  const [quantity, setQuantity] = useState<number>(1);
  const [dailyHours, setDailyHours] = useState<number>(4);

  const handleAddAppliance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || watts <= 0) return;

    const monthlyKwh = (watts * quantity * dailyHours * 30) / 1000;
    const monthlyCost = monthlyKwh * (avgRatePerKwh || 6.5);

    const newApp: ApplianceItem = {
      name: name.trim(),
      watts,
      quantity,
      dailyHours,
      monthlyKwh,
      monthlyCost,
      pctOfBill: 0,
    };

    onAppliancesChange([...appliances, newApp]);
    setName('');
    setWatts(100);
    setQuantity(1);
    setDailyHours(4);
  };

  const handlePresetSelect = (preset: typeof PRESET_APPLIANCES[0]) => {
    setName(preset.name);
    setWatts(preset.watts);
    setDailyHours(preset.defaultHours);
  };

  const handleDelete = (index: number) => {
    onAppliancesChange(appliances.filter((_, idx) => idx !== index));
  };

  const handleUpdateHours = (index: number, newHours: number) => {
    const next = appliances.map((app, i) => {
      if (i === index) {
        const hours = Math.max(0, Math.min(24, newHours));
        const monthlyKwh = (app.watts * app.quantity * hours * 30) / 1000;
        return {
          ...app,
          dailyHours: hours,
          monthlyKwh,
          monthlyCost: monthlyKwh * (avgRatePerKwh || 6.5),
        };
      }
      return app;
    });
    onAppliancesChange(next);
  };

  const totalAppKwh = appliances.reduce((sum, a) => sum + a.monthlyKwh, 0);
  const totalAppCost = appliances.reduce((sum, a) => sum + a.monthlyCost, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-black rounded-xl p-4 border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Appliance-Wise Power Consumption Audit
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit power ratings in Watts, quantity, and daily operating hours to isolate energy hogs.
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-black px-4 py-2 rounded-lg border border-neutral-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Audited Units</span>
            <span className="text-sm font-mono font-bold text-cyan-400">{totalAppKwh.toFixed(1)} kWh/mo</span>
          </div>
          <div className="h-6 w-px bg-neutral-800" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Cost</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{currencySymbol}{totalAppCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Appliance Inventory */}
      <div className="space-y-6">
        {/* Add Appliance Card */}
        <div className="bg-black rounded-xl p-5 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-semibold text-slate-200">
              Add Appliance to Audit Inventory
            </h3>
            <span className="text-xs text-slate-400">Select preset or type custom</span>
          </div>

          {/* Quick Presets row */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-slate-400 py-1 font-medium">Quick Presets:</span>
            {PRESET_APPLIANCES.slice(0, 6).map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-slate-300 rounded border border-neutral-700 transition"
              >
                {preset.name.split(' ')[0]} ({preset.watts}W)
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleAddAppliance} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Appliance Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 1.5 Ton Inverter AC"
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Power (Watts)</label>
              <input
                type="number"
                min="1"
                max="15000"
                value={watts || ''}
                onChange={(e) => setWatts(parseFloat(e.target.value) || 0)}
                placeholder="1500"
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                max="50"
                value={quantity || ''}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                placeholder="1"
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Hours / Day</label>
              <input
                type="number"
                min="0.1"
                max="24"
                step="0.5"
                value={dailyHours || ''}
                onChange={(e) => setDailyHours(parseFloat(e.target.value) || 0)}
                placeholder="6.0"
                className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="sm:col-span-5 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold flex items-center space-x-1.5 transition text-xs cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Appliance</span>
              </button>
            </div>
          </form>
        </div>

        {/* Current Appliances Table */}
        <div className="bg-black rounded-xl p-5 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-semibold text-slate-200">
              Audited Appliance Inventory ({appliances.length} Items)
            </h3>
            <button
              type="button"
              onClick={onRecalculate}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Sync with C Calculation ⟳
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-black text-slate-400 border-b border-neutral-800">
                  <th className="py-2.5 px-3">Appliance</th>
                  <th className="py-2.5 px-2 text-right">Power</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-center">Hrs/Day</th>
                  <th className="py-2.5 px-3 text-right">Monthly kWh</th>
                  <th className="py-2.5 px-3 text-right">Est. Cost</th>
                  <th className="py-2.5 px-3">Bill Share</th>
                  <th className="py-2.5 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {appliances.map((app, idx) => (
                  <tr key={idx} className="hover:bg-neutral-950 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-200">
                      {app.name}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-right text-slate-300">
                      {app.watts} W
                    </td>
                    <td className="py-2.5 px-2 font-mono text-center text-slate-300">
                      {app.quantity}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={app.dailyHours}
                          onChange={(e) => handleUpdateHours(idx, parseFloat(e.target.value) || 0)}
                          className="w-14 bg-black border border-neutral-800 rounded px-1.5 py-0.5 text-center font-mono text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-[10px] text-slate-500">h</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right font-semibold text-cyan-400">
                      {app.monthlyKwh.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right font-bold text-slate-200">
                      {currencySymbol}{app.monthlyCost.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="w-full bg-black rounded-full h-2 overflow-hidden border border-neutral-800">
                        <div
                          className={`h-full ${
                            app.pctOfBill > 35
                              ? 'bg-rose-500'
                              : app.pctOfBill > 20
                              ? 'bg-amber-400'
                              : 'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.min(100, app.pctOfBill || 0)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {(app.pctOfBill || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        className="p-1 hover:text-rose-400 text-slate-500 transition rounded"
                        title="Remove appliance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
