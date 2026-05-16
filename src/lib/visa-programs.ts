export type VisaProgram = {
  name: string;
  category:
    | "Entrepreneur Visa"
    | "Startup Visa"
    | "Investor Visa"
    | "Golden Visa"
    | "Residency by Investment"
    | "Work Permit"
    | "Citizenship";
  minInvestment: string;
  duration: string;
  pathToPR: boolean;
  summary: string;
};

export const VISA_PROGRAMS: Record<string, VisaProgram[]> = {
  US: [
    { name: "E-2 Investor Visa", category: "Investor Visa", minInvestment: "$100,000+", duration: "5 yrs (renewable)", pathToPR: false, summary: "Treaty investor visa for substantial business investment in a US enterprise." },
    { name: "EB-5 Immigrant Investor", category: "Residency by Investment", minInvestment: "$800,000", duration: "Permanent", pathToPR: true, summary: "Green card via investment in a US business creating 10+ jobs." },
    { name: "L-1 Intracompany Transfer", category: "Work Permit", minInvestment: "—", duration: "1-7 yrs", pathToPR: true, summary: "Transfer executives or specialized employees to a US branch." },
    { name: "O-1 Extraordinary Ability", category: "Work Permit", minInvestment: "—", duration: "3 yrs (renewable)", pathToPR: true, summary: "For founders & talent with extraordinary achievement." },
  ],
  GB: [
    { name: "Innovator Founder Visa", category: "Startup Visa", minInvestment: "No fixed amount", duration: "3 yrs", pathToPR: true, summary: "For experienced entrepreneurs launching innovative, scalable UK businesses." },
    { name: "Global Talent Visa", category: "Work Permit", minInvestment: "—", duration: "Up to 5 yrs", pathToPR: true, summary: "Endorsed leaders in tech, science, arts, research." },
    { name: "Skilled Worker Visa", category: "Work Permit", minInvestment: "—", duration: "Up to 5 yrs", pathToPR: true, summary: "Sponsored employment in a qualifying UK role." },
  ],
  DE: [
    { name: "Self-Employment Visa (§21 AufenthG)", category: "Entrepreneur Visa", minInvestment: "€100,000+ recommended", duration: "3 yrs", pathToPR: true, summary: "For entrepreneurs whose business serves an economic interest in Germany." },
    { name: "Freelancer Visa (§21.5)", category: "Entrepreneur Visa", minInvestment: "Proof of income", duration: "3 yrs", pathToPR: true, summary: "Liberal-professional visa for freelancers with German clients." },
    { name: "EU Blue Card", category: "Work Permit", minInvestment: "—", duration: "4 yrs", pathToPR: true, summary: "Highly-skilled employment with fast-track PR." },
  ],
  CA: [
    { name: "Start-Up Visa Program", category: "Startup Visa", minInvestment: "CAD 75K-200K (designated)", duration: "Permanent on approval", pathToPR: true, summary: "PR for founders backed by designated VCs, angels, or incubators." },
    { name: "Self-Employed Persons", category: "Entrepreneur Visa", minInvestment: "—", duration: "Permanent", pathToPR: true, summary: "For cultural, athletic, or farming self-employed applicants." },
    { name: "Quebec Investor Program", category: "Investor Visa", minInvestment: "CAD 1.2M+", duration: "Permanent", pathToPR: true, summary: "Passive investment route via Quebec (subject to availability)." },
  ],
  AE: [
    { name: "UAE Golden Visa", category: "Golden Visa", minInvestment: "AED 2M (property/funds)", duration: "10 yrs renewable", pathToPR: false, summary: "Long-term residency for investors, founders, and talent." },
    { name: "Green Visa", category: "Residency by Investment", minInvestment: "AED 1M (investor)", duration: "5 yrs", pathToPR: false, summary: "Self-sponsored residency for skilled employees & investors." },
    { name: "Free Zone Company License", category: "Entrepreneur Visa", minInvestment: "AED 12K+ setup", duration: "2-3 yrs renewable", pathToPR: false, summary: "Investor visa via a free-zone company (100% foreign ownership)." },
  ],
  SG: [
    { name: "Global Investor Programme", category: "Investor Visa", minInvestment: "SGD 10M+", duration: "Permanent", pathToPR: true, summary: "PR for high-net-worth investors and family-office principals." },
    { name: "EntrePass", category: "Entrepreneur Visa", minInvestment: "SGD 50K+ paid-up", duration: "1-2 yrs renewable", pathToPR: true, summary: "Visa for innovative founders building venture-backed startups in Singapore." },
  ],
  AU: [
    { name: "Business Innovation 188", category: "Entrepreneur Visa", minInvestment: "AUD 1.25M+", duration: "5 yrs", pathToPR: true, summary: "Provisional visa for business owners & investors; pathway to 888 PR." },
    { name: "Global Talent Visa", category: "Work Permit", minInvestment: "—", duration: "Permanent", pathToPR: true, summary: "PR for highly-talented professionals in target sectors." },
  ],
  PT: [
    { name: "Portugal Golden Visa", category: "Golden Visa", minInvestment: "€250K-500K (funds/culture)", duration: "5 yrs → citizenship", pathToPR: true, summary: "Residency for qualifying investment; minimal stay requirements." },
  ],
  ES: [
    { name: "Spain Entrepreneur Visa", category: "Startup Visa", minInvestment: "Innovative business plan", duration: "3 yrs", pathToPR: true, summary: "ENISA-endorsed innovative entrepreneur residency." },
  ],
  CH: [
    { name: "Swiss Lump-Sum Taxation", category: "Residency by Investment", minInvestment: "CHF 250K+ annual tax", duration: "Renewable", pathToPR: true, summary: "Residency for HNW individuals via cantonal lump-sum taxation." },
  ],
  NL: [
    { name: "Dutch-American Friendship Treaty (DAFT)", category: "Entrepreneur Visa", minInvestment: "€4,500", duration: "2 yrs renewable", pathToPR: true, summary: "Low-threshold entrepreneur residency for US citizens." },
  ],
  FR: [
    { name: "French Tech Visa", category: "Startup Visa", minInvestment: "Funded startup", duration: "4 yrs", pathToPR: true, summary: "For founders, employees, and investors in French tech." },
  ],
};

export const TOP_INVESTMENT_COUNTRIES = ["US", "GB", "DE", "CA", "AE"] as const;
