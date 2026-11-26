/**
 * Smart Electricity Bill Calculator Using C
 * history.c - C File Handling (fopen, fread, fwrite), Anomaly Detection & Budget Monitoring
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include "history.h"

void ensure_data_directory(void) {
    struct stat st = {0};
    if (stat("data", &st) == -1) {
        mkdir("data", 0777);
    }
}

void seed_sample_history_if_needed(void) {
    ensure_data_directory();
    FILE* fp = fopen(HISTORY_FILE_CSV, "r");
    if (fp != NULL) {
        fclose(fp);
        return; /* Already initialized */
    }

    /* Seed passed months (August - October 2026) with due dates */
    MonthlyRecord samples[3] = {
        { "EB-202608-3420", "August 2026", 2026, "15-Sep-2026", 340.0, 2340.30, "Paid", "Domestic" },
        { "EB-202609-2950", "September 2026", 2026, "15-Oct-2026", 295.0, 1949.93, "Paid", "Domestic" },
        { "EB-202610-2800", "October 2026", 2026, "15-Nov-2026", 280.0, 1819.80, "Paid", "Domestic" }
    };

    /* Write CSV with due_date column */
    FILE* csv_fp = fopen(HISTORY_FILE_CSV, "w");
    if (csv_fp) {
        fprintf(csv_fp, "bill_id,month_name,year,due_date,units,total_amount,payment_status,category\n");
        for (int i = 0; i < 3; i++) {
            fprintf(csv_fp, "%s,%s,%d,%s,%.2f,%.2f,%s,%s\n",
                    samples[i].bill_id,
                    samples[i].month_name,
                    samples[i].year,
                    samples[i].due_date,
                    samples[i].units,
                    samples[i].total_amount,
                    samples[i].payment_status,
                    samples[i].category);
        }
        fclose(csv_fp);
    }

    /* Write Binary DB */
    FILE* bin_fp = fopen(HISTORY_FILE_BIN, "wb");
    if (bin_fp) {
        fwrite(samples, sizeof(MonthlyRecord), 3, bin_fp);
        fclose(bin_fp);
    }
}

int save_monthly_record(const MonthlyRecord* record) {
    /* Only record bills that have actually been paid */
    if (strcasecmp(record->payment_status, "Paid") != 0) {
        return 0;
    }

    ensure_data_directory();

    /* Append to CSV */
    FILE* csv_fp = fopen(HISTORY_FILE_CSV, "a");
    if (!csv_fp) {
        /* File didn't exist, create with header */
        csv_fp = fopen(HISTORY_FILE_CSV, "w");
        if (csv_fp) {
            fprintf(csv_fp, "bill_id,month_name,year,due_date,units,total_amount,payment_status,category\n");
        }
    }
    if (csv_fp) {
        fprintf(csv_fp, "%s,%s,%d,%s,%.2f,%.2f,%s,%s\n",
                record->bill_id,
                record->month_name,
                record->year,
                strlen(record->due_date) > 0 ? record->due_date : "30-Nov-2026",
                record->units,
                record->total_amount,
                record->payment_status,
                record->category);
        fclose(csv_fp);
    }

    /* Append to Binary DB using fwrite */
    FILE* bin_fp = fopen(HISTORY_FILE_BIN, "ab");
    if (bin_fp) {
        fwrite(record, sizeof(MonthlyRecord), 1, bin_fp);
        fclose(bin_fp);
    }

    return 1;
}

int delete_monthly_record(const char* bill_id, int row_index) {
    if (!bill_id || strlen(bill_id) == 0) {
        return 0;
    }

    MonthlyRecord records[MAX_HISTORY];
    int count = 0;
    load_monthly_records(records, MAX_HISTORY, &count);

    int target_idx = -1;
    if (row_index >= 0 && row_index < count && strcmp(records[row_index].bill_id, bill_id) == 0) {
        target_idx = row_index;
    } else {
        for (int i = 0; i < count; i++) {
            if (strcmp(records[i].bill_id, bill_id) == 0) {
                target_idx = i;
                break;
            }
        }
    }

    if (target_idx == -1) {
        return 0;
    }

    MonthlyRecord remaining[MAX_HISTORY];
    int new_count = 0;
    for (int i = 0; i < count; i++) {
        if (i != target_idx) {
            remaining[new_count++] = records[i];
        }
    }

    ensure_data_directory();

    /* Rewrite CSV keeping header so deleted state persists even if empty */
    FILE* csv_fp = fopen(HISTORY_FILE_CSV, "w");
    if (!csv_fp) {
        return 0;
    }
    fprintf(csv_fp, "bill_id,month_name,year,due_date,units,total_amount,payment_status,category\n");
    for (int i = 0; i < new_count; i++) {
        fprintf(csv_fp, "%s,%s,%d,%s,%.2f,%.2f,%s,%s\n",
                remaining[i].bill_id,
                remaining[i].month_name,
                remaining[i].year,
                strlen(remaining[i].due_date) > 0 ? remaining[i].due_date : "30-Nov-2026",
                remaining[i].units,
                remaining[i].total_amount,
                remaining[i].payment_status,
                remaining[i].category);
    }
    fclose(csv_fp);

    /* Rewrite Binary DB with remaining records to reclaim storage */
    FILE* bin_fp = fopen(HISTORY_FILE_BIN, "wb");
    if (bin_fp) {
        if (new_count > 0) {
            fwrite(remaining, sizeof(MonthlyRecord), (size_t)new_count, bin_fp);
        }
        fclose(bin_fp);
    }

    return 1;
}

int load_monthly_records(MonthlyRecord records[], int max_records, int* out_count) {
    ensure_data_directory();
    seed_sample_history_if_needed();

    int count = 0;
    FILE* csv_fp = fopen(HISTORY_FILE_CSV, "r");
    if (!csv_fp) {
        *out_count = 0;
        return 0;
    }

    char line[512];
    /* Skip header line */
    if (fgets(line, sizeof(line), csv_fp) != NULL) {
        while (fgets(line, sizeof(line), csv_fp) != NULL && count < max_records) {
            MonthlyRecord r;
            memset(&r, 0, sizeof(MonthlyRecord));
            
            char* token = strtok(line, ",\n\r");
            if (token) strncpy(r.bill_id, token, sizeof(r.bill_id) - 1);
            
            token = strtok(NULL, ",\n\r");
            if (token) strncpy(r.month_name, token, sizeof(r.month_name) - 1);
            
            token = strtok(NULL, ",\n\r");
            if (token) r.year = atoi(token);

            token = strtok(NULL, ",\n\r");
            if (token) strncpy(r.due_date, token, sizeof(r.due_date) - 1);
            
            token = strtok(NULL, ",\n\r");
            if (token) r.units = atof(token);
            
            token = strtok(NULL, ",\n\r");
            if (token) r.total_amount = atof(token);
            
            token = strtok(NULL, ",\n\r");
            if (token) strncpy(r.payment_status, token, sizeof(r.payment_status) - 1);
            
            token = strtok(NULL, ",\n\r");
            if (token) strncpy(r.category, token, sizeof(r.category) - 1);

            if (strlen(r.bill_id) > 0 && strcasecmp(r.payment_status, "Paid") == 0) {
                records[count++] = r;
            }
        }
    }
    fclose(csv_fp);

    *out_count = count;
    return count;
}

void check_budget_alert(double budget, double current_bill, BudgetAlert* alert) {
    memset(alert, 0, sizeof(BudgetAlert));
    alert->budget = budget;
    alert->current_bill = current_bill;

    if (budget <= 0.0) {
        alert->is_over_budget = 0;
        alert->pct_consumed = 0.0;
        strcpy(alert->alert_level, "NORMAL");
        snprintf(alert->message, sizeof(alert->message),
                 "No budget cap configured. Set a monthly budget to monitor savings targets.");
        return;
    }

    alert->pct_consumed = (current_bill / budget) * 100.0;

    if (current_bill > budget) {
        alert->is_over_budget = 1;
        strcpy(alert->alert_level, "CRITICAL");
        double excess = current_bill - budget;
        snprintf(alert->message, sizeof(alert->message),
                 "CRITICAL: Current estimated bill (%.2f) exceeds monthly budget limit (%.2f) by %.2f.",
                 current_bill, budget, excess);
    } else if (alert->pct_consumed >= 85.0) {
        alert->is_over_budget = 0;
        strcpy(alert->alert_level, "CAUTION");
        snprintf(alert->message, sizeof(alert->message),
                 "CAUTION: Current bill has reached %.1f%% of your monthly budget (%.2f / %.2f). Only %.2f cushion remaining.",
                 alert->pct_consumed, current_bill, budget, budget - current_bill);
    } else {
        alert->is_over_budget = 0;
        strcpy(alert->alert_level, "NORMAL");
        snprintf(alert->message, sizeof(alert->message),
                 "Optimal: Bill is within budget. (%.1f%% utilized, %.2f remaining headroom).",
                 alert->pct_consumed, budget - current_bill);
    }
}

void detect_anomaly(double current_units, const MonthlyRecord history[], int count, AnomalyWarning* warning) {
    memset(warning, 0, sizeof(AnomalyWarning));
    strcpy(warning->severity, "NONE");

    if (count < 2) {
        warning->is_anomaly = 0;
        snprintf(warning->reason, sizeof(warning->reason),
                 "Insufficient historical data points for statistical anomaly detection.");
        strcpy(warning->suggested_action, "Continue logging monthly billing records to establish a reliable baseline.");
        return;
    }

    /* Compute recent 3-month moving average */
    int sample_size = (count >= 3) ? 3 : count;
    double sum = 0.0;
    for (int i = count - sample_size; i < count; i++) {
        sum += history[i].units;
    }
    double avg = sum / (double)sample_size;

    if (avg <= 0.0) avg = 1.0;
    double ratio = current_units / avg;
    double pct_diff = (ratio - 1.0) * 100.0;
    warning->percent_above_avg = pct_diff;

    if (ratio >= 1.45) {
        /* Severe surge: > 45% above recent average */
        warning->is_anomaly = 1;
        strcpy(warning->severity, "SEVERE");
        snprintf(warning->reason, sizeof(warning->reason),
                 "ABNORMAL USAGE SURGE: Current consumption of %.1f units is %.1f%% higher than your 3-month baseline average of %.1f units.",
                 current_units, pct_diff, avg);
        snprintf(warning->suggested_action, sizeof(warning->suggested_action),
                 "Check for continuous water heater running, HVAC refrigerant leaks, submersible motor jamming, or earthing leakage.");
    } else if (ratio >= 1.25) {
        /* Moderate spike: 25% - 44% above average */
        warning->is_anomaly = 1;
        strcpy(warning->severity, "MODERATE");
        snprintf(warning->reason, sizeof(warning->reason),
                 "NOTICEABLE USAGE SPIKE: Consumption is %.1f%% above your recent 3-month average of %.1f units.",
                 pct_diff, avg);
        snprintf(warning->suggested_action, sizeof(warning->suggested_action),
                 "Audit recent appliance duty cycles (longer AC hours, seasonal room heater usage, or added guest load).");
    } else if (ratio <= 0.50 && current_units > 0.0) {
        /* Unusually low usage */
        warning->is_anomaly = 1;
        strcpy(warning->severity, "LOW_OUTLIER");
        snprintf(warning->reason, sizeof(warning->reason),
                 "Sharp drop detected: Consumption is %.1f%% below recent average. Verify meter reading accuracy.",
                 -pct_diff);
        strcpy(warning->suggested_action, "Confirm current meter reading digits and check if premises were unoccupied.");
    } else {
        warning->is_anomaly = 0;
        strcpy(warning->severity, "NORMAL");
        snprintf(warning->reason, sizeof(warning->reason),
                 "Consumption pattern is within expected seasonal variance (%.1f%% vs 3-month baseline).", pct_diff);
        strcpy(warning->suggested_action, "Usage patterns are stable. Maintain current efficiency practices.");
    }
}
