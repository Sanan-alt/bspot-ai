import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/app/portfolio")({ component: () => <ComingSoon kicker="PORTFOLIO TRACKER" title="Portfolio Tracker" eta="Phase 3" /> });
