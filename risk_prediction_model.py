"""
Breast Cancer Risk Prediction Model
===================================
This Python implementation demonstrates the risk prediction algorithm
used in the VIT Hope Ribbon medical assessment system.

Author: VIT Hope Ribbon Development Team
Date: 2024
"""

import json
from typing import List, Dict, Tuple


class BreastCancerRiskPredictor:
    """
    A risk prediction model for breast cancer assessment.
    Uses weighted scoring based on symptoms, medical history, and clinical factors.
    """
    
    def __init__(self):
        # Symptom weights based on medical research
        self.symptom_weights = {
            'lump': 25,
            'discharge': 20,
            'skin-change': 18,
            'nipple-inversion': 15,
            'swelling': 12,
            'lymph-nodes': 22,
            'pain': 8,
            'fatigue': 5
        }
        
        # BI-RADS score weights (Breast Imaging Reporting and Data System)
        self.birads_weights = {
            '0': 5,   # Incomplete
            '1': 2,   # Negative
            '2': 5,   # Benign
            '3': 15,  # Probably Benign
            '4': 45,  # Suspicious
            '5': 70,  # Highly Suggestive of Malignancy
            '6': 85   # Known Biopsy-Proven Malignancy
        }
    
    def calculate_risk_score(self, 
                           symptoms: List[str],
                           birads_score: str = None,
                           mass_size_cm: float = 0,
                           age: int = None,
                           family_history: str = 'no',
                           has_images: bool = False) -> Tuple[float, List[str]]:
        """
        Calculate breast cancer risk score.
        
        Args:
            symptoms: List of symptoms (e.g., ['lump', 'pain'])
            birads_score: BI-RADS classification (0-6)
            mass_size_cm: Size of detected mass in centimeters
            age: Patient age
            family_history: 'no', 'first-degree', or 'multiple'
            has_images: Whether medical images were provided
        
        Returns:
            Tuple of (risk_score, factors_list)
        """
        risk_score = 0.0
        factors = []
        
        # 1. Symptom-based scoring
        for symptom in symptoms:
            if symptom in self.symptom_weights:
                weight = self.symptom_weights[symptom]
                risk_score += weight
                factors.append(f"Symptom: {symptom} (+{weight}%)")
        
        # 2. BI-RADS Score weighting
        if birads_score and birads_score in self.birads_weights:
            weight = self.birads_weights[birads_score]
            risk_score += weight
            factors.append(f"BI-RADS {birads_score} (+{weight}%)")
        
        # 3. Mass size weighting
        if mass_size_cm > 0:
            size_weight = min(mass_size_cm * 3, 20)  # Max 20%
            risk_score += size_weight
            factors.append(f"Mass size {mass_size_cm}cm (+{size_weight:.1f}%)")
        
        # 4. Age-based risk
        if age:
            if age >= 50:
                risk_score += 10
                factors.append(f"Age {age} (+10%)")
            elif age >= 40:
                risk_score += 5
                factors.append(f"Age {age} (+5%)")
        
        # 5. Family history weighting
        if family_history == 'first-degree':
            risk_score += 15
            factors.append('First-degree family history (+15%)')
        elif family_history == 'multiple':
            risk_score += 25
            factors.append('Multiple family history (+25%)')
        
        # 6. Image upload bonus
        if has_images:
            risk_score += 5
            factors.append('Medical images provided (+5%)')
        
        # Cap at 95% (never 100% without biopsy confirmation)
        risk_score = min(risk_score, 95.0)
        
        return risk_score, factors
    
    def determine_risk_level(self, risk_score: float) -> str:
        """
        Determine risk level based on score.
        
        Args:
            risk_score: Calculated risk score (0-95)
        
        Returns:
            'low', 'medium', or 'high'
        """
        if risk_score >= 60:
            return 'high'
        elif risk_score >= 30:
            return 'medium'
        else:
            return 'low'
    
    def predict_cancer_type(self, 
                           symptoms: List[str],
                           birads_score: str = None,
                           risk_score: float = 0) -> str:
        """
        Predict likely cancer type based on symptoms and data.
        
        Args:
            symptoms: List of symptoms
            birads_score: BI-RADS classification
            risk_score: Calculated risk score
        
        Returns:
            Predicted cancer type string
        """
        # BI-RADS 5 or 6 indicates high suspicion
        if birads_score in ['5', '6']:
            return 'Invasive Ductal Carcinoma (IDC) - Most Common'
        
        # Specific symptom combinations
        if 'discharge' in symptoms and 'nipple-inversion' in symptoms:
            return "Paget's Disease of the Breast"
        
        if 'skin-change' in symptoms and 'swelling' in symptoms:
            return 'Inflammatory Breast Cancer (IBC)'
        
        # Risk score-based predictions
        if risk_score >= 50:
            return 'Possible Invasive Breast Cancer'
        elif risk_score >= 30:
            return 'Ductal Carcinoma In Situ (DCIS) or Early Stage'
        else:
            return 'Benign or Low Risk'
    
    def assess_patient(self, patient_data: Dict) -> Dict:
        """
        Complete risk assessment for a patient.
        
        Args:
            patient_data: Dictionary containing patient information
        
        Returns:
            Dictionary with risk assessment results
        """
        symptoms = patient_data.get('symptoms', [])
        birads_score = patient_data.get('birads_score')
        mass_size = patient_data.get('mass_size_cm', 0)
        age = patient_data.get('age')
        family_history = patient_data.get('family_history', 'no')
        has_images = patient_data.get('has_images', False)
        
        # Calculate risk
        risk_score, factors = self.calculate_risk_score(
            symptoms, birads_score, mass_size, age, family_history, has_images
        )
        
        # Determine risk level
        risk_level = self.determine_risk_level(risk_score)
        
        # Predict cancer type
        cancer_type = self.predict_cancer_type(symptoms, birads_score, risk_score)
        
        return {
            'risk_score': round(risk_score, 1),
            'risk_percentage': round(risk_score),
            'risk_level': risk_level,
            'cancer_type': cancer_type,
            'factors': factors,
            'recommendations': self._generate_recommendations(risk_level, risk_score)
        }
    
    def _generate_recommendations(self, risk_level: str, risk_score: float) -> Dict:
        """
        Generate personalized recommendations based on risk level.
        
        Args:
            risk_level: 'low', 'medium', or 'high'
            risk_score: Calculated risk score
        
        Returns:
            Dictionary with tips, foods, and medications
        """
        recommendations = {
            'tips': [],
            'foods': [],
            'medications': []
        }
        
        if risk_level == 'high':
            recommendations['tips'] = [
                'Schedule an immediate consultation with an oncologist',
                'Consider a biopsy for definitive diagnosis',
                'Get a second opinion from a breast cancer specialist',
                'Discuss genetic testing with your doctor',
                'Maintain regular follow-up appointments',
                'Avoid smoking and limit alcohol consumption',
                'Practice stress management techniques'
            ]
            recommendations['foods'] = [
                'Cruciferous vegetables (broccoli, cauliflower, cabbage)',
                'Berries (blueberries, strawberries) - high in antioxidants',
                'Fatty fish (salmon, mackerel) - Omega-3 fatty acids',
                'Green tea - contains polyphenols',
                'Turmeric - anti-inflammatory properties',
                'Whole grains and fiber-rich foods',
                'Lean proteins (chicken, beans, lentils)'
            ]
            recommendations['medications'] = [
                'Consult doctor about Tamoxifen or Raloxifene (if appropriate)',
                'Vitamin D3 supplements (2000-4000 IU daily)',
                'Omega-3 supplements',
                'Curcumin supplements (after doctor consultation)',
                'Probiotics for immune support'
            ]
        elif risk_level == 'medium':
            recommendations['tips'] = [
                'Schedule a mammogram within 1-2 months',
                'Consider ultrasound or MRI for better imaging',
                'Regular self-examinations monthly',
                'Maintain healthy weight and exercise regularly',
                'Limit processed foods and sugar',
                'Get adequate sleep (7-9 hours)',
                'Stay hydrated and maintain balanced diet'
            ]
            recommendations['foods'] = [
                'Leafy greens (spinach, kale)',
                'Citrus fruits (oranges, lemons)',
                'Nuts and seeds (walnuts, flaxseeds)',
                'Legumes (beans, chickpeas)',
                'Olive oil for cooking',
                'Garlic and onions',
                'Yogurt and fermented foods'
            ]
            recommendations['medications'] = [
                'Multivitamin with folic acid',
                'Vitamin D3 (1000-2000 IU daily)',
                'Calcium supplements (if needed)',
                'Antioxidant supplements (after consultation)'
            ]
        else:  # low risk
            recommendations['tips'] = [
                'Continue regular breast self-examinations',
                'Schedule annual mammograms (if 40+)',
                'Maintain healthy lifestyle and diet',
                'Exercise regularly (150 minutes/week)',
                'Stay informed about breast health',
                'Know your family history',
                'Practice preventive care'
            ]
            recommendations['foods'] = [
                'Colorful fruits and vegetables daily',
                'Whole grains and fiber',
                'Lean proteins',
                'Healthy fats (avocado, nuts)',
                'Low-fat dairy products',
                'Plenty of water',
                'Limit red meat and processed foods'
            ]
            recommendations['medications'] = [
                'General multivitamin',
                'Vitamin D3 (800-1000 IU daily)',
                'Regular health checkups',
                'No specific medications needed unless prescribed'
            ]
        
        return recommendations


# Example Usage
if __name__ == "__main__":
    # Initialize predictor
    predictor = BreastCancerRiskPredictor()
    
    # Example patient data
    patient = {
        'symptoms': ['lump', 'pain', 'swelling'],
        'birads_score': '4',
        'mass_size_cm': 2.5,
        'age': 52,
        'family_history': 'first-degree',
        'has_images': True
    }
    
    # Perform assessment
    result = predictor.assess_patient(patient)
    
    # Display results
    print("=" * 60)
    print("BREAST CANCER RISK ASSESSMENT")
    print("=" * 60)
    print(f"\nRisk Score: {result['risk_score']}%")
    print(f"Risk Level: {result['risk_level'].upper()}")
    print(f"Predicted Type: {result['cancer_type']}")
    print("\nContributing Factors:")
    for factor in result['factors']:
        print(f"  • {factor}")
    print("\nRecommendations:")
    print(f"  Health Tips: {len(result['recommendations']['tips'])} items")
    print(f"  Foods: {len(result['recommendations']['foods'])} items")
    print(f"  Medications: {len(result['recommendations']['medications'])} items")
    print("=" * 60)
    
    # Process dataset
    print("\n\nProcessing Patient Dataset...")
    with open('patient_dataset.json', 'r') as f:
        dataset = json.load(f)
    
    print(f"\nTotal Patients: {len(dataset)}")
    print("\nRisk Distribution:")
    risk_counts = {'low': 0, 'medium': 0, 'high': 0}
    for patient_data in dataset:
        assessment = predictor.assess_patient(patient_data)
        risk_counts[assessment['risk_level']] += 1
    
    for level, count in risk_counts.items():
        percentage = (count / len(dataset)) * 100
        print(f"  {level.upper()}: {count} patients ({percentage:.1f}%)")



