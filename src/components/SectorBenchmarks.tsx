import { BarChart3 } from "lucide-react";
import { getSectorBenchmarks, getRegion } from "@/lib/sector-benchmarks";

export function SectorBenchmarks({ code }: { code: string }) {
  const rows = getSectorBenchmarks(code);
  const region = getRegion(code);
  if (!rows) return null;

  const max = Math.max(...rows.flatMap((r) => [r.country, r.region, r.global])) * 1.1;

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3 text-neon" /> Sector vs {region} & Global (% annual)
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.sector}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-display">{r.sector}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                <span className="text-neon">{r.country}%</span> · reg {r.region}% · glb {r.global}%
              </span>
            </div>
            <div className="relative h-4 rounded bg-muted/30 overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-primary/70 rounded" style={{ width: `${(r.country / max) * 100}%` }} />
              <div className="absolute inset-y-0 border-l-2 border-emerald-400/80" style={{ left: `${(r.region / max) * 100}%` }} title={`Region ${r.region}%`} />
              <div className="absolute inset-y-0 border-l-2 border-blue-400/70 border-dashed" style={{ left: `${(r.global / max) * 100}%` }} title={`Global ${r.global}%`} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-[10px] font-mono text-muted-foreground">
        <span><span className="inline-block w-3 h-2 bg-primary/70 align-middle mr-1" />Country</span>
        <span><span className="inline-block w-0 h-3 border-l-2 border-emerald-400 align-middle mr-1" />Region</span>
        <span><span className="inline-block w-0 h-3 border-l-2 border-blue-400 border-dashed align-middle mr-1" />Global</span>
      </div>
    </div>
  );
}
