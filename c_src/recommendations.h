/**
 * Smart Electricity Bill Calculator Using C
 * recommendations.h - Intelligent Energy-Saving Recommendation Engine
 */

#ifndef RECOMMENDATIONS_H
#define RECOMMENDATIONS_H

#include "types.h"

void generate_recommendations(const Customer* cust, const MeterData* meter, const Appliance appliances[], int app_count, double total_bill, Recommendation recs[], int* out_rec_count);

#endif /* RECOMMENDATIONS_H */
