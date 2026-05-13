import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/app/assistant")({ component: () => <ComingSoon kicker="AI ASSISTANT" title="AI Assistant" eta="Phase 4" /> });
