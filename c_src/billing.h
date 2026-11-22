/**
 * Smart Electricity Bill Calculator Using C
 * billing.h - Billing and Tariff Calculations
 */

#ifndef BILLING_H
#define BILLING_H

#include "types.h"

void init_slabs(const char* category, const char* tariff_plan, Slab slabs[], int* num_slabs, double* fixed_charges);
void calculate_bill(const Customer* cust, const MeterData* meter, const char* tariff_plan, BillBreakdown* bill);
double calculate_raw_units_cost(double units, const char* category, const char* tariff_plan);

#endif /* BILLING_H */
