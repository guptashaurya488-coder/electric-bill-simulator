/**
 * Smart Electricity Bill Calculator Using C
 * prediction.h - Statistical Consumption Prediction
 */

#ifndef PREDICTION_H
#define PREDICTION_H

#include "types.h"

void predict_next_month(const MonthlyRecord history[], int count, const char* category, const char* tariff_plan, PredictionResult* pred);

#endif /* PREDICTION_H */
