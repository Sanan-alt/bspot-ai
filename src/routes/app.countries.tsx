import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/app/countries")({ component: () => <ComingSoon kicker="COUNTRY DATA" title="Interactive Country Map" eta="Phase 2" /> });
