// Deep investment profile data for the Countries page.
// Keyed by ISO-3 code, matches COUNTRIES in countries-data.ts.

export type VisaProgramDeep = {
  name: string;
  duration: string;
  min_investment: string;
  type: string;
};

export type Zone = {
  name: string;
  score: number;
  cost: string;
  best_for: string;
};

export type CountryDeep = {
  bspot_score: number;
  setup_cost_range: string;
  setup_cost_pkr: string;
  setup_time: string;
  corporate_tax: string;
  personal_income_tax: string;
  vat: string;
  foreign_ownership: string;
  political_stability: string;
  ease_of_business_rank: string;
  recommended_for: string;
  visa_programs: VisaProgramDeep[];
  laws_for_foreigners: string;
  banking: string;
  zones?: Zone[];
  pro_tip?: string;
};

export const COUNTRY_DEEP: Record<string, CountryDeep> = {
  ARE: {
    bspot_score: 9.4,
    setup_cost_range: "AED 12,000 – 52,000",
    setup_cost_pkr: "PKR 980,000 – 4,200,000",
    setup_time: "3–15 business days",
    corporate_tax: "9% on profit above AED 375,000 · 0% in free zones",
    personal_income_tax: "0% — no personal income tax",
    vat: "5%",
    foreign_ownership: "100% allowed since 2021 reform",
    political_stability: "Very High — most stable in Arab world",
    ease_of_business_rank: "16th globally (World Bank 2023)",
    recommended_for: "Pakistani, Indian, Egyptian nationals — large diaspora",
    visa_programs: [
      { name: "UAE Golden Visa", duration: "10 years", min_investment: "AED 2,000,000", type: "Property or fund" },
      { name: "UAE Green Visa", duration: "5 years", min_investment: "Skill-based", type: "Professionals & freelancers" },
      { name: "Investor Visa", duration: "3 years", min_investment: "AED 72,000", type: "Business investment" },
      { name: "Freelance Visa", duration: "2 years", min_investment: "AED 7,500/year permit", type: "Self-employed" },
    ],
    laws_for_foreigners:
      "Foreigners can own 100% of companies in most sectors. Property ownership limited to designated freehold areas. Alcohol requires a license. Must have a licensed business address or flexi-desk.",
    banking: "World-class banking. Most banks require AED 50,000 minimum balance. Wio Bank and Mashreq Neo are easiest for non-residents and startups.",
    zones: [
      { name: "Dubai (DMCC, DAFZA, IFZA)", score: 9.2, cost: "AED 12,000–30,000", best_for: "Trading, Tech, Finance" },
      { name: "Abu Dhabi (ADGM)", score: 8.8, cost: "AED 20,000–50,000", best_for: "Finance, Energy, Large corps" },
      { name: "Sharjah (SHAMS)", score: 7.5, cost: "AED 8,000–18,000", best_for: "Media, Creative, SMEs" },
      { name: "RAK (RAKEZ)", score: 7.0, cost: "AED 6,000–14,000", best_for: "Budget startups" },
    ],
    pro_tip: "RAKEZ is the cheapest way to start in UAE — from AED 6,000 total. Perfect if your budget is under PKR 1 million.",
  },
  GBR: {
    bspot_score: 8.5,
    setup_cost_range: "£5,000 – £15,000",
    setup_cost_pkr: "PKR 1,700,000 – 5,100,000",
    setup_time: "24 hours (online registration)",
    corporate_tax: "25% (19% for profit under £50,000)",
    personal_income_tax: "20%–45%",
    vat: "20%",
    foreign_ownership: "100% allowed — no restrictions for foreigners",
    political_stability: "Very High — stable democracy",
    ease_of_business_rank: "8th globally (World Bank)",
    recommended_for: "Indian, Pakistani, Nigerian nationals — large British Asian community",
    visa_programs: [
      { name: "Innovator Founder Visa", duration: "3 years", min_investment: "No minimum (endorsement required)", type: "Endorsed business idea" },
      { name: "Global Talent Visa", duration: "5 years", min_investment: "None", type: "Exceptional talent" },
      { name: "Skilled Worker Visa", duration: "5 years", min_investment: "Salary £26,200+/year", type: "Employment-based" },
    ],
    laws_for_foreigners:
      "No restrictions on foreign company ownership. UK tax on UK-source income. Need a UK registered address (virtual office from £100/year). VAT registration required if turnover exceeds £85,000.",
    banking: "Starling Bank and Tide are easiest for non-residents to open online. Traditional banks (Lloyds, Barclays) require UK address proof.",
    pro_tip: "Register a UK Ltd at Companies House for £12 and be operational in 24 hours — cheapest and fastest incorporation in the world.",
  },
  CAN: {
    bspot_score: 8.2,
    setup_cost_range: "CAD 10,000 – 30,000",
    setup_cost_pkr: "PKR 2,100,000 – 6,300,000",
    setup_time: "1–5 business days",
    corporate_tax: "~23–27% (15% federal + 8–12% provincial)",
    personal_income_tax: "20.5%–33% federal (plus provincial)",
    vat: "5% GST + provincial varies",
    foreign_ownership: "100% allowed — no restrictions",
    political_stability: "Very High — G7 country",
    ease_of_business_rank: "23rd globally",
    recommended_for: "Pakistani, Indian nationals — strong PR pathway",
    visa_programs: [
      { name: "Start-Up Visa", duration: "Permanent residency", min_investment: "CAD 200,000 (VC) or CAD 75,000 (angel)", type: "Designated org letter required" },
      { name: "Self-Employed Visa", duration: "Permanent residency", min_investment: "Experience proof", type: "Artists, athletes, farmers" },
      { name: "Provincial Nominee (PNP)", duration: "Permanent residency", min_investment: "CAD 150,000–500,000", type: "Business stream" },
    ],
    laws_for_foreigners:
      "No restrictions on foreign ownership. Federal Corp requires 25% Canadian-resident directors. BC and Ontario provincial corps have no such requirement.",
    banking: "RBC and TD are the main banks. Difficult to open without being in Canada. Wise Business works for receiving CAD internationally.",
    pro_tip: "Incorporate in British Columbia — no Canadian director requirement, ~CAD 350 fees, and Vancouver has a massive South Asian business community.",
  },
  SGP: {
    bspot_score: 9.1,
    setup_cost_range: "SGD 8,000 – 20,000",
    setup_cost_pkr: "PKR 1,700,000 – 4,300,000",
    setup_time: "1–3 business days",
    corporate_tax: "17% flat (effective ~8.5% with small-co exemptions)",
    personal_income_tax: "0%–22% (very low under SGD 40,000)",
    vat: "9% GST",
    foreign_ownership: "100% allowed — most foreign-friendly in Asia",
    political_stability: "Extremely High — #1 in Asia",
    ease_of_business_rank: "2nd globally (World Bank)",
    recommended_for: "Tech entrepreneurs, e-commerce founders, any nationality",
    visa_programs: [
      { name: "EntrePass", duration: "1–2 years renewable", min_investment: "Business viability assessed", type: "Entrepreneurs" },
      { name: "Global Investor Programme", duration: "Permanent residency", min_investment: "SGD 2,500,000", type: "High-net-worth investors" },
      { name: "Employment Pass", duration: "1–2 years", min_investment: "Salary SGD 5,000+/month", type: "Professionals" },
    ],
    laws_for_foreigners:
      "100% foreign ownership. Must appoint a local resident director (nominee ~SGD 1,000/year). Singapore registered address and company secretary required by law.",
    banking: "DBS, OCBC, UOB are main banks. Aspire and Airwallex are easiest for international startups.",
    pro_tip: "Best base for tech startups going global. Enterprise Singapore grants up to SGD 50,000 for innovative startups.",
  },
  SAU: {
    bspot_score: 8.0,
    setup_cost_range: "SAR 25,000 – 80,000",
    setup_cost_pkr: "PKR 1,800,000 – 5,800,000",
    setup_time: "7–30 business days",
    corporate_tax: "20% foreign · 0% Saudi-owned · 2.5% zakat for Muslim owners",
    personal_income_tax: "0% — no personal income tax",
    vat: "15%",
    foreign_ownership: "100% allowed since Vision 2030 (most sectors)",
    political_stability: "High — strong monarchy, Vision 2030 reforms",
    ease_of_business_rank: "62nd globally (rapidly improving)",
    recommended_for: "Pakistani, Indian, Egyptian, Yemeni nationals",
    visa_programs: [
      { name: "Premium Residency (Iqama Mumayaz)", duration: "Permanent or 1-year", min_investment: "SAR 800,000 one-time", type: "High-value investors" },
      { name: "Business Investor Visa", duration: "1 year renewable", min_investment: "SAR 7,500,000 capital", type: "Large businesses" },
      { name: "Work Visa", duration: "1–2 years", min_investment: "Company sponsorship", type: "Employment" },
    ],
    laws_for_foreigners:
      "100% foreign ownership since 2021 Vision 2030 reforms in most sectors (excluding military, media, some real estate). Saudization quotas (15–35% Saudi nationals) apply.",
    banking: "Al Rajhi Bank, Saudi National Bank, Riyad Bank. STC Pay growing among fintechs.",
    pro_tip: "Biggest regional opportunity right now — Vision 2030 is pouring money into tourism, entertainment, tech, and logistics.",
  },
  DEU: {
    bspot_score: 7.8,
    setup_cost_range: "€10,000 – €30,000",
    setup_cost_pkr: "PKR 3,100,000 – 9,300,000",
    setup_time: "2–4 weeks",
    corporate_tax: "~30% effective (15% + 5.5% surcharge + 14–17% trade tax)",
    personal_income_tax: "14%–45%",
    vat: "19% (7% essentials)",
    foreign_ownership: "100% allowed — EU market access",
    political_stability: "Very High — Europe's largest economy",
    ease_of_business_rank: "22nd globally",
    recommended_for: "Engineers, tech founders, manufacturing businesses",
    visa_programs: [
      { name: "Self-Employment Visa (§21)", duration: "3 years", min_investment: "€25,000 proof of funds", type: "Self-employed" },
      { name: "Freelancer Visa", duration: "1–3 years", min_investment: "Clients/contracts proof", type: "Freelancers and artists" },
      { name: "EU Blue Card", duration: "4 years", min_investment: "Salary €45,300+/year", type: "Skilled professionals" },
    ],
    laws_for_foreigners:
      "Complex bureaucracy but very rule-of-law. GmbH needs €25,000 minimum share capital; UG (mini-GmbH) just €1. All documents in German or officially translated.",
    banking: "Commerzbank, Deutsche Bank for traditional. N26 and Holvi best for non-residents.",
    pro_tip: "Best for manufacturing, engineering, and automotive supply chain. Once established, EU's 450M consumers are open to you.",
  },
  USA: {
    bspot_score: 7.5,
    setup_cost_range: "$5,000 – $25,000",
    setup_cost_pkr: "PKR 1,400,000 – 7,000,000",
    setup_time: "1–5 business days (Delaware online)",
    corporate_tax: "21% federal + state (0% in Wyoming, Nevada, Delaware)",
    personal_income_tax: "10%–37% federal + state",
    vat: "No federal VAT (state sales tax 0%–10%)",
    foreign_ownership: "100% allowed",
    political_stability: "High — democratic superpower",
    ease_of_business_rank: "6th globally",
    recommended_for: "Tech startups targeting US market",
    visa_programs: [
      { name: "E-2 Investor Visa", duration: "5 years renewable", min_investment: "$50,000–$150,000", type: "Treaty country nationals only" },
      { name: "EB-5 Immigrant Visa", duration: "Green card", min_investment: "$800,000 (TEA) or $1,050,000", type: "Creates 10 US jobs" },
      { name: "O-1 Extraordinary Ability", duration: "3 years", min_investment: "None", type: "Exceptional talent" },
    ],
    laws_for_foreigners:
      "100% foreign ownership. Best states: Delaware (legal precedent), Wyoming (cheapest, no state tax), Florida (no state income tax). Pakistani nationals are NOT eligible for E-2.",
    banking: "Mercury Bank and Relay Financial are easiest for foreign nationals to open online without visiting the US.",
    pro_tip: "Pakistani nationals cannot get E-2 (no treaty). Main route is EB-5 or moving to Canada/UK first.",
  },
  TUR: {
    bspot_score: 7.2,
    setup_cost_range: "$10,000 – $30,000",
    setup_cost_pkr: "PKR 2,800,000 – 8,400,000",
    setup_time: "3–10 business days",
    corporate_tax: "25% (raised from 20% in 2023)",
    personal_income_tax: "15%–40%",
    vat: "20%",
    foreign_ownership: "100% allowed",
    political_stability: "Medium — high inflation but politically stable",
    ease_of_business_rank: "33rd globally",
    recommended_for: "Investors seeking citizenship by investment at low cost",
    visa_programs: [
      { name: "Citizenship by Investment", duration: "Lifetime citizenship", min_investment: "$400,000 real estate", type: "Property purchase" },
      { name: "Residence Permit", duration: "1–2 years", min_investment: "$75,000 property", type: "Cheaper residency option" },
    ],
    laws_for_foreigners:
      "100% foreign ownership. Welcoming to Arab, Pakistani, Central Asian investors. Turkish passport gives visa-free access to 110+ countries including Japan and South Korea.",
    banking: "Ziraat Bank, Garanti BBVA, İş Bankası. Easy for foreigners with property ownership.",
    pro_tip: "Turkish citizenship ($400K property) gives a powerful second passport with visa-free access to 110+ countries — and you can keep your original passport.",
  },
  PRT: {
    bspot_score: 8.3,
    setup_cost_range: "€15,000 – €40,000",
    setup_cost_pkr: "PKR 4,600,000 – 12,400,000",
    setup_time: "4–8 weeks",
    corporate_tax: "21% (17% for small businesses)",
    personal_income_tax: "13.25%–48%",
    vat: "23%",
    foreign_ownership: "100% allowed — EU member",
    political_stability: "Very High — stable EU democracy",
    ease_of_business_rank: "39th globally",
    recommended_for: "Investors wanting EU residency and citizenship path",
    visa_programs: [
      { name: "Golden Visa (D2)", duration: "2 years renewable", min_investment: "€500,000 investment fund", type: "Investment fund" },
      { name: "D2 Entrepreneur Visa", duration: "2 years", min_investment: "€5,000 minimum", type: "Business founders" },
      { name: "Digital Nomad Visa", duration: "1–2 years", min_investment: "€3,040/month income proof", type: "Remote workers" },
    ],
    laws_for_foreigners:
      "EU residency rights after 5 years. Path to Portuguese citizenship in 5 years gives EU passport with visa-free travel to 186 countries. NHR tax regime offers 10% flat tax for 10 years.",
    banking: "Millennium BCP and Novo Banco for foreigners. Wise Business works well for EU operations.",
    pro_tip: "Best EU citizenship pathway for Pakistani nationals — 5 years residency → EU passport → visa-free to 186 countries including the US and UK.",
  },
  AUS: {
    bspot_score: 8.0,
    setup_cost_range: "AUD 15,000 – 40,000",
    setup_cost_pkr: "PKR 2,900,000 – 7,800,000",
    setup_time: "1–3 business days",
    corporate_tax: "25% (base rate) or 30%",
    personal_income_tax: "19%–45%",
    vat: "10% GST",
    foreign_ownership: "100% allowed — FIRB approval for large investments",
    political_stability: "Very High — stable G20 democracy",
    ease_of_business_rank: "14th globally",
    recommended_for: "Entrepreneurs with families — high quality of life and education",
    visa_programs: [
      { name: "Business Innovation Visa (188)", duration: "4 years → PR", min_investment: "AUD 200,000–1,500,000", type: "Business and investment" },
      { name: "Significant Investor Visa (188C)", duration: "Provisional → PR", min_investment: "AUD 5,000,000", type: "High-net-worth" },
      { name: "Entrepreneur Visa (188E)", duration: "4 years", min_investment: "AUD 200,000 state funding", type: "Tech startups" },
    ],
    laws_for_foreigners:
      "Very open to foreign business. FIRB approval required for property above AUD 1.3M, agricultural land, and defense-related sectors.",
    banking: "Commonwealth Bank, Westpac, ANZ are main banks. Airwallex and Wise Business work for international ops.",
    pro_tip: "188B Investor stream → manage AUD 250,000 turnover for 2 years → PR. One of the most practical routes for experienced business owners.",
  },
};
