/**
 * Smart Electricity Bill Calculator Using C
 * appliances.c - Appliance-Wise Consumption and What-If Calculations
 */

#include <stdio.h>
#include <string.h>
#include "appliances.h"

void calculate_appliances(Appliance appliances[], int count, double avg_rate_per_kwh, double total_bill, double* out_total_app_kwh, double* out_total_app_cost) {
    double total_kwh = 0.0;
    double total_cost = 0.0;

    for (int i = 0; i < count; i++) {
        /* kWh = (Watts * Quantity * Hours/day * 30 days) / 1000 */
        appliances[i].monthly_kwh = (appliances[i].watts * appliances[i].quantity * appliances[i].daily_hours * 30.0) / 1000.0;
        appliances[i].monthly_cost = appliances[i].monthly_kwh * avg_rate_per_kwh;
        
        total_kwh += appliances[i].monthly_kwh;
        total_cost += appliances[i].monthly_cost;
    }

    /* Compute percentage contribution */
    double denominator = (total_bill > 0.0) ? total_bill : total_cost;
    for (int i = 0; i < count; i++) {
        if (denominator > 0.0) {
            appliances[i].pct_of_bill = (appliances[i].monthly_cost / denominator) * 100.0;
        } else {
            appliances[i].pct_of_bill = 0.0;
        }
    }

    if (out_total_app_kwh) *out_total_app_kwh = total_kwh;
    if (out_total_app_cost) *out_total_app_cost = total_cost;
}

void run_what_if_analysis(const Appliance appliances[], int count, double avg_rate_per_kwh, WhatIfScenario scenarios[], int* out_scenario_count) {
    int sc_idx = 0;

    for (int i = 0; i < count && sc_idx < MAX_WHAT_IF; i++) {
        const Appliance* app = &appliances[i];
        
        /* Evaluate reducing by 1 hour */
        if (app->daily_hours >= 1.5) {
            double red1 = 1.0;
            double kwh_saved1 = (app->watts * app->quantity * red1 * 30.0) / 1000.0;
            double cost_saved1 = kwh_saved1 * avg_rate_per_kwh;

            strncpy(scenarios[sc_idx].appliance_name, app->name, sizeof(scenarios[sc_idx].appliance_name) - 1);
            scenarios[sc_idx].current_hours = app->daily_hours;
            scenarios[sc_idx].hours_reduced = red1;
            scenarios[sc_idx].suggested_hours = app->daily_hours - red1;
            scenarios[sc_idx].monthly_kwh_saved = kwh_saved1;
            scenarios[sc_idx].monthly_cost_saved = cost_saved1;
            scenarios[sc_idx].annual_cost_saved = cost_saved1 * 12.0;
            snprintf(scenarios[sc_idx].tip, sizeof(scenarios[sc_idx].tip),
                     "Reduce %s daily usage by 1 hour (from %.1fh to %.1fh)",
                     app->name, app->daily_hours, app->daily_hours - red1);
            sc_idx++;
        }

        /* Evaluate reducing by 2 hours for high-usage appliances */
        if (app->daily_hours >= 3.5 && sc_idx < MAX_WHAT_IF) {
            double red2 = 2.0;
            double kwh_saved2 = (app->watts * app->quantity * red2 * 30.0) / 1000.0;
            double cost_saved2 = kwh_saved2 * avg_rate_per_kwh;

            strncpy(scenarios[sc_idx].appliance_name, app->name, sizeof(scenarios[sc_idx].appliance_name) - 1);
            scenarios[sc_idx].current_hours = app->daily_hours;
            scenarios[sc_idx].hours_reduced = red2;
            scenarios[sc_idx].suggested_hours = app->daily_hours - red2;
            scenarios[sc_idx].monthly_kwh_saved = kwh_saved2;
            scenarios[sc_idx].monthly_cost_saved = cost_saved2;
            scenarios[sc_idx].annual_cost_saved = cost_saved2 * 12.0;
            snprintf(scenarios[sc_idx].tip, sizeof(scenarios[sc_idx].tip),
                     "Trim %s run-time by 2 hours daily via timer or power scheduling",
                     app->name);
            sc_idx++;
        }
    }

    *out_scenario_count = sc_idx;
}
