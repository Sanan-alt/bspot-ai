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
        content:
          "You are BSpot AI — a concise, friendly investment assistant. Give practical, specific advice on stocks, currencies, country opportunities, reminders, and portfolio decisions. Avoid disclaimers unless legally required. Keep replies short and clear.",
      },
      ...(history ?? []).reverse().map((m) => ({ role: m.role, content: m.content })),
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
