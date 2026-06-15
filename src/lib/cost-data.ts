// Realistic ballpark costs for starting common business types in target countries.
// Figures are research-based estimates in USD for the FIRST YEAR (setup + 12 months operating).
// Use as guidance; actual costs vary by city, freezone, and operator.

export type BusinessType =
  | "ecommerce"
  | "restaurant"
  | "retail_shop"
  | "tech_saas"
  | "trading_import_export"
  | "consulting_services"
  | "real_estate_investment";

export type CostCountry = "AE" | "GB" | "CA" | "SG" | "US";

export type CostBreakdown = {
  license: number;     // company registration / trade license
  visa: number;        // investor/founder visa + dependents (1 person)
  office: number;      // 12 mo office / flexi-desk / virtual
  staff: number;       // 12 mo minimum staffing
  inventory: number;   // initial inventory or equipment
  marketing: number;   // 12 mo marketing budget
  legal: number;       // legal, accounting, compliance 12 mo
  bank_deposit: number;// minimum bank balance commonly required
  contingency: number; // 10% buffer
};

export type CountryMeta = {
  label: string;
  currency: string;     // local currency code
  usdRate: number;      // 1 USD = X local (approximate, June 2026)
  notes: string;
};

export const COUNTRY_META: Record<CostCountry, CountryMeta> = {
  AE: { label: "UAE 🇦🇪", currency: "AED", usdRate: 3.67, notes: "Free zones (IFZA, Meydan, DMCC) offer 100% foreign ownership and 0% personal tax." },
  GB: { label: "United Kingdom 🇬🇧", currency: "GBP", usdRate: 0.79, notes: "Companies House registration is cheap; Innovator Founder visa needs endorsement." },
  CA: { label: "Canada 🇨🇦", currency: "CAD", usdRate: 1.36, notes: "Start-Up Visa requires designated VC/incubator support letter." },
  SG: { label: "Singapore 🇸🇬", currency: "SGD", usdRate: 1.35, notes: "EntrePass requires innovative/VC-backed business; ACRA registration in 1 day." },
  US: { label: "USA 🇺🇸", currency: "USD", usdRate: 1, notes: "Delaware/Wyoming LLC is fast; E-2/L-1 visas need substantial investment + treaty." },
};

export const BUSINESS_LABELS: Record<BusinessType, string> = {
  ecommerce: "E-commerce store",
  restaurant: "Restaurant / Café",
  retail_shop: "Retail shop",
  tech_saas: "Tech / SaaS startup",
  trading_import_export: "Trading / Import-Export",
  consulting_services: "Consulting / Services firm",
  real_estate_investment: "Real estate investment",
};

// USD figures; everything is the FIRST-YEAR total estimate per line item.
export const COSTS: Record<BusinessType, Record<CostCountry, CostBreakdown>> = {
  ecommerce: {
    AE: { license: 4500, visa: 1800, office: 2400, staff: 18000, inventory: 15000, marketing: 12000, legal: 4000, bank_deposit: 13700, contingency: 0 },
    GB: { license: 200, visa: 2500, office: 3600, staff: 28000, inventory: 12000, marketing: 10000, legal: 5000, bank_deposit: 5000, contingency: 0 },
    CA: { license: 400, visa: 1800, office: 4800, staff: 32000, inventory: 12000, marketing: 10000, legal: 5500, bank_deposit: 7500, contingency: 0 },
    SG: { license: 400, visa: 2000, office: 4200, staff: 30000, inventory: 12000, marketing: 9000, legal: 5500, bank_deposit: 37000, contingency: 0 },
    US: { license: 700, visa: 6000, office: 6000, staff: 38000, inventory: 15000, marketing: 12000, legal: 7500, bank_deposit: 10000, contingency: 0 },
  },
  restaurant: {
    AE: { license: 8000, visa: 1800, office: 36000, staff: 60000, inventory: 35000, marketing: 12000, legal: 5000, bank_deposit: 13700, contingency: 0 },
    GB: { license: 200, visa: 2500, office: 42000, staff: 95000, inventory: 30000, marketing: 14000, legal: 6500, bank_deposit: 5000, contingency: 0 },
    CA: { license: 1500, visa: 1800, office: 48000, staff: 110000, inventory: 35000, marketing: 12000, legal: 7000, bank_deposit: 7500, contingency: 0 },
    SG: { license: 500, visa: 2000, office: 54000, staff: 100000, inventory: 35000, marketing: 14000, legal: 7000, bank_deposit: 37000, contingency: 0 },
    US: { license: 2500, visa: 6000, office: 60000, staff: 140000, inventory: 45000, marketing: 18000, legal: 9000, bank_deposit: 10000, contingency: 0 },
  },
  retail_shop: {
    AE: { license: 6500, visa: 1800, office: 28000, staff: 36000, inventory: 25000, marketing: 8000, legal: 4500, bank_deposit: 13700, contingency: 0 },
    GB: { license: 200, visa: 2500, office: 30000, staff: 55000, inventory: 25000, marketing: 9000, legal: 5500, bank_deposit: 5000, contingency: 0 },
    CA: { license: 600, visa: 1800, office: 36000, staff: 60000, inventory: 25000, marketing: 9000, legal: 6000, bank_deposit: 7500, contingency: 0 },
    SG: { license: 500, visa: 2000, office: 42000, staff: 60000, inventory: 25000, marketing: 9000, legal: 6000, bank_deposit: 37000, contingency: 0 },
    US: { license: 1500, visa: 6000, office: 48000, staff: 80000, inventory: 35000, marketing: 12000, legal: 7500, bank_deposit: 10000, contingency: 0 },
  },
  tech_saas: {
    AE: { license: 4500, visa: 1800, office: 2400, staff: 60000, inventory: 6000, marketing: 18000, legal: 5000, bank_deposit: 13700, contingency: 0 },
    GB: { license: 200, visa: 2500, office: 3600, staff: 90000, inventory: 5000, marketing: 18000, legal: 6500, bank_deposit: 5000, contingency: 0 },
    CA: { license: 400, visa: 1800, office: 4200, staff: 95000, inventory: 5000, marketing: 16000, legal: 7000, bank_deposit: 7500, contingency: 0 },
    SG: { license: 400, visa: 2000, office: 4200, staff: 95000, inventory: 5000, marketing: 16000, legal: 7000, bank_deposit: 37000, contingency: 0 },
    US: { license: 800, visa: 6000, office: 6000, staff: 130000, inventory: 6000, marketing: 22000, legal: 9000, bank_deposit: 10000, contingency: 0 },
  },
  trading_import_export: {
    AE: { license: 7500, visa: 1800, office: 6000, staff: 30000, inventory: 50000, marketing: 6000, legal: 5000, bank_deposit: 27000, contingency: 0 },
    GB: { license: 300, visa: 2500, office: 7200, staff: 45000, inventory: 50000, marketing: 6000, legal: 6500, bank_deposit: 10000, contingency: 0 },
    CA: { license: 600, visa: 1800, office: 8400, staff: 50000, inventory: 50000, marketing: 6000, legal: 7000, bank_deposit: 10000, contingency: 0 },
    SG: { license: 500, visa: 2000, office: 8400, staff: 50000, inventory: 50000, marketing: 6000, legal: 7000, bank_deposit: 37000, contingency: 0 },
    US: { license: 1200, visa: 6000, office: 10000, staff: 70000, inventory: 60000, marketing: 8000, legal: 9000, bank_deposit: 15000, contingency: 0 },
  },
  consulting_services: {
    AE: { license: 4500, visa: 1800, office: 2400, staff: 24000, inventory: 2000, marketing: 8000, legal: 4000, bank_deposit: 13700, contingency: 0 },
    GB: { license: 200, visa: 2500, office: 3600, staff: 40000, inventory: 1500, marketing: 8000, legal: 5500, bank_deposit: 5000, contingency: 0 },
    CA: { license: 400, visa: 1800, office: 4200, staff: 45000, inventory: 1500, marketing: 7500, legal: 6000, bank_deposit: 7500, contingency: 0 },
    SG: { license: 400, visa: 2000, office: 4200, staff: 48000, inventory: 1500, marketing: 7500, legal: 6000, bank_deposit: 37000, contingency: 0 },
    US: { license: 700, visa: 6000, office: 6000, staff: 60000, inventory: 2000, marketing: 9000, legal: 7500, bank_deposit: 10000, contingency: 0 },
  },
  real_estate_investment: {
    AE: { license: 4500, visa: 1800, office: 2400, staff: 0, inventory: 200000, marketing: 4000, legal: 6000, bank_deposit: 13700, contingency: 0 },
    GB: { license: 200, visa: 2500, office: 1200, staff: 0, inventory: 250000, marketing: 4000, legal: 8000, bank_deposit: 5000, contingency: 0 },
    CA: { license: 400, visa: 1800, office: 1200, staff: 0, inventory: 300000, marketing: 4000, legal: 8500, bank_deposit: 7500, contingency: 0 },
    SG: { license: 400, visa: 2000, office: 1200, staff: 0, inventory: 400000, marketing: 4000, legal: 9000, bank_deposit: 37000, contingency: 0 },
    US: { license: 700, visa: 6000, office: 1500, staff: 0, inventory: 280000, marketing: 5000, legal: 10000, bank_deposit: 10000, contingency: 0 },
  },
};

export function computeTotal(b: CostBreakdown): number {
  const sub = b.license + b.visa + b.office + b.staff + b.inventory + b.marketing + b.legal + b.bank_deposit;
  return Math.round(sub * 1.1); // +10% contingency
}
