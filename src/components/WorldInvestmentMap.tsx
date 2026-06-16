import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { COUNTRY_DEEP } from "@/lib/country-deep";
import { COUNTRY_BY_CODE } from "@/lib/countries-data";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// world-atlas uses ISO numeric IDs. Map to ISO-3 codes used in COUNTRY_DEEP.
const ISO_NUM_TO_ALPHA3: Record<string, string> = {
  "784": "ARE", "826": "GBR", "124": "CAN", "702": "SGP",
  "682": "SAU", "276": "DEU", "840": "USA", "792": "TUR",
  "620": "PRT", "36": "AUS",
};

export type WorldInvestmentMapProps = {
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
};

// Map ISO-3 → ISO-2 (used by COUNTRY_BY_CODE which is keyed by alpha-2)
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  ARE: "AE", GBR: "GB", CAN: "CA", SGP: "SG", SAU: "SA",
  DEU: "DE", USA: "US", TUR: "TR", PRT: "PT", AUS: "AU",
};

function scoreColor(score: number) {
  if (score >= 9) return "oklch(0.78 0.19 145)"; // green
  if (score >= 8) return "oklch(0.78 0.19 95)";  // yellow
  if (score >= 7) return "oklch(0.74 0.18 60)";  // orange
  return "oklch(0.65 0.16 30)";                  // red
}

export function WorldInvestmentMap({ selectedCode, onSelect }: WorldInvestmentMapProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const unlocked = useMemo(
    () =>
      Object.keys(COUNTRY_DEEP)
        .map((a3) => {
          const a2 = ALPHA3_TO_ALPHA2[a3];
          const meta = a2 ? COUNTRY_BY_CODE[a2] : null;
          return meta ? { a3, name: meta.name, flag: meta.flag, score: COUNTRY_DEEP[a3].bspot_score } : null;
        })
        .filter((x): x is { a3: string; name: string; flag: string; score: number } => !!x)
        .sort((a, b) => b.score - a.score),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return unlocked;
    return unlocked.filter((u) => u.name.toLowerCase().includes(q) || u.a3.toLowerCase().includes(q));
  }, [search, unlocked]);

  return (
    <div className="relative">
      <div className="flex items-start justify-between px-2 pb-2 gap-3 flex-wrap">
        <div>
          <p className="font-display text-lg text-neon">🌍 {t("map.title")}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("map.subtitle")}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("map.search_placeholder")}
            className="w-full h-8 pl-8 pr-2 rounded-md bg-background/60 border border-border text-xs font-mono focus:outline-none focus:border-primary"
          />
          {search && filtered.length > 0 && (
            <div className="absolute top-9 left-0 right-0 z-20 max-h-56 overflow-auto rounded-md border border-border bg-popover shadow-lg">
              {filtered.slice(0, 8).map((u) => (
                <button
                  key={u.a3}
                  onClick={() => {
                    onSelect(u.a3);
                    setSearch("");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-accent text-left"
                >
                  <span className="flex items-center gap-2">
                    <span>{u.flag}</span>
                    <span>{u.name}</span>
                  </span>
                  <span className="font-mono text-[10px] text-neon">{u.score}</span>
                </button>
              ))}
            </div>
          )}
          {search && filtered.length === 0 && (
            <div className="absolute top-9 left-0 right-0 z-20 rounded-md border border-border bg-popover px-3 py-2 text-xs text-muted-foreground">
              {t("map.no_results")}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background/40 overflow-hidden">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 155 }}
          style={{ width: "100%", height: "auto" }}
        >
          <ZoomableGroup center={[20, 10]} zoom={1} maxZoom={5}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isoNum = String(geo.id);
                  const alpha3 = ISO_NUM_TO_ALPHA3[isoNum];
                  const deep = alpha3 ? COUNTRY_DEEP[alpha3] : null;
                  const isUnlocked = !!deep;
                  const isSelected = !!alpha3 && alpha3 === selectedCode;
                  const isHover = !!alpha3 && alpha3 === hovered;
                  const baseFill = deep ? scoreColor(deep.bspot_score) : "oklch(0.20 0.01 95)";
                  const fill = isSelected
                    ? "oklch(0.92 0.19 95)"
                    : isHover && isUnlocked
                    ? "oklch(0.85 0.18 95)"
                    : baseFill;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => alpha3 && setHovered(alpha3)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => {
                        if (isUnlocked) onSelect(alpha3);
                      }}
                      style={{
                        default: {
                          fill,
                          stroke: "oklch(0.12 0.005 95)",
                          strokeWidth: 0.5,
                          outline: "none",
                          cursor: isUnlocked ? "pointer" : "default",
                        },
                        hover: {
                          fill,
                          stroke: "oklch(0.12 0.005 95)",
                          strokeWidth: 0.5,
                          outline: "none",
                          cursor: isUnlocked ? "pointer" : "default",
                        },
                        pressed: { fill, outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Legend */}
      <div className="mt-3 panel p-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          // {t("map.legend")}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ background: "oklch(0.78 0.19 145)" }} />
            {t("map.tier_excellent")} (9+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ background: "oklch(0.78 0.19 95)" }} />
            {t("map.tier_strong")} (8+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ background: "oklch(0.74 0.18 60)" }} />
            {t("map.tier_moderate")} (7+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm bg-[oklch(0.20_0.01_95)]" />
            {t("map.locked")}
          </span>
        </div>
      </div>

      {hovered && COUNTRY_DEEP[hovered] && ALPHA3_TO_ALPHA2[hovered] && COUNTRY_BY_CODE[ALPHA3_TO_ALPHA2[hovered]] && (
        <div className="absolute top-2 right-2 panel-neon px-3 py-2 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-xl">{COUNTRY_BY_CODE[ALPHA3_TO_ALPHA2[hovered]].flag}</span>
            <div>
              <div className="font-display text-sm leading-none">
                {COUNTRY_BY_CODE[ALPHA3_TO_ALPHA2[hovered]].name}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                {t("map.score")}: <span className="text-neon">{COUNTRY_DEEP[hovered].bspot_score}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
