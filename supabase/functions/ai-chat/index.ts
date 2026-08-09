// supabase/functions/ai-chat/index.ts
// Breast cancer awareness chat endpoint — Gemini primary, OpenAI fallback
// Token discipline: faq_cache check, rate limit 20/day, maxOutputTokens 400, last 3 messages only

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Short, static system prompt (~150 tokens) — never rebuilt per request
const SYSTEM_PROMPT = `You are a supportive breast cancer awareness assistant. Answer questions about breast cancer symptoms, screening, prevention, treatment options, and emotional support. Keep answers concise (2-3 sentences unless the user asks for detail). Be calm, accurate, and non-alarming. Always recommend consulting a qualified healthcare professional for medical decisions. Never diagnose or prescribe.`;

const GEMINI_CHAT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
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
    const { message, sessionId, history } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'message' field" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const session = sessionId || "anonymous";

    // --- Supabase client (service_role for server-side operations) ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);

    // --- 1. FAQ cache check (exact match) ---
    const { data: cached } = await sb
      .from("faq_cache")
      .select("answer, hits")
      .eq("question", message.trim().toLowerCase())
      .maybeSingle();

    if (cached) {
      // Increment hits counter
      await sb
        .from("faq_cache")
        .update({ hits: (cached.hits || 0) + 1 })
        .eq("question", message.trim().toLowerCase());

      return new Response(
        JSON.stringify({ reply: cached.answer, provider: "cache" }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // --- 2. Rate limit: 20 AI calls per session per day ---
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: callCount } = await sb
      .from("ai_chat_logs")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session)
      .gte("created_at", oneDayAgo);

    if ((callCount ?? 0) >= 20) {
      return new Response(
        JSON.stringify({
          error: "You've reached the daily limit of 20 AI queries. Please try again tomorrow.",
          reply: "You've reached the daily limit of 20 AI queries. Please try again tomorrow.",
          provider: "rate_limit",
        }),
        { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // --- 3. Build conversation (last 3 messages only) ---
    const recentHistory = Array.isArray(history) ? history.slice(-3) : [];

    // --- 4. Try Gemini first ---
    let reply = "";
    let provider = "";
    let tokensUsed = 0;

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiKey) {
      try {
        const geminiResult = await callGemini(geminiKey, message, recentHistory);
        reply = geminiResult.text;
        tokensUsed = geminiResult.tokensUsed;
        provider = "gemini";
      } catch (geminiError) {
        console.error("Gemini error, falling back to OpenAI:", geminiError);
      }
    }

    // --- 5. OpenAI fallback (on Gemini error/429) ---
    if (!reply) {
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiKey) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable" }),
          { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      try {
        const openaiResult = await callOpenAI(openaiKey, message, recentHistory);
        reply = openaiResult.text;
        tokensUsed = openaiResult.tokensUsed;
        provider = "openai";
      } catch (openaiError) {
        console.error("OpenAI fallback also failed:", openaiError);
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable" }),
          { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
    }

    // --- 6. Log to ai_chat_logs ---
    await sb.from("ai_chat_logs").insert({
      session_id: session,
      provider,
      section: "chat",
      tokens_used: tokensUsed,
    });

    // --- 7. Return response ---
    return new Response(
      JSON.stringify({ reply, provider }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-chat error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});

// ── Gemini call ──────────────────────────────────────────────────────────────

async function callGemini(
  apiKey: string,
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<{ text: string; tokensUsed: number }> {
  // Build contents array: system instruction + history + current message
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Add history (last 3 messages)
  for (const msg of history) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  // Add current user message
  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  const response = await fetch(`${GEMINI_CHAT_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
  const tokensUsed =
    (data.usageMetadata?.candidatesTokenCount || 0) +
    (data.usageMetadata?.promptTokenCount || 0);

  return { text, tokensUsed };
}

// ── OpenAI fallback ──────────────────────────────────────────────────────────

async function callOpenAI(
  apiKey: string,
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<{ text: string; tokensUsed: number }> {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((msg) => ({
      role: msg.role === "user" ? "user" as const : "assistant" as const,
      content: msg.content,
    })),
    { role: "user" as const, content: message },
  ];

  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const text =
    data.choices?.[0]?.message?.content || "I couldn't generate a response.";
  const tokensUsed = data.usage?.total_tokens || 0;

  return { text, tokensUsed };
}
