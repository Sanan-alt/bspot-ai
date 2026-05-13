import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { NUM_TO_ISO2 } from "@/lib/countries-data";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type Props = {
  onSelect: (code: string) => void;
  highlight?: string | null;
};

export function WorldMap({ onSelect, highlight }: Props) {
  return (
    <div className="w-full overflow-hidden rounded-md bg-[oklch(0.08_0.005_95)]">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 155 }}
        width={900}
        height={420}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
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
                          ? "oklch(0.30 0.08 95)"
                          : "oklch(0.18 0.01 95)",
                      stroke: "oklch(0.10 0.005 95)",
                      strokeWidth: 0.5,
                      outline: "none",
                      cursor: investable ? "pointer" : "default",
                    },
                    hover: {
                      fill: investable ? "oklch(0.88 0.19 95)" : "oklch(0.18 0.01 95)",
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
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
