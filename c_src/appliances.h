/**
 * Smart Electricity Bill Calculator Using C
 * appliances.h - Appliance Energy Auditing and What-If Engine
 */

#ifndef APPLIANCES_H
#define APPLIANCES_H

#include "types.h"

void calculate_appliances(Appliance appliances[], int count, double avg_rate_per_kwh, double total_bill, double* out_total_app_kwh, double* out_total_app_cost);
void run_what_if_analysis(const Appliance appliances[], int count, double avg_rate_per_kwh, WhatIfScenario scenarios[], int* out_scenario_count);

#endif /* APPLIANCES_H */
