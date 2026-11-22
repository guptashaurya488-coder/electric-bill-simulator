/**
 * Smart Electricity Bill Calculator Using C
 * TypeScript Type Definitions aligned with C Backend Structs
 */

export interface CustomerInfo {
  name: string;
  consumerId: string;
  address: string;
  category: 'Domestic' | 'Commercial';
  billingMonth: string;
  budget: number;
}

export interface MeterData {
  prevReading: number;
  currReading: number;
  unitsConsumed: number;
  isDirectUnits: boolean;
}

export interface SlabItem {
  label: string;
  min: number;
  max: number;
  rate: number;
  unitsInSlab: number;
  amount: number;
}

export interface BillCharges {
  energyCharges: number;
  fixedCharges: number;
  regulatorySurcharge: number;
  electricityDuty: number;
  fuelSurcharge: number;
  greenRebate: number;
  subtotal: number;
  totalPayable: number;
}

export interface BillBreakdown {
  billId: string;
  issueDate: string;
  dueDate: string;
  paymentStatus: 'Unpaid' | 'Paid' | 'Overdue';
  tariffPlan: string;
  customer: CustomerInfo;
  meter: MeterData;
  charges: BillCharges;
  slabs: SlabItem[];
}

export interface ApplianceItem {
  name: string;
  watts: number;
  quantity: number;
  dailyHours: number;
  monthlyKwh: number;
  monthlyCost: number;
  pctOfBill: number;
}

export interface WhatIfScenario {
  appliance: string;
  currentHours: number;
  suggestedHours: number;
  hoursReduced: number;
  monthlyKwhSaved: number;
  monthlyCostSaved: number;
  annualCostSaved: number;
  tip: string;
}

export interface MonthlyRecord {
  billId: string;
  month: string;
  year: number;
  units: number;
  amount: number;
  status: string;
  category: string;
}

export interface PredictionResult {
  predictedUnits: number;
  predictedAmount: number;
  avg3mUnits: number;
  avg6mUnits: number;
  trendDirection: 'Increasing' | 'Stable' | 'Decreasing';
  pctGrowth: number;
  confidence: 'High' | 'Medium' | 'Low';
  reason: string;
}

export interface BudgetAlert {
  isOverBudget: boolean;
  budget: number;
  currentBill: number;
  pctConsumed: number;
  alertLevel: 'NORMAL' | 'CAUTION' | 'CRITICAL';
  message: string;
}

export interface AnomalyWarning {
  isAnomaly: boolean;
  severity: 'NONE' | 'MODERATE' | 'SEVERE' | 'LOW_OUTLIER' | 'NORMAL';
  percentAboveAvg: number;
  reason: string;
  suggestedAction: string;
}

export interface Recommendation {
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  monthlySaving: number;
  description: string;
}

export interface CalculationResult {
  status: string;
  engine: string;
  executionTimeMs?: number;
  bill: BillBreakdown;
  appliances: {
    totalKwh: number;
    totalCost: number;
    items: ApplianceItem[];
  };
  whatIfScenarios: WhatIfScenario[];
  history: MonthlyRecord[];
  prediction: PredictionResult;
  budgetAlert: BudgetAlert;
  anomaly: AnomalyWarning;
  recommendations: Recommendation[];
}

export interface TariffComparisonPlan {
  planName: string;
  energyCharges: number;
  fixedCharges: number;
  taxes: number;
  rebate: number;
  totalPayable: number;
  effectiveRatePerUnit: number;
}

export interface CSourceFile {
  name: string;
  description: string;
  lines: number;
  content: string;
}
