import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("Checking OpenAI rate limits...");

    // Minimaler API-Call, um Rate Limit Headers zu erhalten
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 1, // Minimaler Token-Verbrauch
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // Rate Limit Headers extrahieren
    const rateLimits = {
      limitRequests: response.headers.get("x-ratelimit-limit-requests"),
      remainingRequests: response.headers.get("x-ratelimit-remaining-requests"),
      limitTokens: response.headers.get("x-ratelimit-limit-tokens"),
      remainingTokens: response.headers.get("x-ratelimit-remaining-tokens"),
      resetRequests: response.headers.get("x-ratelimit-reset-requests"),
      resetTokens: response.headers.get("x-ratelimit-reset-tokens"),
      timestamp: new Date().toISOString(),
    };

    console.log("Rate limits retrieved:", rateLimits);

    return new Response(JSON.stringify({ success: true, rateLimits }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error checking OpenAI limits:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
