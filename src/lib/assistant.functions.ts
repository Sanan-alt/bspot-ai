import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const COST = 2;
const RATE_MAX = 20;          // 20 messages
const RATE_WINDOW = 60;       // per 60 seconds

const ChatInput = z.object({
  message: z.string().min(1).max(4000),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => ChatInput.parse(i))
  .handler(async ({ data, context }): Promise<{ reply: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const { supabase, userId } = context;

    // Rate limit BEFORE spending credits
    const { data: rl, error: rlErr } = await supabase.rpc("check_ai_rate_limit", {
      p_feature: "ai_assistant",
      p_max: RATE_MAX,
      p_window_seconds: RATE_WINDOW,
    });
    if (rlErr) throw new Error(rlErr.message);
    if (rl && (rl as { ok: boolean }).ok === false) {
      throw new Error(`Slow down — limit is ${RATE_MAX} messages per minute. Try again in a moment.`);
    }

    const { error: creditErr } = await supabase.rpc("consume_credits", {
      p_amount: COST,
      p_feature: "ai_assistant",
      p_description: "Chat message",
    });
    if (creditErr) {
      if (creditErr.message?.includes("INSUFFICIENT_CREDITS")) {
        throw new Error(`Not enough credits — chat costs ${COST} per message.`);
      }
      throw new Error(creditErr.message || "Could not spend credits");
    }

    // Persist user message
    await supabase.from("chat_messages").insert({
      user_id: userId,
      role: "user",
      content: data.message,
    });

    // Load profile for personalized context
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name,home_country,target_country,investment_budget_usd,business_interests,experience_level,timeline")
      .eq("id", userId)
      .maybeSingle();

    // Load last ~20 messages for context
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

    const { aiText } = await import("./ai-provider.server");
    const { text } = await aiText({ messages });
    const reply = text || "No reply.";


    await supabase.from("chat_messages").insert({
      user_id: userId,
      role: "assistant",
      content: reply,
    });

    return { reply };
  });

export const clearChatHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
