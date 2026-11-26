/**
 * Smart Electricity Bill Calculator Using C
 * history.h - File Handling, Historical Records, Budget & Anomaly Detection
 */

#ifndef HISTORY_H
#define HISTORY_H

#include "types.h"

#define HISTORY_FILE_CSV "data/records_history.csv"
#define HISTORY_FILE_BIN "data/records_history.bin"

void ensure_data_directory(void);
void seed_sample_history_if_needed(void);
int save_monthly_record(const MonthlyRecord* record);
int delete_monthly_record(const char* bill_id, int row_index);
int load_monthly_records(MonthlyRecord records[], int max_records, int* out_count);
void check_budget_alert(double budget, double current_bill, BudgetAlert* alert);
void detect_anomaly(double current_units, const MonthlyRecord history[], int count, AnomalyWarning* warning);

#endif /* HISTORY_H */
