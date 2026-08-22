import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  published: string; // ISO
};

const Input = z.object({
  topic: z.enum(["markets", "country", "custom"]).default("markets"),
  country: z.string().min(2).max(60).optional(),
  query: z.string().min(2).max(80).optional(),
  limit: z.number().int().min(1).max(20).default(10),
});

export const getNews = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }): Promise<{ items: NewsItem[]; error?: string; query: string }> => {
    const { fetchNews, buildQuery } = await import("./news.server");
    const query = buildQuery(data.topic, data.country, data.query);
    try {
      const items = await fetchNews(query, data.limit);
      return { items, query };
    } catch (e) {
      return { items: [], query, error: e instanceof Error ? e.message : "News unavailable" };
    }
  });
