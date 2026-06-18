// Curated business-hub cities and major states/provinces per country.
// Used by the world map's country panel to let users drill into specific cities.

export type HubCity = {
  name: string;
  state?: string;
  tags: string[]; // e.g. "Finance", "Tech", "Free Zone", "Trade"
  why: string;     // short reason it's a business hub
};

export type CountryRegions = {
  states: string[];   // major admin-1 names
  cities: HubCity[];
};

export const HUB_CITIES: Record<string, CountryRegions> = {
  AE: {
    states: ["Dubai", "Abu Dhabi", "Sharjah", "Ras Al Khaimah", "Ajman", "Fujairah", "Umm Al Quwain"],
    cities: [
      { name: "Dubai", state: "Dubai", tags: ["Free Zone", "Trade", "Tourism", "Tech"], why: "DIFC, JAFZA, DMCC, 0% personal tax, world-class logistics." },
      { name: "Abu Dhabi", state: "Abu Dhabi", tags: ["Finance", "Energy", "Gov"], why: "ADGM financial centre, sovereign capital, energy HQs." },
      { name: "Sharjah", state: "Sharjah", tags: ["Manufacturing", "SME"], why: "Lower-cost mainland & free-zone alternative to Dubai." },
      { name: "Ras Al Khaimah", state: "Ras Al Khaimah", tags: ["Free Zone", "Industry"], why: "RAKEZ — cheapest UAE company setup." },
    ],
  },
  GB: {
    states: ["England", "Scotland", "Wales", "Northern Ireland"],
    cities: [
      { name: "London", state: "England", tags: ["Finance", "Tech", "Fintech"], why: "Global financial centre, deepest VC market in Europe." },
      { name: "Manchester", state: "England", tags: ["Tech", "Media"], why: "Northern tech hub, lower costs, MediaCity." },
      { name: "Edinburgh", state: "Scotland", tags: ["Finance", "Fintech"], why: "Second-largest UK financial centre." },
      { name: "Birmingham", state: "England", tags: ["Industry", "SME"], why: "UK's second city, manufacturing & logistics base." },
    ],
  },
  US: {
    states: ["California", "New York", "Texas", "Florida", "Delaware", "Washington", "Massachusetts"],
    cities: [
      { name: "New York", state: "New York", tags: ["Finance", "Media"], why: "Wall Street, world's largest capital markets." },
      { name: "San Francisco", state: "California", tags: ["Tech", "VC"], why: "Silicon Valley — deepest tech venture capital pool." },
      { name: "Austin", state: "Texas", tags: ["Tech", "Low Tax"], why: "No state income tax, fastest-growing US tech hub." },
      { name: "Miami", state: "Florida", tags: ["LatAm Gateway", "Crypto"], why: "No state tax, gateway to Latin American markets." },
      { name: "Seattle", state: "Washington", tags: ["Tech", "Cloud"], why: "Amazon, Microsoft HQ, no state income tax." },
    ],
  },
  CA: {
    states: ["Ontario", "British Columbia", "Quebec", "Alberta"],
    cities: [
      { name: "Toronto", state: "Ontario", tags: ["Finance", "Tech"], why: "Canada's financial centre, largest tech ecosystem." },
      { name: "Vancouver", state: "British Columbia", tags: ["Tech", "Trade"], why: "Pacific gateway, strong startup scene." },
      { name: "Montreal", state: "Quebec", tags: ["AI", "Aerospace"], why: "World AI research hub, lower costs." },
      { name: "Calgary", state: "Alberta", tags: ["Energy"], why: "Energy capital of Canada, low corporate tax." },
    ],
  },
  SG: {
    states: ["Central", "East", "West", "North", "North-East"],
    cities: [
      { name: "Singapore", state: "Central", tags: ["Finance", "Tech", "HQ"], why: "Asia's #1 financial centre, 17% corporate tax, English law." },
    ],
  },
  SA: {
    states: ["Riyadh", "Makkah", "Eastern Province", "Madinah"],
    cities: [
      { name: "Riyadh", state: "Riyadh", tags: ["Finance", "Vision 2030"], why: "Saudi capital, RHQ mandate for govt contracts." },
      { name: "Jeddah", state: "Makkah", tags: ["Trade", "Logistics"], why: "Red Sea port, gateway for Hajj & trade." },
      { name: "NEOM", state: "Tabuk", tags: ["Mega-project", "Tech"], why: "$500B greenfield smart city." },
      { name: "Dammam", state: "Eastern Province", tags: ["Energy", "Industry"], why: "Aramco HQ region, industrial cluster." },
    ],
  },
  DE: {
    states: ["Bavaria", "North Rhine-Westphalia", "Berlin", "Baden-Württemberg", "Hesse"],
    cities: [
      { name: "Berlin", state: "Berlin", tags: ["Tech", "Startup"], why: "Europe's largest startup capital after London." },
      { name: "Munich", state: "Bavaria", tags: ["Industry", "Auto", "DeepTech"], why: "BMW, Siemens, Allianz HQ — wealthiest German metro." },
      { name: "Frankfurt", state: "Hesse", tags: ["Finance", "ECB"], why: "ECB, Deutsche Börse, eurozone financial centre." },
      { name: "Hamburg", state: "Hamburg", tags: ["Trade", "Media"], why: "Germany's biggest port, media & logistics." },
    ],
  },
  AU: {
    states: ["New South Wales", "Victoria", "Queensland", "Western Australia"],
    cities: [
      { name: "Sydney", state: "New South Wales", tags: ["Finance", "Tech"], why: "Australia's financial capital, APAC HQ for many MNCs." },
      { name: "Melbourne", state: "Victoria", tags: ["Startup", "Education"], why: "Most liveable city, strong startup scene." },
      { name: "Perth", state: "Western Australia", tags: ["Mining", "Energy"], why: "Resources & mining capital." },
    ],
  },
  PT: {
    states: ["Lisbon", "Porto", "Algarve", "Madeira"],
    cities: [
      { name: "Lisbon", state: "Lisbon", tags: ["Tech", "Golden Visa"], why: "Web Summit, NHR tax regime, affordable EU base." },
      { name: "Porto", state: "Porto", tags: ["Tech", "Tourism"], why: "Growing tech hub, lower cost than Lisbon." },
      { name: "Madeira", state: "Madeira", tags: ["IBC", "Low Tax"], why: "International Business Centre — 5% corporate tax." },
    ],
  },
  ES: {
    states: ["Madrid", "Catalonia", "Andalusia", "Valencia", "Basque Country"],
    cities: [
      { name: "Madrid", state: "Madrid", tags: ["Finance", "HQ"], why: "Spain's capital, gateway to LatAm." },
      { name: "Barcelona", state: "Catalonia", tags: ["Tech", "Startup"], why: "Mediterranean tech hub, Mobile World Congress." },
      { name: "Valencia", state: "Valencia", tags: ["Logistics", "Affordable"], why: "Major port, lower cost than Madrid/BCN." },
    ],
  },
  CH: {
    states: ["Zurich", "Geneva", "Vaud", "Zug", "Basel"],
    cities: [
      { name: "Zurich", state: "Zurich", tags: ["Finance", "Banking"], why: "Global wealth-management capital, UBS HQ." },
      { name: "Geneva", state: "Geneva", tags: ["Diplomacy", "Trading"], why: "Commodity trading, UN HQ, private banking." },
      { name: "Zug", state: "Zug", tags: ["Crypto Valley", "Low Tax"], why: "Lowest corporate tax in CH, crypto hub." },
    ],
  },
  NL: {
    states: ["North Holland", "South Holland", "Utrecht", "North Brabant"],
    cities: [
      { name: "Amsterdam", state: "North Holland", tags: ["Finance", "Tech"], why: "Post-Brexit fintech winner, English-friendly." },
      { name: "Rotterdam", state: "South Holland", tags: ["Logistics", "Port"], why: "Europe's largest port." },
      { name: "Eindhoven", state: "North Brabant", tags: ["DeepTech", "Semiconductors"], why: "ASML HQ, Brainport innovation cluster." },
    ],
  },
  FR: {
    states: ["Île-de-France", "Auvergne-Rhône-Alpes", "Provence-Alpes-Côte d'Azur"],
    cities: [
      { name: "Paris", state: "Île-de-France", tags: ["Finance", "Luxury"], why: "Station F (world's largest startup campus), LVMH/luxury HQ." },
      { name: "Lyon", state: "Auvergne-Rhône-Alpes", tags: ["Industry", "Biotech"], why: "Industrial & biotech hub." },
      { name: "Nice / Sophia Antipolis", state: "PACA", tags: ["Tech", "R&D"], why: "France's largest tech park." },
    ],
  },
  TR: {
    states: ["Istanbul", "Ankara", "Izmir"],
    cities: [
      { name: "Istanbul", state: "Istanbul", tags: ["Trade", "Bridge"], why: "Bridge between Europe & Asia, citizenship by investment." },
      { name: "Ankara", state: "Ankara", tags: ["Gov", "Defense"], why: "Capital, defense & government contracts." },
      { name: "Izmir", state: "Izmir", tags: ["Trade", "Port"], why: "Aegean port, manufacturing." },
    ],
  },
};

export function getHubCities(countryCode: string): CountryRegions | null {
  return HUB_CITIES[countryCode] ?? null;
}
