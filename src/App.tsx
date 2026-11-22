/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { CustomerInfo, MeterData, ApplianceItem, CalculationResult } from './types/billing';
import { Navbar } from './components/Navbar';
import { CustomerDetailsPage } from './components/CustomerDetailsPage';
import { CalculatorTab } from './components/CalculatorTab';
import { ApplianceAuditorTab } from './components/ApplianceAuditorTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { TariffComparisonTab } from './components/TariffComparisonTab';
import { ProjectTeamTab } from './components/ProjectTeamTab';

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

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('calculator');
  const [isDetailsCompleted, setIsDetailsCompleted] = useState<boolean>(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState<boolean>(false);

  // Core Form State
  const [customer, setCustomer] = useState<CustomerInfo>(INITIAL_CUSTOMER);
  const [meter, setMeter] = useState<MeterData>(DEFAULT_METER);
  const [tariffPlan, setTariffPlan] = useState<string>('Standard');
  const [appliances, setAppliances] = useState<ApplianceItem[]>(DEFAULT_APPLIANCES);

  // Calculation Result
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Run calculation via C Backend API
  const handleCalculate = useCallback(async (overrideCustomer?: CustomerInfo) => {
    const activeCustomer = overrideCustomer || customer;
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
        prevReading: meter.prevReading,
        currReading: meter.currReading,
        unitsConsumed: meter.isDirectUnits ? meter.unitsConsumed : (meter.currReading - meter.prevReading),
        tariffPlan,
        appliances: appliances.map(a => ({
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
      setResult(data);

      if (data.appliances?.items) {
        setAppliances(data.appliances.items);
      }
    } catch (err) {
      console.error('Error calculating bill with C engine:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [customer, meter, tariffPlan, appliances]);

  // Handle Customer & Account Details Form Submission
  const handleCustomerSubmit = (validatedCustomer: CustomerInfo) => {
    setCustomer(validatedCustomer);
    setIsDetailsCompleted(true);
    setIsEditingCustomer(false);
    handleCalculate(validatedCustomer);
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

  // Select tariff from comparison tab
  const handleSelectTariffFromComparison = (plan: string, cat: 'Domestic' | 'Commercial') => {
    setCustomer(prev => ({ ...prev, category: cat }));
    setTariffPlan(plan);
    setActiveTab('calculator');
    setTimeout(() => {
      handleCalculate();
    }, 100);
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
                setAppliances={setAppliances}
                onRecalculate={() => handleCalculate()}
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
              />
            )}

            {activeTab === 'tariffs' && (
              <TariffComparisonTab
                currentUnits={meter.isDirectUnits ? meter.unitsConsumed : Math.max(0, meter.currReading - meter.prevReading)}
                currentCategory={customer.category}
                onSelectTariff={handleSelectTariffFromComparison}
              />
            )}

            {activeTab === 'project-team' && <ProjectTeamTab />}
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
