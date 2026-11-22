/**
 * Smart Electricity Bill Calculator Using C
 * recommendations.c - Rule-Based Expert System for Tailored Power Savings
 */

#define _GNU_SOURCE
#include <stdio.h>
#include <string.h>
#include "recommendations.h"

void generate_recommendations(const Customer* cust, const MeterData* meter, const Appliance appliances[], int app_count, double total_bill, Recommendation recs[], int* out_rec_count) {
    (void)cust;
    int count = 0;
    double units = meter->units_consumed;

    /* Detect specific appliances */
    int has_ac = 0;
    int has_geyser = 0;
    int has_refrigerator = 0;
    double ac_kwh = 0.0;
    double ac_cost = 0.0;

    for (int i = 0; i < app_count; i++) {
        if (strcasestr(appliances[i].name, "AC") || strcasestr(appliances[i].name, "Air Conditioner") || strcasestr(appliances[i].name, "Cooler")) {
            has_ac = 1;
            ac_kwh += appliances[i].monthly_kwh;
            ac_cost += appliances[i].monthly_cost;
        }
        if (strcasestr(appliances[i].name, "Geyser") || strcasestr(appliances[i].name, "Heater")) {
            has_geyser = 1;
        }
        if (strcasestr(appliances[i].name, "Fridge") || strcasestr(appliances[i].name, "Refrigerator")) {
            has_refrigerator = 1;
        }
    }

    /* 1. AC / Cooling Strategy */
    if (has_ac || units > 250.0) {
        recs[count].estimated_monthly_saving = (ac_cost > 0.0) ? (ac_cost * 0.22) : (total_bill * 0.15);
        strncpy(recs[count].title, "Optimize AC Thermostat to 24°C", sizeof(recs[count].title) - 1);
        strncpy(recs[count].impact, "HIGH", sizeof(recs[count].impact) - 1);
        strncpy(recs[count].category, "Cooling", sizeof(recs[count].category) - 1);
        snprintf(recs[count].description, sizeof(recs[count].description),
                 "Setting your air conditioner from 18°C-20°C to 24°C reduces compressor runtime by ~24%% without compromising comfort. Estimated saving: %.2f/month.",
                 recs[count].estimated_monthly_saving);
        count++;
    }

    /* 2. Water Heater / Geyser */
    if (has_geyser || units > 180.0) {
        recs[count].estimated_monthly_saving = (total_bill * 0.10);
        if (recs[count].estimated_monthly_saving < 120.0) recs[count].estimated_monthly_saving = 180.0;
        strncpy(recs[count].title, "Install Water Heater Timer & Lower Cutoff to 50°C", sizeof(recs[count].title) - 1);
        strncpy(recs[count].impact, "HIGH", sizeof(recs[count].impact) - 1);
        strncpy(recs[count].category, "Heating", sizeof(recs[count].category) - 1);
        snprintf(recs[count].description, sizeof(recs[count].description),
                 "Geysers draw 2000-3000W and suffer continuous thermal leakage if left on. Running for only 20 mins prior to bathing saves ~%.2f/month.",
                 recs[count].estimated_monthly_saving);
        count++;
    }

    /* 3. LED Lighting Upgrade */
    recs[count].estimated_monthly_saving = (total_bill * 0.07);
    if (recs[count].estimated_monthly_saving < 80.0) recs[count].estimated_monthly_saving = 110.0;
    strncpy(recs[count].title, "Retrofit 9W BEE 5-Star LED Fixtures", sizeof(recs[count].title) - 1);
    strncpy(recs[count].impact, "MEDIUM", sizeof(recs[count].impact) - 1);
    strncpy(recs[count].category, "Lighting", sizeof(recs[count].category) - 1);
    snprintf(recs[count].description, sizeof(recs[count].description),
             "Replacing older CFLs or tube lights with 9W LEDs cuts lighting power by 75%% and lowers internal heat generation, saving ~%.2f/month.",
             recs[count].estimated_monthly_saving);
    count++;

    /* 4. Phantom / Standby Power Elimination */
    recs[count].estimated_monthly_saving = (total_bill * 0.05);
    if (recs[count].estimated_monthly_saving < 50.0) recs[count].estimated_monthly_saving = 75.0;
    strncpy(recs[count].title, "Eliminate Vampire Standby Power Loads", sizeof(recs[count].title) - 1);
    strncpy(recs[count].impact, "MEDIUM", sizeof(recs[count].impact) - 1);
    strncpy(recs[count].category, "Behavior", sizeof(recs[count].category) - 1);
    snprintf(recs[count].description, sizeof(recs[count].description),
             "Televisions, microwave clocks, chargers, and set-top boxes draw 5-15W even on standby. Powering off at wall sockets saves ~%.2f/month.",
             recs[count].estimated_monthly_saving);
    count++;

    /* 5. Refrigerator Coil Maintenance */
    if (has_refrigerator || count < MAX_RECOMMENDATIONS) {
        recs[count].estimated_monthly_saving = (total_bill * 0.04);
        if (recs[count].estimated_monthly_saving < 40.0) recs[count].estimated_monthly_saving = 65.0;
        strncpy(recs[count].title, "Clean Refrigerator Heat Exchange Coils", sizeof(recs[count].title) - 1);
        strncpy(recs[count].impact, "LOW", sizeof(recs[count].impact) - 1);
        strncpy(recs[count].category, "Cooling", sizeof(recs[count].category) - 1);
        snprintf(recs[count].description, sizeof(recs[count].description),
                 "Leaving 3-inch wall clearance and brushing dust off rear condenser coils improves heat dissipation, cutting compressor duty cycles by 8%% (~%.2f/month).",
                 recs[count].estimated_monthly_saving);
        count++;
    }

    /* 6. Tariff / Solar Net-Metering suggestion */
    if (units > 350.0 && count < MAX_RECOMMENDATIONS) {
        recs[count].estimated_monthly_saving = (total_bill * 0.35);
        strncpy(recs[count].title, "Adopt Rooftop Solar Net-Metering or Green Tariff", sizeof(recs[count].title) - 1);
        strncpy(recs[count].impact, "HIGH", sizeof(recs[count].impact) - 1);
        strncpy(recs[count].category, "Tariff", sizeof(recs[count].category) - 1);
        snprintf(recs[count].description, sizeof(recs[count].description),
                 "Your high consumption slab (>350 units) falls into tier-3 and tier-4 rates. A 2kW rooftop solar array can offset over 65%% of monthly grid draw, saving ~%.2f/month.",
                 recs[count].estimated_monthly_saving);
        count++;
    }

    *out_rec_count = count;
}
