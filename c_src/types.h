/**
 * Smart Electricity Bill Calculator Using C
 * types.h - Core Data Structures and Definitions
 */

#ifndef TYPES_H
#define TYPES_H

#define MAX_SLABS 6
#define MAX_APPLIANCES 32
#define MAX_HISTORY 24
#define MAX_RECOMMENDATIONS 8
#define MAX_WHAT_IF 16

typedef struct {
    char name[64];
    char consumer_id[32];
    char address[128];
    char category[16];        /* "Domestic" or "Commercial" */
    char billing_month[24];   /* e.g., "October 2026" */
    double budget;            /* Monthly budget in local currency */
} Customer;

typedef struct {
    double prev_reading;
    double curr_reading;
    double units_consumed;
    int is_direct_units;      /* 1 if directly entered, 0 if computed from meter */
} MeterData;

typedef struct {
    double min_units;
    double max_units;
    double rate_per_unit;
    double units_in_slab;
    double amount;
    char label[32];
} Slab;

typedef struct {
    Customer customer;
    MeterData meter;
    char tariff_plan[32];     /* "Standard", "Eco Green", "Time of Use" */
    
    Slab slabs[MAX_SLABS];
    int num_slabs;
    
    double energy_charges;
    double fixed_charges;
    double regulatory_surcharge;   /* 5% of energy charges */
    double electricity_duty;        /* 8% of (energy + fixed) */
    double fuel_surcharge;         /* Fuel Cost Adjustment (FCA) */
    double green_rebate;           /* Rebate / prompt payment discount */
    double subtotal;
    double total_payable;
    
    char payment_status[16];       /* "Unpaid", "Paid", "Overdue" */
    char issue_date[16];
    char due_date[16];
    char bill_id[32];
} BillBreakdown;

typedef struct {
    char name[48];
    double watts;
    int quantity;
    double daily_hours;
    double monthly_kwh;
    double monthly_cost;
    double pct_of_bill;
} Appliance;

typedef struct {
    char appliance_name[48];
    double current_hours;
    double suggested_hours;
    double hours_reduced;
    double monthly_kwh_saved;
    double monthly_cost_saved;
    double annual_cost_saved;
    char tip[128];
} WhatIfScenario;

typedef struct {
    char bill_id[32];
    char month_name[24];
    int year;
    double units;
    double total_amount;
    char payment_status[16];
    char category[16];
} MonthlyRecord;

typedef struct {
    double predicted_units;
    double predicted_amount;
    double avg_3m_units;
    double avg_6m_units;
    char trend_direction[16];  /* "Increasing", "Stable", "Decreasing" */
    double pct_growth;
    char confidence[16];       /* "High", "Medium", "Moderate" */
    char reason[128];
} PredictionResult;

typedef struct {
    int is_over_budget;
    double budget;
    double current_bill;
    double pct_consumed;
    char alert_level[16];      /* "NORMAL", "CAUTION", "CRITICAL" */
    char message[256];
} BudgetAlert;

typedef struct {
    int is_anomaly;
    char severity[16];         /* "NONE", "MODERATE", "SEVERE" */
    double percent_above_avg;
    char reason[256];
    char suggested_action[256];
} AnomalyWarning;

typedef struct {
    char title[64];
    char impact[16];           /* "HIGH", "MEDIUM", "LOW" */
    double estimated_monthly_saving;
    char description[256];
    char category[32];         /* "Cooling", "Lighting", "Heating", "Behavior" */
} Recommendation;

#endif /* TYPES_H */
