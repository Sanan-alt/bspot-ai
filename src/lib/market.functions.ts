import { createServerFn } from "@tanstack/react-start";
import { loadMarketData } from "./market.server";
import type { MarketResponse, MarketTick } from "./market.server";

export type { MarketResponse, MarketTick };

export const getMarketData = createServerFn({ method: "GET" }).handler(
  async (): Promise<MarketResponse> => loadMarketData(),
);
