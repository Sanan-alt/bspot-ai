import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/app/converter")({ component: () => <ComingSoon kicker="CURRENCY CONVERTER" title="Currency Converter" eta="Phase 2" /> });
