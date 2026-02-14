# Breast Cancer Risk Prediction Model - Technical Documentation

## Overview
This document explains the risk prediction algorithm used in the VIT Hope Ribbon medical assessment system. The model calculates breast cancer risk based on multiple factors including symptoms, medical history, family history, and lifestyle factors.

## Model Architecture

### Risk Score Calculation
The model uses a **weighted scoring system** where different risk factors contribute different amounts to the overall risk score. The final risk percentage ranges from 0% to 95% (capped at 95% to indicate that definitive diagnosis requires biopsy).

### Formula
```
Total Risk Score = Symptom Score + BI-RADS Score + Mass Size Score + Age Score + Family History Score + Image Bonus
Final Risk Percentage = min(Total Risk Score, 95%)
```

## Risk Factor Weights

### 1. Symptom-Based Scoring
Each symptom has a specific weight based on medical research:

| Symptom | Weight | Medical Rationale |
|---------|--------|------------------|
| Breast Lump | 25% | Primary indicator, requires immediate attention |
| Nipple Discharge | 20% | Can indicate ductal carcinoma |
| Swollen Lymph Nodes | 22% | Suggests possible metastasis |
| Skin Changes | 18% | May indicate inflammatory breast cancer |
| Nipple Inversion | 15% | Can be sign of underlying mass |
| Swelling | 12% | General indicator of abnormality |
| Breast Pain | 8% | Less specific but still relevant |
| Unexplained Fatigue | 5% | Non-specific but can be associated |

**Note:** Multiple symptoms are additive (e.g., lump + discharge = 45% base risk)

### 2. BI-RADS Score Weighting
Based on the Breast Imaging Reporting and Data System (BI-RADS) classification:

| BI-RADS Score | Weight | Clinical Meaning |
|---------------|--------|------------------|
| 0 | 5% | Incomplete - Need additional imaging |
| 1 | 2% | Negative - No significant findings |
| 2 | 5% | Benign - No cancer |
| 3 | 15% | Probably Benign - Short-term follow-up |
| 4 | 45% | Suspicious - Biopsy recommended |
| 5 | 70% | Highly Suggestive of Malignancy |
| 6 | 85% | Known Biopsy-Proven Malignancy |

### 3. Mass Size Contribution
- Formula: `min(mass_size_cm × 3, 20%)`
- Maximum contribution: 20%
- Example: 5cm mass = 15% risk addition

### 4. Age-Based Risk
- Age ≥ 50: +10% (peak risk age group)
- Age 40-49: +5% (increased risk period)
- Age < 40: 0% (lower baseline risk)

### 5. Family History Weighting
- No family history: 0%
- First-degree relative (mother, sister, daughter): +15%
- Multiple relatives: +25%

### 6. Image Upload Bonus
- Providing medical images: +5% (encourages comprehensive assessment)

## Risk Level Classification

The model categorizes risk into three levels:

| Risk Score | Level | Action Required |
|------------|-------|----------------|
| ≥ 60% | HIGH | Immediate consultation with oncologist, consider biopsy |
| 30-59% | MEDIUM | Schedule mammogram/ultrasound, regular monitoring |
| < 30% | LOW | Continue regular checkups, maintain healthy lifestyle |

## Cancer Type Prediction

The model predicts likely cancer type based on symptom patterns:

1. **BI-RADS 5 or 6** → Invasive Ductal Carcinoma (IDC) - Most Common
2. **Discharge + Nipple Inversion** → Paget's Disease of the Breast
3. **Skin Changes + Swelling** → Inflammatory Breast Cancer (IBC)
4. **Risk Score ≥ 50%** → Possible Invasive Breast Cancer
5. **Risk Score 30-49%** → Ductal Carcinoma In Situ (DCIS) or Early Stage
6. **Risk Score < 30%** → Benign or Low Risk

## Model Limitations

1. **Screening Tool Only**: This is NOT a diagnostic tool. It provides risk assessment, not diagnosis.
2. **No Replacement for Medical Consultation**: Always consult healthcare professionals.
3. **Based on Self-Reported Data**: Accuracy depends on user input quality.
4. **Statistical Model**: Uses population-based risk factors, not individual genetic testing.
5. **95% Cap**: Never reaches 100% as definitive diagnosis requires biopsy.

## Validation

The model is based on:
- American Cancer Society guidelines
- BI-RADS classification system
- Clinical risk assessment protocols
- Population-based breast cancer risk factors

## Future Improvements

1. Integration with genetic testing results (BRCA1/BRCA2)
2. Machine learning model trained on real patient data
3. Integration with imaging AI for automated analysis
4. Personalized risk factors based on ethnicity and geography
5. Real-time updates based on latest medical research

## References

- American Cancer Society. Breast Cancer Risk Factors.
- BI-RADS Atlas, 5th Edition. American College of Radiology.
- National Cancer Institute. Breast Cancer Risk Assessment Tool.
- Clinical Breast Examination Guidelines. American Society of Clinical Oncology.

---

**Disclaimer**: This model is for educational and screening purposes only. It does not replace professional medical diagnosis or treatment.



