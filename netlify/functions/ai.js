// netlify/functions/ai.js
// Server-side proxy for Anthropic API calls. The frontend MUST call /api/ai
// (never api.anthropic.com directly) so the API key stays out of the bundle.
//
// Request:  POST /api/ai  body: { system, prompt, tokens }
// Response: 200 { content: [...] }   |   non-200 { error, detail? }

const log = (...args) => console.log("[fh-ai]", ...args);
const errLog = (...args) => console.error("[fh-ai]", ...args);

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

  const { system = "", prompt = "", tokens = 1024 } = body || {};
  if (!prompt || typeof prompt !== "string") {
    errLog("missing prompt", { prompt });
    return jsonResponse(400, { error: "Missing or invalid prompt" });
  }

  log("→ anthropic", { promptLen: prompt.length, systemLen: system.length, tokens });

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: tokens,
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
