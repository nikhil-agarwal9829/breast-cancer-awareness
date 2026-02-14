# Patient Dataset and Model Explanation

## Files in this Repository

1. **patient_dataset.json** - Sample patient data for demonstration
2. **risk_prediction_model.py** - Python implementation of the risk prediction algorithm
3. **MODEL_EXPLANATION.md** - Detailed technical documentation
4. **DATASET_README.md** - This file

## Purpose

These files are provided to explain how the breast cancer risk prediction system works. They demonstrate:

- How risk scores are calculated
- What factors contribute to risk assessment
- How different patient profiles are evaluated
- The algorithm's decision-making process

## Using the Dataset

### View Patient Data
```bash
# View the dataset
cat patient_dataset.json
```

The dataset contains 15 sample patients with:
- Patient demographics (age, gender)
- Symptoms reported
- Medical test results (BI-RADS scores, mass sizes)
- Family history
- Genetic testing results
- Calculated risk scores and predictions

### Run the Model
```bash
# Run the Python model
python risk_prediction_model.py
```

This will:
1. Demonstrate risk calculation for an example patient
2. Process all patients in the dataset
3. Show risk distribution statistics

## Dataset Statistics

- **Total Patients**: 15
- **Age Range**: 28-60 years
- **Risk Levels**:
  - High Risk: Patients with risk ≥ 60%
  - Medium Risk: Patients with risk 30-59%
  - Low Risk: Patients with risk < 30%

## Model Explanation

### Risk Calculation Formula

```
Total Risk = 
  Symptom Scores (sum of individual symptom weights)
  + BI-RADS Score Weight
  + Mass Size Contribution (min(size × 3, 20%))
  + Age Factor (10% if ≥50, 5% if 40-49)
  + Family History (15% first-degree, 25% multiple)
  + Image Bonus (5% if images provided)

Final Risk = min(Total Risk, 95%)
```

### Example Calculation

**Patient: Sarah Johnson (P001)**
- Symptoms: lump (25%) + pain (8%) + swelling (12%) = 45%
- BI-RADS 4: +45%
- Mass 2.5cm: +7.5% (2.5 × 3 = 7.5%)
- Age 52: +10%
- Family history (first-degree): +15%
- **Total: 122.5% → Capped at 95%**
- **Final Risk: 95% (HIGH)**

## Key Features

1. **Weighted Scoring System**: Different factors have different importance
2. **BI-RADS Integration**: Uses standard medical classification
3. **Multi-Factor Analysis**: Considers symptoms, age, family history, and test results
4. **Risk Level Classification**: Categorizes into Low/Medium/High
5. **Cancer Type Prediction**: Suggests likely cancer type based on patterns

## Educational Use

These files can be used to:
- Explain the risk prediction algorithm to teachers/students
- Demonstrate how medical data is processed
- Show the relationship between symptoms and risk scores
- Understand the decision-making process
- Validate the model's logic

## Notes

- This is a **screening tool**, not a diagnostic tool
- Always consult healthcare professionals for medical decisions
- The model is based on statistical risk factors, not individual genetic testing
- Risk scores are capped at 95% (definitive diagnosis requires biopsy)

## Questions for Discussion

1. How do different symptoms contribute to risk?
2. Why is BI-RADS score weighted so heavily?
3. How does family history affect risk calculation?
4. What is the significance of the 95% cap?
5. How could this model be improved with machine learning?

---

For technical details, see **MODEL_EXPLANATION.md**



