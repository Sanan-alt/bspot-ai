import { Bot } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ChatbotFab() {
  return (
    <Link
      to="/app/assistant"
      aria-label="Open AI Assistant"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center glow pulse-neon hover:scale-110 transition-transform"
    >
      <Bot className="h-6 w-6" />
    </Link>
  );
}
