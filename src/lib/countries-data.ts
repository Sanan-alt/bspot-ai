// ISO 3166-1 numeric → ISO alpha-2 mapping for the curated investable countries
// used in the world map. Numeric codes match the world-atlas TopoJSON `id` field.
export const NUM_TO_ISO2: Record<string, string> = {
  "840": "US", "124": "CA", "484": "MX", "076": "BR", "032": "AR", "152": "CL",
  "826": "GB", "276": "DE", "250": "FR", "724": "ES", "380": "IT", "528": "NL",
  "756": "CH", "752": "SE", "578": "NO", "616": "PL", "792": "TR", "643": "RU",
  "804": "UA", "156": "CN", "392": "JP", "410": "KR", "356": "IN", "702": "SG",
  "344": "HK", "360": "ID", "764": "TH", "704": "VN", "784": "AE", "682": "SA",
  "818": "EG", "710": "ZA", "566": "NG", "404": "KE", "036": "AU",
  "554": "NZ",
};

export type Country = { code: string; name: string; region: string; flag: string; currency: string };

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", region: "Americas", flag: "🇺🇸", currency: "USD" },
  { code: "CA", name: "Canada", region: "Americas", flag: "🇨🇦", currency: "CAD" },
  { code: "MX", name: "Mexico", region: "Americas", flag: "🇲🇽", currency: "MXN" },
  { code: "BR", name: "Brazil", region: "Americas", flag: "🇧🇷", currency: "BRL" },
  { code: "AR", name: "Argentina", region: "Americas", flag: "🇦🇷", currency: "ARS" },
  { code: "CL", name: "Chile", region: "Americas", flag: "🇨🇱", currency: "CLP" },
  { code: "GB", name: "United Kingdom", region: "Europe", flag: "🇬🇧", currency: "GBP" },
  { code: "DE", name: "Germany", region: "Europe", flag: "🇩🇪", currency: "EUR" },
  { code: "FR", name: "France", region: "Europe", flag: "🇫🇷", currency: "EUR" },
  { code: "ES", name: "Spain", region: "Europe", flag: "🇪🇸", currency: "EUR" },
  { code: "IT", name: "Italy", region: "Europe", flag: "🇮🇹", currency: "EUR" },
  { code: "NL", name: "Netherlands", region: "Europe", flag: "🇳🇱", currency: "EUR" },
  { code: "CH", name: "Switzerland", region: "Europe", flag: "🇨🇭", currency: "CHF" },
  { code: "SE", name: "Sweden", region: "Europe", flag: "🇸🇪", currency: "SEK" },
  { code: "NO", name: "Norway", region: "Europe", flag: "🇳🇴", currency: "NOK" },
  { code: "PL", name: "Poland", region: "Europe", flag: "🇵🇱", currency: "PLN" },
  { code: "TR", name: "Turkey", region: "Europe", flag: "🇹🇷", currency: "TRY" },
  { code: "RU", name: "Russia", region: "Europe", flag: "🇷🇺", currency: "RUB" },
  { code: "UA", name: "Ukraine", region: "Europe", flag: "🇺🇦", currency: "UAH" },
  { code: "CN", name: "China", region: "Asia", flag: "🇨🇳", currency: "CNY" },
  { code: "JP", name: "Japan", region: "Asia", flag: "🇯🇵", currency: "JPY" },
  { code: "KR", name: "South Korea", region: "Asia", flag: "🇰🇷", currency: "KRW" },
  { code: "IN", name: "India", region: "Asia", flag: "🇮🇳", currency: "INR" },
  { code: "SG", name: "Singapore", region: "Asia", flag: "🇸🇬", currency: "SGD" },
  { code: "HK", name: "Hong Kong", region: "Asia", flag: "🇭🇰", currency: "HKD" },
  { code: "ID", name: "Indonesia", region: "Asia", flag: "🇮🇩", currency: "IDR" },
  { code: "TH", name: "Thailand", region: "Asia", flag: "🇹🇭", currency: "THB" },
  { code: "VN", name: "Vietnam", region: "Asia", flag: "🇻🇳", currency: "VND" },
  { code: "AE", name: "UAE", region: "MENA", flag: "🇦🇪", currency: "AED" },
  { code: "SA", name: "Saudi Arabia", region: "MENA", flag: "🇸🇦", currency: "SAR" },
  
  { code: "EG", name: "Egypt", region: "MENA", flag: "🇪🇬", currency: "EGP" },
  { code: "ZA", name: "South Africa", region: "Africa", flag: "🇿🇦", currency: "ZAR" },
  { code: "NG", name: "Nigeria", region: "Africa", flag: "🇳🇬", currency: "NGN" },
  { code: "KE", name: "Kenya", region: "Africa", flag: "🇰🇪", currency: "KES" },
  { code: "AU", name: "Australia", region: "Oceania", flag: "🇦🇺", currency: "AUD" },
  { code: "NZ", name: "New Zealand", region: "Oceania", flag: "🇳🇿", currency: "NZD" },
];

export const COUNTRY_BY_CODE: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c])
);
