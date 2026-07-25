/**
 * Multi-provider AI layer with automatic failover.
 *
 * Primary  : Gemini (via Lovable AI Gateway)
 * Fallback : Groq (llama-3.3-70b-versatile) using GROQ_API_KEY
 *
 * Every call keeps the SAME message array (system prompt + full chat history),
 * so when Gemini stops working the conversation context is handed over to Groq
 * untouched and Groq continues driving the site.
 */

export type ChatMessage = { role: string; content: string };

export type AIProvider = "gemini" | "groq";

const GEMINI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_MODEL = "google/gemini-2.5-flash";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export type AIRequest = {
  messages: ChatMessage[];
  tools?: unknown[];
  tool_choice?: unknown;
  temperature?: number;
  stream?: boolean;
};

function buildBody(provider: AIProvider, req: AIRequest) {
  return JSON.stringify({
    model: provider === "gemini" ? GEMINI_MODEL : GROQ_MODEL,
    messages: req.messages,
    ...(req.tools ? { tools: req.tools } : {}),
    ...(req.tool_choice ? { tool_choice: req.tool_choice } : {}),
    ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
    ...(req.stream ? { stream: true } : {}),
  });
}

async function rawCall(provider: AIProvider, req: AIRequest): Promise<Response> {
  if (provider === "gemini") {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    return fetch(GEMINI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: buildBody("gemini", req),
    });
  }
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("Missing GROQ_API_KEY");
  return fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: buildBody("groq", req),
  });
}

function providerOrder(): AIProvider[] {
  const order: AIProvider[] = [];
  if (process.env.LOVABLE_API_KEY) order.push("gemini");
  if (process.env.GROQ_API_KEY) order.push("groq");
  return order.length ? order : ["gemini"];
}

/** Non-streaming completion with Gemini -> Groq failover. */
export async function aiChat(
  req: AIRequest,
): Promise<{ json: any; provider: AIProvider }> {
  let lastError = "AI unavailable";
  for (const provider of providerOrder()) {
    try {
      const res = await rawCall(provider, req);
      if (!res.ok) {
        lastError =
          res.status === 429
            ? "AI rate limit. Try again shortly."
            : res.status === 402
              ? "AI credits exhausted."
              : `AI provider ${provider} error ${res.status}`;
        continue; // failover
      }
      const json = await res.json();
      const msg = json?.choices?.[0]?.message;
      if (!msg || (!msg.content && !msg.tool_calls?.length)) {
        lastError = `AI provider ${provider} returned empty response`;
        continue;
      }
      return { json, provider };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  throw new Error(lastError);
}

/** Plain text completion with failover. */
export async function aiText(req: AIRequest): Promise<{ text: string; provider: AIProvider }> {
  const { json, provider } = await aiChat(req);
  return { text: json?.choices?.[0]?.message?.content ?? "", provider };
}

/** Tool-call JSON arguments with failover. */
export async function aiToolCall<T = any>(
  req: AIRequest,
  toolName: string,
): Promise<{ result: T; provider: AIProvider }> {
  let lastError = "AI unavailable";
  for (const provider of providerOrder()) {
    try {
      const res = await rawCall(provider, req);
      if (!res.ok) {
        lastError =
          res.status === 429
            ? "AI rate limit — try again in a minute."
            : res.status === 402
              ? "AI credits exhausted."
              : `AI provider ${provider} error ${res.status}`;
        continue;
      }
      const json = await res.json();
      const call = json?.choices?.[0]?.message?.tool_calls?.find(
        (c: any) => c?.function?.name === toolName,
      ) ?? json?.choices?.[0]?.message?.tool_calls?.[0];
      if (!call?.function?.arguments) {
        lastError = `AI provider ${provider} returned no ${toolName} result`;
        continue;
      }
      try {
        return { result: JSON.parse(call.function.arguments) as T, provider };
      } catch {
        lastError = `AI provider ${provider} returned malformed JSON`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  throw new Error(lastError);
}

/**
 * Streaming completion with failover.
 * Returns the first provider whose stream actually opened.
 */
export async function aiStream(
  req: AIRequest,
  skip: AIProvider[] = [],
): Promise<{ body: ReadableStream<Uint8Array>; provider: AIProvider }> {
  let lastError = "AI unavailable";
  for (const provider of providerOrder()) {
    if (skip.includes(provider)) continue;
    try {
      const res = await rawCall(provider, { ...req, stream: true });
      if (!res.ok || !res.body) {
        lastError =
          res.status === 429
            ? "AI rate limit. Try again shortly."
            : res.status === 402
              ? "AI credits exhausted."
              : `AI provider ${provider} error ${res.status}`;
        continue;
      }
      return { body: res.body, provider };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  throw new Error(lastError);
}
