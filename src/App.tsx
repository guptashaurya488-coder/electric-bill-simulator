/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CustomerInfo, MeterData, ApplianceItem, CalculationResult } from './types/billing';
import { Navbar } from './components/Navbar';
import { CustomerDetailsPage } from './components/CustomerDetailsPage';
import { CalculatorTab } from './components/CalculatorTab';
import { ApplianceAuditorTab } from './components/ApplianceAuditorTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { TariffComparisonTab } from './components/TariffComparisonTab';
import { ProjectTeamTab } from './components/ProjectTeamTab';
import { DemoPage } from './components/DemoPage';

const STORAGE_KEY = 'smart_electricity_bill_state_v1';

const INITIAL_CUSTOMER: CustomerInfo = {
  name: '',
  consumerId: '',
  address: '',
  category: 'Domestic',
  billingMonth: 'November 2026',
  budget: 0,
};

const DEFAULT_METER: MeterData = {
  prevReading: 2100.0,
  currReading: 2450.0,
  unitsConsumed: 350.0,
  isDirectUnits: false,
};

const DEFAULT_APPLIANCES: ApplianceItem[] = [
  { name: 'Inverter AC', watts: 1500, quantity: 1, dailyHours: 6.0, monthlyKwh: 270, monthlyCost: 1872.3, pctOfBill: 77.1 },
  { name: 'Refrigerator', watts: 250, quantity: 1, dailyHours: 14.0, monthlyKwh: 105, monthlyCost: 728.1, pctOfBill: 30.0 },
  { name: 'Fans', watts: 75, quantity: 3, dailyHours: 10.0, monthlyKwh: 67.5, monthlyCost: 468.1, pctOfBill: 19.3 },
  { name: 'led bulbs', watts: 12, quantity: 8, dailyHours: 6.0, monthlyKwh: 17.3, monthlyCost: 119.8, pctOfBill: 4.9 },
  { name: 'Water geyser', watts: 2000, quantity: 1, dailyHours: 1.0, monthlyKwh: 60.0, monthlyCost: 416.1, pctOfBill: 17.1 },
  { name: 'Smart TV', watts: 120, quantity: 1, dailyHours: 5.0, monthlyKwh: 18.0, monthlyCost: 124.8, pctOfBill: 5.1 },
];

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function App() {
  const savedState = loadPersistedState();

  const [activeTab, setActiveTab] = useState<string>('calculator');
  const [isDetailsCompleted, setIsDetailsCompleted] = useState<boolean>(
    Boolean(savedState?.isDetailsCompleted && savedState?.customer?.name)
  );
  const [isEditingCustomer, setIsEditingCustomer] = useState<boolean>(false);

  // Core Form State
  const [customer, setCustomer] = useState<CustomerInfo>(savedState?.customer || INITIAL_CUSTOMER);
  const [meter, setMeter] = useState<MeterData>(savedState?.meter || DEFAULT_METER);
  const [tariffPlan, setTariffPlan] = useState<string>(savedState?.tariffPlan || 'Standard');
  const [appliances, setAppliances] = useState<ApplianceItem[]>(savedState?.appliances || DEFAULT_APPLIANCES);

  // Calculation Result
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const initialMountCalculated = useRef(false);
  const calcRequestIdRef = useRef(0);

  // Persist user profile, budget, meter, tariff, and appliances whenever updated
  useEffect(() => {
    if (!isDetailsCompleted) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isDetailsCompleted,
          customer,
          meter,
          tariffPlan,
          appliances,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [isDetailsCompleted, customer, meter, tariffPlan, appliances]);

  // Run calculation via C Backend API
  const handleCalculate = useCallback(async (overrides?: {
    customer?: CustomerInfo;
    meter?: MeterData;
    tariffPlan?: string;
    appliances?: ApplianceItem[];
  }) => {
    const activeCustomer = overrides?.customer || customer;
    const activeMeter = overrides?.meter || meter;
    const activePlan = overrides?.tariffPlan || tariffPlan;
    const activeAppliances = overrides?.appliances ?? appliances;

    const computedUnits = activeMeter.isDirectUnits
      ? Math.max(0, activeMeter.unitsConsumed)
      : Math.max(0, activeMeter.currReading - activeMeter.prevReading);

    const requestId = ++calcRequestIdRef.current;
    setIsCalculating(true);
    setSaveMessage(null);
    try {
      const payload = {
        customerName: activeCustomer.name,
        consumerId: activeCustomer.consumerId,
        address: activeCustomer.address,
        category: activeCustomer.category,
        billingMonth: activeCustomer.billingMonth,
        budget: activeCustomer.budget,
        prevReading: activeMeter.prevReading,
        currReading: activeMeter.currReading,
        unitsConsumed: computedUnits,
        tariffPlan: activePlan,
        appliances: activeAppliances.map(a => ({
          name: a.name,
          watts: a.watts,
          quantity: a.quantity,
          dailyHours: a.dailyHours,
        })),
      };

      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Calculation request failed');
      const data: CalculationResult = await res.json();
      if (requestId !== calcRequestIdRef.current) return;

      setResult(data);

      if (data.appliances?.items) {
        setAppliances(data.appliances.items);
      }
    } catch (err) {
      console.error('Error calculating bill with C engine:', err);
    } finally {
      if (requestId === calcRequestIdRef.current) {
        setIsCalculating(false);
      }
    }
  }, [customer, meter, tariffPlan, appliances]);

  // Recalculate automatically on page load if persisted details exist
  useEffect(() => {
    if (isDetailsCompleted && !initialMountCalculated.current) {
      initialMountCalculated.current = true;
      handleCalculate();
    }
  }, [isDetailsCompleted, handleCalculate]);

  // Handle Customer & Account Details Form Submission
  const handleCustomerSubmit = (validatedCustomer: CustomerInfo) => {
    setCustomer(validatedCustomer);
    setIsDetailsCompleted(true);
    setIsEditingCustomer(false);
    handleCalculate({ customer: validatedCustomer });
  };

  // Sync appliance changes directly into meter consumption & budget tracker
  const handleAppliancesChange = (nextAppliances: ApplianceItem[]) => {
    const totalAppKwh = nextAppliances.reduce(
      (sum, a) => sum + (a.watts * a.quantity * a.dailyHours * 30) / 1000,
      0
    );
    const roundedKwh = Math.round(totalAppKwh * 10) / 10;
    const nextMeter: MeterData = {
      prevReading: meter.prevReading,
      currReading: Math.round((meter.prevReading + roundedKwh) * 10) / 10,
      unitsConsumed: roundedKwh,
      isDirectUnits: true,
    };

    setAppliances(nextAppliances);
    setMeter(nextMeter);
    handleCalculate({ appliances: nextAppliances, meter: nextMeter });
  };

  // Sync budget changes directly into C budget alert tracker
  const handleBudgetChange = (newBudget: number) => {
    const nextCustomer = { ...customer, budget: newBudget };
    setCustomer(nextCustomer);
    handleCalculate({ customer: nextCustomer });
  };

  // Toggle payment status on the active bill
  const handleTogglePaymentStatus = () => {
    if (!result) return;
    const nextStatus = result.bill.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    setResult({
      ...result,
      bill: {
        ...result.bill,
        paymentStatus: nextStatus,
      },
    });
  };

  // Save current PAID bill to C Database
  const handleSaveRecord = async () => {
    if (!result || result.bill.paymentStatus !== 'Paid') {
      setSaveMessage('Please mark the bill as Paid before saving to the ledger.');
      setTimeout(() => setSaveMessage(null), 4000);
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        billId: result.bill.billId,
        month: result.bill.customer.billingMonth,
        year: 2026,
        dueDate: result.bill.dueDate,
        units: result.bill.meter.unitsConsumed,
        amount: result.bill.charges.totalPayable,
        status: 'Paid',
        category: result.bill.customer.category,
      };

      const res = await fetch('/api/save-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSaveMessage(data.message || 'Saved paid bill to ledger!');
      setTimeout(() => setSaveMessage(null), 4000);

      // Refresh history from C file while keeping Paid status on current bill
      const histRes = await fetch('/api/history');
      if (histRes.ok) {
        const histData = await histRes.json();
        if (histData.records) {
          setResult(prev => (prev ? { ...prev, history: histData.records } : prev));
        }
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a paid bill record from C CSV & Binary storage
  const handleDeleteRecord = async (billId: string, rowIndex: number) => {
    try {
      const res = await fetch('/api/delete-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, rowIndex }),
      });
      if (!res.ok) throw new Error('Delete request failed');
      await handleCalculate();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Select tariff from comparison tab
  const handleSelectTariffFromComparison = (plan: string, cat: 'Domestic' | 'Commercial') => {
    const nextCustomer = { ...customer, category: cat };
    setCustomer(nextCustomer);
    setTariffPlan(plan);
    setActiveTab('calculator');
    handleCalculate({ customer: nextCustomer, tariffPlan: plan });
  };

  const avgRatePerKwh = result && result.bill.meter.unitsConsumed > 0
    ? result.bill.charges.totalPayable / result.bill.meter.unitsConsumed
    : 6.8;

  const showMainPanels = isDetailsCompleted && !isEditingCustomer;

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Navbar with Header, Tabs, and C Process Status */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        executionTimeMs={result?.executionTimeMs}
        showTabs={showMainPanels}
        customer={customer}
        onEditCustomer={() => setIsEditingCustomer(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!showMainPanels ? (
          <CustomerDetailsPage
            customer={customer}
            onSubmitDetails={handleCustomerSubmit}
            isEditing={isDetailsCompleted}
          />
        ) : (
          <>
            {activeTab === 'calculator' && (
              <CalculatorTab
                customer={customer}
                setCustomer={setCustomer}
                meter={meter}
                setMeter={setMeter}
                tariffPlan={tariffPlan}
                setTariffPlan={setTariffPlan}
                onCalculate={() => handleCalculate()}
                onSaveRecord={handleSaveRecord}
                onTogglePaymentStatus={handleTogglePaymentStatus}
                onBudgetChange={handleBudgetChange}
                isCalculating={isCalculating}
                isSaving={isSaving}
                saveMessage={saveMessage}
                result={result}
                onEditCustomer={() => setIsEditingCustomer(true)}
              />
            )}

            {activeTab === 'appliances' && (
              <ApplianceAuditorTab
                appliances={appliances}
                onAppliancesChange={handleAppliancesChange}
                onRecalculate={() => handleAppliancesChange(appliances)}
                avgRatePerKwh={avgRatePerKwh}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsTab
                history={result?.history || []}
                prediction={result?.prediction || null}
                budgetAlert={result?.budgetAlert || null}
                anomaly={result?.anomaly || null}
                currentBill={result?.bill || null}
                budget={customer.budget}
                onBudgetChange={handleBudgetChange}
                onDeleteRecord={handleDeleteRecord}
              />
            )}

            {activeTab === 'tariffs' && (
              <TariffComparisonTab
                currentUnits={meter.isDirectUnits ? meter.unitsConsumed : Math.max(0, meter.currReading - meter.prevReading)}
                currentCategory={customer.category}
                onSelectTariff={handleSelectTariffFromComparison}
              />
            )}

            {activeTab === 'project-team' && (
              <ProjectTeamTab onOpenDemo={() => setActiveTab('demo')} />
            )}

            {activeTab === 'demo' && (
              <DemoPage onBack={() => setActiveTab('project-team')} />
            )}
          </>
        )}
      </main>

      {/* Global Footer with C Engine Details */}
      <footer className="bg-black border-t border-neutral-800 py-4 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="text-slate-400 font-medium">Smart Electricity Bill Calculator Using C</span> · College Engineering Capstone Project
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span>C Binary: <strong className="text-cyan-400">./smart_bill_calculator</strong></span>
            <span>·</span>
            <span>Compiler: <strong className="text-slate-300">gcc 12.3.0</strong></span>
            <span>·</span>
            <span>Storage: <strong className="text-slate-300">records_history.bin / .csv</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
