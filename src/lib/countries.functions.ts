import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  code: z.string().min(2).max(3),
  name: z.string().min(1).max(80),
});

export const scoreCountry = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const prompt = `You are an investment analyst. Score ${data.name} (${data.code}) for foreign investors right now.
Return ONLY valid JSON with this shape:
{
  "overall": <0-100>,
  "stability": <0-100>,
  "growth": <0-100>,
  "risk": <0-100>,
  "currency": "<ISO code>",
  "summary": "<1-2 sentence summary>",
  "opportunities": ["<3-5 short bullets>"],
  "risks": ["<2-4 short bullets>"],
  "top_sectors": ["<3-5 sectors>"]
}
No prose outside JSON.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You return strict JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI gateway ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    const cleaned = content.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
      throw new Error("AI returned non-JSON");
    }
  });
