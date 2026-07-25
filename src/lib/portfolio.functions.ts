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
    const apiKey = process.env.LOVABLE_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("No AI provider configured");

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

    const { aiText } = await import("./ai-provider.server");
    const { text } = await aiText({
      messages: [
        { role: "system", content: "You are a portfolio advisor. Reply with 4-6 concise practical bullet points." },
        { role: "user", content: `Review this portfolio and give optimization tips:\n${data.summary}` },
      ],
    });
    return { advice: text || "No advice returned." };

  });
