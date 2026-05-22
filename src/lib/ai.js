// Shared client for the server-side Anthropic proxy.
// The frontend MUST go through the Netlify Function — the API key lives
// server-side and must never reach the bundle. Returns the joined text of
// the response, or null on any failure (callers handle the null path).

export async function ai(system, prompt, { tokens = 1024, model } = {}) {
  try {
    const r = await fetch("/.netlify/functions/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, prompt, tokens, model }),
    });
    let d;
    try {
      d = await r.json();
    } catch (e) {
      console.error("[fh-ai] non-JSON response", r.status, e);
      return null;
    }
    if (!r.ok) {
      console.error("[fh-ai] error", r.status, d?.error, d?.detail);
      return null;
    }
    const text = d?.content?.map((b) => b.text || "").join("\n").trim() || null;
    if (!text) console.warn("[fh-ai] empty content", d);
    return text;
  } catch (err) {
    console.error("[fh-ai] network failure", err);
    return null;
  }
}
