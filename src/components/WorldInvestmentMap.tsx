import { useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { useTranslation } from "react-i18next";
import { Search, Loader2, AlertTriangle, Keyboard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNTRY_DEEP } from "@/lib/country-deep";
import { COUNTRY_BY_CODE, NUM_TO_ISO2, COUNTRIES } from "@/lib/countries-data";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// alpha-2 ↔ alpha-3 for the deep-profile countries (COUNTRY_DEEP is alpha-3 keyed)
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  ARE: "AE", GBR: "GB", CAN: "CA", SGP: "SG", SAU: "SA",
  DEU: "DE", USA: "US", TUR: "TR", PRT: "PT", AUS: "AU",
};
const ALPHA2_TO_ALPHA3: Record<string, string> = Object.fromEntries(
  Object.entries(ALPHA3_TO_ALPHA2).map(([a3, a2]) => [a2, a3]),
);

export type WorldInvestmentMapProps = {
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
};

function scoreColor(score: number) {
  if (score >= 9) return "oklch(0.78 0.19 145)"; // green
  if (score >= 8) return "oklch(0.78 0.19 95)";  // yellow
  if (score >= 7) return "oklch(0.74 0.18 60)";  // orange
  return "oklch(0.65 0.16 30)";                  // red
}

const KNOWN_FILL = "oklch(0.32 0.04 220)"; // muted teal — country in catalogue
const UNKNOWN_FILL = "oklch(0.20 0.01 95)"; // dim — not in catalogue

export function WorldInvestmentMap({ selectedCode, onSelect }: WorldInvestmentMapProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<string | null>(null); // alpha-2
  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [zoom, setZoom] = useState(1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Preflight: ensure topojson is reachable; surface a clear error panel if not.
  useEffect(() => {
    let cancelled = false;
    setMapLoading(true);
    setMapError(null);
    fetch(GEO_URL, { method: "GET" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      })
      .catch((e) => {
        if (!cancelled) setMapError(String(e?.message ?? e));
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // All countries available in the catalogue, sorted by score (deep first) then name.
  const catalogue = useMemo(
    () =>
      COUNTRIES.map((c) => {
        const a3 = ALPHA2_TO_ALPHA3[c.code];
        const score = a3 ? COUNTRY_DEEP[a3]?.bspot_score : undefined;
        return { code: c.code, name: c.name, flag: c.flag, score, hasDeep: !!score };
      }).sort((a, b) => {
        if (a.hasDeep !== b.hasDeep) return a.hasDeep ? -1 : 1;
        if (a.hasDeep && b.hasDeep) return (b.score ?? 0) - (a.score ?? 0);
        return a.name.localeCompare(b.name);
      }),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalogue;
    return catalogue.filter(
      (u) => u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q),
    );
  }, [search, catalogue]);

  useEffect(() => setHighlight(0), [search]);

  const visible = filtered.slice(0, 8);

  function pick(code: string) {
    onSelect(code);
    setSearch("");
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!visible.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % visible.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + visible.length) % visible.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(visible[highlight].code);
    } else if (e.key === "Escape") {
      setSearch("");
    }
  }

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
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("map.search_placeholder")}
            aria-label={t("map.search_placeholder")}
            role="combobox"
            aria-expanded={!!search}
            aria-controls="map-search-list"
            aria-activedescendant={visible[highlight] ? `map-opt-${visible[highlight].code}` : undefined}
            className="w-full h-8 pl-8 pr-2 rounded-md bg-background/60 border border-border text-xs font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
          />
          {search && visible.length > 0 && (
            <ul
              id="map-search-list"
              role="listbox"
              className="absolute top-9 left-0 right-0 z-20 max-h-56 overflow-auto rounded-md border border-border bg-popover shadow-lg"
            >
              {visible.map((u, i) => (
                <li
                  key={u.code}
                  id={`map-opt-${u.code}`}
                  role="option"
                  aria-selected={i === highlight}
                >
                  <button
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pick(u.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left ${
                      i === highlight ? "bg-accent" : "hover:bg-accent/60"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{u.flag}</span>
                      <span>{u.name}</span>
                    </span>
                    {u.hasDeep ? (
                      <span className="font-mono text-[10px] text-neon">{u.score}</span>
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground">{t("map.basic")}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {search && visible.length === 0 && (
            <div className="absolute top-9 left-0 right-0 z-20 rounded-md border border-border bg-popover px-3 py-2 text-xs text-muted-foreground">
              {t("map.no_results_detailed", { q: search })}
            </div>
          )}
          <p className="mt-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            <Keyboard className="h-3 w-3" /> ↑ ↓ {t("map.kbd_navigate") ?? "navigate"} · ↵ {t("map.kbd_select") ?? "select"} · esc {t("map.kbd_clear") ?? "clear"}
          </p>
        </div>
      </div>



      <div className="relative rounded-lg border border-border bg-background/40 overflow-hidden min-h-[280px]">
        {mapError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 p-6 text-center bg-background/80">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-display text-sm">{t("map.error_title") ?? "Couldn’t load the world map"}</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-1">
                {t("map.error_hint") ?? "Network or CDN issue. Use the country list below."}
              </p>
            </div>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="px-3 h-7 rounded-md border border-border bg-background hover:bg-accent text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t("map.retry") ?? "Retry"}
            </button>
          </div>
        )}
        {mapLoading && !mapError && (
          <div className="absolute inset-0 z-10 flex flex-col gap-2 p-4 bg-background/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> {t("map.loading")}
            </div>
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="flex-1 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        )}
        {!mapError && (
          <ComposableMap
            projection="geoEqualEarth"
            projectionConfig={{ scale: 155 }}
            style={{ width: "100%", height: "auto" }}
          >
            <ZoomableGroup center={[20, 10]} zoom={1} maxZoom={8} onMoveEnd={(p) => setZoom(p.zoom)}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) => {
                  if (geographies.length && mapLoading) {
                    queueMicrotask(() => setMapLoading(false));
                  }
                  const labels: { code: string; name: string; coords: [number, number]; deep: boolean }[] = [];
                  const shapes = geographies.map((geo) => {
                    const isoNum = String(geo.id).padStart(3, "0");
                    const alpha2 = NUM_TO_ISO2[isoNum] ?? NUM_TO_ISO2[String(geo.id)];
                    const known = !!(alpha2 && COUNTRY_BY_CODE[alpha2]);
                    const alpha3 = alpha2 ? ALPHA2_TO_ALPHA3[alpha2] : undefined;
                    const deep = alpha3 ? COUNTRY_DEEP[alpha3] : null;
                    const isSelected = !!alpha2 && alpha2 === selectedCode;
                    const isHover = !!alpha2 && alpha2 === hovered;
                    const baseFill = deep
                      ? scoreColor(deep.bspot_score)
                      : known
                      ? KNOWN_FILL
                      : UNKNOWN_FILL;
                    const fill = isSelected
                      ? "oklch(0.92 0.19 95)"
                      : isHover && known
                      ? "oklch(0.85 0.18 95)"
                      : baseFill;
                    if (known && alpha2) {
                      try {
                        const c = geoCentroid(geo) as [number, number];
                        if (Number.isFinite(c[0]) && Number.isFinite(c[1])) {
                          labels.push({
                            code: alpha2,
                            name: COUNTRY_BY_CODE[alpha2].name,
                            coords: c,
                            deep: !!deep,
                          });
                        }
                      } catch { /* ignore */ }
                    }
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => alpha2 && setHovered(alpha2)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => {
                          if (known && alpha2) onSelect(alpha2);
                        }}
                        style={{
                          default: {
                            fill,
                            stroke: "oklch(0.12 0.005 95)",
                            strokeWidth: 0.5,
                            outline: "none",
                            cursor: known ? "pointer" : "default",
                          },
                          hover: {
                            fill,
                            stroke: "oklch(0.12 0.005 95)",
                            strokeWidth: 0.5,
                            outline: "none",
                            cursor: known ? "pointer" : "default",
                          },
                          pressed: { fill, outline: "none" },
                        }}
                      />
                    );
                  });
                  // Show labels: deep-profile countries always; others only when zoomed in
                  const visibleLabels = labels.filter((l) => l.deep || zoom >= 2);
                  return (
                    <>
                      {shapes}
                      {visibleLabels.map((l) => (
                        <Marker key={`label-${l.code}`} coordinates={l.coords}>
                          <text
                            textAnchor="middle"
                            style={{
                              fontFamily: "ui-sans-serif, system-ui, sans-serif",
                              fontSize: zoom >= 3 ? 7 : zoom >= 2 ? 8 : 9,
                              fontWeight: 600,
                              fill: "oklch(0.12 0.005 95)",
                              paintOrder: "stroke",
                              stroke: "oklch(1 0 0 / 0.85)",
                              strokeWidth: 2,
                              strokeLinejoin: "round",
                              pointerEvents: "none",
                              userSelect: "none",
                            }}
                          >
                            {l.name}
                          </text>
                        </Marker>
                      ))}
                    </>
                  );
                }}
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        )}
      </div>

      {/* Fallback list — visible when the map fails so users can still navigate */}
      {mapError && (
        <div className="mt-3 panel p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            // {t("map.fallback_list") ?? "Country list"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-64 overflow-auto">
            {catalogue.map((u) => (
              <button
                key={u.code}
                onClick={() => onSelect(u.code)}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-border bg-background/40 hover:bg-accent text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="flex items-center gap-1.5 text-xs">
                  <span>{u.flag}</span>
                  <span className="truncate">{u.name}</span>
                </span>
                {u.hasDeep && <span className="font-mono text-[10px] text-neon">{u.score}</span>}
              </button>
            ))}
          </div>
        </div>
      )}


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
            <span className="h-2.5 w-4 rounded-sm" style={{ background: KNOWN_FILL }} />
            {t("map.tier_basic")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ background: UNKNOWN_FILL }} />
            {t("map.locked")}
          </span>
        </div>
      </div>

      {hovered && COUNTRY_BY_CODE[hovered] && (
        <div className="absolute top-2 right-2 panel-neon px-3 py-2 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-xl">{COUNTRY_BY_CODE[hovered].flag}</span>
            <div>
              <div className="font-display text-sm leading-none">
                {COUNTRY_BY_CODE[hovered].name}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                {ALPHA2_TO_ALPHA3[hovered] && COUNTRY_DEEP[ALPHA2_TO_ALPHA3[hovered]] ? (
                  <>
                    {t("map.score")}:{" "}
                    <span className="text-neon">
                      {COUNTRY_DEEP[ALPHA2_TO_ALPHA3[hovered]].bspot_score}
                    </span>
                  </>
                ) : (
                  <span>{t("map.basic_profile")}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
