/**
 * Smart Electricity Bill Calculator Using C
 * main.c - CLI Driver, JSON API Bridge, and College Lab Demonstration System
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <math.h>

#include "types.h"
#include "billing.h"
#include "appliances.h"
#include "history.h"
#include "prediction.h"
#include "recommendations.h"

/* Helper to extract string from simple JSON key: "key": "value" */
static int extract_json_str(const char* json, const char* key, char* out, size_t max_len) {
    char pattern[64];
    snprintf(pattern, sizeof(pattern), "\"%s\"", key);
    const char* pos = strstr(json, pattern);
    if (!pos) return 0;
    
    pos = strchr(pos, ':');
    if (!pos) return 0;
    
    pos = strchr(pos, '\"');
    if (!pos) return 0;
    pos++; /* Skip opening quote */

    const char* end = strchr(pos, '\"');
    if (!end) return 0;

    size_t len = end - pos;
    if (len >= max_len) len = max_len - 1;
    strncpy(out, pos, len);
    out[len] = '\0';
    return 1;
}

/* Helper to extract number from simple JSON key: "key": 123.45 */
static int extract_json_num(const char* json, const char* key, double* out) {
    char pattern[64];
    snprintf(pattern, sizeof(pattern), "\"%s\"", key);
    const char* pos = strstr(json, pattern);
    if (!pos) return 0;

    pos = strchr(pos, ':');
    if (!pos) return 0;
    pos++;

    while (*pos && (isspace((unsigned char)*pos) || *pos == '\"')) pos++;
    *out = atof(pos);
    return 1;
}

/* Print complete bill, appliances, prediction, and recommendations as JSON */
static void output_full_json(
    const BillBreakdown* bill,
    const Appliance appliances[], int app_count,
    double total_app_kwh, double total_app_cost,
    const WhatIfScenario scenarios[], int scenario_count,
    const MonthlyRecord history[], int hist_count,
    const PredictionResult* pred,
    const BudgetAlert* alert,
    const AnomalyWarning* anomaly,
    const Recommendation recs[], int rec_count
) {
    printf("{\n");
    printf("  \"status\": \"success\",\n");
    printf("  \"engine\": \"C Native Binary (gcc -O2)\",\n");

    /* Bill Breakdown */
    printf("  \"bill\": {\n");
    printf("    \"billId\": \"%s\",\n", bill->bill_id);
    printf("    \"issueDate\": \"%s\",\n", bill->issue_date);
    printf("    \"dueDate\": \"%s\",\n", bill->due_date);
    printf("    \"paymentStatus\": \"%s\",\n", bill->payment_status);
    printf("    \"tariffPlan\": \"%s\",\n", bill->tariff_plan);
    printf("    \"customer\": {\n");
    printf("      \"name\": \"%s\",\n", bill->customer.name);
    printf("      \"consumerId\": \"%s\",\n", bill->customer.consumer_id);
    printf("      \"address\": \"%s\",\n", bill->customer.address);
    printf("      \"category\": \"%s\",\n", bill->customer.category);
    printf("      \"billingMonth\": \"%s\",\n", bill->customer.billing_month);
    printf("      \"budget\": %.2f\n", bill->customer.budget);
    printf("    },\n");
    printf("    \"meter\": {\n");
    printf("      \"prevReading\": %.2f,\n", bill->meter.prev_reading);
    printf("      \"currReading\": %.2f,\n", bill->meter.curr_reading);
    printf("      \"unitsConsumed\": %.2f,\n", bill->meter.units_consumed);
    printf("      \"isDirectUnits\": %s\n", bill->meter.is_direct_units ? "true" : "false");
    printf("    },\n");
    printf("    \"charges\": {\n");
    printf("      \"energyCharges\": %.2f,\n", bill->energy_charges);
    printf("      \"fixedCharges\": %.2f,\n", bill->fixed_charges);
    printf("      \"regulatorySurcharge\": %.2f,\n", bill->regulatory_surcharge);
    printf("      \"electricityDuty\": %.2f,\n", bill->electricity_duty);
    printf("      \"fuelSurcharge\": %.2f,\n", bill->fuel_surcharge);
    printf("      \"greenRebate\": %.2f,\n", bill->green_rebate);
    printf("      \"subtotal\": %.2f,\n", bill->subtotal);
    printf("      \"totalPayable\": %.2f\n", bill->total_payable);
    printf("    },\n");

    /* Slabs array */
    printf("    \"slabs\": [\n");
    for (int i = 0; i < bill->num_slabs; i++) {
        printf("      {\n");
        printf("        \"label\": \"%s\",\n", bill->slabs[i].label);
        printf("        \"min\": %.1f,\n", bill->slabs[i].min_units);
        printf("        \"max\": %.1f,\n", bill->slabs[i].max_units);
        printf("        \"rate\": %.2f,\n", bill->slabs[i].rate_per_unit);
        printf("        \"unitsInSlab\": %.2f,\n", bill->slabs[i].units_in_slab);
        printf("        \"amount\": %.2f\n", bill->slabs[i].amount);
        printf("      }%s\n", (i == bill->num_slabs - 1) ? "" : ",");
    }
    printf("    ]\n");
    printf("  },\n");

    /* Appliances Array */
    printf("  \"appliances\": {\n");
    printf("    \"totalKwh\": %.2f,\n", total_app_kwh);
    printf("    \"totalCost\": %.2f,\n", total_app_cost);
    printf("    \"items\": [\n");
    for (int i = 0; i < app_count; i++) {
        printf("      {\n");
        printf("        \"name\": \"%s\",\n", appliances[i].name);
        printf("        \"watts\": %.1f,\n", appliances[i].watts);
        printf("        \"quantity\": %d,\n", appliances[i].quantity);
        printf("        \"dailyHours\": %.1f,\n", appliances[i].daily_hours);
        printf("        \"monthlyKwh\": %.2f,\n", appliances[i].monthly_kwh);
        printf("        \"monthlyCost\": %.2f,\n", appliances[i].monthly_cost);
        printf("        \"pctOfBill\": %.1f\n", appliances[i].pct_of_bill);
        printf("      }%s\n", (i == app_count - 1) ? "" : ",");
    }
    printf("    ]\n");
    printf("  },\n");

    /* What-If Scenarios */
    printf("  \"whatIfScenarios\": [\n");
    for (int i = 0; i < scenario_count; i++) {
        printf("    {\n");
        printf("      \"appliance\": \"%s\",\n", scenarios[i].appliance_name);
        printf("      \"currentHours\": %.1f,\n", scenarios[i].current_hours);
        printf("      \"suggestedHours\": %.1f,\n", scenarios[i].suggested_hours);
        printf("      \"hoursReduced\": %.1f,\n", scenarios[i].hours_reduced);
        printf("      \"monthlyKwhSaved\": %.2f,\n", scenarios[i].monthly_kwh_saved);
        printf("      \"monthlyCostSaved\": %.2f,\n", scenarios[i].monthly_cost_saved);
        printf("      \"annualCostSaved\": %.2f,\n", scenarios[i].annual_cost_saved);
        printf("      \"tip\": \"%s\"\n", scenarios[i].tip);
        printf("    }%s\n", (i == scenario_count - 1) ? "" : ",");
    }
    printf("  ],\n");

    /* Monthly History */
    printf("  \"history\": [\n");
    for (int i = 0; i < hist_count; i++) {
        printf("    {\n");
        printf("      \"billId\": \"%s\",\n", history[i].bill_id);
        printf("      \"month\": \"%s\",\n", history[i].month_name);
        printf("      \"year\": %d,\n", history[i].year);
        printf("      \"dueDate\": \"%s\",\n", history[i].due_date);
        printf("      \"units\": %.2f,\n", history[i].units);
        printf("      \"amount\": %.2f,\n", history[i].total_amount);
        printf("      \"status\": \"%s\",\n", history[i].payment_status);
        printf("      \"category\": \"%s\"\n", history[i].category);
        printf("    }%s\n", (i == hist_count - 1) ? "" : ",");
    }
    printf("  ],\n");

    /* Prediction Result */
    printf("  \"prediction\": {\n");
    printf("    \"predictedUnits\": %.2f,\n", pred->predicted_units);
    printf("    \"predictedAmount\": %.2f,\n", pred->predicted_amount);
    printf("    \"avg3mUnits\": %.2f,\n", pred->avg_3m_units);
    printf("    \"avg6mUnits\": %.2f,\n", pred->avg_6m_units);
    printf("    \"trendDirection\": \"%s\",\n", pred->trend_direction);
    printf("    \"pctGrowth\": %.2f,\n", pred->pct_growth);
    printf("    \"confidence\": \"%s\",\n", pred->confidence);
    printf("    \"reason\": \"%s\"\n", pred->reason);
    printf("  },\n");

    /* Budget Alert */
    printf("  \"budgetAlert\": {\n");
    printf("    \"isOverBudget\": %s,\n", alert->is_over_budget ? "true" : "false");
    printf("    \"budget\": %.2f,\n", alert->budget);
    printf("    \"currentBill\": %.2f,\n", alert->current_bill);
    printf("    \"pctConsumed\": %.1f,\n", alert->pct_consumed);
    printf("    \"alertLevel\": \"%s\",\n", alert->alert_level);
    printf("    \"message\": \"%s\"\n", alert->message);
    printf("  },\n");

    /* Anomaly Warning */
    printf("  \"anomaly\": {\n");
    printf("    \"isAnomaly\": %s,\n", anomaly->is_anomaly ? "true" : "false");
    printf("    \"severity\": \"%s\",\n", anomaly->severity);
    printf("    \"percentAboveAvg\": %.1f,\n", anomaly->percent_above_avg);
    printf("    \"reason\": \"%s\",\n", anomaly->reason);
    printf("    \"suggestedAction\": \"%s\"\n", anomaly->suggested_action);
    printf("  },\n");

    /* Recommendations */
    printf("  \"recommendations\": [\n");
    for (int i = 0; i < rec_count; i++) {
        printf("    {\n");
        printf("      \"title\": \"%s\",\n", recs[i].title);
        printf("      \"impact\": \"%s\",\n", recs[i].impact);
        printf("      \"category\": \"%s\",\n", recs[i].category);
        printf("      \"monthlySaving\": %.2f,\n", recs[i].estimated_monthly_saving);
        printf("      \"description\": \"%s\"\n", recs[i].description);
        printf("    }%s\n", (i == rec_count - 1) ? "" : ",");
    }
    printf("  ]\n");

    printf("}\n");
}

/* Parse JSON input and execute computation pipeline */
static void handle_calculate_command(const char* json_input) {
    Customer cust = {
        "Shubham Sharma", "CN-894210", "Flat 402, Green Valley Apts, Sector 14",
        "Domestic", "November 2026", 2500.00
    };
    MeterData meter = { 4210.0, 4525.0, 315.0, 0 };
    char tariff_plan[32] = "Standard";

    extract_json_str(json_input, "customerName", cust.name, sizeof(cust.name));
    extract_json_str(json_input, "consumerId", cust.consumer_id, sizeof(cust.consumer_id));
    extract_json_str(json_input, "address", cust.address, sizeof(cust.address));
    extract_json_str(json_input, "category", cust.category, sizeof(cust.category));
    extract_json_str(json_input, "billingMonth", cust.billing_month, sizeof(cust.billing_month));
    extract_json_num(json_input, "budget", &cust.budget);

    extract_json_num(json_input, "prevReading", &meter.prev_reading);
    extract_json_num(json_input, "currReading", &meter.curr_reading);
    
    double direct_u = 0.0;
    if (extract_json_num(json_input, "unitsConsumed", &direct_u)) {
        if (direct_u >= 0.0) {
            meter.units_consumed = direct_u;
            meter.is_direct_units = 1;
        }
    }
    extract_json_str(json_input, "tariffPlan", tariff_plan, sizeof(tariff_plan));

    /* Parse Appliances */
    Appliance appliances[MAX_APPLIANCES];
    int app_count = 0;

    const char* app_array = strstr(json_input, "\"appliances\"");
    if (app_array) {
        const char* p = strchr(app_array, '[');
        const char* arr_end = p ? strchr(p, ']') : NULL;
        if (p && arr_end) {
            p++;
            while (*p && p < arr_end && app_count < MAX_APPLIANCES) {
                const char* obj_start = strchr(p, '{');
                if (!obj_start || obj_start > arr_end) break;
                const char* obj_end = strchr(obj_start, '}');
                if (!obj_end || obj_end > arr_end) break;

                char obj_str[512];
                size_t len = obj_end - obj_start + 1;
                if (len >= sizeof(obj_str)) len = sizeof(obj_str) - 1;
                strncpy(obj_str, obj_start, len);
                obj_str[len] = '\0';

                Appliance app = { "", 0.0, 1, 0.0, 0.0, 0.0, 0.0 };
                extract_json_str(obj_str, "name", app.name, sizeof(app.name));
                extract_json_num(obj_str, "watts", &app.watts);
                double qty = 1.0;
                extract_json_num(obj_str, "quantity", &qty);
                app.quantity = (int)qty;
                extract_json_num(obj_str, "dailyHours", &app.daily_hours);

                if (strlen(app.name) > 0 && app.watts > 0.0) {
                    appliances[app_count++] = app;
                }
                p = obj_end + 1;
            }
        }
    }

    /* If no appliances key provided in input, supply a realistic default load */
    if (!app_array && app_count == 0) {
        appliances[0] = (Appliance){ "Inverter AC", 1500.0, 1, 6.0, 0, 0, 0 };
        appliances[1] = (Appliance){ "Refrigerator", 250.0, 1, 14.0, 0, 0, 0 };
        appliances[2] = (Appliance){ "Fans", 75.0, 3, 10.0, 0, 0, 0 };
        appliances[3] = (Appliance){ "led bulbs", 12.0, 8, 6.0, 0, 0, 0 };
        appliances[4] = (Appliance){ "Water geyser", 2000.0, 1, 1.0, 0, 0, 0 };
        appliances[5] = (Appliance){ "Smart TV", 120.0, 1, 5.0, 0, 0, 0 };
        app_count = 6;
    }

    /* 1. Calculate Bill */
    BillBreakdown bill;
    calculate_bill(&cust, &meter, tariff_plan, &bill);

    /* 2. Calculate Appliances */
    double avg_kwh_rate = (bill.meter.units_consumed > 0.0) ? (bill.total_payable / bill.meter.units_consumed) : 6.80;
    double total_app_kwh = 0.0;
    double total_app_cost = 0.0;
    calculate_appliances(appliances, app_count, avg_kwh_rate, bill.total_payable, &total_app_kwh, &total_app_cost);

    /* 3. Run What-If Analysis */
    WhatIfScenario scenarios[MAX_WHAT_IF];
    int scenario_count = 0;
    run_what_if_analysis(appliances, app_count, avg_kwh_rate, scenarios, &scenario_count);

    /* 4. Load History */
    MonthlyRecord history[MAX_HISTORY];
    int hist_count = 0;
    load_monthly_records(history, MAX_HISTORY, &hist_count);

    /* 5. Predict Next Month */
    PredictionResult pred;
    predict_next_month(history, hist_count, cust.category, tariff_plan, &pred);

    /* 6. Check Budget Alert */
    BudgetAlert alert;
    check_budget_alert(cust.budget, bill.total_payable, &alert);

    /* 7. Anomaly Warning */
    AnomalyWarning anomaly;
    detect_anomaly(bill.meter.units_consumed, history, hist_count, &anomaly);

    /* 8. Generate Recommendations */
    Recommendation recs[MAX_RECOMMENDATIONS];
    int rec_count = 0;
    generate_recommendations(&cust, &bill.meter, appliances, app_count, bill.total_payable, recs, &rec_count);

    /* Output full JSON */
    output_full_json(&bill, appliances, app_count, total_app_kwh, total_app_cost,
                     scenarios, scenario_count, history, hist_count,
                     &pred, &alert, &anomaly, recs, rec_count);
}

/* Compare tariff plans (Standard vs Eco Green) for the given units and category */
static void handle_compare_tariffs_command(double units, const char* category) {
    const char* plans[] = {
        "Standard",
        "Eco Green"
    };
    int num_plans = 2;

    printf("{\n");
    printf("  \"status\": \"success\",\n");
    printf("  \"units\": %.2f,\n", units);
    printf("  \"category\": \"%s\",\n", category);
    printf("  \"comparison\": [\n");

    for (int i = 0; i < num_plans; i++) {
        Customer c = { "Comparison", "ID", "", "", "", 0.0 };
        strncpy(c.category, category, sizeof(c.category) - 1);
        MeterData m = { 0.0, units, units, 1 };
        BillBreakdown b;
        calculate_bill(&c, &m, plans[i], &b);

        printf("    {\n");
        printf("      \"planName\": \"%s\",\n", plans[i]);
        printf("      \"energyCharges\": %.2f,\n", b.energy_charges);
        printf("      \"fixedCharges\": %.2f,\n", b.fixed_charges);
        printf("      \"taxes\": %.2f,\n", b.regulatory_surcharge + b.electricity_duty + b.fuel_surcharge);
        printf("      \"rebate\": %.2f,\n", b.green_rebate);
        printf("      \"totalPayable\": %.2f,\n", b.total_payable);
        printf("      \"effectiveRatePerUnit\": %.2f\n", (units > 0) ? (b.total_payable / units) : 0.0);
        printf("    }%s\n", (i == num_plans - 1) ? "" : ",");
    }
    printf("  ]\n");
    printf("}\n");
}

/* Save a monthly bill record */
static void handle_save_command(const char* json_input) {
    MonthlyRecord record;
    memset(&record, 0, sizeof(MonthlyRecord));
    
    extract_json_str(json_input, "billId", record.bill_id, sizeof(record.bill_id));
    extract_json_str(json_input, "month", record.month_name, sizeof(record.month_name));
    double yr = 2026.0;
    extract_json_num(json_input, "year", &yr);
    record.year = (int)yr;
    extract_json_str(json_input, "dueDate", record.due_date, sizeof(record.due_date));
    if (strlen(record.due_date) == 0) {
        strncpy(record.due_date, "30-Nov-2026", sizeof(record.due_date) - 1);
    }
    extract_json_num(json_input, "units", &record.units);
    extract_json_num(json_input, "amount", &record.total_amount);
    extract_json_str(json_input, "status", record.payment_status, sizeof(record.payment_status));
    extract_json_str(json_input, "category", record.category, sizeof(record.category));

    if (strlen(record.bill_id) == 0) {
        snprintf(record.bill_id, sizeof(record.bill_id), "EB-%04d%02d-%04d",
                 record.year, 11, (int)(record.units + 3140) % 9000 + 1000);
    }
    if (strcasecmp(record.payment_status, "Paid") != 0) {
        printf("{\n");
        printf("  \"status\": \"error\",\n");
        printf("  \"message\": \"Only paid bills can be added to the Historical Billing & Payment Ledger.\"\n");
        printf("}\n");
        return;
    }

    int res = save_monthly_record(&record);
    printf("{\n");
    printf("  \"status\": \"%s\",\n", res ? "success" : "error");
    printf("  \"billId\": \"%s\",\n", record.bill_id);
    printf("  \"message\": \"%s\"\n",
           res ? "Paid bill record successfully persisted to C file storage (CSV & Binary Database)"
               : "Failed to persist paid bill record");
    printf("}\n");
}

/* Delete a monthly bill record from CSV & Binary DB */
static void handle_delete_command(const char* json_input) {
    char bill_id[32] = "";
    double row_index = -1.0;
    extract_json_str(json_input, "billId", bill_id, sizeof(bill_id));
    extract_json_num(json_input, "rowIndex", &row_index);

    int res = delete_monthly_record(bill_id, (int)row_index);
    printf("{\n");
    printf("  \"status\": \"%s\",\n", res ? "success" : "error");
    printf("  \"billId\": \"%s\",\n", bill_id);
    printf("  \"message\": \"%s\"\n",
           res ? "Paid bill record deleted from CSV and Binary Database."
               : "Record not found in storage.");
    printf("}\n");
}

/* History output */
static void handle_history_command(void) {
    MonthlyRecord records[MAX_HISTORY];
    int count = 0;
    load_monthly_records(records, MAX_HISTORY, &count);

    printf("{\n");
    printf("  \"status\": \"success\",\n");
    printf("  \"count\": %d,\n", count);
    printf("  \"records\": [\n");
    for (int i = 0; i < count; i++) {
        printf("    {\n");
        printf("      \"billId\": \"%s\",\n", records[i].bill_id);
        printf("      \"month\": \"%s\",\n", records[i].month_name);
        printf("      \"year\": %d,\n", records[i].year);
        printf("      \"dueDate\": \"%s\",\n", records[i].due_date);
        printf("      \"units\": %.2f,\n", records[i].units);
        printf("      \"amount\": %.2f,\n", records[i].total_amount);
        printf("      \"status\": \"%s\",\n", records[i].payment_status);
        printf("      \"category\": \"%s\"\n", records[i].category);
        printf("    }%s\n", (i == count - 1) ? "" : ",");
    }
    printf("  ]\n");
    printf("}\n");
}

/* Interactive College Demo Mode in C */
static void run_interactive_demo(void) {
    printf("===============================================================\n");
    printf("      SMART ELECTRICITY BILL CALCULATOR (C ENGINE)            \n");
    printf("       College Engineering Capstone Demonstration CLI          \n");
    printf("===============================================================\n");
    
    Customer cust = { "Arjun Verma", "CN-702319", "Flat 102, Sunrise Towers", "Domestic", "November 2026", 2400.00 };
    MeterData meter = { 2100.0, 2450.0, 350.0, 0 };
    BillBreakdown bill;

    calculate_bill(&cust, &meter, "Standard", &bill);

    printf("\n[CUSTOMER DETAILS]\n");
    printf("Name:         %s\n", cust.name);
    printf("Consumer ID:  %s\n", cust.consumer_id);
    printf("Address:      %s\n", cust.address);
    printf("Category:     %s\n", cust.category);
    printf("Budget:       Rs. %.2f\n", cust.budget);
    printf("Units Consumed: %.1f kWh (Prev: %.1f, Curr: %.1f)\n\n",
           bill.meter.units_consumed, meter.prev_reading, meter.curr_reading);

    printf("[SLAB-WISE BREAKDOWN]\n");
    printf("---------------------------------------------------------------\n");
    printf(" Slab Range          Rate/Unit   Units in Slab   Amount (Rs.)  \n");
    printf("---------------------------------------------------------------\n");
    for (int i = 0; i < bill.num_slabs; i++) {
        printf(" %-18s  Rs.%-7.2f  %-13.1f   Rs.%-11.2f\n",
               bill.slabs[i].label, bill.slabs[i].rate_per_unit,
               bill.slabs[i].units_in_slab, bill.slabs[i].amount);
    }
    printf("---------------------------------------------------------------\n");
    printf(" Energy Charges:        Rs. %.2f\n", bill.energy_charges);
    printf(" Fixed Charges:         Rs. %.2f\n", bill.fixed_charges);
    printf(" Regulatory Surcharge:  Rs. %.2f\n", bill.regulatory_surcharge);
    printf(" Electricity Duty (8%%): Rs. %.2f\n", bill.electricity_duty);
    printf(" Fuel Surcharge (FCA):  Rs. %.2f\n", bill.fuel_surcharge);
    printf(" Green/Prompt Rebate:  -Rs. %.2f\n", bill.green_rebate);
    printf("---------------------------------------------------------------\n");
    printf(" TOTAL PAYABLE:         Rs. %.2f\n", bill.total_payable);
    printf(" Due Date:              %s\n", bill.due_date);
    printf(" Status:                %s\n", bill.payment_status);
    printf("===============================================================\n");
}

int main(int argc, char* argv[]) {
    ensure_data_directory();
    seed_sample_history_if_needed();

    if (argc < 2) {
        /* Default to demo */
        run_interactive_demo();
        return 0;
    }

    if (strcmp(argv[1], "--demo") == 0 || strcmp(argv[1], "--cli") == 0) {
        run_interactive_demo();
        return 0;
    } else if (strcmp(argv[1], "--history") == 0) {
        handle_history_command();
        return 0;
    } else if (strcmp(argv[1], "--compare-tariffs") == 0) {
        double units = (argc >= 3) ? atof(argv[2]) : 300.0;
        const char* cat = (argc >= 4) ? argv[3] : "Domestic";
        handle_compare_tariffs_command(units, cat);
        return 0;
    } else if (strcmp(argv[1], "--save") == 0) {
        if (argc >= 3) {
            handle_save_command(argv[2]);
        } else {
            char buffer[4096];
            size_t bytes = fread(buffer, 1, sizeof(buffer) - 1, stdin);
            buffer[bytes] = '\0';
            handle_save_command(buffer);
        }
        return 0;
    } else if (strcmp(argv[1], "--delete") == 0) {
        if (argc >= 3) {
            handle_delete_command(argv[2]);
        } else {
            char buffer[4096];
            size_t bytes = fread(buffer, 1, sizeof(buffer) - 1, stdin);
            buffer[bytes] = '\0';
            handle_delete_command(buffer);
        }
        return 0;
    } else if (strcmp(argv[1], "--calculate") == 0) {
        if (argc >= 3) {
            handle_calculate_command(argv[2]);
        } else {
            char buffer[8192];
            size_t bytes = fread(buffer, 1, sizeof(buffer) - 1, stdin);
            buffer[bytes] = '\0';
            handle_calculate_command(buffer);
        }
        return 0;
    }

    fprintf(stderr, "Unknown option: %s\n", argv[1]);
    return 1;
}
