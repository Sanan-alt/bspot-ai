import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { NUM_TO_ISO2 } from "@/lib/countries-data";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type Props = {
  onSelect: (code: string) => void;
  highlight?: string | null;
};

export function WorldMap({ onSelect, highlight }: Props) {
  return (
    <div className="w-full overflow-hidden rounded-md bg-[var(--map-bg)]">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 155 }}
        width={900}
        height={420}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) => (
            <>
              {geographies.map((geo) => {
                const num = String(geo.id).padStart(3, "0");
                const iso2 = NUM_TO_ISO2[num];
                const investable = !!iso2;
                const isActive = iso2 === highlight;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => investable && onSelect(iso2)}
                    style={{
                      default: {
                        fill: isActive
                          ? "oklch(0.88 0.19 95)"
                          : investable
                            ? "var(--map-fill)"
                            : "var(--map-fill-muted)",
                        stroke: "var(--map-stroke)",
                        strokeWidth: 0.5,
                        outline: "none",
                        cursor: investable ? "pointer" : "default",
                      },
                      hover: {
                        fill: investable ? "oklch(0.88 0.19 95)" : "var(--map-fill-muted)",
                        outline: "none",
                        filter: investable
                          ? "drop-shadow(0 0 6px oklch(0.88 0.19 95 / 60%))"
                          : "none",
                      },
                      pressed: {
                        fill: "oklch(0.78 0.18 80)",
                        outline: "none",
                      },
                    }}
                  />
                );
              })}
              {geographies.map((geo) => {
                const num = String(geo.id).padStart(3, "0");
                const iso2 = NUM_TO_ISO2[num];
                if (!iso2) return null;
                const centroid = geoCentroid(geo);
                if (!Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) return null;
                const name = geo.properties?.name as string | undefined;
                if (!name) return null;
                return (
                  <Marker key={`${geo.rsmKey}-label`} coordinates={centroid}>
                    <text
                      textAnchor="middle"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 6,
                        fontWeight: 600,
                        fill: "var(--map-label)",
                        paintOrder: "stroke",
                        stroke: "var(--map-label-stroke)",
                        strokeWidth: 1.5,
                        strokeLinejoin: "round",
                        pointerEvents: "none",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      {name}
                    </text>
                  </Marker>
                );
              })}
            </>
          )}
        </Geographies>
      </ComposableMap>
    </div>
  );
}
