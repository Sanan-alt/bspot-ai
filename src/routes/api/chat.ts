import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const COST = 2;
const RATE_MAX = 20;
const RATE_WINDOW = 60;

function sseError(message: string, status = 400) {
  const body = `event: error\ndata: ${JSON.stringify({ message })}\n\n`;
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        const apiKey = process.env.LOVABLE_API_KEY || process.env.GROQ_API_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !apiKey) {
          return sseError("Server misconfigured", 500);
        }


        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return sseError("Unauthorized", 401);
        }
        const token = authHeader.slice("Bearer ".length);

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        const { data: claimData, error: claimErr } = await supabase.auth.getClaims(token);
        if (claimErr || !claimData?.claims?.sub) {
          return sseError("Unauthorized", 401);
        }
        const userId = claimData.claims.sub;

        let body: { message?: unknown };
        try {
          body = await request.json();
        } catch {
          return sseError("Invalid JSON body");
        }
        const message = typeof body.message === "string" ? body.message.trim() : "";
        if (!message || message.length > 4000) {
          return sseError("Message must be 1-4000 characters");
        }

        // Rate limit
        const { data: rl, error: rlErr } = await supabase.rpc("check_ai_rate_limit", {
          p_feature: "ai_assistant",
          p_max: RATE_MAX,
          p_window_seconds: RATE_WINDOW,
        });
        if (rlErr) return sseError(rlErr.message, 500);
        if (rl && (rl as { ok: boolean }).ok === false) {
          return sseError(`Slow down — limit is ${RATE_MAX} messages per minute. Try again in a moment.`, 429);
        }

        // Credits
        const { error: creditErr } = await supabase.rpc("consume_credits", {
          p_amount: COST,
          p_feature: "ai_assistant",
          p_description: "Chat message",
        });
        if (creditErr) {
          if (creditErr.message?.includes("INSUFFICIENT_CREDITS")) {
            return sseError(`Not enough credits — chat costs ${COST} per message.`, 402);
          }
          return sseError(creditErr.message || "Could not spend credits", 500);
        }

        // Persist user message
        await supabase.from("chat_messages").insert({
          user_id: userId,
          role: "user",
          content: message,
        });

        // Profile + history
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name,home_country,target_country,investment_budget_usd,business_interests,experience_level,timeline")
          .eq("id", userId)
          .maybeSingle();

        const { data: history } = await supabase
          .from("chat_messages")
          .select("role,content")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        const profileBlock = profile
          ? `\n\nUSER PROFILE (use this to personalize every answer; reference their currency, nationality, and target country naturally):
- Name: ${profile.display_name ?? "user"}
- Home country / nationality: ${profile.home_country ?? "unknown"}
- Target country: ${profile.target_country ?? "unknown"}
- Investment budget (USD): ${profile.investment_budget_usd ?? "unknown"}
- Business interests: ${Array.isArray(profile.business_interests) ? profile.business_interests.join(", ") : "unknown"}
- Experience level: ${profile.experience_level ?? "unknown"}
- Timeline: ${profile.timeline ?? "unknown"}`
          : "";

        const messages = [
          {
            role: "system",
            content: `You are BSpot Advisor, a friendly expert AI assistant built specifically for investors and entrepreneurs from Pakistan, India, Egypt, Nigeria, Bangladesh, and other emerging markets who want to start businesses or invest in UAE, UK, Canada, Singapore, Saudi Arabia, and other countries.

YOUR PERSONALITY:
You are warm, direct, and practical — like a trusted friend who has actually done business abroad. You give real numbers, real steps, and honest warnings. You are never vague.

TOPICS YOU ANSWER (stay within these):
- Starting a business in UAE, UK, Canada, Singapore, Saudi Arabia, Germany
- Free Zone vs Mainland in UAE; company registration costs and processes
- Investor / Golden / Green / Freelance Visa requirements
- Minimum investment amounts for residency by country
- Tax rates and obligations for foreign business owners
- Document requirements based on user nationality
- Currency impact on business budgets
- Investment strategies, stocks, crypto, real assets
- Business planning, startup funding, and scaling
- Laws and regulations for foreign investors by country

IF USER ASKS SOMETHING OFF-TOPIC:
Reply warmly but redirect to business / investment topics.

RESPONSE FORMAT RULES:
1. Always give costs in BOTH the user's local currency AND the target currency when known
2. Specify if a law applies to ALL foreigners or specifically to the user's nationality
3. End every response with ONE clear, specific next action
4. Keep responses under 250 words unless the user asks for more detail
5. Never invent specific numbers — use realistic ranges
6. If unsure, say "I don't have current data on this, but based on what I know..." and continue${profileBlock}`,
          },
          ...(history ?? [])
            .filter((m) => m.role === "user" || m.role === "assistant")
            .reverse()
            .map((m) => ({ role: m.role, content: m.content })),
        ];

        // Call upstream with streaming (Gemini primary, Groq automatic failover)
        const { aiStream } = await import("@/lib/ai-provider.server");

        let opened: { body: ReadableStream<Uint8Array>; provider: "gemini" | "groq" };
        try {
          opened = await aiStream({ messages });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "AI unavailable";
          const status = msg.includes("rate limit") ? 429 : msg.includes("credits") ? 402 : 502;
          return sseError(msg, status);
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let fullReply = "";

        const stream = new ReadableStream({
          async start(controller) {
            const pump = async (
              body: ReadableStream<Uint8Array>,
              provider: "gemini" | "groq",
            ) => {
              const reader = body.getReader();
              let buffer = "";
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const payload = trimmed.slice(5).trim();
                  if (payload === "[DONE]") continue;
                  try {
                    const json = JSON.parse(payload);
                    const delta: string | undefined = json?.choices?.[0]?.delta?.content;
                    if (delta) {
                      fullReply += delta;
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ delta, provider })}\n\n`),
                      );
                    }
                  } catch {
                    // ignore malformed frame
                  }
                }
              }
            };

            const persist = async () => {
              if (fullReply) {
                await supabase.from("chat_messages").insert({
                  user_id: userId,
                  role: "assistant",
                  content: fullReply,
                });
              }
            };

            try {
              try {
                await pump(opened.body, opened.provider);
              } catch (streamErr) {
                // Primary died mid-stream: save what it produced, then hand the
                // whole conversation over to the fallback provider.
                if (opened.provider === "gemini") {
                  await persist();
                  const carried = fullReply;
                  fullReply = "";
                  const handover = carried
                    ? [
                        ...messages,
                        { role: "assistant", content: carried },
                        {
                          role: "user",
                          content:
                            "Your previous answer was cut off. Continue seamlessly from where it stopped, without repeating what was already said.",
                        },
                      ]
                    : messages;
                  const fallback = await aiStream({ messages: handover }, ["gemini"]);
                  controller.enqueue(
                    encoder.encode(
                      `event: provider\ndata: ${JSON.stringify({ provider: fallback.provider })}\n\n`,
                    ),
                  );
                  await pump(fallback.body, fallback.provider);
                } else {
                  throw streamErr;
                }
              }

              await persist();
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
            } catch (err) {
              await persist();
              const msg = err instanceof Error ? err.message : "Stream failed";
              controller.enqueue(
                encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`),
              );
              controller.close();
            }
          },
        });


        return new Response(stream, {
          status: 200,
          headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-cache, no-transform",
            "x-accel-buffering": "no",
          },
        });
      },
    },
  },
});
