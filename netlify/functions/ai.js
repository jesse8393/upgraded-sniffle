// netlify/functions/ai.js
// Server-side proxy for Anthropic API calls. The frontend MUST call /api/ai
// (never api.anthropic.com directly) so the API key stays out of the bundle.
//
// Request:  POST /api/ai  body: { system, prompt, tokens }
// Response: 200 { content: [...] }   |   non-200 { error, detail? }

const log = (...args) => console.log("[fh-ai]", ...args);
const errLog = (...args) => console.error("[fh-ai]", ...args);

// Input guards — keep one shared API key from being abused by oversized or
// runaway requests. These are deliberately generous for the app's real use
// (note parsing, bids, compose) but cap pathological payloads.
const MAX_PROMPT_CHARS = 24000;
const MAX_SYSTEM_CHARS = 8000;
const MAX_TOKENS = 4096;
const MIN_TOKENS = 1;

// Only these models may be requested. Defaults to Sonnet for the app's
// text tasks; callers can opt into Opus/Haiku but nothing off-list.
const DEFAULT_MODEL = "claude-sonnet-4-6";
const ALLOWED_MODELS = new Set([
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
]);

export default async (req) => {
  const t0 = Date.now();

  if (req.method !== "POST") {
    errLog("rejected: non-POST", req.method);
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    errLog("ANTHROPIC_API_KEY not set in environment");
    return jsonResponse(500, {
      error: "AI not configured",
      detail: "ANTHROPIC_API_KEY is missing from the Netlify environment.",
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    errLog("invalid JSON body", e?.message);
    return jsonResponse(400, { error: "Invalid JSON body", detail: e?.message });
  }

  const { system = "", prompt = "", tokens = 1024, model } = body || {};
  if (!prompt || typeof prompt !== "string") {
    errLog("missing prompt", { prompt });
    return jsonResponse(400, { error: "Missing or invalid prompt" });
  }
  if (typeof system !== "string") {
    return jsonResponse(400, { error: "Invalid system prompt" });
  }
  if (prompt.length > MAX_PROMPT_CHARS || system.length > MAX_SYSTEM_CHARS) {
    errLog("payload too large", { promptLen: prompt.length, systemLen: system.length });
    return jsonResponse(413, {
      error: "Request too large",
      detail: `prompt ≤ ${MAX_PROMPT_CHARS} chars, system ≤ ${MAX_SYSTEM_CHARS} chars`,
    });
  }

  // Clamp tokens into a sane range; ignore non-numeric input.
  const reqTokens = Number(tokens);
  const maxTokens = Number.isFinite(reqTokens)
    ? Math.min(MAX_TOKENS, Math.max(MIN_TOKENS, Math.floor(reqTokens)))
    : 1024;

  const chosenModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;

  log("→ anthropic", { model: chosenModel, promptLen: prompt.length, systemLen: system.length, maxTokens });

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: chosenModel,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      errLog("anthropic returned non-JSON", { status: upstream.status, text: text.slice(0, 200) });
      return jsonResponse(502, {
        error: "Upstream returned non-JSON",
        detail: text.slice(0, 200),
      });
    }

    if (!upstream.ok) {
      errLog("anthropic error", { status: upstream.status, data });
      return jsonResponse(upstream.status, {
        error: "Upstream error",
        detail: data?.error?.message || data?.error || "unknown",
      });
    }

    const ms = Date.now() - t0;
    const blocks = Array.isArray(data?.content) ? data.content.length : 0;
    log("← anthropic", { status: upstream.status, blocks, ms });

    return jsonResponse(200, data);
  } catch (err) {
    errLog("fetch failed", err?.message, err?.stack);
    return jsonResponse(500, {
      error: "AI request failed",
      detail: err?.message || "unknown",
    });
  }
};

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// NOTE: We deliberately do NOT use `export const config = { path: "/api/ai" }`.
// Instead the function deploys at the default `/.netlify/functions/ai` path
// and is exposed at `/api/ai` via the rewrite rule in netlify.toml. This
// keeps the routing single-sourced and works on every Netlify runtime version
// (no reliance on Functions 2.0 path registration).
