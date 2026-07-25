import { createServerFn } from "@tanstack/react-start";

export type MarketTick = {
  symbol: string;
  name: string;
  category: "forex" | "crypto" | "stock";
  price: number;
  changePct: number;
};

export type MarketResponse = {
  ticks: MarketTick[];
  errors: { category: MarketTick["category"]; message: string }[];
  fetched_at: number;
};

export const getMarketData = createServerFn({ method: "GET" }).handler(
  async (): Promise<MarketResponse> => {
    const { loadMarketData } = await import("./market.server");
    return loadMarketData();
  },
);
