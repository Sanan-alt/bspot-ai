import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/app/suggestions")({ component: () => <ComingSoon kicker="BUSINESS SUGGESTIONS" title="AI Business Suggestions" eta="Phase 2" /> });
