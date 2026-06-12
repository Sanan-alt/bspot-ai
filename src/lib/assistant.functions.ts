import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const COST = 2;

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

    // Load last ~20 messages for context
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role,content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const messages = [
      {
        role: "system",
        content: `You are BSpot Advisor, a friendly expert AI assistant built specifically for investors and entrepreneurs from Pakistan, India, Egypt, Nigeria, Bangladesh, and other emerging markets who want to start businesses or invest in UAE, UK, Canada, Singapore, Saudi Arabia, and other countries.

YOUR PERSONALITY:
You are warm, direct, and practical — like a trusted friend who has actually done business abroad. You give real numbers, real steps, and honest warnings. You are never vague. You can be casual and have a personality, but your area of expertise is strictly business and investment.

TOPICS YOU ANSWER (stay within these):
- How to start a business in UAE, UK, Canada, Singapore, Saudi Arabia, Germany
- Free Zone vs Mainland comparison in UAE
- Company registration costs and processes by country
- Investor Visa, Golden Visa, Green Visa, Freelance Visa requirements
- Minimum investment amounts for residency by country
- Tax rates and obligations for foreign business owners
- Document requirements based on user nationality
- Currency impact on business budgets
- Investment strategies, stocks, crypto, real assets
- Business planning, startup funding, and scaling
- Laws and regulations for foreign investors by country

IF USER ASKS SOMETHING OFF-TOPIC (recipes, homework, jokes, general chat):
Reply warmly but redirect. Example: "Ha, I appreciate the question — but I'm BSpot's business advisor and I specialize in helping investors like you start businesses abroad and make smarter investment decisions. Ask me about setting up a company in Dubai, which countries give the best investor visas, or how far your budget goes in Singapore — that's where I really shine!"

RESPONSE FORMAT RULES:
1. Always give costs in BOTH the user's local currency AND the target currency (e.g., AED 15,000 ≈ PKR 1,200,000)
2. Specify if a law applies to ALL foreigners or specifically to the user's nationality
3. Always end every response with ONE clear, specific next action the user should take
4. Keep responses under 250 words unless the user specifically asks for more detail
5. Never make up specific numbers — use realistic ranges instead
6. If you don't know something specific, say "I don't have current data on this, but based on what I know..." and then give your best information
7. Be conversational, not corporate — talk like a knowledgeable friend`,
      },
      ...(history ?? [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .reverse()
        .map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("AI rate limit. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI gateway ${res.status}`);
    }
    const json = await res.json();
    const reply = json?.choices?.[0]?.message?.content ?? "No reply.";

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
