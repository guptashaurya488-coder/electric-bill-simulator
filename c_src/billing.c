/**
 * Smart Electricity Bill Calculator Using C
 * billing.c - Core Billing Logic, Slabs, Taxes, Surcharges
 */

#define _GNU_SOURCE
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <math.h>
#include "billing.h"

void init_slabs(const char* category, const char* tariff_plan, Slab slabs[], int* num_slabs, double* fixed_charges) {
    int is_commercial = (strcasecmp(category, "Commercial") == 0);
    int is_eco = (strcasestr(tariff_plan, "Eco") != NULL || strcasestr(tariff_plan, "Green") != NULL);
    int is_tou = (strcasestr(tariff_plan, "Time") != NULL || strcasestr(tariff_plan, "ToU") != NULL);

    if (is_commercial) {
        if (is_eco) {
            /* Commercial Eco Green */
            *num_slabs = 4;
            *fixed_charges = 220.00;
            
            slabs[0] = (Slab){ 0.0, 150.0, 6.60, 0.0, 0.0, "0 - 150 Units" };
            slabs[1] = (Slab){ 150.0, 300.0, 9.10, 0.0, 0.0, "151 - 300 Units" };
            slabs[2] = (Slab){ 300.0, 500.0, 11.50, 0.0, 0.0, "301 - 500 Units" };
            slabs[3] = (Slab){ 500.0, 999999.0, 14.50, 0.0, 0.0, "> 500 Units" };
        } else if (strcasestr(tariff_plan, "High") != NULL) {
            /* Commercial High Demand */
            *num_slabs = 4;
            *fixed_charges = 450.00;
            
            slabs[0] = (Slab){ 0.0, 150.0, 6.50, 0.0, 0.0, "0 - 150 Units" };
            slabs[1] = (Slab){ 150.0, 300.0, 9.00, 0.0, 0.0, "151 - 300 Units" };
            slabs[2] = (Slab){ 300.0, 500.0, 11.50, 0.0, 0.0, "301 - 500 Units" };
            slabs[3] = (Slab){ 500.0, 999999.0, 14.50, 0.0, 0.0, "> 500 Units" };
        } else {
            /* Commercial Standard */
            *num_slabs = 4;
            *fixed_charges = 250.00;
            
            slabs[0] = (Slab){ 0.0, 150.0, 7.00, 0.0, 0.0, "0 - 150 Units" };
            slabs[1] = (Slab){ 150.0, 300.0, 9.50, 0.0, 0.0, "151 - 300 Units" };
            slabs[2] = (Slab){ 300.0, 500.0, 12.00, 0.0, 0.0, "301 - 500 Units" };
            slabs[3] = (Slab){ 500.0, 999999.0, 15.00, 0.0, 0.0, "> 500 Units" };
        }
    } else {
        /* Domestic */
        if (is_eco) {
            /* Domestic Eco Green */
            *num_slabs = 4;
            *fixed_charges = 70.00;
            
            slabs[0] = (Slab){ 0.0, 100.0, 3.20, 0.0, 0.0, "0 - 100 Units" };
            slabs[1] = (Slab){ 100.0, 200.0, 4.90, 0.0, 0.0, "101 - 200 Units" };
            slabs[2] = (Slab){ 200.0, 400.0, 7.10, 0.0, 0.0, "201 - 400 Units" };
            slabs[3] = (Slab){ 400.0, 999999.0, 9.40, 0.0, 0.0, "> 400 Units" };
        } else if (is_tou) {
            /* Domestic Time-of-Use */
            *num_slabs = 4;
            *fixed_charges = 95.00;
            
            slabs[0] = (Slab){ 0.0, 100.0, 3.30, 0.0, 0.0, "0 - 100 Units" };
            slabs[1] = (Slab){ 100.0, 200.0, 5.00, 0.0, 0.0, "101 - 200 Units" };
            slabs[2] = (Slab){ 200.0, 400.0, 7.30, 0.0, 0.0, "201 - 400 Units" };
            slabs[3] = (Slab){ 400.0, 999999.0, 9.60, 0.0, 0.0, "> 400 Units" };
        } else {
            /* Domestic Standard */
            *num_slabs = 4;
            *fixed_charges = 85.00;
            
            slabs[0] = (Slab){ 0.0, 100.0, 3.50, 0.0, 0.0, "0 - 100 Units" };
            slabs[1] = (Slab){ 100.0, 200.0, 5.20, 0.0, 0.0, "101 - 200 Units" };
            slabs[2] = (Slab){ 200.0, 400.0, 7.50, 0.0, 0.0, "201 - 400 Units" };
            slabs[3] = (Slab){ 400.0, 999999.0, 9.80, 0.0, 0.0, "> 400 Units" };
        }
    }
}

void calculate_bill(const Customer* cust, const MeterData* meter, const char* tariff_plan, BillBreakdown* bill) {
    memset(bill, 0, sizeof(BillBreakdown));
    bill->customer = *cust;
    bill->meter = *meter;
    strncpy(bill->tariff_plan, tariff_plan, sizeof(bill->tariff_plan) - 1);

    /* Determine total units */
    double units = meter->units_consumed;
    if (!meter->is_direct_units) {
        if (meter->curr_reading >= meter->prev_reading) {
            units = meter->curr_reading - meter->prev_reading;
        } else {
            /* Meter rollover at 100000 */
            units = (100000.0 - meter->prev_reading) + meter->curr_reading;
        }
    }
    if (units < 0.0) units = 0.0;
    bill->meter.units_consumed = units;

    /* Initialize tariff slabs */
    init_slabs(cust->category, tariff_plan, bill->slabs, &bill->num_slabs, &bill->fixed_charges);

    /* Calculate slab-wise energy charges */
    double remaining = units;
    double total_energy = 0.0;

    for (int i = 0; i < bill->num_slabs; i++) {
        double slab_capacity = bill->slabs[i].max_units - bill->slabs[i].min_units;
        if (remaining > 0.0) {
            double units_in_this_slab = (remaining > slab_capacity) ? slab_capacity : remaining;
            bill->slabs[i].units_in_slab = units_in_this_slab;
            bill->slabs[i].amount = units_in_this_slab * bill->slabs[i].rate_per_unit;
            total_energy += bill->slabs[i].amount;
            remaining -= units_in_this_slab;
        } else {
            bill->slabs[i].units_in_slab = 0.0;
            bill->slabs[i].amount = 0.0;
        }
    }
    bill->energy_charges = total_energy;

    /* Additional fees and statutory taxes */
    /* 1. Regulatory Surcharge = 5.0% of Energy Charges */
    bill->regulatory_surcharge = total_energy * 0.050;

    /* 2. Electricity Duty (Tax) = 8.0% of (Energy Charges + Fixed Charges) */
    bill->electricity_duty = (total_energy + bill->fixed_charges) * 0.080;

    /* 3. Fuel Cost Adjustment (FCA / Surcharge) = 0.35 per unit consumed */
    bill->fuel_surcharge = units * 0.35;

    /* 4. Green / Prompt Payment Rebate */
    int is_eco = (strcasestr(tariff_plan, "Eco") != NULL || strcasestr(tariff_plan, "Green") != NULL);
    if (is_eco) {
        bill->green_rebate = total_energy * 0.050; /* 5% clean energy incentive */
    } else {
        bill->green_rebate = (total_energy + bill->fixed_charges) * 0.020; /* 2% prompt payment discount */
    }

    bill->subtotal = bill->energy_charges + bill->fixed_charges + bill->regulatory_surcharge + bill->electricity_duty + bill->fuel_surcharge;
    bill->total_payable = bill->subtotal - bill->green_rebate;
    if (bill->total_payable < 0.0) bill->total_payable = 0.0;

    /* Default dates and status */
    strncpy(bill->payment_status, "Unpaid", sizeof(bill->payment_status) - 1);
    
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    strftime(bill->issue_date, sizeof(bill->issue_date), "%d-%b-%Y", t);
    
    /* Due date = 15 days later */
    time_t due_time = now + (15 * 86400);
    struct tm *due_t = localtime(&due_time);
    strftime(bill->due_date, sizeof(bill->due_date), "%d-%b-%Y", due_t);

    /* Generate Bill ID e.g., EB-202611-XXXX */
    snprintf(bill->bill_id, sizeof(bill->bill_id), "EB-%04d%02d-%04d", 
             t->tm_year + 1900, t->tm_mon + 1, (int)(units + 1042) % 9000 + 1000);
}

double calculate_raw_units_cost(double units, const char* category, const char* tariff_plan) {
    Customer temp_cust = { "Test", "ID001", "Loc", "", "", 0.0 };
    strncpy(temp_cust.category, category, sizeof(temp_cust.category) - 1);
    MeterData temp_meter = { 0.0, units, units, 1 };
    BillBreakdown temp_bill;
    calculate_bill(&temp_cust, &temp_meter, tariff_plan, &temp_bill);
    return temp_bill.total_payable;
}
