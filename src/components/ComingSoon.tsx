import { Construction } from "lucide-react";

export function ComingSoon({ title, kicker, eta }: { title: string; kicker: string; eta: string }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// {kicker}</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">{title}</h1>
      </div>
      <div className="panel-neon p-10 text-center scanline">
        <Construction className="h-10 w-10 text-neon mx-auto" />
        <p className="mt-4 font-display text-xl">Module under construction</p>
        <p className="mt-2 text-sm text-muted-foreground">Shipping in {eta}.</p>
      </div>
    </div>
  );
}
