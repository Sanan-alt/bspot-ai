export type RoadmapTemplateStep = {
  step_index: number;
  phase: "Research" | "Setup" | "Launch" | "Scale";
  title: string;
  description: string;
  due_days: number; // relative days from today
};

// Generic template — phases apply to every country/business; tweak per country in the future.
export const ROADMAP_TEMPLATE: RoadmapTemplateStep[] = [
  { step_index: 1,  phase: "Research", title: "Validate your business idea", description: "Pick 3 competitors in your target country and document their pricing, audience, and weaknesses.", due_days: 3 },
  { step_index: 2,  phase: "Research", title: "Confirm visa route", description: "Use the Visa Guide to pick the visa category and confirm minimum investment & PR pathway.", due_days: 7 },
  { step_index: 3,  phase: "Research", title: "Estimate first-year cost", description: "Run the Cost Calculator and write down setup + 12-month operating cost in both currencies.", due_days: 10 },
  { step_index: 4,  phase: "Research", title: "Verify funds & source-of-funds documentation", description: "Bank statements (6 months), tax returns, asset proof — gather digital copies.", due_days: 14 },
  { step_index: 5,  phase: "Setup",    title: "Choose company structure & jurisdiction", description: "Free-zone vs mainland (UAE), LLC vs Ltd (US/UK), province (Canada). Pick one.", due_days: 21 },
  { step_index: 6,  phase: "Setup",    title: "Reserve company name & file registration", description: "Submit name and incorporation docs with the local authority.", due_days: 30 },
  { step_index: 7,  phase: "Setup",    title: "Open corporate bank account", description: "Compare 2–3 banks. Prepare KYC: passport, address proof, business plan.", due_days: 45 },
  { step_index: 8,  phase: "Setup",    title: "Submit visa application", description: "File investor / founder visa with required docs and medical.", due_days: 60 },
  { step_index: 9,  phase: "Setup",    title: "Lease office / virtual office", description: "Most jurisdictions require a registered address — lock it in.", due_days: 75 },
  { step_index: 10, phase: "Launch",   title: "Build brand & online presence", description: "Domain, logo, website, business email, Google Business Profile.", due_days: 90 },
  { step_index: 11, phase: "Launch",   title: "Set up accounting & VAT/tax registration", description: "Local accountant + cloud bookkeeping (Xero/Zoho). Register for VAT if required.", due_days: 100 },
  { step_index: 12, phase: "Launch",   title: "Hire first team member or contractor", description: "Even one part-time hire — sales, ops, or admin — frees you to grow.", due_days: 120 },
  { step_index: 13, phase: "Launch",   title: "First paying customer", description: "Goal: revenue inside 4 months. Run a soft launch to your warm network first.", due_days: 130 },
  { step_index: 14, phase: "Scale",    title: "Review readiness for PR / Golden Visa", description: "Some routes (UAE Golden, UK Innovator) get easier after 6 months of active business.", due_days: 200 },
  { step_index: 15, phase: "Scale",    title: "Plan family relocation / dependent visas", description: "Once primary visa is stable, sponsor spouse/children and arrange schooling.", due_days: 240 },
];
