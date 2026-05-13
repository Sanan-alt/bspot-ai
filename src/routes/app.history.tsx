import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/app/history")({ component: () => <ComingSoon kicker="CONVERSION HISTORY" title="Conversion History" eta="Phase 2" /> });
