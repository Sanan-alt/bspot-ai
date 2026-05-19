import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  summary: z.string().min(1).max(8000),
});

const COST = 15;

export const optimizePortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data, context }): Promise<{ advice: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const { error: creditErr } = await context.supabase.rpc("consume_credits", {
      p_amount: COST,
      p_feature: "portfolio_optimize",
      p_description: "AI portfolio review",
    });
    if (creditErr) {
      if (creditErr.message?.includes("INSUFFICIENT_CREDITS")) {
        throw new Error(`Not enough credits — this action costs ${COST}.`);
      }
      throw new Error(creditErr.message || "Could not spend credits");
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a portfolio advisor. Reply with 4-6 concise practical bullet points." },
          { role: "user", content: `Review this portfolio and give optimization tips:\n${data.summary}` },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("AI rate limit. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI gateway ${res.status}`);
    }
    const json = await res.json();
    return { advice: json?.choices?.[0]?.message?.content ?? "No advice returned." };
  });
