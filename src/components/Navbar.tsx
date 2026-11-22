import React from 'react';
import { Zap, Cpu, PieChart, TrendingUp, Scale, Users, UserCheck, Pencil } from 'lucide-react';
import { CustomerInfo } from '../types/billing';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  executionTimeMs?: number;
  showTabs: boolean;
  customer?: CustomerInfo;
  onEditCustomer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  executionTimeMs,
  showTabs,
  customer,
  onEditCustomer,
}) => {
  const navItems = [
    { id: 'calculator', label: 'Bill Calculator', icon: Zap },
    { id: 'appliances', label: 'Appliance Audit', icon: PieChart },
    { id: 'analytics', label: 'Analytics & Predictions', icon: TrendingUp },
    { id: 'tariffs', label: 'Tariff Comparison', icon: Scale },
    { id: 'project-team', label: 'Mentor & Student', icon: Users },
  ];

  return (
    <header className="bg-black border-b border-neutral-800 text-slate-100 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">Smart Electricity Bill Calculator</span>
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  C Engine
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center space-x-2">
                <span>Intelligent Consumption, Audit & Forecast</span>
                <span className="text-neutral-600">|</span>
                <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                  <Cpu className="w-3 h-3 inline" />
                  gcc -O2 native {executionTimeMs !== undefined ? `(${executionTimeMs} ms)` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Status & Currency Indicator */}
          <div className="flex items-center space-x-2.5">
            {showTabs && customer && onEditCustomer ? (
              <button
                type="button"
                onClick={onEditCustomer}
                className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-neutral-900 hover:bg-neutral-800 text-slate-200 border border-neutral-700 transition cursor-pointer"
                title="Edit Customer & Account Details"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline font-medium">{customer.name}</span>
                <span className="text-slate-500 hidden md:inline">({customer.consumerId})</span>
                <Pencil className="w-3 h-3 text-cyan-400" />
              </button>
            ) : (
              <div className="px-3 py-1 text-xs font-medium rounded-lg bg-neutral-900 text-amber-400 border border-neutral-800">
                Step 1: Account Setup
              </div>
            )}
            <div className="px-3 py-1 text-xs font-semibold rounded-lg bg-black text-cyan-400 border border-neutral-800">
              ₹ INR
            </div>
          </div>
        </div>

        {/* Tab Navigation (Shown only after Customer Details are filled) */}
        {showTabs && (
          <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-t border-neutral-800 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-neutral-900 text-cyan-400 border border-neutral-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};
