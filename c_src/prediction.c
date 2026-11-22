/**
 * Smart Electricity Bill Calculator Using C
 * prediction.c - Trend Analysis, Least-Squares Linear Regression & Next Month Forecast
 */

#include <stdio.h>
#include <string.h>
#include <math.h>
#include "prediction.h"
#include "billing.h"

void predict_next_month(const MonthlyRecord history[], int count, const char* category, const char* tariff_plan, PredictionResult* pred) {
    memset(pred, 0, sizeof(PredictionResult));

    if (count == 0) {
        pred->predicted_units = 250.0;
        pred->predicted_amount = calculate_raw_units_cost(250.0, category, tariff_plan);
        strcpy(pred->trend_direction, "Stable");
        strcpy(pred->confidence, "Low");
        snprintf(pred->reason, sizeof(pred->reason), "Default baseline used; no historical logs found.");
        return;
    }

    /* Compute 3-month and 6-month averages */
    double sum3 = 0.0;
    int n3 = (count >= 3) ? 3 : count;
    for (int i = count - n3; i < count; i++) {
        sum3 += history[i].units;
    }
    pred->avg_3m_units = sum3 / (double)n3;

    double sum6 = 0.0;
    int n6 = (count >= 6) ? 6 : count;
    for (int i = count - n6; i < count; i++) {
        sum6 += history[i].units;
    }
    pred->avg_6m_units = sum6 / (double)n6;

    if (count == 1) {
        pred->predicted_units = history[0].units;
        pred->predicted_amount = calculate_raw_units_cost(pred->predicted_units, category, tariff_plan);
        strcpy(pred->trend_direction, "Stable");
        strcpy(pred->confidence, "Low");
        snprintf(pred->reason, sizeof(pred->reason), "Single month projection based on previous bill.");
        return;
    }

    /* Least-squares linear regression on history points */
    int n = count;
    double x_bar = (n + 1) / 2.0;
    double y_sum = 0.0;
    for (int i = 0; i < n; i++) {
        y_sum += history[i].units;
    }
    double y_bar = y_sum / (double)n;

    double numerator = 0.0;
    double denominator = 0.0;
    for (int i = 0; i < n; i++) {
        double x_i = (double)(i + 1);
        double y_i = history[i].units;
        numerator += (x_i - x_bar) * (y_i - y_bar);
        denominator += (x_i - x_bar) * (x_i - x_bar);
    }

    double slope = (denominator != 0.0) ? (numerator / denominator) : 0.0;
    double intercept = y_bar - (slope * x_bar);

    /* Forecast next point (n + 1) */
    double regressed_val = intercept + (slope * (double)(n + 1));
    if (regressed_val < 20.0) regressed_val = 20.0;

    /* Weighted blend: 60% linear trend forecast + 40% 3-month moving average */
    double forecasted_units = (0.60 * regressed_val) + (0.40 * pred->avg_3m_units);
    if (forecasted_units < 25.0) forecasted_units = 25.0;

    pred->predicted_units = forecasted_units;
    pred->predicted_amount = calculate_raw_units_cost(forecasted_units, category, tariff_plan);

    /* Calculate growth percentage vs last recorded month */
    double last_month_units = history[count - 1].units;
    if (last_month_units > 0.0) {
        pred->pct_growth = ((forecasted_units - last_month_units) / last_month_units) * 100.0;
    } else {
        pred->pct_growth = 0.0;
    }

    if (pred->pct_growth > 3.0) {
        strcpy(pred->trend_direction, "Increasing");
    } else if (pred->pct_growth < -3.0) {
        strcpy(pred->trend_direction, "Decreasing");
    } else {
        strcpy(pred->trend_direction, "Stable");
    }

    if (count >= 6) {
        strcpy(pred->confidence, "High");
        snprintf(pred->reason, sizeof(pred->reason),
                 "Derived from %d-month regression model (slope = %.2f units/month).", count, slope);
    } else {
        strcpy(pred->confidence, "Medium");
        snprintf(pred->reason, sizeof(pred->reason),
                 "Derived from %d-month moving trend.", count);
    }
}
