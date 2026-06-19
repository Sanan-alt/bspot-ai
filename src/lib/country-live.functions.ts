import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const Input = z.object({ country_code: z.string().min(2).max(3) });

export type CountryLive = {
  country_code: string;
  currency_code: string;
  fx_rate_usd: number | null;
  inflation_pct: number | null;
  policy_rate_pct: number | null;
  source: string | null;
  fetched_at: string;
};

export const getCountryLive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }): Promise<CountryLive | null> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: row } = await supabase
      .from("country_live_data")
      .select("country_code, currency_code, fx_rate_usd, inflation_pct, policy_rate_pct, source, fetched_at")
      .eq("country_code", data.country_code.toUpperCase())
      .maybeSingle();
    return (row as CountryLive | null) ?? null;
  });
