import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/app/notifications")({ component: () => <ComingSoon kicker="NOTIFICATIONS" title="Notification Center" eta="Phase 3" /> });
