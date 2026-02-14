const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://127.0.0.1:5501', 'http://localhost:5501', 'http://127.0.0.1', 'http://localhost', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from root directory with proper MIME types
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.use('/css', express.static(path.join(__dirname, 'css'), {
  setHeaders: (res) => {
    res.setHeader('Content-Type', 'text/css');
  }
}));

app.use('/js', express.static(path.join(__dirname, 'js'), {
  setHeaders: (res) => {
    res.setHeader('Content-Type', 'application/javascript');
  }
}));

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/vid', express.static(path.join(__dirname, 'vid')));

// Serve medihelp static files
app.use('/medihelp', express.static(path.join(__dirname, 'medihelp')));

// Configure local data storage
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const appointmentsFile = path.join(dataDir, 'appointments.json');
const contactsFile = path.join(dataDir, 'contacts.json');
const riskAssessmentsFile = path.join(dataDir, 'risk-assessments.json');

// Initialize JSON files if they don't exist
[appointmentsFile, contactsFile, riskAssessmentsFile].forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([], null, 2));
  }
});

// Helper functions for local storage
function readJSONFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeJSONFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
}

// Configure multer for file uploads (for risk assessment images)
const uploadDir = path.join(__dirname, 'medihelp', 'uploads');
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

// Local storage - no MongoDB needed
console.log('✓ Using local file storage (data folder)');

// ==================== API ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// API to create appointment
app.post('/api/appointments', (req, res) => {
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
    
    const appointments = readJSONFile(appointmentsFile);
    const newAppointment = {
      id: Date.now().toString(),
      name, 
      email, 
      phone, 
      hospital, 
      date, 
      time, 
      message, 
      appointmentType,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    appointments.push(newAppointment);
    writeJSONFile(appointmentsFile, appointments);
    console.log('✓ Appointment saved locally:', newAppointment.id);
    res.status(201).json({ success: true, appointment: newAppointment });
  } catch (err) {
    console.error('✗ Error saving appointment:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API to get appointments (optionally by hospital or email)
app.get('/api/appointments', (req, res) => {
  try {
    const { hospital, email } = req.query;
    let appointments = readJSONFile(appointmentsFile);
    
    // Filter if query parameters provided
    if (hospital) {
      appointments = appointments.filter(apt => apt.hospital === hospital);
    }
    if (email) {
      appointments = appointments.filter(apt => apt.email === email);
    }
    
    // Sort by date and time
    appointments.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA - dateB;
    });
    
    console.log(`✓ Retrieved ${appointments.length} appointments`);
    res.json({ success: true, appointments: appointments });
  } catch (err) {
    console.error('✗ Error retrieving appointments:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API to update appointment status
app.patch('/api/appointments/:id', (req, res) => {
  try {
    const { status } = req.body;
    const appointments = readJSONFile(appointmentsFile);
    const appointmentIndex = appointments.findIndex(apt => apt.id === req.params.id);
    
    if (appointmentIndex === -1) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    
    appointments[appointmentIndex].status = status;
    writeJSONFile(appointmentsFile, appointments);
    console.log('✓ Appointment updated:', req.params.id);
    res.json({ success: true, appointment: appointments[appointmentIndex] });
  } catch (err) {
    console.error('✗ Error updating appointment:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API to create contact message
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    const contacts = readJSONFile(contactsFile);
    const newContact = {
      id: Date.now().toString(),
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString()
    };
    contacts.push(newContact);
    writeJSONFile(contactsFile, contacts);
    console.log('✓ Contact message saved locally:', newContact.id);
    res.status(201).json({ success: true, contact: newContact });
  } catch (err) {
    console.error('✗ Error saving contact message:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API to get contact messages
app.get('/api/contact', (req, res) => {
  try {
    const contacts = readJSONFile(contactsFile);
    // Sort by creation date (newest first)
    contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log(`✓ Retrieved ${contacts.length} contact messages`);
    res.json({ success: true, contacts: contacts });
  } catch (err) {
    console.error('✗ Error retrieving contact messages:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== RISK PREDICTION ALGORITHM ====================

function calculateRiskScore(symptoms, manualData, hasImages) {
  let riskScore = 0;
  let factors = [];

  // Ensure symptoms is an array
  if (!Array.isArray(symptoms)) {
    symptoms = [];
  }

  // Ensure manualData is an object
  if (!manualData || typeof manualData !== 'object') {
    manualData = {};
  }

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
  // Ensure symptoms is an array
  if (!Array.isArray(symptoms)) {
    symptoms = [];
  }
  
  // Ensure manualData is an object
  if (!manualData || typeof manualData !== 'object') {
    manualData = {};
  }
  
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
app.post('/api/analyze-risk', upload.array('images', 10), (req, res) => {
  try {
    console.log('Risk analysis request received');
    console.log('Request body keys:', Object.keys(req.body));
    
    // Safely parse JSON data
    let symptoms = [];
    let manualData = {};
    
    try {
      if (req.body.symptoms) {
        symptoms = typeof req.body.symptoms === 'string' ? JSON.parse(req.body.symptoms) : req.body.symptoms;
      }
      console.log('Parsed symptoms:', symptoms);
    } catch (e) {
      console.log('Warning: Could not parse symptoms:', e.message);
      symptoms = [];
    }
    
    try {
      if (req.body.manualData) {
        manualData = typeof req.body.manualData === 'string' ? JSON.parse(req.body.manualData) : req.body.manualData;
      }
      console.log('Parsed manualData:', manualData);
    } catch (e) {
      console.log('Warning: Could not parse manualData:', e.message);
      manualData = {};
    }
    
    const imageFiles = req.files || [];
    console.log('Image files count:', imageFiles.length);

    // Calculate risk score
    let riskScore, factors, riskLevel, cancerType, recommendations;
    try {
      const result = calculateRiskScore(symptoms, manualData, imageFiles.length);
      riskScore = result.riskScore;
      factors = result.factors;
      console.log('Risk score calculated:', riskScore);
    } catch (e) {
      console.error('Error calculating risk score:', e);
      throw new Error('Failed to calculate risk score: ' + e.message);
    }
    
    try {
      riskLevel = determineRiskLevel(riskScore);
      cancerType = determineCancerType(symptoms, manualData, riskScore);
      recommendations = generateRecommendations(riskLevel, riskScore);
      console.log('Risk level:', riskLevel, 'Cancer type:', cancerType);
    } catch (e) {
      console.error('Error determining risk details:', e);
      throw new Error('Failed to determine risk details: ' + e.message);
    }

    // Generate message based on risk level
    let message = '';
    if (riskLevel === 'high') {
      message = 'Your assessment indicates a HIGH RISK. Please consult with a healthcare professional immediately for proper diagnosis and treatment planning.';
    } else if (riskLevel === 'medium') {
      message = 'Your assessment indicates a MODERATE RISK. We recommend scheduling a consultation with a healthcare provider for further evaluation.';
    } else {
      message = 'Your assessment indicates a LOW RISK. Continue with regular checkups and maintain a healthy lifestyle.';
    }

    // Save assessment to local file storage
    try {
      const imagePaths = imageFiles.map(file => file.filename);
      const assessments = readJSONFile(riskAssessmentsFile);
      const newAssessment = {
        id: Date.now().toString(),
        symptoms,
        manualData,
        images: imagePaths,
        riskLevel,
        riskPercentage: Math.round(riskScore),
        cancerType,
        recommendations,
        factors: factors,
        createdAt: new Date().toISOString()
      };
      assessments.push(newAssessment);
      const saved = writeJSONFile(riskAssessmentsFile, assessments);
      if (saved) {
        console.log('✓ Risk assessment saved locally:', newAssessment.id);
      } else {
        console.log('⚠ Risk assessment calculated but save failed (continuing anyway)');
      }
    } catch (saveError) {
      console.error('Error saving assessment:', saveError);
      // Continue even if save fails
    }

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
    console.error('✗ Error in risk analysis:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ==================== STATIC FILE ROUTES ====================

// Serve main HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve medihelp HTML files
app.get('/medihelp.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'medihelp', 'medihelp.html'));
});

app.get('/medihelp/medihelp.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'medihelp', 'medihelp.html'));
});

app.get('/medihelp/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'medihelp', 'admin.html'));
});

// ==================== START SERVER ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`📊 API endpoints available at: http://localhost:${PORT}/api`);
  console.log('========================================\n');
});

