// supabase/functions/ai-risk/index.ts
// Breast cancer risk assessment endpoint
// gemini-1.5-flash for text-only, gemini-1.5-pro for image input
// Token discipline: 600 maxOutputTokens, logs to ai_chat_logs, saves to risk_assessments

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Short, static system prompt for structured risk assessment output
const SYSTEM_PROMPT = `You are a breast cancer risk assessment tool. Given patient symptoms and clinical data, provide a structured risk assessment. Return a JSON object with these exact fields:
- riskLevel: "low", "medium", or "high"
- riskPercentage: number 0-100
- cancerType: predicted type or "Not Determined"
- message: brief summary sentence
- factors: array of contributing factor strings
- recommendations: object with { tips: string[], foods: string[], medications: string[] }
Return ONLY valid JSON, no markdown fences or explanation outside the JSON.`;

const GEMINI_FLASH_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const GEMINI_PRO_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const { symptoms, manualData, imageBase64, sessionId, userId } = await req.json();

    if (!symptoms && !manualData) {
      return new Response(
        JSON.stringify({ error: "Missing symptoms or manualData" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const session = sessionId || "anonymous";

    // --- Supabase client (service_role) ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);

    // --- Rate limit: 20 AI calls per session per day ---
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: callCount } = await sb
      .from("ai_chat_logs")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session)
      .gte("created_at", oneDayAgo);

    if ((callCount ?? 0) >= 20) {
      return new Response(
        JSON.stringify({
          error: "Daily AI query limit reached. Please try again tomorrow.",
          success: false,
        }),
        { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // --- Build the prompt from patient data ---
    const symptomsArr = Array.isArray(symptoms) ? symptoms : (typeof symptoms === "string" ? JSON.parse(symptoms) : []);
    const manual = typeof manualData === "string" ? JSON.parse(manualData) : (manualData || {});

    const patientPrompt = buildPatientPrompt(symptomsArr, manual);

    // --- Select model: flash for text-only, pro for image ---
    const hasImage = imageBase64 && typeof imageBase64 === "string" && imageBase64.length > 100;
    const geminiUrl = hasImage ? GEMINI_PRO_URL : GEMINI_FLASH_URL;
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // --- Call Gemini ---
    let result: RiskResult;
    let tokensUsed = 0;
    let provider = hasImage ? "gemini-pro" : "gemini-flash";

    try {
      const geminiResponse = await callGemini(geminiKey, geminiUrl, patientPrompt, imageBase64 || null);
      result = geminiResponse.result;
      tokensUsed = geminiResponse.tokensUsed;
    } catch (geminiError) {
      console.error("Gemini risk assessment error:", geminiError);

      // Fallback: generate a conservative local assessment
      result = generateFallbackAssessment(symptomsArr, manual);
      provider = "fallback";
    }

    // --- Log to ai_chat_logs ---
    await sb.from("ai_chat_logs").insert({
      session_id: session,
      provider,
      section: "risk_assessment",
      tokens_used: tokensUsed,
    });

    // --- Save to risk_assessments ---
    await sb.from("risk_assessments").insert({
      session_id: session,
      user_id: userId || null,
      risk_level: result.riskLevel,
      risk_percentage: result.riskPercentage,
      recommendations: JSON.stringify(result.recommendations),
    });

    // --- Return response matching displayResults() expected shape ---
    return new Response(
      JSON.stringify({
        success: true,
        riskLevel: result.riskLevel,
        riskPercentage: result.riskPercentage,
        cancerType: result.cancerType,
        message: result.message,
        factors: result.factors,
        recommendations: result.recommendations,
        provider,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-risk error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", success: false }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});

// ── Types ────────────────────────────────────────────────────────────────────

interface RiskResult {
  riskLevel: string;
  riskPercentage: number;
  cancerType: string;
  message: string;
  factors: string[];
  recommendations: {
    tips: string[];
    foods: string[];
    medications: string[];
  };
}

// ── Build patient prompt from form data ──────────────────────────────────────

function buildPatientPrompt(symptoms: string[], manualData: Record<string, unknown>): string {
  const parts: string[] = [];

  if (manualData.age) parts.push(`Age: ${manualData.age}`);
  if (manualData.gender) parts.push(`Gender: ${manualData.gender}`);
  if (manualData.familyHistory) parts.push(`Family history: ${manualData.familyHistory}`);
  if (manualData.biradsScore) parts.push(`BI-RADS score: ${manualData.biradsScore}`);
  if (manualData.massSize) parts.push(`Mass size: ${manualData.massSize}`);
  if (manualData.menstrualHistory) parts.push(`Menstrual history: ${manualData.menstrualHistory}`);
  if (manualData.personalHistory) parts.push(`Personal cancer history: ${manualData.personalHistory}`);
  if (manualData.geneticTesting) parts.push(`Genetic testing: ${manualData.geneticTesting}`);
  if (manualData.smoking) parts.push(`Smoking: ${manualData.smoking}`);
  if (manualData.alcohol) parts.push(`Alcohol: ${manualData.alcohol}`);
  if (manualData.activity) parts.push(`Physical activity: ${manualData.activity}`);
  if (manualData.hrt) parts.push(`HRT use: ${manualData.hrt}`);
  if (manualData.lastMammogram) parts.push(`Last mammogram: ${manualData.lastMammogram}`);

  if (symptoms.length > 0) {
    parts.push(`Reported symptoms: ${symptoms.join(", ")}`);
  } else {
    parts.push("No specific symptoms reported.");
  }

  return `Patient data for risk assessment:\n${parts.join("\n")}`;
}

// ── Gemini API call ──────────────────────────────────────────────────────────

async function callGemini(
  apiKey: string,
  url: string,
  prompt: string,
  imageBase64: string | null
): Promise<{ result: RiskResult; tokensUsed: number }> {
  // Build content parts
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];

  // Add image if provided (for gemini-1.5-pro)
  if (imageBase64) {
    // Strip data URL prefix if present
    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    parts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: base64Data,
      },
    });
  }

  const response = await fetch(`${url}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [{ role: "user", parts }],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const tokensUsed =
    (data.usageMetadata?.candidatesTokenCount || 0) +
    (data.usageMetadata?.promptTokenCount || 0);

  // Parse JSON response
  let result: RiskResult;
  try {
    // Strip markdown code fences if present
    const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    result = JSON.parse(cleaned);
  } catch {
    // If parsing fails, generate conservative fallback
    console.error("Failed to parse Gemini risk response:", rawText);
    result = {
      riskLevel: "medium",
      riskPercentage: 30,
      cancerType: "Not Determined",
      message: "Assessment generated with limited data. Please consult a healthcare professional.",
      factors: ["Incomplete AI response"],
      recommendations: {
        tips: ["Schedule a clinical breast exam", "Perform monthly self-examinations"],
        foods: ["Cruciferous vegetables", "Berries", "Green tea"],
        medications: ["Consult doctor for personalized recommendations"],
      },
    };
  }

  // Ensure all required fields exist with defaults
  result.riskLevel = result.riskLevel || "medium";
  result.riskPercentage = typeof result.riskPercentage === "number" ? result.riskPercentage : 30;
  result.cancerType = result.cancerType || "Not Determined";
  result.message = result.message || "Risk assessment completed. Please consult a healthcare professional.";
  result.factors = Array.isArray(result.factors) ? result.factors : [];
  result.recommendations = result.recommendations || { tips: [], foods: [], medications: [] };
  result.recommendations.tips = result.recommendations.tips || [];
  result.recommendations.foods = result.recommendations.foods || [];
  result.recommendations.medications = result.recommendations.medications || [];

  return { result, tokensUsed };
}

// ── Fallback assessment (no AI call — used when Gemini fails) ────────────────

function generateFallbackAssessment(
  symptoms: string[],
  manualData: Record<string, unknown>
): RiskResult {
  let riskScore = 10; // baseline

  // Symptom-based scoring
  riskScore += symptoms.length * 8;

  // Family history
  const fh = String(manualData.familyHistory || "");
  if (fh === "multiple") riskScore += 25;
  else if (fh === "first-degree") riskScore += 15;

  // Age
  const age = Number(manualData.age || 0);
  if (age >= 50) riskScore += 10;
  else if (age >= 40) riskScore += 5;

  // BI-RADS
  const birads = Number(manualData.biradsScore || 0);
  if (birads >= 4) riskScore += 20;
  else if (birads >= 3) riskScore += 10;

  // Personal history
  if (manualData.personalHistory && manualData.personalHistory !== "no") riskScore += 15;

  // Cap at 95
  riskScore = Math.min(riskScore, 95);

  const riskLevel = riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low";

  return {
    riskLevel,
    riskPercentage: riskScore,
    cancerType: "Not Determined",
    message: "This is a preliminary risk estimate. AI service was temporarily unavailable. Please consult a healthcare professional for accurate assessment.",
    factors: [
      ...(symptoms.length > 0 ? [`${symptoms.length} symptom(s) reported`] : []),
      ...(fh ? [`Family history: ${fh}`] : []),
      ...(age > 0 ? [`Age: ${age}`] : []),
      ...(birads > 0 ? [`BI-RADS: ${birads}`] : []),
    ],
    recommendations: {
      tips: [
        "Schedule a clinical breast examination",
        "Perform monthly breast self-examinations",
        "Discuss screening schedule with your doctor",
        "Maintain a healthy lifestyle with regular exercise",
      ],
      foods: [
        "Cruciferous vegetables (broccoli, cauliflower)",
        "Berries and citrus fruits",
        "Green tea",
        "Fatty fish rich in omega-3",
      ],
      medications: [
        "Consult your doctor for personalized medication recommendations",
        "Discuss vitamin D supplementation with your healthcare provider",
      ],
    },
  };
}
