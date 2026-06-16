import { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useTranslation } from "react-i18next";
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

export function WorldInvestmentMap({ selectedCode, onSelect }: WorldInvestmentMapProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-2 pb-2">
        <div>
          <p className="font-display text-lg text-neon">🌍 {t("map.title")}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("map.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-primary" /> {t("map.unlocked")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-[oklch(0.20_0.01_95)]" /> {t("map.locked")}
          </span>
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
                  const isUnlocked = !!alpha3 && !!COUNTRY_DEEP[alpha3];
                  const isSelected = !!alpha3 && alpha3 === selectedCode;
                  const isHover = !!alpha3 && alpha3 === hovered;
                  const fill = isSelected
                    ? "oklch(0.92 0.19 95)"
                    : isHover && isUnlocked
                    ? "oklch(0.78 0.19 95)"
                    : isUnlocked
                    ? "oklch(0.55 0.14 95)"
                    : "oklch(0.20 0.01 95)";
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

      {hovered && COUNTRY_DEEP[hovered] && COUNTRY_BY_CODE[hovered] && (
        <div className="absolute top-2 right-2 panel-neon px-3 py-2 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-xl">{COUNTRY_BY_CODE[hovered].flag}</span>
            <div>
              <div className="font-display text-sm leading-none">{COUNTRY_BY_CODE[hovered].name}</div>
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
