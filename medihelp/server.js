const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// MongoDB Atlas connection string
const MONGO_URI = 'mongodb+srv://nik:nik123@cluster0.ej4xtwy.mongodb.net/medihelp?retryWrites=true&w=majority';

// Middleware
app.use(cors({
  origin: ['http://127.0.0.1:5501', 'http://localhost:5501', 'http://127.0.0.1', 'http://localhost'],
  credentials: true
}));
app.use(express.json());

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Increase timeout for MongoDB operations
mongoose.set('bufferTimeoutMS', 30000);

// Mongoose models
const appointmentSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  hospital: String,
  date: String,
  time: String,
  message: String,
  appointmentType: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const Appointment = mongoose.model('Appointment', appointmentSchema);

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', contactSchema);

// Risk Assessment Schema
const riskAssessmentSchema = new mongoose.Schema({
  symptoms: [String],
  manualData: {
    biradsScore: String,
    massSize: Number,
    age: Number,
    familyHistory: String,
    additionalInfo: String
  },
  images: [String],
  riskLevel: String,
  riskPercentage: Number,
  cancerType: String,
  recommendations: Object,
  createdAt: { type: Date, default: Date.now }
});
const RiskAssessment = mongoose.model('RiskAssessment', riskAssessmentSchema);

// Connect to MongoDB Atlas with better error handling
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 30000, // Increase server selection timeout
  socketTimeoutMS: 45000, // Increase socket timeout
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.log('MongoDB Atlas connection failed:');
    console.log('Error:', err.message);
  });

// API to create appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const { name, email, phone, hospital, date, time, message, appointmentType } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !hospital || !date || !time || !appointmentType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid date format. Expected YYYY-MM-DD' 
      });
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid time format. Expected HH:MM' 
      });
    }
    
    // Use MongoDB Atlas
    const appt = new Appointment({ 
      name, 
      email, 
      phone, 
      hospital, 
      date, 
      time, 
      message, 
      appointmentType 
    });
    await appt.save();
    console.log('Appointment saved to MongoDB Atlas:', appt);
    res.status(201).json({ success: true, appointment: appt });
  } catch (err) {
    console.error('Error saving appointment:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API to get appointments (optionally by hospital or email)
app.get('/api/appointments', async (req, res) => {
  try {
    const { hospital, email } = req.query;
    let query = {};
    if (hospital) query.hospital = hospital;
    if (email) query.email = email;
    const appts = await Appointment.find(query).sort({ date: 1, time: 1 });
    console.log('Appointments retrieved from MongoDB Atlas:', appts.length);
    res.json({ success: true, appointments: appts });
  } catch (err) {
    console.error('Error retrieving appointments:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API to update appointment status
app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!appt) return res.status(404).json({ success: false, error: 'Appointment not found' });
    console.log('Appointment updated in MongoDB Atlas:', appt);
    res.json({ success: true, appointment: appt });
  } catch (err) {
    console.error('Error updating appointment:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API to create contact message
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Use MongoDB Atlas
    const contact = new Contact({ name, email, subject, message });
    await contact.save();
    console.log('Contact message saved to MongoDB Atlas:', contact);
    res.status(201).json({ success: true, contact: contact });
  } catch (err) {
    console.error('Error saving contact message:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API to get contact messages
app.get('/api/contact', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    console.log('Contact messages retrieved from MongoDB Atlas:', contacts.length);
    res.json({ success: true, contacts: contacts });
  } catch (err) {
    console.error('Error retrieving contact messages:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Risk Prediction Algorithm
function calculateRiskScore(symptoms, manualData, hasImages) {
  let riskScore = 0;
  let factors = [];

  // Symptom-based scoring (each symptom adds to risk)
  const symptomWeights = {
    'lump': 25,
    'discharge': 20,
    'skin-change': 18,
    'nipple-inversion': 15,
    'swelling': 12,
    'lymph-nodes': 22,
    'pain': 8,
    'fatigue': 5
  };

  symptoms.forEach(symptom => {
    if (symptomWeights[symptom]) {
      riskScore += symptomWeights[symptom];
      factors.push(`Symptom: ${symptom} (+${symptomWeights[symptom]}%)`);
    }
  });

  // BI-RADS Score weighting
  if (manualData.biradsScore) {
    const biradsWeights = {
      '0': 5,
      '1': 2,
      '2': 5,
      '3': 15,
      '4': 45,
      '5': 70,
      '6': 85
    };
    const biradsWeight = biradsWeights[manualData.biradsScore] || 0;
    riskScore += biradsWeight;
    factors.push(`BI-RADS ${manualData.biradsScore} (+${biradsWeight}%)`);
  }

  // Mass size weighting
  if (manualData.massSize) {
    const size = parseFloat(manualData.massSize);
    if (size > 0) {
      let sizeWeight = Math.min(size * 3, 20); // Max 20% for size
      riskScore += sizeWeight;
      factors.push(`Mass size ${size}cm (+${sizeWeight.toFixed(1)}%)`);
    }
  }

  // Age-based risk (higher risk for 40+)
  if (manualData.age) {
    const age = parseInt(manualData.age);
    if (age >= 50) {
      riskScore += 10;
      factors.push(`Age ${age} (+10%)`);
    } else if (age >= 40) {
      riskScore += 5;
      factors.push(`Age ${age} (+5%)`);
    }
  }

  // Family history weighting
  if (manualData.familyHistory === 'first-degree') {
    riskScore += 15;
    factors.push('First-degree family history (+15%)');
  } else if (manualData.familyHistory === 'multiple') {
    riskScore += 25;
    factors.push('Multiple family history (+25%)');
  }

  // Image analysis bonus (if images provided)
  if (hasImages && hasImages > 0) {
    riskScore += 5; // Small bonus for providing images
    factors.push(`Medical images provided (+5%)`);
  }

  // Cap at 95% (never 100% without biopsy confirmation)
  riskScore = Math.min(riskScore, 95);

  return { riskScore, factors };
}

function determineRiskLevel(riskScore) {
  if (riskScore >= 60) return 'high';
  if (riskScore >= 30) return 'medium';
  return 'low';
}

function determineCancerType(symptoms, manualData, riskScore) {
  // Determine likely cancer type based on symptoms and data
  if (manualData.biradsScore === '5' || manualData.biradsScore === '6') {
    return 'Invasive Ductal Carcinoma (IDC) - Most Common';
  }
  if (symptoms.includes('discharge') && symptoms.includes('nipple-inversion')) {
    return 'Paget\'s Disease of the Breast';
  }
  if (symptoms.includes('skin-change') && symptoms.includes('swelling')) {
    return 'Inflammatory Breast Cancer (IBC)';
  }
  if (riskScore >= 50) {
    return 'Possible Invasive Breast Cancer';
  }
  if (riskScore >= 30) {
    return 'Ductal Carcinoma In Situ (DCIS) or Early Stage';
  }
  return 'Benign or Low Risk';
}

function generateRecommendations(riskLevel, riskScore) {
  const recommendations = {
    tips: [],
    foods: [],
    medications: []
  };

  if (riskLevel === 'high') {
    recommendations.tips = [
      'Schedule an immediate consultation with an oncologist',
      'Consider a biopsy for definitive diagnosis',
      'Get a second opinion from a breast cancer specialist',
      'Discuss genetic testing with your doctor',
      'Maintain regular follow-up appointments',
      'Avoid smoking and limit alcohol consumption',
      'Practice stress management techniques'
    ];
    recommendations.foods = [
      'Cruciferous vegetables (broccoli, cauliflower, cabbage)',
      'Berries (blueberries, strawberries) - high in antioxidants',
      'Fatty fish (salmon, mackerel) - Omega-3 fatty acids',
      'Green tea - contains polyphenols',
      'Turmeric - anti-inflammatory properties',
      'Whole grains and fiber-rich foods',
      'Lean proteins (chicken, beans, lentils)'
    ];
    recommendations.medications = [
      'Consult doctor about Tamoxifen or Raloxifene (if appropriate)',
      'Vitamin D3 supplements (2000-4000 IU daily)',
      'Omega-3 supplements',
      'Curcumin supplements (after doctor consultation)',
      'Probiotics for immune support'
    ];
  } else if (riskLevel === 'medium') {
    recommendations.tips = [
      'Schedule a mammogram within 1-2 months',
      'Consider ultrasound or MRI for better imaging',
      'Regular self-examinations monthly',
      'Maintain healthy weight and exercise regularly',
      'Limit processed foods and sugar',
      'Get adequate sleep (7-9 hours)',
      'Stay hydrated and maintain balanced diet'
    ];
    recommendations.foods = [
      'Leafy greens (spinach, kale)',
      'Citrus fruits (oranges, lemons)',
      'Nuts and seeds (walnuts, flaxseeds)',
      'Legumes (beans, chickpeas)',
      'Olive oil for cooking',
      'Garlic and onions',
      'Yogurt and fermented foods'
    ];
    recommendations.medications = [
      'Multivitamin with folic acid',
      'Vitamin D3 (1000-2000 IU daily)',
      'Calcium supplements (if needed)',
      'Antioxidant supplements (after consultation)'
    ];
  } else {
    recommendations.tips = [
      'Continue regular breast self-examinations',
      'Schedule annual mammograms (if 40+)',
      'Maintain healthy lifestyle and diet',
      'Exercise regularly (150 minutes/week)',
      'Stay informed about breast health',
      'Know your family history',
      'Practice preventive care'
    ];
    recommendations.foods = [
      'Colorful fruits and vegetables daily',
      'Whole grains and fiber',
      'Lean proteins',
      'Healthy fats (avocado, nuts)',
      'Low-fat dairy products',
      'Plenty of water',
      'Limit red meat and processed foods'
    ];
    recommendations.medications = [
      'General multivitamin',
      'Vitamin D3 (800-1000 IU daily)',
      'Regular health checkups',
      'No specific medications needed unless prescribed'
    ];
  }

  return recommendations;
}

// API endpoint for risk analysis
app.post('/api/analyze-risk', upload.array('images', 10), async (req, res) => {
  try {
    const symptoms = JSON.parse(req.body.symptoms || '[]');
    const manualData = JSON.parse(req.body.manualData || '{}');
    const imageFiles = req.files || [];

    // Calculate risk score
    const { riskScore, factors } = calculateRiskScore(symptoms, manualData, imageFiles.length);
    const riskLevel = determineRiskLevel(riskScore);
    const cancerType = determineCancerType(symptoms, manualData, riskScore);
    const recommendations = generateRecommendations(riskLevel, riskScore);

    // Generate message based on risk level
    let message = '';
    if (riskLevel === 'high') {
      message = 'Your assessment indicates a HIGH RISK. Please consult with a healthcare professional immediately for proper diagnosis and treatment planning.';
    } else if (riskLevel === 'medium') {
      message = 'Your assessment indicates a MODERATE RISK. We recommend scheduling a consultation with a healthcare provider for further evaluation.';
    } else {
      message = 'Your assessment indicates a LOW RISK. Continue with regular checkups and maintain a healthy lifestyle.';
    }

    // Save assessment to database
    const imagePaths = imageFiles.map(file => file.filename);
    const assessment = new RiskAssessment({
      symptoms,
      manualData,
      images: imagePaths,
      riskLevel,
      riskPercentage: Math.round(riskScore),
      cancerType,
      recommendations
    });
    await assessment.save();

    console.log('Risk assessment saved:', {
      riskLevel,
      riskPercentage: Math.round(riskScore),
      factors
    });

    res.json({
      success: true,
      riskLevel,
      riskPercentage: Math.round(riskScore),
      cancerType,
      message,
      recommendations,
      factors
    });
  } catch (err) {
    console.error('Error in risk analysis:', err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});