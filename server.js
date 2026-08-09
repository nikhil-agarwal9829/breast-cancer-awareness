const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 3001;

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  envLines.forEach((line) => {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) {
      return;
    }
    const [key, ...rest] = line.split('=');
    if (!process.env[key]) {
      process.env[key] = rest.join('=').trim();
    }
  });
}

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

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
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

app.post('/api/extract-document', async (req, res) => {
  try {
    const { fileName, mimeType, dataUrl } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing document data' });
    }

    const commaIndex = dataUrl.indexOf(',');
    const base64Payload = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
    const buffer = Buffer.from(base64Payload, 'base64');
    const lowerName = String(fileName || '').toLowerCase();
    const type = String(mimeType || '').toLowerCase();

    if (type === 'text/plain' || lowerName.endsWith('.txt')) {
      return res.json({
        success: true,
        text: buffer.toString('utf8'),
        kind: 'text'
      });
    }

    if (type === 'application/pdf' || lowerName.endsWith('.pdf')) {
      const result = await pdfParse(buffer);
      return res.json({
        success: true,
        text: String(result.text || '').trim(),
        kind: 'pdf',
        pages: result.numpages || null
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Unsupported document type for server extraction'
    });
  } catch (error) {
    console.error('Document extraction error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Could not extract text from this document'
    });
  }
});

// ==================== GEMINI AI ASSISTANT PROXY (via @google/genai) ====================

const { GoogleGenAI } = require('@google/genai');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

function buildAiSystemPrompt() {
  return `
You are an AI health assistant focused on breast cancer risk, imaging reports, medical reports, symptoms, screening, treatment guidance, and general breast health.
You are NOT a doctor and must always remind the user to confirm important conclusions with a qualified clinician.
Use the provided JSON context when available, avoid guessing beyond it, and keep answers calm, practical, and easy to understand.
`.trim();
}

function compactText(value, max = 900) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function sentenceFromText(value) {
  const text = compactText(value, 240);
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function firstMeaningfulLine(lines = []) {
  return lines.find((line) => compactText(line, 220)) || '';
}

function buildRiskSnapshot(risk = {}) {
  if (!risk || !risk.level) {
    return 'Risk snapshot: Not available yet from the risk assessment form.';
  }
  const percentage = risk.percentage ? ` (${risk.percentage}%)` : '';
  const cancerType = risk.cancerType ? ` | Possible pattern: ${risk.cancerType}` : '';
  return `Risk snapshot: ${String(risk.level).toUpperCase()}${percentage}${cancerType}`;
}

function extractDocumentSignals(text) {
  const raw = String(text || '');
  const cleaned = raw.replace(/\r/g, '');
  const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);
  const lower = cleaned.toLowerCase();

  const hospitalLine = lines.find((line) => /(hospital|clinic|medical|diagnostic|pharmacy|care)/i.test(line)) || '';
  const dateMatch = cleaned.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b\d{4}[\/-]\d{2}[\/-]\d{2}\b/);
  const amountMatches = [...cleaned.matchAll(/(?:rs\.?|inr|total|amount)\s*[:\-]?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/ig)]
    .map((match) => match[0].trim())
    .slice(0, 3);
  const medicineLines = lines.filter((line) => /(tab|tablet|cap|capsule|syrup|ointment|cream|drops|inj|injection|mg|ml|take|daily|after food|before food)/i.test(line)).slice(0, 5);
  const testLines = lines.filter((line) => /(mammogram|ultrasound|x-ray|scan|mri|ct|biopsy|blood|cbc|thyroid|ecg|screening|report)/i.test(line)).slice(0, 5);
  const diagnosisLines = lines.filter((line) => /(diagnosis|impression|findings|assessment|advice|complaint|symptom)/i.test(line)).slice(0, 4);

  return {
    lower,
    hospitalLine,
    date: dateMatch ? dateMatch[0] : '',
    amounts: amountMatches,
    medicines: medicineLines,
    tests: testLines,
    diagnosis: diagnosisLines,
    preview: compactText(cleaned, 700),
  };
}

async function callGeminiAssistant(prompt, context) {
  if (!genAI) {
    throw new Error('Gemini API key is not configured');
  }

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${buildAiSystemPrompt()}\n\nCONTEXT (JSON):\n${JSON.stringify(context || {}, null, 2)}\n\nUSER REQUEST:\n${prompt}`,
          },
        ],
      },
    ],
  });

  return response.text || '';
}

async function callOpenAIAssistant(prompt, context, attachments = []) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const content = [
    {
      type: 'input_text',
      text: `${buildAiSystemPrompt()}\n\nCONTEXT (JSON):\n${JSON.stringify(context || {}, null, 2)}\n\nUSER REQUEST:\n${prompt}`,
    },
  ];

  attachments
    .filter((item) => item && item.type === 'image' && item.dataUrl)
    .forEach((item) => {
      content.push({
        type: 'input_image',
        image_url: item.dataUrl,
      });
    });

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'user',
          content,
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI request failed');
  }

  return (
    data.output_text ||
    data.output?.flatMap((item) => item.content || []).map((item) => item.text || '').join('\n').trim() ||
    ''
  );
}

function buildLocalFallback(prompt, context = {}) {
  const lower = String(prompt || '').toLowerCase();
  const userQuestion = String(context.userQuestion || '').toLowerCase();
  const focusText = userQuestion || lower;
  const risk = context.risk || {};
  const report = context.report || {};
  const summaryText = context.currentSummary || report.summary || context.uploadedDocument?.summary || '';
  const sourceText = context.extractedText || context.uploadedDocument?.extractedTextPreview || context.notes || '';
  const signals = extractDocumentSignals(sourceText);

  if (context.type === 'receipt-prescription-analysis') {
    const kind = context.documentKind || (
      /(tablet|capsule|take|after food|before food|prescription|rx)/i.test(sourceText) ? 'prescription' : 'receipt'
    );
    const mainDiagnosis = firstMeaningfulLine(signals.diagnosis);
    const mainTest = firstMeaningfulLine(signals.tests);
    const mainMedicine = firstMeaningfulLine(signals.medicines);
    const detailLines = [];
    const tipLines = [];
    const questionLines = [];
    const nextStepLines = [];
    const assistantPromptLines = [];

    if (signals.hospitalLine) {
      detailLines.push(`Provider or facility spotted: ${signals.hospitalLine}`);
    }
    if (signals.date) {
      detailLines.push(`Possible visit or document date: ${signals.date}`);
    }
    if (signals.amounts.length > 0) {
      detailLines.push(`Billing clues found: ${signals.amounts.join('; ')}`);
    }
    if (signals.tests.length > 0) {
      detailLines.push(`Tests or report terms noticed: ${signals.tests.join(' | ')}`);
      tipLines.push('Keep the original report, test date, and any previous imaging together for your next visit.');
      questionLines.push('Can you explain what each listed test or finding means for me?');
      assistantPromptLines.push('What do the listed tests or pathology terms mean in simple language?');
    }
    if (signals.medicines.length > 0) {
      detailLines.push(`Medicine-related text noticed: ${signals.medicines.join(' | ')}`);
      tipLines.push('Follow prescription timing exactly as written, and ask before changing dose or stopping a medicine.');
      questionLines.push('What is each medicine for, how long should I take it, and what side effects should I watch for?');
      assistantPromptLines.push('Explain the medicines mentioned in this document and what they are usually used for.');
    }
    if (signals.diagnosis.length > 0) {
      detailLines.push(`Clinical notes noticed: ${signals.diagnosis.join(' | ')}`);
      questionLines.push('Is there a confirmed diagnosis here, or do I still need more tests?');
      assistantPromptLines.push('What does the diagnosis or impression section suggest?');
    }
    if (risk.level) {
      tipLines.push(`Your page context currently shows ${risk.level.toUpperCase()} risk, so a clinician review is especially important for important findings.`);
    }
    if (!detailLines.length) {
      detailLines.push(`Readable text preview: ${signals.preview || 'The uploaded file could not be read clearly enough for exact interpretation.'}`);
    }
    if (!tipLines.length) {
      tipLines.push('Use this summary as a preparation aid, then confirm medicines, findings, and urgency with a qualified clinician.');
    }
    if (!questionLines.length) {
      questionLines.push('What is the main reason for this visit or prescription, and do I need any follow-up tests or review?');
    }
    if (!assistantPromptLines.length) {
      assistantPromptLines.push('Summarize this report in simple bullet points.');
      assistantPromptLines.push('What should I do next based on this uploaded document?');
    }
    nextStepLines.push(kind === 'prescription'
      ? 'Carry the prescription, medicine strips, and symptom timeline to the next consultation.'
      : 'Keep the receipt/report with your symptoms and any earlier reports for the next review.');
    nextStepLines.push('Seek earlier medical review if pain, swelling, fever, discharge, or other symptoms are getting worse.');

    return [
      'PATIENT-FRIENDLY REPORT',
      `- Report type: ${kind}`,
      `- Main finding: ${mainDiagnosis || mainTest || mainMedicine || 'The uploaded document includes medical details that should be reviewed with a clinician.'}`,
      `- Quick read: ${signals.hospitalLine ? `From ${signals.hospitalLine}.` : 'Source facility name is not fully clear.'}`,
      `- ${buildRiskSnapshot(risk)}`,
      '',
      'Important points:',
      ...detailLines.map((line) => `- ${line}`),
      '',
      'Tips:',
      ...tipLines.map((line) => `- ${line}`),
      '',
      'Follow-up questions for your doctor:',
      ...questionLines.map((line) => `- ${line}`),
      '',
      'Questions you can ask the assistant next:',
      ...assistantPromptLines.slice(0, 3).map((line) => `- ${line}`),
      '',
      'Next steps:',
      ...nextStepLines.map((line) => `- ${line}`),
      '',
      'Disclaimer: This is a prototype summary from extracted text and does not replace medical diagnosis or prescription confirmation.'
    ].join('\n');
  }

  if (context.type === 'report-analysis') {
    const summary = [
      'Diagnosis: Not clearly identified from the uploaded content.',
      'BI-RADS: Check the report text or imaging impression section.',
      'Tumor size: Review the findings/impression section for measurements.',
      'Stage: Staging usually requires clinician confirmation and pathology correlation.',
      'Important observations:',
      '- The AI provider is temporarily unavailable, so this is a safe fallback summary.',
      '- Use the extracted report text and book a specialist review for accurate interpretation.',
      'Key findings:',
      '- Confirm BI-RADS, lesion size, laterality, and impression with a clinician.',
      'Next steps:',
      '- Bring the report to a breast imaging specialist or oncologist.',
      '- If symptoms are worsening, seek medical attention sooner.',
      'Disclaimer: This fallback summary does not replace medical diagnosis.'
    ];
    return summary.join('\n');
  }

  if (focusText.includes('json only') || context.type === 'doctor-finder') {
    return JSON.stringify({
      specialtyHint: risk.level === 'high' ? 'breast surgical oncology' : report.summary ? 'breast imaging specialist' : 'oncology consultation',
      reason: risk.level === 'high'
        ? 'High-risk findings should be reviewed quickly by a specialist.'
        : 'A nearby hospital with breast imaging or oncology support is a sensible next step.'
    });
  }

  if (context.type === 'journey-assistant' && (summaryText || sourceText)) {
    const mainDiagnosis = firstMeaningfulLine(signals.diagnosis);
    const mainTest = firstMeaningfulLine(signals.tests);
    const mainMedicine = firstMeaningfulLine(signals.medicines);
    const likelyMainPoint = mainDiagnosis || mainTest || mainMedicine || sentenceFromText(summaryText || signals.preview);

    if (focusText.includes('medicine') || focusText.includes('prescription')) {
      return `${sentenceFromText(mainMedicine || summaryText) || 'The current document seems to include prescription-related information.'} Please confirm medicine names, dose, and duration directly with your clinician or pharmacist before acting on it.`;
    }
    if (focusText.includes('receipt') || focusText.includes('report') || focusText.includes('what does this') || focusText.includes('what does it mean')) {
      return `${sentenceFromText(likelyMainPoint) || 'The current summary suggests this document records a medical visit or instruction set.'} ${buildRiskSnapshot(risk)}. Ask me about the diagnosis, medicines, tests, or next steps if you want a more specific explanation.`;
    }
    if (focusText.includes('tip') || focusText.includes('next') || focusText.includes('what should i do')) {
      return `${sentenceFromText(summaryText || likelyMainPoint) || 'Use the current summary as preparation for your next consultation.'} Keep the document, symptom timeline, and medicine list together, and confirm important decisions with a qualified clinician.`;
    }
    if (focusText.includes('diagnosis') || focusText.includes('biopsy') || focusText.includes('histopathology')) {
      return `${sentenceFromText(mainDiagnosis || mainTest || summaryText) || 'The uploaded document appears to include diagnostic or pathology language.'} Please ask your clinician whether this is a confirmed diagnosis, what stage or grade applies, and whether any additional imaging or biopsy review is needed.`;
    }
    if (focusText.includes('risk') || focusText.includes('percentage')) {
      return `${buildRiskSnapshot(risk)} ${sentenceFromText(likelyMainPoint) || ''}`.trim();
    }
    return `${sentenceFromText(likelyMainPoint) || 'I found medical details in the uploaded document.'} ${buildRiskSnapshot(risk)}. Ask me about the diagnosis, tests, medicines, or next steps for a more focused explanation.`;
  }

  if (focusText.includes('smoking')) {
    return 'Smoking can increase cancer risk overall and may also affect healing, lung health, and treatment tolerance, so stopping is a strong positive step for long-term health. If you want, I can help you with a practical quit plan and breast-health follow-up checklist.';
  }

  if (focusText.includes('alcohol')) {
    return 'Alcohol can increase breast-cancer risk over time, so reducing or avoiding it is generally a healthy step, especially if you already have risk factors. If you want, I can also help you with practical lifestyle changes around diet, exercise, and screening follow-up.';
  }

  if (focusText.includes('breast cancer')) {
    return 'Breast cancer happens when cells in the breast grow abnormally, and early signs can include a new lump, skin changes, nipple discharge, or persistent pain. Screening, early evaluation, and timely specialist care are important, so please consult a qualified clinician if you have symptoms or concerns.';
  }

  if (focusText.includes('risk')) {
    return `Your current risk summary is ${risk.level ? `${risk.level.toUpperCase()} (${risk.percentage || ''}%)` : 'not available yet'}. Please confirm important results with a qualified clinician.`;
  }

  return 'I can still help with symptoms, screening basics, risk guidance, nearby hospital search, and appointment preparation while the live AI provider is unavailable. Please confirm important medical decisions with a qualified clinician.';
}

app.post('/api/ai-assistant', async (req, res) => {
  try {
    const { prompt, context, attachments, preferredProvider } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing prompt',
      });
    }

    const providers = preferredProvider === 'gemini'
      ? ['gemini', 'openai']
      : preferredProvider === 'openai'
        ? ['openai', 'gemini']
        : Array.isArray(attachments) && attachments.length > 0
        ? ['openai', 'gemini']
        : ['gemini', 'openai'];

    let lastError = null;
    for (const provider of providers) {
      try {
        const text = provider === 'openai'
          ? await callOpenAIAssistant(prompt, context, attachments)
          : await callGeminiAssistant(prompt, context);

        if (text) {
          return res.json({ success: true, text, provider });
        }
      } catch (err) {
        lastError = err;
        console.error(`AI provider failed (${provider}):`, err.message);
      }
    }

    return res.json({
      success: true,
      text: buildLocalFallback(prompt, context),
      provider: 'fallback',
      warning: lastError?.message || 'Using fallback assistant',
    });
  } catch (err) {
    console.error('✗ Error in /api/ai-assistant (Gemini):', err);
    return res.json({
      success: true,
      text: buildLocalFallback(req.body?.prompt, req.body?.context),
      provider: 'fallback',
      warning: 'Unexpected error in AI assistant',
    });
  }
});

app.get('/api/nearby-hospitals', async (req, res) => {
  try {
    const location = String(req.query.location || '').trim();
    if (!location) {
      return res.status(400).json({ success: false, error: 'Location is required' });
    }

    const query = encodeURIComponent(`hospital near ${location}`);
    const osmResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2&limit=8&addressdetails=1`, {
      headers: {
        'User-Agent': 'VITHopeRibbon/1.0 (medical support portal)',
      },
    });

    const data = await osmResponse.json();
    const hospitals = Array.isArray(data)
      ? data.map((item) => ({
          name: item.name || item.display_name.split(',')[0],
          address: item.display_name,
          latitude: item.lat,
          longitude: item.lon,
          category: item.type || 'hospital',
        }))
      : [];

    return res.json({ success: true, hospitals });
  } catch (err) {
    console.error('âœ— Error in /api/nearby-hospitals:', err);
    return res.status(500).json({ success: false, error: 'Could not fetch nearby hospitals' });
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
